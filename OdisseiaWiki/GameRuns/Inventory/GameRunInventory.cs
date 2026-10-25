using System.Text.Json.Nodes;

namespace OdisseiaWiki.GameRuns.Inventory;

/// <summary>Preserves the supported legacy inventory envelopes when adding or moving run items.</summary>
public static class GameRunInventory
{
    public static JsonArray ReadOrCreate(JsonObject root, string key)
    {
        key = root.Select(entry => entry.Key).FirstOrDefault(candidate =>
            candidate.Equals(key, StringComparison.OrdinalIgnoreCase)) ?? key;
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
            string? listKey = wrapper.Select(entry => entry.Key).FirstOrDefault(candidate =>
                new[] { "itens", "inventario", "items", "implantes", "proteses" }
                    .Contains(candidate, StringComparer.OrdinalIgnoreCase));
            if (listKey is not null && wrapper[listKey] is JsonArray listed) return listed;
            wrapper[listKey ?? "itens"] = new JsonArray();
            return wrapper[listKey ?? "itens"]!.AsArray();
        }
        root[key] = new JsonArray();
        return root[key]!.AsArray();
    }
}
