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
