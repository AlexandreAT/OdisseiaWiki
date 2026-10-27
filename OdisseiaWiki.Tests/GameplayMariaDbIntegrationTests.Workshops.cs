using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using Moq;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.GameRuns.Battle;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed partial class GameplayMariaDbIntegrationTests
{
    [Fact]
    public async Task Engineer_RepairAndBulkSaleAreAtomicIdempotentAndDoNotChangeTheSourceSheet()
    {
        if (!TestDatabase.Enabled) return;
        await using var database = await TestDatabase.CreateAsync();
        var seed = await database.SeedAsync(includeCharacter: true);
        long runId = await AddPersistentRun(database, seed, false);
        int versionId = seed.Mesa.IdSistemaVersao!.Value;
        await using (var context = database.CreateContext())
        {
            var run = await context.GameRuns.FindAsync(runId);
            var root = JsonNode.Parse(run!.EstadoAtualJson)!;
            var repair = JsonNode.Parse(GameRunEngineerRepairTests.Snapshot())!;
            root["inventario"] = repair["inventario"]!.DeepClone();
            root["inventario"]![0]!["valor"] = 100;
            root["inventario"]!.AsArray().Add(JsonNode.Parse("""{"id":"seringa","tipo":"consumiveis","valor":25,"quantidade":2}"""));
            root["status"]!["defesas"] = repair["status"]!["defesas"]!.DeepClone();
            root["economy"] = repair["economy"]!.DeepClone();
            run.EstadoAtualJson = root.ToJsonString();
            run.NoAtualId = "npc";
            run.MapaJson = JsonSerializer.Serialize(new GameRunMapDto { SchemaVersion = 5, Nodes = [new() {
                Id = "npc", Type = "NPC", State = "SELECIONADO", Payload = new() {
                    NpcCode = "oficina", NpcType = "ENGENHEIRO", NpcServiceVisited = true, RepairPricePer10Percent = 7 } }] }, PersistentJson);
            await context.SaveChangesAsync();
        }
        async Task<GameRunOperationResult<GameRunDto>> Repair(Guid key)
        {
            await using var context = database.CreateContext();
            return await PersistentService(context, versionId).RepairDefenseAsync(runId, seed.Player.Idusuario,
                new() { ItemId = "equip", RevisaoEsperada = 0, ChaveIdempotencia = key }, default);
        }
        async Task<GameRunOperationResult<GameRunDto>> Sell(Guid key, int userId, params GameRunVendorSaleLineDto[] lines)
        {
            await using var context = database.CreateContext();
            return await PersistentService(context, versionId).SellVendorItemsAsync(runId, userId,
                new() { Items = lines.ToList(), RevisaoEsperada = 1, ChaveIdempotencia = key }, default);
        }
        Guid repairKey = Guid.NewGuid();
        var repairs = await Task.WhenAll(Repair(repairKey), Repair(repairKey));
        Assert.All(repairs, result => Assert.True(result.Sucesso, result.Mensagem));
        Assert.Single(repairs, result => result.Repetido);
        var invalid = await Sell(Guid.NewGuid(), seed.Player.Idusuario,
            new() { ItemId = "equip" }, new() { ItemId = "inexistente" });
        Assert.Equal("VENDA_INVALIDA", invalid.Codigo);
        Assert.Equal("RUN_NAO_ENCONTRADA", (await Sell(Guid.NewGuid(), seed.Owner.Idusuario, new GameRunVendorSaleLineDto { ItemId = "equip" })).Codigo);
        await using (var check = database.CreateContext())
        {
            var run = await check.GameRuns.FindAsync(runId);
            var state = JsonNode.Parse(run!.EstadoAtualJson)!;
            Assert.Equal(1, run.Revisao);
            Assert.Equal(979, state["economy"]!["balance"]!.GetValue<int>());
            Assert.Equal(2, state["inventario"]!.AsArray().Count);
            Assert.Equal(410, state["status"]!["defesas"]!["protecao"]!.GetValue<int>());
        }
        Guid saleKey = Guid.NewGuid();
        Task<GameRunOperationResult<GameRunDto>> Sale() => Sell(saleKey, seed.Player.Idusuario,
            new() { ItemId = "equip" }, new() { ItemId = "seringa", Quantity = 2 });
        var sales = await Task.WhenAll(Sale(), Sale());
        Assert.All(sales, result => Assert.True(result.Sucesso, result.Mensagem));
        Assert.Single(sales, result => result.Repetido);
        await using var verify = database.CreateContext();
        var final = await verify.GameRuns.SingleAsync(item => item.IdGameRun == runId);
        var saved = JsonNode.Parse(final.EstadoAtualJson)!;
        Assert.Equal(2, final.Revisao);
        Assert.Equal(1129, saved["economy"]!["balance"]!.GetValue<int>());
        Assert.Empty(saved["inventario"]!.AsArray());
        Assert.Equal(10, saved["status"]!["defesas"]!["protecao"]!.GetValue<int>());
        Assert.Equal(2, await verify.GameRunCommands.CountAsync(item => item.IdGameRun == runId));
        Assert.True(JsonNode.DeepEquals(JsonNode.Parse(PersistentSnapshot), JsonNode.Parse(final.SnapshotInicialJson)));
        var sheet = await verify.PersonagemJogadores.SingleAsync(item => item.IdpersonagemJogador == seed.Character!.IdpersonagemJogador);
        Assert.True(JsonNode.DeepEquals(JsonNode.Parse(seed.Character!.StatusJson!), JsonNode.Parse(sheet.StatusJson!)));
        Assert.Equal(seed.Character.InventarioJson, sheet.InventarioJson);
        Assert.Equal(0, sheet.RevisaoRuntime);
    }

    [Theory]
    [InlineData("SABIO")]
    [InlineData("ENGENHEIRO")]
    public async Task NpcWorkshop_AtomicConcurrentPurchasePersistsOnceAcrossContexts(string type)
    {
        if (!TestDatabase.Enabled) return;
        await using var database = await TestDatabase.CreateAsync();
        var seed = await database.SeedAsync(includeCharacter: true);
        long runId = await AddPersistentRun(database, seed, false);
        int versionId = seed.Mesa.IdSistemaVersao!.Value;
        await using (var context = database.CreateContext())
        {
            var run = await context.GameRuns.FindAsync(runId);
            var snapshot = JsonNode.Parse(run!.EstadoAtualJson)!;
            snapshot["inventario"] = JsonNode.Parse("""[{"id":"espada","nome":"Espada","tipo":"arma","atributos":{"danoBase":20}}]""");
            run.EstadoAtualJson = snapshot.ToJsonString();
            run.NoAtualId = "npc";
            run.MapaJson = JsonSerializer.Serialize(new GameRunMapDto { SchemaVersion = 5, Nodes = [new() {
                Id = "npc", Type = "NPC", State = "SELECIONADO", Payload = new() {
                    NpcCode = "oficina", NpcType = type, NpcServiceVisited = true,
                    Upgrade = new() { Damage = 7, Price = 10, MaxUpgrades = 2 },
                    Offers = [new() { ItemId = "pulso", Price = 10, Stock = 1, Snapshot = new() {
                        ["nome"] = "Pulso", ["tipo"] = "ataque", ["atributos"] = JsonNode.Parse("""{"dano":35,"teste":{"codigoTeste":"ATAQUE_COMUM"}}""") } }] } }] }, PersistentJson);
            await context.SaveChangesAsync();
        }
        Guid key = Guid.NewGuid();
        async Task<GameRunOperationResult<GameRunDto>> Buy(long revision, Guid commandKey)
        {
            await using var context = database.CreateContext();
            var systems = new Mock<ISistemaRpgRepository>();
            systems.Setup(repo => repo.GetVersionAsync(versionId, true, false)).ReturnsAsync(new SistemaVersao {
                IdSistemaVersao = versionId, SistemaRpg = new() { Codigo = "ODISSEIA" }, SkillConfig = new() { MaximoMagias = 3 },
                ResultadosDado = new[] { ("FALHA_CRITICA", 1, 1), ("ERRO", 2, 10), ("ACERTO", 11, 17),
                    ("ACERTO_PRECISO", 18, 19), ("CRITICO", 20, 20) }.Select((row, index) => new SistemaResultadoDado {
                    CodigoTeste = "ATAQUE_COMUM", NomeTeste = "Ataque", Dado = "D20", QuantidadeDados = 1,
                    CodigoResultado = row.Item1, NomeResultado = row.Item1, ResultadoMinimo = row.Item2, ResultadoMaximo = row.Item3, Ordem = index }).ToList() });
            var service = new GameRunEncounterService(new GameRunRepository(context), systems.Object,
                new GameBattlePreviewFactory(new GameplayActionResolver()), new Mock<IAutoBattleSimulator>().Object);
            var request = new GameRunVendorPurchaseRequestDto { ItemId = type == "SABIO" ? "pulso" : "espada",
                RevisaoEsperada = revision, ChaveIdempotencia = commandKey };
            return type == "SABIO" ? await service.BuyVendorItemAsync(runId, seed.Player.Idusuario, request, default)
                : await service.UpgradeWeaponAsync(runId, seed.Player.Idusuario, request, default);
        }
        var results = await Task.WhenAll(Buy(0, key), Buy(0, key));
        Assert.All(results, result => Assert.True(result.Sucesso, result.Mensagem));
        Assert.Single(results, result => result.Repetido);
        Assert.False((await Buy(0, Guid.NewGuid())).Sucesso);
        await using var verify = database.CreateContext();
        var final = await verify.GameRuns.SingleAsync(run => run.IdGameRun == runId);
        Assert.Equal(1, final.Revisao);
        var saved = JsonNode.Parse(final.EstadoAtualJson)!;
        Assert.Equal(90, saved["economy"]!["balance"]!.GetValue<int>());
        if (type == "SABIO") Assert.Single(saved["magia"]!.AsArray());
        else
        {
            Assert.Equal(1, saved["inventario"]![0]!["__runEngineerUpgrades"]!.GetValue<int>());
            Assert.Equal(7, saved["inventario"]![0]!["atributos"]!["modificadores"]!["dano"]!.GetValue<int>());
        }
        Assert.True(JsonNode.DeepEquals(JsonNode.Parse(PersistentSnapshot), JsonNode.Parse(final.SnapshotInicialJson)));
    }
}
