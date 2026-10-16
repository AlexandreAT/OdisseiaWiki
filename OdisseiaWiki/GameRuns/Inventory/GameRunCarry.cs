using System.Globalization;
using System.Text.Json.Nodes;
using OdisseiaWiki.Models;

namespace OdisseiaWiki.GameRuns.Inventory;

public static class GameRunCarry
{
    public static string Drop(string snapshot, string itemId)
    {
        JsonObject root = JsonNode.Parse(snapshot)?.AsObject()
            ?? throw new InvalidOperationException("O estado da run está inválido.");
        JsonNode? inventory = root["inventario"];
        if (inventory is JsonValue value && value.TryGetValue<string>(out string? serialized) &&
            !string.IsNullOrWhiteSpace(serialized))
        {
            inventory = JsonNode.Parse(serialized);
            root["inventario"] = inventory;
        }
        JsonArray? items = inventory as JsonArray ?? new[] { "itens", "inventario", "items" }
            .Select(key => (inventory as JsonObject)?[key] as JsonArray).FirstOrDefault(array => array is not null);
        if (items is null) throw new InvalidOperationException("O item não está no inventário da run.");
        int[] matches = Enumerable.Range(0, items.Count).Where(index =>
            items[index] is JsonObject item && item["id"]?.ToString() == itemId).ToArray();
        if (matches.Length != 1) throw new InvalidOperationException("O item não está no inventário da run.");
        items.RemoveAt(matches[0]);
        return root.ToJsonString();
    }

    public static string Reconcile(string snapshot, SistemaVersao version)
    {
        JsonObject root = JsonNode.Parse(snapshot)?.AsObject()
            ?? throw new InvalidOperationException("O estado da run está inválido.");
        JsonObject resources = root["status"]?["status"]?.AsObject()
            ?? throw new InvalidOperationException("Os recursos da run estão inválidos.");
        decimal weight = Weight(root["inventario"]);
        JsonNode? capacityValue = resources["capacidadeCarga"];
        decimal capacity = Number(capacityValue);
        var heavy = version.Condicoes.FirstOrDefault(condition =>
            condition.Codigo.Equals("PESADO", StringComparison.OrdinalIgnoreCase) &&
            condition.CodigoRecursoGatilho == "EXCESSO_CARGA" &&
            condition.OperacaoEfeito == "REDUZIR_LIMITE_PERCENTUAL" &&
            condition.CodigoRecurso == "ESTAMINA");
        decimal reduction = Math.Clamp(heavy?.ValorEfeito ?? 0, 0, 100);
        bool overweight = capacityValue is not null && capacity >= 0 && weight > capacity;
        JsonObject carry = root["carga"] as JsonObject ?? new JsonObject();
        int currentMaximum = (int)Number(resources["estaminaMaxima"]);
        int baseMaximum = carry["estaminaMaximaBase"] is null
            ? currentMaximum : (int)Number(carry["estaminaMaximaBase"]);
        int previousReduction = (int)Number(carry["penalidadePercentual"]);
        int expected = (int)Math.Floor(baseMaximum * (100 - previousReduction) / 100m);
        if (currentMaximum != expected) baseMaximum = Math.Max(0, baseMaximum + currentMaximum - expected);
        int appliedReduction = overweight ? (int)reduction : 0;
        int effectiveMaximum = (int)Math.Floor(baseMaximum * (100 - appliedReduction) / 100m);
        resources["estaminaMaxima"] = effectiveMaximum;
        resources["estamina"] = Math.Min((int)Number(resources["estamina"]), effectiveMaximum);
        carry["pesoAtual"] = weight;
        carry["capacidade"] = capacity;
        carry["estaminaMaximaBase"] = baseMaximum;
        carry["penalidadePercentual"] = appliedReduction;
        carry["sobrecarregado"] = overweight;
        if (carry.Parent is null) root["carga"] = carry;
        return root.ToJsonString();
    }

    public static decimal Weight(JsonNode? raw)
    {
        if (raw is JsonValue value && value.TryGetValue<string>(out string? serialized) &&
            !string.IsNullOrWhiteSpace(serialized)) raw = JsonNode.Parse(serialized);
        JsonArray? items = raw as JsonArray ?? new[] { "itens", "inventario", "items" }
            .Select(key => (raw as JsonObject)?[key] as JsonArray).FirstOrDefault(array => array is not null);
        return items?.OfType<JsonObject>().Sum(item =>
            Math.Max(0, Number(item["peso"])) * (item["quantidade"] is null
                ? 1 : Math.Max(0, Number(item["quantidade"])))) ?? 0;
    }

    private static decimal Number(JsonNode? node) =>
        decimal.TryParse(node?.ToString(), NumberStyles.Number, CultureInfo.InvariantCulture,
            out decimal value) ? value : 0;
}
