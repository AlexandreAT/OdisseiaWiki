using System.Globalization;
using System.Text.Json;
using System.Text.Json.Nodes;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;

namespace OdisseiaWiki.Services.Helpers;

public sealed record GameplayConditionSynchronizationResult(
    IReadOnlyList<string> Changes,
    bool CharacterStateChanged);

/// <summary>
/// Applies only explicitly structured, published condition rules. Narrative
/// descriptions are never interpreted as executable state changes.
/// </summary>
public static class GameplayConditionRuntime
{
    private const string RuntimeProperty = "_gameplayEngine";
    private const string BaseLimitsProperty = "limitesBase";

    public static GameplayConditionSynchronizationResult SynchronizeState(
        PersonagemJogador character,
        MesaCombate combat,
        MesaCombateParticipante participant,
        SistemaVersao version,
        int idUsuario,
        DateTime now)
    {
        string initialStatus = character.StatusJson;
        var changes = new List<string>();

        if (version.Morte is { } death && TryReadStatusValue(character.StatusJson, "VIDA", out decimal life))
        {
            int threshold = ResolveNearDeathThreshold(character, death);
            if (life <= threshold && participant.Status != MesaCombateParticipanteStatus.Morto)
            {
                if (participant.Status != MesaCombateParticipanteStatus.ABeiraDaMorte)
                    changes.Add("A_BEIRA_DA_MORTE");
                participant.Status = MesaCombateParticipanteStatus.ABeiraDaMorte;
            }
            else if (life > threshold && participant.Status is MesaCombateParticipanteStatus.ABeiraDaMorte or MesaCombateParticipanteStatus.Estabilizado)
            {
                participant.Status = combat.IdParticipanteAtual == participant.IdMesaCombateParticipante
                    ? MesaCombateParticipanteStatus.Ativo
                    : MesaCombateParticipanteStatus.Pronto;
                participant.SucessosSobrevivencia = 0;
                participant.FalhasSobrevivencia = 0;
                changes.Add("RECUPERADO_BEIRA_DA_MORTE");
            }
        }

        foreach (SistemaCondicao rule in version.Condicoes
                     .Where(item => !string.IsNullOrWhiteSpace(item.CodigoRecursoGatilho) && item.ValorGatilho.HasValue)
                     .OrderBy(item => item.Ordem))
        {
            if (!TryReadTriggerValue(character, rule.CodigoRecursoGatilho!, out decimal actual))
                continue;
            bool triggered = EvaluateTrigger(actual, rule.OperadorGatilho, rule.ValorGatilho!.Value);
            MesaCondicaoAtiva? active = combat.Condicoes.FirstOrDefault(condition =>
                BelongsToParticipant(condition, participant) &&
                condition.Status == MesaCondicaoStatus.Ativa &&
                Normalize(condition.CodigoSnapshot) == Normalize(rule.Codigo));
            if (triggered && active is null)
            {
                bool coolingDown = combat.Cooldowns.Any(item =>
                    (ReferenceEquals(item.Participante, participant) ||
                     item.IdParticipante == participant.IdMesaCombateParticipante) &&
                    item.Status == MesaCooldownStatus.Ativo &&
                    item.TipoOrigem == "CONDICAO" &&
                    Normalize(item.IdOrigem) == Normalize(rule.Codigo));
                if (coolingDown) continue;
                MesaCondicaoAtiva? previous = combat.Condicoes
                    .Where(condition => BelongsToParticipant(condition, participant) &&
                                        Normalize(condition.CodigoSnapshot) == Normalize(rule.Codigo))
                    .OrderByDescending(condition => condition.AplicadaEmUtc)
                    .FirstOrDefault();
                if (previous is not null && !previous.GatilhoRearmado)
                    continue;

                active = new MesaCondicaoAtiva
                {
                    IdMesaCombate = combat.IdMesaCombate,
                    IdParticipante = participant.IdMesaCombateParticipante,
                    IdSistemaCondicao = rule.IdSistemaCondicao,
                    CodigoSnapshot = rule.Codigo,
                    NomeSnapshot = rule.Nome,
                    Valor = rule.ValorPadrao,
                    Duracao = rule.DuracaoPadrao,
                    UnidadeDuracao = rule.UnidadeDuracao,
                    TurnosRestantes = rule.UnidadeDuracao == SistemaUnidadeDuracao.Turno ? rule.DuracaoPadrao : null,
                    CooldownTurnos = rule.CooldownTurnos,
                    RodadaAplicacao = combat.RodadaAtual,
                    TurnoAplicacao = combat.IndiceTurnoAtual,
                    RegraSnapshotJson = SerializeRule(rule),
                    IdUsuarioAplicacao = idUsuario,
                    AplicadaEmUtc = now,
                    GatilhoRearmado = false,
                    Combate = combat,
                    Participante = participant,
                };
                combat.Condicoes.Add(active);
                changes.Add(rule.Codigo);
                if (Normalize(rule.MomentoEfeito) == "AO_APLICAR")
                    ApplyImmediateResourceEffect(character, active, rule, version);
            }
            else if (!triggered)
            {
                if (active is not null && rule.RemocaoAutomatica)
                {
                    active.Status = MesaCondicaoStatus.Expirada;
                    active.RemovidaEmUtc = now;
                    active.MotivoRemocao = "Gatilho não está mais ativo";
                    StartCooldown(combat, participant, active, now);
                    changes.Add($"{rule.Codigo}:REMOVIDA");
                }
                foreach (MesaCondicaoAtiva previous in combat.Condicoes.Where(condition =>
                             BelongsToParticipant(condition, participant) &&
                             Normalize(condition.CodigoSnapshot) == Normalize(rule.Codigo)))
                {
                    previous.GatilhoRearmado = true;
                }
            }
        }

        if (ApplyActiveResourceLimits(character, combat, participant, version))
            changes.Add("LIMITES_RECURSOS");
        return new GameplayConditionSynchronizationResult(
            changes,
            !string.Equals(initialStatus, character.StatusJson, StringComparison.Ordinal));
    }

