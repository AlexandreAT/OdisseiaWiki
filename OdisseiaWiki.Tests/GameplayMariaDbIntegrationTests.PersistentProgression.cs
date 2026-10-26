using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using Moq;
using OdisseiaWiki.Data;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.GameRuns;
using OdisseiaWiki.GameRuns.Battle;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed partial class GameplayMariaDbIntegrationTests
{
    private static readonly JsonSerializerOptions PersistentJson = new(JsonSerializerDefaults.Web);
    private const string PersistentSnapshot = """
        {"schemaVersion":1,"nome":"Ada","status":{"status":{"vida":12,"vidaMaxima":30,"mana":2,"manaMaxima":10,"estamina":3,"estaminaMaxima":10}},
         "inventario":[],"implantes":[],"economy":{"balance":100,"stash":[{"id":"colete","nome":"Colete","tipo":"traje","quantidade":1,"atributos":{"protecaoBase":300,"__runDefenseRemaining":{"protecao":20,"escudo":0}}}]}}
        """;

    private static string PersistentMap(bool npc) => JsonSerializer.Serialize(new GameRunMapDto { SchemaVersion = 5, Nodes = npc ? [
        new() { Id = "inicio", Type = "INICIO", State = "CONCLUIDO", Connections = ["npc"] },
        new() { Id = "npc", Type = "NPC", Name = "Médico", Layer = 1, Fase = 1, State = "DISPONIVEL", Connections = ["fim"],
            Payload = new() { NpcCode = "medico", NpcType = "MEDICO", NpcLocked = true } },
        new() { Id = "fim", Type = "BASE", State = "BLOQUEADO", Fase = 1, Layer = 2 }
    ] : [new() { Id = "base", Type = "BASE", State = "CONCLUIDO", Fase = 1, Layer = 1 }] }, PersistentJson);

    private static GameRunEncounterService PersistentService(OdisseiaContext context, int versionId)
    {
        var systems = new Mock<ISistemaRpgRepository>();
        systems.Setup(repo => repo.GetVersionAsync(versionId, true, false))
            .ReturnsAsync(new SistemaVersao { IdSistemaVersao = versionId, IdSistemaRpg = 1 });
        return new(new GameRunRepository(context), systems.Object,
            new GameBattlePreviewFactory(new GameplayActionResolver()), new Mock<IAutoBattleSimulator>().Object);
    }

    private static async Task<long> AddPersistentRun(TestDatabase database, Seed seed, bool npc, int? existingMode = null)
    {
        await using var context = database.CreateContext();
        var mode = existingMode.HasValue ? await context.GameModeVersions.FindAsync(existingMode.Value) : new GameModeVersion {
            Codigo = "PERSISTENT_GAME", NumeroVersao = "test-memory", IdSistemaVersao = seed.Mesa.IdSistemaVersao!.Value,
            Status = GameModeVersionStatus.Publicado, ConfiguracaoJson = """{"protectedDepositSlots":2,"protectedDepositCost":10}""" };
        if (!existingMode.HasValue) { context.GameModeVersions.Add(mode!); await context.SaveChangesAsync(); }
        var run = new GameRun { IdUsuario = seed.Player.Idusuario,
            IdPersonagemJogadorOrigem = seed.Character!.IdpersonagemJogador, IdSistemaVersao = seed.Mesa.IdSistemaVersao!.Value,
            IdGameModeVersion = mode!.IdGameModeVersion, Status = GameRunStatus.Ativa,
            SnapshotInicialJson = PersistentSnapshot, EstadoAtualJson = PersistentSnapshot, MapaJson = PersistentMap(npc) };
        context.GameRuns.Add(run); await context.SaveChangesAsync(); return run.IdGameRun;
    }

    [Fact]
    public async Task ProtectedDeposit_AtomicConcurrentCommandsSurviveRunAndCannotDuplicateAcrossContexts()
    {
        if (!TestDatabase.Enabled) return;
        await using var database = await TestDatabase.CreateAsync();
        var seed = await database.SeedAsync(includeCharacter: true);
        long runId = await AddPersistentRun(database, seed, false);
        string storedId = "colete";
        async Task<GameRunOperationResult<GameRunDto>> Change(long id, string action, long revision, Guid key, int? userId = null)
        {
            await using var context = database.CreateContext();
            return await PersistentService(context, seed.Mesa.IdSistemaVersao!.Value).ChangeProtectedItemAsync(id,
                userId ?? seed.Player.Idusuario, new() { ItemId = action == "PROTECT" ? "colete" : storedId, Action = action,
                    RevisaoEsperada = revision, ChaveIdempotencia = key }, default);
        }
        Guid protectKey = Guid.NewGuid();
        var protectedResults = await Task.WhenAll(Change(runId, "PROTECT", 0, protectKey), Change(runId, "PROTECT", 0, protectKey));
        Assert.Single(protectedResults, item => item.Sucesso && !item.Repetido);
        Assert.Single(protectedResults, item => item.Sucesso && item.Repetido);
        int modeId;
        await using (var context = database.CreateContext())
        {
            var run = await context.GameRuns.SingleAsync(item => item.IdGameRun == runId);
            modeId = run.IdGameModeVersion;
            var snapshot = JsonDocument.Parse(run.EstadoAtualJson).RootElement;
            Assert.Equal(90, snapshot.GetProperty("economy").GetProperty("balance").GetInt32());
            Assert.Empty(snapshot.GetProperty("economy").GetProperty("stash").EnumerateArray());
            var memory = await context.GameCharacterMemories.SingleAsync();
            var stored = Assert.Single(GameCharacterMilestones.Read(memory.EstadoJson).ProtectedItems);
            storedId = stored.ItemId;
            Assert.Equal(20, stored.Snapshot["atributos"]!["__runDefenseRemaining"]!["protecao"]!.GetValue<int>());
            run.Status = GameRunStatus.Abandonada;
            await context.SaveChangesAsync();
        }
        long nextRunId = await AddPersistentRun(database, seed, false, modeId);
        // A fresh run has its own original sheet inventory, never a duplicated protected instance.
        await using (var context = database.CreateContext())
        {
            var next = await context.GameRuns.FindAsync(nextRunId);
            var snapshot = JsonNode.Parse(PersistentSnapshot)!;
            snapshot["economy"]!["stash"] = new JsonArray();
            next!.EstadoAtualJson = snapshot.ToJsonString();
            await context.SaveChangesAsync();
        }
        Assert.Equal("RUN_NAO_ENCONTRADA", (await Change(nextRunId, "TAKE", 0, Guid.NewGuid(), seed.Owner.Idusuario)).Codigo);
        Guid takeKey = Guid.NewGuid();
        var taken = await Task.WhenAll(Change(nextRunId, "TAKE", 0, takeKey), Change(nextRunId, "TAKE", 0, takeKey));
        Assert.Single(taken, item => item.Sucesso && !item.Repetido);
        Assert.Single(taken, item => item.Sucesso && item.Repetido);
        await using var verify = database.CreateContext();
        Assert.Empty(GameCharacterMilestones.Read((await verify.GameCharacterMemories.SingleAsync()).EstadoJson).ProtectedItems);
        var final = await verify.GameRuns.FindAsync(nextRunId);
        var entry = Assert.Single(JsonDocument.Parse(final!.EstadoAtualJson).RootElement.GetProperty("inventario").EnumerateArray());
        Assert.Equal(storedId, entry.GetProperty("id").GetString());
        Assert.Equal(20, entry.GetProperty("atributos").GetProperty("__runDefenseRemaining").GetProperty("protecao").GetInt32());
        Assert.Equal(1, final.Revisao);
    }

    [Fact]
    public async Task NpcRescue_IsIdempotentPersistsAfterDefeatAndNextRunUsesService()
    {
        if (!TestDatabase.Enabled) return;
        await using var database = await TestDatabase.CreateAsync();
        var seed = await database.SeedAsync(includeCharacter: true);
        long runId = await AddPersistentRun(database, seed, true);
        async Task<GameRunOperationResult<GameRunBaseResolutionDto>> Visit(long id, Guid key)
        {
            await using var context = database.CreateContext();
            return await PersistentService(context, seed.Mesa.IdSistemaVersao!.Value).VisitNpcAsync(id, "npc", seed.Player.Idusuario,
                new() { RevisaoEsperada = 0, ChaveIdempotencia = key }, default);
        }
        Guid key = Guid.NewGuid();
        var results = await Task.WhenAll(Visit(runId, key), Visit(runId, key));
        Assert.Single(results, item => item.Sucesso && !item.Repetido);
        Assert.Single(results, item => item.Sucesso && item.Repetido);
        Assert.All(results, item => Assert.Equal("NPC_RESGATE", item.Dados!.Tipo));
        int modeId;
        await using (var context = database.CreateContext())
        {
            var run = await context.GameRuns.FindAsync(runId); modeId = run!.IdGameModeVersion;
            run.Status = GameRunStatus.Derrota;
            await context.SaveChangesAsync();
        }
        long nextRun = await AddPersistentRun(database, seed, true, modeId);
        var treated = await Visit(nextRun, Guid.NewGuid());
        Assert.True(treated.Sucesso, treated.Mensagem);
        Assert.Equal("NPC_MEDICO", treated.Dados!.Tipo);
        Assert.Equal(18, treated.Dados.VidaRecuperada);
        await using var verify = database.CreateContext();
        Assert.Single(GameCharacterMilestones.Read((await verify.GameCharacterMemories.SingleAsync()).EstadoJson).RescuedNpcs);
        Assert.Equal(30, JsonDocument.Parse((await verify.GameRuns.FindAsync(nextRun))!.EstadoAtualJson).RootElement
            .GetProperty("status").GetProperty("status").GetProperty("vida").GetInt32());
    }
}
