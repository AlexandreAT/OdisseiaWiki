using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Moq;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.GameRuns;
using OdisseiaWiki.GameRuns.Battle;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services;
using OdisseiaWiki.Services.Interfaces;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed partial class GameplayMariaDbIntegrationTests
{
    [Fact]
    public async Task Training_HeavyHistoricalBattlesLoadAcrossRunsWithoutSortingReplayJson()
    {
        if (!TestDatabase.Enabled) return;
        await using var database = await TestDatabase.CreateAsync();
        var seed = await database.SeedAsync(includeCharacter: true);
        long oldRunId = await AddPersistentRun(database, seed, false);
        int systemId;
        int modeId;
        var config = new GameBattlePreviewConfig { PreviewEnemy = new() { Name = "Sentinela", MaxVida = 30 },
            Encounters = new() { ["MAGA"] = new() { Enemy = new() { NpcId = 33, Name = "Maga", MaxVida = 200 },
                DamageByResult = new() { ["ACERTO"] = 10 } } } };
        string configJson = JsonSerializer.Serialize(config, PersistentJson);
        DateTime earlier = DateTime.UtcNow.AddHours(-1);
        await using (var context = database.CreateContext())
        {
            var run = await context.GameRuns.Include(item => item.GameModeVersion).SingleAsync(item => item.IdGameRun == oldRunId);
            run.Status = GameRunStatus.Vitoria;
            run.GameModeVersion.ConfiguracaoJson = configJson;
            run.MapaJson = """{"nodes":[],"historicalNodes":[{"id":"maga-0","payload":{"encounterCode":"MAGA"}},{"id":"maga-1","payload":{"encounterCode":"MAGA"}},{"id":"maga-2","payload":{"encounterCode":"MAGA"}}]}""";
            string heavy = JsonSerializer.Serialize(new { payload = new string('x', 262144) });
            run.SnapshotInicialJson = heavy; run.EstadoAtualJson = heavy;
            for (int index = 0; index < 5; index++)
            {
                context.GameRunBattles.Add(new() { IdGameRun = oldRunId, NoId = index < 3 ? $"maga-{index}" : $"other-{index}",
                    VencedorId = index < 3 ? "player" : index == 3 ? "enemy" : null,
                    CriadaEmUtc = index == 0 ? earlier.AddMinutes(1) : earlier,
                    ResultadoJson = heavy, EstadoAntesJson = heavy, EstadoDepoisJson = heavy });
            }
            await context.SaveChangesAsync();
            systemId = (await context.SistemaVersoes.FindAsync(run.IdSistemaVersao))!.IdSistemaRpg;
            modeId = run.IdGameModeVersion;
        }
        long newRunId = await AddPersistentRun(database, seed, false, modeId);
        await using var read = database.CreateContext();
        await read.Database.OpenConnectionAsync();
        await read.Database.ExecuteSqlRawAsync("SET SESSION sort_buffer_size = 32768");
        var repository = new GameRunRepository(read);
        var victories = await repository.GetCharacterVictoriesAsync(seed.Player.Idusuario,
            seed.Character!.IdpersonagemJogador, systemId, default);
        Assert.Equal(3, victories.Count);
        Assert.Equal(victories.OrderBy(item => item.CriadaEmUtc).ThenBy(item => item.IdGameRunBattle)
            .Select(item => item.IdGameRunBattle), victories.Select(item => item.IdGameRunBattle));
        Assert.All(victories, item => { Assert.Empty(item.ResultadoJson); Assert.Empty(item.EstadoAntesJson);
            Assert.Empty(item.EstadoDepoisJson); Assert.Null(item.Run.EstadoAtualJson);
            var saved = JsonSerializer.Deserialize<GameBattlePreviewConfig>(item.Run.GameModeVersion.ConfiguracaoJson, PersistentJson)!;
            Assert.Equal("Sentinela", saved.PreviewEnemy!.Name);
            Assert.Equal("Maga", saved.Encounters!["MAGA"].Enemy!.Name); });
        Assert.Same(victories[0].Run, victories[1].Run);
        Assert.Empty(read.ChangeTracker.Entries());
        var milestones = new GameCharacterMilestones();
        foreach (var victory in victories) milestones.LearnHistorical(victory, systemId);
        Assert.Equal("Maga", Assert.Single(milestones.DefeatedEnemies).Encounter.Enemy!.Name);

        var runs = new Mock<IGameRunService>();
        runs.Setup(item => item.GetByIdAsync(newRunId, seed.Player.Idusuario, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GameRunDto { IdGameRun = newRunId, IdPersonagemJogadorOrigem = seed.Character.IdpersonagemJogador,
                IdSistemaVersao = seed.Mesa.IdSistemaVersao!.Value, Status = "Ativa",
                ConfiguracaoModo = JsonSerializer.SerializeToElement(config, PersistentJson) });
        var systems = new Mock<ISistemaRpgRepository>();
        systems.Setup(item => item.GetVersionAsync(seed.Mesa.IdSistemaVersao!.Value, true, false))
            .ReturnsAsync(new SistemaVersao { IdSistemaRpg = systemId });
        var service = new GameBattlePreviewService(runs.Object, systems.Object,
            new GameBattlePreviewFactory(new GameplayActionResolver()), new AutoBattleSimulator(), repository);
        var choices = await service.GetOpponentsAsync(newRunId, seed.Player.Idusuario, default);
        Assert.True(choices.Sucesso, choices.Mensagem);
        Assert.Equal(["Sentinela", "Maga"], choices.Dados!.Select(item => item.Nome).ToArray());
        Assert.Empty(await read.GameCharacterMemories.ToListAsync()); // GET never persists backfill.
        Assert.Empty(await repository.GetCharacterVictoriesAsync(seed.Owner.Idusuario, seed.Character.IdpersonagemJogador, systemId, default));
        Assert.Empty(await repository.GetCharacterVictoriesAsync(seed.Player.Idusuario, -1, systemId, default));
        Assert.Empty(await repository.GetCharacterVictoriesAsync(seed.Player.Idusuario, seed.Character.IdpersonagemJogador, -1, default));
    }
}
