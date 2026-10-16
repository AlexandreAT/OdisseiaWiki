using System.Buffers.Binary;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using OdisseiaWiki.Dtos;

namespace OdisseiaWiki.GameRuns.Map;

/// <summary>
/// Generates downward-only areas from a pinned mode configuration.
/// It never interprets character rules or makes a combat decision.
/// </summary>
public sealed class GameRunMapGenerator
{
    public const string BaseNodeId = "base-1";
    public const int MaxNormalAreas = 5;
    public const int MinNodesPerArea = 3;
    public const int MaxNodesPerArea = 24;

    private static int[] AreaWidths(int nodeCount)
    {
        if (nodeCount is < MinNodesPerArea or > MaxNodesPerArea)
            throw new InvalidOperationException($"A área precisa ter de {MinNodesPerArea} a {MaxNodesPerArea} nós jogáveis.");
        List<int> widths = [];
        int remaining = nodeCount - 1;
        int nextWidth = 2;
        while (remaining > 0)
        {
            int width = Math.Min(nextWidth, remaining);
            widths.Add(width);
            remaining -= width;
            nextWidth = nextWidth == 2 ? 3 : 2;
        }
        widths.Add(1);
        return widths.ToArray();
    }

    public GameRunMapDto Create(long runSeed, string modeConfiguration)
    {
        using JsonDocument document = JsonDocument.Parse(modeConfiguration);
        JsonElement root = document.RootElement;
        if (!root.TryGetProperty("map", out JsonElement mapConfig))
            return GameRunFirstMap.Create();
        if (mapConfig.TryGetProperty("schemaVersion", out JsonElement configuredSchema) &&
            configuredSchema.ValueKind == JsonValueKind.Number &&
            configuredSchema.TryGetInt32(out int currentSchema))
        {
            if (currentSchema == 5) return CreateExpandedAreas(runSeed, root);
            if (currentSchema == 4) return CreateFromAreas(runSeed, root);
        }
        if (mapConfig.ValueKind != JsonValueKind.Object ||
            !mapConfig.TryGetProperty("schemaVersion", out JsonElement schema) ||
            schema.ValueKind != JsonValueKind.Number ||
            !schema.TryGetInt32(out int schemaVersion) ||
            schemaVersion is not (2 or 3) ||
            !mapConfig.TryGetProperty("branchEncounterCodes", out JsonElement codes) ||
            codes.ValueKind != JsonValueKind.Array || codes.GetArrayLength() != 2 ||
            !root.TryGetProperty("encounters", out JsonElement encounters) ||
            encounters.ValueKind != JsonValueKind.Object)
            throw new InvalidOperationException("A versão do modo não possui um mapa executável válido.");

        if (schemaVersion == 3 && (!root.TryGetProperty("base", out JsonElement baseConfig) ||
            baseConfig.ValueKind != JsonValueKind.Object ||
            !baseConfig.TryGetProperty("restType", out JsonElement restType) ||
            restType.ValueKind != JsonValueKind.String ||
            string.IsNullOrWhiteSpace(restType.GetString())))
            throw new InvalidOperationException("A Base não possui descanso configurado no modo.");

        string[] encounterCodes = codes.EnumerateArray().Select(item => item.GetString() ?? "").ToArray();
        if (encounterCodes.Any(string.IsNullOrWhiteSpace) ||
            encounterCodes.Distinct(StringComparer.Ordinal).Count() != 2 ||
            encounterCodes.Any(code => !encounters.TryGetProperty(code, out _)))
            throw new InvalidOperationException("As rotas do mapa não têm encontros configurados.");

        // Seed changes which encounter appears on each side, not the top-down topology.
        if ((DeriveSeed(runSeed, "branch-order") & 1) != 0)
            Array.Reverse(encounterCodes);
        GameRunMapDto map = new()
        {
            SchemaVersion = schemaVersion,
            Nodes =
            [
                new() { Id = "inicio", Name = "Início", Fase = 1, Layer = 0, Position = 0,
                    Seed = DeriveSeed(runSeed, "inicio"), Type = "INICIO", State = "CONCLUIDO",
                    Connections = [GameRunFirstMap.EncounterId], Revealed = true },
                new() { Id = GameRunFirstMap.EncounterId, Name = "Sentinela de treino", Fase = 1,
                    Layer = 1, Position = 0, Seed = DeriveSeed(runSeed, GameRunFirstMap.EncounterId),
                    Type = "COMBATE", State = "DISPONIVEL",
                    Connections = ["rota-esquerda", "rota-direita"], Revealed = true },
                Branch("rota-esquerda", -1, encounterCodes[0]),
                Branch("rota-direita", 1, encounterCodes[1]),
                ..(schemaVersion == 3 ? new[]
                {
                    new GameRunMapNodeDto
                    {
                        Id = BaseNodeId, Name = "Base", Fase = 1, Layer = 3, Position = 0,
                        Seed = DeriveSeed(runSeed, BaseNodeId), Type = "BASE", State = "BLOQUEADO",
                        Connections = [], Revealed = true,
                    },
                } : Array.Empty<GameRunMapNodeDto>()),
            ],
        };
        Validate(map);
        return map;

        GameRunMapNodeDto Branch(string id, int position, string code)
        {
            JsonElement config = encounters.GetProperty(code);
            string name = config.TryGetProperty("mapName", out JsonElement title)
                ? title.GetString() ?? "" : "";
            if (string.IsNullOrWhiteSpace(name))
                throw new InvalidOperationException($"O encontro {code} não possui nome para o mapa.");
            return new GameRunMapNodeDto
            {
                Id = id, Name = name, Fase = 1, Layer = 2, Position = position,
                Seed = DeriveSeed(runSeed, id), Type = "COMBATE", State = "BLOQUEADO",
                Connections = schemaVersion == 3 ? [BaseNodeId] : [],
                Payload = new GameRunMapNodePayloadDto { EncounterCode = code },
                Revealed = true,
            };
        }
    }

