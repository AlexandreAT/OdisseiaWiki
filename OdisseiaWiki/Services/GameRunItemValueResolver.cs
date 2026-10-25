using System.Globalization;
using System.Text.Json;
using System.Text.Json.Nodes;
using OdisseiaWiki.GameRuns.Inventory;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;

namespace OdisseiaWiki.Services;

/// <summary>Fills only missing copy prices, never replacing an explicit price (including zero).</summary>
public sealed class GameRunItemValueResolver(IGameModeManagementRepository catalogue)
{
    public async Task<string> ResolveAsync(string snapshot, GameModeVersion mode, CancellationToken token)
    {
        JsonObject root = JsonNode.Parse(snapshot)!.AsObject();
        var items = new List<JsonObject>();
        foreach (string key in new[] { "inventario", "implantes" })
            if (Field(root, key) is not null)
                items.AddRange(GameRunInventory.ReadOrCreate(root, key).OfType<JsonObject>());
        if (Field(Field(root, "economy") as JsonObject, "stash") is JsonArray stash)
            items.AddRange(stash.OfType<JsonObject>());
        if (Field(Field(root, "loot") as JsonObject, "rewards") is JsonArray rewards)
            items.AddRange(rewards.OfType<JsonObject>());
        JsonObject[] missing = items.Where(item => string.IsNullOrWhiteSpace(Field(item, "valor")?.ToString())).ToArray();
        if (missing.Length == 0) return snapshot;

        var prices = new Dictionary<string, decimal>(StringComparer.Ordinal);
        // Published prices take precedence over a catalogue edited after publication.
        ReadPublishedPrices(JsonNode.Parse(mode.ConfiguracaoJson), prices);
        if (missing.Any(item => !prices.ContainsKey(SourceId(item))))
        {
            IReadOnlyList<Item> effective = await catalogue.GetLootItemsAsync(mode.IdMesa, mode.IdSistemaVersao, token);
            foreach (Item item in effective.Where(item => item.Visivel && item.Valor is >= 0 and <= 1_000_000_000))
            {
                prices.TryAdd(item.Iditem, item.Valor!.Value);
                // The effective catalogue already excludes originals replaced by this Mesa's copy.
                if (!string.IsNullOrWhiteSpace(item.IdOrigemGlobal))
                    prices.TryAdd(item.IdOrigemGlobal, item.Valor.Value);
            }
        }
        bool changed = false;
        foreach (JsonObject item in missing)
            if (prices.TryGetValue(SourceId(item), out decimal value))
            {
                string key = item.Select(property => property.Key).FirstOrDefault(key =>
                    key.Equals("valor", StringComparison.OrdinalIgnoreCase)) ?? "valor";
                item[key] = value;
                changed = true;
            }
        return changed ? root.ToJsonString(new JsonSerializerOptions(JsonSerializerDefaults.Web)) : snapshot;
    }

    private static string SourceId(JsonObject item)
    {
        string? source = Field(item, "idItemBase")?.ToString();
        return string.IsNullOrWhiteSpace(source) ? Field(item, "id")?.ToString() ?? "" : source;
    }

    private static JsonNode? Field(JsonObject? item, string key) => item?.FirstOrDefault(property =>
        property.Key.Equals(key, StringComparison.OrdinalIgnoreCase)).Value;

    private static void ReadPublishedPrices(JsonNode? node, Dictionary<string, decimal> prices)
    {
        if (node is JsonArray array)
            foreach (JsonNode? child in array) ReadPublishedPrices(child, prices);
        else if (node is JsonObject entry)
        {
            string? id = Field(entry, "itemId")?.ToString();
            if (!string.IsNullOrWhiteSpace(id) && Field(entry, "snapshot") is JsonObject item &&
                decimal.TryParse(Field(item, "valor")?.ToString(), NumberStyles.Number | NumberStyles.AllowExponent,
                    CultureInfo.InvariantCulture, out decimal value) && value is >= 0 and <= 1_000_000_000)
                prices.TryAdd(id, value);
            foreach (JsonNode? child in entry.Select(property => property.Value)) ReadPublishedPrices(child, prices);
        }
    }
}
