using System.Text.Json;
using System.Text.Json.Nodes;
using OdisseiaWiki.GameRuns.Inventory;

namespace OdisseiaWiki.GameRuns.Battle;

/// <summary>Copies only equipped defensive item values into a run, never into the original sheet.</summary>
public static class GameRunDefensiveEquipment
{
    public static GameBattleDefenses Bonuses(JsonElement? inventory)
    {
        if (inventory is { ValueKind: JsonValueKind.String } serialized &&
            !string.IsNullOrWhiteSpace(serialized.GetString()))
        {
            using JsonDocument parsed = JsonDocument.Parse(serialized.GetString()!);
            return Bonuses(parsed.RootElement);
        }
        long shield = 0, protection = 0, armor = 0;
        foreach (JsonElement item in GameRunWeaponOrder.InventoryEntries(inventory))
        {
            if (item.ValueKind != JsonValueKind.Object) continue;
            string? type = ReadText(item, "tipo");
            if (!string.Equals(type, "traje", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(type, "outro", StringComparison.OrdinalIgnoreCase)) continue;
            JsonElement? attributes = Property(item, "atributos");
            JsonElement? metadata = Property(attributes, "__vistaExplodida");
            JsonElement? remaining = Property(attributes, "__runDefenseRemaining");
            if (string.IsNullOrWhiteSpace(ReadText(metadata, "equippedSlot"))) continue;
            if (string.Equals(type, "traje", StringComparison.OrdinalIgnoreCase))
            {
                shield += ReadPositive(remaining, "escudo", ReadPositive(attributes, "escudoBase"));
                protection += ReadPositive(remaining, "protecao", ReadPositive(attributes, "protecaoBase"));
                armor += ReadPositive(attributes, "armaduraBase");
            }
            else
            {
                shield += ReadPositive(remaining, "escudo", ReadPositive(attributes, "escudo"));
                protection += ReadPositive(remaining, "protecao", ReadPositive(attributes, "protecao"));
                armor += ReadPositive(attributes, "armadura");
            }
        }
        return new GameBattleDefenses(Clamp(shield), Clamp(protection), Clamp(armor));
    }

    public static string AddInitialBonuses(string snapshotJson)
    {
        JsonObject root = JsonNode.Parse(snapshotJson) as JsonObject
            ?? throw new JsonException("O snapshot da run está inválido.");
        JsonElement? inventory = JsonSerializer.SerializeToElement(root["inventario"]);
        GameBattleDefenses bonus = Bonuses(inventory);
        if (bonus == new GameBattleDefenses()) return snapshotJson;
        JsonObject status = root["status"] as JsonObject
            ?? throw new JsonException("O status da run está inválido.");
        JsonObject defenses = status["defesas"] as JsonObject ?? new JsonObject();
        if (status["defesas"] is null) status["defesas"] = defenses;
        Add(defenses, "escudo", bonus.Shield);
        Add(defenses, "protecao", bonus.Protection);
        Add(defenses, "armadura", bonus.Armor);
        return root.ToJsonString();
    }

    public static string SetEquipped(string snapshotJson, string itemId, bool equipped)
    {
        JsonObject root = JsonNode.Parse(snapshotJson) as JsonObject
            ?? throw new JsonException("O snapshot da run está inválido.");
        JsonArray items = Items(root);
        JsonObject item = items.OfType<JsonObject>().SingleOrDefault(entry =>
            string.Equals(ReadNode(entry, "id")?.ToString(), itemId, StringComparison.Ordinal))
            ?? throw new InvalidOperationException("O item não pertence a esta run.");
        string? type = ReadNode(item, "tipo")?.ToString();
        if (type is null || !type.Equals("traje", StringComparison.OrdinalIgnoreCase) &&
            !type.Equals("outro", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Este item não fornece defesa equipável.");
        JsonObject attributes = ReadNode(item, "atributos") as JsonObject
            ?? throw new InvalidOperationException("Este item não possui atributos de defesa.");
        bool hasDefense = new[] { type.Equals("traje", StringComparison.OrdinalIgnoreCase)
            ? "escudoBase" : "escudo", type.Equals("traje", StringComparison.OrdinalIgnoreCase)
            ? "protecaoBase" : "protecao", type.Equals("traje", StringComparison.OrdinalIgnoreCase)
            ? "armaduraBase" : "armadura" }
            .Any(key => ReadInt(ReadNode(attributes, key)) > 0);
        if (!hasDefense) throw new InvalidOperationException("Este item não possui defesa configurada.");

        GameBattleDefenses before = Bonuses(JsonSerializer.SerializeToElement(items));
        JsonObject metadata = ReadNode(attributes, "__vistaExplodida") as JsonObject ?? new JsonObject();
        if (ReadNode(attributes, "__vistaExplodida") is null) attributes["__vistaExplodida"] = metadata;
        if (equipped) metadata["equippedSlot"] = "run-defense";
        else metadata.Remove("equippedSlot");
        GameBattleDefenses after = Bonuses(JsonSerializer.SerializeToElement(items));

        JsonObject status = ReadNode(root, "status") as JsonObject
            ?? throw new JsonException("O status da run está inválido.");
        JsonObject defenses = ReadNode(status, "defesas") as JsonObject ?? new JsonObject();
        if (ReadNode(status, "defesas") is null) status["defesas"] = defenses;
        Add(defenses, "escudo", after.Shield - before.Shield);
        Add(defenses, "protecao", after.Protection - before.Protection);
        Add(defenses, "armadura", after.Armor - before.Armor);
        return root.ToJsonString();
    }

    public static bool IsEquipped(string snapshotJson, string itemId)
    {
        JsonObject root = JsonNode.Parse(snapshotJson) as JsonObject
            ?? throw new JsonException("O snapshot da run está inválido.");
        JsonObject item = Items(root).OfType<JsonObject>().SingleOrDefault(entry =>
            string.Equals(ReadNode(entry, "id")?.ToString(), itemId, StringComparison.Ordinal))
            ?? throw new InvalidOperationException("O item não pertence a esta run.");
        JsonObject? attributes = ReadNode(item, "atributos") as JsonObject;
        JsonObject? metadata = ReadNode(attributes, "__vistaExplodida") as JsonObject;
        return !string.IsNullOrWhiteSpace(ReadNode(metadata, "equippedSlot")?.ToString());
    }

    public static (string Snapshot, int Repaired) RestoreProtectionAtBase(string snapshotJson)
    {
        JsonObject root = JsonNode.Parse(snapshotJson) as JsonObject
            ?? throw new JsonException("O snapshot da run está inválido.");
        if (ReadNode(root, "inventario") is null) return (snapshotJson, 0);
        JsonArray items = Items(root);
        GameBattleDefenses before = Bonuses(JsonSerializer.SerializeToElement(items));
        long repaired = 0;
        foreach (JsonObject item in items.OfType<JsonObject>())
        {
            string? type = ReadNode(item, "tipo")?.ToString();
            bool outfit = string.Equals(type, "traje", StringComparison.OrdinalIgnoreCase);
            if (!outfit && !string.Equals(type, "outro", StringComparison.OrdinalIgnoreCase)) continue;
            JsonObject? attributes = ReadNode(item, "atributos") as JsonObject;
            if (attributes is null) continue;
            int original = ReadInt(ReadNode(attributes, outfit ? "protecaoBase" : "protecao"));
            if (original <= 0) continue;
            JsonObject? remaining = ReadNode(attributes, "__runDefenseRemaining") as JsonObject;
            int current = remaining is null || ReadNode(remaining, "protecao") is null
                ? original : Math.Min(original, ReadInt(ReadNode(remaining, "protecao")));
            if (current >= original) continue;
            remaining ??= new JsonObject();
            if (ReadNode(attributes, "__runDefenseRemaining") is null)
                attributes["__runDefenseRemaining"] = remaining;
            remaining["protecao"] = original;
            repaired += original - current;
        }
        if (repaired == 0) return (snapshotJson, 0);
        GameBattleDefenses after = Bonuses(JsonSerializer.SerializeToElement(items));
        JsonObject status = ReadNode(root, "status") as JsonObject
            ?? throw new JsonException("O status da run está inválido.");
        JsonObject defenses = ReadNode(status, "defesas") as JsonObject ?? new JsonObject();
        if (ReadNode(status, "defesas") is null) status["defesas"] = defenses;
        Add(defenses, "protecao", after.Protection - before.Protection);
        return (root.ToJsonString(), Clamp(repaired));
    }

    public static string UnequipIfNeeded(string snapshotJson, string itemId)
    {
        JsonObject? root = JsonNode.Parse(snapshotJson) as JsonObject;
        if (root is null) return snapshotJson;
        JsonObject? item = Items(root).OfType<JsonObject>().FirstOrDefault(entry =>
            string.Equals(ReadNode(entry, "id")?.ToString(), itemId, StringComparison.Ordinal));
        JsonObject? attributes = ReadNode(item, "atributos") as JsonObject;
        JsonObject? metadata = ReadNode(attributes, "__vistaExplodida") as JsonObject;
        return string.IsNullOrWhiteSpace(ReadNode(metadata, "equippedSlot")?.ToString())
            ? snapshotJson : SetEquipped(snapshotJson, itemId, false);
    }

    public static string RemoveMissingBonuses(string beforeJson, string afterJson)
    {
        JsonObject before = JsonNode.Parse(beforeJson) as JsonObject
            ?? throw new JsonException("O snapshot anterior está inválido.");
        JsonObject after = JsonNode.Parse(afterJson) as JsonObject
            ?? throw new JsonException("O snapshot atualizado está inválido.");
        GameBattleDefenses previous = Bonuses(JsonSerializer.SerializeToElement(ReadNode(before, "inventario")));
        GameBattleDefenses current = Bonuses(JsonSerializer.SerializeToElement(ReadNode(after, "inventario")));
        JsonObject? status = ReadNode(after, "status") as JsonObject;
        JsonObject? defenses = ReadNode(status, "defesas") as JsonObject;
        if (defenses is null) return afterJson;
        Add(defenses, "escudo", Math.Min(0, current.Shield - previous.Shield));
        Add(defenses, "protecao", Math.Min(0, current.Protection - previous.Protection));
        Add(defenses, "armadura", Math.Min(0, current.Armor - previous.Armor));
        return after.ToJsonString();
    }

    public static void RecordSpentDefenses(JsonObject root, int shieldSpent, int protectionSpent)
    {
        if (shieldSpent <= 0 && protectionSpent <= 0) return;
        if (ReadNode(root, "inventario") is null) return;
        foreach (JsonObject item in Items(root).OfType<JsonObject>())
        {
            JsonObject? attributes = ReadNode(item, "atributos") as JsonObject;
            JsonObject? metadata = ReadNode(attributes, "__vistaExplodida") as JsonObject;
            if (string.IsNullOrWhiteSpace(ReadNode(metadata, "equippedSlot")?.ToString())) continue;
            string? type = ReadNode(item, "tipo")?.ToString();
            if (!string.Equals(type, "traje", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(type, "outro", StringComparison.OrdinalIgnoreCase)) continue;
            bool outfit = string.Equals(type, "traje", StringComparison.OrdinalIgnoreCase);
            string shieldField = outfit ? "escudoBase" : "escudo";
            string protectionField = outfit ? "protecaoBase" : "protecao";
            JsonObject remaining = ReadNode(attributes, "__runDefenseRemaining") as JsonObject ?? new JsonObject();
            if (ReadNode(attributes, "__runDefenseRemaining") is null)
                attributes!["__runDefenseRemaining"] = remaining;
            int availableShield = ReadNode(remaining, "escudo") is null
                ? ReadInt(ReadNode(attributes, shieldField)) : ReadInt(ReadNode(remaining, "escudo"));
            int availableProtection = ReadNode(remaining, "protecao") is null
                ? ReadInt(ReadNode(attributes, protectionField)) : ReadInt(ReadNode(remaining, "protecao"));
            int spentShield = Math.Min(shieldSpent, availableShield);
            int spentProtection = Math.Min(protectionSpent, availableProtection);
            remaining["escudo"] = availableShield - spentShield;
            remaining["protecao"] = availableProtection - spentProtection;
            shieldSpent -= spentShield;
            protectionSpent -= spentProtection;
            if (shieldSpent == 0 && protectionSpent == 0) break;
        }
    }

    private static JsonArray Items(JsonObject root) => GameRunInventory.ReadOrCreate(root, "inventario");

    private static JsonNode? ReadNode(JsonObject? source, string name) => source?.FirstOrDefault(entry =>
        string.Equals(entry.Key, name, StringComparison.OrdinalIgnoreCase)).Value;

    private static int ReadInt(JsonNode? node) => int.TryParse(node?.ToString(), out int value)
        ? Math.Max(0, value) : 0;

    private static void Add(JsonObject defenses, string key, int bonus)
    {
        int current = int.TryParse(defenses[key]?.ToString(), out int value) ? Math.Max(0, value) : 0;
        defenses[key] = Clamp((long)current + bonus);
    }

    private static int Clamp(long value) => (int)Math.Min(int.MaxValue, Math.Max(0, value));

    private static int ReadPositive(JsonElement? source, string name, int fallback = 0)
    {
        JsonElement? value = Property(source, name);
        if (value is { ValueKind: JsonValueKind.Number } && value.Value.TryGetInt32(out int number))
            return Math.Max(0, number);
        if (value is { ValueKind: JsonValueKind.String } &&
            int.TryParse(value.Value.GetString(), System.Globalization.NumberStyles.Integer,
                System.Globalization.CultureInfo.InvariantCulture, out number))
            return Math.Max(0, number);
        return fallback;
    }

    private static string? ReadText(JsonElement? source, string name)
    {
        JsonElement? value = Property(source, name);
        return value is { ValueKind: JsonValueKind.String } ? value.Value.GetString() : null;
    }

    private static JsonElement? Property(JsonElement? source, string name)
    {
        if (source is not { ValueKind: JsonValueKind.Object } value) return null;
        foreach (JsonProperty property in value.EnumerateObject())
            if (string.Equals(property.Name, name, StringComparison.OrdinalIgnoreCase))
                return property.Value;
        return null;
    }
}
