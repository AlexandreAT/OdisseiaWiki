using System.Text.Json.Nodes;
using OdisseiaWiki.Dtos;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed partial class GameRunEncounterServiceTests
{
    private static Fixture RepairWorkshop()
    {
        var fixture = Workshop("ENGENHEIRO");
        var map = JsonNode.Parse(fixture.Run.MapaJson!)!;
        map["nodes"]![1]!["payload"]!["repairPricePer10Percent"] = 7;
        fixture.Run.MapaJson = map.ToJsonString();
        var root = JsonNode.Parse(fixture.Run.EstadoAtualJson)!;
        var equipment = JsonNode.Parse(GameRunEngineerRepairTests.Snapshot())!;
        root["inventario"] = equipment["inventario"]!.DeepClone();
        root["status"]!["defesas"] = equipment["status"]!["defesas"]!.DeepClone();
        root["economy"] = equipment["economy"]!.DeepClone();
        root["inventario"]![0]!["valor"] = 100;
        fixture.Run.EstadoAtualJson = root.ToJsonString();
        return fixture;
    }

    [Fact]
    public async Task ConsertoPersisteCopiaDebitaUmaVezEComandoRepetidoNaoConsertaDeNovo()
    {
        var fixture = RepairWorkshop(); string initial = fixture.Run.SnapshotInicialJson;
        Assert.True((await fixture.Service.VisitNpcAsync(10, "npc", 5, Request(0), default)).Sucesso);
        var request = new GameRunVendorPurchaseRequestDto { RevisaoEsperada = 1, ChaveIdempotencia = Guid.NewGuid(), ItemId = "equip" };
        var result = await fixture.Service.RepairDefenseAsync(10, 5, request, default);
        Assert.True(result.Sucesso, result.Mensagem);
        Assert.Equal(979, result.Dados!.EstadoAtual.Economy!.Balance);
        Assert.Equal(2, fixture.Run.Revisao);
        Assert.True((await fixture.Service.RepairDefenseAsync(10, 5, request, default)).Repetido);
        Assert.Equal(2, fixture.Run.Revisao);
        Assert.Equal(initial, fixture.Run.SnapshotInicialJson);
        request.ChaveIdempotencia = Guid.NewGuid(); request.RevisaoEsperada = 2;
        Assert.Equal("CONSERTO_INVALIDO", (await fixture.Service.RepairDefenseAsync(10, 5, request, default)).Codigo);
        Assert.Equal(2, fixture.Run.Revisao);
    }

    [Theory]
    [InlineData("dono")] [InlineData("revisao")] [InlineData("visita")] [InlineData("npc")]
    [InlineData("bloqueado")] [InlineData("saldo")] [InlineData("deposito")] [InlineData("item")]
    public async Task ConsertoRejeitadoPreservaEstadoESaldo(string reason)
    {
        var fixture = RepairWorkshop();
        Assert.True((await fixture.Service.VisitNpcAsync(10, "npc", 5, Request(0), default)).Sucesso);
        var map = JsonNode.Parse(fixture.Run.MapaJson!)!;
        if (reason == "visita") map["nodes"]![1]!["payload"]!["npcServiceVisited"] = false;
        if (reason == "npc") map["nodes"]![1]!["payload"]!["npcType"] = "SABIO";
        if (reason == "bloqueado") { map["nodes"]![1]!["payload"]!["npcLocked"] = true; map["nodes"]![1]!["payload"]!["npcRescued"] = false; }
        fixture.Run.MapaJson = map.ToJsonString();
        if (reason == "saldo") { var root = JsonNode.Parse(fixture.Run.EstadoAtualJson)!; root["economy"]!["balance"] = 0; fixture.Run.EstadoAtualJson = root.ToJsonString(); }
        string before = fixture.Run.EstadoAtualJson;
        var response = await fixture.Service.RepairDefenseAsync(10, reason == "dono" ? 99 : 5, new() {
            RevisaoEsperada = reason == "revisao" ? 0 : 1, ChaveIdempotencia = Guid.NewGuid(),
            ItemId = reason == "item" ? "inexistente" : "equip", ToStash = reason == "deposito" }, default);
        Assert.False(response.Sucesso); Assert.Equal(before, fixture.Run.EstadoAtualJson); Assert.Equal(1, fixture.Run.Revisao);
    }

    [Fact]
    public async Task EngenheiroCompraDaMochilaComMesmaVendaMasNaoLiberaDeposito()
    {
        var fixture = RepairWorkshop();
        Assert.True((await fixture.Service.VisitNpcAsync(10, "npc", 5, Request(0), default)).Sucesso);
        var request = new GameRunVendorSaleRequestDto { RevisaoEsperada = 1, ChaveIdempotencia = Guid.NewGuid(), Items = [new() { ItemId = "equip", Quantity = 1 }] };
        var result = await fixture.Service.SellVendorItemsAsync(10, 5, request, default);
        Assert.True(result.Sucesso, result.Mensagem);
        Assert.Empty(result.Dados!.EstadoAtual.Inventario!.Value.EnumerateArray());
        Assert.True((await fixture.Service.SellVendorItemsAsync(10, 5, request, default)).Repetido);
        request.RevisaoEsperada = 2; request.ChaveIdempotencia = Guid.NewGuid(); request.FromStash = true;
        Assert.Equal("STASH_INDISPONIVEL", (await fixture.Service.SellVendorItemsAsync(10, 5, request, default)).Codigo);
        Assert.Equal(2, fixture.Run.Revisao);
    }
}
