using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Services;
using OdisseiaWiki.Services.Interfaces;
using System.Text.Json;
using OdisseiaWiki.Services.Helpers;

namespace OdisseiaWiki.GameRuns.Battle;

/// <summary>
/// Pure battle simulation with a technical event budget, not a gameplay round limit.
/// no Mesa state, database, clock, character sheet or published-version lookup is accessed here.
/// </summary>
public sealed class AutoBattleSimulator : IAutoBattleSimulator
{
    private const int EventSchemaVersion = 1;

    public GameBattleResult Simulate(GameBattleInput input, IDiceRandomSource random)
    {
        ArgumentNullException.ThrowIfNull(input);
        ArgumentNullException.ThrowIfNull(random);
        Validate(input);

        ActorState[] actors = new[] { input.FirstActor, input.SecondActor }
            .Concat(input.AdditionalEnemies).Select(spec => new ActorState(spec)).ToArray();
        var initiative = actors.Select((actor, index) =>
        {
            GameBattleInitiativeSpec? plan = input.UseInitiative ? actor.Spec.Initiative : null;
            int[] dice = plan is null ? [] : Enumerable.Range(0, plan.Quantity)
                .Select(_ => random.NextInclusive(plan.Faces)).ToArray();
            return new { Index = index, Plan = plan, Dice = dice,
                Total = dice.Sum() + (plan?.Modifier ?? 0) };
        }).ToArray();
        int[] turnOrder = initiative.OrderByDescending(entry => entry.Total)
            .ThenBy(entry => entry.Index).Select(entry => entry.Index).ToArray();
        var events = new List<GameBattleEvent>();
        var evaluator = new GameplayRollEvaluator(new DiceRoller(random));
        int round = 0;
        int roundsCompleted = 0;
        int turnsWithoutProgress = 0;
        string? winnerId = null;
        GameBattleEndReason reason = GameBattleEndReason.EventLimit;
        bool evaluatingAutomaticConditions = false;
        bool turnHadProgress = false;

        Emit(GameBattleEventTypes.BattleStarted, null, null,
            new BattleStartedPayload(turnOrder.Select(index => actors[index].Spec.Id).ToArray()));
        foreach (var entry in initiative.Where(entry => entry.Plan is not null))
            Emit(GameBattleEventTypes.InitiativeRolled, actors[entry.Index].Spec.Id, null,
                new InitiativeRolledPayload(entry.Plan!.Formula, entry.Dice,
                    entry.Plan.Modifier, entry.Total));
        foreach (ActorState actor in actors) EvaluateAutomaticConditions(actor);

        bool finished = false;
        bool[] pendingReaction = new bool[actors.Length];
        for (round = 1; !finished; round++)
        {
            int[] actionsThisRound = round == 1 && input.OpeningOpportunityAttack
                ? [1, .. turnOrder] : turnOrder;
            for (int turnPosition = 0; turnPosition < actionsThisRound.Length; turnPosition++)
            {
                int actorIndex = actionsThisRound[turnPosition];
                bool openingOpportunity = round == 1 && input.OpeningOpportunityAttack && turnPosition == 0;
                ActorState actor = actors[actorIndex];
                ActorState? target = actorIndex == 0
                    ? actors.Skip(1).FirstOrDefault(candidate => candidate.HitPoints > 0 &&
                        input.PreferredTargets.TryGetValue(actor.Spec.Id, out string? preferred) &&
                        candidate.Spec.Id == preferred)
                        ?? actors.Skip(1).FirstOrDefault(candidate => candidate.HitPoints > 0)
                    : actors[0];
                if (actor.HitPoints == 0 || target is null || target.HitPoints == 0)
                    continue;
                int targetIndex = Array.IndexOf(actors, target);

                // Reserve enough room for every event this turn can emit and BATTLE_ENDED.
                // The bound also covers an unavailable event for every action and every cooldown.
                int worstCaseTurnEvents = (pendingReaction[actorIndex] ? 2 : 1) *
                    (12 + 2 * actor.Actions.Count +
                     (actor.Actions.Any(action => action.Spec.Utility is not null) ? actor.Actions.Count : 0) +
                     (actor.Spec.Rest is null ? 0 : 4 + 3 * actor.Actions.Count) +
                     actor.ActiveConditions.Sum(condition => 4 + 6 * EffectiveEffects(condition).Count()) +
                     target.ActiveConditions.Sum(condition => 2 * EffectiveEffects(condition).Count()) +
                     actor.Actions.Sum(action => action.Spec.Conditions.Sum(condition =>
                         (10 + 6 * Math.Max(1, condition.Rule.Effects.Count)) *
                         (condition.Target == "TODOS_INIMIGOS" ? actors.Length - 1 : 1))) +
                     actor.Actions.Sum(action => action.Spec.Conditions.Sum(condition =>
                         condition.Target == "TODOS_INIMIGOS" ? 4 * (actors.Length - 1) :
                         condition.ResistanceTest is null ? 0 : 1)));
                if (events.Count + worstCaseTurnEvents + 1 > input.MaxEvents)
                {
                    reason = GameBattleEndReason.EventLimit;
                    finished = true;
                    break;
                }

                int attempts = pendingReaction[actorIndex] ? 2 : 1;
                pendingReaction[actorIndex] = false;
                for (int attempt = 0; attempt < attempts && !finished; attempt++)
                {
                bool reaction = attempts == 2 && attempt == 0;
                turnHadProgress = false;
                try
                {
                if (!openingOpportunity)
                {
                    actor.TurnCount++;
                    Emit(GameBattleEventTypes.TurnStarted, actor.Spec.Id, null,
                        new TurnStartedPayload(actor.TurnCount));
                    TickConditions(actor, "INICIO_TURNO");
                    if (actor.HitPoints == 0)
                    {
                        FinishIfDefeated(actorIndex);
                        if (finished) break;
                        continue;
                    }
                    foreach (ActionState action in actor.Actions.Where(action => action.NextAvailableTurn > 0))
                    {
                        turnHadProgress = true;
                        int remaining = Math.Max(0, action.NextAvailableTurn - actor.TurnCount);
                        Emit(GameBattleEventTypes.CooldownAdvanced, actor.Spec.Id, null,
                            new CooldownAdvancedPayload(action.Spec.Id, remaining));
                        if (remaining == 0)
                            action.NextAvailableTurn = 0;
                    }
                    if (actor.TurnsToSkip > 0)
                    {
                        actor.TurnsToSkip--;
                        turnHadProgress = true;
                        Emit(GameBattleEventTypes.TurnPassed, actor.Spec.Id, null,
                            new TurnPassedPayload("CONDITION"));
                        TickConditions(actor, "FIM_TURNO");
                        AdvanceConditions(actor);
                        if (actor.HitPoints == 0) FinishIfDefeated(actorIndex);
                        continue;
                    }
                }
                bool acted = false;
                ActionState? reloadCandidate = null;
                bool skipRest = actor.SkipRestNextTurn;
                if (!reaction) actor.SkipRestNextTurn = false;
                int startIndex = !reaction && skipRest ? actor.Spec.Rest?.AfterActionIndex ?? 0 : 0;
                // Utilities run once per priority cycle. A second scan only starts a new cycle
                // after every equipped alternative has been checked, never in place of a reload.
                for (int selectionPass = 0; selectionPass < 2; selectionPass++)
                {
                for (int actionIndex = startIndex; actionIndex < actor.Actions.Count; actionIndex++)
                {
                    if (!openingOpportunity && !reaction && !skipRest && actor.Spec.Rest is { } rest &&
                        actionIndex == rest.AfterActionIndex)
                    {
                        Emit(GameBattleEventTypes.ActionSelected, actor.Spec.Id, null,
                            new ActionSelectedPayload("descanso", "Descanso curto", false));
                        Emit(GameBattleEventTypes.RestPerformed, actor.Spec.Id, null,
                            new RestPerformedPayload("descanso"));
                        Recover(actor, "hitPoints", rest.Life, rest.Percentage);
                        Recover(actor, "mana", rest.Mana, rest.Percentage);
                        Recover(actor, "stamina", rest.Stamina, rest.Percentage);
                        RemoveConditions(actor, "DESCANSO_SIMPLES", "Descanso curto");
                        foreach (ActionState weapon in actor.Actions.Where(candidate => candidate.Spec.Magazine is not null))
                        {
                            int before = weapon.Loaded;
                            int reserveBefore = weapon.Reserve;
                            int amount = weapon.Spec.Magazine!.UnlimitedReserve
                                ? weapon.Spec.Magazine.Capacity - before
                                : Math.Min(weapon.Spec.Magazine.Capacity - before, weapon.Reserve);
                            weapon.Loaded += amount;
                            if (!weapon.Spec.Magazine.UnlimitedReserve) weapon.Reserve -= amount;
                            EmitChange("loadedAmmo", before, weapon.Loaded, weapon.Spec.Id, actor.Spec.Id, null);
                            EmitChange("reserveAmmo", reserveBefore, weapon.Reserve, weapon.Spec.Id, actor.Spec.Id, null);
                        }
                        foreach (ActionState limited in actor.Actions.Where(candidate => candidate.Spec.UsesUntilRest > 0))
                            limited.UsesRemaining = limited.Spec.UsesUntilRest;
                        // Rest renews the cycle like a reload, but the next turn still
                        // continues after this bonus slot before returning to top priority.
                        foreach (ActionState candidate in actor.Actions)
                            candidate.UtilityUsedInCycle = false;
                        actor.SkipRestNextTurn = true;
                        acted = true;
                        break;
                    }
                    ActionState action = actor.Actions[actionIndex];
                    if (action.UtilityUsedInCycle)
                        continue;
                    if (action.Spec.IsFallback && (reloadCandidate is not null ||
                        selectionPass == 0 && actor.Actions.Any(candidate => candidate.UtilityUsedInCycle)))
                        continue;
                    int quantity = EffectiveQuantity(action);
                    string? unavailable = UnavailableReason(actor, action, quantity);
                    if (unavailable is not null)
                    {
                        Emit(GameBattleEventTypes.ActionUnavailable, actor.Spec.Id, target.Spec.Id,
                            new ActionUnavailablePayload(action.Spec.Id, unavailable));
                        continue;
                    }

                    if (quantity == 0 && action.Spec.Magazine is not null)
                    {
                        // A recarga é candidata, mas ações equipadas posteriores
                        // ainda têm prioridade sobre ela quando são executáveis.
                        reloadCandidate ??= action;
                        continue;
                    }

                    int staminaCost = checked(action.Spec.StaminaCost * quantity +
                        action.Spec.AdditionalAttackStaminaCost * (quantity - 1));
                    Emit(GameBattleEventTypes.ActionSelected, actor.Spec.Id, target.Spec.Id,
                        new ActionSelectedPayload(action.Spec.Id,
                            openingOpportunity ? $"Oportunidade · {action.Spec.Name}" :
                            reaction ? $"Revidar · {action.Spec.Name}" : action.Spec.Name, false)
                        { Reaction = reaction, Quantity = quantity,
                          DirectUse = action.Spec.Utility is not null });
                    if (action.Spec.ManaCost > 0)
                    {
                        int before = actor.Mana;
                        actor.Mana -= checked(action.Spec.ManaCost * quantity);
                        EmitChange("mana", before, actor.Mana, action.Spec.Id, actor.Spec.Id, null);
                    }
                    if (staminaCost > 0)
                    {
                        int before = actor.Stamina;
                        actor.Stamina -= staminaCost;
                        EmitChange("stamina", before, actor.Stamina, action.Spec.Id, actor.Spec.Id, null);
                    }
                    if (action.Spec.Magazine is not null)
                    {
                        int before = action.Loaded;
                        action.Loaded -= checked(action.Spec.Magazine.AmmoPerUse * quantity);
                        EmitChange("loadedAmmo", before, action.Loaded, action.Spec.Id, actor.Spec.Id, null);
                    }
                    if (action.Spec.UsesUntilRest > 0)
                        action.UsesRemaining -= quantity;

                    if (action.Spec.Utility is { } utility)
                    {
                        action.UtilityUsedInCycle = true;
                        if (action.RemainingQuantity is int remaining)
                        {
                            action.RemainingQuantity = remaining - 1;
                            Emit(GameBattleEventTypes.ItemConsumed, actor.Spec.Id, null,
                                new ItemConsumedPayload(action.Spec.Id, action.RemainingQuantity.Value));
                        }
                        Recover(actor, "hitPoints", utility.RestoreLife, false, action.Spec.Id, true);
                        Recover(actor, "mana", utility.RestoreMana, false, action.Spec.Id);
                        Recover(actor, "stamina", utility.RestoreStamina, false, action.Spec.Id);
                        ApplyActionConditions(actor, action, null, null, target);
                        if (action.Spec.CooldownTurns > 0)
                        {
                            action.NextAvailableTurn = actor.TurnCount + action.Spec.CooldownTurns + 1;
                            Emit(GameBattleEventTypes.CooldownStarted, actor.Spec.Id, null,
                                new CooldownStartedPayload(action.Spec.Id, action.Spec.CooldownTurns,
                                    action.NextAvailableTurn));
                        }
                        acted = true;
                        break;
                    }

                    GameplayRollPlan rollPlan = openingOpportunity
                        ? action.Spec.Roll with { Mode = GameplayRollMode.Vantagem }
                        : action.Spec.Roll;
                    int conditionModifier = actor.ActiveConditions.SelectMany(EffectiveEffects)
                        .Where(effect => (effect.Operacao.Equals("MODIFICAR_ROLAGEM", StringComparison.OrdinalIgnoreCase) ||
                            effect.Operacao.Equals("MODIFICAR_ATRIBUTO", StringComparison.OrdinalIgnoreCase)) &&
                            (effect.Recurso.Equals("TODOS", StringComparison.OrdinalIgnoreCase) ||
                             effect.Recurso.Equals(action.Spec.AttributeCode, StringComparison.OrdinalIgnoreCase)))
                        .Sum(effect => effect.Valor);
                    bool advantage = rollPlan.Mode == GameplayRollMode.Vantagem || actor.ActiveConditions
                        .SelectMany(EffectiveEffects).Any(effect => effect.Operacao == "VANTAGEM");
                    bool disadvantage = rollPlan.Mode == GameplayRollMode.Desvantagem || actor.ActiveConditions
                        .SelectMany(EffectiveEffects).Any(effect => effect.Operacao == "DESVANTAGEM");
                    if (conditionModifier != 0 || advantage || disadvantage)
                        rollPlan = rollPlan with
                        {
                            Modifier = checked(rollPlan.Modifier + conditionModifier),
                            Mode = advantage == disadvantage ? GameplayRollMode.Normal :
                                advantage ? GameplayRollMode.Vantagem : GameplayRollMode.Desvantagem,
                            ModifierDetails = conditionModifier == 0 ? rollPlan.ModifierDetails :
                                (rollPlan.ModifierDetails ?? []).Concat([new GameplayModifierDto
                                {
                                    Codigo = "CONDICAO", Nome = "Condições ativas",
                                    Origem = "CONDICAO", Valor = conditionModifier,
                                }]).ToArray(),
                        };
                    GameplayRollResultDto roll = evaluator.Evaluate(rollPlan);
                    GameplayResolvedResultRange range = ResolveRange(action.Spec, roll);
                    int baseDamage = checked(action.Spec.DamageByResultCode[range.Code] * quantity);
                    int damageModifier = actor.ActiveConditions.SelectMany(EffectiveEffects)
                        .Where(effect => effect.Operacao == "MODIFICAR_DANO" && effect.Recurso == "TODOS")
                        .Sum(effect => effect.Valor);
                    int damage = baseDamage > 0 ? Math.Max(0, checked(baseDamage + damageModifier)) : 0;
                    Emit(GameBattleEventTypes.DiceRolled, actor.Spec.Id, target.Spec.Id,
                        new DiceRolledPayload(action.Spec.Id, rollPlan.Mode, roll, range.Code)
                        {
                            ResultName = range.Name,
                            Critical = range.Critical,
                            CriticalFailure = range.CriticalFailure,
                        });
                    Emit(GameBattleEventTypes.DamageCalculated, actor.Spec.Id, target.Spec.Id,
                        new DamageCalculatedPayload(action.Spec.Id, range.Code, damage));
                    if (range.CriticalFailure && GrantsCounterattack(range.EffectJson))
                        pendingReaction[targetIndex] = true;

                    if (damage > 0)
                    {
                        int hitPointsBefore = target.HitPoints;
                        int shieldBefore = target.Shield;
                        int protectionBefore = target.Protection;
                        int remaining = ApplyDefenses(target, damage, actor.Spec.Id);
                        if (remaining > 0)
                        {
                            int before = target.HitPoints;
                            target.HitPoints = Math.Max(0, before - remaining);
                            EmitChange("hitPoints", before, target.HitPoints,
                                action.Spec.Id, actor.Spec.Id, target.Spec.Id);
                        }
                        turnHadProgress |= target.HitPoints != hitPointsBefore ||
                            target.Shield != shieldBefore ||
                            target.Protection != protectionBefore;
                    }

                    ReportContributions(actor, effect =>
                        (effect.Operacao is "MODIFICAR_ROLAGEM" or "MODIFICAR_ATRIBUTO") &&
                        (effect.Recurso == "TODOS" || effect.Recurso.Equals(action.Spec.AttributeCode, StringComparison.OrdinalIgnoreCase)) ||
                        effect.Operacao is "VANTAGEM" or "DESVANTAGEM", "NO_TESTE");
                    if (baseDamage > 0)
                        ReportContributions(actor, effect => effect.Operacao == "MODIFICAR_DANO" &&
                            effect.Recurso == "TODOS", "NO_DANO");
                    if (damage > 0)
                        ReportContributions(target, effect => effect.Operacao == "MODIFICAR_DEFESA", "NA_DEFESA");

                    // Uma origem em área ainda alcança os outros inimigos vivos quando
                    // o alvo primário cai pelo dano da mesma ação.
                    ApplyActionConditions(actor, action, roll, range, target);
                    if (action.Spec.RemovesConditions.Count > 0 && SuccessfulRange(range))
                        RemoveConditions(actor, "MAGIA", "Magia", action.Spec.RemovesConditions);

                    if (target.HitPoints == 0)
                    {
                        Emit(GameBattleEventTypes.ActorDefeated, target.Spec.Id, null,
                            new ActorDefeatedPayload(target.Spec.Id));
                        if (targetIndex == 0 || actors.Skip(1).All(candidate => candidate.HitPoints == 0))
                        {
                            winnerId = actor.Spec.Id;
                            reason = GameBattleEndReason.ActorDefeated;
                            finished = true;
                        }
                    }
                    if (action.Spec.CooldownTurns > 0)
                    {
                        action.NextAvailableTurn = actor.TurnCount + action.Spec.CooldownTurns + 1;
                        Emit(GameBattleEventTypes.CooldownStarted, actor.Spec.Id, null,
                            new CooldownStartedPayload(action.Spec.Id, action.Spec.CooldownTurns, action.NextAvailableTurn));
                    }
                    acted = true;
                    break;
                }
                if (acted || reloadCandidate is not null ||
                    !actor.Actions.Any(candidate => candidate.UtilityUsedInCycle))
                    break;
                foreach (ActionState candidate in actor.Actions)
                    candidate.UtilityUsedInCycle = false;
                }

                if (!acted && reloadCandidate is { Spec.Magazine: not null } reload)
                {
                    foreach (ActionState candidate in actor.Actions)
                        candidate.UtilityUsedInCycle = false;
                    int loadedBefore = reload.Loaded;
                    int reserveBefore = reload.Reserve;
                    int amount = reload.Spec.Magazine.UnlimitedReserve
                        ? reload.Spec.Magazine.Capacity - reload.Loaded
                        : Math.Min(reload.Spec.Magazine.Capacity - reload.Loaded, reload.Reserve);
                    reload.Loaded += amount;
                    if (!reload.Spec.Magazine.UnlimitedReserve) reload.Reserve -= amount;
                    Emit(GameBattleEventTypes.ActionSelected, actor.Spec.Id, null,
                        new ActionSelectedPayload(reload.Spec.Id, reload.Spec.Name, true)
                        { Reaction = reaction });
                    Emit(GameBattleEventTypes.ReloadPerformed, actor.Spec.Id, null,
                        new ReloadPerformedPayload(reload.Spec.Id, loadedBefore, reload.Loaded, reload.Reserve));
                    EmitChange("loadedAmmo", loadedBefore, reload.Loaded, reload.Spec.Id, actor.Spec.Id, null);
                    EmitChange("reserveAmmo", reserveBefore, reload.Reserve, reload.Spec.Id, actor.Spec.Id, null);
                    acted = true;
                }

                if (!acted)
                    Emit(GameBattleEventTypes.TurnPassed, actor.Spec.Id, null,
                        new TurnPassedPayload("NO_AVAILABLE_ACTION"));
                if (!openingOpportunity && actor.HitPoints > 0)
                {
                    TickConditions(actor, "FIM_TURNO");
                    AdvanceConditions(actor);
                    if (actor.HitPoints == 0) FinishIfDefeated(actorIndex);
                }
                }
                finally
                {
                    // Reactions do not spend a regular turn. Any real resource change
                    // still resets the stall counter, including reloads and recovery.
                    if (turnHadProgress) turnsWithoutProgress = 0;
                    else if (!openingOpportunity && !reaction) turnsWithoutProgress++;
                    if (!finished && turnsWithoutProgress >= input.MaxTurnsWithoutProgress)
                    {
                        reason = GameBattleEndReason.NoDamage;
                        finished = true;
                    }
                }
                }
                if (finished)
                    break;
            }

            if (finished)
                break;

            roundsCompleted++;
        }

        int lastRound = round;
        Emit(GameBattleEventTypes.BattleEnded, null, null,
            new BattleEndedPayload(winnerId, reason), lastRound);
        return new GameBattleResult(
            winnerId,
            reason,
            roundsCompleted,
            actors.Select(actor => actor.ToSnapshot()).ToArray(),
            events.ToArray());

        int ApplyDefenses(ActorState defender, int rawDamage, string attackerId)
        {
            int remaining = rawDamage;
            foreach (GameBattleDefenseKind kind in input.DefenseOrder)
            {
                if (remaining == 0)
                    break;

                int absorbed;
                int after;
                switch (kind)
                {
                    case GameBattleDefenseKind.Shield when defender.Shield > 0:
                        absorbed = Math.Min(remaining, defender.Shield);
                        defender.Shield = 0;
                        after = defender.Shield;
                        break;
                    case GameBattleDefenseKind.Protection when defender.Protection > 0:
                        absorbed = Math.Min(remaining, defender.Protection);
                        defender.Protection -= absorbed;
                        after = defender.Protection;
                        break;
                    case GameBattleDefenseKind.Armor when defender.EffectiveArmor() > 0:
                        absorbed = Math.Min(remaining, defender.EffectiveArmor());
                        after = defender.EffectiveArmor();
                        break;
                    default:
                        continue;
                }
                remaining -= absorbed;
                Emit(GameBattleEventTypes.DefenseApplied, attackerId, defender.Spec.Id,
                    new DefenseAppliedPayload(kind, absorbed, remaining, after));
            }
            return remaining;
        }

        void FinishIfDefeated(int defeatedIndex)
        {
            ActorState defeated = actors[defeatedIndex];
            Emit(GameBattleEventTypes.ActorDefeated, defeated.Spec.Id, null,
                new ActorDefeatedPayload(defeated.Spec.Id));
            if (defeatedIndex == 0 || actors.Skip(1).All(candidate => candidate.HitPoints == 0))
            {
                winnerId = defeatedIndex == 0 ? actors.Skip(1).First(candidate => candidate.HitPoints > 0).Spec.Id
                    : actors[0].Spec.Id;
                reason = GameBattleEndReason.ActorDefeated;
                finished = true;
            }
        }

        void ApplyActionConditions(ActorState source, ActionState action, GameplayRollResultDto? roll,
            GameplayResolvedResultRange? range, ActorState target)
        {
            foreach (GameBattleConditionApplication origin in action.Spec.Conditions)
            {
                bool applies = origin.Trigger.ToUpperInvariant() switch
                {
                    "AO_USAR" => true,
                    "RESULTADO_NATURAL" => roll?.ValorNatural.HasValue == true &&
                        (origin.NaturalResults.Contains(roll.ValorNatural.Value) ||
                         roll.ValorNatural.Value >= (origin.NaturalMinimum ?? 1) &&
                         roll.ValorNatural.Value <= (origin.NaturalMaximum ?? 20) &&
                         (origin.NaturalMinimum.HasValue || origin.NaturalMaximum.HasValue)),
                    "RESULTADO_CLASSIFICADO" => !string.IsNullOrWhiteSpace(origin.OutcomeCode) &&
                        range is not null && range.Code.Equals(origin.OutcomeCode, StringComparison.OrdinalIgnoreCase),
                    _ => range is not null && SuccessfulRange(range),
                };
                if (!applies) continue;
                IEnumerable<ActorState> recipients = origin.Target.Equals("USUARIO", StringComparison.OrdinalIgnoreCase)
                    ? [source] : origin.Target.Equals("TODOS_INIMIGOS", StringComparison.OrdinalIgnoreCase)
                        ? source == actors[0] ? actors.Skip(1) : [actors[0]] : [target];
                GameBattleConditionRule rule = origin.Rule;
                int value = origin.Value ?? rule.Value;
                int? turns = origin.Unit.Equals("Turno", StringComparison.OrdinalIgnoreCase)
                    ? origin.Duration : null;
                int? hours = origin.Unit.Equals("Hora", StringComparison.OrdinalIgnoreCase)
                    ? origin.Duration : null;
                foreach (ActorState recipient in recipients.Where(candidate => candidate.HitPoints > 0))
                {
                    if (origin.ResistanceTest is { } resistance)
                    {
                        int[] dice = Enumerable.Range(0, resistance.Dice)
                            .Select(_ => random.NextInclusive(resistance.Faces)).ToArray();
                        bool advantage = recipient.ActiveConditions.SelectMany(EffectiveEffects)
                            .Any(effect => effect.Operacao.Equals("VANTAGEM", StringComparison.OrdinalIgnoreCase));
                        bool disadvantage = recipient.ActiveConditions.SelectMany(EffectiveEffects)
                            .Any(effect => effect.Operacao.Equals("DESVANTAGEM", StringComparison.OrdinalIgnoreCase));
                        GameplayRollMode mode = advantage == disadvantage ? GameplayRollMode.Normal :
                            advantage ? GameplayRollMode.Vantagem : GameplayRollMode.Desvantagem;
                        int[]? alternativeDice = mode == GameplayRollMode.Normal ? null :
                            Enumerable.Range(0, resistance.Dice)
                                .Select(_ => random.NextInclusive(resistance.Faces)).ToArray();
                        int attribute = recipient.Spec.Attributes.FirstOrDefault(pair => pair.Key.Equals(
                            resistance.AttributeCode, StringComparison.OrdinalIgnoreCase)).Value;
                        int modifier = checked(attribute + recipient.ActiveConditions.SelectMany(EffectiveEffects)
                            .Where(effect => effect.Operacao is ("MODIFICAR_ATRIBUTO" or "MODIFICAR_ROLAGEM") &&
                                (effect.Recurso.Equals(resistance.AttributeCode, StringComparison.OrdinalIgnoreCase) ||
                                 effect.Recurso.Equals("TODOS", StringComparison.OrdinalIgnoreCase)))
                            .Sum(effect => effect.Valor));
                        int rolled = alternativeDice is null ? dice.Sum() :
                            mode == GameplayRollMode.Vantagem ? Math.Max(dice.Sum(), alternativeDice.Sum()) :
                            Math.Min(dice.Sum(), alternativeDice.Sum());
                        int total = checked(rolled + modifier);
                        bool passed = total >= resistance.Difficulty;
                        Emit(GameBattleEventTypes.ResistanceRolled, recipient.Spec.Id, source.Spec.Id,
                            new ResistanceRolledPayload(rule.Code, dice, resistance.AttributeCode,
                                modifier, total, resistance.Difficulty, passed)
                            { AlternativeDice = alternativeDice, Mode = mode });
                        ReportContributions(recipient, effect =>
                            (effect.Operacao is "MODIFICAR_ROLAGEM" or "MODIFICAR_ATRIBUTO") &&
                            (effect.Recurso == "TODOS" || effect.Recurso.Equals(resistance.AttributeCode, StringComparison.OrdinalIgnoreCase)) ||
                            effect.Operacao is "VANTAGEM" or "DESVANTAGEM", "NO_TESTE");
                        if (passed) continue;
                    }
                    int previous = recipient.ActiveConditions.FindIndex(condition => condition.Rule.Code == rule.Code);
                    if (previous >= 0 && !rule.Stackable && !rule.ReplaceExisting) continue;
                    if (previous >= 0 && !rule.Stackable) recipient.ActiveConditions.RemoveAt(previous);
                    recipient.ActiveConditions.Add(new GameBattleActiveCondition(rule, value, turns, hours)
                    { RemainingMinutes = hours.HasValue ? checked(hours.Value * 60) : null,
                      OverrideValue = origin.Value, EffectValues = origin.EffectValues });
                    Emit(GameBattleEventTypes.ConditionApplied, source.Spec.Id, recipient.Spec.Id,
                        new ConditionAppliedPayload(rule.Code, rule.Name, value, turns, hours)
                        { Image = rule.Image, Stackable = rule.Stackable });
                    foreach (SistemaCondicaoEfeito effect in EffectiveEffects(recipient.ActiveConditions[^1])
                        .Where(effect => effect.Momento is "AO_APLICAR" or "ENQUANTO_ATIVA"))
                        ApplyConditionEffect(recipient, rule, effect);
                    ClampToConditionLimits(recipient);
                }
            }
        }

        void TickConditions(ActorState target, string moment)
        {
            foreach (GameBattleActiveCondition condition in target.ActiveConditions.ToArray())
                foreach (SistemaCondicaoEfeito effect in EffectiveEffects(condition)
                    .Where(effect => effect.Momento.Equals(moment, StringComparison.OrdinalIgnoreCase) ||
                        moment == "INICIO_TURNO" && effect.Momento == "ENQUANTO_ATIVA" &&
                        effect.Operacao is "REDUZIR_LIMITE_PERCENTUAL" or "MODIFICAR_LIMITE_PERCENTUAL" or "BLOQUEAR_RECUPERACAO"))
                    ApplyConditionEffect(target, condition.Rule, effect);
        }

        void ReportContributions(ActorState actor, Func<SistemaCondicaoEfeito, bool> applies, string moment)
        {
            foreach (GameBattleActiveCondition condition in actor.ActiveConditions)
                foreach (SistemaCondicaoEfeito effect in EffectiveEffects(condition).Where(applies))
                    ReportConditionEffect(actor, condition.Rule, effect with { Momento = moment });
        }

        void ApplyConditionEffect(ActorState target, GameBattleConditionRule rule, SistemaCondicaoEfeito effect)
        {
            if (effect.Operacao.Equals("PERDER_TURNOS", StringComparison.OrdinalIgnoreCase))
            {
                target.TurnsToSkip = Math.Clamp(checked(target.TurnsToSkip + effect.Valor), 0, 100);
                ReportConditionEffect(target, rule, effect);
                return;
            }
            if (effect.Operacao.Equals("REDUZIR_LIMITE_PERCENTUAL", StringComparison.OrdinalIgnoreCase) ||
                effect.Operacao.Equals("BLOQUEAR_RECUPERACAO", StringComparison.OrdinalIgnoreCase) ||
                effect.Operacao.Equals("MODIFICAR_ROLAGEM", StringComparison.OrdinalIgnoreCase) ||
                effect.Operacao.Equals("MODIFICAR_ATRIBUTO", StringComparison.OrdinalIgnoreCase) ||
                effect.Operacao.Equals("MODIFICAR_DANO", StringComparison.OrdinalIgnoreCase) ||
                effect.Operacao.Equals("MODIFICAR_DEFESA", StringComparison.OrdinalIgnoreCase) ||
                effect.Operacao.Equals("MODIFICAR_LIMITE_PERCENTUAL", StringComparison.OrdinalIgnoreCase) ||
                effect.Operacao.Equals("DESVANTAGEM", StringComparison.OrdinalIgnoreCase) ||
                effect.Operacao.Equals("VANTAGEM", StringComparison.OrdinalIgnoreCase))
            {
                ReportConditionEffect(target, rule, effect);
                return;
            }
            string resource = effect.Recurso.ToUpperInvariant();
            int before = resource switch
            {
                "VIDA" => target.HitPoints, "MANA" => target.Mana,
                "ESTAMINA" => target.Stamina, _ => -1,
            };
            if (before < 0) return;
            if (effect.Operacao.Equals("SOMAR", StringComparison.OrdinalIgnoreCase) &&
                target.BlocksRecovery(resource))
            {
                ReportConditionEffect(target, rule, effect, before, before);
                return;
            }
            int maximum = target.EffectiveMaximum(resource);
            int after = effect.Operacao.ToUpperInvariant() switch
            {
                "SUBTRAIR" => Math.Max(0, before - effect.Valor),
                "SOMAR" => Math.Min(maximum, before + effect.Valor),
                "DEFINIR" => Math.Clamp(effect.Valor, 0, maximum),
                _ => before,
            };
            switch (resource)
            {
                case "VIDA": target.HitPoints = after; break;
                case "MANA": target.Mana = after; break;
                case "ESTAMINA": target.Stamina = after; break;
            }
            EmitChange(resource switch { "VIDA" => "hitPoints", "MANA" => "mana", _ => "stamina" },
                before, after, $"condicao:{rule.Code}", target.Spec.Id, null);
            ReportConditionEffect(target, rule, effect, before, after);
        }

        void ReportConditionEffect(ActorState target, GameBattleConditionRule rule, SistemaCondicaoEfeito effect,
            int? before = null, int? after = null) => Emit(GameBattleEventTypes.ConditionEffect,
                target.Spec.Id, target.Spec.Id, new ConditionEffectPayload(rule.Code, rule.Name,
                    effect.Operacao, effect.Recurso, effect.Valor, effect.Momento, before, after));

        void ClampToConditionLimits(ActorState target)
        {
            foreach (string resource in new[] { "VIDA", "MANA", "ESTAMINA" })
            {
                int maximum = target.EffectiveMaximum(resource);
                int before = resource switch
                {
                    "VIDA" => target.HitPoints, "MANA" => target.Mana, _ => target.Stamina,
                };
                int after = Math.Min(before, maximum);
                switch (resource)
                {
                    case "VIDA": target.HitPoints = after; break;
                    case "MANA": target.Mana = after; break;
                    default: target.Stamina = after; break;
                }
                EmitChange(resource switch { "VIDA" => "hitPoints", "MANA" => "mana", _ => "stamina" },
                    before, after, null, target.Spec.Id, null);
            }
        }

        void AdvanceConditions(ActorState actor)
        {
            for (int index = actor.ActiveConditions.Count - 1; index >= 0; index--)
            {
                GameBattleActiveCondition active = actor.ActiveConditions[index];
                if (active.RemainingTurns is not > 0) continue;
                turnHadProgress = true;
                int remaining = active.RemainingTurns.Value - 1;
                // A duração explícita da origem é um prazo, independente de
                // outras formas de recuperação marcadas no Sistema.
                if (remaining == 0)
                {
                    actor.ActiveConditions.RemoveAt(index);
                    Emit(GameBattleEventTypes.ConditionExpired, actor.Spec.Id, null,
                        new ConditionExpiredPayload(active.Rule.Code, active.Rule.Name, "DURACAO"));
                }
                else actor.ActiveConditions[index] = active with { RemainingTurns = remaining };
            }
        }

        void RemoveConditions(ActorState actor, string recoveryCode, string reason,
            IReadOnlyList<string>? allowedCodes = null)
        {
            for (int index = actor.ActiveConditions.Count - 1; index >= 0; index--)
            {
                GameBattleActiveCondition active = actor.ActiveConditions[index];
                if (allowedCodes is not null && !allowedCodes.Contains(active.Rule.Code,
                    StringComparer.OrdinalIgnoreCase)) continue;
                if (!active.Rule.Recovery.Split(';').Any(code =>
                    code.Trim().Equals(recoveryCode, StringComparison.OrdinalIgnoreCase))) continue;
                actor.ActiveConditions.RemoveAt(index);
                Emit(GameBattleEventTypes.ConditionExpired, actor.Spec.Id, null,
                    new ConditionExpiredPayload(active.Rule.Code, active.Rule.Name, reason));
            }
        }

        void EvaluateAutomaticConditions(ActorState actor)
        {
            if (evaluatingAutomaticConditions || actor.HitPoints == 0) return;
            evaluatingAutomaticConditions = true;
            try
            {
                foreach (GameBattleAutomaticCondition automatic in input.AutomaticConditions)
                {
                    decimal? current = automatic.Resource.ToUpperInvariant() switch
                    {
                        "VIDA" => actor.HitPoints,
                        "MANA" => actor.Mana,
                        "ESTAMINA" => actor.Stamina,
                        _ => null,
                    };
                    if (!current.HasValue) continue;
                    bool triggered = automatic.Comparison switch
                    {
                        "<" => current.Value < automatic.Threshold,
                        "<=" => current.Value <= automatic.Threshold,
                        "==" => current.Value == automatic.Threshold,
                        ">" => current.Value > automatic.Threshold,
                        ">=" => current.Value >= automatic.Threshold,
                        _ => false,
                    };
                    GameBattleActiveCondition? existing = actor.ActiveConditions.FirstOrDefault(item =>
                        item.Rule.Code.Equals(automatic.Rule.Code, StringComparison.OrdinalIgnoreCase));
                    if (!triggered)
                    {
                        if (existing is not null && automatic.Rule.Recovery.Split(';').Any(code =>
                            code.Trim().Equals("GATILHO_CESSOU", StringComparison.OrdinalIgnoreCase)))
                        {
                            actor.ActiveConditions.Remove(existing);
                            Emit(GameBattleEventTypes.ConditionExpired, actor.Spec.Id, null,
                                new ConditionExpiredPayload(existing.Rule.Code, existing.Rule.Name, "GATILHO_CESSOU"));
                        }
                        continue;
                    }
                    if (existing is not null) continue;
                    int? turns = automatic.Unit.Equals("Turno", StringComparison.OrdinalIgnoreCase)
                        ? automatic.Duration : null;
                    int? hours = automatic.Unit.Equals("Hora", StringComparison.OrdinalIgnoreCase)
                        ? automatic.Duration : null;
                    var active = new GameBattleActiveCondition(automatic.Rule,
                        automatic.Rule.Value, turns, hours)
                    { RemainingMinutes = hours.HasValue ? checked(hours.Value * 60) : null };
                    actor.ActiveConditions.Add(active);
                    Emit(GameBattleEventTypes.ConditionApplied, actor.Spec.Id, actor.Spec.Id,
                        new ConditionAppliedPayload(automatic.Rule.Code, automatic.Rule.Name,
                            automatic.Rule.Value, turns, hours)
                        { Image = automatic.Rule.Image, Stackable = automatic.Rule.Stackable });
                    foreach (SistemaCondicaoEfeito effect in EffectiveEffects(active).Where(effect =>
                        effect.Momento is "AO_APLICAR" or "ENQUANTO_ATIVA"))
                        ApplyConditionEffect(actor, automatic.Rule, effect);
                    ClampToConditionLimits(actor);
                }
            }
            finally { evaluatingAutomaticConditions = false; }
        }

        void EmitChange(string resource, int before, int after, string? actionId, string actorId, string? targetId)
        {
            if (before != after)
            {
                turnHadProgress = true;
                Emit(GameBattleEventTypes.ResourceChanged, actorId, targetId,
                    new ResourceChangedPayload(resource, before, after, actionId));
                if (resource is "hitPoints" or "mana" or "stamina")
                {
                    ActorState? recipient = actors.FirstOrDefault(candidate =>
                        candidate.Spec.Id == (targetId ?? actorId));
                    if (recipient is not null) EvaluateAutomaticConditions(recipient);
                }
            }
        }

        void Recover(ActorState actor, string resource, decimal configured, bool percentage,
            string actionId = "descanso", bool cureAtFull = false)
        {
            string resourceCode = resource switch
            {
                "hitPoints" => "VIDA", "mana" => "MANA", _ => "ESTAMINA",
            };
            if (actor.BlocksRecovery(resourceCode))
            {
                if (resource == "hitPoints" && cureAtFull && configured > 0)
                    RemoveConditions(actor, "CURA", "Cura");
                return;
            }
            int maximum = resource switch
            {
                "hitPoints" => actor.EffectiveMaximum("VIDA"),
                "mana" => actor.EffectiveMaximum("MANA"),
                _ => actor.EffectiveMaximum("ESTAMINA"),
            };
            int before = resource switch
            {
                "hitPoints" => actor.HitPoints,
                "mana" => actor.Mana,
                _ => actor.Stamina,
            };
            decimal requested = percentage
                ? decimal.Floor(maximum * configured / 100m)
                : decimal.Truncate(configured);
            int amount = requested >= maximum ? maximum : (int)requested;
            int after = before + Math.Min(maximum - before, Math.Max(0, amount));
            switch (resource)
            {
                case "hitPoints": actor.HitPoints = after; break;
                case "mana": actor.Mana = after; break;
                default: actor.Stamina = after; break;
            }
            EmitChange(resource, before, after, actionId, actor.Spec.Id, null);
            if (resource == "hitPoints" && (after > before || cureAtFull && configured > 0))
                RemoveConditions(actor, "CURA", "Cura");
        }

        void Emit(string type, string? actorId, string? targetId, GameBattleEventPayload payload, int? eventRound = null)
        {
            if (type is GameBattleEventTypes.ItemConsumed or GameBattleEventTypes.ConditionApplied
                or GameBattleEventTypes.ConditionExpired)
                turnHadProgress = true;
            events.Add(new GameBattleEvent(
                events.Count + 1,
                EventSchemaVersion,
                eventRound ?? round,
                type,
                actorId,
                targetId,
                payload));
        }
    }

