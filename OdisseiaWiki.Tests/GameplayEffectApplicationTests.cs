using System.Text.Json;
using Moq;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services;
using OdisseiaWiki.Services.Interfaces;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class GameplayEffectApplicationTests
{
    [Fact]
    public async Task ApplyEffectAsync_XpProposal_UpdatesCharacterAndCreatesAuditableEvent()
    {
        var fixture = new Fixture(Effect("APLICAR_XP", "XP", "XP", "SOMAR", 3));

        GameplayOperationResult<GameplayCommandResponseDto> result = await fixture.Service.ApplyEffectAsync(
            fixture.Mesa.Idmesa,
            fixture.Session.IdMesaSessao,
            Fixture.PlayerId,
            fixture.Request("APLICAR_XP"));

        Assert.True(result.Sucesso);
        Assert.Equal(5, ReadStatusValue(fixture.Character.StatusJson, "xp"));
        Assert.Equal(1, fixture.Character.RevisaoRuntime);
        Assert.Equal(2, fixture.Session.RevisaoEstado);
        Assert.Equal(5, fixture.Session.UltimaSequenciaEvento);
        Assert.Equal(3, result.Dados!.Aplicacao!.ValorAplicado);
        Assert.Equal(5, result.Dados.Aplicacao.ValorAtual);
        Assert.Equal("EFEITO_APLICADO", result.Dados.Evento!.Tipo);
        fixture.Repository.Verify(repo => repo.AddCommand(It.Is<MesaComando>(command =>
            command.Tipo == "EFEITO_APLICAR" && command.IdPersonagemJogador == fixture.Character.IdpersonagemJogador)), Times.Once);
        fixture.Repository.Verify(repo => repo.AddEvent(It.Is<MesaEvento>(gameplayEvent =>
            gameplayEvent.Tipo == "EFEITO_APLICADO" && gameplayEvent.CodigoRegra == "APLICAR_XP")), Times.Once);
        fixture.Repository.Verify(repo => repo.AddEffectApplication(It.Is<MesaEfeitoAplicado>(application =>
            application.IdMesaSessao == fixture.Session.IdMesaSessao &&
            application.IdEventoOrigem == fixture.SourceEvent.IdMesaEvento &&
            application.IdEventoAplicacao == 101 &&
            application.IdPersonagemAlvo == fixture.Character.IdpersonagemJogador &&
            application.ChaveEfeito == "APLICAR_XP" &&
            application.HashPlano.Length == 64)), Times.Once);
        fixture.Realtime.Verify(notifier => notifier.NotificarMesaAlteradaAsync(
            fixture.Mesa.Idmesa, It.IsAny<CancellationToken>()), Times.Once);
        fixture.Realtime.Verify(notifier => notifier.NotificarPersonagemAlteradoAsync(
            fixture.Mesa.Idmesa, fixture.Character.IdpersonagemJogador, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ApplyEffectAsync_ResourceCost_UsesPublishedLimits()
    {
        var fixture = new Fixture(Effect("APLICAR_CUSTO_VIDA", "RECURSO", "VIDA", "SUBTRAIR", 15));

        GameplayOperationResult<GameplayCommandResponseDto> result = await fixture.Service.ApplyEffectAsync(
            fixture.Mesa.Idmesa,
            fixture.Session.IdMesaSessao,
            Fixture.PlayerId,
            fixture.Request("APLICAR_CUSTO_VIDA"));

        Assert.True(result.Sucesso);
        Assert.Equal(0, ReadStatusValue(fixture.Character.StatusJson, "vida"));
        Assert.Equal(-10, result.Dados!.Aplicacao!.ValorAplicado);
        Assert.Equal(0, result.Dados.Aplicacao.ValorAtual);
    }

    [Fact]
    public async Task ApplyEffectAsync_SameEffectWithAnotherCommandKey_IsNotAppliedTwice()
    {
        var fixture = new Fixture(Effect("APLICAR_XP", "XP", "XP", "SOMAR", 3));
        fixture.Repository.Setup(repo => repo.HasEffectApplicationAsync(
                fixture.Session.IdMesaSessao,
                fixture.SourceEvent.IdMesaEvento,
                "APLICAR_XP",
                fixture.Character.IdpersonagemJogador,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        GameplayOperationResult<GameplayCommandResponseDto> result = await fixture.Service.ApplyEffectAsync(
            fixture.Mesa.Idmesa,
            fixture.Session.IdMesaSessao,
            Fixture.PlayerId,
            fixture.Request("APLICAR_XP"));

        Assert.False(result.Sucesso);
        Assert.Equal("EFEITO_JA_APLICADO", result.Codigo);
        Assert.Equal(2, ReadStatusValue(fixture.Character.StatusJson, "xp"));
        fixture.Repository.Verify(repo => repo.AddCommand(It.IsAny<MesaComando>()), Times.Never);
        fixture.Repository.Verify(repo => repo.AddEvent(It.IsAny<MesaEvento>()), Times.Never);
        fixture.Repository.Verify(repo => repo.AddEffectApplication(It.IsAny<MesaEfeitoAplicado>()), Times.Never);
    }

    [Fact]
    public async Task ApplyEffectAsync_UserCannotApplyAnotherPlayersRoll()
    {
        var fixture = new Fixture(Effect("APLICAR_XP", "XP", "XP", "SOMAR", 3));

        GameplayOperationResult<GameplayCommandResponseDto> result = await fixture.Service.ApplyEffectAsync(
            fixture.Mesa.Idmesa,
            fixture.Session.IdMesaSessao,
            88,
            fixture.Request("APLICAR_XP"));

        Assert.False(result.Sucesso);
        Assert.Equal(GameplayOperationError.Proibido, result.Erro);
        Assert.Equal("EFEITO_SEM_PERMISSAO", result.Codigo);
        fixture.Repository.Verify(repo => repo.GetCharacterForUpdateAsync(
            It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    private static GameplayEffectProposalDto Effect(
        string code,
        string type,
        string resource,
        string operation,
        int value) => new()
    {
        Codigo = code,
        Tipo = type,
        Nome = code,
        Alvo = "AUTOR",
        CodigoRecurso = resource,
        Operacao = operation,
        Valor = value,
    };

    private static int ReadStatusValue(string json, string property)
    {
        using JsonDocument document = JsonDocument.Parse(json);
        JsonElement root = document.RootElement;
        return property == "xp"
            ? root.GetProperty(property).GetInt32()
            : root.GetProperty("status").GetProperty(property).GetInt32();
    }

    private sealed class Fixture
    {
        public const int PlayerId = 12;
        public Mock<IGameplayEngineRepository> Repository { get; } = new();
        public Mock<IMesaRealtimeNotifier> Realtime { get; } = new();
        public PersonagemJogador Character { get; } = new()
        {
            IdpersonagemJogador = 7,
            Idmesa = 3,
            Idusuario = PlayerId,
            StatusJson = """{"xp":2,"status":{"vida":10,"vidaMaxima":10}}""",
            RevisaoRuntime = 0,
        };
        public Mesa Mesa { get; } = new()
        {
            Idmesa = 3,
            IdusuarioCriacao = 99,
            IdMesaSessaoAtiva = 55,
            IdSistemaVersao = 42,
            RevisaoRuntime = 1,
        };
        public MesaSessao Session { get; } = new()
        {
            IdMesaSessao = 55,
            IdMesa = 3,
            IdSistemaVersao = 42,
            Status = MesaSessaoStatus.Ativa,
            RevisaoEstado = 1,
            UltimaSequenciaEvento = 4,
        };
        public SistemaVersao Version { get; } = new()
        {
            IdSistemaVersao = 42,
            SistemaRpg = new SistemaRpg { IdSistemaRpg = 4, Codigo = "ODISSEIA", Nome = "Odisseia" },
            Recursos =
            {
                new SistemaRecursoConfig
                {
                    Codigo = "VIDA",
                    Nome = "Vida",
                    ValorMinimo = 0,
                    ValorMaximo = 100,
                    Ativo = true,
                },
            },
        };
        public MesaEvento SourceEvent { get; }
        public GameplayEngineService Service { get; }

        public Fixture(GameplayEffectProposalDto effect)
        {
            SourceEvent = new MesaEvento
            {
                IdMesaEvento = 90,
                IdMesaSessao = Session.IdMesaSessao,
                Sequencia = 4,
                Tipo = "ROLAGEM_REALIZADA",
                Origem = GameplayEventOrigin.Automatica,
                Visibilidade = GameplayEventVisibility.PublicaMesa,
                IdUsuarioAtor = PlayerId,
                IdPersonagemJogador = Character.IdpersonagemJogador,
                IdSistemaVersaoEfetiva = Version.IdSistemaVersao,
                CodigoRegra = "TESTE",
                DadosJson = JsonSerializer.Serialize(new
                {
                    rolagem = new GameplayRollResultDto
                    {
                        Expressao = "1D6",
                        Total = 3,
                        EfeitosPropostos = new[] { effect },
                    },
                }, new JsonSerializerOptions(JsonSerializerDefaults.Web)),
            };

            Repository.Setup(repo => repo.ExecuteInTransactionAsync(
                    It.IsAny<Func<CancellationToken, Task<GameplayOperationResult<GameplayCommandResponseDto>>>>(),
                    It.IsAny<CancellationToken>()))
                .Returns((Func<CancellationToken, Task<GameplayOperationResult<GameplayCommandResponseDto>>> operation,
                    CancellationToken token) => operation(token));
            Repository.Setup(repo => repo.LockMesaAsync(Mesa.Idmesa, It.IsAny<CancellationToken>()))
                .ReturnsAsync(Mesa);
            Repository.Setup(repo => repo.CanAccessTableAsync(Mesa.Idmesa, It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);
            Repository.Setup(repo => repo.GetCommandAsync(
                    Mesa.Idmesa, It.IsAny<int>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((MesaComando?)null);
            Repository.Setup(repo => repo.LockSessionAsync(Session.IdMesaSessao, It.IsAny<CancellationToken>()))
                .ReturnsAsync(Session);
            Repository.Setup(repo => repo.GetEventAsync(SourceEvent.IdMesaEvento, It.IsAny<CancellationToken>()))
                .ReturnsAsync(SourceEvent);
            Repository.Setup(repo => repo.GetCharacterForUpdateAsync(
                    Character.IdpersonagemJogador, It.IsAny<CancellationToken>()))
                .ReturnsAsync(Character);
            Repository.Setup(repo => repo.HasEffectApplicationAsync(
                    Session.IdMesaSessao,
                    SourceEvent.IdMesaEvento,
                    It.IsAny<string>(),
                    Character.IdpersonagemJogador,
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(false);
            Repository.Setup(repo => repo.GetSystemVersionAsync(Version.IdSistemaVersao, It.IsAny<CancellationToken>()))
                .ReturnsAsync(Version);
            Repository.Setup(repo => repo.SaveChangesAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(1);
            Repository.Setup(repo => repo.AddCommand(It.IsAny<MesaComando>()))
                .Callback<MesaComando>(command => command.IdMesaComando = 100);
            Repository.Setup(repo => repo.AddEvent(It.IsAny<MesaEvento>()))
                .Callback<MesaEvento>(gameplayEvent => gameplayEvent.IdMesaEvento = 101);

            Service = new GameplayEngineService(
                Repository.Object,
                new GameplayRollEvaluator(Mock.Of<IDiceRoller>()),
                new GameplayActionResolver(),
                Mock.Of<IGameplayCursorCodec>(),
                Mock.Of<IGameplayCommandRateLimiter>(),
                Realtime.Object);
        }

        public GameplayEffectApplyRequestDto Request(string effectCode) => new()
        {
            ChaveIdempotencia = Guid.NewGuid(),
            IdEventoOrigem = SourceEvent.IdMesaEvento,
            CodigoEfeito = effectCode,
            RevisaoSessaoEsperada = Session.RevisaoEstado,
            RevisaoPersonagemEsperada = Character.RevisaoRuntime,
        };
    }
}
