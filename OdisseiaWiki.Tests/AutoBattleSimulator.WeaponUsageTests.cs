using OdisseiaWiki.GameRuns.Battle;
using OdisseiaWiki.Services.Helpers;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed partial class AutoBattleSimulatorTests
{
    [Fact]
    public void PausaPercorreTodasAsProximasAcoesAntesDeRenovarSemDescanso()
    {
        var flame = Action("flame", 1) with { UsesUntilRest = 2 };
        var hero = Actor("hero", 100, flame) with { Actions = [flame, Action("second", 1),
            Action("third", 1), Action("fallback", 1) with { IsFallback = true }] };
        var result = _simulator.Simulate(Battle(hero, Actor("enemy", 100, Action("idle", 0))), new SequenceRandomSource(11));
        var selected = result.Events.Where(e => e.Type == GameBattleEventTypes.ActionSelected && e.ActorId == "hero")
            .Select(e => ((ActionSelectedPayload)e.Payload).ActionId).Take(8).ToArray();
        Assert.Equal(["flame", "flame", "second", "third", "fallback", "flame", "flame", "second"], selected);
        Assert.DoesNotContain(result.Events, e => e.Type == GameBattleEventTypes.RestPerformed);
    }

    [Fact]
    public void PausaSemAcaoAlternativaPassaUmTurnoERetorna()
    {
        var weapon = Action("weapon", 1) with { UsesUntilRest = 1 };
        var result = _simulator.Simulate(Battle(Actor("hero", 100, weapon), Actor("enemy", 5, Action("idle", 0))),
            new SequenceRandomSource(11));
        Assert.Equal("hero", result.WinnerActorId);
        Assert.Equal(4, result.Events.Count(e => e.Type == GameBattleEventTypes.TurnPassed && e.ActorId == "hero"));
    }

    [Fact]
    public void LimiteDeUsosNaoImpedeRecargaQuandoRetornaDoCiclo()
    {
        var gun = Action("gun", 1, magazine: new GameBattleMagazineSpec(2, 2, 0) { UnlimitedReserve = true })
            with { UsesUntilRest = 2, AttacksPerTurn = 2 };
        var hero = Actor("hero", 100, gun, Action("fallback", 1) with { IsFallback = true });
        var result = _simulator.Simulate(Battle(hero, Actor("enemy", 100, Action("idle", 0))), new SequenceRandomSource(11));
        var selected = result.Events.Where(e => e.Type == GameBattleEventTypes.ActionSelected && e.ActorId == "hero")
            .Select(e => (ActionSelectedPayload)e.Payload).Take(5).ToArray();
        Assert.Equal(["gun", "gun", "gun", "gun", "gun"], selected.Select(e => e.ActionId));
        Assert.True(selected[1].Reload);
        Assert.False(selected[2].Reload);
    }

    [Theory]
    [InlineData(1, 1)]
    [InlineData(10, 2)]
    public void MuniçãoPorAtaqueIndependeDaQuantidadeDeAtaques(int ammoPerUse, int attacks)
    {
        var gun = Action("gun", 1, magazine: new GameBattleMagazineSpec(60, 60, 0, ammoPerUse)) with { AttacksPerTurn = attacks };
        var result = _simulator.Simulate(Battle(Actor("hero", 100, gun), Actor("enemy", attacks, Action("idle", 0))), new SequenceRandomSource(11));
        Assert.Equal(60 - ammoPerUse * attacks, result.Actors[0].Actions[0].Loaded);
        Assert.Single(result.Events, e => e.Type == GameBattleEventTypes.DiceRolled);
    }

    [Fact]
    public void AreaAtingeTodosOsInimigosRespeitandoDefesasComUmaUnicaCobranca()
    {
        var bomb = Action("bomb", 50, magazine: new GameBattleMagazineSpec(60, 60, 0, 10)) with
            { TargetsAllEnemies = true, AttacksPerTurn = 2 };
        var first = Actor("first", 90, Action("idle", 0), defenses: new GameBattleDefenses(Protection: 10));
        var defenseRule = new GameBattleConditionRule("DEF", "Defesa", "", "", 0, "", false, true, "MANUAL")
            { Effects = [new SistemaCondicaoEfeito("MODIFICAR_DEFESA", "ARMADURA", 0, "ENQUANTO_ATIVA")] };
        first = first with { ActiveConditions = [new(defenseRule, 0, null)] };
        var second = Actor("second", 95, Action("idle", 0), defenses: new GameBattleDefenses(Armor: 5));
        var input = Battle(Actor("hero", 100, bomb), first, defenseOrder: [GameBattleDefenseKind.Protection, GameBattleDefenseKind.Armor])
            with { AdditionalEnemies = [second] };
        var result = _simulator.Simulate(input, new SequenceRandomSource(11));
        Assert.Equal("hero", result.WinnerActorId);
        Assert.Equal(40, result.Actors[0].Actions[0].Loaded);
        Assert.All(result.Actors.Skip(1), actor => Assert.Equal(0, actor.HitPoints));
        Assert.Equal(2, result.Events.Count(e => e.Type == GameBattleEventTypes.ActorDefeated));
        Assert.Equal(2, result.Events.Count(e => e.Type == GameBattleEventTypes.DamageCalculated));
        Assert.Single(result.Events, e => e.Type == GameBattleEventTypes.DiceRolled);
        Assert.Single(result.Events, e => e.Type == GameBattleEventTypes.ActionSelected);
        var log = result.Events.ToList();
        Assert.True(log.FindLastIndex(e => e.Type == GameBattleEventTypes.DamageCalculated) <
            log.FindIndex(e => e.Type == GameBattleEventTypes.ConditionEffect));
    }

    [Fact]
    public void AreaDoInimigoNaoAtingeSeusAliados()
    {
        var enemy = Actor("enemy", 100, Action("bomb", 10) with { TargetsAllEnemies = true });
        var result = _simulator.Simulate(Battle(Actor("hero", 10, Action("idle", 0)), enemy)
            with { AdditionalEnemies = [Actor("ally", 100, Action("idle", 0))] }, new SequenceRandomSource(11));
        Assert.Equal("enemy", result.WinnerActorId);
        Assert.Equal(100, result.Actors[2].HitPoints);
    }
}