    private GameRunMapDto CreateFromAreas(long runSeed, JsonElement config)
    {
        if (!config.TryGetProperty("areas", out JsonElement areasElement) ||
            areasElement.ValueKind != JsonValueKind.Array || areasElement.GetArrayLength() is < 1 or > MaxNormalAreas ||
            !config.TryGetProperty("encounters", out JsonElement encounters) ||
            encounters.ValueKind != JsonValueKind.Object)
            throw new InvalidOperationException("As áreas do modo não estão configuradas.");

        GameModeAreaDto[] areas = areasElement.Deserialize<GameModeAreaDto[]>(
            new JsonSerializerOptions(JsonSerializerDefaults.Web)) ?? [];
        var nodes = new List<GameRunMapNodeDto>();
        var layouts = areas.Select((area, stage) =>
            ChooseAreaLayout(runSeed, area, stage == areas.Length - 1)).ToArray();
        var routeIds = layouts.Select((layout, stage) => layout.Routes
            .Select((_, index) => $"fase-{stage + 1}-rota-{index + 1}").ToArray()).ToArray();
        nodes.Add(new GameRunMapNodeDto
        {
            Id = "inicio", Name = "Início", Fase = 1, Layer = 0, Position = 0,
            Seed = DeriveSeed(runSeed, "inicio"), Type = "INICIO", State = "CONCLUIDO",
            Connections = routeIds[0], Revealed = true,
        });

        for (int stage = 0; stage < areas.Length; stage++)
        {
            GameModeAreaDto area = areas[stage];
            GameModeAreaOptionDto[] options = layouts[stage].Routes;
            GameModeAreaOptionDto? finale = layouts[stage].Finale;
            string finalId = finale?.Type == "BASE"
                ? $"fase-{stage + 1}-base" : $"fase-{stage + 1}-final";
            for (int index = 0; index < options.Length; index++)
            {
                GameModeAreaOptionDto option = options[index];
                string id = routeIds[stage][index];
                nodes.Add(BuildNode(id, option, stage * 2 + 1,
                    index * 2 - options.Length + 1, finale is null ? [] : [finalId],
                    stage == 0 ? "DISPONIVEL" : "BLOQUEADO"));
            }
            if (finale is null) continue;
            nodes.Add(BuildNode(finalId, finale!, stage * 2 + 2, 0,
                stage + 1 < areas.Length ? routeIds[stage + 1] : [], "BLOQUEADO"));

            GameRunMapNodeDto BuildNode(string id, GameModeAreaOptionDto option,
                int layer, int position, IReadOnlyList<string> connections, string state)
            {
                bool isBase = option.Type == "BASE";
                bool nonCombat = isBase || option.Type is "EVENTO" or "DESCANSO";
                if (!nonCombat && (option.EncounterCode is null ||
                    !encounters.TryGetProperty(option.EncounterCode, out JsonElement encounter) ||
                    !encounter.TryGetProperty("mapName", out _)) ||
                    option.Type is not ("BASE" or "COMBATE" or "ELITE" or "BOSS" or "EVENTO" or "DESCANSO"))
                    throw new InvalidOperationException("Uma rota da área não tem configuração executável.");
                JsonElement encounterConfig = nonCombat ? default : encounters.GetProperty(option.EncounterCode!);
                string name = isBase ? area.BaseName : nonCombat ? option.Label ?? "" :
                    encounterConfig.GetProperty("mapName").GetString() ?? "";
                if (string.IsNullOrWhiteSpace(name))
                    throw new InvalidOperationException("Uma rota da área está sem nome.");
                string? image = isBase ? area.BaseImage : nonCombat ? option.Image :
                    encounterConfig.TryGetProperty("enemy", out JsonElement enemy) &&
                    enemy.TryGetProperty("image", out JsonElement npcImage) &&
                    npcImage.ValueKind == JsonValueKind.String ? npcImage.GetString() : null;
                return new GameRunMapNodeDto
                {
                    Id = id, Name = name, Image = image, AreaImage = area.Image ?? string.Empty,
                    Description = option.Description, AreaName = area.Name,
                    Fase = stage + 1, Layer = layer, Position = position,
                    Seed = DeriveSeed(runSeed, id), Type = option.Type, State = state,
                    Connections = connections, Revealed = true,
                    Payload = nonCombat ? null : new GameRunMapNodePayloadDto { EncounterCode = option.EncounterCode },
                };
            }
        }
        GameRunMapDto map = new() { SchemaVersion = 4, Nodes = nodes };
        Validate(map);
        return map;
    }

