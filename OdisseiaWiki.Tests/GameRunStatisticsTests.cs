using System.Security.Claims;
using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using OdisseiaWiki.Controllers;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.GameRuns;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services;
using OdisseiaWiki.Services.Interfaces;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class GameRunStatisticsTests
{
    [Fact]
    public async Task ContadoresSomamPersonagensIncluemAtivaESeparamAbandonoSemDuplicarConsultas()
    {
        var repository = new Mock<IGameRunStatisticsRepository>(MockBehavior.Strict);
        repository.Setup(repo => repo.GetCountsAsync(7, null, default)).ReturnsAsync(new GameRunStatisticsData([
            new(11, GameRunStatus.Vitoria, 2, 10), new(11, GameRunStatus.Derrota, 3, 11),
            new(11, GameRunStatus.Abandonada, 1, 12), new(12, GameRunStatus.Vitoria, 1, 13), new(12, GameRunStatus.Ativa, 1, 14),
        ], [new(11, "Ada", null), new(12, "Zoe", "/zoe.png")]));
        var service = new GameRunStatisticsService(repository.Object);
        var first = await service.GetAsync(7, null, default);
        Assert.Equal(new GameRunStatisticsCountersDto(8, 3, 3, 1, 1), first.Geral);
        Assert.Equal(4, first.Geral.Perdidas); Assert.Equal(7, first.Geral.Encerradas);
        Assert.Equal(first.Geral.Total, first.Geral.Vencidas + first.Geral.Perdidas + first.Geral.EmAndamento);
        Assert.Equal([11, 12], first.Personagens.Select(character => character.IdPersonagemJogadorOrigem));
        Assert.Equal(first.Geral.Total, first.Personagens.Sum(character => character.Estatisticas.Total));
        Assert.Equal(first.Geral, (await service.GetAsync(7, null, default)).Geral);
    }

    [Fact]
    public async Task FiltroDePersonagemUsaUsuarioAutenticadoEVazioNaoConsultaFichaAlheia()
    {
        var repository = new Mock<IGameRunStatisticsRepository>(MockBehavior.Strict);
        repository.Setup(repo => repo.GetCountsAsync(7, 999, default)).ReturnsAsync(new GameRunStatisticsData([], []));
        var result = await new GameRunStatisticsService(repository.Object).GetAsync(7, 999, default);
        Assert.Equal(0, result.Geral.Total); Assert.Empty(result.Personagens);
        await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() => new GameRunStatisticsService(repository.Object).GetAsync(7, 0, default));
    }

    [Fact]
    public async Task VitoriasTemCursorLimitadoEReproduzemSomentePaginasAutorizadas()
    {
        var repository = new Mock<IGameRunStatisticsRepository>(MockBehavior.Strict);
        var first = Run(); var second = Run(); first.IdGameRun = 20; second.IdGameRun = 18;
        repository.Setup(repo => repo.GetVictoriesAsync(7, 11, 21, 2, default))
            .ReturnsAsync(new GameRunVictoryStatisticsData([first, second], []));
        repository.Setup(repo => repo.GetVictoriesAsync(7, 11, 20, 2, default))
            .ReturnsAsync(new GameRunVictoryStatisticsData([second], []));
        var service = new GameRunStatisticsService(repository.Object);
        var page = await service.GetVictoriesAsync(7, 11, 21, 1, default);
        Assert.Equal(20, Assert.Single(page.Vitorias).IdGameRun); Assert.Equal(20, page.ProximoCursor);
        var next = await service.GetVictoriesAsync(7, 11, page.ProximoCursor, 1, default);
        Assert.Equal(18, Assert.Single(next.Vitorias).IdGameRun); Assert.Null(next.ProximoCursor);
        foreach (int limit in new[] { 0, -1, 26 })
            await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() => service.GetVictoriesAsync(7, 11, null, limit, default));
        await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() => service.GetVictoriesAsync(7, 11, 0, 10, default));
    }

    [Fact]
    public void ResumoDaVitoriaUsaSnapshotsContaMultiplosInimigosMissoesEItensProtegidosSemMutarOrigem()
    {
        var run = Run(); string initial = run.SnapshotInicialJson, current = run.EstadoAtualJson, map = run.MapaJson!;
        var result = GameRunVictoryStatistics.Create(run, [
            new(run.IdGameRun, "player", "player", 10, 50, """[{"nome":"Caçador","imagem":"/a.png"},{"nome":"Caçador"}]""", null),
            new(run.IdGameRun, "player", null, 5, 20, null, """{"nome":"Maga","imagem":"/b.png"}"""),
            new(run.IdGameRun, null, "player", 999, 999, null, """{"nome":"Não derrotado"}"""),
            new(999, "player", "player", 999, 999, null, """{"nome":"Outra run"}"""),
        ]);
        Assert.Equal("Ada antiga", result.NomePersonagem); Assert.Equal(11, result.IdPersonagemJogadorOrigem);
        Assert.Equal("JOGO_PROPRIO", result.CodigoJogo); Assert.Equal("7.1", result.NumeroVersaoSistema);
        Assert.Equal(3600, result.DuracaoSegundos); Assert.Equal(4, result.NivelFinal);
        Assert.Equal(3, result.Combates); Assert.Equal(2, result.CombatesVencidos); Assert.Equal(3, result.InimigosDerrotados);
        Assert.Equal(2, result.Inimigos.Count); Assert.Equal(2, result.Inimigos[0].Quantidade);
        Assert.Equal(70, result.MoedasEmCombates); Assert.Equal(35, result.XpConquistado);
        Assert.Equal(8, result.ItensObtidos); Assert.Equal(40, result.SaldoEventosMissoes); Assert.Equal(200, result.SaldoFinal);
        Assert.Equal(1, result.MissoesConcluidas); Assert.Equal(2, result.FasesPercorridas); Assert.Equal(2, result.NosConcluidos);
        Assert.Equal("Colete", Assert.Single(result.ItensProtegidos).Nome);
        Assert.Equal(initial, run.SnapshotInicialJson); Assert.Equal(current, run.EstadoAtualJson); Assert.Equal(map, run.MapaJson);
    }

    [Fact]
    public void LegadoUsaGanhoDeInventarioSemConfundirTransferenciaComLootNemReaplicarXP()
    {
        var run = Run();
        run.SnapshotInicialJson = """{"inventario":{"itens":[{"id":"arma","quantidade":1}]}}""";
        run.EstadoAtualJson = """{"status":{"xpConquistadoRun":30},"inventario":[{"id":"novo","quantidade":3}],"economy":{"stash":[{"id":"arma","quantidade":1}]},"story":[{"xp":5}]}""";
        var result = GameRunVictoryStatistics.Create(run, [new(run.IdGameRun, "player", "player", 10, 0, null, null)]);
        Assert.Equal(3, result.ItensObtidos); Assert.Equal(30, result.XpConquistado); Assert.Empty(result.ItensProtegidos);
        run.EstadoAtualJson = "{}"; run.MapaJson = null; run.EncerradaEmUtc = null;
        result = GameRunVictoryStatistics.Create(run, []);
        Assert.Null(result.DuracaoSegundos); Assert.Empty(result.Inimigos); Assert.Equal(0, result.XpConquistado);
        run.Status = GameRunStatus.Derrota;
        Assert.Throws<ArgumentException>(() => GameRunVictoryStatistics.Create(run, []));
    }

    [Fact]
    public async Task ControllerExigeIdentidadeENaoAceitaUsuarioAlvoPorParametro()
    {
        Assert.NotNull(Attribute.GetCustomAttribute(typeof(GameRunStatisticsController), typeof(AuthorizeAttribute)));
        var service = new Mock<IGameRunStatisticsService>(MockBehavior.Strict);
        var controller = new GameRunStatisticsController(service.Object) { ControllerContext = new() { HttpContext = new DefaultHttpContext() } };
        Assert.IsType<UnauthorizedResult>(await controller.Get(null, default));
        Assert.IsType<UnauthorizedResult>(await controller.Victories(null, null));
        controller.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, "0")], "Test"));
        Assert.IsType<UnauthorizedResult>(await controller.Get(null, default));
        controller.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, "7")], "Test"));
        service.Setup(item => item.GetAsync(7, 11, default)).ReturnsAsync(new GameRunStatisticsDto(new(0, 0, 0, 0, 0), []));
        Assert.IsType<OkObjectResult>(await controller.Get(11, default));
        service.VerifyAll();
    }

    private static GameRun Run() => new() {
        IdGameRun = 3, IdPersonagemJogadorOrigem = 11, IdGameModeVersion = 7, IdSistemaVersao = 8,
        Status = GameRunStatus.Vitoria, Fase = 2, Seed = 99,
        CriadaEmUtc = new DateTime(2026, 11, 3, 12, 0, 0, DateTimeKind.Utc), EncerradaEmUtc = new DateTime(2026, 11, 3, 13, 0, 0, DateTimeKind.Utc),
        GameModeVersion = new() { Codigo = "JOGO_PROPRIO", Nome = "Mesa própria", NumeroVersao = "2.0" }, SistemaVersao = new() { NumeroVersao = "7.1" },
        SnapshotInicialJson = """{"nome":"Ada antiga","imagem":"/ada.png","inventario":[]}""",
        EstadoAtualJson = """{"nome":"Não ler a ficha real","status":{"nivel":4,"xpConquistadoRun":35,"lootItensObtidos":8},"economy":{"balance":200},"story":[{"type":"MISSAO_CONCLUIDA","xp":20,"currency":40}],"protectedDepositAtEnd":{"items":[{"itemId":"colete","snapshot":{"nome":"Colete","imagem":"/colete.png","quantidade":1}}]}}""",
        MapaJson = """{"nodes":[{"id":"inicio","type":"INICIO","state":"CONCLUIDO","fase":1,"areaName":"Floresta"},{"id":"boss","type":"BOSS","state":"CONCLUIDO","fase":2,"areaName":"Cidade"}],"historicalNodes":[{"id":"inicio","type":"INICIO","state":"CONCLUIDO","fase":1,"areaName":"Floresta"},{"id":"combate","type":"COMBATE","state":"CONCLUIDO","fase":1,"areaName":"Floresta"}]}""",
    };
}
