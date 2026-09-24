using Moq;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services;
using OdisseiaWiki.Services.Interfaces;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class GameplayEventPagingTests
{
    [Fact]
    public async Task GetEventsAsync_PrivateRowsAdvanceCursorWithoutLeakingRows()
    {
        var fixture = new Fixture();
        fixture.Repository
            .Setup(repository => repository.GetEventsAfterSequenceAsync(
                11,
                0,
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<MesaEvento>
            {
                Event(1, GameplayEventVisibility.MestreEAutor, actorId: 99),
                Event(2, GameplayEventVisibility.SomenteMestre, actorId: 99),
                Event(3, GameplayEventVisibility.PublicaMesa, actorId: 99),
            });

        GameplayOperationResult<GameplayEventPageDto> result = await fixture.Service.GetEventsAsync(
            7, 11, 12, null, 10);

        Assert.True(result.Sucesso);
        Assert.NotNull(result.Dados);
        GameplayEventDto visible = Assert.Single(result.Dados.Itens);
        Assert.Equal(3, visible.Sequencia);
        Assert.Equal(3, result.Dados.CursorExaminadoAte);
        Assert.Equal("3", result.Dados.ProximoCursor);
        Assert.False(result.Dados.HaMais);
    }

    [Fact]
    public async Task GetEventsAsync_PageWithOnlyPrivateRowsStillMovesToNextUnreadRow()
    {
        var fixture = new Fixture();
        fixture.Repository
            .Setup(repository => repository.GetEventsAfterSequenceAsync(
                11,
                0,
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<MesaEvento>
            {
                Event(1, GameplayEventVisibility.MestreEAutor, actorId: 99),
                Event(2, GameplayEventVisibility.SomenteMestre, actorId: 99),
            });

        GameplayOperationResult<GameplayEventPageDto> result = await fixture.Service.GetEventsAsync(
            7, 11, 12, null, 10);

        Assert.True(result.Sucesso);
        Assert.Empty(result.Dados!.Itens);
        Assert.Equal(2, result.Dados.CursorExaminadoAte);
        Assert.Equal("2", result.Dados.ProximoCursor);
        Assert.False(result.Dados.HaMais);
    }

    [Fact]
    public async Task GetEventsAsync_HiddenCharacterDoesNotBecomeVisibleThroughPublicEvent()
    {
        var fixture = new Fixture();
        fixture.Repository
            .Setup(repository => repository.GetEventsAfterSequenceAsync(
                11,
                0,
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<MesaEvento>
            {
                Event(1, GameplayEventVisibility.PublicaMesa, actorId: 99, characterVisible: false),
                Event(2, GameplayEventVisibility.PublicaMesa, actorId: 99),
            });

        GameplayOperationResult<GameplayEventPageDto> result = await fixture.Service.GetEventsAsync(
            7, 11, 12, null, 10);

        Assert.True(result.Sucesso);
        Assert.Equal(new long[] { 2 }, result.Dados!.Itens.Select(item => item.Sequencia));
        Assert.Equal(2, result.Dados.CursorExaminadoAte);
    }

    private static MesaEvento Event(
        long sequence,
        GameplayEventVisibility visibility,
        int actorId,
        bool? characterVisible = null) => new()
    {
        IdMesaEvento = sequence,
        IdMesaSessao = 11,
        Sequencia = sequence,
        Tipo = "ROLAGEM_REALIZADA",
        Origem = GameplayEventOrigin.Automatica,
        Visibilidade = visibility,
        IdUsuarioAtor = actorId,
        DadosJson = "{}",
        OcorreuEmUtc = DateTime.UtcNow,
        IdPersonagemJogador = characterVisible.HasValue ? 5 : null,
        PersonagemJogador = characterVisible.HasValue
            ? new PersonagemJogador { IdpersonagemJogador = 5, Visivel = characterVisible.Value }
            : null!,
    };

    private sealed class Fixture
    {
        public Mock<IGameplayEngineRepository> Repository { get; } = new();
        public GameplayEngineService Service { get; }

        public Fixture()
        {
            long sequence = 0;
            var cursor = new Mock<IGameplayCursorCodec>();
            cursor.Setup(codec => codec.TryDecode(It.IsAny<string?>(), out sequence)).Returns(true);
            cursor.Setup(codec => codec.Encode(It.IsAny<long>()))
                .Returns((long value) => value.ToString(System.Globalization.CultureInfo.InvariantCulture));
            Repository.Setup(repository => repository.GetMesaAsync(7, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new Mesa { Idmesa = 7, IdusuarioCriacao = 1 });
            Repository.Setup(repository => repository.CanAccessTableAsync(7, 12, It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);
            Repository.Setup(repository => repository.GetSessionAsync(11, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new MesaSessao
                {
                    IdMesaSessao = 11,
                    IdMesa = 7,
                    Status = MesaSessaoStatus.Ativa,
                    UltimaSequenciaEvento = 3,
                });
            Service = new GameplayEngineService(
                Repository.Object,
                new GameplayRollEvaluator(Mock.Of<IDiceRoller>()),
                cursor.Object,
                Mock.Of<IGameplayCommandRateLimiter>(),
                Mock.Of<IMesaRealtimeNotifier>());
        }
    }
}
