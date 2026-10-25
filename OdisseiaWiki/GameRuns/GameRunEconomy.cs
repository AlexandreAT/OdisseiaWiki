using System.Text.Json;
using System.Text.Json.Nodes;
using System.Globalization;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.GameRuns.Inventory;

namespace OdisseiaWiki.GameRuns;

public sealed record GameRunSale(string Snapshot, IReadOnlyList<string> RemovedItemIds, long Total);

/// <summary>Economy of a single run. Never writes to the source character or catalogue.</summary>
public static class GameRunEconomy
{
    public static bool StashEnabled => true;
    public const string StashUnavailableMessage = "Depósito indisponível por enquanto.";
    private const int MaxBalance = 1_000_000_000;
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static bool CanAccessStash(GameRunMapDto map, string? selectedNodeId)
    {
        if (!StashEnabled) return false;
        GameRunMapNodeDto? current = selectedNodeId is null
            ? map.Nodes.Where(node => node.State == "CONCLUIDO" && node.Type != "INICIO").MaxBy(node => node.Layer)
            : map.Nodes.SingleOrDefault(node => node.Id == selectedNodeId && node.State == "SELECIONADO");
        return current?.Type is "BASE" or "VENDEDOR";
    }

    public static string Credit(string snapshot, int amount)
    {
        if (amount is < 0 or > MaxBalance) throw new InvalidOperationException("Recompensa em moeda inválida.");
        JsonObject root = JsonNode.Parse(snapshot)!.AsObject();
        JsonObject economy = Ensure(root);
        economy["balance"] = checked(Math.Min(MaxBalance, ReadBalance(economy) + (long)amount));
        return root.ToJsonString(JsonOptions);
    }

    public static string Buy(string snapshot, JsonObject itemSnapshot, string itemId, int price, bool toStash)
    {
        if (price is < 0 or > MaxBalance || string.IsNullOrWhiteSpace(itemId))
            throw new InvalidOperationException("Oferta inválida.");
        JsonObject root = JsonNode.Parse(snapshot)!.AsObject();
        JsonObject economy = Ensure(root);
        int balance = ReadBalance(economy);
        if (balance < price) throw new InvalidOperationException("Moeda insuficiente para esta compra.");
        JsonObject item = itemSnapshot.DeepClone().AsObject();
        item.Remove("id");
        item["id"] = Guid.NewGuid().ToString("D");
        item["idItemBase"] = itemId;
        item["quantidade"] = 1;
        string destination = item["tipo"]?.ToString() == "implante" ? "implantes" : "inventario";
        if (toStash) EnsureStash(economy).Add(item);
        else GameRunInventory.ReadOrCreate(root, destination).Add(item);
        economy["balance"] = balance - price;
        return root.ToJsonString(JsonOptions);
    }

    public static string Transfer(string snapshot, string itemId, bool toStash)
    {
        JsonObject root = JsonNode.Parse(snapshot)!.AsObject();
        JsonObject economy = Ensure(root);
        JsonArray stash = EnsureStash(economy);
        JsonArray? source = toStash ? FindInventory(root, itemId) : stash;
        int index = source is null ? -1 : FindIndex(source, itemId);
        if (index < 0) throw new InvalidOperationException("O item não está disponível para transferência.");
        JsonObject item = source![index]!.DeepClone().AsObject();
        source.RemoveAt(index);
        if (toStash) stash.Add(item);
        else GameRunInventory.ReadOrCreate(root, item["tipo"]?.ToString() == "implante" ? "implantes" : "inventario").Add(item);
        return root.ToJsonString(JsonOptions);
    }

