using System.Globalization;
using System.Text.Json.Nodes;

namespace OdisseiaWiki.GameRuns.Inventory;

public sealed record GameRunConsumableEffect(
    string SnapshotJson, string ItemName, int RemainingQuantity,
    int LifeRestored, int ManaRestored, int StaminaRestored);

public sealed class GameRunConsumableException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}

public static class GameRunConsumable
{
    public static GameRunConsumableEffect Use(string snapshotJson, string itemId, int useQuantity = 1)
    {
        JsonObject root = JsonNode.Parse(snapshotJson) as JsonObject
            ?? throw Invalid("O estado da run está inválido.");
        JsonNode? inventory = Find(root, "inventario");
        if (inventory is JsonValue serializedInventory &&
            serializedInventory.TryGetValue<string>(out string? inventoryJson) &&
            !string.IsNullOrWhiteSpace(inventoryJson))
        {
            inventory = JsonNode.Parse(inventoryJson);
            root["inventario"] = inventory;
        }
        JsonArray? items = inventory as JsonArray
            ?? Find(inventory as JsonObject, "itens") as JsonArray
            ?? Find(inventory as JsonObject, "inventario") as JsonArray
            ?? Find(inventory as JsonObject, "items") as JsonArray;
        if (items is null) throw Missing();

        int[] matches = Enumerable.Range(0, items.Count).Where(index =>
            items[index] is JsonObject item &&
            string.Equals(Find(item, "id")?.ToString(), itemId, StringComparison.Ordinal)).ToArray();
        if (matches.Length != 1 || items[matches[0]] is not JsonObject selected)
            throw Missing();
        string? itemType = Find(selected, "tipo")?.ToString();
        if (!string.Equals(itemType, "consumiveis", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(itemType, "outro", StringComparison.OrdinalIgnoreCase))
            throw Invalid("Este item não é consumível.");

        if (useQuantity is < 1 or > 100) throw Invalid("Escolha de 1 a 100 unidades para usar.");
        string? baseId = Find(selected, "idItemBase")?.ToString();
        int[] stack = Enumerable.Range(0, items.Count).Where(index => items[index] is JsonObject item &&
            (index == matches[0] ||
                string.Equals(Find(item, "idItemBase")?.ToString(), baseId, StringComparison.Ordinal) &&
                string.Equals(Find(item, "tipo")?.ToString(), itemType, StringComparison.OrdinalIgnoreCase) &&
                string.Equals(Find(item, "nome")?.ToString(), Find(selected, "nome")?.ToString(), StringComparison.Ordinal) &&
                string.Equals(Find(item, "imagem")?.ToString(), Find(selected, "imagem")?.ToString(), StringComparison.Ordinal) &&
                JsonNode.DeepEquals(Find(item, "valor"), Find(selected, "valor")) &&
                JsonNode.DeepEquals(MechanicalAttributes(item), MechanicalAttributes(selected)))).ToArray();
        int totalQuantity = stack.Sum(index => ReadInt(Find((JsonObject)items[index]!, "quantidade"), 1));
        if (totalQuantity < useQuantity) throw Missing();
        JsonObject? attributes = Find(selected, "atributos") as JsonObject;
        JsonObject? restore = Find(attributes, "restaura") as JsonObject;
        if (restore is null && !string.Equals(itemType, "outro", StringComparison.OrdinalIgnoreCase))
            throw Invalid("Este consumível não possui cura configurada.");

        int lifeAmount = string.Equals(itemType, "outro", StringComparison.OrdinalIgnoreCase)
            ? ReadAmount(attributes, "recuperacaoVida") : ReadAmount(restore, "vida");
        int manaAmount = string.Equals(itemType, "outro", StringComparison.OrdinalIgnoreCase)
            ? ReadAmount(attributes, "recuperacaoMana") : ReadAmount(restore, "mana");
        int staminaAmount = string.Equals(itemType, "outro", StringComparison.OrdinalIgnoreCase)
            ? ReadAmount(attributes, "recuperacaoEstamina") : ReadAmount(restore, "estamina");
        if (lifeAmount == 0 && manaAmount == 0 && staminaAmount == 0)
            throw Invalid("Este consumível não possui cura configurada.");

        JsonObject? status = Find(root, "status") as JsonObject;
        JsonObject? resources = Find(status, "status") as JsonObject;
        if (resources is null) throw Invalid("Os recursos da run estão indisponíveis.");

        int life = Recover(resources, "vida", "vidaMaxima", (int)Math.Min((long)lifeAmount * useQuantity, int.MaxValue));
        int mana = Recover(resources, "mana", "manaMaxima", (int)Math.Min((long)manaAmount * useQuantity, int.MaxValue));
        int stamina = Recover(resources, "estamina", "estaminaMaxima", (int)Math.Min((long)staminaAmount * useQuantity, int.MaxValue));
        if (life == 0 && mana == 0 && stamina == 0)
            throw new GameRunConsumableException("RECURSOS_CHEIOS", "Vida, mana e estamina já estão no limite.");

        string itemName = Find(selected, "nome")?.ToString() ?? "Consumível";
        int toConsume = useQuantity;
        foreach (int index in stack.OrderByDescending(index => index))
        {
            JsonObject item = (JsonObject)items[index]!;
            int quantity = ReadInt(Find(item, "quantidade"), 1);
            int consumed = Math.Min(quantity, toConsume);
            if (quantity == consumed) items.RemoveAt(index);
            else Set(item, "quantidade", quantity - consumed);
            toConsume -= consumed;
            if (toConsume == 0) break;
        }

        return new GameRunConsumableEffect(root.ToJsonString(),
            itemName, totalQuantity - useQuantity,
            life, mana, stamina);
    }

    private static int Recover(JsonObject resources, string field, string maximumField, int amount)
    {
        if (amount == 0) return 0;
        int current = ReadInt(Find(resources, field), 0);
        int maximum = ReadInt(Find(resources, maximumField), current);
        if (current < 0 || maximum < 0)
            throw Invalid("Os recursos da run estão inválidos.");
        maximum = Math.Max(current, maximum);
        int restored = Math.Min(amount, maximum - current);
        Set(resources, field, current + restored);
        return restored;
    }

    private static int ReadAmount(JsonObject? restore, string field)
    {
        JsonNode? node = Find(restore, field);
        if (node is null) return 0;
        if (!decimal.TryParse(node.ToString(), NumberStyles.Number, CultureInfo.InvariantCulture, out decimal amount) ||
            amount < 0 || amount > int.MaxValue)
            throw Invalid("A cura configurada neste item é inválida.");
        return decimal.ToInt32(decimal.Truncate(amount));
    }

    private static int ReadInt(JsonNode? node, int fallback)
    {
        if (node is null) return fallback;
        if (!int.TryParse(node.ToString(), NumberStyles.Integer, CultureInfo.InvariantCulture, out int value))
            throw Invalid("O estado do consumível ou dos recursos está inválido.");
        return value;
    }

    private static JsonNode? Find(JsonObject? source, string key) => source is null ? null :
        source.FirstOrDefault(entry => string.Equals(entry.Key, key, StringComparison.OrdinalIgnoreCase)).Value;

    private static JsonNode? MechanicalAttributes(JsonObject item)
    {
        JsonNode? attributes = Find(item, "atributos")?.DeepClone();
        if (attributes is JsonObject objectAttributes)
        {
            string? visualKey = objectAttributes.Select(entry => entry.Key).FirstOrDefault(key =>
                key.Equals("__vistaExplodida", StringComparison.OrdinalIgnoreCase));
            if (visualKey is not null) objectAttributes.Remove(visualKey);
        }
        return attributes;
    }

    private static void Set(JsonObject source, string key, int value)
    {
        string name = source.Select(entry => entry.Key)
            .FirstOrDefault(existing => string.Equals(existing, key, StringComparison.OrdinalIgnoreCase)) ?? key;
        source[name] = value;
    }

    private static GameRunConsumableException Missing() =>
        new("ITEM_INDISPONIVEL", "Este consumível não está mais no inventário da run.");

    private static GameRunConsumableException Invalid(string message) =>
        new("ITEM_INVALIDO", message);
}