    private static (GameModeAreaOptionDto[] Routes, GameModeAreaOptionDto? Finale) ChooseAreaLayout(
        long runSeed, GameModeAreaDto area, bool finalArea)
    {
        if (area.Options.Count is < 1 or > 20 || area.Options.Any(option => option.Weight is < 1 or > 100))
            throw new InvalidOperationException("O pool da área precisa de uma a vinte opções com peso válido.");
        if (finalArea)
        {
            GameModeAreaOptionDto[] bosses = area.Options.Where(option => option.Type == "BOSS").ToArray();
            if (bosses.Length == 0)
                // Mapas de teste/versões antigas podem não ter Chefe. Novas publicações
                // exigem ao menos um em GameModeManagementService.Validate.
                return (ChooseOptions(runSeed, area.Code, area.Options, 4), null);
            GameModeAreaOptionDto[] preliminaryRoutes = area.Options
                .Where(option => option.Type != "BOSS").ToArray();
            if (preliminaryRoutes.Length == 0)
                return (ChooseOptions(runSeed, area.Code, bosses, 4), null);
            GameModeAreaOptionDto boss = ChooseOptions(runSeed, $"{area.Code}:boss", bosses, 1)[0];
            return (ChooseOptions(runSeed, area.Code, preliminaryRoutes, 4), boss);
        }
        var baseOption = new GameModeAreaOptionDto { Type = "BASE", Label = area.BaseName, Image = area.BaseImage };
        string finalOption = area.FinalOption ?? string.Empty;
        int finalIndex = finalOption switch
        {
            "BASE" => -1,
            "ALEATORIO" => new Random(DeriveSeed(runSeed, $"{area.Code}:final"))
                .Next(area.Options.Count + (area.UseBase ? 1 : 0)) - (area.UseBase ? 1 : 0),
            _ when finalOption.StartsWith("ROTA:", StringComparison.Ordinal) &&
                int.TryParse(finalOption.AsSpan(5), out int index) &&
                index >= 0 && index < area.Options.Count => index,
            _ => throw new InvalidOperationException("O fim da área não está configurado."),
        };
        GameModeAreaOptionDto finale = finalIndex < 0 ? baseOption : area.Options[finalIndex];
        var routePool = area.Options.Where((_, index) => index != finalIndex).ToList();
        if (finalIndex >= 0 && area.UseBase) routePool.Add(baseOption);
        return (ChooseOptions(runSeed, area.Code, routePool, 4), finale);
    }