    private static bool GrantsCounterattack(string? effectJson)
    {
        if (string.IsNullOrWhiteSpace(effectJson)) return false;
        try
        {
            using JsonDocument document = JsonDocument.Parse(effectJson);
            if (document.RootElement.ValueKind != JsonValueKind.Object) return false;
            return document.RootElement.EnumerateObject().Any(property =>
                property.Name.Equals("reacao", StringComparison.OrdinalIgnoreCase) &&
                property.Value.ValueKind == JsonValueKind.String &&
                property.Value.GetString()?.Equals("REVIDAR", StringComparison.OrdinalIgnoreCase) == true);
        }
        catch (JsonException) { return false; }
    }

    private static int EffectiveQuantity(ActionState action)
    {
        if (action.Spec.Utility is not null)
            return action.RemainingQuantity is <= 0 ? 0 : 1;
        int quantity = action.Spec.AttacksPerTurn;
        if (action.Spec.Magazine is { } magazine)
            quantity = Math.Min(quantity, action.Loaded / magazine.AmmoPerUse);
        if (action.Spec.UsesUntilRest > 0)
            quantity = Math.Min(quantity, action.UsesRemaining);
        return quantity;
    }

    private static string? UnavailableReason(ActorState actor, ActionState action, int quantity)
    {
        if (action.NextAvailableTurn > actor.TurnCount)
            return "COOLDOWN";
        if (action.Spec.Utility is { } utility)
        {
            if (quantity == 0) return "ITEM_ESGOTADO";
            bool hasUseEffect = action.Spec.Conditions.Any(origin =>
                origin.Trigger.Equals("AO_USAR", StringComparison.OrdinalIgnoreCase));
            bool canCure = utility.RestoreLife > 0 && actor.ActiveConditions.Any(condition =>
                condition.Rule.Recovery.Split(';').Any(code =>
                    code.Trim().Equals("CURA", StringComparison.OrdinalIgnoreCase)));
            if (!hasUseEffect && !canCure &&
                (utility.RestoreLife == 0 || actor.HitPoints >= actor.EffectiveMaximum("VIDA")) &&
                (utility.RestoreMana == 0 || actor.Mana >= actor.EffectiveMaximum("MANA")) &&
                (utility.RestoreStamina == 0 || actor.Stamina >= actor.EffectiveMaximum("ESTAMINA")))
                return "RECURSOS_CHEIOS";
        }
        if (action.Spec.UsesUntilRest > 0 && action.UsesRemaining == 0)
            return "USES";
        if (quantity == 0 && action.Spec.Magazine is { } magazine &&
            (!magazine.ReloadWhenEmpty || (!magazine.UnlimitedReserve && action.Reserve == 0)))
            return "AMMO";
        if (quantity == 0) return null;
        if (actor.Mana < (long)action.Spec.ManaCost * quantity)
            return "MANA";
        if (actor.Stamina < (long)action.Spec.StaminaCost * quantity +
            (long)action.Spec.AdditionalAttackStaminaCost * (quantity - 1))
            return "STAMINA";
        return null;
    }