    public static bool BlocksRecovery(
        MesaCombate combat,
        MesaCombateParticipante participant,
        SistemaVersao version,
        string resourceCode)
    {
        string resource = Normalize(resourceCode);
        return ActiveConditionRules(combat, participant, version).Any(entry =>
            Normalize(entry.Rule.OperacaoEfeito) == "BLOQUEAR_RECUPERACAO" &&
            Normalize(entry.Rule.CodigoRecurso) == resource);
    }

    public static bool TryReadTriggerValue(PersonagemJogador character, string triggerCode, out decimal value)
    {
        string trigger = Normalize(triggerCode);
        if (trigger is "CARGA" or "EXCESSO_CARGA")
        {
            decimal total = CalculateInventoryWeight(character.InventarioJson);
            decimal capacity = TryReadStatusValue(character.StatusJson, "CAPACIDADE_CARGA", out decimal configured)
                ? configured
                : 0;
            value = trigger == "EXCESSO_CARGA" ? total - capacity : total;
            return true;
        }
        return TryReadStatusValue(character.StatusJson, trigger, out value);
    }

    public static bool ApplyActiveResourceLimits(
        PersonagemJogador character,
        MesaCombate combat,
        MesaCombateParticipante participant,
        SistemaVersao version)
    {
        JsonObject root;
        try
        {
            root = JsonNode.Parse(string.IsNullOrWhiteSpace(character.StatusJson) ? "{}" : character.StatusJson) as JsonObject
                ?? new JsonObject();
        }
        catch (JsonException)
        {
            return false;
        }

        JsonObject status = GetOrCreate(root, "status");
        JsonObject runtime = GetOrCreate(root, RuntimeProperty);
        JsonObject bases = GetOrCreate(runtime, BaseLimitsProperty);
        IReadOnlyList<ActiveConditionRule> activeRules = ActiveConditionRules(combat, participant, version)
            .Where(entry => Normalize(entry.Rule.OperacaoEfeito) == "REDUZIR_LIMITE_PERCENTUAL" &&
                            !string.IsNullOrWhiteSpace(entry.Rule.CodigoRecurso) &&
                            (entry.Condition.Valor ?? entry.Rule.ValorEfeito) is >= 0 and <= 100)
            .OrderBy(entry => entry.Rule.Ordem)
            .ToArray();
        HashSet<string> resources = activeRules.Select(entry => Normalize(entry.Rule.CodigoRecurso))
            .Concat(bases.Select(pair => Normalize(pair.Key)))
            .Where(code => code.Length > 0)
            .ToHashSet(StringComparer.Ordinal);

        bool changed = false;
        foreach (string resource in resources)
        {
            string preferred = resource.ToLowerInvariant();
            string? maximumKey = FindKey(status, $"{preferred}Maxima") ?? FindKey(status, $"{preferred}Maximo");
            if (maximumKey is null) continue;
            int currentMaximum = ReadInt(status[maximumKey]);
            string stateKey = FindKey(bases, resource) ?? resource;
            JsonObject? state = bases[stateKey] as JsonObject;
            int baseMaximum = state is null ? currentMaximum : ReadInt(state["base"]);
            int lastApplied = state is null ? currentMaximum : ReadInt(state["aplicado"]);

            // A manual/system edit made while the condition was active becomes
            // the new baseline instead of being overwritten by stale runtime data.
            if (state is not null && currentMaximum != lastApplied)
                baseMaximum = currentMaximum;

            ActiveConditionRule[] reductions = activeRules
                .Where(entry => Normalize(entry.Rule.CodigoRecurso) == resource)
                .ToArray();
            if (reductions.Length == 0)
            {
                if (currentMaximum != baseMaximum)
                {
                    status[maximumKey] = baseMaximum;
                    ClampCurrent(status, preferred, baseMaximum);
                    changed = true;
                }
                if (bases.Remove(stateKey)) changed = true;
                continue;
            }

            decimal effective = baseMaximum;
            foreach (ActiveConditionRule reduction in reductions)
            {
                decimal percentage = reduction.Condition.Valor ?? reduction.Rule.ValorEfeito!.Value;
                for (int stack = 0; stack < Math.Max(1, reduction.Condition.Acumulos); stack++)
                    effective *= 1m - percentage / 100m;
            }
            int calculated = Math.Max(0, decimal.ToInt32(decimal.Floor(effective)));
            if (currentMaximum != calculated)
            {
                status[maximumKey] = calculated;
                ClampCurrent(status, preferred, calculated);
                changed = true;
            }
            bases[stateKey] = new JsonObject { ["base"] = baseMaximum, ["aplicado"] = calculated };
        }

        if (bases.Count == 0)
        {
            runtime.Remove(BaseLimitsProperty);
            if (runtime.Count == 0) root.Remove(RuntimeProperty);
        }
        if (!changed) return false;
        character.StatusJson = root.ToJsonString();
        return true;
    }

