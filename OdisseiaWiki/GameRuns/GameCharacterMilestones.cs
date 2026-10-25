using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.GameRuns.Battle;
using OdisseiaWiki.GameRuns.Map;
using OdisseiaWiki.Models;

namespace OdisseiaWiki.GameRuns;

public sealed class GameCharacterMilestones
{
    private static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web);
    public int SchemaVersion { get; set; } = 1;
    public List<GameDefeatedEnemyMemory> DefeatedEnemies { get; set; } = [];
    // Reserved contracts; these do not grant NPC services or transfer items yet.
    public List<GameRescuedNpcMemory> RescuedNpcs { get; set; } = [];
    public List<GameProtectedItemMemory> ProtectedItems { get; set; } = [];

    public static GameCharacterMilestones Read(string? json) => string.IsNullOrWhiteSpace(json)
        ? new() : JsonSerializer.Deserialize<GameCharacterMilestones>(json, Options)
            ?? throw new InvalidOperationException("A memória do personagem está inválida.");
    public string Serialize() => JsonSerializer.Serialize(this, Options);

    public void Learn(int systemId, string gameCode, string encounterCode, GameBattleEncounterConfig encounter)
    {
        if (encounter.Enemy is not { MaxVida: > 0 } enemy || encounter.DamageByResult is null) return;
        string identity = enemy.NpcId is > 0 ? $"npc:{enemy.NpcId}:{enemy.VariantId}" : $"game:{gameCode}:{encounterCode}";
        string key = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes($"{systemId}|{identity}")));
        var copy = JsonSerializer.Deserialize<GameBattleEncounterConfig>(JsonSerializer.Serialize(encounter, Options), Options)!;
        copy.Enemy!.Quantity = 1;
        copy.Loot.Clear(); copy.LootCount = 0; copy.XpReward = 0; copy.CurrencyReward = 0;
        DefeatedEnemies.RemoveAll(item => item.Key == key);
        DefeatedEnemies.Add(new() { Key = key, SystemId = systemId, Encounter = copy });
    }

    public void LearnHistorical(GameRunBattle battle, int systemId)
    {
        if (battle.VencedorId != "player") return;
        GameRun run = battle.Run;
        var map = GameRunFirstMap.Read(run.MapaJson, Options);
        var node = Nodes(map).FirstOrDefault(item => item.Id == battle.NoId);
        var config = JsonSerializer.Deserialize<GameBattlePreviewConfig>(run.GameModeVersion.ConfiguracaoJson, Options);
        if (node?.Payload?.EncounterCode is string code &&
            config?.Encounters?.TryGetValue(code, out var encounter) == true)
            Learn(systemId, run.GameModeVersion.Codigo, code, encounter);
    }

    private static IEnumerable<GameRunMapNodeDto> Nodes(GameRunMapDto map) => map.Nodes
        .Concat(map.HistoricalNodes).Concat(map.ParentNodes ?? [])
        .Concat(map.ParentMap is { } parent ? Nodes(parent) : []);
}

public sealed class GameDefeatedEnemyMemory
{
    public string Key { get; set; } = "";
    public int SystemId { get; set; }
    public GameBattleEncounterConfig Encounter { get; set; } = new();
}
public sealed record GameRescuedNpcMemory(string GameCode, int SystemId, string NpcCode);
public sealed record GameProtectedItemMemory(string GameCode, int SystemId, string ItemId, JsonObject Snapshot);