    private static bool SuccessfulRange(GameplayResolvedResultRange range)
    {
        if (!string.IsNullOrWhiteSpace(range.EffectJson))
        {
            try
            {
                using JsonDocument document = JsonDocument.Parse(range.EffectJson);
                if (document.RootElement.ValueKind == JsonValueKind.Object &&
                    document.RootElement.TryGetProperty("aplicaCondicoes", out JsonElement enabled) &&
                    enabled.ValueKind is JsonValueKind.True or JsonValueKind.False)
                    return enabled.GetBoolean();
            }
            catch (JsonException) { /* Legacy free-form effects use the existing result code. */ }
        }
        return !range.CriticalFailure && (range.Critical ||
            range.Code.StartsWith("ACERTO", StringComparison.OrdinalIgnoreCase));
    }

    private static GameplayResolvedResultRange ResolveRange(GameBattleActionSpec action, GameplayRollResultDto roll)
    {
        int natural = roll.ValorNatural ?? 0;
        int metric = action.UseTotalForRanges ? roll.Total : natural;
        GameplayResolvedResultRange? naturalRange = action.ResultRanges.FirstOrDefault(
            range => range.RequiresNatural && natural >= range.Minimum && natural <= range.Maximum);
        if (naturalRange is not null)
            return naturalRange;

        GameplayResolvedResultRange[] regular = action.ResultRanges
            .Where(range => !range.RequiresNatural)
            .OrderBy(range => range.Minimum)
            .ToArray();
        GameplayResolvedResultRange? matching = regular.FirstOrDefault(
            range => metric >= range.Minimum && metric <= range.Maximum);
        if (matching is not null)
            return matching;

        // Mirrors GameplayEngineService for a modified total beyond configured bands.
        if (action.UseTotalForRanges && roll.Modificador != 0)
            return regular.Where(range => range.Maximum < metric)
                .OrderByDescending(range => range.Maximum).FirstOrDefault()
                ?? regular.FirstOrDefault(range => range.Minimum > metric)
                ?? throw new InvalidOperationException("Ação sem faixa de resultado executável.");

        throw new InvalidOperationException("A rolagem ficou fora das faixas configuradas.");
    }

