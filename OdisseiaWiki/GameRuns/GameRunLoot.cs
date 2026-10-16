using System.Security.Cryptography;
using System.Text.Json;
using System.Text.Json.Nodes;
using OdisseiaWiki.GameRuns.Battle;

namespace OdisseiaWiki.GameRuns;

public sealed class GameLootEntry
{
    public string ItemId { get; set; } = string.Empty;
    public int Weight { get; set; } = 1;
    // Frozen from the authoritative catalogue when the mode is published.
    public JsonObject? Snapshot { get; set; }
}

public sealed class GameRunLootState
{
    public string NodeId { get; set; } = string.Empty;
    public int Faces { get; set; }
    public int Count { get; set; }
    public List<GameLootEntry> Pool { get; set; } = [];
    public int? Roll { get; set; }
    public List<JsonObject> Rewards { get; set; } = [];
}

public static class GameRunLoot
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    public static string Prepare(string snapshot, string nodeId, GameBattleEncounterConfig encounter, int faces)
    {
        if (encounter.LootCount == 0) return snapshot;
        if (faces is not (4 or 6 or 8 or 10 or 12 or 20) || encounter.Loot.Count == 0 ||
            encounter.Loot.Any(entry => entry.Weight <= 0 || entry.Snapshot is null))
            throw new InvalidOperationException("O loot precisa de um dado do Sistema e de itens publicados válidos.");
        JsonObject root = JsonNode.Parse(snapshot)!.AsObject();
        root["loot"] = JsonSerializer.SerializeToNode(new GameRunLootState
        {
            NodeId = nodeId, Faces = faces, Count = encounter.LootCount, Pool = encounter.Loot,
        }, JsonOptions);
        return root.ToJsonString(JsonOptions);
    }

    public static GameRunLootState? Read(string snapshot) =>
        JsonNode.Parse(snapshot)?["loot"]?.Deserialize<GameRunLootState>(JsonOptions);

    public static (string Snapshot, GameRunLootState Loot) Claim(string snapshot,
        Func<int, int>? random = null)
    {
        random ??= maximum => RandomNumberGenerator.GetInt32(maximum);
        GameRunLootState loot = Read(snapshot) ?? throw new InvalidOperationException("Não há loot pendente.");
        if (loot.Roll.HasValue) return (snapshot, loot);
        if (loot.Count is < 1 or > 100 || loot.Pool.Count == 0)
            throw new InvalidOperationException("A recompensa publicada é inválida.");
        loot.Roll = random(loot.Faces) + 1;
        int rarest = loot.Pool.Min(entry => entry.Weight);
        int[] weights = loot.Pool.Select(entry => checked(entry.Weight *
            (loot.Roll > loot.Faces / 2 && entry.Weight == rarest ? 2 : 1))).ToArray();
        int total = checked(weights.Sum());
        JsonObject root = JsonNode.Parse(snapshot)!.AsObject();
        for (int index = 0; index < loot.Count; index++)
        {
            int ticket = random(total), selected = 0;
            while (ticket >= weights[selected]) ticket -= weights[selected++];
            JsonObject item = loot.Pool[selected].Snapshot!.DeepClone().AsObject();
            item["id"] = Guid.NewGuid().ToString("D");
            item["idItemBase"] = loot.Pool[selected].ItemId;
            item["quantidade"] = 1;
            string inventoryKey = item["tipo"]?.ToString() == "implante" ? "implantes" : "inventario";
            JsonArray inventory = ReadInventory(root, inventoryKey);
            inventory.Add(item.DeepClone());
            loot.Rewards.Add(item);
        }
        JsonObject status = root["status"] as JsonObject ?? new JsonObject();
        if (root["status"] is null) root["status"] = status;
        int previouslyObtained = int.TryParse(status["lootItensObtidos"]?.ToString(), out int obtained)
            ? Math.Max(0, obtained) : 0;
        status["lootItensObtidos"] = checked(previouslyObtained + loot.Rewards.Count);
        root["loot"] = JsonSerializer.SerializeToNode(loot, JsonOptions);
        return (root.ToJsonString(JsonOptions), loot);
    }

    private static JsonArray ReadInventory(JsonObject root, string key)
    {
        JsonNode? source = root[key];
        if (source is JsonValue value && value.TryGetValue<string>(out string? json) &&
            !string.IsNullOrWhiteSpace(json))
        {
            source = JsonNode.Parse(json);
            root[key] = source;
        }
        if (source is JsonArray array) return array;
        if (source is JsonObject wrapper)
        {
            string? listKey = new[] { "itens", "inventario", "items", "implantes", "proteses" }
                .FirstOrDefault(candidate => wrapper.ContainsKey(candidate));
            if (listKey is not null && wrapper[listKey] is JsonArray listed) return listed;
            wrapper[listKey ?? "itens"] = new JsonArray();
            return wrapper[listKey ?? "itens"]!.AsArray();
        }
        root[key] = new JsonArray();
        return root[key]!.AsArray();
    }
}
