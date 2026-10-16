using System.Text.Json;
using System.Text.Json.Nodes;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Services.Helpers;

namespace OdisseiaWiki.GameRuns;

public sealed record GameRunGrantedPoints(int Gerais = 0, int Atributo = 0,
    int Skill = 0, int Ultimate = 0);
public sealed record GameRunProgressionResult(string SnapshotJson, IReadOnlyList<int> LevelsReached,
    GameRunGrantedPoints PointsGranted);

/// <summary>
/// Applies only structured rules from the System version pinned to the run. Choices that
/// cannot yet be executed are retained in the run snapshot instead of being guessed.
/// </summary>
public static class GameRunProgression
{
    public static GameRunProgressionResult Apply(string snapshotJson, SistemaVersao version)
    {
        SistemaModulo? module = version.Modulos.FirstOrDefault(item =>
            item.TipoModulo == SistemaModuloTipo.Progressao && item.Habilitado);
        if (module is null || string.IsNullOrWhiteSpace(module.ConfiguracaoJson) || version.Niveis.Count == 0)
            return new(snapshotJson, [], new());

        try
        {
            using JsonDocument published = JsonDocument.Parse(module.ConfiguracaoJson);
            if (published.RootElement.ValueKind != JsonValueKind.Object ||
                !published.RootElement.EnumerateObject().Any(property =>
                    string.Equals(property.Name, "nivelMaximo", StringComparison.OrdinalIgnoreCase) &&
                    property.Value.ValueKind == JsonValueKind.Number &&
                    property.Value.TryGetInt32(out int maximum) && maximum > 0) ||
                !published.RootElement.EnumerateObject().Any(property =>
                    string.Equals(property.Name, "permiteXpExcedente", StringComparison.OrdinalIgnoreCase) &&
                    property.Value.ValueKind is JsonValueKind.True or JsonValueKind.False))
                return new(snapshotJson, [], new());
        }
        catch (JsonException) { return new(snapshotJson, [], new()); }

        var rules = SistemaRpgConfiguration.LerRegras<SistemaRpgConfiguration.RegrasProgressao>(
            version, SistemaModuloTipo.Progressao);
        if (rules.NivelMaximo < 1) return new(snapshotJson, [], new());

        JsonObject root = JsonNode.Parse(snapshotJson) as JsonObject
            ?? throw new JsonException("O estado da run não é um objeto.");
        JsonObject status = Find(root, "status") as JsonObject
            ?? throw new JsonException("O estado da run não possui status.");
        int level = ReadNonNegative(status, "nivel", 1);
        int xp = ReadNonNegative(status, "xp", 0);
        if (level < 1 || level >= rules.NivelMaximo)
            return new(snapshotJson, [], new());

        Dictionary<int, SistemaNivel> levels = version.Niveis
            .GroupBy(item => item.Nivel).ToDictionary(group => group.Key,
                group => group.OrderBy(item => item.Ordem).First());
        List<int> reached = [];
        GameRunGrantedPoints granted = new();
        JsonArray pending = Find(status, "evolucoesPendentes") as JsonArray ?? [];
        while (level < rules.NivelMaximo && levels.TryGetValue(level, out SistemaNivel? current) &&
               levels.TryGetValue(level + 1, out SistemaNivel? next) &&
               current.XpParaProximoNivel > 0 && xp >= current.XpParaProximoNivel)
        {
            xp = rules.PermiteXpExcedente ? xp - current.XpParaProximoNivel : 0;
            level++;
            reached.Add(level);
            Add(status, "pontos", next.PontosNivel);
            Add(status, "pontosAtributo", next.PontosAtributo);
            Add(status, "pontosConcedidosNaRun", checked(next.PontosNivel + next.PontosAtributo));
            Add(status, "pontosSkill", next.PontosSkill);
            Add(status, "pontosUltimate", next.PontosUltimate);
            granted = new(checked(granted.Gerais + next.PontosNivel),
                checked(granted.Atributo + next.PontosAtributo),
                checked(granted.Skill + next.PontosSkill),
                checked(granted.Ultimate + next.PontosUltimate));

            var milestones = version.MarcosNivel.Where(item => item.Nivel == level)
                .OrderBy(item => item.Ordem).Select(item => new JsonObject
                {
                    ["codigo"] = item.Codigo,
                    ["nome"] = item.Nome,
                    ["tipoRecompensa"] = item.TipoRecompensa,
                }).ToArray();
            if (next.PermiteNovaMagia || next.PermiteNovaSkill || milestones.Length > 0)
            {
                pending.Add(new JsonObject
                {
                    ["nivel"] = level,
                    ["novaMagia"] = next.PermiteNovaMagia,
                    ["novaSkill"] = next.PermiteNovaSkill,
                    ["marcos"] = new JsonArray(milestones),
                });
            }
        }

        if (reached.Count == 0) return new(snapshotJson, [], new());
        Set(status, "nivel", level);
        Set(status, "xp", xp);
        if (pending.Count > 0) Set(status, "evolucoesPendentes", pending);
        return new(root.ToJsonString(), reached, granted);
    }

    private static void Add(JsonObject source, string key, int amount)
    {
        if (amount < 0) throw new JsonException("Os pontos de evolução configurados são inválidos.");
        if (amount > 0) Set(source, key, checked(ReadNonNegative(source, key, 0) + amount));
    }

    private static int ReadNonNegative(JsonObject source, string key, int fallback)
    {
        JsonNode? value = Find(source, key);
        if (value is null) return fallback;
        if (!int.TryParse(value.ToString(), out int number) || number < 0)
            throw new JsonException($"O campo {key} da run é inválido.");
        return number;
    }

    private static void Set(JsonObject source, string key, int value)
    {
        string actual = ActualKey(source, key);
        source[actual] = value;
    }

    private static void Set(JsonObject source, string key, JsonNode value)
    {
        string actual = ActualKey(source, key);
        if (source[actual] != value) source[actual] = value.DeepClone();
    }

    private static string ActualKey(JsonObject source, string key) => source.Select(entry => entry.Key)
        .FirstOrDefault(existing => string.Equals(existing, key, StringComparison.OrdinalIgnoreCase)) ?? key;

    private static JsonNode? Find(JsonObject source, string key) => source[ActualKey(source, key)];
}