    private static IEnumerable<SistemaCondicaoEfeito> EffectiveEffects(GameBattleActiveCondition condition)
    {
        IReadOnlyList<SistemaCondicaoEfeito> effects = condition.Rule.Effects.Count > 0
            ? condition.Rule.Effects
            : [new(condition.Rule.Operation, condition.Rule.Resource, condition.Value,
                condition.Rule.Moment)];
        bool usedOverride = false;
        for (int index = 0; index < effects.Count; index++)
        {
            SistemaCondicaoEfeito effect = effects[index];
            if (condition.EffectValues.TryGetValue(index, out int configured))
            {
                yield return effect with { Valor = configured };
                continue;
            }
            if (!usedOverride && effect.Operacao is not ("DESVANTAGEM" or "VANTAGEM" or "BLOQUEAR_RECUPERACAO"))
            {
                usedOverride = true;
                if (condition.OverrideValue.HasValue ||
                    condition.Rule.Effects.Count == 0 || condition.Rule.Operation.Length > 0 &&
                    effect.Operacao.Equals(condition.Rule.Operation, StringComparison.OrdinalIgnoreCase) &&
                    effect.Recurso.Equals(condition.Rule.Resource, StringComparison.OrdinalIgnoreCase))
                {
                    yield return effect with { Valor = condition.OverrideValue ?? condition.Value };
                    continue;
                }
            }
            yield return effect;
        }
    }