    private static IEnumerable<ActiveConditionRule> ActiveConditionRules(
        MesaCombate combat,
        MesaCombateParticipante participant,
        SistemaVersao version)
    {
        Dictionary<int, SistemaCondicao> rules = version.Condicoes.ToDictionary(rule => rule.IdSistemaCondicao);
        return combat.Condicoes
            .Where(condition => (ReferenceEquals(condition.Participante, participant) ||
                                 (participant.IdMesaCombateParticipante > 0 &&
                                  condition.IdParticipante == participant.IdMesaCombateParticipante)) &&
                                condition.Status == MesaCondicaoStatus.Ativa &&
                                rules.ContainsKey(condition.IdSistemaCondicao))
            .Select(condition => new ActiveConditionRule(condition, rules[condition.IdSistemaCondicao]));
    }

    private static bool BelongsToParticipant(
        MesaCondicaoAtiva condition,
        MesaCombateParticipante participant)
        => ReferenceEquals(condition.Participante, participant) ||
           (participant.IdMesaCombateParticipante > 0 &&
            condition.IdParticipante == participant.IdMesaCombateParticipante);

    private static void StartCooldown(
        MesaCombate combat,
        MesaCombateParticipante participant,
        MesaCondicaoAtiva condition,
        DateTime now)
    {
        if (condition.CooldownTurnos is not > 0) return;
        MesaCooldownAtivo? current = combat.Cooldowns.FirstOrDefault(item =>
            (ReferenceEquals(item.Participante, participant) ||
             item.IdParticipante == participant.IdMesaCombateParticipante) &&
            item.Status == MesaCooldownStatus.Ativo &&
            item.TipoOrigem == "CONDICAO" &&
            Normalize(item.IdOrigem) == Normalize(condition.CodigoSnapshot));
        if (current is not null)
        {
            current.TurnosRestantes = Math.Max(current.TurnosRestantes, condition.CooldownTurnos.Value);
            return;
        }
        combat.Cooldowns.Add(new MesaCooldownAtivo
        {
            IdMesaCombate = combat.IdMesaCombate,
            IdParticipante = participant.IdMesaCombateParticipante,
            TipoOrigem = "CONDICAO",
            IdOrigem = condition.CodigoSnapshot,
            NomeSnapshot = condition.NomeSnapshot,
            TurnosRestantes = condition.CooldownTurnos.Value,
            RodadaInicio = combat.RodadaAtual,
            TurnoInicio = combat.IndiceTurnoAtual,
            CriadoEmUtc = now,
            Combate = combat,
            Participante = participant,
        });
    }

