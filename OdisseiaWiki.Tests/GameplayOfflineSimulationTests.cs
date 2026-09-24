using Moq;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services;
using OdisseiaWiki.Services.Interfaces;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class GameplayOfflineSimulationTests
{
    [Fact]
    public async Task SimulateAsync_OfflineGenerico_RolaSemPersistir()
    {
        var fixture = new Fixture();
        fixture.Dice.Setup(dice => dice.Roll(1, 6)).Returns(new[] { 4 });

        GameplayOperationResult<GameplaySimulationResponseDto> result = await fixture.Service.SimulateAsync(
            7, 12, Request("TESTE_GENERICO"));

        Assert.True(result.Sucesso);
        Assert.NotNull(result.Dados);
        Assert.True(result.Dados.Simulacao);
        Assert.Equal("SUCESSO", result.Dados.Rolagem.CodigoResultado);
        Assert.Equal(4, result.Dados.Rolagem.Total);
        Assert.Equal(GameplayRollMode.Normal, result.Dados.Rolagem.Modo);
        Assert.Equal(4, result.Dados.Rolagem.Dificuldade?.Alvo);
        Assert.Equal("ROLAGEM_GENERICA", result.Dados.Rolagem.OrigemAcao?.Tipo);
        Assert.Contains(result.Dados.Rolagem.Avisos, notice => notice.Fallback);
        fixture.Repository.Verify(repo => repo.GetSystemVersionAsync(42, It.IsAny<CancellationToken>()), Times.Once);
        fixture.AssertReadOnly();
    }

    [Fact]
    public async Task SimulateAsync_OfflineAtributo_UsaValorDaFichaSemPersistir()
    {
        var fixture = new Fixture();
        fixture.Dice.Setup(dice => dice.Roll(1, 6)).Returns(new[] { 5 });

        GameplayOperationResult<GameplaySimulationResponseDto> result = await fixture.Service.SimulateAsync(
            7, 12, Request("ATRIBUTO_PRINCIPAL", "forca"));

        Assert.True(result.Sucesso);
        Assert.Equal(7, result.Dados!.Rolagem.Total);
        Assert.Equal("SUCESSO", result.Dados.Rolagem.CodigoResultado);
        Assert.Equal(2, result.Dados.Rolagem.Modificador);
        Assert.Equal(7, result.Dados.Rolagem.Dificuldade?.Alvo);
        Assert.Equal("ATRIBUTO", result.Dados.Rolagem.OrigemAcao?.Tipo);
        Assert.Equal(7, result.Dados.Rolagem.OrigemAcao?.IdPersonagemJogador);
        Assert.Equal("2", result.Dados.Rolagem.OrigemAcao?.Valores["valor"]);
        fixture.AssertReadOnly();
    }

    [Fact]
    public async Task SimulateAsync_OfflineXp_CalculaSemConcederOuPersistir()
    {
        var fixture = new Fixture();
        fixture.Version.FontesExperiencia.Add(new SistemaFonteExperiencia
        {
            Codigo = "BOSS",
            Nome = "Boss",
            ValorMinimo = 1,
            ValorMaximo = 4,
            UsaVantagem = false,
        });
        fixture.Dice.Setup(dice => dice.Roll(1, 4)).Returns(new[] { 3 });

        GameplayOperationResult<GameplaySimulationResponseDto> result = await fixture.Service.SimulateAsync(
            7, 12, Request("XP_BOSS"));

        Assert.True(result.Sucesso);
        Assert.Equal(3, result.Dados!.Rolagem.ValorAssociado);
        Assert.Equal("XP_CALCULADO", result.Dados.Rolagem.CodigoResultado);
        Assert.Equal("FONTE_XP", result.Dados.Rolagem.OrigemAcao?.Tipo);
        Assert.Equal("BOSS", result.Dados.Rolagem.OrigemAcao?.Codigo);
        fixture.AssertReadOnly();
    }

    [Fact]
    public async Task SimulateAsync_OutroUsuario_NaoRola()
    {
        var fixture = new Fixture();

        GameplayOperationResult<GameplaySimulationResponseDto> result = await fixture.Service.SimulateAsync(
            7, 13, Request("TESTE_GENERICO"));

        Assert.False(result.Sucesso);
        Assert.Equal(GameplayOperationError.Proibido, result.Erro);
        Assert.Equal("PERSONAGEM_SEM_CONTROLE", result.Codigo);
        fixture.Dice.VerifyNoOtherCalls();
        fixture.Repository.Verify(repo => repo.GetMesaAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
        fixture.AssertReadOnly();
    }

    [Fact]
    public async Task SimulateAsync_SessaoAtiva_ExigeRolagemOficial()
    {
        var fixture = new Fixture();
        fixture.Mesa.IdMesaSessaoAtiva = 55;

        GameplayOperationResult<GameplaySimulationResponseDto> result = await fixture.Service.SimulateAsync(
            7, 12, Request("TESTE_GENERICO"));

        Assert.False(result.Sucesso);
        Assert.Equal("SESSAO_ATIVA", result.Codigo);
        fixture.Dice.VerifyNoOtherCalls();
        fixture.AssertReadOnly();
    }

    [Fact]
    public async Task SimulateAsync_OutroSistema_NaoInventarRegraDeAtributo()
    {
        var fixture = new Fixture();
        fixture.Version.SistemaRpg.Codigo = "OUTRO_SISTEMA";

        GameplayOperationResult<GameplaySimulationResponseDto> result = await fixture.Service.SimulateAsync(
            7, 12, Request("ATRIBUTO_PRINCIPAL", "forca"));

        Assert.False(result.Sucesso);
        Assert.Equal("REGRA_NAO_ESTRUTURADA", result.Codigo);
        fixture.Dice.VerifyNoOtherCalls();
        fixture.AssertReadOnly();
    }

    private static GameplayRollRequestDto Request(string action, string? attribute = null) => new()
    {
        ChaveIdempotencia = Guid.NewGuid(),
        CodigoAcao = action,
        IdPersonagemJogador = 7,
        CodigoAtributo = attribute,
    };

    private sealed class Fixture
    {
        public Mock<IGameplayEngineRepository> Repository { get; } = new();
        public Mock<IDiceRoller> Dice { get; } = new();
        public Mesa Mesa { get; } = new()
        {
            Idmesa = 3,
            Nome = "Mesa de teste",
            IdSistemaVersao = 42,
        };
        public SistemaVersao Version { get; } = new()
        {
            IdSistemaVersao = 42,
            NumeroVersao = "1.0",
            SistemaRpg = new SistemaRpg { Codigo = "ODISSEIA", Nome = "Odisseia" },
        };
        public GameplayEngineService Service { get; }

        public Fixture()
        {
            Repository.Setup(repo => repo.GetCharacterAsync(7, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new PersonagemJogador
                {
                    IdpersonagemJogador = 7,
                    Idmesa = 3,
                    Idusuario = 12,
                    StatusJson = """{"atributos":{"principais":{"forca":2}}}""",
                });
            Repository.Setup(repo => repo.CanAccessTableAsync(3, 12, It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);
            Repository.Setup(repo => repo.GetMesaAsync(3, It.IsAny<CancellationToken>()))
                .ReturnsAsync(Mesa);
            Repository.Setup(repo => repo.GetSystemVersionAsync(42, It.IsAny<CancellationToken>()))
                .ReturnsAsync(Version);

            Service = new GameplayEngineService(
                Repository.Object,
                new GameplayRollEvaluator(Dice.Object),
                Mock.Of<IGameplayCursorCodec>(),
                Mock.Of<IGameplayCommandRateLimiter>(),
                Mock.Of<IMesaRealtimeNotifier>());
        }

        public void AssertReadOnly()
        {
            Repository.Verify(repo => repo.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
            Repository.Verify(repo => repo.AddSession(It.IsAny<MesaSessao>()), Times.Never);
            Repository.Verify(repo => repo.AddCommand(It.IsAny<MesaComando>()), Times.Never);
            Repository.Verify(repo => repo.AddEvent(It.IsAny<MesaEvento>()), Times.Never);
            Repository.Verify(repo => repo.AddRoll(It.IsAny<MesaRolagem>()), Times.Never);
        }
    }
}