    public GameRunMapDto CreateSecretArea(long runSeed, string modeConfiguration,
        string secretAreaCode, string portalNodeId)
    {
        using JsonDocument document = JsonDocument.Parse(modeConfiguration);
        return CreateExpandedAreas(runSeed, document.RootElement, secretAreaCode,
            $"secreta-{portalNodeId}-");
    }

    private GameRunMapDto CreateExpandedAreas(long runSeed, JsonElement config,
        string? secretAreaCode = null, string prefix = "")
    {
        if (!config.TryGetProperty("areas", out JsonElement areasElement) ||
            areasElement.ValueKind != JsonValueKind.Array ||
            !config.TryGetProperty("encounters", out JsonElement encounters) ||
            encounters.ValueKind != JsonValueKind.Object)
            throw new InvalidOperationException("As áreas do modo não estão configuradas.");
        GameModeAreaDto[] configuredAreas = areasElement.Deserialize<GameModeAreaDto[]>(
            new JsonSerializerOptions(JsonSerializerDefaults.Web)) ?? [];
        GameModeAreaDto[] areas = secretAreaCode is null
            ? configuredAreas.Where(area => !area.IsSecret).ToArray()
            : configuredAreas.Where(area => area.IsSecret && area.Code == secretAreaCode).ToArray();
        if (areas.Length is < 1 or > MaxNormalAreas)
            throw new InvalidOperationException("A área solicitada não está configurada.");

        int[][] areaWidths = areas.Select(area => AreaWidths(area.NodeCount)).ToArray();
        var nodes = new List<GameRunMapNodeDto>();
        nodes.Add(new GameRunMapNodeDto
        {
            Id = $"{prefix}inicio", Name = "Início", Fase = 1, Layer = 0, Position = 0,
            Seed = DeriveSeed(runSeed, $"{prefix}inicio"), Type = "INICIO", State = "CONCLUIDO",
            Connections = Enumerable.Range(1, areaWidths[0][0])
                .Select(index => $"{prefix}fase-1-linha-1-no-{index}").ToArray(), Revealed = true,
        });

        int layerOffset = 0;
        for (int stage = 0; stage < areas.Length; stage++)
        {
            GameModeAreaDto area = areas[stage];
            int[] widths = areaWidths[stage];
            (GameModeAreaOptionDto[] routes, GameModeAreaOptionDto finale) =
                DrawExpandedArea(runSeed, area);
            int routeIndex = 0;
            for (int row = 0; row < widths.Length; row++)
            {
                int width = widths[row];
                for (int index = 0; index < width; index++)
                {
                    string id = $"{prefix}fase-{stage + 1}-linha-{row + 1}-no-{index + 1}";
                    int position = index * 2 - width + 1;
                    bool last = row == widths.Length - 1;
                    GameModeAreaOptionDto option = last ? finale : routes[routeIndex++];
                    string[] connections = last
                        ? stage == areas.Length - 1 ? [] :
                            Enumerable.Range(1, areaWidths[stage + 1][0])
                                .Select(next => $"{prefix}fase-{stage + 2}-linha-1-no-{next}").ToArray()
                        : Enumerable.Range(0, widths[row + 1])
                            .Where(next => Math.Abs((next * 2 - widths[row + 1] + 1) - position) <= 1 ||
                                widths[row + 1] == 1)
                            .Select(next => $"{prefix}fase-{stage + 1}-linha-{row + 2}-no-{next + 1}").ToArray();
                    string shortcutTarget = $"{prefix}fase-{stage + 1}-linha-{widths.Length}-no-1";
                    if (option.Type == "ATALHO" && !last && !connections.Contains(shortcutTarget))
                        connections = [..connections, shortcutTarget];
                    nodes.Add(BuildExpandedNode(runSeed, encounters, area, option, id,
                        stage + 1, layerOffset + row + 1, position, connections,
                        stage == 0 && row == 0 ? "DISPONIVEL" : "BLOQUEADO"));
                }
            }
            layerOffset += widths.Length;
        }
        GameRunMapDto map = new() { SchemaVersion = 5, Nodes = nodes,
            IsSecretFinal = secretAreaCode is not null && areas[0].IsSecretFinal };
        Validate(map);
        return map;
    }