    private static void ApplyImmediateResourceEffect(
        PersonagemJogador character,
        MesaCondicaoAtiva condition,
        SistemaCondicao rule,
        SistemaVersao version)
    {
        if (string.IsNullOrWhiteSpace(rule.CodigoRecurso) ||
            Normalize(rule.OperacaoEfeito) is not ("SOMAR" or "SUBTRAIR" or "DEFINIR"))
            return;
        decimal? configured = condition.Valor ?? rule.ValorEfeito;
        if (!configured.HasValue) return;
        int value = decimal.ToInt32(decimal.Truncate(configured.Value));
        if (value < 0) return;

        JsonObject root;
        try
        {
            root = JsonNode.Parse(string.IsNullOrWhiteSpace(character.StatusJson) ? "{}" : character.StatusJson) as JsonObject
                ?? new JsonObject();
        }
        catch (JsonException)
        {
            return;
        }
        SistemaRecursoConfig? resource = version.Recursos.FirstOrDefault(item =>
            item.Ativo && Normalize(item.Codigo) == Normalize(rule.CodigoRecurso));
        if (resource is null) return;
        JsonObject status = GetOrCreate(root, "status");
        string preferred = Normalize(rule.CodigoRecurso).ToLowerInvariant();
        string field = FindResourceKey(status, preferred) ?? preferred;
        int previous = ReadInt(status[field]);
        int current;
        try
        {
            current = Normalize(rule.OperacaoEfeito) switch
            {
                "SOMAR" => checked(previous + value),
                "SUBTRAIR" => checked(previous - value),
                _ => value,
            };
        }
        catch (OverflowException)
        {
            return;
        }
        int minimum = resource.PermiteValorNegativo
            ? decimal.ToInt32(decimal.Max(resource.ValorMinimo, int.MinValue))
            : Math.Max(0, decimal.ToInt32(decimal.Max(resource.ValorMinimo, 0)));
        string? maximumField = FindKey(status, $"{preferred}Maxima") ?? FindKey(status, $"{preferred}Maximo");
        int? maximum = maximumField is not null
            ? ReadInt(status[maximumField])
            : resource.ValorMaximo is decimal configuredMaximum
                ? decimal.ToInt32(decimal.Min(configuredMaximum, int.MaxValue))
                : null;
        current = Math.Max(minimum, current);
        if (maximum.HasValue) current = Math.Min(maximum.Value, current);
        status[field] = current;
        character.StatusJson = root.ToJsonString();
    }

    private static int ResolveNearDeathThreshold(PersonagemJogador character, SistemaMorteConfig death)
    {
        bool percentage = false;
        try
        {
            percentage = JsonNode.Parse(death.ConfiguracaoJson ?? "{}")?["limitesVidaEmPercentual"]?.GetValue<bool>() == true;
        }
        catch (Exception exception) when (exception is JsonException or InvalidOperationException) { }
        if (!percentage) return death.LimiteBeiraDaMorte;
        return TryReadStatusValue(character.StatusJson, "VIDA_MAXIMA", out decimal maximum)
            ? decimal.ToInt32(decimal.Floor(maximum * death.LimiteBeiraDaMorte / 100m))
            : death.LimiteBeiraDaMorte;
    }

    private static bool EvaluateTrigger(decimal actual, string? operation, decimal expected) => Normalize(operation) switch
    {
        "<" or "MENOR" => actual < expected,
        "<=" or "MENOR_OU_IGUAL" => actual <= expected,
        ">" or "MAIOR" => actual > expected,
        ">=" or "MAIOR_OU_IGUAL" => actual >= expected,
        "!=" or "DIFERENTE" => actual != expected,
        _ => actual == expected,
    };

    private static string SerializeRule(SistemaCondicao rule) => JsonSerializer.Serialize(new
    {
        rule.CodigoRecurso,
        rule.OperacaoEfeito,
        rule.ValorEfeito,
        rule.MomentoEfeito,
        rule.CodigoRecursoGatilho,
        rule.OperadorGatilho,
        rule.ValorGatilho,
        rule.CooldownTurnos,
        rule.RegraRemocao,
        rule.ConfiguracaoPadraoJson,
    });

