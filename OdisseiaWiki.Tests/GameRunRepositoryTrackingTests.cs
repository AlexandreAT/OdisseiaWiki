using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Data;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class GameRunRepositoryTrackingTests
{
    private static OdisseiaContext CreateContext() => new(new DbContextOptionsBuilder<OdisseiaContext>()
        .UseMySql("Server=localhost;Database=tracking_only;User=unused;Password=unused",
            new MySqlServerVersion(new Version(8, 0, 36))).Options);

    [Fact]
    public void AdicionarGrafoSemAnexarPublicacaoReproduzTentativaDeInsercaoDuplicada()
    {
        using var context = CreateContext();
        var mode = new GameModeVersion { IdGameModeVersion = 25, IdSistemaVersao = 7,
            Codigo = "JOGO", NumeroVersao = "1.0", ConfiguracaoJson = "{}" };
        context.GameRuns.Add(new GameRun { IdGameModeVersion = 25, IdSistemaVersao = 7,
            GameModeVersion = mode, SnapshotInicialJson = "{}", EstadoAtualJson = "{}" });
        Assert.Equal(EntityState.Added, context.Entry(mode).State);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task CriarRunNaoInsereNovamenteVersaoPublicada(bool alreadyTracked)
    {
        await using var context = CreateContext();
        var mode = new GameModeVersion { IdGameModeVersion = 25, IdSistemaVersao = 7,
            Codigo = "JOGO", NumeroVersao = "1.0", ConfiguracaoJson = "{}",
            Status = GameModeVersionStatus.Publicado };
        if (alreadyTracked) context.Attach(mode);
        var detachedCopy = new GameModeVersion { IdGameModeVersion = 25, IdSistemaVersao = 7,
            Codigo = "JOGO", NumeroVersao = "1.0", ConfiguracaoJson = "{}",
            Status = GameModeVersionStatus.Publicado };
        var run = new GameRun { IdGameModeVersion = 25, IdSistemaVersao = 7,
            GameModeVersion = detachedCopy, SnapshotInicialJson = "{}", EstadoAtualJson = "{}" };

        await new GameRunRepository(context).AddRunAsync(run, default);

        Assert.Equal(EntityState.Added, context.Entry(run).State);
        var trackedMode = Assert.Single(context.ChangeTracker.Entries<GameModeVersion>());
        Assert.Equal(EntityState.Unchanged, trackedMode.State);
        Assert.DoesNotContain(context.ChangeTracker.Entries(), entry =>
            entry.Entity is GameModeVersion && entry.State == EntityState.Added);
        if (alreadyTracked) Assert.Same(mode, run.GameModeVersion);
    }
}
