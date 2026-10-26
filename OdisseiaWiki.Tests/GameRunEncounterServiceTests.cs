using System.Text.Json;
using System.Text.Json.Nodes;
using Moq;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.GameRuns;
using OdisseiaWiki.GameRuns.Battle;
using OdisseiaWiki.GameRuns.Inventory;
using OdisseiaWiki.GameRuns.Map;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services;
using OdisseiaWiki.Services.Interfaces;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed partial class GameRunEncounterServiceTests
{
    [Fact]
    public async Task LootDePublicacaoSemPrecoHerdaValorDoItemEVendeComDescontoSemMudarSnapshotInicial()
    {
        var catalogue = new Mock<IGameModeManagementRepository>();
        catalogue.Setup(repo => repo.GetLootItemsAsync(It.IsAny<int?>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([new Item { Iditem = "seringa", Valor = 200 }]);
        Fixture fixture = new(new GameRunItemValueResolver(catalogue.Object));
        UseVendorMap(fixture);
        var configuration = JsonNode.Parse(fixture.Run.GameModeVersion.ConfiguracaoJson)!;
        configuration["saleDiscountPercent"] = 75;
        fixture.Run.GameModeVersion.ConfiguracaoJson = configuration.ToJsonString();
        fixture.Run.EstadoAtualJson = GameRunLoot.Prepare(fixture.Run.EstadoAtualJson, "combate",
            new GameBattleEncounterConfig { LootCount = 1, Loot = [new GameLootEntry { ItemId = "seringa",
                Snapshot = new JsonObject { ["nome"] = "Seringa", ["tipo"] = "consumiveis", ["valor"] = null } }] }, 4);
        string initial = fixture.Run.SnapshotInicialJson;
        var claimed = await fixture.Service.ClaimLootAsync(10, 5, Request(0), default);
        Assert.True(claimed.Sucesso, claimed.Mensagem);
        JsonNode reward = Assert.Single(claimed.Dados!.EstadoAtual.Loot!.Rewards)!;
        string id = reward["id"]!.ToString();
        Assert.Equal(200, reward["valor"]!.GetValue<decimal>());
        Assert.Equal(200, JsonNode.Parse(fixture.Run.EstadoAtualJson)!["inventario"]![0]!["valor"]!.GetValue<decimal>());
        await fixture.Service.EnterVendorAsync(10, "vendedor", 5, Request(1), default);
        var request = new GameRunVendorSaleRequestDto { Items = [new() { ItemId = id }],
            RevisaoEsperada = 2, ChaveIdempotencia = Guid.NewGuid() };
        var sold = await fixture.Service.SellVendorItemsAsync(10, 5, request, default);
        Assert.True(sold.Sucesso, sold.Mensagem);
        Assert.Equal(150, sold.Dados!.EstadoAtual.Economy!.Balance);
        Assert.True((await fixture.Service.SellVendorItemsAsync(10, 5, request, default)).Repetido);
        Assert.Equal(initial, fixture.Run.SnapshotInicialJson);
    }

    [Fact]
    public async Task VendaUsaDescontoPublicadoQuantidadeEIdempotenciaSemAlterarFicha()
    {
        Fixture fixture = new();
        UseVendorMap(fixture);
        await fixture.Service.EnterVendorAsync(10, "vendedor", 5, Request(0), default);
        fixture.Run.GameModeVersion.ConfiguracaoJson = Fixture.BranchConfiguration.Replace(
            "\"schemaVersion\":1", "\"saleDiscountPercent\":50,\"schemaVersion\":1", StringComparison.Ordinal);
        JsonObject snapshot = JsonNode.Parse(fixture.Run.EstadoAtualJson)!.AsObject();
        snapshot["inventario"] = JsonNode.Parse("""[{"id":"a","tipo":"consumiveis","valor":90,"quantidade":4,"peso":1,"atributos":{"restaura":{"vida":10}}}]""");
        fixture.Run.EstadoAtualJson = snapshot.ToJsonString();
        fixture.Run.LoadoutJson = GameRunActionLoadout.Serialize([new() { Tipo = "ITEM", IdInstancia = "a" }, new() { Tipo = "DESCANSO", IdInstancia = "descanso" }]);
        var request = new GameRunVendorSaleRequestDto { Items = [new() { ItemId = "a", Quantity = 2 }],
            RevisaoEsperada = 1, ChaveIdempotencia = Guid.NewGuid() };
        var result = await fixture.Service.SellVendorItemsAsync(10, 5, request, default);
        Assert.True(result.Sucesso, result.Mensagem);
        Assert.Equal(190, result.Dados!.EstadoAtual.Economy!.Balance);
        Assert.Equal(2, JsonNode.Parse(fixture.Run.EstadoAtualJson)!["inventario"]![0]!["quantidade"]!.GetValue<int>());
        Assert.Equal(2, GameRunActionLoadout.Read(fixture.Run.LoadoutJson)!.Count);
        Assert.True((await fixture.Service.SellVendorItemsAsync(10, 5, request, default)).Repetido);
        Assert.Equal(2, fixture.Run.Revisao);
        request.Items[0].Quantity = 1;
        Assert.Equal("CHAVE_IDEMPOTENCIA_REUTILIZADA", (await fixture.Service.SellVendorItemsAsync(10, 5, request, default)).Codigo);
        var remaining = await fixture.Service.SellVendorItemsAsync(10, 5, new GameRunVendorSaleRequestDto {
            Items = [new() { ItemId = "a", Quantity = 2 }], RevisaoEsperada = 2, ChaveIdempotencia = Guid.NewGuid() }, default);
        Assert.True(remaining.Sucesso, remaining.Mensagem);
        Assert.Equal(280, remaining.Dados!.EstadoAtual.Economy!.Balance);
        Assert.Empty(JsonNode.Parse(fixture.Run.EstadoAtualJson)!["inventario"]!.AsArray());
        Assert.Equal("DESCANSO", Assert.Single(GameRunActionLoadout.Read(fixture.Run.LoadoutJson)!).Tipo);
        Assert.Empty(JsonNode.Parse(fixture.Run.SnapshotInicialJson)!["inventario"]!.AsArray());
        Assert.Equal(2, GameRunFirstMap.Read(fixture.Run.MapaJson, new(JsonSerializerDefaults.Web))
            .Nodes.Single(node => node.Id == "vendedor").Payload!.Offers![0].Stock);
    }

    [Fact]
    public async Task VendaDeDefesaEquipadaRemoveBonusERecalculaCarga()
    {
        Fixture fixture = new();
        UseVendorMap(fixture);
        await fixture.Service.EnterVendorAsync(10, "vendedor", 5, Request(0), default);
        JsonObject root = JsonNode.Parse(fixture.Run.EstadoAtualJson)!.AsObject();
        root["inventario"] = JsonNode.Parse("""[{"id":"colete","tipo":"traje","peso":70,"valor":100,"atributos":{"protecaoBase":300,"armaduraBase":20}}]""");
        fixture.Run.EstadoAtualJson = GameRunDefensiveEquipment.SetEquipped(root.ToJsonString(), "colete", true);
        var result = await fixture.Service.SellVendorItemsAsync(10, 5, new GameRunVendorSaleRequestDto {
            Items = [new() { ItemId = "colete" }], RevisaoEsperada = 1, ChaveIdempotencia = Guid.NewGuid() }, default);
        Assert.True(result.Sucesso, result.Mensagem);
        root = JsonNode.Parse(fixture.Run.EstadoAtualJson)!.AsObject();
        Assert.Equal(0, root["status"]!["defesas"]!["protecao"]!.GetValue<int>());
        Assert.Equal(0, root["status"]!["defesas"]!["armadura"]!.GetValue<int>());
        Assert.Empty(root["inventario"]!.AsArray());
        Assert.Equal(0, result.Dados!.EstadoAtual.Carga!.Value.GetProperty("pesoAtual").GetDouble());
    }

    [Fact]
    public async Task VendaExigeDonoRevisaoRunAtivaEVendedorAtual()
    {
        Fixture fixture = new();
        UseVendorMap(fixture);
        var request = new GameRunVendorSaleRequestDto { Items = [new() { ItemId = "a" }],
            RevisaoEsperada = 0, ChaveIdempotencia = Guid.NewGuid() };
        Assert.Equal("RUN_NAO_ENCONTRADA", (await fixture.Service.SellVendorItemsAsync(10, 99, request, default)).Codigo);
        Assert.Equal("VENDEDOR_INDISPONIVEL", (await fixture.Service.SellVendorItemsAsync(10, 5, request, default)).Codigo);
        await fixture.Service.EnterVendorAsync(10, "vendedor", 5, Request(0), default);
        Assert.Equal("REVISAO_DESATUALIZADA", (await fixture.Service.SellVendorItemsAsync(10, 5, request, default)).Codigo);
        request.RevisaoEsperada = 1;
        string snapshot = fixture.Run.EstadoAtualJson;
        Assert.Equal("VENDA_INVALIDA", (await fixture.Service.SellVendorItemsAsync(10, 5, request, default)).Codigo);
        Assert.Equal(snapshot, fixture.Run.EstadoAtualJson);
        Assert.Equal(1, fixture.Run.Revisao);
        fixture.Run.Status = GameRunStatus.Vitoria;
        Assert.Equal("RUN_ENCERRADA", (await fixture.Service.SellVendorItemsAsync(10, 5, request, default)).Codigo);
    }

    [Fact]
    public async Task CompraUsaOfertaPublicadaDebitaUmaVezEPreservaEstoqueAoRetomar()
    {
        Fixture fixture = new();
        UseVendorMap(fixture);
        Assert.True((await fixture.Service.EnterVendorAsync(10, "vendedor", 5, Request(0), default)).Sucesso);
        var request = new GameRunVendorPurchaseRequestDto
            { ItemId = "pocao", RevisaoEsperada = 1, ChaveIdempotencia = Guid.NewGuid() };

        var bought = await fixture.Service.BuyVendorItemAsync(10, 5, request, default);
        var repeated = await fixture.Service.BuyVendorItemAsync(10, 5, request, default);

        Assert.True(bought.Sucesso, bought.Mensagem);
        Assert.True(repeated.Repetido);
        Assert.Equal(60, bought.Dados!.EstadoAtual.Economy!.Balance);
        JsonNode snapshot = JsonNode.Parse(fixture.Run.EstadoAtualJson)!;
        JsonNode item = Assert.Single(snapshot["inventario"]!.AsArray())!;
        Assert.Equal("Poção publicada", item["nome"]!.ToString());
        Assert.True(Guid.TryParse(item["id"]!.ToString(), out _));
        Assert.Equal("pocao", item["idItemBase"]!.ToString());
        Assert.Equal(1, GameRunFirstMap.Read(fixture.Run.MapaJson, new(JsonSerializerDefaults.Web))
            .Nodes.Single(node => node.Id == "vendedor").Payload!.Offers![0].Stock);
        Assert.Empty(JsonNode.Parse(fixture.Run.SnapshotInicialJson)!["inventario"]!.AsArray());
        Assert.Equal(2, fixture.Run.Revisao);

        var stale = await fixture.Service.BuyVendorItemAsync(10, 5, new GameRunVendorPurchaseRequestDto
            { ItemId = "pocao", RevisaoEsperada = 1, ChaveIdempotencia = Guid.NewGuid() }, default);
        Assert.Equal("REVISAO_DESATUALIZADA", stale.Codigo);
        request.ToStash = true;
        Assert.Equal("CHAVE_IDEMPOTENCIA_REUTILIZADA",
            (await fixture.Service.BuyVendorItemAsync(10, 5, request, default)).Codigo);
    }

    [Fact]
    public async Task CompraSemSaldoOuEstoqueNaoConsomeMoedaNemEntregaItem()
    {
        Fixture fixture = new();
        UseVendorMap(fixture, price: 101);
        await fixture.Service.EnterVendorAsync(10, "vendedor", 5, Request(0), default);
        string before = fixture.Run.EstadoAtualJson;
        var failed = await fixture.Service.BuyVendorItemAsync(10, 5, new GameRunVendorPurchaseRequestDto
            { ItemId = "pocao", RevisaoEsperada = 1, ChaveIdempotencia = Guid.NewGuid() }, default);
        Assert.Equal("COMPRA_INVALIDA", failed.Codigo);
        Assert.Equal(before, fixture.Run.EstadoAtualJson);
        Assert.Equal(1, fixture.Run.Revisao);

        UseVendorMap(fixture, stock: 0, state: "SELECIONADO");
        fixture.Run.NoAtualId = "vendedor";
        failed = await fixture.Service.BuyVendorItemAsync(10, 5, new GameRunVendorPurchaseRequestDto
            { ItemId = "pocao", RevisaoEsperada = 1, ChaveIdempotencia = Guid.NewGuid() }, default);
        Assert.Equal("ESTOQUE_ESGOTADO", failed.Codigo);
        Assert.Empty(JsonNode.Parse(fixture.Run.EstadoAtualJson)!["inventario"]!.AsArray());
    }

    [Fact]
    public async Task DepositoTransfereNoMercadorSemDuplicarERecusaAcessoDepoisDeAvancar()
    {
        Fixture fixture = new();
        UseVendorMap(fixture);
        await fixture.Service.EnterVendorAsync(10, "vendedor", 5, Request(0), default);
        string initialBefore = fixture.Run.SnapshotInicialJson;
        var bought = await fixture.Service.BuyVendorItemAsync(10, 5, new GameRunVendorPurchaseRequestDto
            { ItemId = "pocao", ToStash = true, RevisaoEsperada = 1, ChaveIdempotencia = Guid.NewGuid() }, default);
        Assert.True(bought.Sucesso, bought.Mensagem);
        string itemId = Assert.Single(bought.Dados!.EstadoAtual.Economy!.Stash)["id"]!.ToString();
        Assert.Empty(JsonNode.Parse(fixture.Run.EstadoAtualJson)!["inventario"]!.AsArray());
        var transfer = new GameRunStashTransferRequestDto
            { ItemId = itemId, RevisaoEsperada = 2, ChaveIdempotencia = Guid.NewGuid() };
        var taken = await fixture.Service.TransferStashItemAsync(10, 5, transfer, default);
        Assert.True(taken.Sucesso, taken.Mensagem);
        Assert.Empty(taken.Dados!.EstadoAtual.Economy!.Stash);
        Assert.True((await fixture.Service.TransferStashItemAsync(10, 5, transfer, default)).Repetido);
        Assert.Single(JsonNode.Parse(fixture.Run.EstadoAtualJson)!["inventario"]!.AsArray());
        fixture.Run.LoadoutJson = GameRunActionLoadout.Serialize([new() { Tipo = "ITEM", IdInstancia = itemId }]);
        var stored = await fixture.Service.TransferStashItemAsync(10, 5, new GameRunStashTransferRequestDto
            { ItemId = itemId, ToStash = true, RevisaoEsperada = 3, ChaveIdempotencia = Guid.NewGuid() }, default);
        Assert.True(stored.Sucesso, stored.Mensagem);
        Assert.Empty(GameRunActionLoadout.Read(fixture.Run.LoadoutJson)!);
        Assert.Equal(itemId, Assert.Single(stored.Dados!.EstadoAtual.Economy!.Stash)["id"]!.ToString());
        Assert.Empty(JsonNode.Parse(fixture.Run.EstadoAtualJson)!["inventario"]!.AsArray());
        await fixture.Service.LeaveVendorAsync(10, 5, Request(4), default);
        Assert.True((await fixture.Service.SelectAsync(10, "lobo", 5, Request(5), default)).Sucesso);
        string before = fixture.Run.EstadoAtualJson;
        var denied = await fixture.Service.TransferStashItemAsync(10, 5, new GameRunStashTransferRequestDto
            { ItemId = itemId, RevisaoEsperada = 6, ChaveIdempotencia = Guid.NewGuid() }, default);
        Assert.Equal("STASH_INDISPONIVEL", denied.Codigo);
        Assert.Equal(before, fixture.Run.EstadoAtualJson);
        Assert.Equal(initialBefore, fixture.Run.SnapshotInicialJson);
        Assert.Equal(6, fixture.Run.Revisao);
    }

    [Theory]
    [InlineData(GameRunStatus.Ativa)]
    [InlineData(GameRunStatus.Vitoria)]
    public async Task BaseFinalPermiteGuardarERetirarMesmoAposVitoriaSemReabrirARun(GameRunStatus status)
    {
        Fixture fixture = new();
        fixture.Run.Status = status;
        fixture.Run.EstadoAtualJson = fixture.Run.EstadoAtualJson.Replace("\"inventario\":[]",
            "\"inventario\":[{\"id\":\"colete\",\"nome\":\"Colete\",\"tipo\":\"outro\",\"quantidade\":1}]");
        fixture.Run.MapaJson = """{"schemaVersion":5,"nodes":[{"id":"base-final","type":"BASE","state":"CONCLUIDO","layer":2},{"id":"inicio-2","type":"INICIO","state":"CONCLUIDO","layer":3}]}""";
        string initial = fixture.Run.SnapshotInicialJson;
        var request = new GameRunStashTransferRequestDto { ItemId = "colete", ToStash = true,
            RevisaoEsperada = 0, ChaveIdempotencia = Guid.NewGuid() };
        var stored = await fixture.Service.TransferStashItemAsync(10, 5, request, default);
        Assert.True(stored.Sucesso, stored.Mensagem);
        Assert.Single(stored.Dados!.EstadoAtual.Economy!.Stash);
        Assert.Empty(stored.Dados.EstadoAtual.Inventario!.Value.EnumerateArray());
        Assert.True((await fixture.Service.TransferStashItemAsync(10, 5, request, default)).Repetido);
        var taken = await fixture.Service.TransferStashItemAsync(10, 5, new() { ItemId = "colete", ToStash = false,
            RevisaoEsperada = 1, ChaveIdempotencia = Guid.NewGuid() }, default);
        Assert.True(taken.Sucesso, taken.Mensagem);
        Assert.Empty(taken.Dados!.EstadoAtual.Economy!.Stash);
        Assert.Single(taken.Dados.EstadoAtual.Inventario!.Value.EnumerateArray());
        Assert.Equal(status, fixture.Run.Status);
        Assert.Equal(initial, fixture.Run.SnapshotInicialJson);
        fixture.Run.Status = GameRunStatus.Derrota;
        Assert.Equal("RUN_ENCERRADA", (await fixture.Service.TransferStashItemAsync(10, 5, new()
            { ItemId = "colete", ToStash = true, RevisaoEsperada = 2, ChaveIdempotencia = Guid.NewGuid() }, default)).Codigo);
    }

    [Fact]
    public async Task VendedorNoFimDeSecretasEncadeadasRetornaAteOMapaNormalEEncerra()
    {
        Fixture fixture = new();
        GameRunMapDto parent = new() { SchemaVersion = 5, Nodes = [
            new() { Id = "inicio", Type = "INICIO", State = "CONCLUIDO", Connections = ["portal1"] },
            new() { Id = "portal1", Type = "AREA_SECRETA", State = "SELECIONADO", Fase = 2, Layer = 1 }] };
        GameRunMapDto first = new() { SchemaVersion = 5, Nodes = [
            new() { Id = "inicio-secreto1", Type = "INICIO", State = "CONCLUIDO", Connections = ["portal2"] },
            new() { Id = "portal2", Type = "AREA_SECRETA", State = "SELECIONADO", Layer = 1 }] };
        GameRunMapDto second = new() { SchemaVersion = 5, Nodes = [
            new() { Id = "inicio-secreto2", Type = "INICIO", State = "CONCLUIDO", Connections = ["vendedor"] },
            new() { Id = "vendedor", Type = "VENDEDOR", State = "SELECIONADO", Layer = 1 }] };
        var nested = GameRunMapGenerator.EnterSecret(GameRunMapGenerator.EnterSecret(parent, first, "portal1"), second, "portal2");
        fixture.Run.MapaJson = JsonSerializer.Serialize(nested, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        fixture.Run.NoAtualId = "vendedor";
        var result = await fixture.Service.LeaveVendorAsync(10, 5, Request(0), default);
        Assert.True(result.Sucesso, result.Mensagem);
        Assert.Equal("Vitoria", result.Dados!.Status);
        Assert.Equal(2, result.Dados.Fase);
        Assert.Null(result.Dados.NoAtualId);
        Assert.Null(result.Dados.Mapa.ParentNodes);
        Assert.Equal("CONCLUIDO", result.Dados.Mapa.Nodes.Single(node => node.Id == "portal1").State);
    }

    private static void UseVendorMap(Fixture fixture, int stock = 2, int price = 40, string state = "DISPONIVEL")
    {
        fixture.Run.EstadoAtualJson = GameRunEconomy.Credit(fixture.Run.SnapshotInicialJson, 100);
        fixture.Run.MapaJson = JsonSerializer.Serialize(new GameRunMapDto
        {
            SchemaVersion = 5,
            Nodes = [
                new() { Id = "inicio", Type = "INICIO", State = "CONCLUIDO", Connections = ["vendedor"] },
                new() { Id = "vendedor", Type = "VENDEDOR", State = state, Layer = 1, Fase = 1,
                    Connections = ["lobo"], Payload = new() { Offers = [new() { ItemId = "pocao", Price = price, Stock = stock,
                        Snapshot = JsonNode.Parse("""{"nome":"Poção publicada","tipo":"consumiveis","peso":1,"valor":90,"atributos":{"recuperacaoVida":10}}""")!.AsObject() }] } },
                new() { Id = "lobo", Type = "COMBATE", State = "BLOQUEADO", Layer = 2, Fase = 1,
                    Payload = new() { EncounterCode = "CACADOR" } },
            ],
        }, new JsonSerializerOptions(JsonSerializerDefaults.Web));
    }

    [Fact]
    public async Task VitoriaComLootPublicadoDeixaRecompensaPendenteNaRun()
    {
        Fixture fixture = new();
        fixture.Version.Modulos.Add(new SistemaModulo { TipoModulo = SistemaModuloTipo.Progressao,
            Habilitado = true, ConfiguracaoJson = """{"dadoLootFaces":6}""" });
        fixture.Run.GameModeVersion.ConfiguracaoJson = Fixture.BranchConfiguration.Replace(
            "\"CACADOR\":{\"mapName\"",
            "\"CACADOR\":{\"lootCount\":1,\"loot\":[{\"itemId\":\"pocao\",\"weight\":1,\"snapshot\":{\"nome\":\"Poção\",\"tipo\":\"consumiveis\"}}],\"mapName\"",
            StringComparison.Ordinal);
        fixture.Run.MapaJson = JsonSerializer.Serialize(new GameRunMapDto
        {
            SchemaVersion = 5,
            Nodes =
            [
                new() { Id = "inicio", Type = "INICIO", State = "CONCLUIDO", Connections = ["cacador"] },
                new() { Id = "cacador", Type = "COMBATE", State = "DISPONIVEL", Layer = 1,
                    Payload = new GameRunMapNodePayloadDto { EncounterCode = "CACADOR" } },
            ],
        });
        Assert.True((await fixture.Service.SelectAsync(10, "cacador", 5, Request(0), CancellationToken.None)).Sucesso);

        var result = await fixture.Service.ResolveAsync(10, 5, Request(1), CancellationToken.None);

        Assert.True(result.Sucesso, result.Mensagem);
        Assert.NotNull(result.Dados!.Run.EstadoAtual.Loot);
        Assert.Null(result.Dados.Run.EstadoAtual.Loot!.Roll);
        Assert.Equal(6, result.Dados.Run.EstadoAtual.Loot.Faces);
        Assert.Equal("cacador", result.Dados.Run.EstadoAtual.Loot.NodeId);
    }

    [Theory]
    [InlineData("COMBATE")]
    [InlineData("CACADA")]
    public async Task VitoriaConcedeXpConfiguradoUmaVezApenasNaRun(string routeType)
    {
        Fixture fixture = new();
        fixture.Run.GameModeVersion.ConfiguracaoJson = Fixture.BranchConfiguration.Replace(
            "\"CACADOR\":{\"mapName\"", "\"CACADOR\":{\"currencyReward\":35,\"xpReward\":7,\"mapName\"",
            StringComparison.Ordinal);
        fixture.Run.MapaJson = JsonSerializer.Serialize(new GameRunMapDto
        {
            SchemaVersion = 5,
            Nodes =
            [
                new() { Id = "inicio", Type = "INICIO", State = "CONCLUIDO", Connections = ["cacador"] },
                new() { Id = "cacador", Type = routeType, State = "DISPONIVEL", Layer = 1,
                    Payload = new GameRunMapNodePayloadDto { EncounterCode = "CACADOR" } },
            ],
        });
        Assert.True((await fixture.Service.SelectAsync(10, "cacador", 5, Request(0), CancellationToken.None)).Sucesso);
        GameRunMutationRequestDto command = Request(1);
        var result = await fixture.Service.ResolveAsync(10, 5, command, CancellationToken.None);
        var repeated = await fixture.Service.ResolveAsync(10, 5, command, CancellationToken.None);

        Assert.True(result.Sucesso, result.Mensagem);
        Assert.True(repeated.Repetido);
        Assert.Equal(7, result.Dados!.Battle.XpConcedido);
        Assert.Equal(35, result.Dados.Battle.MoedaConcedida);
        Assert.Equal(35, result.Dados.Run.EstadoAtual.Economy!.Balance);
        Assert.Equal(7, result.Dados.Run.EstadoAtual.Status.GetProperty("xp").GetInt32());
        Assert.False(result.Dados.Run.SnapshotInicial.Status.TryGetProperty("xp", out _));
        Assert.Equal(7, repeated.Dados!.Run.EstadoAtual.Status.GetProperty("xp").GetInt32());
        Assert.Equal(35, repeated.Dados.Run.EstadoAtual.Economy!.Balance);
    }

    [Fact]
    public async Task VitoriaGravaMarcoUmaVezNaTransacaoSemMudarFichaOriginal()
    {
        Fixture fixture = new();
        fixture.Run.GameModeVersion.Codigo = "JOGO";
        fixture.Run.GameModeVersion.ConfiguracaoJson = Fixture.BranchConfiguration;
        fixture.Repository.Setup(item => item.GetOwnedCharacterAsync(5, 0, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PersonagemJogador());
        GameCharacterMemory? memory = null;
        fixture.Repository.Setup(item => item.AddCharacterMemoryAsync(It.IsAny<GameCharacterMemory>(), It.IsAny<CancellationToken>()))
            .Callback((GameCharacterMemory item, CancellationToken _) => memory = item).Returns(Task.CompletedTask);
        fixture.Run.MapaJson = """{"schemaVersion":5,"nodes":[{"id":"inicio","type":"INICIO","state":"CONCLUIDO","connections":["cacador"]},{"id":"cacador","type":"COMBATE","state":"DISPONIVEL","layer":1,"payload":{"encounterCode":"CACADOR"}}]}""";
        string original = fixture.Run.SnapshotInicialJson;
        await fixture.Service.SelectAsync(10, "cacador", 5, Request(0), default);
        var command = Request(1);
        var result = await fixture.Service.ResolveAsync(10, 5, command, default);
        Assert.True(result.Sucesso, result.Mensagem);
        Assert.NotNull(memory);
        Assert.Equal("Caçador", Assert.Single(GameCharacterMilestones.Read(memory.EstadoJson).DefeatedEnemies).Encounter.Enemy!.Name);
        Assert.True((await fixture.Service.ResolveAsync(10, 5, command, default)).Repetido);
        fixture.Repository.Verify(item => item.AddCharacterMemoryAsync(It.IsAny<GameCharacterMemory>(), It.IsAny<CancellationToken>()), Times.Once);
        Assert.Equal(original, fixture.Run.SnapshotInicialJson);
    }

    [Fact]
    public async Task VitoriaAplicaNivelPelaVersaoPublicadaSemAlterarFichaOriginal()
    {
        Fixture fixture = new();
        fixture.Version.Modulos.Add(new SistemaModulo
        {
            TipoModulo = SistemaModuloTipo.Progressao,
            Habilitado = true,
            ConfiguracaoJson = """{"nivelMaximo":2,"permiteXpExcedente":true}""",
        });
        fixture.Version.Niveis.Add(new SistemaNivel { Nivel = 1, XpParaProximoNivel = 5 });
        fixture.Version.Niveis.Add(new SistemaNivel { Nivel = 2, PontosNivel = 1 });
        fixture.Run.GameModeVersion.ConfiguracaoJson = Fixture.BranchConfiguration.Replace(
            "\"CACADOR\":{\"mapName\"", "\"CACADOR\":{\"xpReward\":7,\"mapName\"",
            StringComparison.Ordinal);
        fixture.Run.MapaJson = JsonSerializer.Serialize(new GameRunMapDto
        {
            SchemaVersion = 5,
            Nodes =
            [
                new() { Id = "inicio", Type = "INICIO", State = "CONCLUIDO", Connections = ["cacador"] },
                new() { Id = "cacador", Type = "COMBATE", State = "DISPONIVEL", Layer = 1,
                    Payload = new GameRunMapNodePayloadDto { EncounterCode = "CACADOR" } },
            ],
        });
        Assert.True((await fixture.Service.SelectAsync(10, "cacador", 5, Request(0), CancellationToken.None)).Sucesso);
        var result = await fixture.Service.ResolveAsync(10, 5, Request(1), CancellationToken.None);

        Assert.True(result.Sucesso, result.Mensagem);
        Assert.Equal(new[] { 2 }, result.Dados!.Battle.NiveisAlcancados);
        Assert.Equal(1, result.Dados.Battle.PontosConcedidos.Gerais);
        Assert.Equal(2, result.Dados.Run.EstadoAtual.Status.GetProperty("nivel").GetInt32());
        Assert.Equal(2, result.Dados.Run.EstadoAtual.Status.GetProperty("xp").GetInt32());
        Assert.Equal(1, result.Dados.Run.EstadoAtual.Status.GetProperty("pontos").GetInt32());
        Assert.False(result.Dados.Run.SnapshotInicial.Status.TryGetProperty("nivel", out _));
    }

    [Fact]
    public async Task DerrotaNaoConcedeXpDoEncontro()
    {
        Fixture fixture = new();
        fixture.Run.GameModeVersion.ConfiguracaoJson = Fixture.BranchConfiguration.Replace(
            "\"CACADOR\":{\"mapName\"", "\"CACADOR\":{\"xpReward\":7,\"mapName\"",
            StringComparison.Ordinal);
        fixture.Run.MapaJson = JsonSerializer.Serialize(new GameRunMapDto
        {
            SchemaVersion = 5,
            Nodes =
            [
                new() { Id = "inicio", Type = "INICIO", State = "CONCLUIDO", Connections = ["cacador"] },
                new() { Id = "cacador", Type = "COMBATE", State = "DISPONIVEL", Layer = 1,
                    Payload = new GameRunMapNodePayloadDto { EncounterCode = "CACADOR" } },
            ],
        });
        fixture.Simulator.Setup(item => item.Simulate(
                It.IsAny<GameBattleInput>(), It.IsAny<IDiceRandomSource>()))
            .Returns(new GameBattleResult("enemy", GameBattleEndReason.ActorDefeated, 1,
            [
                new GameBattleActorState("player", "Ada", 0, 30, 0, 10, 0, 10,
                    new GameBattleDefenses(), []),
                new GameBattleActorState("enemy", "Caçador", 20, 20, 0, 0, 0, 0,
                    new GameBattleDefenses(), []),
            ], []));

        Assert.True((await fixture.Service.SelectAsync(10, "cacador", 5, Request(0), CancellationToken.None)).Sucesso);
        var result = await fixture.Service.ResolveAsync(10, 5, Request(1), CancellationToken.None);

        Assert.True(result.Sucesso, result.Mensagem);
        Assert.Equal(0, result.Dados!.Battle.XpConcedido);
        Assert.False(result.Dados.Run.EstadoAtual.Status.TryGetProperty("xp", out _));
        Assert.Equal(GameRunStatus.Derrota, fixture.Run.Status);
    }

    [Fact]
    public void XpDaRunPreservaDemaisCamposERejeitaValorInvalido()
    {
        string snapshot = """{"status":{"nivel":2,"XP":4,"status":{"vida":20}}}""";
        using JsonDocument updated = JsonDocument.Parse(GameRunXpReward.Apply(snapshot, 6));
        Assert.Equal(10, updated.RootElement.GetProperty("status").GetProperty("XP").GetInt32());
        Assert.Equal(6, updated.RootElement.GetProperty("status").GetProperty("xpConquistadoRun").GetInt32());
        using JsonDocument next = JsonDocument.Parse(GameRunXpReward.Apply(updated.RootElement.GetRawText(), 4));
        Assert.Equal(10, next.RootElement.GetProperty("status").GetProperty("xpConquistadoRun").GetInt32());
        Assert.Equal(2, updated.RootElement.GetProperty("status").GetProperty("nivel").GetInt32());
        Assert.Equal(20, updated.RootElement.GetProperty("status").GetProperty("status")
            .GetProperty("vida").GetInt32());
        Assert.Throws<ArgumentOutOfRangeException>(() => GameRunXpReward.Apply(snapshot, -1));
    }

    [Fact]
    public async Task DescansoMedioUmaVezPorAreaRecuperaSnapshotEArmaProximoCombate()
    {
        Fixture fixture = new();
        fixture.Run.EstadoAtualJson = fixture.Run.EstadoAtualJson.Replace(
            "\"mana\":10,\"manaMaxima\":10", "\"mana\":2,\"manaMaxima\":10");
        var preview = await fixture.Service.GetMediumRestPreviewAsync(10, 5, CancellationToken.None);
        Assert.True(preview!.Disponivel);
        Assert.Equal(8, preview.ManaRecuperada);

        GameRunMutationRequestDto request = Request(0);
        var rested = await fixture.Service.MediumRestAsync(10, 5, request, CancellationToken.None);
        var repeated = await fixture.Service.MediumRestAsync(10, 5, request, CancellationToken.None);
        Assert.True(rested.Sucesso, rested.Mensagem);
        Assert.True(repeated.Repetido);
        Assert.Equal(8, rested.Dados!.ManaRecuperada);
        Assert.True(rested.Dados.Run.Mapa.OpeningOpportunityPending);
        Assert.Equal(10, rested.Dados.Run.SnapshotInicial.Status.GetProperty("status").GetProperty("mana").GetInt32());
        fixture.Run.Fase = 2;
        Assert.False((await fixture.Service.GetMediumRestPreviewAsync(
            10, 5, CancellationToken.None))!.Disponivel);
        fixture.Run.Fase = 1;
        Assert.Equal("DESCANSO_JA_USADO", (await fixture.Service.MediumRestAsync(
            10, 5, Request(1), CancellationToken.None)).Codigo);

        Assert.True((await fixture.Service.SelectAsync(10, "treino-1", 5,
            Request(1), CancellationToken.None)).Sucesso);
        var battle = await fixture.Service.ResolveAsync(10, 5, Request(2), CancellationToken.None);
        Assert.True(battle.Sucesso, battle.Mensagem);
        fixture.Simulator.Verify(item => item.Simulate(
            It.Is<GameBattleInput>(input => input.OpeningOpportunityAttack),
            It.IsAny<IDiceRandomSource>()), Times.Once);
        Assert.False(battle.Dados!.Run.Mapa.OpeningOpportunityPending);
    }

    [Fact]
    public async Task SelecionaEResolveUmaVez_SalvaVidaEHistorico_SemAlterarSnapshotInicial()
    {
        Fixture fixture = new();
        Guid selectionKey = Guid.NewGuid();
        GameRunMutationRequestDto selectRequest = new()
        {
            RevisaoEsperada = 0, ChaveIdempotencia = selectionKey,
        };
        var selected = await fixture.Service.SelectAsync(10, "treino-1", 5, selectRequest, CancellationToken.None);
        var repeatedSelection = await fixture.Service.SelectAsync(10, "treino-1", 5, selectRequest, CancellationToken.None);
        Assert.True(selected.Sucesso, selected.Mensagem);
        Assert.True(repeatedSelection.Repetido);
        Assert.Equal(1, fixture.Run.Revisao);
        Assert.Equal("treino-1", fixture.Run.NoAtualId);

        GameRunMutationRequestDto resolveRequest = new()
        {
            RevisaoEsperada = 1, ChaveIdempotencia = Guid.NewGuid(),
        };
        var resolved = await fixture.Service.ResolveAsync(10, 5, resolveRequest, CancellationToken.None);
        var repeatedResolution = await fixture.Service.ResolveAsync(10, 5, resolveRequest, CancellationToken.None);
        Assert.True(resolved.Sucesso, resolved.Mensagem);
        Assert.True(repeatedResolution.Repetido);
        Assert.Equal(12, resolved.Dados!.Run.EstadoAtual.Status
            .GetProperty("status").GetProperty("vida").GetInt32());
        Assert.Equal(30, resolved.Dados.Run.SnapshotInicial.Status
            .GetProperty("status").GetProperty("vida").GetInt32());
        Assert.Equal("CONCLUIDO", resolved.Dados.Run.Mapa.Nodes.Single(node => node.Id == "treino-1").State);
        Assert.Equal(2, fixture.Run.Revisao);
        Assert.Equal(GameRunStatus.Ativa, fixture.Run.Status);
        GameBattlePreviewDto? saved = await fixture.Service.GetBattleAsync(10, 5, CancellationToken.None);
        Assert.NotNull(saved);
        Assert.Equal(GameBattleEventTypes.BattleStarted, saved.Resultado.Events.Single().Type);
        fixture.Repository.Verify(item => item.AddBattleAsync(
            It.IsAny<GameRunBattle>(), It.IsAny<CancellationToken>()), Times.Once);
        fixture.Simulator.Verify(item => item.Simulate(
            It.IsAny<GameBattleInput>(), It.IsAny<IDiceRandomSource>()), Times.Once);
    }

    [Fact]
    public async Task CombateSalvaCarregadorCheioParaProximoEncontroSemApagarConsumoDoLog()
    {
        Fixture fixture = new();
        fixture.Run.EstadoAtualJson = fixture.Run.EstadoAtualJson.Replace("\"inventario\":[]", """
            "inventario":[{"id":"pistola-1","nome":"Pistola","tipo":"arma","atributos":{
              "municaoAtual":4,"capacidadeMunicao":6,"municaoReserva":12}}]
            """);
        fixture.Simulator.Setup(item => item.Simulate(
                It.IsAny<GameBattleInput>(), It.IsAny<IDiceRandomSource>()))
            .Returns(new GameBattleResult("player", GameBattleEndReason.ActorDefeated, 1,
            [
                new GameBattleActorState("player", "Ada", 20, 30, 10, 10, 10, 10,
                    new GameBattleDefenses(),
                    [new GameBattleActionState("item:pistola-1", 6, 1, 8, 0)]),
                new GameBattleActorState("enemy", "Sentinela", 0, 30, 0, 0, 0, 0,
                    new GameBattleDefenses(), []),
            ], [new GameBattleEvent(1, 1, 1, GameBattleEventTypes.ResourceChanged,
                "player", null, new ResourceChangedPayload("loadedAmmo", 4, 1,
                    "item:pistola-1"))]));

        Assert.True((await fixture.Service.SelectAsync(10, "treino-1", 5,
            Request(0), CancellationToken.None)).Sucesso);
        var resolved = await fixture.Service.ResolveAsync(10, 5, Request(1), CancellationToken.None);

        Assert.True(resolved.Sucesso, resolved.Mensagem);
        JsonElement attributes = resolved.Dados!.Run.EstadoAtual.Inventario!.Value[0]
            .GetProperty("atributos");
        Assert.Equal(6, attributes.GetProperty("municaoAtual").GetInt32());
        Assert.Equal(12, attributes.GetProperty("municaoReserva").GetInt32());
        GameBattlePreviewDto? saved = await fixture.Service.GetBattleAsync(10, 5, CancellationToken.None);
        Assert.NotNull(saved);
        Assert.Equal(GameBattleEventTypes.ResourceChanged, saved.Resultado.Events.Single().Type);
    }

    [Fact]
    public async Task RejeitaRevisaoAntigaEOutroUsuario()
    {
        Fixture fixture = new();
        GameRunMutationRequestDto request = new()
        {
            RevisaoEsperada = 1, ChaveIdempotencia = Guid.NewGuid(),
        };
        Assert.Equal("REVISAO_DESATUALIZADA", (await fixture.Service.SelectAsync(
            10, "treino-1", 5, request, CancellationToken.None)).Codigo);
        request.RevisaoEsperada = 0;
        Assert.Equal("RUN_NAO_ENCONTRADA", (await fixture.Service.SelectAsync(
            10, "treino-1", 6, request, CancellationToken.None)).Codigo);
        Assert.Null(await fixture.Service.GetBattleAsync(10, 6, CancellationToken.None));
    }

    [Fact]
    public async Task OrdemDeArmas_UsaApenasCopiaDaRun_ValidaERepeteSemDuplicar()
    {
        Fixture fixture = new();
        fixture.Run.EstadoAtualJson = fixture.Run.EstadoAtualJson.Replace("\"inventario\":[]", """
            "inventario":[{"id":"espada-1","tipo":"arma"},
                           {"id":"kit","tipo":"consumiveis"},
                           {"id":"espada-2","tipo":"arma"}]
            """);
        string original = fixture.Run.SnapshotInicialJson;
        GameRunWeaponOrderRequestDto request = new()
        {
            RevisaoEsperada = 0, ChaveIdempotencia = Guid.NewGuid(),
            OrdemArmas = ["espada-2", "espada-1"],
        };

        var saved = await fixture.Service.UpdateWeaponOrderAsync(10, 5, request, CancellationToken.None);
        var repeated = await fixture.Service.UpdateWeaponOrderAsync(10, 5, request, CancellationToken.None);

        Assert.True(saved.Sucesso, saved.Mensagem);
        Assert.True(repeated.Repetido);
        Assert.Equal(["espada-2", "espada-1"], saved.Dados!.OrdemArmas);
        Assert.Equal(1, fixture.Run.Revisao);
        Assert.Equal(original, fixture.Run.SnapshotInicialJson);
        Assert.Contains("espada-2", fixture.Run.LoadoutJson);

        var duplicate = await fixture.Service.UpdateWeaponOrderAsync(10, 5, new()
        {
            RevisaoEsperada = 1, ChaveIdempotencia = Guid.NewGuid(),
            OrdemArmas = ["espada-1", "espada-1"],
        }, CancellationToken.None);
        Assert.Equal("ORDEM_ARMAS_INVALIDA", duplicate.Codigo);
        Assert.Equal("RUN_NAO_ENCONTRADA", (await fixture.Service.UpdateWeaponOrderAsync(10, 6,
            new() { RevisaoEsperada = 1, ChaveIdempotencia = Guid.NewGuid(), OrdemArmas = ["espada-1", "espada-2"] },
            CancellationToken.None)).Codigo);
        fixture.Run.NoAtualId = "treino-1";
        Assert.Equal("COMBATE_PENDENTE", (await fixture.Service.UpdateWeaponOrderAsync(10, 5,
            new() { RevisaoEsperada = 1, ChaveIdempotencia = Guid.NewGuid(), OrdemArmas = ["espada-1", "espada-2"] },
            CancellationToken.None)).Codigo);
    }

    [Fact]
    public async Task LoadoutNovoSalvaNaCopiaDaRunSemAlterarFichaOuDuplicarComando()
    {
        Fixture fixture = new();
        fixture.Run.LoadoutJson = GameRunActionLoadout.Serialize([]);
        string original = fixture.Run.SnapshotInicialJson;
        GameRunLoadoutRequestDto request = new()
        {
            RevisaoEsperada = 0, ChaveIdempotencia = Guid.NewGuid(), Acoes = [],
        };

        var saved = await fixture.Service.UpdateLoadoutAsync(10, 5, request, CancellationToken.None);
        var repeated = await fixture.Service.UpdateLoadoutAsync(10, 5, request, CancellationToken.None);

        Assert.True(saved.Sucesso, saved.Mensagem);
        Assert.True(repeated.Repetido);
        Assert.Empty(saved.Dados!.AcoesEquipadas!);
        Assert.Equal(1, fixture.Run.Revisao);
        Assert.Equal(original, fixture.Run.SnapshotInicialJson);
        Assert.Equal("LOADOUT_INVALIDO", (await fixture.Service.UpdateLoadoutAsync(10, 5,
            new GameRunLoadoutRequestDto { RevisaoEsperada = 1, ChaveIdempotencia = Guid.NewGuid(),
                Acoes = [new() { Tipo = "ITEM", IdInstancia = "inexistente" }] },
            CancellationToken.None)).Codigo);
    }

    [Fact]
    public async Task LoadoutAceitaCincoAtaquesMaisDescansoERejeitaSextoAtaque()
    {
        Fixture fixture = new();
        fixture.Version.SistemaRpg = new SistemaRpg { Codigo = "ODISSEIA", Nome = "Odisseia" };
        fixture.Run.LoadoutJson = GameRunActionLoadout.Serialize([]);
        fixture.Run.EstadoAtualJson = fixture.Run.EstadoAtualJson.Replace("\"inventario\":[]", """
            "inventario":[
              {"id":"espada-1","nome":"Espada 1","tipo":"arma","atributos":{"tipoArma":"espada","danoBase":18}},
              {"id":"espada-2","nome":"Espada 2","tipo":"arma","atributos":{"tipoArma":"espada","danoBase":18}},
              {"id":"espada-3","nome":"Espada 3","tipo":"arma","atributos":{"tipoArma":"espada","danoBase":18}},
              {"id":"espada-4","nome":"Espada 4","tipo":"arma","atributos":{"tipoArma":"espada","danoBase":18}},
              {"id":"espada-5","nome":"Espada 5","tipo":"arma","atributos":{"tipoArma":"espada","danoBase":18}},
              {"id":"espada-6","nome":"Espada 6","tipo":"arma","atributos":{"tipoArma":"espada","danoBase":18}}
            ]
            """);
        List<GameRunActionSelectionDto> five = Enumerable.Range(1, 5)
            .Select(index => new GameRunActionSelectionDto
            {
                Tipo = "ITEM", IdInstancia = $"espada-{index}",
            }).ToList();
        five.Insert(2, new GameRunActionSelectionDto
        {
            Tipo = "DESCANSO", IdInstancia = "descanso-simples",
        });

        var saved = await fixture.Service.UpdateLoadoutAsync(10, 5, new()
        {
            RevisaoEsperada = 0, ChaveIdempotencia = Guid.NewGuid(), Acoes = five,
        }, CancellationToken.None);

        Assert.True(saved.Sucesso, saved.Mensagem);
        Assert.Equal(6, saved.Dados!.AcoesEquipadas!.Count);
        Assert.Equal("DESCANSO", saved.Dados.AcoesEquipadas[2].Tipo);
        Assert.Equal(1, fixture.Run.Revisao);

        List<GameRunActionSelectionDto> six = Enumerable.Range(1, 6)
            .Select(index => new GameRunActionSelectionDto
            {
                Tipo = "ITEM", IdInstancia = $"espada-{index}",
            }).ToList();
        var rejected = await fixture.Service.UpdateLoadoutAsync(10, 5, new()
        {
            RevisaoEsperada = 1, ChaveIdempotencia = Guid.NewGuid(), Acoes = six,
        }, CancellationToken.None);

        Assert.Equal("LOADOUT_INVALIDO", rejected.Codigo);
        Assert.Equal(1, fixture.Run.Revisao);
    }

    [Fact]
    public async Task ConsumivelCuraSomenteARunERepeticaoNaoGastaOutraUnidade()
    {
        Fixture fixture = new();
        fixture.Run.EstadoAtualJson = fixture.Run.EstadoAtualJson
            .Replace("\"vida\":30", "\"vida\":10")
            .Replace("\"inventario\":[]", """
                "inventario":[{"id":"kit-1","nome":"Kit de cura","tipo":"consumiveis",
                  "quantidade":2,"atributos":{"restaura":{"vida":25,"mana":0,"estamina":0}}}]
                """);
        string initial = fixture.Run.SnapshotInicialJson;
        GameRunConsumeItemRequestDto request = new()
        {
            RevisaoEsperada = 0, ChaveIdempotencia = Guid.NewGuid(), IdInstancia = "kit-1",
        };

        var consumed = await fixture.Service.ConsumeItemAsync(10, 5, request, CancellationToken.None);
        var repeated = await fixture.Service.ConsumeItemAsync(10, 5, request, CancellationToken.None);

        Assert.True(consumed.Sucesso, consumed.Mensagem);
        Assert.True(repeated.Repetido);
        Assert.Equal(20, consumed.Dados!.VidaRecuperada);
        Assert.Equal(1, consumed.Dados.QuantidadeRestante);
        Assert.Equal(30, consumed.Dados.Run.EstadoAtual.Status.GetProperty("status").GetProperty("vida").GetInt32());
        Assert.Equal(1, consumed.Dados.Run.EstadoAtual.Inventario!.Value[0].GetProperty("quantidade").GetInt32());
        Assert.Equal(initial, fixture.Run.SnapshotInicialJson);
        Assert.Equal(1, fixture.Run.Revisao);
        Assert.Equal("REVISAO_DESATUALIZADA", (await fixture.Service.ConsumeItemAsync(10, 5, new()
        {
            RevisaoEsperada = 0, ChaveIdempotencia = Guid.NewGuid(), IdInstancia = "kit-1",
        }, CancellationToken.None)).Codigo);
        Assert.Equal("RUN_NAO_ENCONTRADA", (await fixture.Service.ConsumeItemAsync(10, 6, new()
        {
            RevisaoEsperada = 1, ChaveIdempotencia = Guid.NewGuid(), IdInstancia = "kit-1",
        }, CancellationToken.None)).Codigo);
        fixture.Run.NoAtualId = "treino-1";
        Assert.Equal("COMBATE_PENDENTE", (await fixture.Service.ConsumeItemAsync(10, 5, new()
        {
            RevisaoEsperada = 1, ChaveIdempotencia = Guid.NewGuid(), IdInstancia = "kit-1",
        }, CancellationToken.None)).Codigo);
    }

    [Theory]
    [InlineData(GameRunStatus.Ativa)]
    [InlineData(GameRunStatus.Vitoria)]
    public async Task LootRecebidoPermiteUsarEEquiparSemDuplicarInclusiveNaVitoria(GameRunStatus status)
    {
        Fixture fixture = new();
        fixture.Run.Status = status;
        var root = JsonNode.Parse(fixture.Run.EstadoAtualJson)!;
        root["status"]!["status"]!["vida"] = 10;
        root["inventario"] = JsonNode.Parse("""[{"id":"cura","nome":"Seringa","tipo":"consumiveis","quantidade":1,"atributos":{"restaura":{"vida":5}}},{"id":"colete","nome":"Colete","tipo":"traje","atributos":{"protecaoBase":50}},{"id":"antigo","tipo":"consumiveis","quantidade":1,"atributos":{"restaura":{"vida":5}}},{"id":"outro-traje","tipo":"traje","atributos":{"protecaoBase":10}}]""");
        root["loot"] = JsonNode.Parse("""{"faces":4,"roll":2,"rewards":[{"id":"cura"},{"id":"colete"}]}""");
        fixture.Run.EstadoAtualJson = root.ToJsonString();
        string original = fixture.Run.SnapshotInicialJson;
        var consume = new GameRunConsumeItemRequestDto { IdInstancia = "cura", Quantidade = 1,
            RevisaoEsperada = 0, ChaveIdempotencia = Guid.NewGuid() };
        var used = await fixture.Service.ConsumeItemAsync(10, 5, consume, default);
        Assert.True(used.Sucesso, used.Mensagem);
        Assert.Equal(5, used.Dados!.VidaRecuperada);
        Assert.Equal(0, used.Dados.QuantidadeRestante);
        Assert.DoesNotContain(used.Dados.Run.EstadoAtual.Inventario!.Value.EnumerateArray(), item => item.GetProperty("id").GetString() == "cura");
        Assert.True((await fixture.Service.ConsumeItemAsync(10, 5, consume, default)).Repetido);
        var equip = new GameRunEquipDefenseRequestDto { Equipado = true, RevisaoEsperada = 1, ChaveIdempotencia = Guid.NewGuid() };
        var equipped = await fixture.Service.EquipDefenseAsync(10, 5, "colete", equip, default);
        Assert.True(equipped.Sucesso, equipped.Mensagem);
        Assert.Equal(50, equipped.Dados!.EstadoAtual.Status.GetProperty("defesas").GetProperty("protecao").GetInt32());
        Assert.True((await fixture.Service.EquipDefenseAsync(10, 5, "colete", equip, default)).Repetido);
        Assert.Equal(status, fixture.Run.Status);
        Assert.Equal(2, fixture.Run.Revisao);
        Assert.Equal(original, fixture.Run.SnapshotInicialJson);
        if (status == GameRunStatus.Vitoria)
        {
            string before = fixture.Run.EstadoAtualJson;
            Assert.Equal("RUN_ENCERRADA", (await fixture.Service.ConsumeItemAsync(10, 5, new()
                { IdInstancia = "antigo", RevisaoEsperada = 2, ChaveIdempotencia = Guid.NewGuid() }, default)).Codigo);
            Assert.Equal("RUN_INDISPONIVEL", (await fixture.Service.EquipDefenseAsync(10, 5, "outro-traje", new()
                { Equipado = true, RevisaoEsperada = 2, ChaveIdempotencia = Guid.NewGuid() }, default)).Codigo);
            Assert.Equal(before, fixture.Run.EstadoAtualJson);
        }
    }

    [Fact]
    public async Task CombateConsomeUtilitarioEquipadoUmaVezEPersisteInventarioDaRun()
    {
        Fixture fixture = new();
        string original = fixture.Run.SnapshotInicialJson;
        fixture.Run.EstadoAtualJson = fixture.Run.EstadoAtualJson.Replace("\"inventario\":[]", """
            "inventario":[{"id":"kit-1","nome":"Kit","tipo":"consumiveis",
              "quantidade":1,"atributos":{"restaura":{"vida":5}}}]
            """);
        fixture.Run.LoadoutJson = GameRunActionLoadout.Serialize(
            [new GameRunActionSelectionDto { Tipo = "ITEM", IdInstancia = "kit-1" }]);
        fixture.Run.GameModeVersion.ConfiguracaoJson = Fixture.BranchConfiguration;
        fixture.Run.MapaJson = JsonSerializer.Serialize(new GameRunMapDto
        {
            SchemaVersion = 5,
            Nodes =
            [
                new() { Id = "inicio", Type = "INICIO", State = "CONCLUIDO", Connections = ["cacador"] },
                new() { Id = "cacador", Type = "COMBATE", State = "DISPONIVEL", Layer = 1,
                    Payload = new GameRunMapNodePayloadDto { EncounterCode = "CACADOR" } },
            ],
        });
        fixture.Simulator.Setup(item => item.Simulate(
                It.IsAny<GameBattleInput>(), It.IsAny<IDiceRandomSource>()))
            .Returns(new GameBattleResult("player", GameBattleEndReason.ActorDefeated, 2,
            [
                new GameBattleActorState("player", "Ada", 20, 30, 10, 10, 10, 10,
                    new GameBattleDefenses(),
                    [new GameBattleActionState("item:kit-1", null, null, null, 0) { RemainingQuantity = 0 }]),
                new GameBattleActorState("enemy", "Caçador", 0, 30, 0, 0, 0, 0,
                    new GameBattleDefenses(), []),
            ], [new GameBattleEvent(1, 1, 1, GameBattleEventTypes.ItemConsumed,
                "player", null, new ItemConsumedPayload("item:kit-1", 0))]));
        Assert.True((await fixture.Service.SelectAsync(10, "cacador", 5, Request(0), CancellationToken.None)).Sucesso);

        var result = await fixture.Service.ResolveAsync(10, 5, Request(1), CancellationToken.None);

        Assert.True(result.Sucesso, result.Mensagem);
        Assert.Empty(result.Dados!.Run.EstadoAtual.Inventario!.Value.EnumerateArray());
        Assert.Empty(Assert.IsAssignableFrom<IReadOnlyList<GameRunActionSelectionDto>>(
            result.Dados.Run.AcoesEquipadas));
        Assert.Empty(Assert.IsAssignableFrom<IReadOnlyList<GameRunActionSelectionDto>>(
            GameRunActionLoadout.Read(fixture.Run.LoadoutJson)));
        Assert.Equal(original, fixture.Run.SnapshotInicialJson);
    }

    [Fact]
    public async Task LoadoutAceitaConsumivelSemTesteComoAcaoOrdenada()
    {
        Fixture fixture = new();
        fixture.Run.EstadoAtualJson = fixture.Run.EstadoAtualJson.Replace("\"inventario\":[]", """
            "inventario":[{"id":"kit-1","nome":"Kit","tipo":"consumiveis",
              "quantidade":2,"atributos":{"restaura":{"vida":5}}}]
            """);
        fixture.Run.LoadoutJson = GameRunActionLoadout.Serialize([]);

        var result = await fixture.Service.UpdateLoadoutAsync(10, 5, new GameRunLoadoutRequestDto
        {
            RevisaoEsperada = 0, ChaveIdempotencia = Guid.NewGuid(),
            Acoes = [new GameRunActionSelectionDto { Tipo = "ITEM", IdInstancia = "kit-1" }],
        }, CancellationToken.None);

        Assert.True(result.Sucesso, result.Mensagem);
        Assert.Equal("kit-1", Assert.Single(result.Dados!.AcoesEquipadas).IdInstancia);
    }

    [Fact]
    public async Task ConsumivelUsaDuasUnidadesEmUmaUnicaRevisaoEDobraOEfeito()
    {
        Fixture fixture = new();
        fixture.Run.EstadoAtualJson = fixture.Run.EstadoAtualJson
            .Replace("\"vida\":30", "\"vida\":10")
            .Replace("\"inventario\":[]", """
                "inventario":[{"id":"kit-1","nome":"Kit","tipo":"consumiveis",
                  "quantidade":2,"atributos":{"restaura":{"vida":5}}}]
                """);

        var result = await fixture.Service.ConsumeItemAsync(10, 5, new()
        {
            RevisaoEsperada = 0,
            ChaveIdempotencia = Guid.NewGuid(),
            IdInstancia = "kit-1",
            Quantidade = 2,
        }, CancellationToken.None);

        Assert.True(result.Sucesso, result.Mensagem);
        Assert.Equal(10, result.Dados!.VidaRecuperada);
        Assert.Equal(0, result.Dados.QuantidadeRestante);
        Assert.Equal(20, result.Dados.Run.EstadoAtual.Status.GetProperty("status").GetProperty("vida").GetInt32());
        Assert.Empty(result.Dados.Run.EstadoAtual.Inventario!.Value.EnumerateArray());
        Assert.Equal(1, fixture.Run.Revisao);
    }

    [Fact]
    public async Task RunAntigaRecebeMapaAtualAntesDoPrimeiroCombateESalvaDuasRotas()
    {
        Fixture fixture = new();
        fixture.Repository.Setup(item => item.GetOrCreateModeVersionAsync(7, "0.3.0", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GameModeVersion
            {
                IdGameModeVersion = 5, IdSistemaVersao = 7,
                NumeroVersao = "0.3.0", ConfiguracaoJson = Fixture.BaseConfiguration,
            });
        GameRunMutationRequestDto upgradeRequest = Request(0);
        var upgraded = await fixture.Service.UpgradeMapAsync(10, 5, upgradeRequest, CancellationToken.None);
        var repeatedUpgrade = await fixture.Service.UpgradeMapAsync(10, 5, upgradeRequest, CancellationToken.None);
        Assert.True(upgraded.Sucesso, upgraded.Mensagem);
        Assert.True(repeatedUpgrade.Repetido);
        Assert.Equal(3, upgraded.Dados!.Mapa.SchemaVersion);
        Assert.Equal(5, upgraded.Dados.Mapa.Nodes.Count);
        Assert.True(upgraded.Dados.Mapa.Nodes.Single(node => node.Id == "base-1").Revealed);
        Assert.Equal("BLOQUEADO", upgraded.Dados.Mapa.Nodes.Single(node => node.Id == "base-1").State);
        Assert.Equal("DISPONIVEL", upgraded.Dados.Mapa.Nodes.Single(node => node.Id == "treino-1").State);
        Assert.Equal(5, fixture.Run.IdGameModeVersion);

        Assert.True((await fixture.Service.SelectAsync(10, "treino-1", 5, Request(1), CancellationToken.None)).Sucesso);
        Assert.True((await fixture.Service.ResolveAsync(10, 5, Request(2), CancellationToken.None)).Sucesso);
        string chosen = upgraded.Dados.Mapa.Nodes.Single(node => node.Id == "rota-esquerda").Id;
        var selected = await fixture.Service.SelectAsync(10, chosen, 5, Request(3), CancellationToken.None);
        Assert.True(selected.Sucesso, selected.Mensagem);
        Assert.Equal("IGNORADO", selected.Dados!.Mapa.Nodes.Single(node => node.Id == "rota-direita").State);
        var resolved = await fixture.Service.ResolveAsync(10, 5, Request(4), CancellationToken.None);
        Assert.True(resolved.Sucesso, resolved.Mensagem);
        Assert.Equal(2, resolved.Dados!.Ordem);
        Assert.Equal(chosen, resolved.Dados.NoId);
        Assert.Equal("DISPONIVEL", resolved.Dados.Run.Mapa.Nodes.Single(node => node.Id == "base-1").State);
        Assert.Equal(2, (await fixture.Service.GetBattlesAsync(10, 5, CancellationToken.None))!.Count);
        Assert.Null(await fixture.Service.GetBattlesAsync(10, 6, CancellationToken.None));
        Assert.Equal("NO_INDISPONIVEL", (await fixture.Service.SelectAsync(
            10, "rota-direita", 5, Request(5), CancellationToken.None)).Codigo);
    }

    [Fact]
    public async Task BaseRecuperaApenasRecursosDaRunUsandoDescansoPublicado()
    {
        Fixture fixture = new();
        UseLegacyBranchMap(fixture);
        fixture.Repository.Setup(item => item.GetOrCreateModeVersionAsync(7, "0.3.0", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GameModeVersion
            {
                IdGameModeVersion = 5, IdSistemaVersao = 7,
                NumeroVersao = "0.3.0", ConfiguracaoJson = Fixture.BaseConfiguration,
            });

        Assert.True((await fixture.Service.SelectAsync(10, "treino-1", 5, Request(0), CancellationToken.None)).Sucesso);
        Assert.True((await fixture.Service.ResolveAsync(10, 5, Request(1), CancellationToken.None)).Sucesso);
        Assert.True((await fixture.Service.SelectAsync(10, "rota-esquerda", 5, Request(2), CancellationToken.None)).Sucesso);
        Assert.True((await fixture.Service.ResolveAsync(10, 5, Request(3), CancellationToken.None)).Sucesso);
        JsonNode legacyMap = JsonNode.Parse(fixture.Run.MapaJson!)!;
        JsonNode legacyRoute = legacyMap["nodes"]!.AsArray().Single(item =>
            item!["id"]!.GetValue<string>() == "rota-esquerda")!;
        legacyRoute["name"] = "Rota preservada";
        legacyRoute["payload"]!["encounterCode"] = "ENCONTRO_ANTIGO";
        fixture.Run.MapaJson = legacyMap.ToJsonString();
        var expanded = await fixture.Service.UpgradeMapAsync(10, 5, Request(4), CancellationToken.None);
        Assert.True(expanded.Sucesso, expanded.Mensagem);
        Assert.Equal(3, expanded.Dados!.Mapa.SchemaVersion);
        Assert.Equal("Rota preservada", expanded.Dados.Mapa.Nodes.Single(item => item.Id == "rota-esquerda").Name);
        Assert.Equal("ENCONTRO_ANTIGO", expanded.Dados.Mapa.Nodes.Single(item => item.Id == "rota-esquerda").Payload?.EncounterCode);
        Assert.Equal("DISPONIVEL", expanded.Dados.Mapa.Nodes.Single(item => item.Id == "base-1").State);
        Assert.Equal("IGNORADO", expanded.Dados.Mapa.Nodes.Single(item => item.Id == "rota-direita").State);
        Assert.Equal(5, fixture.Run.IdGameModeVersion);

        GameRunMutationRequestDto restRequest = Request(5);
        var rested = await fixture.Service.EnterBaseAsync(10, "base-1", 5, restRequest, CancellationToken.None);
        var repeated = await fixture.Service.EnterBaseAsync(10, "base-1", 5, restRequest, CancellationToken.None);
        Assert.True(rested.Sucesso, rested.Mensagem);
        Assert.True(repeated.Repetido);
        Assert.Equal(0, rested.Dados!.VidaRecuperada);
        Assert.Equal(2, rested.Dados.ManaRecuperada);
        Assert.Equal(3, rested.Dados.EstaminaRecuperada);
        Assert.Equal(12, rested.Dados.Run.EstadoAtual.Status.GetProperty("status").GetProperty("vida").GetInt32());
        Assert.Equal(10, rested.Dados.Run.EstadoAtual.Status.GetProperty("status").GetProperty("mana").GetInt32());
        Assert.Equal(10, rested.Dados.Run.EstadoAtual.Status.GetProperty("status").GetProperty("estamina").GetInt32());
        Assert.Equal(30, rested.Dados.Run.SnapshotInicial.Status.GetProperty("status").GetProperty("vida").GetInt32());
        Assert.Equal("CONCLUIDO", rested.Dados.Run.Mapa.Nodes.Single(item => item.Id == "base-1").State);
        Assert.Equal(6, fixture.Run.Revisao);
        Assert.Equal("MAPA_INDISPONIVEL", (await fixture.Service.UpgradeMapAsync(
            10, 5, Request(6), CancellationToken.None)).Codigo);
        Assert.Equal("RUN_NAO_ENCONTRADA", (await fixture.Service.EnterBaseAsync(
            10, "base-1", 6, Request(6), CancellationToken.None)).Codigo);
    }

    [Fact]
    public async Task BaseUsaTipoDaAreaPublicadoSemMudarDescansoDasRunsAntigas()
    {
        Fixture fixture = new();
        UseLegacyBranchMap(fixture);
        JsonNode mode = JsonNode.Parse(Fixture.BaseConfiguration)!;
        mode["areas"] = JsonNode.Parse("""[{"code":"F1","baseRestType":"NORMAL"}]""");
        fixture.Repository.Setup(item => item.GetOrCreateModeVersionAsync(7, "0.3.0", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GameModeVersion
            {
                IdGameModeVersion = 5, IdSistemaVersao = 7,
                NumeroVersao = "0.3.0", ConfiguracaoJson = mode.ToJsonString(),
            });
        Assert.True((await fixture.Service.SelectAsync(10, "treino-1", 5, Request(0), CancellationToken.None)).Sucesso);
        Assert.True((await fixture.Service.ResolveAsync(10, 5, Request(1), CancellationToken.None)).Sucesso);
        Assert.True((await fixture.Service.SelectAsync(10, "rota-esquerda", 5, Request(2), CancellationToken.None)).Sucesso);
        Assert.True((await fixture.Service.ResolveAsync(10, 5, Request(3), CancellationToken.None)).Sucesso);
        Assert.True((await fixture.Service.UpgradeMapAsync(10, 5, Request(4), CancellationToken.None)).Sucesso);
        JsonNode savedMap = JsonNode.Parse(fixture.Run.MapaJson!)!;
        JsonNode baseNode = savedMap["nodes"]!.AsArray().Single(item =>
            item!["id"]!.GetValue<string>() == "base-1")!;
        baseNode["areaCode"] = "F1";
        fixture.Run.MapaJson = savedMap.ToJsonString();
        JsonNode snapshot = JsonNode.Parse(fixture.Run.EstadoAtualJson)!;
        JsonNode resources = snapshot["status"]!["status"]!;
        resources["mana"] = 2;
        resources["manaMaxima"] = 30;
        resources["estamina"] = 3;
        resources["estaminaMaxima"] = 40;
        fixture.Run.EstadoAtualJson = snapshot.ToJsonString();

        var rested = await fixture.Service.EnterBaseAsync(10, "base-1", 5, Request(5), CancellationToken.None);

        Assert.True(rested.Sucesso, rested.Mensagem);
        Assert.Equal(28, rested.Dados!.ManaRecuperada);
        Assert.Equal(37, rested.Dados.EstaminaRecuperada);
    }

    [Theory]
    [InlineData(true, 80, 50)]
    [InlineData(false, 30, 0)]
    public async Task BaseSegueOpcaoPublicadaDeConsertoSemRecriarEscudo(
        bool repairAtBase, int expectedProtection, int expectedRepair)
    {
        Fixture fixture = new();
        UseLegacyBranchMap(fixture);
        JsonNode mode = JsonNode.Parse(Fixture.BaseConfiguration)!;
        mode["repairProtectionAtBase"] = repairAtBase;
        fixture.Repository.Setup(item => item.GetOrCreateModeVersionAsync(7, "0.3.0", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GameModeVersion
            {
                IdGameModeVersion = 5, IdSistemaVersao = 7,
                NumeroVersao = "0.3.0", ConfiguracaoJson = mode.ToJsonString(),
            });
        Assert.True((await fixture.Service.SelectAsync(10, "treino-1", 5, Request(0), CancellationToken.None)).Sucesso);
        Assert.True((await fixture.Service.ResolveAsync(10, 5, Request(1), CancellationToken.None)).Sucesso);
        Assert.True((await fixture.Service.SelectAsync(10, "rota-esquerda", 5, Request(2), CancellationToken.None)).Sucesso);
        Assert.True((await fixture.Service.ResolveAsync(10, 5, Request(3), CancellationToken.None)).Sucesso);
        Assert.True((await fixture.Service.UpgradeMapAsync(10, 5, Request(4), CancellationToken.None)).Sucesso);
        JsonNode snapshot = JsonNode.Parse(fixture.Run.EstadoAtualJson)!;
        snapshot["status"]!["defesas"] = JsonNode.Parse("""{"escudo":0,"protecao":30,"armadura":0}""");
        snapshot["inventario"] = JsonNode.Parse("""
            [{"id":"traje","tipo":"traje","atributos":
              {"escudoBase":100,"protecaoBase":80,"__vistaExplodida":{"equippedSlot":"run-defense"},
               "__runDefenseRemaining":{"escudo":0,"protecao":30}}}]
            """);
        fixture.Run.EstadoAtualJson = snapshot.ToJsonString();

        var rested = await fixture.Service.EnterBaseAsync(10, "base-1", 5, Request(5), CancellationToken.None);

        Assert.True(rested.Sucesso, rested.Mensagem);
        Assert.Equal(expectedRepair, rested.Dados!.ProtecaoReparada);
        JsonElement defenses = rested.Dados.Run.EstadoAtual.Status.GetProperty("defesas");
        Assert.Equal(expectedProtection, defenses.GetProperty("protecao").GetInt32());
        Assert.Equal(0, defenses.GetProperty("escudo").GetInt32());
    }

    [Fact]
    public async Task BaseAceitaSnapshotAntigoSemLimitesDeRecursosSemInventarRecuperacao()
    {
        Fixture fixture = new();
        UseLegacyBranchMap(fixture);
        fixture.Repository.Setup(item => item.GetOrCreateModeVersionAsync(7, "0.3.0", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GameModeVersion
            {
                IdGameModeVersion = 5, IdSistemaVersao = 7,
                NumeroVersao = "0.3.0", ConfiguracaoJson = Fixture.BaseConfiguration,
            });

        Assert.True((await fixture.Service.SelectAsync(10, "treino-1", 5, Request(0), CancellationToken.None)).Sucesso);
        Assert.True((await fixture.Service.ResolveAsync(10, 5, Request(1), CancellationToken.None)).Sucesso);
        Assert.True((await fixture.Service.SelectAsync(10, "rota-esquerda", 5, Request(2), CancellationToken.None)).Sucesso);
        Assert.True((await fixture.Service.ResolveAsync(10, 5, Request(3), CancellationToken.None)).Sucesso);
        Assert.True((await fixture.Service.UpgradeMapAsync(10, 5, Request(4), CancellationToken.None)).Sucesso);
        JsonNode legacy = JsonNode.Parse(fixture.Run.EstadoAtualJson)!;
        JsonObject resources = legacy["status"]!["status"]!.AsObject();
        resources.Remove("vidaMaxima");
        resources.Remove("manaMaxima");
        resources.Remove("estaminaMaxima");
        fixture.Run.EstadoAtualJson = legacy.ToJsonString();

        var rested = await fixture.Service.EnterBaseAsync(10, "base-1", 5, Request(5), CancellationToken.None);
        Assert.True(rested.Sucesso, rested.Mensagem);
        Assert.Equal(0, rested.Dados!.VidaRecuperada);
        Assert.Equal(0, rested.Dados.ManaRecuperada);
        Assert.Equal(0, rested.Dados.EstaminaRecuperada);
        Assert.Equal("CONCLUIDO", rested.Dados.Run.Mapa.Nodes.Single(item => item.Id == "base-1").State);
    }

    [Fact]
    public async Task EventoNarrativoConcluiRotaSemAlterarRecursosDaRun()
    {
        Fixture fixture = new();
        const string configuration = """
            {"map":{"schemaVersion":4},"encounters":{"A":{"mapName":"Inimigo"}},
             "areas":[{"code":"F1","name":"Área","baseName":"Base","options":[
               {"type":"EVENTO","label":"Descoberta","description":"Uma pista.","weight":1},
               {"type":"COMBATE","encounterCode":"A","weight":1}]}]}
            """;
        fixture.Run.GameModeVersion.ConfiguracaoJson = configuration;
        fixture.Run.MapaJson = JsonSerializer.Serialize(new GameRunMapGenerator().Create(10, configuration),
            new JsonSerializerOptions(JsonSerializerDefaults.Web));
        string before = fixture.Run.EstadoAtualJson;
        string eventId = GameRunFirstMap.Read(fixture.Run.MapaJson!, new JsonSerializerOptions(JsonSerializerDefaults.Web))
            .Nodes.Single(node => node.Type == "EVENTO").Id;
        GameRunMutationRequestDto request = Request(0);

        var resolved = await fixture.Service.EnterBaseAsync(10, eventId, 5, request, CancellationToken.None);
        var repeated = await fixture.Service.EnterBaseAsync(10, eventId, 5, request, CancellationToken.None);

        Assert.True(resolved.Sucesso, resolved.Mensagem);
        Assert.True(repeated.Repetido);
        Assert.Equal("EVENTO", resolved.Dados!.Tipo);
        Assert.Equal(before, fixture.Run.EstadoAtualJson);
        Assert.Equal("CONCLUIDO", resolved.Dados.Run.Mapa.Nodes.Single(node => node.Id == eventId).State);
    }

    [Fact]
    public async Task PassagemSecretaAbreMapaIsoladoSemPerderMapaPrincipal()
    {
        Fixture fixture = new();
        fixture.Run.GameModeVersion.ConfiguracaoJson = """
            {"map":{"schemaVersion":5},"encounters":{},"areas":[
              {"code":"PRINCIPAL","name":"Floresta","baseName":"Base",
               "options":[{"type":"AREA_SECRETA","label":"Passagem","secretAreaCode":"GRUTA"}]},
              {"code":"GRUTA","name":"Gruta","isSecret":true,"baseName":"Base",
               "finalOption":"ROTA:0","options":[{"type":"EVENTO","label":"Saída"}]}]}
            """;
        fixture.Run.Seed = 14;
        fixture.Run.MapaJson = JsonSerializer.Serialize(new GameRunMapDto
        {
            SchemaVersion = 5,
            Nodes =
            [
                new() { Id = "inicio", Type = "INICIO", Fase = 1, Layer = 0,
                    State = "CONCLUIDO", Connections = ["portal"] },
                new() { Id = "portal", Type = "AREA_SECRETA", Fase = 1, Layer = 1,
                    State = "DISPONIVEL", Connections = ["depois"],
                    Payload = new GameRunMapNodePayloadDto { SecretAreaCode = "GRUTA" } },
                new() { Id = "depois", Type = "EVENTO", Fase = 1, Layer = 2,
                    State = "BLOQUEADO" },
            ],
        });

        var entered = await fixture.Service.EnterBaseAsync(10, "portal", 5, Request(0), CancellationToken.None);
        Assert.True(entered.Sucesso, entered.Mensagem);
        Assert.Equal("AREA_SECRETA", entered.Dados!.Tipo);
        Assert.Equal(19, entered.Dados.Run.Mapa.Nodes.Count);
        Assert.Contains(entered.Dados.Run.Mapa.ParentNodes!, node => node.Id == "portal" && node.State == "SELECIONADO");
        Assert.DoesNotContain(entered.Dados.Run.Mapa.Nodes, node => node.Id == "depois");
    }

    [Fact]
    public async Task SairDaAreaSecretaRestauraCaminhoEFinalSemChefeDaVitoria()
    {
        Fixture fixture = new();
        GameRunMapDto parent = new()
        {
            SchemaVersion = 5,
            Nodes =
            [
                new() { Id = "inicio", Type = "INICIO", Fase = 1, Layer = 0,
                    State = "CONCLUIDO", Connections = ["portal"] },
                new() { Id = "portal", Type = "AREA_SECRETA", Fase = 1, Layer = 1,
                    State = "SELECIONADO", Connections = ["fim"] },
                new() { Id = "fim", Type = "EVENTO", Fase = 1, Layer = 2,
                    State = "BLOQUEADO" },
            ],
        };
        fixture.Run.MapaJson = JsonSerializer.Serialize(new GameRunMapDto
        {
            SchemaVersion = 5, ParentNodes = parent.Nodes, SecretReturnNodeId = "portal",
            Nodes =
            [
                new() { Id = "secreta-inicio", Type = "INICIO", Fase = 1, Layer = 0,
                    State = "CONCLUIDO", Connections = ["secreta-fim"] },
                new() { Id = "secreta-fim", Type = "EVENTO", Fase = 1, Layer = 1,
                    State = "DISPONIVEL" },
            ],
        });

        var returned = await fixture.Service.EnterBaseAsync(10, "secreta-fim", 5, Request(0), CancellationToken.None);
        Assert.True(returned.Sucesso, returned.Mensagem);
        Assert.Null(returned.Dados!.Run.Mapa.ParentNodes);
        Assert.Equal("CONCLUIDO", returned.Dados.Run.Mapa.Nodes.Single(node => node.Id == "portal").State);
        Assert.Equal("DISPONIVEL", returned.Dados.Run.Mapa.Nodes.Single(node => node.Id == "fim").State);
        Assert.Equal(GameRunStatus.Ativa, fixture.Run.Status);

        var victory = await fixture.Service.EnterBaseAsync(10, "fim", 5, Request(1), CancellationToken.None);
        Assert.True(victory.Sucesso, victory.Mensagem);
        Assert.Equal(GameRunStatus.Vitoria, fixture.Run.Status);
    }

    [Fact]
    public async Task FinalAlternativoSecretoEncerraRunSemVoltarAoMapaPrincipal()
    {
        Fixture fixture = new();
        fixture.Run.MapaJson = JsonSerializer.Serialize(new GameRunMapDto
        {
            SchemaVersion = 5, IsSecretFinal = true, SecretReturnNodeId = "portal",
            ParentNodes =
            [
                new() { Id = "inicio", Type = "INICIO", State = "CONCLUIDO", Connections = ["portal"] },
                new() { Id = "portal", Type = "AREA_SECRETA", Layer = 1,
                    State = "SELECIONADO", Connections = ["fim-principal"] },
                new() { Id = "fim-principal", Type = "EVENTO", Layer = 2, State = "BLOQUEADO" },
            ],
            Nodes =
            [
                new() { Id = "secreta-inicio", Type = "INICIO", State = "CONCLUIDO", Connections = ["secreta-fim"] },
                new() { Id = "secreta-fim", Type = "EVENTO", Layer = 1, State = "DISPONIVEL" },
            ],
        });
        var ended = await fixture.Service.EnterBaseAsync(10, "secreta-fim", 5, Request(0), CancellationToken.None);
        Assert.True(ended.Sucesso, ended.Mensagem);
        Assert.Equal(GameRunStatus.Vitoria, fixture.Run.Status);
        Assert.Equal("CONCLUIDO", ended.Dados!.Run.Mapa.Nodes.Single(node => node.Id == "secreta-fim").State);
        Assert.NotNull(ended.Dados.Run.Mapa.ParentNodes);
    }

    [Fact]
    public async Task PassagemDentroDeAreaSecretaAbreOutraAreaSemPerderOsDoisRetornos()
    {
        Fixture fixture = new();
        fixture.Run.GameModeVersion.ConfiguracaoJson = """
            {"map":{"schemaVersion":5},"encounters":{},"areas":[
              {"code":"PRINCIPAL","name":"Floresta","options":[{"type":"AREA_SECRETA","label":"Entrada","secretAreaCode":"S1"}]},
              {"code":"S1","name":"Gruta","isSecret":true,"options":[{"type":"AREA_SECRETA","label":"Fenda","secretAreaCode":"S2"}]},
              {"code":"S2","name":"Núcleo","isSecret":true,"isSecretFinal":true,
               "options":[{"type":"EVENTO","label":"Final"}]}]}
            """;
        GameRunMapDto main = new() { SchemaVersion = 5, Nodes =
        [
            new() { Id = "inicio", Type = "INICIO", State = "CONCLUIDO", Connections = ["portal-1"] },
            new() { Id = "portal-1", Type = "AREA_SECRETA", Layer = 1, State = "SELECIONADO" },
        ] };
        fixture.Run.MapaJson = JsonSerializer.Serialize(new GameRunMapDto
        {
            SchemaVersion = 5, ParentNodes = main.Nodes, ParentMap = main,
            SecretReturnNodeId = "portal-1",
            Nodes =
            [
                new() { Id = "secret-inicio", Type = "INICIO", State = "CONCLUIDO", Connections = ["portal-2"] },
                new() { Id = "portal-2", Type = "AREA_SECRETA", Layer = 1, State = "DISPONIVEL",
                    Payload = new GameRunMapNodePayloadDto { SecretAreaCode = "S2" } },
            ],
        });
        var entered = await fixture.Service.EnterBaseAsync(10, "portal-2", 5, Request(0), CancellationToken.None);
        Assert.True(entered.Sucesso, entered.Mensagem);
        Assert.True(entered.Dados!.Run.Mapa.IsSecretFinal);
        Assert.Equal("portal-2", entered.Dados.Run.Mapa.SecretReturnNodeId);
        Assert.Equal("portal-1", entered.Dados.Run.Mapa.ParentMap?.SecretReturnNodeId);
        Assert.NotNull(entered.Dados.Run.Mapa.ParentMap?.ParentMap);
    }

    [Fact]
    public async Task ChefeIntermediarioNaoEncerraRunEContinuaParaProximoNo()
    {
        Fixture fixture = new();
        fixture.Run.MapaJson = JsonSerializer.Serialize(new GameRunMapDto
        {
            SchemaVersion = 5,
            Nodes =
            [
                new() { Id = "inicio", Type = "INICIO", Fase = 1, Layer = 0,
                    State = "CONCLUIDO", Connections = ["chefe"] },
                new() { Id = "chefe", Type = "BOSS", Fase = 1, Layer = 1,
                    State = "DISPONIVEL", Connections = ["fim"] },
                new() { Id = "fim", Type = "EVENTO", Fase = 1, Layer = 2,
                    State = "BLOQUEADO" },
            ],
        });

        Assert.True((await fixture.Service.SelectAsync(10, "chefe", 5, Request(0), CancellationToken.None)).Sucesso);
        var resolved = await fixture.Service.ResolveAsync(10, 5, Request(1), CancellationToken.None);

        Assert.True(resolved.Sucesso, resolved.Mensagem);
        Assert.Equal(GameRunStatus.Ativa, fixture.Run.Status);
        Assert.Equal("CONCLUIDO", resolved.Dados!.Run.Mapa.Nodes.Single(node => node.Id == "chefe").State);
        Assert.Equal("DISPONIVEL", resolved.Dados.Run.Mapa.Nodes.Single(node => node.Id == "fim").State);
    }

    private static GameRunMutationRequestDto Request(long revision) => new()
    {
        RevisaoEsperada = revision, ChaveIdempotencia = Guid.NewGuid(),
    };

    private static void UseLegacyBranchMap(Fixture fixture)
    {
        fixture.Run.GameModeVersion.ConfiguracaoJson = Fixture.BranchConfiguration;
        fixture.Run.MapaJson = JsonSerializer.Serialize(
            new GameRunMapGenerator().Create(10, Fixture.BranchConfiguration),
            new JsonSerializerOptions(JsonSerializerDefaults.Web));
    }

    [Fact]
    public async Task LootPendenteBloqueiaNovaRotaEEntregaUmaVezMesmoAposVitoriaFinal()
    {
        Fixture fixture = new();
        fixture.Run.MapaJson = JsonSerializer.Serialize(new GameRunMapDto { SchemaVersion = 5 });
        fixture.Run.Status = GameRunStatus.Vitoria;
        fixture.Run.EstadoAtualJson = GameRunLoot.Prepare(fixture.Run.EstadoAtualJson, "final",
            new GameBattleEncounterConfig { LootCount = 1, Loot = [new GameLootEntry
            {
                ItemId = "ITEM_1", Weight = 1,
                Snapshot = new JsonObject { ["nome"] = "Espada", ["tipo"] = "arma" },
            }] }, 6);
        GameRunMutationRequestDto request = Request(0);
        var awarded = await fixture.Service.ClaimLootAsync(10, 5, request, CancellationToken.None);
        var repeated = await fixture.Service.ClaimLootAsync(10, 5, request, CancellationToken.None);
        Assert.True(awarded.Sucesso, awarded.Mensagem);
        Assert.True(repeated.Repetido);
        Assert.Equal(1, fixture.Run.Revisao);
        Assert.Single(awarded.Dados!.EstadoAtual.Loot!.Rewards);
        Assert.Single(repeated.Dados!.EstadoAtual.Loot!.Rewards);
        Assert.Equal("Espada", awarded.Dados.EstadoAtual.Inventario!.Value[0].GetProperty("nome").GetString());
        Assert.False((await fixture.Service.ClaimLootAsync(10, 5, Request(0), CancellationToken.None)).Sucesso);
    }

    [Theory]
    [InlineData(GameBattleEndReason.NoDamage)]
    [InlineData(GameBattleEndReason.EventLimit)]
    public async Task CombateInconclusivoPreservaRunSemRecompensasEPermiteNovaTentativa(GameBattleEndReason reason)
    {
        Fixture fixture = new();
        fixture.Run.GameModeVersion.ConfiguracaoJson = Fixture.BranchConfiguration.Replace(
            "\"CACADOR\":{\"mapName\"", "\"CACADOR\":{\"xpReward\":7,\"currencyReward\":100,\"mapName\"", StringComparison.Ordinal);
        fixture.Run.MapaJson = """{"schemaVersion":5,"nodes":[{"id":"inicio","type":"INICIO","state":"CONCLUIDO","connections":["cacador"]},{"id":"cacador","type":"COMBATE","state":"DISPONIVEL","layer":1,"payload":{"encounterCode":"CACADOR"}}]}""";
        fixture.Run.EstadoAtualJson = GameRunCarry.Reconcile(fixture.Run.EstadoAtualJson, fixture.Version);
        string before = fixture.Run.EstadoAtualJson;
        string original = fixture.Run.SnapshotInicialJson;
        var attempt = new GameBattleResult("player", reason, 5,
        [new("player", "Ada", 1, 30, 0, 10, 0, 10, new GameBattleDefenses(), []),
         new("enemy", "Caçador", 20, 20, 0, 0, 0, 0, new GameBattleDefenses(), [])],
        [new(1, 1, 1, GameBattleEventTypes.ItemConsumed, "player", null, new ItemConsumedPayload("item:seringa", 0))]);
        fixture.Simulator.Setup(item => item.Simulate(It.IsAny<GameBattleInput>(), It.IsAny<IDiceRandomSource>())).Returns(attempt);
        Assert.True((await fixture.Service.SelectAsync(10, "cacador", 5, Request(0), default)).Sucesso);
        var command = Request(1);
        var result = await fixture.Service.ResolveAsync(10, 5, command, default);
        Assert.True(result.Sucesso, result.Mensagem);
        Assert.Null(result.Dados!.Battle.Resultado.WinnerActorId);
        Assert.Equal(0, result.Dados.Battle.XpConcedido);
        Assert.Equal(0, result.Dados.Battle.MoedaConcedida);
        Assert.Empty(result.Dados.Battle.NiveisAlcancados);
        Assert.Equal(GameRunStatus.Ativa, fixture.Run.Status);
        Assert.Null(fixture.Run.EncerradaEmUtc);
        Assert.Null(fixture.Run.NoAtualId);
        Assert.Equal(before, fixture.Run.EstadoAtualJson);
        Assert.Equal(original, fixture.Run.SnapshotInicialJson);
        Assert.Equal("DISPONIVEL", GameRunFirstMap.Read(fixture.Run.MapaJson, new(JsonSerializerDefaults.Web)).Nodes.Single(node => node.Id == "cacador").State);
        fixture.Repository.Verify(item => item.AddBattleAsync(It.IsAny<GameRunBattle>(), It.IsAny<CancellationToken>()), Times.Never);
        fixture.Repository.Verify(item => item.AddCharacterMemoryAsync(It.IsAny<GameCharacterMemory>(), It.IsAny<CancellationToken>()), Times.Never);
        Assert.True((await fixture.Service.ResolveAsync(10, 5, command, default)).Repetido);
        Assert.Equal(2, fixture.Run.Revisao);
        Assert.True((await fixture.Service.SelectAsync(10, "cacador", 5, Request(2), default)).Sucesso);
        fixture.Simulator.Setup(item => item.Simulate(It.IsAny<GameBattleInput>(), It.IsAny<IDiceRandomSource>()))
            .Returns(attempt with { EndReason = GameBattleEndReason.ActorDefeated, Events = [],
                Actors = attempt.Actors.Select(actor => actor.Id == "enemy" ? actor with { HitPoints = 0 } : actor).ToArray() });
        var victory = await fixture.Service.ResolveAsync(10, 5, Request(3), default);
        Assert.True(victory.Sucesso, victory.Mensagem);
        Assert.Equal(7, victory.Dados!.Battle.XpConcedido);
        Assert.Equal(100, victory.Dados.Battle.MoedaConcedida);
        fixture.Repository.Verify(item => item.AddBattleAsync(It.IsAny<GameRunBattle>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task VitoriaCongelaSomenteDepositoProtegidoParaResumoDeJornadasEncerradas()
    {
        Fixture fixture = new();
        fixture.Run.IdPersonagemJogadorOrigem = 8;
        fixture.Run.GameModeVersion.Codigo = "JOGO";
        fixture.Run.GameModeVersion.ConfiguracaoJson = Fixture.BranchConfiguration;
        fixture.Run.MapaJson = """{"schemaVersion":5,"nodes":[{"id":"inicio","type":"INICIO","state":"CONCLUIDO","connections":["cacador"]},{"id":"cacador","type":"COMBATE","state":"DISPONIVEL","layer":1,"payload":{"encounterCode":"CACADOR"}}]}""";
        var state = new GameCharacterMilestones();
        var item = JsonNode.Parse("""{"id":"seguro","nome":"Seringa","quantidade":3,"tipo":"consumiveis","atributos":{"restaura":{"vida":100}}} """)!.AsObject();
        state.ProtectedItems.Add(new("JOGO", fixture.Version.IdSistemaRpg, "seguro", item, 7));
        state.ProtectedItems.Add(new("OUTRO_JOGO", fixture.Version.IdSistemaRpg, "outro", item.DeepClone().AsObject(), 7));
        var memory = new GameCharacterMemory { EstadoJson = state.Serialize() };
        fixture.Repository.Setup(repo => repo.GetCharacterMemoryAsync(5, 8, It.IsAny<CancellationToken>())).ReturnsAsync(memory);
        await fixture.Service.SelectAsync(10, "cacador", 5, Request(0), default);
        Assert.True((await fixture.Service.ResolveAsync(10, 5, Request(1), default)).Sucesso);
        Assert.Equal(GameRunStatus.Vitoria, fixture.Run.Status);
        memory.EstadoJson = new GameCharacterMilestones().Serialize();
        var recap = await fixture.Service.GetProtectedDepositAsync(10, 5, default);
        var saved = Assert.Single(recap!.Items);
        Assert.Equal("seguro", saved.ItemId);
        Assert.Equal(3, saved.Snapshot["quantidade"]!.GetValue<int>());
        Assert.Empty(GameCharacterMilestones.Read(memory.EstadoJson).ProtectedItems);
        Assert.DoesNotContain("protectedDepositAtEnd", fixture.Run.SnapshotInicialJson);
    }

    private sealed class Fixture
    {
        public const string BranchConfiguration = """
            {"schemaVersion":1,"previewUseTotalForRanges":true,
             "previewEnemy":{"name":"Sentinela","maxVida":30,"defesa":0},
             "previewFallbackAction":{"name":"Ataque de treino","baseDamage":5},
             "previewDamageByResult":{"FALHA_CRITICA":0,"ERRO":0,"ACERTO":5,"ACERTO_PRECISO":8,"CRITICO":10},
             "previewPlayerDamageByResult":{
                "FALHA_CRITICA":{"multiplier":0,"bonus":0},"ERRO":{"multiplier":0,"bonus":0},
                "ACERTO":{"multiplier":1,"bonus":0},"ACERTO_PRECISO":{"multiplier":1,"bonus":2},
                "CRITICO":{"multiplier":2,"bonus":0}},
             "map":{"schemaVersion":2,"branchEncounterCodes":["CACADOR","GUARDIAO"]},
             "encounters":{
                "CACADOR":{"mapName":"Rota do Caçador","enemy":{"name":"Caçador","maxVida":20,"defesa":0},
                    "damageByResult":{"FALHA_CRITICA":0,"ERRO":0,"ACERTO":5,"ACERTO_PRECISO":8,"CRITICO":10}},
                "GUARDIAO":{"mapName":"Rota do Guardião","enemy":{"name":"Guardião","maxVida":40,"defesa":0},
                    "damageByResult":{"FALHA_CRITICA":0,"ERRO":0,"ACERTO":3,"ACERTO_PRECISO":5,"CRITICO":8}}}
            }
            """;
        public static string BaseConfiguration => BranchConfiguration
            .Replace("\"schemaVersion\":2", "\"schemaVersion\":3", StringComparison.Ordinal)
            .Replace("\"map\":", "\"base\":{\"restType\":\"SIMPLES\"},\"map\":", StringComparison.Ordinal);
        private const string Configuration = """
            {"schemaVersion":1,"previewUseTotalForRanges":true,
             "previewEnemy":{"name":"Sentinela","maxVida":30,"defesa":0},
             "previewFallbackAction":{"name":"Ataque de treino","baseDamage":5},
             "previewDamageByResult":{"FALHA_CRITICA":0,"ERRO":0,"ACERTO":5,"ACERTO_PRECISO":8,"CRITICO":10},
             "previewPlayerDamageByResult":{
                "FALHA_CRITICA":{"multiplier":0,"bonus":0},"ERRO":{"multiplier":0,"bonus":0},
                "ACERTO":{"multiplier":1,"bonus":0},"ACERTO_PRECISO":{"multiplier":1,"bonus":2},
                "CRITICO":{"multiplier":2,"bonus":0}}}
            """;
        private const string Snapshot = """
            {"schemaVersion":1,"idPersonagemJogadorOrigem":8,"nome":"Ada","idRaca":3,
             "idSistemaVersao":7,"status":{"status":{"vida":30,"vidaMaxima":30,"mana":10,"manaMaxima":10,
             "estamina":10,"estaminaMaxima":10},
             "defesas":{"escudo":0,"protecao":0,"armadura":0}},"inventario":[],
             "sistema":{"idSistemaVersao":7}}
            """;

        public GameRun Run { get; } = new()
        {
            IdGameRun = 10,
            IdUsuario = 5,
            IdSistemaVersao = 7,
            IdGameModeVersion = 3,
            Status = GameRunStatus.Ativa,
            SnapshotInicialJson = Snapshot,
            EstadoAtualJson = Snapshot,
            GameModeVersion = new GameModeVersion { ConfiguracaoJson = Configuration },
        };
        public Mock<IGameRunRepository> Repository { get; } = new();
        public Mock<IAutoBattleSimulator> Simulator { get; } = new();
        public SistemaVersao Version { get; private set; } = null!;
        public GameRunEncounterService Service { get; }

        public Fixture(GameRunItemValueResolver? itemValues = null)
        {
            var commands = new Dictionary<Guid, GameRunCommand>();
            Dictionary<string, GameRunBattle> battles = new();
            Repository.Setup(item => item.ExecuteWithUserLockAsync(
                    It.IsAny<int>(), It.IsAny<Func<Task<GameRunOperationResult<GameRunDto>>>>(),
                    It.IsAny<CancellationToken>()))
                .Returns((int _, Func<Task<GameRunOperationResult<GameRunDto>>> action, CancellationToken _) => action());
            Repository.Setup(item => item.ExecuteWithUserLockAsync(
                    It.IsAny<int>(), It.IsAny<Func<Task<GameRunOperationResult<GameRunBattleResolutionDto>>>>(),
                    It.IsAny<CancellationToken>()))
                .Returns((int _, Func<Task<GameRunOperationResult<GameRunBattleResolutionDto>>> action, CancellationToken _) => action());
            Repository.Setup(item => item.ExecuteWithUserLockAsync(
                    It.IsAny<int>(), It.IsAny<Func<Task<GameRunOperationResult<GameRunBaseResolutionDto>>>>(),
                    It.IsAny<CancellationToken>()))
                .Returns((int _, Func<Task<GameRunOperationResult<GameRunBaseResolutionDto>>> action, CancellationToken _) => action());
            Repository.Setup(item => item.ExecuteWithUserLockAsync(
                    It.IsAny<int>(), It.IsAny<Func<Task<GameRunOperationResult<GameRunMediumRestResolutionDto>>>>(),
                    It.IsAny<CancellationToken>()))
                .Returns((int _, Func<Task<GameRunOperationResult<GameRunMediumRestResolutionDto>>> action, CancellationToken _) => action());
            Repository.Setup(item => item.ExecuteWithUserLockAsync(
                    It.IsAny<int>(), It.IsAny<Func<Task<GameRunOperationResult<GameRunConsumeItemResultDto>>>>(),
                    It.IsAny<CancellationToken>()))
                .Returns((int _, Func<Task<GameRunOperationResult<GameRunConsumeItemResultDto>>> action, CancellationToken _) => action());
            Repository.Setup(item => item.GetByIdAsync(It.IsAny<long>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .Returns((long id, int user, CancellationToken _) => Task.FromResult(
                    id == 10 && user == 5 ? Run : null));
            Repository.Setup(item => item.GetCommandAsync(It.IsAny<int>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
                .Returns((int _, Guid key, CancellationToken _) => Task.FromResult(commands.GetValueOrDefault(key)));
            Repository.Setup(item => item.AddCommandAsync(It.IsAny<GameRunCommand>(), It.IsAny<CancellationToken>()))
                .Returns((GameRunCommand command, CancellationToken _) =>
                {
                    commands[Guid.Parse(command.ChaveIdempotencia)] = command;
                    return Task.CompletedTask;
                });
            Repository.Setup(item => item.AddBattleAsync(It.IsAny<GameRunBattle>(), It.IsAny<CancellationToken>()))
                .Returns((GameRunBattle saved, CancellationToken _) =>
                { battles[saved.NoId] = saved; return Task.CompletedTask; });
            Repository.Setup(item => item.GetBattleAsync(It.IsAny<long>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .Returns((long _, string nodeId, CancellationToken _) =>
                    Task.FromResult(battles.GetValueOrDefault(nodeId)));
            Repository.Setup(item => item.GetLastBattleAsync(It.IsAny<long>(), It.IsAny<CancellationToken>()))
                .Returns((long _, CancellationToken _) => Task.FromResult(
                    battles.Values.OrderByDescending(item => item.Ordem).FirstOrDefault()));
            Repository.Setup(item => item.GetBattlesAsync(It.IsAny<long>(), It.IsAny<CancellationToken>()))
                .Returns((long _, CancellationToken _) => Task.FromResult<IReadOnlyList<GameRunBattle>>(
                    battles.Values.OrderBy(item => item.Ordem).ToArray()));
            Repository.Setup(item => item.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

            SistemaVersao version = new()
            {
                IdSistemaVersao = 7,
                ResultadosDado = new List<SistemaResultadoDado>
                {
                    Row("FALHA_CRITICA", 1, 1, 1), Row("ERRO", 2, 10, 2),
                    Row("ACERTO", 11, 17, 3), Row("ACERTO_PRECISO", 18, 19, 4),
                    Row("CRITICO", 20, 20, 5),
                },
                Descansos = new List<SistemaDescansoConfig>
                {
                    new() { Tipo = "SIMPLES", Nome = "Descanso simples", RecuperacaoVida = 0,
                        RecuperacaoMana = 10, RecuperacaoEstamina = 10,
                        TipoRecuperacao = SistemaRecuperacaoTipo.ValorFixo },
                    new() { Tipo = "NORMAL", Nome = "Descanso normal", RecuperacaoVida = 0,
                        RecuperacaoMana = 100, RecuperacaoEstamina = 100,
                        TipoRecuperacao = SistemaRecuperacaoTipo.Percentual, ExigeGuarda = true },
                },
            };
            Version = version;
            Mock<ISistemaRpgRepository> systems = new();
            systems.Setup(item => item.GetVersionAsync(7, true, false)).ReturnsAsync(version);
            Simulator.Setup(item => item.Simulate(It.IsAny<GameBattleInput>(), It.IsAny<IDiceRandomSource>()))
                .Returns(new GameBattleResult("player", GameBattleEndReason.ActorDefeated, 2,
                [
                    new GameBattleActorState("player", "Ada", 12, 30, 8, 10, 7, 10,
                        new GameBattleDefenses(), []),
                    new GameBattleActorState("enemy", "Sentinela", 0, 30, 0, 0, 0, 0,
                        new GameBattleDefenses(), []),
                ], [new GameBattleEvent(1, 1, 1, GameBattleEventTypes.BattleStarted,
                    null, null, new BattleStartedPayload(["player", "enemy"]))]));
            Service = new GameRunEncounterService(Repository.Object, systems.Object,
                new GameBattlePreviewFactory(new GameplayActionResolver()), Simulator.Object, itemValues);
        }

        private static SistemaResultadoDado Row(string code, int min, int max, int order) => new()
        {
            CodigoTeste = "ATAQUE_COMUM", NomeTeste = "Ataque comum", Dado = "D20",
            QuantidadeDados = 1, ResultadoMinimo = min, ResultadoMaximo = max,
            CodigoResultado = code, NomeResultado = code, Ordem = order,
        };
    }
}