    private static bool TryReadStatusValue(string? statusJson, string resourceCode, out decimal value)
    {
        value = 0;
        try
        {
            JsonObject root = JsonNode.Parse(string.IsNullOrWhiteSpace(statusJson) ? "{}" : statusJson) as JsonObject
                ?? new JsonObject();
            JsonObject? status = root[FindKey(root, "status") ?? string.Empty] as JsonObject;
            string? field = status is null ? null : FindResourceKey(status, resourceCode);
            if (field is null) return false;
            value = ReadDecimal(status![field]);
            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private static decimal CalculateInventoryWeight(string? inventoryJson)
    {
        JsonNode? root;
        try { root = JsonNode.Parse(string.IsNullOrWhiteSpace(inventoryJson) ? "[]" : inventoryJson); }
        catch (JsonException) { return 0; }
        IEnumerable<JsonObject> items = root switch
        {
            JsonArray array => array.OfType<JsonObject>(),
            JsonObject objectRoot => (objectRoot[FindKey(objectRoot, "itens") ?? string.Empty] as JsonArray)?.OfType<JsonObject>() ?? [],
            _ => [],
        };
        decimal total = 0;
        foreach (JsonObject item in items)
        {
            string type = item[FindKey(item, "tipo") ?? string.Empty]?.GetValue<string>() ?? string.Empty;
            JsonObject? attributes = item[FindKey(item, "atributos") ?? string.Empty] as JsonObject;
            JsonObject? exploded = attributes?[FindKey(attributes, "__vistaExplodida") ?? string.Empty] as JsonObject;
            bool equippedSuit = Normalize(type) == "TRAJE" &&
                                 exploded?[FindKey(exploded, "equippedSlot") ?? string.Empty] is not null;
            if (equippedSuit) continue;
            decimal weight = ReadDecimal(item[FindKey(item, "peso") ?? string.Empty]);
            if (weight <= 0 && attributes is not null)
            {
                foreach (string field in new[] { "peso", "espaco", "espacoOcupado" })
                {
                    weight = ReadDecimal(attributes[FindKey(attributes, field) ?? string.Empty]);
                    if (weight > 0) break;
                }
            }
            decimal quantity = Math.Max(1, ReadDecimal(item[FindKey(item, "quantidade") ?? string.Empty]));
            if (weight > 0) total += weight * quantity;
        }
        return total;
    }

    private static void ClampCurrent(JsonObject status, string resource, int maximum)
    {
        string? currentKey = FindKey(status, resource);
        if (currentKey is null) return;
        int current = ReadInt(status[currentKey]);
        if (current > maximum) status[currentKey] = maximum;
    }

    private static JsonObject GetOrCreate(JsonObject source, string property)
    {
        string? key = FindKey(source, property);
        if (key is not null && source[key] is JsonObject current) return current;
        var created = new JsonObject();
        source[property] = created;
        return created;
    }

    private static string? FindKey(JsonObject source, string property)
        => source.FirstOrDefault(pair => pair.Key.Equals(property, StringComparison.OrdinalIgnoreCase)).Key;

    private static string? FindResourceKey(JsonObject source, string resourceCode)
    {
        string preferred = Normalize(resourceCode).ToLowerInvariant();
        return FindKey(source, preferred) ?? source
            .FirstOrDefault(pair => Canonical(pair.Key) == Canonical(resourceCode)).Key;
    }

    private static int ReadInt(JsonNode? node)
    {
        if (node is not JsonValue value) return 0;
        if (value.TryGetValue(out int integer)) return integer;
        if (value.TryGetValue(out decimal number)) return decimal.ToInt32(decimal.Truncate(number));
        return value.TryGetValue(out string? text) && int.TryParse(text, out int parsed) ? parsed : 0;
    }

    private static decimal ReadDecimal(JsonNode? node)
    {
        if (node is not JsonValue value) return 0;
        if (value.TryGetValue(out decimal number)) return number;
        if (value.TryGetValue(out double floating)) return Convert.ToDecimal(floating, CultureInfo.InvariantCulture);
        return value.TryGetValue(out string? text) && decimal.TryParse(
            text?.Replace(',', '.'), NumberStyles.Number, CultureInfo.InvariantCulture, out decimal parsed)
            ? parsed
            : 0;
    }

    private static string Normalize(string? value)
        => (value ?? string.Empty).Trim().ToUpperInvariant().Replace('-', '_').Replace(' ', '_');

    private static string Canonical(string? value)
        => string.Concat((value ?? string.Empty).Where(char.IsLetterOrDigit)).ToUpperInvariant();

    private sealed record ActiveConditionRule(MesaCondicaoAtiva Condition, SistemaCondicao Rule);
}
