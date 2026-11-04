using System.Globalization;
using System.Text.Json;
using System.Text.Json.Nodes;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;

namespace OdisseiaWiki.GameRuns;

/// <summary>Read-only projection of the saved run, never of today's live character or published configuration.</summary>
public static class GameRunVictoryStatistics
{
    private static JsonNode? Parse(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return null;
        try { return JsonNode.Parse(json); } catch (JsonException) { return null; }
    }
    private static JsonNode? Field(JsonNode? node, string key) => node is JsonObject obj
        ? obj.FirstOrDefault(pair => pair.Key.Equals(key, StringComparison.OrdinalIgnoreCase)).Value : null;
    private static string? Text(JsonNode? node) => node is JsonValue value && value.TryGetValue<string>(out var text) ? text : null;
    private static long Number(JsonNode? node, long fallback = 0) => long.TryParse(node?.ToString(),
        NumberStyles.Integer, CultureInfo.InvariantCulture, out long result) ? result : fallback;
    private static IEnumerable<JsonNode> Array(JsonNode? node) => node is JsonArray array ? array.OfType<JsonNode>() : [];

    public static GameRunVictoryStatisticsDto Create(GameRun run, IReadOnlyList<GameRunVictoryBattleData> battles)
    {
        if (run.Status != GameRunStatus.Vitoria) throw new ArgumentException("Somente vitórias possuem resumo detalhado.", nameof(run));
        var initial = Parse(run.SnapshotInicialJson);
        var current = Parse(run.EstadoAtualJson);
        var status = Field(current, "status");
        var story = Array(Field(current, "story")).ToArray();
        var won = battles.Where(battle => battle.RunId == run.IdGameRun &&
            !string.IsNullOrWhiteSpace(battle.WinnerId) && battle.WinnerId == (battle.PlayerId ?? "player")).ToArray();
        var enemies = new List<GameRunVictoryEnemyDto>();
        foreach (var battle in won)
        {
            var opponents = Array(Parse(battle.EnemiesJson)).ToArray();
            if (opponents.Length == 0 && Parse(battle.EnemyJson) is JsonObject opponent) opponents = [opponent];
            foreach (var enemy in opponents)
            {
                string name = Text(Field(enemy, "nome")) ?? "Inimigo";
                string? image = Text(Field(enemy, "imagem"));
                int index = enemies.FindIndex(row => row.Nome == name);
                if (index < 0) enemies.Add(new(name, image, 1));
                else enemies[index] = enemies[index] with { Quantidade = enemies[index].Quantidade + 1,
                    Imagem = enemies[index].Imagem ?? image };
            }
        }
        var map = Parse(run.MapaJson);
        var nodes = new Dictionary<string, JsonNode>(StringComparer.Ordinal);
        void Visit(JsonNode? area)
        {
            if (area is not JsonObject) return;
            foreach (var node in Array(Field(area, "nodes")).Concat(Array(Field(area, "historicalNodes")))
                .Concat(Array(Field(area, "parentNodes"))))
                if (Text(Field(node, "state")) == "CONCLUIDO")
                    nodes[$"{Number(Field(node, "fase"))}:{Text(Field(node, "id"))}"] = node;
            Visit(Field(area, "parentMap"));
        }
        Visit(map);
        var areaNames = nodes.Values.Select(node => Text(Field(node, "areaName")))
            .Where(name => !string.IsNullOrWhiteSpace(name)).Distinct(StringComparer.Ordinal).Count();
        var initialItems = Inventory(initial);
        long gained = Inventory(current).Sum(row => Math.Max(0, row.Value - initialItems.GetValueOrDefault(row.Key)));
        var protectedItems = Array(Field(Field(current, "protectedDepositAtEnd"), "items")).Select(item => {
            var snapshot = Field(item, "snapshot");
            return new GameRunVictoryProtectedItemDto(Text(Field(item, "itemId")) ?? Text(Field(snapshot, "id")) ?? string.Empty,
                Text(Field(snapshot, "nome")) ?? "Item protegido", Text(Field(snapshot, "imagem")),
                Math.Max(0, Number(Field(snapshot, "quantidade"), 1)));
        }).ToArray();
        long battleXp = won.Sum(battle => Math.Max(0, (long)(battle.Xp ?? 0)));
        long storyXp = story.Sum(record => Math.Max(0, Number(Field(record, "xp"))));
        long? duration = run.EncerradaEmUtc is { } end ? Math.Max(0, (long)(end - run.CriadaEmUtc).TotalSeconds) : null;
        return new(run.IdGameRun, run.IdPersonagemJogadorOrigem,
            Text(Field(initial, "nome")) ?? Text(Field(current, "nome")) ?? "Personagem",
            Text(Field(initial, "imagem")) ?? Text(Field(current, "imagem")),
            run.GameModeVersion.Codigo, run.GameModeVersion.Nome ?? "Jogo", run.IdGameModeVersion, run.GameModeVersion.NumeroVersao,
            run.IdSistemaVersao, run.SistemaVersao.NumeroVersao, run.Seed, run.CriadaEmUtc, run.EncerradaEmUtc, duration,
            (int)Math.Clamp(Number(Field(status, "nivel"), 1), 1, int.MaxValue), Math.Max(run.Fase, areaNames),
            nodes.Values.Count(node => Text(Field(node, "type")) != "INICIO"),
            story.Count(record => Text(Field(record, "type")) == "MISSAO_CONCLUIDA"),
            battles.Count(battle => battle.RunId == run.IdGameRun), won.Length, enemies.Sum(enemy => enemy.Quantidade),
            Math.Max(Number(Field(status, "xpConquistadoRun")), battleXp + storyXp),
            Math.Max(Number(Field(status, "lootItensObtidos")), gained),
            won.Sum(battle => Math.Max(0, (long)(battle.Currency ?? 0))),
            story.Sum(record => Number(Field(record, "currency"))),
            Math.Max(0, Number(Field(Field(current, "economy"), "balance"))), enemies, protectedItems);
    }

    private static Dictionary<string, long> Inventory(JsonNode? snapshot)
    {
        var result = new Dictionary<string, long>(StringComparer.Ordinal);
        void Add(JsonNode? node, string kind)
        {
            if (node is JsonValue value && value.TryGetValue<string>(out string? json)) node = Parse(json);
            if (node is JsonObject wrapper)
                node = wrapper.FirstOrDefault(pair => new[] { "itens", "inventario", "items", "implantes", "proteses" }
                    .Contains(pair.Key, StringComparer.OrdinalIgnoreCase)).Value;
            foreach (var item in Array(node))
            {
                string? id = Field(item, "id")?.ToString();
                if (string.IsNullOrWhiteSpace(id)) continue;
                string itemKind = Text(Field(item, "tipo"))?.Equals("implante", StringComparison.OrdinalIgnoreCase) == true ? "PROTESE" : kind;
                string key = $"{itemKind}:{id}";
                result[key] = result.GetValueOrDefault(key) + Math.Max(0, Number(Field(item, "quantidade"), 1));
            }
        }
        Add(Field(snapshot, "inventario"), "ITEM");
        Add(Field(snapshot, "implantes"), "PROTESE");
        Add(Field(Field(snapshot, "economy"), "stash"), "ITEM");
        return result;
    }
}
