using System.Text.Json.Nodes;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Services.Helpers;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class GameplayConditionRuntimeTests
{
    [Fact]
    public void ApplyActiveResourceLimits_AplicaRegrasAtivasNaOrdemERestauraLimiteBase()
    {
        var character = Character("""{"status":{"estamina":100,"estaminaMaxima":100}}""");
        var combat = new MesaCombate();
        var participant = Participant(character, combat);
        var fatigue = Rule(1, "FADIGA", 25, 1);
        var heavy = Rule(2, "PESADO", 50, 2);
        var version = new SistemaVersao { Condicoes = new[] { fatigue, heavy } };
        MesaCondicaoAtiva fatigueState = ActiveCondition(fatigue, participant, combat);
        MesaCondicaoAtiva heavyState = ActiveCondition(heavy, participant, combat);
        combat.Condicoes.Add(fatigueState);
        combat.Condicoes.Add(heavyState);

        bool reduced = GameplayConditionRuntime.ApplyActiveResourceLimits(character, combat, participant, version);

        Assert.True(reduced);
        Assert.Equal(37, StatusValue(character, "estaminaMaxima"));
        Assert.Equal(37, StatusValue(character, "estamina"));

        fatigueState.Status = MesaCondicaoStatus.Expirada;
        heavyState.Status = MesaCondicaoStatus.Expirada;
        bool restored = GameplayConditionRuntime.ApplyActiveResourceLimits(character, combat, participant, version);

        Assert.True(restored);
        Assert.Equal(100, StatusValue(character, "estaminaMaxima"));
        Assert.Equal(37, StatusValue(character, "estamina"));
    }

    [Fact]
    public void ActiveRules_NaoMisturaParticipantesNovosSemIdPersistido()
    {
        var combat = new MesaCombate();
        var firstCharacter = Character("""{"status":{"estamina":100,"estaminaMaxima":100}}""");
        var secondCharacter = Character("""{"status":{"estamina":100,"estaminaMaxima":100}}""");
        var first = Participant(firstCharacter, combat);
        var second = Participant(secondCharacter, combat);
        var fatigue = Rule(1, "FADIGA", 25, 1);
        var version = new SistemaVersao { Condicoes = new[] { fatigue } };
        combat.Condicoes.Add(ActiveCondition(fatigue, first, combat));

        Assert.True(GameplayConditionRuntime.ApplyActiveResourceLimits(firstCharacter, combat, first, version));
        Assert.False(GameplayConditionRuntime.ApplyActiveResourceLimits(secondCharacter, combat, second, version));
        Assert.Equal(75, StatusValue(firstCharacter, "estaminaMaxima"));
        Assert.Equal(100, StatusValue(secondCharacter, "estaminaMaxima"));
    }

    [Fact]
    public void ApplyActiveResourceLimits_UsaValorSobrescritoEAcumulosDaCondicaoAtiva()
    {
        var character = Character("""{"status":{"estamina":100,"estaminaMaxima":100}}""");
        var combat = new MesaCombate();
        var participant = Participant(character, combat);
        var fatigue = Rule(1, "FADIGA", 25, 1);
        var version = new SistemaVersao { Condicoes = new[] { fatigue } };
        MesaCondicaoAtiva state = ActiveCondition(fatigue, participant, combat);
        state.Valor = 10;
        state.Acumulos = 2;
        combat.Condicoes.Add(state);

        bool reduced = GameplayConditionRuntime.ApplyActiveResourceLimits(character, combat, participant, version);

        Assert.True(reduced);
        Assert.Equal(81, StatusValue(character, "estaminaMaxima"));
        Assert.Equal(81, StatusValue(character, "estamina"));
    }

    [Fact]
    public void BlocksRecovery_RespeitaSomenteCondicaoAtivaPublicada()
    {
        var character = Character("""{"status":{"mana":0,"manaMaxima":50}}""");
        var combat = new MesaCombate();
        var participant = Participant(character, combat);
        var dependency = new SistemaCondicao
        {
            IdSistemaCondicao = 3,
            Codigo = "DEPENDENCIA_DE_MANA",
            Nome = "Dependencia de mana",
            Tipo = "Magico",
            CodigoRecurso = "MANA",
            OperacaoEfeito = "BLOQUEAR_RECUPERACAO",
        };
        var version = new SistemaVersao { Condicoes = new[] { dependency } };
        MesaCondicaoAtiva state = ActiveCondition(dependency, participant, combat);
        combat.Condicoes.Add(state);

        Assert.True(GameplayConditionRuntime.BlocksRecovery(combat, participant, version, "mana"));

        state.Status = MesaCondicaoStatus.Expirada;
        Assert.False(GameplayConditionRuntime.BlocksRecovery(combat, participant, version, "MANA"));
    }

    [Fact]
    public void TryReadTriggerValue_CalculaExcessoSemContarTrajeEquipado()
    {
        var character = Character("""{"status":{"capacidadeCarga":10}}""");
        character.InventarioJson = """
            [
              {"tipo":"ARMA","peso":5,"quantidade":2},
              {"tipo":"TRAJE","peso":100,"atributos":{"__vistaExplodida":{"equippedSlot":"torso"}}}
            ]
            """;

        bool found = GameplayConditionRuntime.TryReadTriggerValue(character, "EXCESSO_CARGA", out decimal excess);

        Assert.True(found);
        Assert.Equal(0, excess);
    }

    [Fact]
    public void SynchronizeState_AtivaMorteECondicoesPublicadasSemDuplicar()
    {
        var character = Character("""{"status":{"vida":0,"vidaMaxima":100,"mana":0,"manaMaxima":50,"estamina":0,"estaminaMaxima":100}}""");
        var combat = new MesaCombate { Status = MesaCombateStatus.Ativo };
        var participant = Participant(character, combat);
        participant.Status = MesaCombateParticipanteStatus.Pronto;
        var fatigue = Rule(1, "FADIGA", 25, 1);
        fatigue.CodigoRecursoGatilho = "ESTAMINA";
        fatigue.OperadorGatilho = "<=";
        fatigue.ValorGatilho = 0;
        var dependency = new SistemaCondicao
        {
            IdSistemaCondicao = 2,
            Codigo = "DEPENDENCIA_DE_MANA",
            Nome = "Dependencia de mana",
            Tipo = "Magico",
            CodigoRecurso = "MANA",
            OperacaoEfeito = "BLOQUEAR_RECUPERACAO",
            MomentoEfeito = "ENQUANTO_ATIVA",
            CodigoRecursoGatilho = "MANA",
            OperadorGatilho = "<=",
            ValorGatilho = 0,
            Ordem = 2,
        };
        var version = new SistemaVersao
        {
            Condicoes = new[] { fatigue, dependency },
            Morte = new SistemaMorteConfig { LimiteBeiraDaMorte = 0 },
        };

        GameplayConditionSynchronizationResult first = GameplayConditionRuntime.SynchronizeState(
            character, combat, participant, version, 10, DateTime.UtcNow);
        GameplayConditionSynchronizationResult second = GameplayConditionRuntime.SynchronizeState(
            character, combat, participant, version, 10, DateTime.UtcNow.AddSeconds(1));

        Assert.Equal(MesaCombateParticipanteStatus.ABeiraDaMorte, participant.Status);
        Assert.Contains("A_BEIRA_DA_MORTE", first.Changes);
        Assert.Contains("FADIGA", first.Changes);
        Assert.Contains("DEPENDENCIA_DE_MANA", first.Changes);
        Assert.Equal(2, combat.Condicoes.Count);
        Assert.Equal(75, StatusValue(character, "estaminaMaxima"));
        Assert.True(first.CharacterStateChanged);
        Assert.Empty(second.Changes);
        Assert.False(second.CharacterStateChanged);
    }

    [Fact]
    public void SynchronizeState_AplicaEfeitoImediatoUmaUnicaVezAoAtivarGatilho()
    {
        var character = Character("""{"status":{"vida":20,"vidaMaxima":100,"mana":0,"manaMaxima":50}}""");
        var combat = new MesaCombate { Status = MesaCombateStatus.Ativo };
        var participant = Participant(character, combat);
        var bleeding = new SistemaCondicao
        {
            IdSistemaCondicao = 4,
            Codigo = "SANGRAMENTO_MAGICO",
            Nome = "Sangramento magico",
            Tipo = "Magico",
            CodigoRecurso = "VIDA",
            OperacaoEfeito = "SUBTRAIR",
            ValorEfeito = 5,
            MomentoEfeito = "AO_APLICAR",
            CodigoRecursoGatilho = "MANA",
            OperadorGatilho = "<=",
            ValorGatilho = 0,
        };
        var version = new SistemaVersao
        {
            Condicoes = new[] { bleeding },
            Recursos = new[]
            {
                new SistemaRecursoConfig
                {
                    Codigo = "VIDA",
                    Nome = "Vida",
                    Ativo = true,
                    ValorMinimo = 0,
                },
            },
        };

        GameplayConditionSynchronizationResult first = GameplayConditionRuntime.SynchronizeState(
            character, combat, participant, version, 10, DateTime.UtcNow);
        GameplayConditionSynchronizationResult second = GameplayConditionRuntime.SynchronizeState(
            character, combat, participant, version, 10, DateTime.UtcNow.AddSeconds(1));

        Assert.Contains("SANGRAMENTO_MAGICO", first.Changes);
        Assert.Equal(15, StatusValue(character, "vida"));
        Assert.Single(combat.Condicoes);
        Assert.Empty(second.Changes);
    }

    private static PersonagemJogador Character(string statusJson) => new()
    {
        IdpersonagemJogador = 1,
        Nome = "Teste",
        StatusJson = statusJson,
    };

    private static MesaCombateParticipante Participant(PersonagemJogador character, MesaCombate combat)
    {
        var participant = new MesaCombateParticipante
        {
            NomeSnapshot = character.Nome,
            PersonagemJogador = character,
            Combate = combat,
        };
        combat.Participantes.Add(participant);
        return participant;
    }

    private static SistemaCondicao Rule(int id, string code, decimal reduction, int order) => new()
    {
        IdSistemaCondicao = id,
        Codigo = code,
        Nome = code,
        Tipo = "Fisico",
        CodigoRecurso = "ESTAMINA",
        OperacaoEfeito = "REDUZIR_LIMITE_PERCENTUAL",
        ValorEfeito = reduction,
        Ordem = order,
    };

    private static MesaCondicaoAtiva ActiveCondition(
        SistemaCondicao rule,
        MesaCombateParticipante participant,
        MesaCombate combat) => new()
    {
        IdSistemaCondicao = rule.IdSistemaCondicao,
        CodigoSnapshot = rule.Codigo,
        NomeSnapshot = rule.Nome,
        RegraSnapshotJson = "{}",
        Status = MesaCondicaoStatus.Ativa,
        Participante = participant,
        Combate = combat,
    };

    private static int StatusValue(PersonagemJogador character, string property)
        => JsonNode.Parse(character.StatusJson)!["status"]![property]!.GetValue<int>();
}
