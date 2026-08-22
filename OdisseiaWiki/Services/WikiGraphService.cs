using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Repositories;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Services;

public sealed class WikiGraphService : IWikiGraphService
{
    private readonly IWikiGraphRepository _repository;

    public WikiGraphService(IWikiGraphRepository repository)
    {
        _repository = repository;
    }

    public async Task<WikiGraphDto> GetAsync(
        bool includeHiddenMetadata,
        CancellationToken cancellationToken = default)
    {
        WikiGraphSnapshot snapshot = await _repository.GetSnapshotAsync(cancellationToken);
        Dictionary<NodeKey, GraphEntity> entities = BuildEntities(snapshot, includeHiddenMetadata);
        HashSet<GraphLink> links = BuildLinks(snapshot, entities, includeHiddenMetadata);
        (entities, links) = ConsolidateDuplicateEntities(entities, links);
        RemoveOrphanCharacters(entities, links);
        NodeKey? centralKey = FindCentralNode(entities, links);

        Dictionary<NodeKey, string> graphIds = entities.Keys.ToDictionary(
            key => key,
            _ => Guid.NewGuid().ToString("N"));

        List<WikiGraphNodeDto> nodes = entities
            .Select(pair => MapNode(
                pair.Key,
                pair.Value,
                graphIds[pair.Key],
                includeHiddenMetadata))
            .ToList();
        Shuffle(nodes);

        List<WikiGraphEdgeDto> edges = links
            .Select(link => new WikiGraphEdgeDto
            {
                Id = Guid.NewGuid().ToString("N"),
                Source = graphIds[link.Source],
                Target = graphIds[link.Target]
            })
            .ToList();
        Shuffle(edges);

        return new WikiGraphDto
        {
            Nodes = nodes,
            Edges = edges,
            CentralNodeId = centralKey.HasValue ? graphIds[centralKey.Value] : null,
            Stats = new WikiGraphStatsDto
            {
                TotalNodes = nodes.Count,
                TotalEdges = edges.Count
            }
        };
    }

    private static Dictionary<NodeKey, GraphEntity> BuildEntities(
        WikiGraphSnapshot snapshot,
        bool includeHiddenMetadata)
    {
        Dictionary<NodeKey, GraphEntity> entities = new();

        foreach (WikiGraphCityRecord city in snapshot.Cities)
        {
            entities[new NodeKey(GraphEntityType.City, city.Id)] = new GraphEntity(
                city.Name,
                city.Image,
                city.Visible,
                $"/cidade/{city.Id}",
                NormalizeIdentity(city.Name));
        }

        foreach (WikiGraphPageRecord page in snapshot.Pages)
        {
            entities[new NodeKey(GraphEntityType.Page, page.Id)] = new GraphEntity(
                page.Title,
                page.Image,
                page.Visible,
                !string.IsNullOrWhiteSpace(page.Slug)
                    ? $"/wiki/{Uri.EscapeDataString(page.Slug)}"
                    : null,
                NormalizeIdentity(page.Slug));
        }

        foreach (WikiGraphCharacterRecord character in snapshot.Characters)
        {
            bool exibirNome = includeHiddenMetadata || character.NomeVisivel;
            bool exibirImagem = includeHiddenMetadata || character.ImagemVisivel;
            entities[new NodeKey(GraphEntityType.Character, character.Id)] = new GraphEntity(
                exibirNome ? character.Name : null,
                exibirImagem ? character.Image : null,
                character.Visible,
                $"/personagem/{character.Id}",
                NormalizeIdentity(exibirNome ? character.Name : null));
        }

        foreach (WikiGraphRaceRecord race in snapshot.Races)
        {
            entities[new NodeKey(GraphEntityType.Race, race.Id)] = new GraphEntity(
                race.Name,
                race.Image,
                race.Visible,
                $"/raca/{race.Id}",
                NormalizeIdentity(race.Name));
        }

        return entities;
    }

