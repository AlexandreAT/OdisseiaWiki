using System.Text.Json;
using OdisseiaWiki.Enums;
using OdisseiaWiki.GameRuns.Battle;
using OdisseiaWiki.Services;
using OdisseiaWiki.Services.Interfaces;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class AutoBattleSimulatorTests
{
    private readonly AutoBattleSimulator _simulator = new();

    [Fact]
    public void MesmaEntradaESeedProduzemMesmoLogSemModificarSnapshot()
    {
        GameBattleActionSpec shot = Action("shot", 3,
            magazine: new GameBattleMagazineSpec(2, 1, 2));
        GameBattleInput input = Battle(
            Actor("hero", 30, shot),
            Actor("enemy", 30, Action("claw", 2)),
            maxRounds: 4);

        GameBattleResult first = _simulator.Simulate(input, new SeededGameRunRandomSource(12345));
        GameBattleResult second = _simulator.Simulate(input, new SeededGameRunRandomSource(12345));

        Assert.Equal(JsonSerializer.Serialize(first), JsonSerializer.Serialize(second));
        Assert.Equal(1, shot.Magazine!.Loaded);
        Assert.Equal(2, shot.Magazine.Reserve);
        Assert.Equal(30, input.FirstActor.HitPoints);
        Assert.Contains("\"kind\":\"DICE_ROLLED\"", JsonSerializer.Serialize(first.Events));
        Assert.Equal(Enumerable.Range(1, first.Events.Count), first.Events.Select(item => item.Sequence));
    }

    [Fact]
    public void GolpeLetalEncerraAntesDoTurnoDoInimigo()
    {
        GameBattleInput input = Battle(
            Actor("hero", 10, Action("strike", 10)),
            Actor("enemy", 5, Action("claw", 10)));

        GameBattleResult result = _simulator.Simulate(input, new SequenceRandomSource(20));

        Assert.Equal("hero", result.WinnerActorId);
        Assert.Equal(GameBattleEndReason.ActorDefeated, result.EndReason);
        Assert.Equal(0, result.Actors.Single(item => item.Id == "enemy").HitPoints);
        Assert.Single(result.Events, item => item.Type == GameBattleEventTypes.TurnStarted);
        Assert.Equal(GameBattleEventTypes.BattleEnded, result.Events[^1].Type);
    }

    [Fact]
    public void AtaqueDeOportunidadeVemAntesDaOrdemNormalEUsaMaiorDeDoisDados()
    {
        GameBattleInput input = Battle(
            Actor("hero", 40, Action("strike", 0)),
            Actor("enemy", 40, Action("claw", 1)))
            with { OpeningOpportunityAttack = true };

        GameBattleResult result = _simulator.Simulate(input,
            new SequenceRandomSource(4, 15, 12, 12, 12));
        Assert.Equal(["hero", "enemy"], result.Events
            .Where(item => item.Type == GameBattleEventTypes.TurnStarted)
            .Take(2).Select(item => item.ActorId));
        Assert.Equal("enemy", result.Events.First(item =>
            item.Type == GameBattleEventTypes.ActionSelected).ActorId);
        var first = (DiceRolledPayload)result.Events.First(item =>
            item.Type == GameBattleEventTypes.DiceRolled).Payload;
        Assert.Equal(GameplayRollMode.Vantagem, first.Mode);
        Assert.Equal([4, 15], first.Roll.Grupos.Single().Valores);
        Assert.Equal(15, first.Roll.ValorNatural);
        Assert.Contains(result.Events, item => item.Type == GameBattleEventTypes.ActionSelected &&
            ((ActionSelectedPayload)item.Payload).ActionName.StartsWith("Oportunidade ·"));
        Assert.Equal(GameplayRollMode.Normal,
            ((DiceRolledPayload)result.Events.Where(item => item.Type == GameBattleEventTypes.DiceRolled)
                .Skip(1).First().Payload).Mode);
    }

    [Fact]
    public void InimigosEmQuantidadeTemTurnosERecursosIndependentes()
    {
        GameBattleInput input = Battle(
            Actor("hero", 20, Action("strike", 10)),
            Actor("enemy", 5, Action("claw", 0)), maxRounds: 2)
            with { AdditionalEnemies = [Actor("enemy-2", 5, Action("claw", 0))] };

        GameBattleResult result = _simulator.Simulate(input, new SequenceRandomSource(20));

        Assert.Equal("hero", result.WinnerActorId);
        Assert.Equal(0, result.Actors.Single(actor => actor.Id == "enemy").HitPoints);
        Assert.Equal(0, result.Actors.Single(actor => actor.Id == "enemy-2").HitPoints);
        Assert.Equal(new[] { "hero", "enemy-2", "hero" }, result.Events
            .Where(item => item.Type == GameBattleEventTypes.TurnStarted)
            .Select(item => item.ActorId));
    }

    [Fact]
    public void IniciativaOrdenaTodosOsParticipantesERegistraOsDados()
    {
        GameBattleInitiativeSpec first = new("1D6 + Agilidade", 1, 6, 2);
        GameBattleInitiativeSpec second = new("1D6 + Agilidade", 1, 6, 0);
        GameBattleInput input = Battle(
            Actor("hero", 30, Action("strike", 5)) with { Initiative = first },
            Actor("enemy", 30, Action("claw", 0)) with { Initiative = second }, maxRounds: 1)
            with
            {
                AdditionalEnemies = [Actor("enemy-2", 30, Action("claw", 0))
                    with { Initiative = second }],
                UseInitiative = true,
            };

        GameBattleResult result = _simulator.Simulate(input,
            new SequenceRandomSource(1, 6, 2, 20));

        Assert.Equal(new[] { "enemy", "hero", "enemy-2" },
            ((BattleStartedPayload)result.Events[0].Payload).ActorOrder);
        Assert.Equal(new[] { "hero", "enemy", "enemy-2" }, result.Events
            .Where(item => item.Type == GameBattleEventTypes.InitiativeRolled)
            .Select(item => item.ActorId));
        Assert.Equal(new[] { 3, 6, 2 }, result.Events
            .Where(item => item.Type == GameBattleEventTypes.InitiativeRolled)
            .Select(item => ((InitiativeRolledPayload)item.Payload).Total));
        Assert.Equal("enemy", result.Events.First(item =>
            item.Type == GameBattleEventTypes.TurnStarted).ActorId);
    }

    [Fact]
    public void AlvoPreferidoCaiEProximaAcaoUsaPrimeiroInimigoVivo()
    {
        GameBattleInput input = Battle(
            Actor("hero", 30, Action("strike", 10)),
            Actor("enemy", 30, Action("miss", 0))) with
            {
                AdditionalEnemies = [Actor("enemy-2", 5, Action("miss", 0))],
                PreferredTargets = new Dictionary<string, string> { ["hero"] = "enemy-2" },
            };

        GameBattleResult result = _simulator.Simulate(input, new SequenceRandomSource(20));
        string[] attacked = result.Events.Where(item => item.Type == GameBattleEventTypes.DiceRolled &&
            item.ActorId == "hero").Select(item => item.TargetId!).Take(2).ToArray();

        Assert.Equal(["enemy-2", "enemy"], attacked);
    }

    [Fact]
    public void LimiteDeEventosIncluiIniciativasAntesDeSimular()
    {
        GameBattleInitiativeSpec plan = new("1D6", 1, 6, 0);
        GameBattleInput input = Battle(
            Actor("hero", 30, Action("strike", 1)) with { Initiative = plan },
            Actor("enemy", 30, Action("miss", 0)) with { Initiative = plan })
            with { UseInitiative = true, MaxEvents = 3 };

        Assert.Throws<ArgumentOutOfRangeException>(() =>
            _simulator.Simulate(input, new SequenceRandomSource(1)));
    }

    [Fact]
    public void RecargaConsomeTurnoEUsaSomenteMunicaoDaRun()
    {
        GameBattleInput input = Battle(
            Actor("hero", 20, Action("rifle", 5,
                magazine: new GameBattleMagazineSpec(2, 0, 2))),
            Actor("enemy", 5, Action("miss", 0)),
            maxRounds: 2);

        GameBattleResult result = _simulator.Simulate(input, new SequenceRandomSource(20));

        Assert.Equal("hero", result.WinnerActorId);
        Assert.Equal(1, result.Events.Count(item => item.Type == GameBattleEventTypes.ReloadPerformed));
        Assert.Equal(1, result.Events.Count(item => item.Type == GameBattleEventTypes.DiceRolled && item.ActorId == "hero"));
        GameBattleActionState rifle = result.Actors[0].Actions.Single();
        Assert.Equal(1, rifle.Loaded);
        Assert.Equal(0, rifle.Reserve);
        Assert.Equal(0, input.FirstActor.Actions[0].Magazine!.Loaded);
    }

    [Fact]
    public void RecargaEsperaAsOutrasAcoesEOrdemVoltaAValerQuandoArmaEstiverPronta()
    {
        GameBattleActionSpec gun = Action("gun", 1,
            magazine: new GameBattleMagazineSpec(2, 0, 2));
        GameBattleActionSpec sword = Action("sword", 1, staminaCost: 1);
        GameBattleInput input = Battle(
            Actor("hero", 50, gun, sword) with { Stamina = 2, MaximumStamina = 2 },
            Actor("enemy", 100, Action("miss", 0)));

        GameBattleResult result = _simulator.Simulate(input, new SequenceRandomSource(20));
        string[] selected = result.Events
            .Where(item => item.Type == GameBattleEventTypes.ActionSelected && item.ActorId == "hero")
            .Select(item => ((ActionSelectedPayload)item.Payload).ActionId).Take(4).ToArray();

        Assert.Equal(new[] { "sword", "sword", "gun", "gun" }, selected);
        Assert.Single(result.Events, item => item.Type == GameBattleEventTypes.ReloadPerformed &&
            item.ActorId == "hero");
    }

    [Fact]
    public void RecargaSoAconteceDepoisQueTodasAsAcoesAlternativasFicamIndisponiveis()
    {
        GameBattleActionSpec gun = Action("gun", 1,
            magazine: new GameBattleMagazineSpec(1, 1, 0) { UnlimitedReserve = true });
        GameBattleActionSpec sword = Action("sword", 1, staminaCost: 5);
        GameBattleActionSpec magic = Action("magic", 1, manaCost: 3);
        GameBattleActorSpec hero = Actor("hero", 50, gun, sword, mana: 3)
            with { Actions = [gun, sword, magic], Stamina = 5, MaximumStamina = 5 };

        GameBattleResult result = _simulator.Simulate(Battle(
            hero, Actor("enemy", 1000, Action("miss", 0)), maxRounds: 8),
            new SequenceRandomSource(20));
        ActionSelectedPayload[] selected = result.Events
            .Where(item => item.Type == GameBattleEventTypes.ActionSelected && item.ActorId == "hero")
            .Select(item => (ActionSelectedPayload)item.Payload).Take(5).ToArray();

        Assert.Equal(["gun", "sword", "magic", "gun", "gun"],
            selected.Select(item => item.ActionId));
        Assert.False(selected[0].Reload);
        Assert.True(selected[3].Reload);
        Assert.False(selected[4].Reload);
    }

    [Fact]
    public void ArmaEsgotadaRecarregaNoTurnoSeguinteQuandoOutraAcaoNaoTemRecurso()
    {
        GameBattleActionSpec gun = Action("gun", 1,
            magazine: new GameBattleMagazineSpec(1, 1, 1));
        GameBattleActionSpec sword = Action("sword", 1, staminaCost: 1);
        GameBattleActorSpec hero = Actor("hero", 50, gun, sword)
            with { Stamina = 0, MaximumStamina = 0 };

        GameBattleResult result = _simulator.Simulate(Battle(
            hero, Actor("enemy", 100, Action("miss", 0)), maxRounds: 6),
            new SequenceRandomSource(20));
        GameBattleEvent[] heroTurns = result.Events.Where(item =>
            item.Type == GameBattleEventTypes.TurnStarted && item.ActorId == "hero").ToArray();
        GameBattleEvent[] heroActions = result.Events.Where(item =>
            item.Type == GameBattleEventTypes.ActionSelected && item.ActorId == "hero")
            .Take(3).ToArray();

        Assert.Equal(3, heroActions.Length);
        Assert.Equal(["gun", "gun", "gun"], heroActions
            .Select(item => ((ActionSelectedPayload)item.Payload).ActionId));
        Assert.False(((ActionSelectedPayload)heroActions[0].Payload).Reload);
        Assert.True(((ActionSelectedPayload)heroActions[1].Payload).Reload);
        Assert.False(((ActionSelectedPayload)heroActions[2].Payload).Reload);
        Assert.True(heroTurns[1].Sequence < heroActions[1].Sequence);
        Assert.True(heroActions[1].Sequence < heroTurns[2].Sequence);
        Assert.DoesNotContain(result.Events.Where(item => item.Sequence < heroActions[1].Sequence),
            item => item.Type == GameBattleEventTypes.TurnPassed && item.ActorId == "hero");
    }

    [Fact]
    public void AquilaEsgotadaUsaEspadaAntesDeRecarregar()
    {
        GameBattleActionSpec aquila = Action("aquila", 150,
            magazine: new GameBattleMagazineSpec(10, 1, 10)) with
        {
            AttacksPerTurn = 10,
            AdditionalAttackStaminaCost = 5,
        };
        GameBattleActionSpec espada = Action("espada", 20, staminaCost: 25);
        GameBattleActorSpec hero = Actor("hero", 100, aquila, espada)
            with { Stamina = 100, MaximumStamina = 100 };

        GameBattleResult result = _simulator.Simulate(Battle(
            hero, Actor("enemy", 10000, Action("miss", 0)), maxRounds: 7),
            new SequenceRandomSource(20));
        ActionSelectedPayload[] selected = result.Events
            .Where(item => item.Type == GameBattleEventTypes.ActionSelected && item.ActorId == "hero")
            .Select(item => (ActionSelectedPayload)item.Payload).ToArray();

        Assert.Equal("aquila", selected[0].ActionId);
        Assert.Equal("espada", selected[1].ActionId);
        Assert.False(selected[0].Reload);
        Assert.False(selected[1].Reload);
        Assert.Contains(selected.Skip(2), action => action.ActionId == "aquila" && action.Reload);
    }

    [Fact]
    public void AquilaRecarregaAntesDoAtaqueDeTreinoSeEspadaNaoTemEstamina()
    {
        GameBattleActionSpec aquila = Action("aquila", 150,
            magazine: new GameBattleMagazineSpec(10, 10, 0) { UnlimitedReserve = true }) with
        {
            AttacksPerTurn = 10,
            AdditionalAttackStaminaCost = 5,
        };
        GameBattleActionSpec espada = Action("espada", 200, staminaCost: 25) with
        {
            AttacksPerTurn = 4,
        };
        GameBattleActorSpec hero = Actor("hero", 500, aquila, espada)
            with
            {
                Stamina = 100,
                MaximumStamina = 100,
                Actions = [aquila, espada, Action("treino-basico", 1) with { IsFallback = true }],
            };

        GameBattleResult result = _simulator.Simulate(Battle(
            hero, Actor("enemy", 10000, Action("miss", 0)), maxRounds: 5),
            new SequenceRandomSource(10));
        ActionSelectedPayload[] selected = result.Events
            .Where(item => item.Type == GameBattleEventTypes.ActionSelected && item.ActorId == "hero")
            .Select(item => (ActionSelectedPayload)item.Payload).Take(3).ToArray();

        Assert.Equal(["aquila", "aquila", "aquila"], selected.Select(item => item.ActionId));
        Assert.False(selected[0].Reload);
        Assert.True(selected[1].Reload);
        Assert.False(selected[2].Reload);
    }

    [Fact]
    public void QuantidadeUsaUmDadoMultiplicaDanoECobraEstaminaAdicional()
    {
        GameBattleActionSpec burst = Action("burst", 1) with
        {
            AttacksPerTurn = 3,
            AdditionalAttackStaminaCost = 5,
        };
        GameBattleInput input = Battle(
            Actor("hero", 50, burst),
            Actor("enemy", 100, Action("miss", 0)));

        GameBattleResult result = _simulator.Simulate(input, new SequenceRandomSource(20));
        int firstEnemyTurn = result.Events.ToList().FindIndex(item =>
            item.Type == GameBattleEventTypes.TurnStarted && item.ActorId == "enemy");
        Assert.Equal(1, result.Events.Take(firstEnemyTurn).Count(item =>
            item.Type == GameBattleEventTypes.DiceRolled && item.ActorId == "hero"));
        Assert.Equal(3, result.Events.Take(firstEnemyTurn)
            .Where(item => item.Type == GameBattleEventTypes.ActionSelected && item.ActorId == "hero")
            .Select(item => ((ActionSelectedPayload)item.Payload).Quantity).Single());
        Assert.Equal(3, result.Events.Take(firstEnemyTurn)
            .Where(item => item.Type == GameBattleEventTypes.DamageCalculated && item.ActorId == "hero")
            .Select(item => ((DamageCalculatedPayload)item.Payload).Damage).Single());
        Assert.Equal(10, result.Events.Take(firstEnemyTurn)
            .Where(item => item.Type == GameBattleEventTypes.ResourceChanged && item.ActorId == "hero" &&
                ((ResourceChangedPayload)item.Payload).Resource == "stamina")
            .Sum(item => ((ResourceChangedPayload)item.Payload).Before -
                ((ResourceChangedPayload)item.Payload).After));
    }

    [Fact]
    public void TresGolpesDeEspadaFazemUmaRolagemComTriploDanoECusto()
    {
        GameBattleActionSpec sword = Action("sword", 80, staminaCost: 3)
            with { AttacksPerTurn = 3 };
        GameBattleResult result = _simulator.Simulate(Battle(
            Actor("hero", 30, sword), Actor("enemy", 240, Action("miss", 0))),
            new SequenceRandomSource(20));

        Assert.Equal(11, result.Actors[0].Stamina);
        Assert.Single(result.Events, item => item.Type == GameBattleEventTypes.DiceRolled &&
            item.ActorId == "hero");
        Assert.Equal(240, result.Events.Where(item => item.Type == GameBattleEventTypes.DamageCalculated &&
            item.ActorId == "hero").Select(item => ((DamageCalculatedPayload)item.Payload).Damage).Single());
    }

    [Fact]
    public void ErroGastaMunicaoEEstaminaDeTodaAQuantidade()
    {
        GameBattleActionSpec gun = Action("gun", 80,
            magazine: new GameBattleMagazineSpec(3, 3, 0), staminaCost: 2) with
        {
            AttacksPerTurn = 3,
            AdditionalAttackStaminaCost = 5,
        };
        GameBattleResult result = _simulator.Simulate(Battle(
            Actor("hero", 30, gun), Actor("enemy", 60, Action("miss", 0)), maxRounds: 1),
            new SequenceRandomSource(2));

        Assert.Equal(0, result.Actors[0].Actions[0].Loaded);
        Assert.Equal(4, result.Actors[0].Stamina);
        Assert.Single(result.Events, item => item.Type == GameBattleEventTypes.DiceRolled &&
            item.ActorId == "hero");
        Assert.Equal(0, result.Events.Where(item => item.Type == GameBattleEventTypes.DamageCalculated &&
            item.ActorId == "hero").Select(item => ((DamageCalculatedPayload)item.Payload).Damage).Single());
    }

    [Fact]
    public void UltimaMunicaoFazUsoParcialAntesDeRecarregar()
    {
        GameBattleActionSpec gun = Action("gun", 80,
            magazine: new GameBattleMagazineSpec(5, 5, 5)) with { AttacksPerTurn = 2 };
        GameBattleResult result = _simulator.Simulate(Battle(
            Actor("hero", 30, gun), Actor("enemy", 1000, Action("miss", 0)), maxRounds: 5),
            new SequenceRandomSource(20));
        ActionSelectedPayload[] actions = result.Events
            .Where(item => item.Type == GameBattleEventTypes.ActionSelected && item.ActorId == "hero")
            .Select(item => (ActionSelectedPayload)item.Payload).Take(4).ToArray();
        int[] damage = result.Events
            .Where(item => item.Type == GameBattleEventTypes.DamageCalculated && item.ActorId == "hero")
            .Select(item => ((DamageCalculatedPayload)item.Payload).Damage).Take(3).ToArray();

        Assert.Equal([2, 2, 1, 1], actions.Select(item => item.Quantity));
        Assert.True(actions[3].Reload);
        Assert.Equal([160, 160, 80], damage);
    }

    [Fact]
    public void RajadasGastamMunicaoPorRajadaMasUsamUmaRolagem()
    {
        GameBattleActionSpec gun = Action("gun", 20,
            magazine: new GameBattleMagazineSpec(60, 60, 0, AmmoPerUse: 10)) with
        {
            AttacksPerTurn = 3,
            AdditionalAttackStaminaCost = 5,
        };
        GameBattleResult result = _simulator.Simulate(Battle(
            Actor("hero", 30, gun), Actor("enemy", 60, Action("miss", 0)), maxRounds: 1),
            new SequenceRandomSource(20));

        Assert.Equal(30, result.Actors[0].Actions[0].Loaded);
        Assert.Equal(10, result.Actors[0].Stamina);
        Assert.Single(result.Events, item => item.Type == GameBattleEventTypes.DiceRolled &&
            item.ActorId == "hero");
        Assert.Equal(60, result.Events.Where(item => item.Type == GameBattleEventTypes.DamageCalculated &&
            item.ActorId == "hero").Select(item => ((DamageCalculatedPayload)item.Payload).Damage).Single());
    }

    [Fact]
    public void UsosAtePausaLimitamAQuantidadeERetornamAposDescanso()
    {
        GameBattleActionSpec weapon = Action("weapon", 1) with
        {
            AttacksPerTurn = 2,
            UsesUntilRest = 3,
        };
        GameBattleInput input = Battle(
            Actor("hero", 50, weapon, Action("backup", 0)) with
            {
                Rest = new GameBattleRestSpec(1, 0, 0, 0, false),
            },
            Actor("enemy", 100, Action("miss", 0)), maxRounds: 5);

        GameBattleResult result = _simulator.Simulate(input, new SequenceRandomSource(20));
        ActionSelectedPayload[] selected = result.Events
            .Where(item => item.Type == GameBattleEventTypes.ActionSelected && item.ActorId == "hero")
            .Select(item => (ActionSelectedPayload)item.Payload).Take(4).ToArray();

        Assert.Equal(["weapon", "weapon", "descanso", "backup"], selected.Select(item => item.ActionId));
        Assert.Equal([2, 1], selected.Take(2).Select(item => item.Quantity));
    }

    [Fact]
    public void MultiplosAtaquesExigemManaParaTodosAntesDeComecar()
    {
        GameBattleActionSpec spell = Action("spell", 1, manaCost: 2) with
        {
            AttacksPerTurn = 2,
        };
        GameBattleInput input = Battle(
            Actor("hero", 30, spell, Action("staff", 1), mana: 3),
            Actor("enemy", 30, Action("miss", 0)), maxRounds: 1);

        GameBattleResult result = _simulator.Simulate(input, new SequenceRandomSource(20));

        Assert.Equal("staff", ((ActionSelectedPayload)result.Events.First(item =>
            item.Type == GameBattleEventTypes.ActionSelected && item.ActorId == "hero").Payload).ActionId);
        Assert.Equal(3, result.Actors[0].Mana);
        Assert.Contains(result.Events, item => item.Type == GameBattleEventTypes.ActionUnavailable &&
            ((ActionUnavailablePayload)item.Payload).Reason == "MANA");
    }

    [Fact]
    public void DescansoPulaUmTurnoERetornaAPrioridadeDepois()
    {
        GameBattleInput input = Battle(
            Actor("hero", 50, Action("first", 1, staminaCost: 2), Action("second", 1))
                with { Stamina = 2, MaximumStamina = 2,
                    Rest = new GameBattleRestSpec(1, 0, 0, 2, false) },
            Actor("enemy", 100, Action("miss", 0)));

        GameBattleResult result = _simulator.Simulate(input, new SequenceRandomSource(20));
        string[] selected = result.Events
            .Where(item => item.Type == GameBattleEventTypes.ActionSelected && item.ActorId == "hero")
            .Select(item => ((ActionSelectedPayload)item.Payload).ActionId).Take(4).ToArray();

        Assert.Equal(new[] { "first", "descanso", "second", "first" }, selected);
        Assert.Contains(result.Events, item => item.Type == GameBattleEventTypes.RestPerformed);
    }

    [Fact]
    public void CooldownRecolocaAcaoNaPrioridadeAposCicloCompleto()
    {
        GameBattleInput input = Battle(
            Actor("hero", 30, Action("skill", 1, cooldown: 1), Action("backup", 0)),
            Actor("enemy", 30, Action("miss", 0)),
            maxRounds: 3);

        GameBattleResult result = _simulator.Simulate(input, new SequenceRandomSource(20));
        string[] used = result.Events
            .Where(item => item.Type == GameBattleEventTypes.ActionSelected && item.ActorId == "hero")
            .Select(item => ((ActionSelectedPayload)item.Payload).ActionId)
            .ToArray();

        Assert.Equal(new[] { "skill", "backup", "skill" }, used.Take(3));
        Assert.Contains(result.Events, item => item.Type == GameBattleEventTypes.ActionUnavailable &&
            ((ActionUnavailablePayload)item.Payload).Reason == "COOLDOWN");
        Assert.Equal("hero", result.WinnerActorId);
    }

    [Fact]
    public void SemManaSelecionaProximaAcaoDisponivel()
    {
        GameBattleInput input = Battle(
            Actor("hero", 20, Action("spell", 10, manaCost: 2), Action("staff", 1), mana: 1),
            Actor("enemy", 20, Action("miss", 0)),
            maxRounds: 1);

        GameBattleResult result = _simulator.Simulate(input, new SequenceRandomSource(20));

        Assert.Equal("staff", ((ActionSelectedPayload)result.Events.First(item =>
            item.Type == GameBattleEventTypes.ActionSelected && item.ActorId == "hero").Payload).ActionId);
        Assert.Contains(result.Events, item => item.Type == GameBattleEventTypes.ActionUnavailable &&
            ((ActionUnavailablePayload)item.Payload).Reason == "MANA");
        Assert.Equal(1, result.Actors[0].Mana);
    }

    [Fact]
    public void InimigoConsomeManaEEstaminaAoUsarAtaqueComCusto()
    {
        GameBattleInput input = Battle(
            Actor("hero", 20, Action("miss", 0)),
            Actor("enemy", 20, Action("spell", 0, manaCost: 2, staminaCost: 3), mana: 4),
            maxRounds: 1);

        GameBattleResult result = _simulator.Simulate(input, new SequenceRandomSource(20));

        Assert.Equal(2, result.Actors[1].Mana);
        Assert.Equal(17, result.Actors[1].Stamina);
        Assert.Contains(result.Events, item => item.Type == GameBattleEventTypes.ResourceChanged &&
            item.ActorId == "enemy" && ((ResourceChangedPayload)item.Payload).Resource == "mana");
        Assert.Contains(result.Events, item => item.Type == GameBattleEventTypes.ResourceChanged &&
            item.ActorId == "enemy" && ((ResourceChangedPayload)item.Payload).Resource == "stamina");
    }

    [Fact]
    public void OrdemExplicitaDeDefesasConstaNosEventos()
    {
        GameBattleInput input = Battle(
            Actor("hero", 30, Action("strike", 10)),
            Actor("enemy", 20, Action("miss", 0),
                defenses: new GameBattleDefenses(Shield: 1, Protection: 4, Armor: 2)),
            maxRounds: 2,
            defenseOrder: new[]
            {
                GameBattleDefenseKind.Shield,
                GameBattleDefenseKind.Protection,
                GameBattleDefenseKind.Armor,
            });

        GameBattleResult result = _simulator.Simulate(input, new SequenceRandomSource(20));
        DefenseAppliedPayload[] defenses = result.Events
            .Where(item => item.Type == GameBattleEventTypes.DefenseApplied)
            .Select(item => (DefenseAppliedPayload)item.Payload)
            .ToArray();

        Assert.Equal(new[] { GameBattleDefenseKind.Shield, GameBattleDefenseKind.Protection,
            GameBattleDefenseKind.Armor }, defenses.Take(3).Select(item => item.Defense));
        Assert.Equal(new[] { 1, 4, 2 }, defenses.Take(3).Select(item => item.Absorbed));
        Assert.True(result.Actors[1].HitPoints < 20);
        Assert.Equal(new GameBattleDefenses(0, 0, 2), result.Actors[1].Defenses);
        Assert.Equal(new GameBattleDefenses(1, 4, 2), input.SecondActor.Defenses);
    }

    [Fact]
    public void EscudoAbsorveSeuValorEApenasNoPrimeiroImpacto()
    {
        GameBattleInput input = Battle(
            Actor("hero", 100, Action("strike", 700)),
            Actor("enemy", 1000, Action("miss", 0),
                defenses: new GameBattleDefenses(Shield: 500)),
            maxRounds: 1,
            defenseOrder: [GameBattleDefenseKind.Shield]);

        GameBattleResult result = _simulator.Simulate(input, new SequenceRandomSource(20));
        DefenseAppliedPayload shield = result.Events
            .Where(item => item.Type == GameBattleEventTypes.DefenseApplied)
            .Select(item => (DefenseAppliedPayload)item.Payload).Single();

        Assert.Equal(500, shield.Absorbed);
        Assert.Equal(200, shield.RemainingDamage);
        Assert.Equal(0, shield.DefenseAfter);
        Assert.Contains(result.Events, item => item.Type == GameBattleEventTypes.ResourceChanged &&
            item.TargetId == "enemy" && ((ResourceChangedPayload)item.Payload).After == 800);
        Assert.Equal(0, result.Actors[1].Defenses.Shield);
    }

    [Fact]
    public void NaturalVinteTemPrioridadeSobreTotalModificado()
    {
        GameBattleActionSpec action = Action("strike", 8, modifier: -15);
        GameBattleInput input = Battle(
            Actor("hero", 20, action),
            Actor("enemy", 5, Action("miss", 0)));

        GameBattleResult result = _simulator.Simulate(input, new SequenceRandomSource(20));
        DiceRolledPayload roll = (DiceRolledPayload)result.Events.Single(item =>
            item.Type == GameBattleEventTypes.DiceRolled).Payload;

        Assert.Equal(20, roll.Roll.ValorNatural);
        Assert.Equal(5, roll.Roll.Total);
        Assert.Equal("CRITICO", roll.ResultCode);
        Assert.Equal("Crítico", roll.ResultName);
        Assert.True(roll.Critical);
        Assert.False(roll.CriticalFailure);
        Assert.Equal("hero", result.WinnerActorId);
    }

    [Fact]
    public void FalhaCriticaNaoCausaDanoNemConcedeRevidarExtra()
    {
        GameBattleInput input = Battle(
            Actor("hero", 20, Action("strike", 8, manaCost: 2), mana: 2),
            Actor("enemy", 20, Action("claw", 1)),
            maxRounds: 1);

        GameBattleResult result = _simulator.Simulate(input, new SequenceRandomSource(1, 20));
        DiceRolledPayload[] rolls = result.Events
            .Where(item => item.Type == GameBattleEventTypes.DiceRolled)
            .Select(item => (DiceRolledPayload)item.Payload)
            .ToArray();

        Assert.True(rolls.Length >= 2);
        Assert.Equal("FALHA_CRITICA", rolls[0].ResultCode);
        Assert.Equal("Falha crítica", rolls[0].ResultName);
        Assert.False(rolls[0].Critical);
        Assert.True(rolls[0].CriticalFailure);
        Assert.Equal("CRITICO", rolls[1].ResultCode);
        Assert.Contains(result.Events, item => item.Type == GameBattleEventTypes.DamageCalculated &&
            item.ActorId == "hero" && ((DamageCalculatedPayload)item.Payload).Damage == 0);
        Assert.Equal(0, result.Actors.Single(item => item.Id == "hero").Mana);
        Assert.Equal(new[] { "hero", "enemy" }, result.Events
            .Where(item => item.Type == GameBattleEventTypes.TurnStarted)
            .Take(2).Select(item => item.ActorId));
    }

    [Fact]
    public void FalhaCriticaComReacaoConfiguradaConcedeRevidarEAcaoNormal()
    {
        GameBattleActionSpec strike = Action("strike", 8);
        strike = strike with
        {
            ResultRanges = strike.ResultRanges.Select(range => range.Code == "FALHA_CRITICA"
                ? range with { EffectJson = """{"reacao":"REVIDAR"}""" } : range).ToArray(),
        };
        GameBattleInput input = Battle(Actor("hero", 20, strike),
            Actor("enemy", 20, Action("claw", 1)), maxRounds: 1);

        GameBattleResult result = _simulator.Simulate(input, new SequenceRandomSource(1, 20, 20));
        ActionSelectedPayload[] enemyActions = result.Events
            .Where(item => item.Type == GameBattleEventTypes.ActionSelected && item.ActorId == "enemy")
            .Select(item => (ActionSelectedPayload)item.Payload).ToArray();

        Assert.True(enemyActions.Length >= 2);
        Assert.True(enemyActions[0].Reaction);
        Assert.False(enemyActions[1].Reaction);
        Assert.True(result.Events.Count(item => item.Type == GameBattleEventTypes.TurnStarted &&
            item.ActorId == "enemy") >= 1);
        Assert.True(result.Actors.Single(item => item.Id == "hero").HitPoints <= 18);
    }

    [Fact]
    public void FalhaCriticaConfiguradaPermiteRecarregarNoBonusEAtirarNoTurnoNormal()
    {
        GameBattleActionSpec gun = Action("aquila", 1,
            magazine: new GameBattleMagazineSpec(1, 1, 0) { UnlimitedReserve = true });
        GameBattleActionSpec sword = Action("espada", 1, staminaCost: 20);
        GameBattleActionSpec enemyAttack = Action("enemy-attack", 1) with
        {
            ResultRanges = Action("enemy-attack", 1).ResultRanges.Select(range =>
                range.Code == "FALHA_CRITICA"
                    ? range with { EffectJson = """{"reacao":"REVIDAR"}""" }
                    : range).ToArray(),
        };
        GameBattleActorSpec hero = Actor("hero", 100, gun, sword)
            with { Stamina = 0, MaximumStamina = 0 };

        GameBattleResult result = _simulator.Simulate(Battle(
            hero, Actor("enemy", 100, enemyAttack), maxRounds: 3),
            new SequenceRandomSource(10, 1, 11, 10));
        GameBattleEvent[] heroActions = result.Events.Where(evt =>
            evt.Type == GameBattleEventTypes.ActionSelected && evt.ActorId == "hero")
            .Take(3).ToArray();
        GameBattleEvent[] heroTurns = result.Events.Where(evt =>
            evt.Type == GameBattleEventTypes.TurnStarted && evt.ActorId == "hero")
            .Take(3).ToArray();

        Assert.Equal(["aquila", "aquila", "aquila"], heroActions.Select(evt =>
            ((ActionSelectedPayload)evt.Payload).ActionId));
        Assert.True(((ActionSelectedPayload)heroActions[1].Payload).Reload);
        Assert.True(((ActionSelectedPayload)heroActions[1].Payload).Reaction);
        Assert.False(((ActionSelectedPayload)heroActions[2].Payload).Reload);
        Assert.False(((ActionSelectedPayload)heroActions[2].Payload).Reaction);
        Assert.Equal(3, heroTurns.Length);
        Assert.True(heroTurns[1].Sequence < heroActions[1].Sequence);
        Assert.True(heroActions[1].Sequence < heroTurns[2].Sequence);
        Assert.True(heroTurns[2].Sequence < heroActions[2].Sequence);
    }

    [Fact]
    public void EmpateSemDanoELimiteDeEventosSaoFinitos()
    {
        GameBattleInput input = Battle(
            Actor("hero", 20, Action("idle", 0)),
            Actor("enemy", 20, Action("idle", 0)),
            maxRounds: 10,
            maxRoundsWithoutDamage: 2);
        GameBattleResult noDamage = _simulator.Simulate(input, new SequenceRandomSource(20));
        GameBattleResult eventLimit = _simulator.Simulate(input with { MaxEvents = 2 },
            new SequenceRandomSource(20));

        Assert.Equal("enemy", noDamage.WinnerActorId);
        Assert.Equal(GameBattleEndReason.NoDamage, noDamage.EndReason);
        Assert.Equal(2, noDamage.RoundsCompleted);
        Assert.Equal(GameBattleEndReason.EventLimit, eventLimit.EndReason);
        Assert.Equal("enemy", eventLimit.WinnerActorId);
        Assert.Equal(new[] { GameBattleEventTypes.BattleStarted, GameBattleEventTypes.BattleEnded },
            eventLimit.Events.Select(item => item.Type));
    }

    [Fact]
    public void ImpasseUsaVidaRestante()
    {
        GameBattleInput input = Battle(
            Actor("hero", 21, Action("idle", 0)),
            Actor("enemy", 20, Action("idle", 0)),
            maxRounds: 1, maxRoundsWithoutDamage: 1);

        GameBattleResult result = _simulator.Simulate(input, new SequenceRandomSource(20));

        Assert.Equal("hero", result.WinnerActorId);
        Assert.Equal(GameBattleEndReason.NoDamage, result.EndReason);
    }

    [Fact]
    public void CombateContinuaAteHaverVencedorMesmoAposAntigoLimiteDeRodadas()
    {
        GameBattleInput input = Battle(
            Actor("hero", 20, Action("strike", 1)),
            Actor("enemy", 3, Action("idle", 0)),
            maxRounds: 1);

        GameBattleResult result = _simulator.Simulate(input, new SequenceRandomSource(20));

        Assert.Equal("hero", result.WinnerActorId);
        Assert.Equal(GameBattleEndReason.ActorDefeated, result.EndReason);
        Assert.True(result.RoundsCompleted >= 2);
    }

    [Fact]
    public void ArmaduraQueAbsorveTudoTambemEncerraPorAusenciaDeProgresso()
    {
        GameBattleInput input = Battle(
            Actor("hero", 20, Action("strike", 2)),
            Actor("enemy", 20, Action("strike", 2), defenses: new GameBattleDefenses(Armor: 5)),
            maxRounds: 10,
            maxRoundsWithoutDamage: 2,
            defenseOrder: new[] { GameBattleDefenseKind.Armor });

        GameBattleResult result = _simulator.Simulate(input, new SequenceRandomSource(20));

        // The hero takes damage from the enemy in this fixture, so combat still progresses.
        Assert.NotEqual(GameBattleEndReason.NoDamage, result.EndReason);

        GameBattleInput blockedBothWays = input with
        {
            FirstActor = input.FirstActor with { Defenses = new GameBattleDefenses(Armor: 5) },
        };
        GameBattleResult blocked = _simulator.Simulate(blockedBothWays, new SequenceRandomSource(20));
        Assert.Equal(GameBattleEndReason.NoDamage, blocked.EndReason);
        Assert.Equal(2, blocked.RoundsCompleted);
        Assert.Equal(20, blocked.Actors[0].HitPoints);
        Assert.Equal(20, blocked.Actors[1].HitPoints);
    }

    [Fact]
    public void VantagemPreservaTodosOsDadosEEscolheMaiorTentativa()
    {
        GameBattleActionSpec strike = Action("strike", 6);
        strike = strike with
        {
            Roll = strike.Roll with { Mode = GameplayRollMode.Vantagem },
        };
        GameBattleInput input = Battle(
            Actor("hero", 20, strike),
            Actor("enemy", 5, Action("miss", 0)));

        GameBattleResult result = _simulator.Simulate(input, new SequenceRandomSource(1, 20));
        DiceRolledPayload payload = (DiceRolledPayload)result.Events.Single(item =>
            item.Type == GameBattleEventTypes.DiceRolled).Payload;

        Assert.Equal(GameplayRollMode.Vantagem, payload.Mode);
        Assert.Equal(new[] { 1, 20 }, payload.Roll.Grupos.Single().Valores);
        Assert.Equal(new[] { 1 }, payload.Roll.Grupos.Single().IndicesMantidos);
        Assert.Equal("hero", result.WinnerActorId);
    }

    [Fact]
    public void LimiteDeEventosNuncaCortaUmaAcaoPelaMetade()
    {
        GameBattleInput input = Battle(
            Actor("hero", 20, Action("shot", 6, cooldown: 1, manaCost: 1,
                magazine: new GameBattleMagazineSpec(2, 2, 2)), mana: 2),
            Actor("enemy", 20, Action("miss", 0), defenses: new GameBattleDefenses(Protection: 2, Armor: 1)),
            maxRounds: 3,
            defenseOrder: new[] { GameBattleDefenseKind.Protection, GameBattleDefenseKind.Armor })
            with { MaxEvents = 16 };

        GameBattleResult result = _simulator.Simulate(input, new SequenceRandomSource(20));

        Assert.True(result.Events.Count <= input.MaxEvents);
        Assert.Equal(GameBattleEndReason.EventLimit, result.EndReason);
        Assert.Contains(result.Events, item => item.Type == GameBattleEventTypes.DamageCalculated);
        Assert.Equal(GameBattleEventTypes.BattleEnded, result.Events[^1].Type);
    }

    [Fact]
    public void DefesasAtivasSemOrdemSaoRecusadas()
    {
        GameBattleInput input = Battle(
            Actor("hero", 20, Action("strike", 5)),
            Actor("enemy", 20, Action("miss", 0), defenses: new GameBattleDefenses(Protection: 5)));

        Assert.Throws<ArgumentException>(() =>
            _simulator.Simulate(input, new SequenceRandomSource(20)));
    }

    private static GameBattleInput Battle(
        GameBattleActorSpec first,
        GameBattleActorSpec second,
        int maxRounds = 20,
        int maxRoundsWithoutDamage = 5,
        IReadOnlyList<GameBattleDefenseKind>? defenseOrder = null) =>
        new(first, second, defenseOrder ?? Array.Empty<GameBattleDefenseKind>(),
            MaxRounds: maxRounds, MaxRoundsWithoutDamage: Math.Min(maxRounds, maxRoundsWithoutDamage));

    private static GameBattleActorSpec Actor(
        string id,
        int health,
        GameBattleActionSpec first,
        GameBattleActionSpec? second = null,
        int mana = 0,
        GameBattleDefenses? defenses = null) =>
        new(id, id, health, health, mana, mana, 20, 20,
            defenses ?? new GameBattleDefenses(),
            second is null ? new[] { first } : new[] { first, second });

    private static GameBattleActionSpec Action(
        string id,
        int damage,
        int cooldown = 0,
        int manaCost = 0,
        int modifier = 0,
        GameBattleMagazineSpec? magazine = null,
        int staminaCost = 0) => new(
            id,
            id,
            new GameplayRollPlan("1D20", new[] { new GameplayDiceGroupSpec(1, 20) },
                GameplayRollMode.Normal, modifier),
            new[]
            {
                new GameplayResolvedResultRange("FALHA_CRITICA", "Falha crítica", 1, 1, true, false, true),
                new GameplayResolvedResultRange("ERRO", "Erro", 2, 10, false, false, false),
                new GameplayResolvedResultRange("ACERTO", "Acerto", 11, 19, false, false, false),
                new GameplayResolvedResultRange("CRITICO", "Crítico", 20, 20, true, true, false),
            },
            true,
            new Dictionary<string, int>
            {
                ["FALHA_CRITICA"] = 0,
                ["ERRO"] = 0,
                ["ACERTO"] = damage,
                ["CRITICO"] = damage,
            },
            ManaCost: manaCost,
            StaminaCost: staminaCost,
            CooldownTurns: cooldown,
            Magazine: magazine);

    private sealed class SequenceRandomSource(params int[] values) : IDiceRandomSource
    {
        private int _index;

        public int NextInclusive(int maximum)
        {
            int result = values[Math.Min(_index++, values.Length - 1)];
            Assert.InRange(result, 1, maximum);
            return result;
        }
    }
}