    private static (GameModeAreaOptionDto[] Routes, GameModeAreaOptionDto Finale) DrawExpandedArea(
        long runSeed, GameModeAreaDto area)
    {
        if (area.Options.Count is < 1 or > 20 || area.Options.Any(option => option.Weight is < 1 or > 100))
            throw new InvalidOperationException($"O pool de {area.Name} precisa de opções com peso válido.");
        var baseOption = new GameModeAreaOptionDto
        {
            Type = "BASE", Label = area.BaseName, Image = area.BaseImage, Unique = true,
        };
        var random = new Random(DeriveSeed(runSeed, $"{area.Code}:{area.NodeCount}-nos"));
        var finalPool = new List<GameModeAreaOptionDto>(area.Options);
        if (area.UseBase) finalPool.Add(baseOption);
        GameModeAreaOptionDto finale = area.FinalOption switch
        {
            "BASE" => baseOption,
            "ALEATORIO" => PickWeighted(finalPool, random),
            _ when area.FinalOption.StartsWith("ROTA:", StringComparison.Ordinal) &&
                int.TryParse(area.FinalOption.AsSpan(5), out int index) &&
                index >= 0 && index < area.Options.Count => area.Options[index],
            _ => throw new InvalidOperationException($"O fim de {area.Name} não está configurado."),
        };
        var pool = new List<GameModeAreaOptionDto>(finalPool);
        if (finale.Unique) pool.Remove(finale);
        var routes = new List<GameModeAreaOptionDto>(area.NodeCount - 1);
        for (int index = 0; index < area.NodeCount - 1; index++)
        {
            if (pool.Count == 0)
                throw new InvalidOperationException($"O pool de {area.Name} não preenche {area.NodeCount} nós sem repetir opções únicas.");
            GameModeAreaOptionDto picked = PickWeighted(pool, random);
            routes.Add(picked);
            if (picked.Unique) pool.Remove(picked);
        }
        return (routes.ToArray(), finale);
    }

    private static GameModeAreaOptionDto PickWeighted(
        IReadOnlyList<GameModeAreaOptionDto> pool, Random random)
    {
        int draw = random.Next(pool.Sum(option => option.Weight));
        foreach (GameModeAreaOptionDto option in pool)
            if ((draw -= option.Weight) < 0) return option;
        throw new InvalidOperationException("O pool de encontros não tem peso válido.");
    }

