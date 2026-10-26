using System.Text.Json;
using System.Text.Json.Nodes;
using System.ComponentModel.DataAnnotations;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.GameRuns.Inventory;
using OdisseiaWiki.Models;
using OdisseiaWiki.Services.Helpers;

namespace OdisseiaWiki.GameRuns;

/// <summary>Paid changes to run copies only. Never accepts prices/modifiers from a command.</summary>
public static class GameRunNpcServices
{
    public static void ValidateSpell(GameModeVendorOfferDto offer, SistemaVersao version)
    {
        var spell = offer.Snapshot ?? throw new InvalidOperationException("Crie a magia do Sábio.");
        if (string.IsNullOrWhiteSpace(spell["nome"]?.ToString()) || spell["nome"]!.ToString().Length > 100 ||
            spell["imagem"]?.ToString().Length > 500 || spell["tipo"]?.ToString() is not ("ataque" or "suporte"))
            throw new InvalidOperationException("Preencha nome, tipo e imagem válida da magia do Sábio.");
        if (spell["atributos"] is not JsonObject attributes)
            throw new InvalidOperationException("Configure os efeitos da magia.");
        foreach (string key in new[] { "dano", "custoMana", "custoEstamina", "cooldownTurnos", "recuperacaoVida", "recuperacaoMana", "recuperacaoEstamina" })
            if (attributes[key] is { } value && (!int.TryParse(value.ToString(), out int number) || number is < 0 or > 1000000))
                throw new InvalidOperationException($"{spell["nome"]}: use um valor inteiro de 0 a 1.000.000 em {key}.");
        if (!int.TryParse(attributes["limiteAtaquesPorTurno"]?.ToString() ?? "1", out int limit) || limit is < 1 or > 100)
            throw new InvalidOperationException("A magia permite de 1 a 100 ataques por turno.");
        if (attributes["teste"] is JsonObject && new[] { "recuperacaoVida", "recuperacaoMana", "recuperacaoEstamina" }
            .Any(key => int.TryParse(attributes[key]?.ToString(), out int amount) && amount > 0))
            throw new InvalidOperationException("Para recuperar recursos diretamente, desmarque 'Esta ação exige teste'. Para cura com acerto, use uma condição de recuperação.");
        if (attributes["cooldownTurnos"] is { } cooldown && int.Parse(cooldown.ToString()) > 0)
        {
            if (int.Parse(cooldown.ToString()) > 100) throw new InvalidOperationException("Use de 0 a 100 turnos de cooldown.");
            if (version.SkillConfig?.UsaCooldown != true)
                throw new InvalidOperationException("Ative cooldown de poderes no Sistema antes de usá-lo nesta magia.");
        }
        if (attributes["condicoes"] is JsonArray conditions)
        {
            if (conditions.Count > 100) throw new InvalidOperationException("Use até 100 condições por magia.");
            var validationCopy = spell.DeepClone().AsObject(); validationCopy["id"] = "validation";
            string snapshot = new JsonObject { ["magia"] = new JsonArray(validationCopy) }.ToJsonString();
            for (int index = 0; index < conditions.Count; index++)
            {
                if (conditions[index] is not JsonObject condition)
                    throw new InvalidOperationException("A condição da magia está inválida.");
                var request = condition.Deserialize<GameRunConditionOriginRequestDto>(new JsonSerializerOptions(JsonSerializerDefaults.Web))!;
                request.Tipo = "MAGIA"; request.IdInstancia = "validation"; request.Indice = index;
                request.RevisaoEsperada = 0;
                if (string.IsNullOrWhiteSpace(request.Gatilho)) request.Gatilho = "ACERTO";
                if (!Validator.TryValidateObject(request, new ValidationContext(request), [], true))
                    throw new InvalidOperationException("Revise os valores e a duração da condição da magia.");
                // The inventory editor owns validation of triggers, overrides and resistance tests.
                snapshot = GameRunCarry.UpdateConditionOrigin(snapshot, request, version);
            }
        }
        new Battle.GameBattlePreviewFactory(new Services.GameplayActionResolver()).ValidateLearnableSpell(spell, version);
    }

