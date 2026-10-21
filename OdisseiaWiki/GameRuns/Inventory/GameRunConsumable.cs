using System.Globalization;
using System.Text.Json;
using System.Text.Json.Nodes;
using OdisseiaWiki.Models;
using OdisseiaWiki.Services.Helpers;

namespace OdisseiaWiki.GameRuns.Inventory;

public sealed record GameRunConsumableEffect(
    string SnapshotJson, string ItemName, int RemainingQuantity,
    int LifeRestored, int ManaRestored, int StaminaRestored)
{
    public bool ClearsConditionsOnCure { get; init; }
}

public sealed class GameRunConsumableException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}

public static class GameRunConsumable
{
    public static int AvailableQuantity(JsonElement? inventory, string itemId)
    {
        if (inventory is null) return 0;
        var root = new JsonObject { ["inventario"] = JsonNode.Parse(inventory.Value.GetRawText()) };
        return ReadStack(root, itemId).TotalQuantity;
    }

    public static string SpendInBattle(string snapshotJson, string itemId, int quantity)
    {
        if (quantity < 1) throw Invalid("A quantidade consumida é inválida.");
        JsonObject root = JsonNode.Parse(snapshotJson) as JsonObject
            ?? throw Invalid("O estado da run está inválido.");
        StackSelection stack = ReadStack(root, itemId);
        if (stack.TotalQuantity < quantity) throw Missing();
        Spend(stack, quantity);
        return root.ToJsonString();
    }

