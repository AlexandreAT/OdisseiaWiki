using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Services;
using OdisseiaWiki.Services.Interfaces;
using System.Text.Json;

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
        int roundsWithoutProgress = 0;
        string? winnerId = null;
        GameBattleEndReason reason = GameBattleEndReason.EventLimit;

        Emit(GameBattleEventTypes.BattleStarted, null, null,
            new BattleStartedPayload(turnOrder.Select(index => actors[index].Spec.Id).ToArray()));
        foreach (var entry in initiative.Where(entry => entry.Plan is not null))
            Emit(GameBattleEventTypes.InitiativeRolled, actors[entry.Index].Spec.Id, null,
                new InitiativeRolledPayload(entry.Plan!.Formula, entry.Dice,
                    entry.Plan.Modifier, entry.Total));

        bool finished = false;
        bool[] pendingReaction = new bool[actors.Length];
        for (round = 1; !finished; round++)
        {
            bool roundHadProgress = false;
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
                     (actor.Spec.Rest is null ? 0 : 4 + 3 * actor.Actions.Count));
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
                if (!openingOpportunity)
                {
                    actor.TurnCount++;
                    Emit(GameBattleEventTypes.TurnStarted, actor.Spec.Id, null,
                        new TurnStartedPayload(actor.TurnCount));
                    foreach (ActionState action in actor.Actions.Where(action => action.NextAvailableTurn > 0))
                    {
                        int remaining = Math.Max(0, action.NextAvailableTurn - actor.TurnCount);
                        Emit(GameBattleEventTypes.CooldownAdvanced, actor.Spec.Id, null,
                            new CooldownAdvancedPayload(action.Spec.Id, remaining));
                        if (remaining == 0)
                            action.NextAvailableTurn = 0;
                    }
                }
                bool acted = false;
                ActionState? reloadCandidate = null;
                bool skipRest = actor.SkipRestNextTurn;
                if (!reaction) actor.SkipRestNextTurn = false;
                int startIndex = !reaction && skipRest ? actor.Spec.Rest?.AfterActionIndex ?? 0 : 0;
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
                        actor.SkipRestNextTurn = true;
                        acted = true;
                        break;
                    }
                    ActionState action = actor.Actions[actionIndex];
                    if (action.Spec.IsFallback && reloadCandidate is not null)
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
                        { Reaction = reaction, Quantity = quantity });
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

                    GameplayRollPlan rollPlan = openingOpportunity
                        ? action.Spec.Roll with { Mode = GameplayRollMode.Vantagem }
                        : action.Spec.Roll;
                    GameplayRollResultDto roll = evaluator.Evaluate(rollPlan);
                    GameplayResolvedResultRange range = ResolveRange(action.Spec, roll);
                    int damage = checked(action.Spec.DamageByResultCode[range.Code] * quantity);
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
                        roundHadProgress |= target.HitPoints != hitPointsBefore ||
                            target.Shield != shieldBefore ||
                            target.Protection != protectionBefore;
                    }

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

                if (!acted && reloadCandidate is { Spec.Magazine: not null } reload)
                {
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
                }
                if (finished)
                    break;
            }

            if (finished)
                break;

            roundsCompleted++;
            roundsWithoutProgress = roundHadProgress ? 0 : roundsWithoutProgress + 1;
            if (roundsWithoutProgress >= input.MaxRoundsWithoutDamage)
            {
                reason = GameBattleEndReason.NoDamage;
                finished = true;
            }
        }

        // A technical stop never leaves a persisted combat without a winner.
        // Compare remaining team health; equality favors the defending side.
        winnerId ??= actors[0].HitPoints > actors.Skip(1).Sum(actor => actor.HitPoints)
            ? actors[0].Spec.Id
            : actors.Skip(1).First(actor => actor.HitPoints > 0).Spec.Id;
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
                    case GameBattleDefenseKind.Armor when defender.Armor > 0:
                        absorbed = Math.Min(remaining, defender.Armor);
                        after = defender.Armor;
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

        void EmitChange(string resource, int before, int after, string? actionId, string actorId, string? targetId)
        {
            if (before != after)
                Emit(GameBattleEventTypes.ResourceChanged, actorId, targetId,
                    new ResourceChangedPayload(resource, before, after, actionId));
        }

        void Recover(ActorState actor, string resource, decimal configured, bool percentage)
        {
            int maximum = resource switch
            {
                "hitPoints" => actor.Spec.MaximumHitPoints,
                "mana" => actor.Spec.MaximumMana,
                _ => actor.Spec.MaximumStamina,
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
            EmitChange(resource, before, after, "descanso", actor.Spec.Id, null);
        }

        void Emit(string type, string? actorId, string? targetId, GameBattleEventPayload payload, int? eventRound = null)
        {
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

    private static void Validate(GameBattleInput input)
    {
        if (input.MaxEvents is < 2 or > 10000 ||
            input.MaxRoundsWithoutDamage is < 1 or > 100)
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
            if (string.IsNullOrWhiteSpace(actor.Name) ||
                actor.MaximumHitPoints < 1 || actor.HitPoints < 1 || actor.HitPoints > actor.MaximumHitPoints ||
                actor.MaximumMana < 0 || actor.Mana < 0 || actor.Mana > actor.MaximumMana ||
                actor.MaximumStamina < 0 || actor.Stamina < 0 || actor.Stamina > actor.MaximumStamina ||
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
                    action.Roll is null || action.Roll.Groups is null ||
                    action.Roll.Groups.Count != 1 || action.Roll.Groups[0] != new GameplayDiceGroupSpec(1, 20) ||
                    !Enum.IsDefined(action.Roll.Mode) ||
                    action.ResultRanges is null || action.ResultRanges.Count == 0 ||
                    action.ResultRanges.Any(range => range is null || string.IsNullOrWhiteSpace(range.Code) ||
                        range.Minimum > range.Maximum) ||
                    !action.ResultRanges.Any(range => !range.RequiresNatural) ||
                    action.DamageByResultCode is null ||
                    action.ResultRanges.Any(range => !action.DamageByResultCode.TryGetValue(range.Code, out int damage) || damage < 0))
                    throw new ArgumentException($"A ação {action.Id} não possui regra executável válida.", nameof(input));
                if (action.Magazine is { } magazine &&
                    (magazine.Capacity < 1 || magazine.Loaded < 0 || magazine.Loaded > magazine.Capacity ||
                     magazine.Reserve < 0 || magazine.AmmoPerUse < 1 ||
                     (long)magazine.AmmoPerUse * action.AttacksPerTurn > magazine.Capacity))
                    throw new ArgumentException($"A ação {action.Id} tem munição inválida.", nameof(input));

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
        }

        public GameBattleActorSpec Spec { get; }
        public int HitPoints { get; set; }
        public int Mana { get; set; }
        public int Stamina { get; set; }
        public int Shield { get; set; }
        public int Protection { get; set; }
        public int Armor { get; }
        public int TurnCount { get; set; }
        public bool SkipRestNextTurn { get; set; }
        public IReadOnlyList<ActionState> Actions { get; }

        public GameBattleActorState ToSnapshot() => new(
            Spec.Id,
            Spec.Name,
            HitPoints,
            Spec.MaximumHitPoints,
            Mana,
            Spec.MaximumMana,
            Stamina,
            Spec.MaximumStamina,
            new GameBattleDefenses(Shield, Protection, Armor),
            Actions.Select(action => new GameBattleActionState(
                action.Spec.Id,
                action.Spec.Magazine?.Capacity,
                action.Spec.Magazine is null ? null : action.Loaded,
                action.Spec.Magazine is null ? null : action.Reserve,
                Math.Max(0, action.NextAvailableTurn - (TurnCount + 1)))
            {
                RemainingUses = action.Spec.UsesUntilRest > 0 ? action.UsesRemaining : null,
            }).ToArray());
    }

    private sealed class ActionState
    {
        public ActionState(GameBattleActionSpec spec)
        {
            Spec = spec;
            Loaded = spec.Magazine?.Loaded ?? 0;
            Reserve = spec.Magazine?.Reserve ?? 0;
            UsesRemaining = Math.Clamp(spec.InitialUsesRemaining ?? spec.UsesUntilRest, 0, spec.UsesUntilRest);
        }

        public GameBattleActionSpec Spec { get; }
        public int Loaded { get; set; }
        public int Reserve { get; set; }
        public int UsesRemaining { get; set; }
        public int NextAvailableTurn { get; set; }
    }
}