    private static void Validate(GameBattleInput input)
    {
        if (input.MaxEvents is < 2 or > 10000 ||
            input.MaxTurnsWithoutProgress is < 1 or > 100)
            throw new ArgumentOutOfRangeException(nameof(input), "Os limites da batalha são inválidos.");
        if (input.FirstActor is null || input.SecondActor is null ||
            string.IsNullOrWhiteSpace(input.FirstActor.Id) || string.IsNullOrWhiteSpace(input.SecondActor.Id) ||
            input.FirstActor.Id == input.SecondActor.Id)
            throw new ArgumentException("A batalha requer dois atores distintos.", nameof(input));
        if (input.AdditionalEnemies is null || input.AdditionalEnemies.Count > 3 ||
            input.AdditionalEnemies.Any(actor => actor is null) ||
            new[] { input.FirstActor, input.SecondActor }.Concat(input.AdditionalEnemies)
                .Select(actor => actor.Id).Distinct(StringComparer.Ordinal).Count() != 2 + input.AdditionalEnemies.Count)
            throw new ArgumentException("A batalha admite até quatro inimigos com IDs distintos.", nameof(input));
        int initialEvents = 2 + (input.UseInitiative ? 2 + input.AdditionalEnemies.Count : 0);
        if (input.MaxEvents < initialEvents)
            throw new ArgumentOutOfRangeException(nameof(input),
                "O limite de eventos precisa comportar a iniciativa de todos os participantes.");
        if (input.DefenseOrder is null || input.DefenseOrder.Distinct().Count() != input.DefenseOrder.Count ||
            input.DefenseOrder.Any(kind => !Enum.IsDefined(kind)))
            throw new ArgumentException("A ordem das defesas é inválida.", nameof(input));
        if (input.PreferredTargets is null || input.PreferredTargets.Any(pair =>
            pair.Key != input.FirstActor.Id ||
            !new[] { input.SecondActor.Id }.Concat(input.AdditionalEnemies.Select(actor => actor.Id))
                .Contains(pair.Value, StringComparer.Ordinal)))
            throw new ArgumentException("A escolha de alvos é inválida.", nameof(input));

        foreach (GameBattleActorSpec actor in new[] { input.FirstActor, input.SecondActor }
            .Concat(input.AdditionalEnemies))
        {
            var initialState = new ActorState(actor);
            if (string.IsNullOrWhiteSpace(actor.Name) ||
                actor.MaximumHitPoints < 1 || actor.HitPoints < 1 || actor.HitPoints > initialState.EffectiveMaximum("VIDA") ||
                actor.MaximumMana < 0 || actor.Mana < 0 || actor.Mana > initialState.EffectiveMaximum("MANA") ||
                actor.MaximumStamina < 0 || actor.Stamina < 0 || actor.Stamina > initialState.EffectiveMaximum("ESTAMINA") ||
                actor.TurnsToSkip is < 0 or > 100 ||
                actor.Defenses is null || actor.Defenses.Shield < 0 ||
                actor.Defenses.Protection < 0 || actor.Defenses.Armor < 0 ||
                actor.Actions is null || actor.Actions.Count is < 1 or > 8)
                throw new ArgumentException($"O ator {actor.Id} tem um snapshot inválido.", nameof(input));
            if (actor.Rest is { } rest && (rest.AfterActionIndex < 0 ||
                rest.AfterActionIndex >= actor.Actions.Count || rest.Life < 0 ||
                rest.Mana < 0 || rest.Stamina < 0))
                throw new ArgumentException("O descanso do combatente é inválido.", nameof(input));
            if (input.UseInitiative && (actor.Initiative is not { } initiative ||
                initiative.Quantity is < 1 or > 100 || initiative.Faces is < 2 or > 1000 ||
                string.IsNullOrWhiteSpace(initiative.Formula)))
                throw new ArgumentException("A regra de iniciativa publicada é inválida.", nameof(input));
            if (actor.Defenses.Shield > 0 && !input.DefenseOrder.Contains(GameBattleDefenseKind.Shield) ||
                actor.Defenses.Protection > 0 && !input.DefenseOrder.Contains(GameBattleDefenseKind.Protection) ||
                actor.Defenses.Armor > 0 && !input.DefenseOrder.Contains(GameBattleDefenseKind.Armor))
                throw new ArgumentException("A ordem deve incluir todas as defesas ativas.", nameof(input));
            if (actor.Actions.Any(action => action is null || string.IsNullOrWhiteSpace(action.Id)) ||
                actor.Actions.Select(action => action.Id).Distinct(StringComparer.Ordinal).Count() != actor.Actions.Count)
                throw new ArgumentException("Ações do ator precisam de IDs únicos.", nameof(input));

            foreach (GameBattleActionSpec action in actor.Actions)
            {
                if (string.IsNullOrWhiteSpace(action.Name) || action.ManaCost < 0 ||
                    action.StaminaCost < 0 || action.CooldownTurns is < 0 or > 100 ||
                    action.AttacksPerTurn is < 1 or > 100 || action.AdditionalAttackStaminaCost < 0 ||
                    action.UsesUntilRest is < 0 or > 100000 ||
                    action.Utility is { } utility &&
                        (utility.InitialQuantity is <= 0 or > 1000000 || utility.RestoreLife < 0 ||
                         utility.RestoreMana < 0 || utility.RestoreStamina < 0) ||
                    action.Utility is null &&
                        (action.Roll is null || action.Roll.Groups is null ||
                         action.Roll.Groups.Count != 1 || action.Roll.Groups[0] != new GameplayDiceGroupSpec(1, 20) ||
                         !Enum.IsDefined(action.Roll.Mode) ||
                         action.ResultRanges is null || action.ResultRanges.Count == 0 ||
                         action.ResultRanges.Any(range => range is null || string.IsNullOrWhiteSpace(range.Code) ||
                             range.Minimum > range.Maximum) ||
                         !action.ResultRanges.Any(range => !range.RequiresNatural) ||
                         action.DamageByResultCode is null ||
                         action.ResultRanges.Any(range => !action.DamageByResultCode.TryGetValue(range.Code, out int damage) || damage < 0)))
                    throw new ArgumentException($"A ação {action.Id} não possui regra executável válida.", nameof(input));
                if (action.Magazine is { } magazine &&
                    (magazine.Capacity < 1 || magazine.Loaded < 0 || magazine.Loaded > magazine.Capacity ||
                     magazine.Reserve < 0 || magazine.AmmoPerUse < 1 ||
                     (long)magazine.AmmoPerUse * action.AttacksPerTurn > magazine.Capacity))
                    throw new ArgumentException($"A ação {action.Id} tem munição inválida.", nameof(input));
                if (action.Conditions.Any(origin => origin.Target is not ("ALVO" or "USUARIO" or "TODOS_INIMIGOS") ||
                    origin.ResistanceTest is { } test && (test.Dice is < 1 or > 10 ||
                        test.Faces is < 2 or > 1000 || test.Difficulty is < -1000000 or > 1000000 ||
                        string.IsNullOrWhiteSpace(test.AttributeCode) || test.AttributeCode.Length > 50)))
                    throw new ArgumentException($"A reação da ação {action.Id} é inválida.", nameof(input));

                if (action.Utility is not null) continue;
                for (int natural = 1; natural <= 20; natural++)
                {
                    int metric = action.UseTotalForRanges
                        ? checked(natural + action.Roll.Modifier)
                        : natural;
                    if (action.ResultRanges.Any(range => range.RequiresNatural &&
                            natural >= range.Minimum && natural <= range.Maximum) ||
                        action.ResultRanges.Any(range => !range.RequiresNatural &&
                            metric >= range.Minimum && metric <= range.Maximum) ||
                        action.UseTotalForRanges && action.Roll.Modifier != 0)
                        continue;
                    throw new ArgumentException($"A ação {action.Id} não cobre todos os resultados possíveis.", nameof(input));
                }
            }
        }
    }