    private static HashSet<GraphLink> BuildLinks(
        WikiGraphSnapshot snapshot,
        IReadOnlyDictionary<NodeKey, GraphEntity> entities,
        bool includeHiddenMetadata)
    {
        HashSet<GraphLink> links = new();

        foreach (WikiGraphCharacterRecord character in snapshot.Characters)
        {
            NodeKey characterKey = new(GraphEntityType.Character, character.Id);
            if (includeHiddenMetadata || character.RacaVisivel)
                AddLink(links, entities, characterKey, new NodeKey(GraphEntityType.Race, character.RaceId));

            if ((includeHiddenMetadata || character.CidadeVisivel) && character.CityId.HasValue)
            {
                AddLink(
                    links,
                    entities,
                    characterKey,
                    new NodeKey(GraphEntityType.City, character.CityId.Value));
            }

            if (!includeHiddenMetadata && !character.PersonagensRelacionadosVisivel)
                continue;

            foreach (int linkedCharacterId in ParseLinkedCharacterIds(character.LinkedCharactersJson))
            {
                AddLink(
                    links,
                    entities,
                    characterKey,
                    new NodeKey(GraphEntityType.Character, linkedCharacterId));
            }
        }

        foreach (WikiGraphPageRelationRecord relationBlock in snapshot.PageRelations)
        {
            NodeKey pageKey = new(GraphEntityType.Page, relationBlock.PageId);

            foreach (NodeKey target in ParsePageReferences(relationBlock.Content))
            {
                if (!includeHiddenMetadata &&
                    target.Type == GraphEntityType.Character &&
                    !CanExposeCharacterRelations(snapshot.Characters, target.Id))
                {
                    continue;
                }

                AddLink(links, entities, pageKey, target);
            }
        }

        return links;
    }

    private static bool CanExposeCharacterRelations(
        IReadOnlyList<WikiGraphCharacterRecord> characters,
        int id)
    {
        WikiGraphCharacterRecord? character = characters.FirstOrDefault(item => item.Id == id);
        return character?.PersonagensRelacionadosVisivel ?? true;
    }

    private static (Dictionary<NodeKey, GraphEntity> Entities, HashSet<GraphLink> Links)
        ConsolidateDuplicateEntities(
            Dictionary<NodeKey, GraphEntity> entities,
            HashSet<GraphLink> links)
    {
        Dictionary<NodeKey, int> degree = CalculateDegree(entities.Keys, links);
        Dictionary<NodeKey, NodeKey> canonicalByKey = entities.Keys.ToDictionary(key => key, key => key);

        IEnumerable<IGrouping<EntityIdentity, KeyValuePair<NodeKey, GraphEntity>>> duplicateCandidates =
            entities
                .Where(pair => pair.Value.Identity is not null)
                .GroupBy(pair => new EntityIdentity(pair.Key.Type, pair.Value.Identity!));

        foreach (IGrouping<EntityIdentity, KeyValuePair<NodeKey, GraphEntity>> group in duplicateCandidates)
        {
            NodeKey canonicalKey = group
                .OrderByDescending(pair => pair.Value.Visible)
                .ThenByDescending(pair => degree[pair.Key])
                .ThenBy(pair => pair.Key.Id)
                .Select(pair => pair.Key)
                .First();

            foreach (KeyValuePair<NodeKey, GraphEntity> duplicate in group)
                canonicalByKey[duplicate.Key] = canonicalKey;
        }

        Dictionary<NodeKey, GraphEntity> consolidatedEntities = canonicalByKey.Values
            .Distinct()
            .ToDictionary(key => key, key => entities[key]);
        HashSet<GraphLink> consolidatedLinks = new();

        foreach (GraphLink link in links)
        {
            AddLink(
                consolidatedLinks,
                consolidatedEntities,
                canonicalByKey[link.Source],
                canonicalByKey[link.Target]);
        }

        return (consolidatedEntities, consolidatedLinks);
    }

