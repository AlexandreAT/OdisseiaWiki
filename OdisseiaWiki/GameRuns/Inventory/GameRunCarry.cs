using System.Globalization;
using System.Text.Json;
using System.Text.Json.Nodes;
using OdisseiaWiki.GameRuns.Battle;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Services.Helpers;

namespace OdisseiaWiki.GameRuns.Inventory;

public static class GameRunCarry
{
    public static string UpdateConditionOrigin(string snapshot, GameRunConditionOriginRequestDto request,
        SistemaVersao version)
    {
        if (string.IsNullOrWhiteSpace(request.Tipo) || string.IsNullOrWhiteSpace(request.Gatilho) ||
            string.IsNullOrWhiteSpace(request.Alvo) || request.ResultadosNaturais is null ||
            request.ValoresEfeitos is null)
            throw new InvalidOperationException("A configuração da condição é inválida.");
        string type = request.Tipo.Trim().ToUpperInvariant();
        string property = type switch
        {
            "ITEM" => "inventario", "PROTESE" => "implantes",
            "MAGIA" => "magia", "SKILL" => "skills", _ => "",
        };
        if (property.Length == 0 || request.Indice < 0 || request.Indice > 100 ||
            request.ResultadosNaturais.Count > 20 || request.ResultadosNaturais.Any(value => value is < 1 or > 20) ||
            request.ResultadoNaturalMinimo > request.ResultadoNaturalMaximo ||
            request.Gatilho.ToUpperInvariant() is not ("ACERTO" or "RESULTADO_NATURAL" or "RESULTADO_CLASSIFICADO" or "AO_USAR" or "AO_EQUIPAR") ||
            request.Alvo.ToUpperInvariant() is not ("ALVO" or "USUARIO" or "TODOS_INIMIGOS") ||
            request.Gatilho.Equals("RESULTADO_NATURAL", StringComparison.OrdinalIgnoreCase) &&
            request.ResultadosNaturais.Count == 0 && !request.ResultadoNaturalMinimo.HasValue &&
            !request.ResultadoNaturalMaximo.HasValue ||
            request.Gatilho.Equals("RESULTADO_CLASSIFICADO", StringComparison.OrdinalIgnoreCase) &&
            (string.IsNullOrWhiteSpace(request.CodigoResultado) ||
             !version.ResultadosDado.Any(row => row.CodigoResultado.Equals(request.CodigoResultado,
                 StringComparison.OrdinalIgnoreCase))) ||
            request.UnidadeDuracao is not null &&
            !request.UnidadeDuracao.Equals("Turno", StringComparison.OrdinalIgnoreCase) &&
            !request.UnidadeDuracao.Equals("Hora", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("A configuração da condição é inválida.");
        SistemaCondicao rule = version.Condicoes.FirstOrDefault(condition =>
            condition.Codigo.Equals(request.Codigo, StringComparison.OrdinalIgnoreCase))
            ?? throw new InvalidOperationException("Esta condição não existe na versão do Sistema da run.");
        if (!GameplayConditionResistance.Valid(request.TesteResistencia, version))
            throw new InvalidOperationException("O teste de resistência não usa um atributo válido deste Sistema.");
        if (SistemaCondicaoEfeitos.Read(rule).Count == 0)
            throw new InvalidOperationException("Esta condição não possui efeitos executáveis no Sistema.");
        IReadOnlyList<SistemaCondicaoEfeito> ruleEffects = SistemaCondicaoEfeitos.Read(rule);
        if (request.ValoresEfeitos.Count > ruleEffects.Count || request.ValoresEfeitos.Any(pair =>
            pair.Key < 0 || pair.Key >= ruleEffects.Count ||
            !SistemaCondicaoEfeitos.Valid(ruleEffects[pair.Key].Operacao, ruleEffects[pair.Key].Recurso,
                pair.Value, ruleEffects[pair.Key].Momento)))
            throw new InvalidOperationException("Um dos valores dos efeitos não respeita a regra do Sistema.");
        if (request.Valor < 0 && SistemaCondicaoEfeitos.Read(rule)
            .FirstOrDefault(effect => effect.Operacao is not ("DESVANTAGEM" or "VANTAGEM" or "BLOQUEAR_RECUPERACAO"))
            ?.Operacao is not ("MODIFICAR_ROLAGEM" or "MODIFICAR_ATRIBUTO" or
                "MODIFICAR_DANO" or "MODIFICAR_DEFESA" or "MODIFICAR_LIMITE_PERCENTUAL"))
            throw new InvalidOperationException("Esta condição não permite intensidade negativa.");
        JsonObject root = JsonNode.Parse(snapshot)?.AsObject()
            ?? throw new InvalidOperationException("O estado da run está inválido.");
        JsonNode? raw = root[property];
        if (raw is JsonValue serialized && serialized.TryGetValue<string>(out string? json))
        {
            raw = JsonNode.Parse(json);
            root[property] = raw;
        }
        JsonArray? entries = raw as JsonArray ?? new[] { "itens", "inventario", "items", "implantes", "proteses", "skills", "magias" }
            .Select(key => (raw as JsonObject)?[key] as JsonArray).FirstOrDefault(array => array is not null);
        JsonObject item = entries?.OfType<JsonObject>().SingleOrDefault(candidate =>
            candidate["id"]?.ToString() == request.IdInstancia)
            ?? throw new InvalidOperationException("Esta cópia não está no inventário da run.");
        JsonNode? attributes = item["atributos"];
        if (attributes is JsonValue stored && stored.TryGetValue<string>(out string? attributesJson))
        {
            attributes = JsonNode.Parse(attributesJson);
            item["atributos"] = attributes;
        }
        JsonArray origins = (attributes as JsonObject)?["condicoes"] as JsonArray
            ?? throw new InvalidOperationException("Esta cópia não tem condições configuradas.");
        if (request.Indice >= origins.Count || origins[request.Indice] is not JsonObject origin ||
            !string.Equals(origin["codigo"]?.ToString(), rule.Codigo, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("A condição da cópia mudou. Reabra o inventário.");
        origin["gatilho"] = request.Gatilho.ToUpperInvariant();
        if (request.Gatilho.Equals("RESULTADO_CLASSIFICADO", StringComparison.OrdinalIgnoreCase))
            origin["codigoResultado"] = request.CodigoResultado!.ToUpperInvariant();
        else origin.Remove("codigoResultado");
        origin["alvo"] = request.Alvo.ToUpperInvariant();
        if (request.TesteResistencia is null) origin.Remove("testeResistencia");
        else origin["testeResistencia"] = JsonSerializer.SerializeToNode(request.TesteResistencia,
            new JsonSerializerOptions(JsonSerializerDefaults.Web));
        SetOptional("valor", request.Valor);
        if (request.ValoresEfeitos.Count == 0) origin.Remove("valoresEfeitos");
        else origin["valoresEfeitos"] = JsonSerializer.SerializeToNode(request.ValoresEfeitos);
        SetOptional("duracao", request.Duracao);
        SetOptional("resultadoNaturalMinimo", request.ResultadoNaturalMinimo);
        SetOptional("resultadoNaturalMaximo", request.ResultadoNaturalMaximo);
        if (request.UnidadeDuracao is null) origin.Remove("unidadeDuracao");
        else origin["unidadeDuracao"] = request.UnidadeDuracao;
        origin["resultadosNaturais"] = new JsonArray(request.ResultadosNaturais.Distinct().Order().Select(value =>
            (JsonNode?)JsonValue.Create(value)).ToArray());
        return root.ToJsonString();

        void SetOptional(string key, int? value)
        {
            if (value.HasValue) origin[key] = value.Value;
            else origin.Remove(key);
        }
    }

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

    public static string Reconcile(string snapshot, SistemaVersao version) =>
        ReconcileCore(snapshot, version, null);

    private static string ReconcileCore(string snapshot, SistemaVersao version, ISet<string>? suppressActivation)
    {
        JsonObject root = JsonNode.Parse(snapshot)?.AsObject()
            ?? throw new InvalidOperationException("O estado da run está inválido.");
        JsonObject resources = root["status"]?["status"]?.AsObject()
            ?? throw new InvalidOperationException("Os recursos da run estão inválidos.");
        decimal weight = Weight(root["inventario"]);
        JsonNode? capacityValue = resources["capacidadeCarga"];
        decimal capacity = Number(capacityValue);
        bool carryLimit = SistemaRpgConfiguration.LerRegras<SistemaRpgConfiguration.RegrasExploracao>(
            version, SistemaModuloTipo.Exploracao).CargaUsaLimite;
        bool overweight = carryLimit && capacityValue is not null && capacity >= 0 && weight > capacity;
        JsonObject carry = root["carga"] as JsonObject ?? new JsonObject();
        JsonObject active = root["condicoesAtivas"] as JsonObject ?? new JsonObject();
        JsonObject limits = root["limitesCondicoes"] as JsonObject ?? new JsonObject();
        SistemaCondicao[] executable = version.Condicoes.Where(rule =>
            !string.IsNullOrWhiteSpace(rule.CodigoRecursoGatilho) &&
            (rule.ValorGatilho.HasValue || LegacyOverload(rule)) &&
            LimitReductions(rule).Any())
            .OrderBy(rule => rule.Ordem).ToArray();
        var manualReductions = new List<(SistemaCondicao Rule, SistemaCondicaoEfeito Effect, decimal Value)>();
        if (root["status"]?["condicoesJogo"] is JsonArray battleConditions)
            foreach (JsonObject condition in battleConditions.OfType<JsonObject>())
            {
                string? code = condition["rule"]?["code"]?.ToString();
                SistemaCondicao? rule = version.Condicoes.FirstOrDefault(item =>
                    string.Equals(item.Codigo, code, StringComparison.OrdinalIgnoreCase));
                if (rule is null) continue;
                bool hasOverride = decimal.TryParse(condition["overrideValue"]?.ToString(),
                    NumberStyles.Number, CultureInfo.InvariantCulture, out decimal overrideValue);
                IReadOnlyList<SistemaCondicaoEfeito> allEffects = SistemaCondicaoEfeitos.Read(rule);
                SistemaCondicaoEfeito? firstNumeric = allEffects.FirstOrDefault(effect =>
                    effect.Operacao is not ("DESVANTAGEM" or "VANTAGEM" or "BLOQUEAR_RECUPERACAO"));
                for (int effectIndex = 0; effectIndex < allEffects.Count; effectIndex++)
                {
                    SistemaCondicaoEfeito effect = allEffects[effectIndex];
                    if (effect.Operacao is not ("REDUZIR_LIMITE_PERCENTUAL" or "MODIFICAR_LIMITE_PERCENTUAL")) continue;
                    decimal value = decimal.TryParse(condition["effectValues"]?[effectIndex.ToString()]?.ToString(),
                        NumberStyles.Number, CultureInfo.InvariantCulture, out decimal perEffect)
                        ? perEffect : hasOverride && effect == firstNumeric ? overrideValue : effect.Valor;
                    if (effect.Operacao == "REDUZIR_LIMITE_PERCENTUAL" && value is >= 0 and <= 100 ||
                        effect.Operacao == "MODIFICAR_LIMITE_PERCENTUAL" && value is >= -100 and <= 1000)
                        manualReductions.Add((rule, effect, value));
                }
            }

        foreach (SistemaCondicao rule in executable)
        {
            if (suppressActivation?.Contains(rule.Codigo) == true) continue;
            bool? triggered = Trigger(rule, resources, weight, capacity, carryLimit && capacityValue is not null);
            if (triggered == true) active[rule.Codigo] = true;
            else if (triggered == false && (SistemaCondicaoRemocao.AoCessarGatilho(rule) ||
                // Legacy overload already recovered as soon as the weight fell below capacity.
                rule.RegraRemocao is null && rule.CodigoRecursoGatilho == "EXCESSO_CARGA"))
            {
                active.Remove(rule.Codigo);
                if (root["status"]?["condicoesJogo"] is JsonArray persisted)
                    for (int index = persisted.Count - 1; index >= 0; index--)
                        if (string.Equals(persisted[index]?["rule"]?["code"]?.ToString(), rule.Codigo,
                            StringComparison.OrdinalIgnoreCase)) persisted.RemoveAt(index);
            }
        }

        string[] affected = executable.Where(rule => active[rule.Codigo]?.ToString() == "true")
            .SelectMany(LimitReductions).Select(effect => effect.Recurso.ToLowerInvariant())
            .Concat(manualReductions.Where(entry => StillPersisted(entry.Rule.Codigo))
                .Select(entry => entry.Effect.Recurso.ToLowerInvariant()))
            .Concat(limits.Select(pair => pair.Key))
            .Concat(carry["estaminaMaximaBase"] is null ? [] : ["estamina"])
            .Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
        foreach (string resource in affected)
        {
            string maximumKey = $"{resource}Maxima";
            if (resources[maximumKey] is null) maximumKey = $"{resource}Maximo";
            if (resources[maximumKey] is null) continue;
            int currentMaximum = (int)Number(resources[maximumKey]);
            JsonObject? previous = limits[resource] as JsonObject;
            int baseMaximum = previous is null ? currentMaximum : (int)Number(previous["base"]);
            int lastApplied = previous is null ? currentMaximum : (int)Number(previous["aplicado"]);
            if (previous is null && resource == "estamina" && carry["estaminaMaximaBase"] is not null)
            {
                baseMaximum = (int)Number(carry["estaminaMaximaBase"]);
                lastApplied = (int)Math.Floor(baseMaximum * (100 - Number(carry["penalidadePercentual"])) / 100m);
            }
            if (currentMaximum != lastApplied)
                baseMaximum = Math.Max(0, baseMaximum + currentMaximum - lastApplied);
            decimal effective = baseMaximum;
            foreach (SistemaCondicaoEfeito effect in executable.Where(rule =>
                         active[rule.Codigo]?.ToString() == "true").SelectMany(LimitReductions)
                         .Where(effect => effect.Recurso.Equals(resource, StringComparison.OrdinalIgnoreCase)))
                effective *= 1m + (effect.Operacao == "REDUZIR_LIMITE_PERCENTUAL"
                    ? -effect.Valor : effect.Valor) / 100m;
            foreach ((SistemaCondicao rule, SistemaCondicaoEfeito effect, decimal value) in manualReductions.Where(entry =>
                         entry.Effect.Recurso.Equals(resource, StringComparison.OrdinalIgnoreCase) &&
                         StillPersisted(entry.Rule.Codigo) &&
                         active[entry.Rule.Codigo]?.ToString() != "true"))
                effective *= 1m + (effect.Operacao == "REDUZIR_LIMITE_PERCENTUAL" ? -value : value) / 100m;
            int calculated = (int)Math.Clamp(Math.Floor(effective), 0, 1000000);
            resources[maximumKey] = calculated;
            if (resources[resource] is not null)
                resources[resource] = Math.Min((int)Number(resources[resource]), calculated);
            if (calculated == baseMaximum) limits.Remove(resource);
            else limits[resource] = new JsonObject { ["base"] = baseMaximum, ["aplicado"] = calculated };
            if (resource == "estamina") carry["estaminaMaximaBase"] = baseMaximum;
        }
        var heavy = executable.FirstOrDefault(rule => rule.CodigoRecursoGatilho == "EXCESSO_CARGA" &&
            LimitReductions(rule).Any(effect => effect.Operacao == "REDUZIR_LIMITE_PERCENTUAL" &&
                effect.Recurso.Equals("ESTAMINA", StringComparison.OrdinalIgnoreCase)));
        carry["pesoAtual"] = weight;
        carry["capacidade"] = capacity;
        carry["penalidadePercentual"] = heavy is not null && active[heavy.Codigo]?.ToString() == "true"
            ? LimitReductions(heavy).First(effect => effect.Operacao == "REDUZIR_LIMITE_PERCENTUAL" &&
                effect.Recurso.Equals("ESTAMINA", StringComparison.OrdinalIgnoreCase)).Valor : 0;
        carry["sobrecarregado"] = overweight;
        if (carry.Parent is null) root["carga"] = carry;
        if (active.Parent is null) root["condicoesAtivas"] = active;
        if (limits.Parent is null) root["limitesCondicoes"] = limits;
        return root.ToJsonString();

        bool StillPersisted(string code) => root["status"]?["condicoesJogo"] is JsonArray current &&
            current.OfType<JsonObject>().Any(item => string.Equals(item["rule"]?["code"]?.ToString(),
                code, StringComparison.OrdinalIgnoreCase));
    }

    public static string RecoverConditionsAtRest(string snapshot, SistemaVersao version, string restType)
    {
        JsonObject root = JsonNode.Parse(snapshot)?.AsObject()
            ?? throw new InvalidOperationException("O estado da run está inválido.");
        var removed = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        if (root["condicoesAtivas"] is JsonObject active)
            foreach (SistemaCondicao rule in version.Condicoes.Where(rule =>
                         SistemaCondicaoRemocao.AoDescansar(rule, restType)))
                if (active.Remove(rule.Codigo)) removed.Add(rule.Codigo);
        if (root["status"]?["condicoesJogo"] is JsonArray battleConditions)
            for (int index = battleConditions.Count - 1; index >= 0; index--)
            {
                string? code = battleConditions[index]?["rule"]?["code"]?.ToString();
                SistemaCondicao? rule = version.Condicoes.FirstOrDefault(item =>
                    string.Equals(item.Codigo, code, StringComparison.OrdinalIgnoreCase));
                if (rule is null || !SistemaCondicaoRemocao.AoDescansar(rule, restType)) continue;
                battleConditions.RemoveAt(index);
                removed.Add(rule.Codigo);
            }
        // Recalculate remaining limits before recovery, without retriggering a condition
        // that this very rest just removed while the resource is still at zero.
        return ReconcileCore(root.ToJsonString(), version, removed);
    }

    public static string RecoverConditionsAtCure(string snapshot, SistemaVersao version)
    {
        JsonObject root = JsonNode.Parse(snapshot)?.AsObject()
            ?? throw new InvalidOperationException("O estado da run está inválido.");
        var removed = version.Condicoes.Where(SistemaCondicaoRemocao.AoCurar)
            .Select(rule => rule.Codigo).ToHashSet(StringComparer.OrdinalIgnoreCase);
        if (removed.Count == 0) return snapshot;
        if (root["condicoesAtivas"] is JsonObject flags)
            foreach (string code in removed) flags.Remove(code);
        if (root["status"]?["condicoesJogo"] is JsonArray combatConditions)
            for (int index = combatConditions.Count - 1; index >= 0; index--)
                if (combatConditions[index]?["rule"]?["code"]?.ToString() is string code && removed.Contains(code))
                    combatConditions.RemoveAt(index);
        return ReconcileCore(root.ToJsonString(), version, removed);
    }

    public static string ApplyConsumedItemConditions(string beforeSnapshot, string afterSnapshot,
        string itemId, SistemaVersao version, int quantity = 1, string trigger = "AO_USAR")
    {
        JsonObject before = JsonNode.Parse(beforeSnapshot)?.AsObject()
            ?? throw new InvalidOperationException("O inventário da run está inválido.");
        JsonNode? inventory = before["inventario"];
        if (inventory is JsonValue serialized && serialized.TryGetValue<string>(out string? inventoryJson))
            inventory = JsonNode.Parse(inventoryJson);
        JsonArray? items = inventory as JsonArray ?? new[] { "itens", "inventario", "items" }
            .Select(key => (inventory as JsonObject)?[key] as JsonArray).FirstOrDefault(array => array is not null);
        JsonObject? item = items?.OfType<JsonObject>().FirstOrDefault(entry =>
            entry["id"]?.ToString() == itemId);
        if (item?["atributos"]?["condicoes"] is not JsonArray configured) return afterSnapshot;
        JsonObject after = JsonNode.Parse(afterSnapshot)?.AsObject()
            ?? throw new InvalidOperationException("O estado da run está inválido.");
        JsonObject status = after["status"] as JsonObject
            ?? throw new InvalidOperationException("Os recursos da run estão inválidos.");
        JsonObject resources = status["status"] as JsonObject
            ?? throw new InvalidOperationException("Os recursos da run estão inválidos.");
        JsonArray active = status["condicoesJogo"] as JsonArray ?? new JsonArray();
        foreach (JsonObject source in configured.OfType<JsonObject>())
        for (int use = 0; use < quantity; use++)
        {
            if (!string.Equals(source["gatilho"]?.ToString(), trigger, StringComparison.OrdinalIgnoreCase))
                continue;
            if (source["alvo"] is not null &&
                !string.Equals(source["alvo"]!.ToString(), "USUARIO", StringComparison.OrdinalIgnoreCase))
                continue;
            SistemaCondicao? rule = version.Condicoes.FirstOrDefault(candidate =>
                string.Equals(candidate.Codigo, source["codigo"]?.ToString(), StringComparison.OrdinalIgnoreCase));
            if (rule is null || SistemaCondicaoEfeitos.Read(rule).Count == 0) continue;
            string unit = source["unidadeDuracao"]?.ToString() ?? rule.UnidadeDuracao.ToString();
            if (!unit.Equals("Turno", StringComparison.OrdinalIgnoreCase) &&
                !unit.Equals("Hora", StringComparison.OrdinalIgnoreCase)) continue;
            decimal configuredValue = source["valor"] is null ? rule.ValorPadrao ?? rule.ValorEfeito ?? 0 : Number(source["valor"]);
            if (configuredValue is < -1000000 or > 1000000) continue;
            int value = (int)decimal.Truncate(configuredValue);
            int? duration = source["duracao"] is null ? rule.DuracaoPadrao : (int)Number(source["duracao"]);
            if (duration is <= 0 or > 1000000) continue;
            var battleRule = new GameBattleConditionRule(rule.Codigo, rule.Nome, rule.OperacaoEfeito ?? "",
                rule.CodigoRecurso ?? "", value, rule.MomentoEfeito ?? "", rule.Empilhavel,
                rule.PermiteSobrescrever, rule.RegraRemocao ?? "MANUAL")
            { Effects = SistemaCondicaoEfeitos.Read(rule), Image = SistemaCondicaoEfeitos.Image(rule) };
            int previous = Enumerable.Range(0, active.Count).FirstOrDefault(index =>
                string.Equals(active[index]?["rule"]?["code"]?.ToString(), rule.Codigo,
                    StringComparison.OrdinalIgnoreCase), -1);
            if (previous >= 0 && !rule.Empilhavel && !rule.PermiteSobrescrever) continue;
            if (previous >= 0 && !rule.Empilhavel) active.RemoveAt(previous);
            var perEffectValues = new Dictionary<int, int>();
            if (source["valoresEfeitos"] is JsonObject overrides)
            {
                bool validOverrides = true;
                foreach ((string key, JsonNode? overrideNode) in overrides)
                {
                    if (!int.TryParse(key, out int effectIndex) || effectIndex < 0 ||
                        effectIndex >= battleRule.Effects.Count ||
                        !int.TryParse(overrideNode?.ToString(), out int effectValue) ||
                        !SistemaCondicaoEfeitos.Valid(battleRule.Effects[effectIndex].Operacao,
                            battleRule.Effects[effectIndex].Recurso, effectValue,
                            battleRule.Effects[effectIndex].Momento))
                    { validOverrides = false; break; }
                    perEffectValues[effectIndex] = effectValue;
                }
                if (!validOverrides) continue;
            }
            var condition = new GameBattleActiveCondition(battleRule, value,
                unit.Equals("Turno", StringComparison.OrdinalIgnoreCase) ? duration : null,
                unit.Equals("Hora", StringComparison.OrdinalIgnoreCase) ? duration : null)
            { RemainingMinutes = unit.Equals("Hora", StringComparison.OrdinalIgnoreCase) && duration.HasValue
                ? checked(duration.Value * 60) : null,
              SourceItemId = trigger == "AO_EQUIPAR" ? itemId : null,
              OverrideValue = source["valor"] is null ? null : value,
              EffectValues = perEffectValues };
            active.Add(JsonSerializer.SerializeToNode(condition,
                new JsonSerializerOptions(JsonSerializerDefaults.Web)));
            SistemaCondicaoEfeito? firstNumeric = battleRule.Effects.FirstOrDefault(effect =>
                effect.Operacao is not ("DESVANTAGEM" or "VANTAGEM" or "BLOQUEAR_RECUPERACAO"));
            for (int effectIndex = 0; effectIndex < battleRule.Effects.Count; effectIndex++)
            {
                SistemaCondicaoEfeito effect = battleRule.Effects[effectIndex];
                if (!effect.Momento.Equals("AO_APLICAR", StringComparison.OrdinalIgnoreCase)) continue;
                string resource = effect.Recurso.ToLowerInvariant();
                string maximumKey = resource + "Maxima";
                if (resources[maximumKey] is null) maximumKey = resource + "Maximo";
                if (resources[resource] is null) continue;
                int current = (int)Number(resources[resource]);
                int maximum = resources[maximumKey] is null ? current : (int)Number(resources[maximumKey]);
                int amount = perEffectValues.TryGetValue(effectIndex, out int configuredAmount)
                    ? configuredAmount : effect == firstNumeric && condition.OverrideValue.HasValue
                        ? condition.OverrideValue.Value : effect.Valor;
                resources[resource] = effect.Operacao.ToUpperInvariant() switch
                {
                    "SUBTRAIR" => Math.Max(0, current - amount),
                    "SOMAR" => Math.Min(maximum, current + amount),
                    "DEFINIR" => Math.Clamp(amount, 0, maximum),
                    _ => current,
                };
            }
        }
        if (active.Parent is null) status["condicoesJogo"] = active;
        return Reconcile(after.ToJsonString(), version);
    }

    public static string RemoveUnequippedItemConditions(string snapshot, string itemId,
        SistemaVersao version)
    {
        JsonObject root = JsonNode.Parse(snapshot)?.AsObject()
            ?? throw new InvalidOperationException("O estado da run está inválido.");
        if (root["status"]?["condicoesJogo"] is JsonArray active)
            for (int index = active.Count - 1; index >= 0; index--)
            {
                JsonObject? condition = active[index] as JsonObject;
                string? code = condition?["rule"]?["code"]?.ToString();
                if (condition?["sourceItemId"]?.ToString() != itemId || code is null) continue;
                SistemaCondicao? rule = version.Condicoes.FirstOrDefault(candidate =>
                    candidate.Codigo.Equals(code, StringComparison.OrdinalIgnoreCase));
                if (rule is not null && SistemaCondicaoRemocao.AoCessarGatilho(rule))
                    active.RemoveAt(index);
            }
        return Reconcile(root.ToJsonString(), version);
    }

    public static bool BlocksRecovery(JsonObject snapshot, SistemaVersao version, string resourceCode)
    {
        JsonObject? flags = snapshot["condicoesAtivas"] as JsonObject;
        JsonArray? applied = snapshot["status"]?["condicoesJogo"] as JsonArray;
        return version.Condicoes.Any(rule =>
            SistemaCondicaoEfeitos.Read(rule).Any(effect =>
                effect.Operacao.Equals("BLOQUEAR_RECUPERACAO", StringComparison.OrdinalIgnoreCase) &&
                effect.Recurso.Equals(resourceCode, StringComparison.OrdinalIgnoreCase)) &&
            (flags?[rule.Codigo]?.ToString() == "true" || applied?.OfType<JsonObject>().Any(item =>
                string.Equals(item["rule"]?["code"]?.ToString(), rule.Codigo,
                    StringComparison.OrdinalIgnoreCase)) == true));
    }

    public static string AdvanceGameTime(string snapshot, int elapsedMinutes, SistemaVersao version)
    {
        if (elapsedMinutes <= 0) return snapshot;
        JsonObject root = JsonNode.Parse(snapshot)?.AsObject()
            ?? throw new InvalidOperationException("O estado da run está inválido.");
        long elapsed = (long)Number(root["tempoJogoMinutos"]);
        root["tempoJogoMinutos"] = checked(elapsed + elapsedMinutes);
        if (root["status"]?["condicoesJogo"] is JsonArray active)
            for (int index = active.Count - 1; index >= 0; index--)
            {
                if (active[index] is not JsonObject condition) continue;
                int? remaining = condition["remainingMinutes"] is not null
                    ? (int)Number(condition["remainingMinutes"])
                    : condition["remainingHours"] is not null
                        ? checked((int)Number(condition["remainingHours"]) * 60) : null;
                if (!remaining.HasValue) continue;
                int next = remaining.Value - elapsedMinutes;
                if (next <= 0) active.RemoveAt(index);
                else
                {
                    condition["remainingMinutes"] = next;
                    condition["remainingHours"] = (int)Math.Ceiling(next / 60m);
                }
            }
        return Reconcile(root.ToJsonString(), version);
    }

    public static string PreserveBattleTriggers(string snapshot, SistemaVersao version,
        IReadOnlyList<GameBattleEvent> events)
    {
        JsonObject root = JsonNode.Parse(snapshot)?.AsObject()
            ?? throw new InvalidOperationException("O estado da run está inválido.");
        JsonObject active = root["condicoesAtivas"] as JsonObject ?? new JsonObject();
        foreach (GameBattleEvent battleEvent in events.Where(item => item.ActorId == "player" &&
                     item.Type == GameBattleEventTypes.ResourceChanged &&
                     item.Payload is ResourceChangedPayload))
        {
            var change = (ResourceChangedPayload)battleEvent.Payload;
            string resource = change.Resource switch
            {
                "hitPoints" => "VIDA", "mana" => "MANA", "stamina" => "ESTAMINA", _ => "",
            };
            if (resource.Length == 0) continue;
            foreach (SistemaCondicao rule in version.Condicoes.Where(rule =>
                         rule.CodigoRecursoGatilho?.Equals(resource, StringComparison.OrdinalIgnoreCase) == true &&
                         rule.ValorGatilho.HasValue && LimitReductions(rule).Any()))
            {
                bool triggered = rule.OperadorGatilho?.Trim() switch
                {
                    "<" => change.After < rule.ValorGatilho,
                    "<=" => change.After <= rule.ValorGatilho,
                    "==" => change.After == rule.ValorGatilho,
                    ">" => change.After > rule.ValorGatilho,
                    ">=" => change.After >= rule.ValorGatilho,
                    _ => false,
                };
                if (triggered) active[rule.Codigo] = true;
            }
        }
        if (active.Parent is null) root["condicoesAtivas"] = active;
        return root.ToJsonString();
    }

    private static bool? Trigger(SistemaCondicao rule, JsonObject resources, decimal weight,
        decimal capacity, bool hasCapacity)
    {
        string code = rule.CodigoRecursoGatilho!.ToUpperInvariant();
        decimal actual;
        if (code == "EXCESSO_CARGA")
        {
            if (!hasCapacity) return null;
            actual = weight - capacity;
        }
        else if (code == "CARGA") actual = weight;
        else
        {
            JsonNode? value = resources[code.ToLowerInvariant()];
            if (value is null) return null;
            actual = Number(value);
        }
        decimal target = rule.ValorGatilho ?? 0;
        string? comparison = rule.OperadorGatilho?.Trim();
        if (comparison is null && LegacyOverload(rule)) comparison = ">";
        return comparison switch
        {
            "<" => actual < target,
            "<=" => actual <= target,
            ">" => actual > target,
            ">=" => actual >= target,
            "==" => actual == target,
            _ => null,
        };
    }

    private static bool LegacyOverload(SistemaCondicao rule) =>
        rule.CodigoRecursoGatilho?.Equals("EXCESSO_CARGA", StringComparison.OrdinalIgnoreCase) == true &&
        rule.ValorGatilho is null && string.IsNullOrWhiteSpace(rule.OperadorGatilho);

    private static decimal? Reduction(SistemaCondicao rule) => rule.ValorPadrao ?? rule.ValorEfeito;

    private static IEnumerable<SistemaCondicaoEfeito> LimitReductions(SistemaCondicao rule) =>
        SistemaCondicaoEfeitos.Read(rule).Where(effect =>
            (effect.Operacao.Equals("REDUZIR_LIMITE_PERCENTUAL", StringComparison.OrdinalIgnoreCase) &&
             effect.Valor is >= 0 and <= 100 ||
             effect.Operacao.Equals("MODIFICAR_LIMITE_PERCENTUAL", StringComparison.OrdinalIgnoreCase) &&
             effect.Valor is >= -100 and <= 1000) &&
            effect.Recurso is "VIDA" or "MANA" or "ESTAMINA");

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