    public static GameRunSale Sell(string snapshot, IReadOnlyList<GameRunVendorSaleLineDto> lines,
        int discountPercent, bool fromStash)
    {
        if (discountPercent is < 0 or > 100 || lines is null || lines.Count is < 1 or > 100 ||
            lines.Any(line => line is null || string.IsNullOrWhiteSpace(line.ItemId) ||
                line.ItemId.Length > 100 || line.Quantity is < 1 or > 1_000_000) ||
            lines.Select(line => line.ItemId).Distinct(StringComparer.Ordinal).Count() != lines.Count)
            throw new InvalidOperationException("Escolha itens e quantidades válidos para vender.");
        JsonObject root = JsonNode.Parse(snapshot)!.AsObject();
        JsonObject economy = Ensure(root);
        JsonArray[] sources = fromStash ? [EnsureStash(economy)] :
            [GameRunInventory.ReadOrCreate(root, "inventario"), GameRunInventory.ReadOrCreate(root, "implantes")];
        var selected = new List<(JsonArray Source, JsonObject Item, string Id, int Remaining)>();
        long total = 0;
        foreach (GameRunVendorSaleLineDto line in lines)
        {
            var matches = sources.SelectMany(source => source.OfType<JsonObject>()
                .Where(item => Field(item, "id")?.ToString() == line.ItemId)
                .Select(item => (Source: source, Item: item))).ToArray();
            if (matches.Length != 1)
                throw new InvalidOperationException("Um dos itens não está mais disponível para venda.");
            var match = matches[0];
            JsonNode? rawQuantity = Field(match.Item, "quantidade");
            int available = rawQuantity is null ? 1 : int.TryParse(rawQuantity.ToString(), out int count) ? count : 0;
            if (line.Quantity > available)
                throw new InvalidOperationException("A quantidade escolhida supera os itens disponíveis.");
            JsonNode? rawValue = Field(match.Item, "valor");
            decimal value = 0;
            if (rawValue is not null && !string.IsNullOrWhiteSpace(rawValue.ToString()) &&
                (!decimal.TryParse(rawValue.ToString(), NumberStyles.Number | NumberStyles.AllowExponent,
                    CultureInfo.InvariantCulture, out value) || value is < 0 or > MaxBalance))
                throw new InvalidOperationException("O valor de um dos itens está inválido.");
            // Round each unit once, exactly like the price shown in the shop.
            long unitPrice = (long)decimal.Floor(value * (100 - discountPercent) / 100);
            total = checked(total + unitPrice * line.Quantity);
            selected.Add((match.Source, match.Item, line.ItemId, available - line.Quantity));
        }
        long balance = ReadBalance(economy) + total;
        if (balance > MaxBalance)
            throw new InvalidOperationException("Esta venda ultrapassa o limite de moedas da run. Venda menos unidades.");
        var removed = new List<string>();
        foreach (var entry in selected)
        {
            if (entry.Remaining == 0) { entry.Source.Remove(entry.Item); removed.Add(entry.Id); }
            else
            {
                string key = entry.Item.Select(property => property.Key).FirstOrDefault(key =>
                    key.Equals("quantidade", StringComparison.OrdinalIgnoreCase)) ?? "quantidade";
                entry.Item[key] = entry.Remaining;
            }
        }
        economy["balance"] = balance;
        return new(root.ToJsonString(JsonOptions), removed, total);
    }

    private static JsonNode? Field(JsonObject source, string key) => source.FirstOrDefault(property =>
        property.Key.Equals(key, StringComparison.OrdinalIgnoreCase)).Value;

    private static JsonObject Ensure(JsonObject root)
    {
        if (root["economy"] is not JsonObject economy)
        {
            economy = new JsonObject { ["balance"] = 0, ["stash"] = new JsonArray() };
            root["economy"] = economy;
        }
        return economy;
    }

    private static int ReadBalance(JsonObject economy) =>
        int.TryParse(economy["balance"]?.ToString(), out int value) && value is >= 0 and <= MaxBalance
            ? value : throw new InvalidOperationException("O saldo da run está inválido.");

    private static JsonArray EnsureStash(JsonObject economy) => economy["stash"] as JsonArray
        ?? throw new InvalidOperationException("O depósito da run está inválido.");

    private static int FindIndex(JsonArray items, string itemId)
    {
        for (int index = 0; index < items.Count; index++)
            if (items[index]?["id"]?.ToString() == itemId) return index;
        return -1;
    }

    private static JsonArray? FindInventory(JsonObject root, string itemId)
    {
        foreach (string key in new[] { "inventario", "implantes" })
        {
            JsonArray inventory = GameRunInventory.ReadOrCreate(root, key);
            if (FindIndex(inventory, itemId) >= 0) return inventory;
        }
        return null;
    }

}