    private static GameRunMapNodeDto BuildExpandedNode(long runSeed, JsonElement encounters,
        GameModeAreaDto area, GameModeAreaOptionDto option, string id, int fase, int layer,
        int position, IReadOnlyList<string> connections, string state)
    {
        bool nonCombat = option.Type is "BASE" or "EVENTO" or "DESCANSO" or "ATALHO" or "AREA_SECRETA";
        string? encounterCode = option.Type == "CACADA"
            ? option.EncounterCodes.Count == 0 ? null : option.EncounterCodes[
                new Random(DeriveSeed(runSeed, $"{id}:cacada")).Next(option.EncounterCodes.Count)]
            : option.EncounterCode;
        if (!nonCombat && (string.IsNullOrWhiteSpace(encounterCode) ||
            !encounters.TryGetProperty(encounterCode, out _)))
            throw new InvalidOperationException($"Uma rota de {area.Name} não possui encontro.");
        JsonElement encounter = nonCombat ? default : encounters.GetProperty(encounterCode!);
        string name = option.Type == "BASE" ? area.BaseName :
            option.Type == "CACADA" ? option.Label ?? "Caçada" : nonCombat ? option.Label ?? option.Type :
            encounter.GetProperty("mapName").GetString() ?? option.Type;
        string? image = option.Type == "BASE" ? area.BaseImage :
            option.Type == "CACADA" ? option.Image : nonCombat ? option.Image :
            encounter.TryGetProperty("enemy", out JsonElement enemy) &&
            enemy.TryGetProperty("image", out JsonElement portrait) &&
            portrait.ValueKind == JsonValueKind.String ? portrait.GetString() : null;
        return new GameRunMapNodeDto
        {
            Id = id, Name = name, Image = image, AreaImage = area.Image,
            AreaCode = area.Code,
            AreaName = area.Name, Description = option.Description,
            Fase = fase, Layer = layer, Position = position,
            Seed = DeriveSeed(runSeed, id), Type = option.Type, State = state,
            Connections = connections, Revealed = true,
            Payload = option.Type == "AREA_SECRETA" ? new GameRunMapNodePayloadDto
            {
                SecretAreaCode = option.SecretAreaCode,
            } : nonCombat ? null : new GameRunMapNodePayloadDto
            {
                EncounterCode = encounterCode,
            },
        };
    }

    private static GameModeAreaOptionDto[] ChooseOptions(long runSeed, string areaCode,
        IReadOnlyList<GameModeAreaOptionDto> pool, int limit)
    {
        var remaining = pool.ToList();
        var selected = new List<GameModeAreaOptionDto>();
        var random = new Random(DeriveSeed(runSeed, areaCode));
        while (selected.Count < Math.Min(limit, pool.Count))
        {
            int choice = random.Next(remaining.Sum(option => option.Weight));
            int index = 0;
            while ((choice -= remaining[index].Weight) >= 0) index++;
            selected.Add(remaining[index]);
            remaining.RemoveAt(index);
        }
        return selected.ToArray();
    }

    public static void Complete(GameRunMapDto map, string nodeId, bool unlockChildren = true)
    {
        GameRunMapNodeDto node = map.Nodes.Single(item => item.Id == nodeId);
        node.State = "CONCLUIDO";
        if (!unlockChildren) return;
        foreach (string childId in node.Connections)
        {
            GameRunMapNodeDto child = map.Nodes.Single(item => item.Id == childId);
            if (child.State == "BLOQUEADO") child.State = "DISPONIVEL";
        }
    }

    public static void CompleteShortcut(GameRunMapDto map, string nodeId)
    {
        GameRunMapNodeDto shortcut = map.Nodes.Single(node => node.Id == nodeId);
        GameRunMapNodeDto finale = map.Nodes.Where(node => node.Fase == shortcut.Fase)
            .MaxBy(node => node.Layer) ?? throw new InvalidOperationException("O fim da área não existe.");
        Complete(map, nodeId, unlockChildren: false);
        if (finale.Id == shortcut.Id) return;
        if (!shortcut.Connections.Contains(finale.Id))
            throw new InvalidOperationException("O atalho não está ligado ao fim da área.");
        foreach (GameRunMapNodeDto node in map.Nodes.Where(node => node.Fase == shortcut.Fase &&
            node.Layer > shortcut.Layer && node.Id != finale.Id))
            if (node.State is "BLOQUEADO" or "DISPONIVEL") node.State = "IGNORADO";
        finale.State = "DISPONIVEL";
    }

    public static GameRunMapDto EnterSecret(GameRunMapDto parent, GameRunMapDto secret,
        string portalNodeId)
    {
        if (parent.Nodes.All(node => node.Id != portalNodeId || node.Type != "AREA_SECRETA"))
            throw new InvalidOperationException("A passagem secreta não está disponível.");
        return new GameRunMapDto
        {
            SchemaVersion = 5, Nodes = secret.Nodes, ParentNodes = parent.Nodes,
            ParentMap = parent, IsSecretFinal = secret.IsSecretFinal,
            SecretReturnNodeId = portalNodeId, HistoricalNodes = parent.HistoricalNodes,
            MediumRestUsedMapKeys = parent.MediumRestUsedMapKeys,
            OpeningOpportunityPending = parent.OpeningOpportunityPending,
        };
    }

