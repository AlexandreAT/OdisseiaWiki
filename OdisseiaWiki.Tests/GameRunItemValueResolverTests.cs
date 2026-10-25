using System.Text.Json.Nodes;
using Moq;
using OdisseiaWiki.GameRuns;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class GameRunItemValueResolverTests
{
    private static GameModeVersion Mode(string json = "{}") => new()
        { IdMesa = 3, IdSistemaVersao = 7, ConfiguracaoJson = json };

    [Fact]
    public async Task CompletaCopiasLegadasMochilaProtesesStashERecompensaSemAlterarValoresExplicitos()
    {
        const string snapshot = """
            {"inventario":"{\"itens\":[{\"id\":\"a\",\"idItemBase\":\"espada\",\"valor\":null},{\"id\":\"gratis\",\"idItemBase\":\"espada\",\"valor\":0},{\"id\":\"editada\",\"idItemBase\":\"espada\",\"valor\":25}],\"capacidade\":50}",
             "implantes":[{"id":"b","idItemBase":"espada"}],
             "economy":{"balance":100,"stash":[{"id":"c","idItemBase":"espada"}]},
             "loot":{"rewards":[{"id":"d","idItemBase":"espada"}]}}
            """;
        var catalogue = Catalogue(new Item { Iditem = "espada", Valor = 650 });
        var resolver = new GameRunItemValueResolver(catalogue.Object);
        JsonNode root = JsonNode.Parse(await resolver.ResolveAsync(snapshot, Mode(), default))!;
        Assert.Equal(650, root["inventario"]!["itens"]![0]!["valor"]!.GetValue<decimal>());
        Assert.Equal(0, root["inventario"]!["itens"]![1]!["valor"]!.GetValue<int>());
        Assert.Equal(25, root["inventario"]!["itens"]![2]!["valor"]!.GetValue<int>());
        Assert.Equal(50, root["inventario"]!["capacidade"]!.GetValue<int>());
        Assert.Equal(650, root["implantes"]![0]!["valor"]!.GetValue<decimal>());
        Assert.Equal(650, root["economy"]!["stash"]![0]!["valor"]!.GetValue<decimal>());
        Assert.Equal(650, root["loot"]!["rewards"]![0]!["valor"]!.GetValue<decimal>());
        Assert.Equal(100, root["economy"]!["balance"]!.GetValue<int>());
        Assert.Null(JsonNode.Parse(snapshot)!["implantes"]![0]!["valor"]);
    }

    [Fact]
    public async Task PrecoPublicadoPrevaleceSobreCatalogoSemConsultaExtra()
    {
        var catalogue = new Mock<IGameModeManagementRepository>(MockBehavior.Strict);
        var resolver = new GameRunItemValueResolver(catalogue.Object);
        var mode = Mode("""{"encounters":{"e":{"loot":[{"itemId":"espada","snapshot":{"valor":650}}]}}}""");
        string snapshot = """{"inventario":[{"id":"a","idItemBase":"espada"}]}""";
        JsonNode root = JsonNode.Parse(await resolver.ResolveAsync(snapshot, mode, default))!;
        Assert.Equal(650, root["inventario"]![0]!["valor"]!.GetValue<decimal>());
        catalogue.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task CatalogoEfetivoDaMesaResolveAliasDaCopiaSemBuscarOriginalOuItensOcultos()
    {
        var catalogue = Catalogue(new Item { Iditem = "copia", IdOrigemGlobal = "original", Valor = 200 },
            new Item { Iditem = "oculto", Visivel = false, Valor = 900 });
        string snapshot = """{"inventario":[{"id":"a","idItemBase":"original"},{"id":"b","idItemBase":"oculto"},{"id":"c","nome":"copia"}]}""";
        JsonNode root = JsonNode.Parse(await new GameRunItemValueResolver(catalogue.Object)
            .ResolveAsync(snapshot, Mode(), default))!;
        Assert.Equal(200, root["inventario"]![0]!["valor"]!.GetValue<decimal>());
        Assert.Null(root["inventario"]![1]!["valor"]);
        Assert.Null(root["inventario"]![2]!["valor"]);
        catalogue.Verify(repo => repo.GetLootItemsAsync(3, 7, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ValorHerdadoPermaneceNaCopiaMesmoAposAlterarCatalogo()
    {
        var item = new Item { Iditem = "espada", Valor = 650 };
        var catalogue = Catalogue(item);
        var resolver = new GameRunItemValueResolver(catalogue.Object);
        string snapshot = await resolver.ResolveAsync("""{"inventario":[{"id":"espada"}]}""", Mode(), default);
        item.Valor = 999;
        Assert.Equal(snapshot, await resolver.ResolveAsync(snapshot, Mode(), default));
        catalogue.Verify(repo => repo.GetLootItemsAsync(3, 7, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ItemSemPrecoContinuaZeroELeituraNaoAlteraJsonOriginal()
    {
        const string snapshot = """{"inventario":[{"id":"a","idItemBase":"sem-preco"}]}""";
        var catalogue = Catalogue(new Item { Iditem = "sem-preco", Valor = null });
        string result = await new GameRunItemValueResolver(catalogue.Object).ResolveAsync(snapshot, Mode(), default);
        Assert.Equal(snapshot, result);
        Assert.Equal(0, GameRunEconomy.Sell(result, [new() { ItemId = "a" }], 75, false).Total);
    }

    private static Mock<IGameModeManagementRepository> Catalogue(params Item[] items)
    {
        var mock = new Mock<IGameModeManagementRepository>(MockBehavior.Strict);
        mock.Setup(repo => repo.GetLootItemsAsync(3, 7, It.IsAny<CancellationToken>())).ReturnsAsync(items);
        return mock;
    }
}
