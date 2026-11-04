using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories;
using OdisseiaWiki.Services;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed partial class GameplayMariaDbIntegrationTests
{
    [Fact]
    public async Task Statistics_PersistAcrossContextsAreOwnedIncludeOldRunsAndSurviveCharacterDeletion()
    {
        if (!TestDatabase.Enabled) return;
        await using var database = await TestDatabase.CreateAsync();
        var seed = await database.SeedAsync(includeCharacter: true);
        int characterId = seed.Character!.IdpersonagemJogador;
        long victoryId;
        await using (var context = database.CreateContext())
        {
            var mode = new GameModeVersion { Codigo = "STATISTICS", Nome = "Aventura de teste", NumeroVersao = "1.0",
                Status = GameModeVersionStatus.Publicado, IdSistemaVersao = seed.Mesa.IdSistemaVersao!.Value, ConfiguracaoJson = "{}" };
            context.GameModeVersions.Add(mode); await context.SaveChangesAsync();
            GameRun Run(int userId, int source, GameRunStatus status) => new() {
                IdUsuario = userId, IdPersonagemJogadorOrigem = source, IdGameModeVersion = mode.IdGameModeVersion,
                IdSistemaVersao = mode.IdSistemaVersao, Status = status, Fase = 1,
                SnapshotInicialJson = """{"nome":"Ada","imagem":null}""",
                EstadoAtualJson = """{"status":{"xpConquistadoRun":7,"lootItensObtidos":3},"economy":{"balance":100}}""",
                EncerradaEmUtc = status == GameRunStatus.Ativa ? null : DateTime.UtcNow,
            };
            var victory = Run(seed.Player.Idusuario, characterId, GameRunStatus.Vitoria);
            context.GameRuns.AddRange(victory, Run(seed.Player.Idusuario, characterId, GameRunStatus.Derrota),
                Run(seed.Player.Idusuario, characterId, GameRunStatus.Abandonada),
                Run(seed.Player.Idusuario, characterId + 1000, GameRunStatus.Vitoria),
                Run(seed.Player.Idusuario, characterId + 1000, GameRunStatus.Ativa),
                Run(seed.Owner.Idusuario, characterId, GameRunStatus.Vitoria));
            await context.SaveChangesAsync(); victoryId = victory.IdGameRun;
            context.GameRunBattles.Add(new() { IdGameRun = victoryId, NoId = "boss", VencedorId = "player",
                ResultadoJson = """{"personagem":{"id":"player"},"xpConcedido":7,"moedaConcedida":50,"oponentes":[{"nome":"Maga","imagem":"/maga.png"},{"nome":"Caçador"}],"resultado":{"events":[{"largeReplayField":"never projected"}]}}""",
                EstadoAntesJson = "{}", EstadoDepoisJson = "{}" });
            await context.SaveChangesAsync();
        }
        await using (var context = database.CreateContext())
        {
            var service = new GameRunStatisticsService(new GameRunStatisticsRepository(context));
            var result = await service.GetAsync(seed.Player.Idusuario, null, default);
            Assert.Equal(5, result.Geral.Total); Assert.Equal(2, result.Geral.Vencidas);
            Assert.Equal(2, result.Geral.Perdidas); Assert.Equal(1, result.Geral.EmAndamento); Assert.Equal(2, result.Personagens.Count);
            Assert.All(result.Personagens, row => { Assert.Equal("Ada", row.Nome); Assert.Null(row.Imagem); });
            var filtered = await service.GetAsync(seed.Player.Idusuario, characterId, default);
            Assert.Equal(3, filtered.Geral.Total);
            var victory = Assert.Single((await service.GetVictoriesAsync(seed.Player.Idusuario, characterId, null, 10, default)).Vitorias);
            Assert.Equal(victoryId, victory.IdGameRun); Assert.Equal(2, victory.InimigosDerrotados); Assert.Equal(50, victory.MoedasEmCombates);
            Assert.Equal(7, victory.XpConquistado); Assert.Equal(3, victory.ItensObtidos); Assert.Equal("/maga.png", victory.Inimigos[0].Imagem);
            var first = await service.GetVictoriesAsync(seed.Player.Idusuario, null, null, 1, default);
            Assert.NotNull(first.ProximoCursor); Assert.True(Assert.Single(first.Vitorias).IdGameRun > victoryId);
            var second = await service.GetVictoriesAsync(seed.Player.Idusuario, null, first.ProximoCursor, 1, default);
            Assert.Equal(victoryId, Assert.Single(second.Vitorias).IdGameRun); Assert.Null(second.ProximoCursor);
            Assert.Empty(context.ChangeTracker.Entries());
            await new PersonagemJogadorRepository(context).DeleteAsync(characterId);
        }
        await using (var context = database.CreateContext())
        {
            var service = new GameRunStatisticsService(new GameRunStatisticsRepository(context));
            Assert.Equal(3, (await service.GetAsync(seed.Player.Idusuario, characterId, default)).Geral.Total);
            Assert.Single((await service.GetVictoriesAsync(seed.Player.Idusuario, characterId, null, 10, default)).Vitorias);
            Assert.Equal(0, (await service.GetAsync(seed.Owner.Idusuario, characterId + 1000, default)).Geral.Total);
            Assert.Equal(1, (await service.GetAsync(seed.Owner.Idusuario, null, default)).Geral.Total);
            Assert.NotEqual(victoryId, Assert.Single((await service.GetVictoriesAsync(seed.Owner.Idusuario, null, null, 10, default)).Vitorias).IdGameRun);
        }
    }
}
