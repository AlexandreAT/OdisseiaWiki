using OdisseiaWiki.Dtos;

namespace OdisseiaWiki.GameRuns;

/// <summary>Explicit story contracts; prose never becomes an executable rule.</summary>
public static class GameStoryRules
{
    public static IEnumerable<GameModeAreaOptionDto> Routes(IEnumerable<GameModeAreaDto> areas) =>
        areas.SelectMany(area => area.Options.SelectMany(option => new[] { option }
            .Concat(option.SurpriseOptions ?? [])));

    public static IEnumerable<GameStoryOutcomeDto> Outcomes(IEnumerable<GameModeAreaDto> areas) =>
        Routes(areas).SelectMany(option => (option.Choices ?? []).Select(choice => choice.Outcome)
            .Concat(option.Mission is { } mission ? new[] { mission.Reward } : []));

    public static string? Validate(GameModeAreaOptionDto option, IReadOnlyList<GameModeAreaDto> areas)
    {
        if (option.Type == "SURPRESA")
        {
            if (option.SurpriseOptions is not { Count: >= 1 and <= 10 } || option.SurpriseOptions.Any(route =>
                route is null || route.Type == "SURPRESA" || route.SurpriseOptions is null || route.SurpriseOptions.Count > 0))
                return "configure de 1 a 10 possíveis encontros, sem incluir outro Encontro desconhecido.";
        }
        else if (option.SurpriseOptions is not { Count: 0 }) return "encontros ocultos só pertencem a rotas Encontro desconhecido.";
        if (option.Choices is null || option.Choices.Count > 6 || option.Choices.Any(choice => choice is null))
            return "configure até seis escolhas válidas para o evento.";
        if (option.Type != "EVENTO" && option.Choices.Count > 0) return "escolhas pertencem a rotas Evento.";
        if (option.Choices.Select(choice => choice.Code).Distinct(StringComparer.Ordinal).Count() != option.Choices.Count)
            return "cada escolha precisa de um código diferente.";
        if (option.Choices.Count > 0 && !option.Choices.Any(choice => choice.Cost is { Currency: 0, Life: 0, Mana: 0, Stamina: 0 }))
            return "deixe ao menos uma escolha sem custo para não prender o jogador no evento.";
        foreach (var choice in option.Choices)
        {
            if (string.IsNullOrWhiteSpace(choice.Code) || choice.Code.Length > 80 ||
                string.IsNullOrWhiteSpace(choice.Label) || choice.Label.Length > 100 ||
                choice.Description?.Length > 500 || choice.ResultText?.Length > 500)
                return "preencha código, nome e textos curtos de cada escolha.";
            string? error = ValidateCost(choice.Cost) ?? ValidateOutcome(choice.Outcome);
            if (error is not null) return $"{choice.Label}: {error}";
        }
        if (option.Type == "MISSAO")
        {
            if (option.Mission is not { } mission || !areas.Any(area => area.IsSecret &&
                !area.IsSecretFinal && area.Code == mission.AreaCode))
                return "escolha uma área secundária sem final secreto para a missão.";
            if (!mission.CanDecline && mission.Cost is not { Currency: 0, Life: 0, Mana: 0, Stamina: 0 })
                return "uma missão obrigatória precisa ser sem custo; permita recusar para cobrar a entrada.";
            return ValidateCost(mission.Cost) ?? ValidateOutcome(mission.Reward);
        }
        if (option.Mission is not null) return "objetivo de missão só pertence a rotas Missão.";
        return null;
    }

    public static string? ValidateCost(GameStoryCostDto? cost) => cost is null ||
        cost.Currency is < 0 or > 1000000000 || cost.Life is < 0 or > 1000000 ||
        cost.Mana is < 0 or > 1000000 || cost.Stamina is < 0 or > 1000000
            ? "use custos não negativos, até 1.000.000 por recurso e 1.000.000.000 moedas." : null;

    public static string? ValidateOutcome(GameStoryOutcomeDto? outcome)
    {
        if (outcome is null || outcome.Currency is < 0 or > 1000000000 || outcome.Xp is < 0 or > 1000000 ||
            outcome.GameMinutes is < 0 or > 1000000 || new[] { outcome.Life, outcome.Mana, outcome.Stamina }
                .Any(value => Math.Abs((long)value) > (outcome.Percentage ? 100 : 1000000)))
            return "revise moedas, XP, tempo e recursos; percentuais vão de −100 a 100.";
        if (outcome.Items is null or { Count: > 20 } || outcome.Items.Any(item => item is null ||
            string.IsNullOrWhiteSpace(item.ItemId) || item.ItemId.Length > 100 || item.Quantity is < 1 or > 999) ||
            outcome.Items.Select(item => item.ItemId).Distinct(StringComparer.Ordinal).Count() != outcome.Items.Count)
            return "escolha até 20 itens diferentes, com quantidade de 1 a 999.";
        if (outcome.Conditions is null or { Count: > 20 } || outcome.Conditions.Any(condition => condition is null ||
            string.IsNullOrWhiteSpace(condition.Code) || condition.Code.Length > 80 || condition.Duration is < 1 or > 1000000 ||
            condition.Value is < -1000000 or > 1000000 || condition.DurationUnit is not (null or "Turno" or "Hora")))
            return "revise código, valor e duração das condições do Sistema.";
        return null;
    }
}