    public static GameRunMapDto ReturnFromSecret(GameRunMapDto secret)
    {
        if (secret.ParentNodes is null || string.IsNullOrWhiteSpace(secret.SecretReturnNodeId))
            throw new InvalidOperationException("O retorno da área secreta não está disponível.");
        GameRunMapDto parent = secret.ParentMap is { } saved
            ? new GameRunMapDto
            {
                SchemaVersion = saved.SchemaVersion, Nodes = saved.Nodes,
                ParentNodes = saved.ParentNodes, ParentMap = saved.ParentMap,
                SecretReturnNodeId = saved.SecretReturnNodeId,
                IsSecretFinal = saved.IsSecretFinal,
                HistoricalNodes = [..secret.HistoricalNodes, ..secret.Nodes],
                MediumRestUsedMapKeys = secret.MediumRestUsedMapKeys,
                OpeningOpportunityPending = secret.OpeningOpportunityPending,
            }
            : new GameRunMapDto
            {
                SchemaVersion = 5, Nodes = secret.ParentNodes,
                HistoricalNodes = [..secret.HistoricalNodes, ..secret.Nodes],
                MediumRestUsedMapKeys = secret.MediumRestUsedMapKeys,
                OpeningOpportunityPending = secret.OpeningOpportunityPending,
            };
        Complete(parent, secret.SecretReturnNodeId);
        Validate(parent);
        return parent;
    }

    public static void Select(GameRunMapDto map, string nodeId)
    {
        GameRunMapNodeDto node = map.Nodes.Single(item => item.Id == nodeId);
        if (node.State != "DISPONIVEL" ||
            !map.Nodes.Any(parent => parent.State == "CONCLUIDO" && parent.Connections.Contains(nodeId)))
            throw new InvalidOperationException("O nó não está conectado ao caminho concluído.");
        node.State = "SELECIONADO";
        foreach (GameRunMapNodeDto alternative in map.Nodes.Where(item =>
            item.Id != nodeId && item.Layer == node.Layer && item.State == "DISPONIVEL"))
            alternative.State = "IGNORADO";
    }

    public static void Validate(GameRunMapDto map)
    {
        if (map.Nodes.Count < 2 || map.Nodes.Count > 1 + MaxNormalAreas * MaxNodesPerArea ||
            map.Nodes.Select(node => node.Id).Distinct(StringComparer.Ordinal).Count() != map.Nodes.Count ||
            map.Nodes.Count(node => node.Type == "INICIO") != 1)
            throw new InvalidOperationException("O mapa possui nós inválidos.");
        Dictionary<string, GameRunMapNodeDto> nodes = map.Nodes.ToDictionary(node => node.Id);
        foreach (GameRunMapNodeDto node in map.Nodes)
        {
            if (node.Layer < 0 || node.Layer > 48 || node.Position is < -3 or > 3 ||
                node.Connections.Count > 4 || node.Connections.Any(id =>
                    !nodes.TryGetValue(id, out GameRunMapNodeDto? child) || child.Layer <= node.Layer))
                throw new InvalidOperationException("O mapa contém uma conexão horizontal, ascendente ou inválida.");
        }
        HashSet<string> reached = [map.Nodes.Single(node => node.Type == "INICIO").Id];
        foreach (GameRunMapNodeDto node in map.Nodes.OrderBy(node => node.Layer))
        {
            if (!reached.Contains(node.Id))
                throw new InvalidOperationException("O mapa contém um nó inalcançável.");
            reached.UnionWith(node.Connections);
        }
    }

    private static int DeriveSeed(long seed, string nodeId)
    {
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes($"{seed}:{nodeId}"));
        return BinaryPrimitives.ReadInt32LittleEndian(hash.AsSpan(0, 4)) & int.MaxValue;
    }
}