    private sealed class ActorState
    {
        public ActorState(GameBattleActorSpec spec)
        {
            Spec = spec;
            HitPoints = spec.HitPoints;
            Mana = spec.Mana;
            Stamina = spec.Stamina;
            Shield = spec.Defenses.Shield;
            Protection = spec.Defenses.Protection;
            Armor = spec.Defenses.Armor;
            Actions = spec.Actions.Select(action => new ActionState(action)).ToArray();
            ActiveConditions = spec.ActiveConditions.ToList();
            TurnsToSkip = spec.TurnsToSkip;
        }

        public GameBattleActorSpec Spec { get; }
        public int HitPoints { get; set; }
        public int Mana { get; set; }
        public int Stamina { get; set; }
        public int Shield { get; set; }
        public int Protection { get; set; }
        public int Armor { get; }
        public int TurnCount { get; set; }
        public int TurnsToSkip { get; set; }
        public bool SkipRestNextTurn { get; set; }
        public IReadOnlyList<ActionState> Actions { get; }
        public List<GameBattleActiveCondition> ActiveConditions { get; }

        public bool BlocksRecovery(string resource) => ActiveConditions.SelectMany(EffectiveEffects).Any(effect =>
            effect.Operacao.Equals("BLOQUEAR_RECUPERACAO", StringComparison.OrdinalIgnoreCase) &&
            effect.Recurso.Equals(resource, StringComparison.OrdinalIgnoreCase));