    private static void RemoveOrphanCharacters(
        IDictionary<NodeKey, GraphEntity> entities,
        IReadOnlyCollection<GraphLink> links)
    {
        HashSet<NodeKey> connectedNodes = links
            .SelectMany(link => new[] { link.Source, link.Target })
            .ToHashSet();

        NodeKey[] orphanCharacters = entities.Keys
            .Where(key => key.Type == GraphEntityType.Character && !connectedNodes.Contains(key))
            .ToArray();

        foreach (NodeKey orphanCharacter in orphanCharacters)
            entities.Remove(orphanCharacter);
    }

    private static Dictionary<NodeKey, int> CalculateDegree(
        IEnumerable<NodeKey> nodes,
        IEnumerable<GraphLink> links)
    {
        Dictionary<NodeKey, int> degree = nodes.ToDictionary(key => key, _ => 0);

        foreach (GraphLink link in links)
        {
            degree[link.Source]++;
            degree[link.Target]++;
        }

        return degree;
    }

    private static NodeKey? FindCentralNode(
        IReadOnlyDictionary<NodeKey, GraphEntity> entities,
        IEnumerable<GraphLink> links)
    {
        Dictionary<NodeKey, int> degree = CalculateDegree(entities.Keys, links);

        return entities
            .Where(pair => pair.Value.Visible
                && pair.Key.Type is GraphEntityType.City or GraphEntityType.Page)
            .OrderByDescending(pair => degree[pair.Key])
            .ThenBy(pair => pair.Key.Type == GraphEntityType.City ? 0 : 1)
            .ThenBy(pair => pair.Key.Id)
            .Select(pair => (NodeKey?)pair.Key)
            .FirstOrDefault();
    }

    private static WikiGraphNodeDto MapNode(
        NodeKey key,
        GraphEntity entity,
        string graphId,
        bool includeHiddenMetadata)
    {
        if (!entity.Visible && !includeHiddenMetadata)
        {
            return new WikiGraphNodeDto
            {
                GraphId = graphId,
                Hidden = true
            };
        }

        return new WikiGraphNodeDto
        {
            GraphId = graphId,
            Hidden = !entity.Visible,
            EntityType = key.Type switch
            {
                GraphEntityType.City => "city",
                GraphEntityType.Page => "page",
                GraphEntityType.Character => "character",
                GraphEntityType.Race => "race",
                _ => throw new ArgumentOutOfRangeException(nameof(key))
            },
            Title = entity.Title ?? "Conteúdo sem título",
            Image = string.IsNullOrWhiteSpace(entity.Image) ? null : entity.Image,
            Route = entity.Route ?? "/wiki"
        };
    }

    private static void AddLink(
        ISet<GraphLink> links,
        IReadOnlyDictionary<NodeKey, GraphEntity> entities,
        NodeKey first,
        NodeKey second)
    {
        if (first == second || !entities.ContainsKey(first) || !entities.ContainsKey(second))
            return;

        links.Add(NodeKey.Compare(first, second) <= 0
            ? new GraphLink(first, second)
            : new GraphLink(second, first));
    }

    private static IReadOnlyList<int> ParseLinkedCharacterIds(string? json)
    {
        List<int> ids = new();

        if (string.IsNullOrWhiteSpace(json))
            return ids;

        try
        {
            using JsonDocument document = JsonDocument.Parse(json);

            if (document.RootElement.ValueKind != JsonValueKind.Array)
                return ids;

            foreach (JsonElement entry in document.RootElement.EnumerateArray())
            {
                if (entry.ValueKind == JsonValueKind.Number
                    && entry.TryGetInt32(out int numericId)
                    && numericId > 0)
                {
                    ids.Add(numericId);
                }
                else if (entry.ValueKind == JsonValueKind.String
                    && int.TryParse(entry.GetString(), out int stringId)
                    && stringId > 0)
                {
                    ids.Add(stringId);
                }
            }
        }
        catch (JsonException)
        {
            return ids;
        }

        return ids;
    }