    public static GameRunConsumableEffect Use(string snapshotJson, string itemId, int useQuantity = 1,
        SistemaVersao? version = null)
    {
        JsonObject root = JsonNode.Parse(snapshotJson) as JsonObject
            ?? throw Invalid("O estado da run está inválido.");
        StackSelection stack = ReadStack(root, itemId);
        JsonObject selected = stack.Selected;
        string? itemType = Find(selected, "tipo")?.ToString();
        if (!string.Equals(itemType, "consumiveis", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(itemType, "outro", StringComparison.OrdinalIgnoreCase))
            throw Invalid("Este item não é consumível.");

        if (useQuantity is < 1 or > 100) throw Invalid("Escolha de 1 a 100 unidades para usar.");
        int totalQuantity = stack.TotalQuantity;
        if (totalQuantity < useQuantity) throw Missing();
        JsonObject? attributes = Find(selected, "atributos") as JsonObject;
        JsonObject? restore = Find(attributes, "restaura") as JsonObject;
        if (attributes?["condicoes"] is JsonArray targetConditions &&
            targetConditions.OfType<JsonObject>().Any(condition =>
                condition["gatilho"]?.ToString().Equals("AO_USAR", StringComparison.OrdinalIgnoreCase) == true &&
                condition["alvo"] is not null &&
                !condition["alvo"]!.ToString().Equals("USUARIO", StringComparison.OrdinalIgnoreCase)))
            throw Invalid("Esta ação exige escolher um alvo em combate; não pode ser consumida na mochila.");
        bool hasExecutableCondition = attributes?["condicoes"] is JsonArray conditions &&
            conditions.OfType<JsonObject>().Any(condition =>
                condition["gatilho"]?.ToString().Equals("AO_USAR", StringComparison.OrdinalIgnoreCase) == true &&
                version?.Condicoes.Any(rule =>
                    rule.Codigo.Equals(condition["codigo"]?.ToString(), StringComparison.OrdinalIgnoreCase) &&
                    SistemaCondicaoEfeitos.Read(rule).Count > 0) == true);
        if (restore is null && !string.Equals(itemType, "outro", StringComparison.OrdinalIgnoreCase) &&
            !hasExecutableCondition)
            throw Invalid("Este consumível não possui cura configurada.");

        int lifeAmount = string.Equals(itemType, "outro", StringComparison.OrdinalIgnoreCase)
            ? ReadAmount(attributes, "recuperacaoVida") : ReadAmount(restore, "vida");
        int manaAmount = string.Equals(itemType, "outro", StringComparison.OrdinalIgnoreCase)
            ? ReadAmount(attributes, "recuperacaoMana") : ReadAmount(restore, "mana");
        int staminaAmount = string.Equals(itemType, "outro", StringComparison.OrdinalIgnoreCase)
            ? ReadAmount(attributes, "recuperacaoEstamina") : ReadAmount(restore, "estamina");
        bool clearsConditionsOnCure = lifeAmount > 0 && version is not null &&
            Find(root["status"] as JsonObject, "condicoesJogo") is JsonArray activeConditions &&
            activeConditions.OfType<JsonObject>().Any(condition => version.Condicoes.Any(rule =>
                rule.Codigo.Equals(condition["rule"]?["code"]?.ToString(), StringComparison.OrdinalIgnoreCase) &&
                SistemaCondicaoRemocao.AoCurar(rule)));
        if (lifeAmount == 0 && manaAmount == 0 && staminaAmount == 0 && !hasExecutableCondition)
            throw Invalid("Este consumível não possui cura configurada.");

        JsonObject? status = Find(root, "status") as JsonObject;
        JsonObject? resources = Find(status, "status") as JsonObject;
        if (resources is null) throw Invalid("Os recursos da run estão indisponíveis.");

        int life = version is not null && GameRunCarry.BlocksRecovery(root, version, "VIDA") ? 0 :
            Recover(resources, "vida", "vidaMaxima", (int)Math.Min((long)lifeAmount * useQuantity, int.MaxValue));
        int mana = version is not null && GameRunCarry.BlocksRecovery(root, version, "MANA") ? 0 :
            Recover(resources, "mana", "manaMaxima", (int)Math.Min((long)manaAmount * useQuantity, int.MaxValue));
        int stamina = version is not null && GameRunCarry.BlocksRecovery(root, version, "ESTAMINA") ? 0 :
            Recover(resources, "estamina", "estaminaMaxima", (int)Math.Min((long)staminaAmount * useQuantity, int.MaxValue));
        if (life == 0 && mana == 0 && stamina == 0 && !hasExecutableCondition && !clearsConditionsOnCure)
            throw new GameRunConsumableException("RECURSOS_CHEIOS", "Vida, mana e estamina já estão no limite.");

        string itemName = Find(selected, "nome")?.ToString() ?? "Consumível";
        Spend(stack, useQuantity);

        return new GameRunConsumableEffect(root.ToJsonString(),
            itemName, totalQuantity - useQuantity,
            life, mana, stamina) { ClearsConditionsOnCure = clearsConditionsOnCure };
    }

    private sealed record StackSelection(JsonObject Selected, JsonArray Items, int[] Indices, int TotalQuantity);

    private static StackSelection ReadStack(JsonObject root, string itemId)
    {
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
        if (matches.Length != 1 || items[matches[0]] is not JsonObject selected) throw Missing();
        string? baseId = Find(selected, "idItemBase")?.ToString();
        int[] matchingStack = Enumerable.Range(0, items.Count).Where(index => items[index] is JsonObject item &&
            (index == matches[0] ||
                string.Equals(Find(item, "idItemBase")?.ToString(), baseId, StringComparison.Ordinal) &&
                string.Equals(Find(item, "tipo")?.ToString(), Find(selected, "tipo")?.ToString(), StringComparison.OrdinalIgnoreCase) &&
                string.Equals(Find(item, "nome")?.ToString(), Find(selected, "nome")?.ToString(), StringComparison.Ordinal) &&
                string.Equals(Find(item, "imagem")?.ToString(), Find(selected, "imagem")?.ToString(), StringComparison.Ordinal) &&
                JsonNode.DeepEquals(Find(item, "valor"), Find(selected, "valor")) &&
                JsonNode.DeepEquals(MechanicalAttributes(item), MechanicalAttributes(selected)))).ToArray();
        int total = matchingStack.Sum(index => ReadInt(Find((JsonObject)items[index]!, "quantidade"), 1));
        return new StackSelection(selected, items, matchingStack, total);
    }

    private static void Spend(StackSelection stack, int quantity)
    {
        int remaining = quantity;
        foreach (int index in stack.Indices.OrderByDescending(index => index))
        {
            JsonObject item = (JsonObject)stack.Items[index]!;
            int available = ReadInt(Find(item, "quantidade"), 1);
            int consumed = Math.Min(available, remaining);
            if (available == consumed) stack.Items.RemoveAt(index);
            else Set(item, "quantidade", available - consumed);
            remaining -= consumed;
            if (remaining == 0) break;
        }
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