        public int EffectiveArmor() => Math.Max(0, checked(Armor + ActiveConditions.SelectMany(EffectiveEffects)
            .Where(effect => effect.Operacao == "MODIFICAR_DEFESA" && effect.Recurso == "ARMADURA")
            .Sum(effect => effect.Valor)));

        public int EffectiveMaximum(string resource)
        {
            int maximum = resource switch
            {
                "VIDA" => Spec.MaximumHitPoints, "MANA" => Spec.MaximumMana,
                "ESTAMINA" => Spec.MaximumStamina, _ => 0,
            };
            foreach (SistemaCondicaoEfeito effect in ActiveConditions.SelectMany(EffectiveEffects).Where(effect =>
                effect.Recurso.Equals(resource, StringComparison.OrdinalIgnoreCase) &&
                effect.Operacao is ("REDUZIR_LIMITE_PERCENTUAL" or "MODIFICAR_LIMITE_PERCENTUAL")))
                maximum = (int)Math.Clamp(Math.Floor(maximum * (effect.Operacao == "REDUZIR_LIMITE_PERCENTUAL"
                    ? 100 - Math.Clamp(effect.Valor, 0, 100) : 100 + effect.Valor) / 100m), 0, 1000000);
            return maximum;
        }

        public GameBattleActorState ToSnapshot() => new(
            Spec.Id,
            Spec.Name,
            HitPoints,
            EffectiveMaximum("VIDA"),
            Mana,
            EffectiveMaximum("MANA"),
            Stamina,
            EffectiveMaximum("ESTAMINA"),
            new GameBattleDefenses(Shield, Protection, EffectiveArmor()),
            Actions.Select(action => new GameBattleActionState(
                action.Spec.Id,
                action.Spec.Magazine?.Capacity,
                action.Spec.Magazine is null ? null : action.Loaded,
                action.Spec.Magazine is null ? null : action.Reserve,
                Math.Max(0, action.NextAvailableTurn - (TurnCount + 1)))
            {
                RemainingUses = action.Spec.UsesUntilRest > 0 ? action.UsesRemaining : null,
                RemainingQuantity = action.RemainingQuantity,
            }).ToArray()) { ActiveConditions = ActiveConditions.ToArray(), TurnsToSkip = TurnsToSkip };
    }

    private sealed class ActionState
    {
        public ActionState(GameBattleActionSpec spec)
        {
            Spec = spec;
            Loaded = spec.Magazine?.Loaded ?? 0;
            Reserve = spec.Magazine?.Reserve ?? 0;
            UsesRemaining = Math.Clamp(spec.InitialUsesRemaining ?? spec.UsesUntilRest, 0, spec.UsesUntilRest);
            RemainingQuantity = spec.Utility?.InitialQuantity;
        }

        public GameBattleActionSpec Spec { get; }
        public int Loaded { get; set; }
        public int Reserve { get; set; }
        public int UsesRemaining { get; set; }
        public int? RemainingQuantity { get; set; }
        public bool UtilityUsedInCycle { get; set; }
        public int NextAvailableTurn { get; set; }
    }
}