    private static IReadOnlyList<NodeKey> ParsePageReferences(string json)
    {
        List<NodeKey> referencesFound = new();

        try
        {
            using JsonDocument document = JsonDocument.Parse(json);
            IEnumerable<JsonElement> references = document.RootElement.ValueKind == JsonValueKind.Array
                ? document.RootElement.EnumerateArray().ToArray()
                : new[] { document.RootElement };

            foreach (JsonElement reference in references)
            {
                if (reference.ValueKind != JsonValueKind.Object
                    || !TryGetProperty(reference, "tipoEntidade", out JsonElement typeElement)
                    || !TryGetProperty(reference, "idEntidade", out JsonElement idElement)
                    || typeElement.ValueKind != JsonValueKind.String
                    || !TryReadId(idElement, out int id)
                    || id <= 0
                    || !TryMapEntityType(typeElement.GetString(), out GraphEntityType type))
                    continue;

                referencesFound.Add(new NodeKey(type, id));
            }
        }
        catch (JsonException)
        {
            return referencesFound;
        }

        return referencesFound;
    }

    private static bool TryMapEntityType(string? value, out GraphEntityType type)
    {
        string normalized = value?.Trim().ToLowerInvariant() ?? string.Empty;
        type = normalized switch
        {
            "cidade" or "city" => GraphEntityType.City,
            "pagina" or "página" or "page" => GraphEntityType.Page,
            "personagem" or "character" => GraphEntityType.Character,
            "raca" or "raça" or "race" => GraphEntityType.Race,
            _ => default
        };

        return normalized is "cidade" or "city"
            or "pagina" or "página" or "page"
            or "personagem" or "character"
            or "raca" or "raça" or "race";
    }

    private static bool TryReadId(JsonElement value, out int id)
    {
        if (value.ValueKind == JsonValueKind.Number)
            return value.TryGetInt32(out id);

        if (value.ValueKind == JsonValueKind.String)
            return int.TryParse(value.GetString(), out id);

        id = 0;
        return false;
    }

    private static bool TryGetProperty(JsonElement element, string name, out JsonElement value)
    {
        foreach (JsonProperty property in element.EnumerateObject())
        {
            if (string.Equals(property.Name, name, StringComparison.OrdinalIgnoreCase))
            {
                value = property.Value;
                return true;
            }
        }

        value = default;
        return false;
    }

    private static string? NormalizeIdentity(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        string decomposed = value.Trim().Normalize(NormalizationForm.FormD);
        StringBuilder normalized = new(decomposed.Length);
        bool pendingSpace = false;

        foreach (char character in decomposed)
        {
            UnicodeCategory category = CharUnicodeInfo.GetUnicodeCategory(character);
            if (category is UnicodeCategory.NonSpacingMark
                or UnicodeCategory.SpacingCombiningMark
                or UnicodeCategory.EnclosingMark)
            {
                continue;
            }

            if (char.IsWhiteSpace(character))
            {
                pendingSpace = normalized.Length > 0;
                continue;
            }

            if (pendingSpace)
            {
                normalized.Append(' ');
                pendingSpace = false;
            }

            normalized.Append(char.ToUpperInvariant(character));
        }

        return normalized.Length == 0
            ? null
            : normalized.ToString().Normalize(NormalizationForm.FormC);
    }

    private static void Shuffle<T>(IList<T> items)
    {
        for (int index = items.Count - 1; index > 0; index--)
        {
            int otherIndex = RandomNumberGenerator.GetInt32(index + 1);
            (items[index], items[otherIndex]) = (items[otherIndex], items[index]);
        }
    }

    private enum GraphEntityType
    {
        City,
        Page,
        Character,
        Race
    }

    private readonly record struct NodeKey(GraphEntityType Type, int Id)
    {
        public static int Compare(NodeKey left, NodeKey right)
        {
            int typeComparison = left.Type.CompareTo(right.Type);
            return typeComparison != 0 ? typeComparison : left.Id.CompareTo(right.Id);
        }
    }

    private sealed record GraphEntity(
        string? Title,
        string? Image,
        bool Visible,
        string? Route,
        string? Identity);

    private readonly record struct EntityIdentity(GraphEntityType Type, string Value);

    private readonly record struct GraphLink(NodeKey Source, NodeKey Target);
}
