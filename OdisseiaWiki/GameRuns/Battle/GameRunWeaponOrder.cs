using System.Text.Json;

namespace OdisseiaWiki.GameRuns.Battle;

/// <summary>Prioridade das armas da cópia da run; nunca reorganiza a ficha original.</summary>
public static class GameRunWeaponOrder
{
    public static IReadOnlyList<JsonElement> InventoryEntries(JsonElement? inventory)
    {
        if (inventory is not { } value) return [];
        if (value.ValueKind == JsonValueKind.Array) return value.EnumerateArray().ToArray();

        foreach (string key in new[] { "itens", "inventario", "items" })
        {
            JsonElement? entries = Property(value, key);
            if (entries?.ValueKind == JsonValueKind.Array && entries.Value.GetArrayLength() > 0)
                return entries.Value.EnumerateArray().ToArray();
        }
        return [];
    }

    public static IReadOnlyList<string> WeaponIds(JsonElement? inventory) =>
        InventoryEntries(inventory)
            .Where(item => item.ValueKind == JsonValueKind.Object &&
                string.Equals(ReadString(item, "tipo"), "arma", StringComparison.OrdinalIgnoreCase))
            .Select(item => ReadString(item, "id"))
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Select(id => id!)
            .ToArray();

    public static IReadOnlyList<string> Read(string? loadoutJson, JsonElement? inventory)
    {
        IReadOnlyList<string> ids = WeaponIds(inventory);
        if (string.IsNullOrWhiteSpace(loadoutJson)) return ids;

        using JsonDocument document = JsonDocument.Parse(loadoutJson);
        JsonElement? saved = Property(document.RootElement, "weaponOrder");
        if (saved?.ValueKind != JsonValueKind.Array) return ids;

        HashSet<string> available = ids.ToHashSet(StringComparer.Ordinal);
        HashSet<string> seen = new(StringComparer.Ordinal);
        List<string> order = [];
        foreach (JsonElement entry in saved.Value.EnumerateArray())
        {
            if (entry.ValueKind != JsonValueKind.String) continue;
            string? id = entry.GetString();
            if (id is not null && available.Contains(id) && seen.Add(id)) order.Add(id);
        }
        foreach (string id in ids)
            if (seen.Add(id)) order.Add(id);
        return order;
    }

    public static string Serialize(IReadOnlyList<string> ids) =>
        JsonSerializer.Serialize(new { schemaVersion = 1, weaponOrder = ids });

    private static JsonElement? Property(JsonElement source, string name)
    {
        if (source.ValueKind != JsonValueKind.Object) return null;
        foreach (JsonProperty property in source.EnumerateObject())
            if (string.Equals(property.Name, name, StringComparison.OrdinalIgnoreCase))
                return property.Value;
        return null;
    }

    private static string? ReadString(JsonElement source, string name)
    {
        JsonElement? value = Property(source, name);
        return value?.ValueKind switch
        {
            JsonValueKind.String => value.Value.GetString(),
            JsonValueKind.Number => value.Value.GetRawText(),
            _ => null,
        };
    }
}
