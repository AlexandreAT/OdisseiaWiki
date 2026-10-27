using System.Text.Json;
using System.Text.Json.Nodes;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.GameRuns.Battle;
using OdisseiaWiki.GameRuns.Inventory;
using OdisseiaWiki.Models;
using OdisseiaWiki.Services.Helpers;

namespace OdisseiaWiki.GameRuns;

public sealed record GameAttributeInfluenceEffect(string Codigo, string Nome, string Grupo, int Valor);
public sealed record GameAttributeInfluence(string Id, string Nome, string? Imagem, string Tipo,
    string? Condicao, IReadOnlyList<GameAttributeInfluenceEffect> Efeitos);

/// <summary>Read-only breakdown of effects already applied or active in this run's pinned System.</summary>
public static class GameRunAttributeInfluences
{
    public static IReadOnlyList<GameAttributeInfluence> Read(JsonObject root, SistemaVersao version)
    {
        var attributes = version.Atributos.Where(attribute => attribute.Ativo &&
            attribute.Grupo is SistemaAtributoGrupo.Principal or SistemaAtributoGrupo.Secundario).ToArray();
        var result = new List<GameAttributeInfluence>();
        var ledger = root["__runProsthesisApplied"] as JsonObject ?? root["__runProsthesisBonuses"] as JsonObject;
        var allocated = new Dictionary<string, long>();
        int itemIndex = 0;
        foreach (var item in GameRunInventory.ReadOrCreate(root, "implantes").OfType<JsonObject>())
        {
            JsonNode? data = item["atributos"];
            if (data is JsonValue stored && stored.TryGetValue<string>(out var json))
            {
                // This is a read-only explanation, not equipment validation. An unreadable
                // legacy item must not block the whole attribute/progression screen.
                try { data = JsonNode.Parse(json!); }
                catch (JsonException) { continue; }
            }
            if (data is not JsonObject values || values["__vistaExplodida"] is not JsonObject view ||
                string.IsNullOrWhiteSpace(view["equippedSlot"]?.ToString()) ||
                values["bonus"] is not JsonObject bonuses) continue;
            var effects = new List<GameAttributeInfluenceEffect>();
            foreach (var (code, amount) in bonuses)
            {
                var attribute = attributes.FirstOrDefault(attribute => Normalize(attribute.CodigoAtributo) == Normalize(code));
                if (attribute is null) continue;
                string group = Group(attribute), target = $"{group}/{Normalize(code).ToLowerInvariant()}";
                // An installed item is not proof that its delta was applied in an old snapshot.
                if (ledger?.ContainsKey(target) != true) continue;
                int value = Math.Clamp(Number(amount), -1000000, 1000000);
                if (value == 0) continue;
                allocated[target] = allocated.GetValueOrDefault(target) + value;
                effects.Add(new(attribute.CodigoAtributo, attribute.Nome, group, value));
            }
            if (effects.Count > 0) result.Add(new($"prosthesis:{item["id"]}:{itemIndex++}", item["nome"]?.ToString() ?? "Prótese",
                GameBattleMedia.ReadImage(JsonSerializer.SerializeToElement(item)), "PROTESE", null, Merge(effects)));
        }
        if (ledger is not null)
            foreach (var (target, applied) in ledger)
            {
                string[] parts = target.Split('/');
                if (parts.Length != 2 || parts[0] == "recursos") continue;
                var attribute = attributes.FirstOrDefault(attribute => Group(attribute) == parts[0] &&
                    Normalize(attribute.CodigoAtributo) == Normalize(parts[1]));
                if (attribute is null) continue;
                int difference = (int)Math.Clamp((long)Number(applied) - allocated.GetValueOrDefault(target), int.MinValue, int.MaxValue);
                if (difference != 0) result.Add(new($"applied:{target}", allocated.ContainsKey(target) ? "Limite do atributo" : "Equipamento da run",
                    null, "AJUSTE", null, [new(attribute.CodigoAtributo, attribute.Nome, parts[0], difference)]));
            }

        var snapshot = new GameRunCharacterSnapshotDto { Status = JsonSerializer.SerializeToElement(root["status"]),
            CondicoesAtivas = root["condicoesAtivas"] is { } flags ? JsonSerializer.SerializeToElement(flags) : null };
        int index = 0;
        foreach (var condition in GameBattlePreviewFactory.ReadActiveConditions(snapshot, version))
        {
            var effects = AutoBattleSimulator.EffectiveEffects(condition)
                .Where(effect => effect.Operacao.Equals("MODIFICAR_ATRIBUTO", StringComparison.OrdinalIgnoreCase) &&
                    effect.Momento.Equals("ENQUANTO_ATIVA", StringComparison.OrdinalIgnoreCase))
                .Select(effect => (Effect: effect, Attribute: attributes.FirstOrDefault(attribute =>
                    Normalize(attribute.CodigoAtributo) == Normalize(effect.Recurso))))
                .Where(item => item.Attribute is not null && item.Effect.Valor != 0)
                .Select(item => new GameAttributeInfluenceEffect(item.Attribute!.CodigoAtributo,
                    item.Attribute.Nome, Group(item.Attribute), item.Effect.Valor)).ToArray();
            if (effects.Length == 0) continue;
            var rule = version.Condicoes.First(item => item.Codigo.Equals(condition.Rule.Code, StringComparison.OrdinalIgnoreCase));
            result.Add(new($"condition:{condition.Rule.Code}:{index++}", condition.SourceName ?? condition.Rule.Name,
                condition.SourceImage ?? condition.Rule.Image ?? SistemaCondicaoEfeitos.Image(rule),
                condition.SourceType ?? "CONDICAO", condition.SourceName is null ? null : condition.Rule.Name, Merge(effects)));
        }
        return result;
    }

    private static IReadOnlyList<GameAttributeInfluenceEffect> Merge(IEnumerable<GameAttributeInfluenceEffect> effects) =>
        effects.GroupBy(effect => (Normalize(effect.Codigo), effect.Grupo))
            .Select(group => group.First() with { Valor = checked(group.Sum(effect => effect.Valor)) }).Where(effect => effect.Valor != 0).ToArray();
    private static string Group(SistemaAtributoConfig attribute) => attribute.Grupo == SistemaAtributoGrupo.Principal ? "principais" : "secundarios";
    private static string Normalize(string value) => SistemaRpgConfiguration.NormalizarCodigo(value, string.Empty);
    private static int Number(JsonNode? node) => int.TryParse(node?.ToString(), out int value) ? value : 0;
}
