using System.Text.Json;
using System.Text.Json.Nodes;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.GameRuns;
using OdisseiaWiki.GameRuns.Map;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class GameRunEconomyTests
{
    [Theory]
    [InlineData(0, 90)]
    [InlineData(50, 45)]
    [InlineData(100, 0)]
    public void VendaParcialAplicaDescontoPorUnidadeEPreservaEnvelopeLegado(int discount, int unitPrice)
    {
        const string snapshot = """{"inventario":"{\"itens\":[{\"id\":\"a\",\"nome\":\"Seringa\",\"valor\":90.9,\"quantidade\":5}],\"capacidade\":50}","economy":{"balance":100,"stash":[]}}""";
        GameRunSale sale = GameRunEconomy.Sell(snapshot, [new() { ItemId = "a", Quantity = 3 }], discount, false);
        JsonNode root = JsonNode.Parse(sale.Snapshot)!;
        Assert.Equal(unitPrice * 3, sale.Total);
        Assert.Equal(100 + unitPrice * 3, root["economy"]!["balance"]!.GetValue<int>());
        Assert.Equal(2, root["inventario"]!["itens"]![0]!["quantidade"]!.GetValue<int>());
        Assert.Equal(50, root["inventario"]!["capacidade"]!.GetValue<int>());
        Assert.Empty(sale.RemovedItemIds);
    }

    [Fact]
    public void VendaMultiplasInstanciasIncluiProtesesESemPrecoValeZero()
    {
        const string snapshot = """{"inventario":[{"id":"a","valor":100,"quantidade":2},{"id":"b","quantidade":1}],"implantes":[{"id":"c","valor":50}],"economy":{"balance":0,"stash":[]}}""";
        var sale = GameRunEconomy.Sell(snapshot, [new() { ItemId = "a", Quantity = 2 }, new() { ItemId = "b" }, new() { ItemId = "c" }], 50, false);
        Assert.Equal(125, sale.Total);
        Assert.Equal(3, sale.RemovedItemIds.Count);
        JsonNode root = JsonNode.Parse(sale.Snapshot)!;
        Assert.Empty(root["inventario"]!.AsArray());
        Assert.Empty(root["implantes"]!.AsArray());
    }

    [Fact]
    public void VendaDoStashNaoAceitaItemDaMochilaEPreservaAsDemaisUnidades()
    {
        const string snapshot = """{"inventario":[{"id":"a","valor":100}],"economy":{"balance":0,"stash":[{"id":"b","valor":20,"quantidade":3}]}}""";
        Assert.Throws<InvalidOperationException>(() => GameRunEconomy.Sell(snapshot, [new() { ItemId = "a" }], 0, true));
        var sale = GameRunEconomy.Sell(snapshot, [new() { ItemId = "b", Quantity = 2 }], 0, true);
        JsonNode root = JsonNode.Parse(sale.Snapshot)!;
        Assert.Single(root["inventario"]!.AsArray());
        Assert.Equal(1, root["economy"]!["stash"]![0]!["quantidade"]!.GetValue<int>());
        Assert.Equal(40, sale.Total);
    }

    [Theory]
    [InlineData("null")]
    [InlineData("\"\"")]
    [InlineData("1e-7")]
    public void ValoresOpcionaisOuFracionariosMuitoPequenosRendemZero(string value)
    {
        string snapshot = "{\"inventario\":[{\"id\":\"a\",\"valor\":" + value + "}]}";
        var result = GameRunEconomy.Sell(snapshot, [new() { ItemId = "a" }], 50, false);
        Assert.Equal(0, result.Total);
        Assert.Single(result.RemovedItemIds);
    }

    [Fact]
    public void VendaInvalidaNuncaAplicaParteDaOperacao()
    {
        const string snapshot = """{"inventario":[{"id":"a","valor":100,"quantidade":2}],"economy":{"balance":0,"stash":[]}}""";
        foreach (GameRunVendorSaleLineDto[] lines in new GameRunVendorSaleLineDto[][] {
            [new() { ItemId = "a" }, new() { ItemId = "inexistente" }],
            [new() { ItemId = "a" }, new() { ItemId = "a" }],
            [new() { ItemId = "a", Quantity = 3 }], [new() { ItemId = "a", Quantity = 0 }],
            [new() { ItemId = "a", Quantity = -1 }], [new() { ItemId = "a", Quantity = 1_000_001 }], [] })
            Assert.Throws<InvalidOperationException>(() => GameRunEconomy.Sell(snapshot, lines, 0, false));
        Assert.Equal(2, JsonNode.Parse(snapshot)!["inventario"]![0]!["quantidade"]!.GetValue<int>());
        Assert.Throws<InvalidOperationException>(() => GameRunEconomy.Sell(snapshot, [new() { ItemId = "a" }], 101, false));
        string fullBalance = snapshot.Replace("\"balance\":0", "\"balance\":999999999", StringComparison.Ordinal);
        Assert.Throws<InvalidOperationException>(() => GameRunEconomy.Sell(fullBalance, [new() { ItemId = "a" }], 0, false));
    }

    [Theory]
    [InlineData(3)]
    [InlineData(6)]
    [InlineData(9)]
    public void MercadorPorAreaSorteiaQuantidadeEscolhidaEPreservaAvatar(int offerCount)
    {
        var offers = Enumerable.Range(1, 12).Select(index => new GameModeVendorOfferDto
        {
            ItemId = $"item-{index}", Price = index * 10, Stock = index, Weight = index,
            Snapshot = new JsonObject { ["nome"] = $"Item {index}", ["tipo"] = "outro" },
        }).ToList();
        string config = JsonSerializer.Serialize(new
        {
            map = new { schemaVersion = 5 }, encounters = new { }, areas = new[] {
                new GameModeAreaDto { Code = "A", Name = "Área A", UseBase = false, NodeCount = 3, FinalOption = "ROTA:0",
                    Options = [new() { Type = "VENDEDOR", Label = "Mercador A", Image = "/mercador-a.png", OfferCount = offerCount, Offers = offers }] },
                new GameModeAreaDto { Code = "B", Name = "Área B", UseBase = false, NodeCount = 3, FinalOption = "ROTA:0",
                    Options = [new() { Type = "VENDEDOR", Label = "Mercador B", Image = "/mercador-b.png", OfferCount = 3,
                        Offers = [new() { ItemId = "exclusivo-b", Stock = 10, Snapshot = new() { ["nome"] = "Item B" } }] }] },
            },
        }, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        GameRunMapDto map = new GameRunMapGenerator().Create(100, config);
        Assert.All(map.Nodes.Where(node => node.AreaCode == "A"), node =>
        {
            Assert.Equal("VENDEDOR", node.Type);
            Assert.Equal("/mercador-a.png", node.Image);
            Assert.Equal(offerCount, node.Payload!.Offers!.Count);
            Assert.Equal(offerCount, node.Payload.Offers.Select(offer => offer.ItemId).Distinct().Count());
            Assert.DoesNotContain(node.Payload.Offers, offer => offer.ItemId == "exclusivo-b");
        });
        Assert.All(map.Nodes.Where(node => node.AreaCode == "B"), node =>
            Assert.Equal("exclusivo-b", Assert.Single(node.Payload!.Offers!).ItemId));
    }

    [Fact]
    public void TransferenciaPreservaQuantidadeEEstadoGastoDaDefesaEmInventarioLegado()
    {
        JsonObject original = new()
        {
            ["inventario"] = """{"itens":[{"id":"colete","nome":"Colete","tipo":"traje","quantidade":1,"atributos":{"protecaoBase":300,"__runDefenseRemaining":{"protecao":20,"escudo":0}}}],"capacidade":50}""",
        };
        string snapshot = original.ToJsonString();
        JsonNode stored = JsonNode.Parse(GameRunEconomy.Transfer(snapshot, "colete", true))!;
        Assert.Empty(stored["inventario"]!["itens"]!.AsArray());
        Assert.Equal(50, stored["inventario"]!["capacidade"]!.GetValue<int>());
        Assert.Equal(20, stored["economy"]!["stash"]![0]!["atributos"]!["__runDefenseRemaining"]!["protecao"]!.GetValue<int>());
        JsonNode taken = JsonNode.Parse(GameRunEconomy.Transfer(stored.ToJsonString(), "colete", false))!;
        Assert.Empty(taken["economy"]!["stash"]!.AsArray());
        JsonNode item = Assert.Single(taken["inventario"]!["itens"]!.AsArray())!;
        Assert.Equal("colete", item["id"]!.ToString());
        Assert.Equal(20, item["atributos"]!["__runDefenseRemaining"]!["protecao"]!.GetValue<int>());
        Assert.Equal(snapshot, original.ToJsonString());
    }

    [Fact]
    public void CompraDeProteseVaiAoInventarioCorretoECriaInstanciasIndependentes()
    {
        JsonObject item = JsonNode.Parse("""{"nome":"Braço","tipo":"implante","atributos":{"dano":10}}""")!.AsObject();
        string snapshot = GameRunEconomy.Credit("{}", 100);
        snapshot = GameRunEconomy.Buy(snapshot, item, "braco", 20, false);
        snapshot = GameRunEconomy.Buy(snapshot, item, "braco", 20, false);
        JsonNode root = JsonNode.Parse(snapshot)!;
        Assert.Equal(60, root["economy"]!["balance"]!.GetValue<int>());
        Assert.Equal(2, root["implantes"]!.AsArray().Count);
        Assert.NotEqual(root["implantes"]![0]!["id"]!.ToString(), root["implantes"]![1]!["id"]!.ToString());
        Assert.False(item.ContainsKey("id"));
        Assert.Throws<InvalidOperationException>(() => GameRunEconomy.Buy(snapshot, item, "braco", 61, true));
    }

    [Fact]
    public void DepositoSoEstaDisponivelNoPontoAtualDaBaseOuMercador()
    {
        GameRunMapDto map = new() { Nodes = [
            new() { Id = "inicio", Type = "INICIO", State = "CONCLUIDO", Layer = 0 },
            new() { Id = "base", Type = "BASE", State = "CONCLUIDO", Layer = 1 },
            new() { Id = "combate", Type = "COMBATE", State = "DISPONIVEL", Layer = 2 }] };
        Assert.True(GameRunEconomy.StashEnabled);
        Assert.True(GameRunEconomy.CanAccessStash(map, null));
        map.Nodes[2].State = "SELECIONADO";
        Assert.False(GameRunEconomy.CanAccessStash(map, "combate"));
        map.Nodes[2].State = "CONCLUIDO";
        Assert.False(GameRunEconomy.CanAccessStash(map, null));
        map = new() { Nodes = [.. map.Nodes,
            new() { Id = "mercador", Type = "VENDEDOR", State = "SELECIONADO", Layer = 3 }] };
        Assert.True(GameRunEconomy.CanAccessStash(map, "mercador"));
    }

    [Fact]
    public void OfertasSaoSorteadasPelaSeedSemRepetirENaoCompartilhamEstoque()
    {
        const string config = """
            {"map":{"schemaVersion":5},"encounters":{},"areas":[
              {"code":"A","name":"Mercado","useBase":false,"nodeCount":3,"finalOption":"ROTA:0","options":[
                {"type":"VENDEDOR","label":"Loja","weight":1,"offerCount":1,"offers":[
                  {"itemId":"a","price":10,"stock":2,"weight":1,"snapshot":{"nome":"A","tipo":"outro"}},
                  {"itemId":"b","price":20,"stock":3,"weight":1,"snapshot":{"nome":"B","tipo":"outro"}}]}]}]}
            """;
        GameRunMapDto first = new GameRunMapGenerator().Create(100, config);
        GameRunMapDto same = new GameRunMapGenerator().Create(100, config);
        Assert.Equal(JsonSerializer.Serialize(first), JsonSerializer.Serialize(same));
        Assert.All(first.Nodes.Where(node => node.Type == "VENDEDOR"), node => Assert.Single(node.Payload!.Offers!));
        Assert.Equal(2, Enumerable.Range(1, 20).Select(seed => new GameRunMapGenerator().Create(seed, config)
            .Nodes.First(node => node.Type == "VENDEDOR").Payload!.Offers![0].ItemId).Distinct().Count());
        GameModeVendorOfferDto offer = first.Nodes.First(node => node.Type == "VENDEDOR").Payload!.Offers![0];
        offer.Stock = 0;
        offer.Snapshot!["nome"] = "Alterado";
        Assert.All(same.Nodes.Where(node => node.Type == "VENDEDOR"), node =>
        {
            Assert.True(node.Payload!.Offers![0].Stock > 0);
            Assert.NotEqual("Alterado", node.Payload.Offers[0].Snapshot!["nome"]!.ToString());
        });
    }
}
