using System.Text.Json;
using System.Text.Json.Nodes;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.GameRuns.Inventory;
using OdisseiaWiki.Models;

namespace OdisseiaWiki.GameRuns;

public static class GameStoryEffects
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private static int Number(JsonNode? value) => int.TryParse(value?.ToString(), out int number) ? number : 0;

    public static string? CannotPay(string snapshot, GameStoryCostDto cost)
    {
        if (GameStoryRules.ValidateCost(cost) is { } error) return error;
        var root = JsonNode.Parse(snapshot)!;
        var resources = root["status"]?["status"];
        if (Number(root["economy"]?["balance"]) < cost.Currency) return "Moedas insuficientes.";
        if (cost.Life > 0 && Number(resources?["vida"]) <= cost.Life) return "Vida insuficiente; o custo precisa deixar você vivo.";
        if (Number(resources?["mana"]) < cost.Mana) return "Mana insuficiente.";
        if (Number(resources?["estamina"]) < cost.Stamina) return "Estamina insuficiente.";
        return null;
    }

    public static string ConditionSource(GameStoryOutcomeDto outcome, string name, string? image, SistemaVersao version)
    {
        var origins = new JsonArray(outcome.Conditions.Select(condition => (JsonNode)new JsonObject {
            ["codigo"] = condition.Code, ["gatilho"] = "AO_USAR", ["alvo"] = "USUARIO",
            ["duracao"] = condition.Duration, ["unidadeDuracao"] = condition.DurationUnit, ["valor"] = condition.Value }).ToArray());
        string source = new JsonObject { ["inventario"] = new JsonArray(new JsonObject {
            ["id"] = "story-source", ["nome"] = name, ["imagem"] = image,
            ["atributos"] = new JsonObject { ["condicoes"] = origins } }) }.ToJsonString();
        for (int index = 0; index < outcome.Conditions.Count; index++)
        {
            var condition = outcome.Conditions[index];
            source = GameRunCarry.UpdateConditionOrigin(source, new() { Tipo = "ITEM", IdInstancia = "story-source",
                Indice = index, Codigo = condition.Code, Gatilho = "AO_USAR", Alvo = "USUARIO",
                Duracao = condition.Duration, UnidadeDuracao = condition.DurationUnit, Valor = condition.Value }, version);
        }
        return source;
    }

    public static string Apply(string snapshot, string nodeId, string name, string type, string choice, string? resultText,
        GameStoryCostDto cost, GameStoryOutcomeDto outcome, SistemaVersao version, string? image = null)
    {
        if (GameStoryRules.ValidateOutcome(outcome) is { } error) throw new InvalidOperationException(error);
        snapshot = GameRunCarry.Reconcile(snapshot, version);
        if (CannotPay(snapshot, cost) is { } reason) throw new InvalidOperationException(reason);
        var root = JsonNode.Parse(snapshot)!.AsObject();
        var journal = root["story"] as JsonArray ?? new JsonArray();
        if (journal.OfType<JsonObject>().Any(record => record["nodeId"]?.ToString() == nodeId && record["type"]?.ToString() == type))
            throw new InvalidOperationException("Esta escolha já foi concluída.");
        var resources = root["status"]!["status"]!.AsObject();
        var beforeResources = new[] { "vida", "mana", "estamina" }.Select(key => Number(resources[key])).ToArray();
        int beforeBalance = Number(root["economy"]?["balance"]);
        foreach (var (key, payment) in new[] { ("vida", cost.Life), ("mana", cost.Mana), ("estamina", cost.Stamina) })
            resources[key] = Math.Max(0, Number(resources[key]) - payment);
        // Paying can trigger published conditions (for example, exhausting mana) before a reward heals it.
        root = JsonNode.Parse(GameRunCarry.Reconcile(root.ToJsonString(), version))!.AsObject();
        resources = root["status"]!["status"]!.AsObject();
        foreach (var (key, amount) in new[] { ("vida", outcome.Life), ("mana", outcome.Mana), ("estamina", outcome.Stamina) })
        {
            int before = Number(resources[key]);
            int maximum = Math.Max(0, Number(resources[key + "Maxima"]));
            long change = outcome.Percentage ? (long)Math.Floor(maximum * (decimal)amount / 100) : amount;
            if (change > 0 && GameRunCarry.BlocksRecovery(root, version, key)) change = 0;
            int after = (int)Math.Clamp(before + change, 0, maximum);
            resources[key] = after;
        }
        var granted = new List<JsonObject>();
        foreach (var reward in outcome.Items)
        {
            var item = reward.Snapshot?.DeepClone().AsObject() ?? throw new InvalidOperationException("O item da recompensa não foi publicado.");
            if (item["tipo"]?.ToString() == "implante" && reward.Quantity != 1)
                throw new InvalidOperationException("Cada recompensa de prótese deve ter quantidade um.");
            item["id"] = Guid.NewGuid().ToString("D"); item["idItemBase"] = reward.ItemId; item["quantidade"] = reward.Quantity;
            GameRunInventory.ReadOrCreate(root, item["tipo"]?.ToString() == "implante" ? "implantes" : "inventario").Add(item.DeepClone());
            granted.Add(item);
        }
        var status = root["status"]!.AsObject();
        status["lootItensObtidos"] = checked(Number(status["lootItensObtidos"]) + outcome.Items.Sum(item => item.Quantity));
        var economy = root["economy"] as JsonObject ?? new JsonObject();
        if (root["economy"] is null) root["economy"] = economy;
        economy["balance"] = Number(economy["balance"]) - cost.Currency;
        if (root["story"] is null) root["story"] = journal;
        string updated = GameRunEconomy.Credit(root.ToJsonString(), outcome.Currency);
        updated = GameRunCarry.ApplyConsumedItemConditions(ConditionSource(outcome, name, image, version), updated, "story-source", version);
        if (outcome.GameMinutes > 0) updated = GameRunCarry.AdvanceGameTime(updated, outcome.GameMinutes, version);
        if (outcome.Xp > 0) updated = GameRunProgression.Apply(GameRunXpReward.Apply(updated, outcome.Xp), version).SnapshotJson;
        root = JsonNode.Parse(GameRunCarry.Reconcile(updated, version))!.AsObject();
        var deltas = new[] { "vida", "mana", "estamina" }.Select((key, index) =>
            Number(root["status"]!["status"]![key]) - beforeResources[index]).ToArray();
        root["story"]!.AsArray().Add(JsonSerializer.SerializeToNode(new GameStoryRecordDto(nodeId, name, type, choice, resultText,
            Number(root["economy"]?["balance"]) - beforeBalance, outcome.Xp, deltas[0], deltas[1], deltas[2], granted,
            outcome.Conditions.Select(condition => version.Condicoes.First(rule => rule.Codigo.Equals(condition.Code,
                StringComparison.OrdinalIgnoreCase)).Nome).ToArray()), JsonOptions));
        return root.ToJsonString();
    }
}