    public static string Learn(string snapshot, GameModeVendorOfferDto offer, SistemaVersao version)
    {
        ValidateSpell(offer, version);
        var root = JsonNode.Parse(snapshot)!.AsObject();
        var magic = GameRunInventory.ReadOrCreate(root, "magia");
        if (magic.OfType<JsonObject>().Any(item => item["idMagiaBase"]?.ToString() == offer.ItemId))
            throw new InvalidOperationException("Você já aprendeu esta magia nesta jornada.");
        var rules = SistemaRpgConfiguration.LerRegras<SistemaRpgConfiguration.RegrasPoderes>(version, SistemaModuloTipo.Poderes);
        int maximum = rules.LimiteMagias > 0 ? rules.LimiteMagias : version.SkillConfig?.MaximoMagias ?? 0;
        if (magic.Count >= maximum) throw new InvalidOperationException("O limite de magias deste Sistema foi atingido.");
        var status = root["status"] as JsonObject;
        int level = int.TryParse(status?["nivel"]?.ToString(), out int parsed) ? parsed : 1;
        if (level < offer.MinLevel) throw new InvalidOperationException($"Esta magia exige nível {offer.MinLevel}.");
        Charge(root, offer.Price);
        var spell = offer.Snapshot!.DeepClone().AsObject();
        spell["id"] = Guid.NewGuid().ToString("D");
        spell["idMagiaBase"] = offer.ItemId;
        magic.Add(spell);
        return root.ToJsonString();
    }

    public static bool CanUpgrade(JsonObject item) => item["tipo"]?.ToString() is "arma" or "outro" &&
        ReadObject(item["atributos"]) is { } attributes && (new[] { "danoBase", "dano" }.Any(key =>
            int.TryParse(attributes[key]?.ToString(), out int value) && value > 0) ||
            attributes["danoPorAlcance"] is JsonObject ranges && ranges.Any(pair =>
                int.TryParse(pair.Value?.ToString(), out int value) && value > 0));

    public static string UpgradeWeapon(string snapshot, string itemId, GameModeEngineerUpgradeDto? rule)
    {
        if (rule is not { Damage: > 0, MaxUpgrades: > 0 } || rule.Damage > 1000000 || rule.MaxUpgrades > 100)
            throw new InvalidOperationException("Este Engenheiro não oferece melhorias de arma.");
        var root = JsonNode.Parse(snapshot)!.AsObject();
        var matches = GameRunInventory.ReadOrCreate(root, "inventario").OfType<JsonObject>()
            .Where(item => item["id"]?.ToString() == itemId).ToArray();
        if (matches.Length != 1 || !CanUpgrade(matches[0]))
            throw new InvalidOperationException("Escolha uma arma com dano na mochila.");
        var item = matches[0];
        int used = int.TryParse(item["__runEngineerUpgrades"]?.ToString(), out int parsed) ? Math.Max(0, parsed) : 0;
        if (used >= rule.MaxUpgrades) throw new InvalidOperationException("Esta arma já atingiu o limite de melhorias.");
        var attributes = ReadObject(item["atributos"])!;
        var modifiers = ReadObject(attributes["modificadores"]) ?? new JsonObject();
        int current = int.TryParse(modifiers["dano"]?.ToString(), out int damage) ? damage : 0;
        int next = checked(current + rule.Damage);
        if (Math.Abs((long)next) > 100000000 || new[] { attributes["danoBase"], attributes["dano"] }
            .Concat((attributes["danoPorAlcance"] as JsonObject)?.Select(pair => pair.Value) ?? [])
            .Any(value => int.TryParse(value?.ToString(), out int damageValue) && (long)damageValue + next > int.MaxValue))
            throw new InvalidOperationException("O dano excederia o limite seguro.");
        Charge(root, rule.Price);
        if (attributes.Parent is null) item["atributos"] = attributes;
        if (modifiers.Parent is null) attributes["modificadores"] = modifiers;
        modifiers["dano"] = next;
        item["__runEngineerUpgrades"] = used + 1;
        return root.ToJsonString();
    }

    private static JsonObject? ReadObject(JsonNode? value) => value is JsonObject direct ? direct :
        value is JsonValue stored && stored.TryGetValue<string>(out string? text) ? JsonNode.Parse(text!) as JsonObject : null;

    private static void Charge(JsonObject root, int price)
    {
        if (price is < 0 or > 1000000000 || root["economy"] is not JsonObject economy ||
            !int.TryParse(economy["balance"]?.ToString(), out int balance) || balance < price || balance > 1000000000)
            throw new InvalidOperationException("Moeda insuficiente para este serviço.");
        economy["balance"] = balance - price;
    }
}
