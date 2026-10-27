using System.Text.Json;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;
using OdisseiaWiki.Services.Helpers;

namespace OdisseiaWiki.GameRuns.Battle;

/// <summary>Read-only presentation metadata. Never rebuilds a battle or consults today's item catalogue.</summary>
public static class GameBattleMedia
{
    private sealed record Source(string? Image, string Type);

    public static string? ReadImage(JsonElement? item)
    {
        foreach (string key in new[] { "imagem", "image", "url" })
            if (Field(item, key) is { ValueKind: JsonValueKind.String } value && Text(value) is { Length: > 0 } image) return image;
        foreach (string key in new[] { "itemBase", "baseItem" })
            if (Field(item, key) is { } nested && ReadImage(nested) is { } image) return image;
        return null;
    }

    public static GameBattlePreviewDto Restore(GameBattlePreviewDto preview, GameRunBattle battle,
        GameRun run, SistemaVersao? version)
    {
        var sources = new Dictionary<(string Actor, string Action), Source>();
        var conditions = new Dictionary<(string Actor, string Code), string>();
        var defaults = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var rule in version?.Condicoes ?? [])
            if (SistemaCondicaoEfeitos.Image(rule) is { } image) defaults[rule.Codigo] = image;
        var opponents = preview.Oponentes is { Count: > 0 } ? preview.Oponentes : [preview.Oponente];
        var actors = new[] { preview.Personagem }.Concat(opponents);
        foreach (var actor in actors)
            foreach (var condition in actor.Condicoes ?? [])
                if (!string.IsNullOrWhiteSpace(condition.Rule.Image))
                    conditions[(actor.Id, condition.Rule.Code.ToUpperInvariant())] = condition.Rule.Image;

        var before = Parse(battle.EstadoAntesJson);
        AddSources(preview.Personagem.Id, Field(before, "inventario"), "item", "ITEM");
        AddSources(preview.Personagem.Id, Field(before, "implantes"), "protese", "PROTESE");
        AddSources(preview.Personagem.Id, Field(before, "magia"), "magia", "MAGIA");
        AddSources(preview.Personagem.Id, Field(before, "skills"), "skill", "SKILL");

        var config = Parse(run.GameModeVersion?.ConfiguracaoJson);
        string? code = EncounterCode(Parse(run.MapaJson), battle.NoId);
        var enemy = code is not null ? Field(Field(Field(config, "encounters"), code), "enemy")
            : battle.NoId == Map.GameRunFirstMap.EncounterId ? Field(config, "previewEnemy") : null;
        foreach (var actor in opponents)
        {
            sources[(actor.Id, "enemy-attack")] = new(actor.Imagem, "ATAQUE");
            AddSources(actor.Id, Field(enemy, "inventarioJson"), "item", "ITEM");
            AddSources(actor.Id, Field(enemy, "implantesJson"), "protese", "PROTESE");
            AddSources(actor.Id, Field(enemy, "magiaJson"), "magia", "MAGIA");
            AddSources(actor.Id, Field(enemy, "skillsJson"), "skill", "SKILL");
        }

        var events = preview.Resultado.Events.Select(item =>
        {
            string? actor = item.Type == GameBattleEventTypes.ConditionApplied ? item.TargetId : item.ActorId;
            string? code = item.Payload switch {
                ConditionAppliedPayload value => value.Code, ConditionEffectPayload value => value.Code,
                ConditionExpiredPayload value => value.Code, ResistanceRolledPayload value => value.Code, _ => null };
            string? image = code is null ? null : conditions.GetValueOrDefault((actor ?? "", code.ToUpperInvariant()))
                ?? defaults.GetValueOrDefault(code);
            var payload = item.Payload switch
            {
                ActionSelectedPayload value when sources.TryGetValue((item.ActorId ?? "", value.ActionId), out var source) =>
                    value with { Image = First(value.Image, source.Image), SourceType = First(value.SourceType, source.Type) },
                ConditionAppliedPayload value => value with { Image = First(value.Image, image) },
                ConditionEffectPayload value => value with { Image = First(value.Image, image) },
                ConditionExpiredPayload value => value with { Image = First(value.Image, image) },
                ResistanceRolledPayload value => value with { Image = First(value.Image, image) },
                _ => item.Payload,
            };
            if (payload is ConditionAppliedPayload applied && !string.IsNullOrWhiteSpace(applied.Image))
                conditions[(actor ?? "", applied.Code.ToUpperInvariant())] = applied.Image;
            return item with { Payload = payload };
        }).ToArray();
        return preview with { Personagem = RestoreActor(preview.Personagem), Oponente = RestoreActor(preview.Oponente),
            Oponentes = (preview.Oponentes ?? []).Select(RestoreActor).ToArray(),
            Resultado = preview.Resultado with { Events = events } };

        GameBattlePreviewActorDto RestoreActor(GameBattlePreviewActorDto actor) => actor with {
            Condicoes = (actor.Condicoes ?? []).Select(condition => condition with { Rule = condition.Rule with {
                Image = First(condition.Rule.Image, defaults.GetValueOrDefault(condition.Rule.Code)) } }).ToArray() };

        void AddSources(string actor, JsonElement? raw, string prefix, string type)
        {
            foreach (var entry in Entries(raw))
                if (Text(Field(entry, "id")) is { Length: > 0 } id)
                    sources[(actor, $"{prefix}:{id}")] = new(ReadImage(entry),
                        type == "ITEM" && string.Equals(Text(Field(entry, "tipo")), "arma", StringComparison.OrdinalIgnoreCase) ? "ARMA" : type);
        }
    }

    private static string? First(string? value, string? fallback) => string.IsNullOrWhiteSpace(value) ? fallback : value;
    private static string? Text(JsonElement? value) => value?.ValueKind is JsonValueKind.String or JsonValueKind.Number
        ? value.Value.ToString().Trim() : null;
    private static JsonElement? Parse(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return null;
        try { using var doc = JsonDocument.Parse(json); return doc.RootElement.Clone(); }
        catch (JsonException) { return null; } // Missing legacy presentation data must not hide a saved battle.
    }
    private static JsonElement? Field(JsonElement? node, string key) => node is { ValueKind: JsonValueKind.Object } value
        ? value.EnumerateObject().Where(property => property.Name.Equals(key, StringComparison.OrdinalIgnoreCase))
            .Select(property => (JsonElement?)property.Value).FirstOrDefault() : null;
    private static IEnumerable<JsonElement> Entries(JsonElement? raw)
    {
        if (raw is { ValueKind: JsonValueKind.String }) raw = Parse(raw.Value.GetString());
        if (raw is { ValueKind: JsonValueKind.Array } array) return array.EnumerateArray();
        foreach (string key in new[] { "itens", "inventario", "items", "implantes", "proteses", "magia", "magias", "skills", "poderes" })
            if (Field(raw, key) is { } nested) return Entries(nested);
        return [];
    }
    private static string? EncounterCode(JsonElement? map, string nodeId)
    {
        foreach (string key in new[] { "nodes", "historicalNodes", "parentNodes" })
            foreach (var node in Entries(Field(map, key)))
                if (Text(Field(node, "id")) == nodeId) return Text(Field(Field(node, "payload"), "encounterCode"));
        return Field(map, "parentMap") is { } parent ? EncounterCode(parent, nodeId) : null;
    }
}
