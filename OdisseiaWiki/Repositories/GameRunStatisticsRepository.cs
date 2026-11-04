using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Data;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;

namespace OdisseiaWiki.Repositories;

/// <summary>Persisted runs are the ledger. No mutable, potentially drifting counters or duplicate archives.</summary>
public sealed class GameRunStatisticsRepository(OdisseiaContext context) : IGameRunStatisticsRepository
{
    private IQueryable<GameRun> Owned(int userId, int? characterId) => context.GameRuns.AsNoTracking()
        .Where(run => run.IdUsuario == userId && (!characterId.HasValue || run.IdPersonagemJogadorOrigem == characterId.Value));

    public async Task<GameRunStatisticsData> GetCountsAsync(int userId, int? characterId, CancellationToken token)
    {
        var counts = await Owned(userId, characterId).GroupBy(run => new { run.IdPersonagemJogadorOrigem, run.Status })
            .Select(group => new GameRunStatisticsCount(group.Key.IdPersonagemJogadorOrigem, group.Key.Status,
                group.LongCount(), group.Max(run => run.IdGameRun))).ToListAsync(token);
        var latest = counts.GroupBy(row => row.CharacterId).Select(group => group.Max(row => row.LatestRunId)).ToArray();
        if (latest.Length == 0) return new(counts, []);
        // Only extract presentation fields. Never sort/load complete snapshots or join today's character sheet.
        var names = await Owned(userId, characterId).Where(run => latest.Contains(run.IdGameRun))
            .Select(run => new GameRunStatisticsCharacter(run.IdPersonagemJogadorOrigem,
                EF.Functions.JsonUnquote(EF.Functions.JsonExtract<string>(run.SnapshotInicialJson, "$.nome")),
                EF.Functions.JsonUnquote(EF.Functions.JsonExtract<string>(run.SnapshotInicialJson, "$.imagem"))))
            .ToListAsync(token);
        return new(counts, names);
    }

    public async Task<GameRunVictoryStatisticsData> GetVictoriesAsync(int userId, int? characterId,
        long? before, int take, CancellationToken token)
    {
        // Paginate narrow scalar rows first: ordering large JSON/replay columns exhausts MySQL's sort buffer.
        var ids = await Owned(userId, characterId).Where(run => run.Status == GameRunStatus.Vitoria &&
                (!before.HasValue || run.IdGameRun < before.Value))
            .OrderByDescending(run => run.IdGameRun).Select(run => run.IdGameRun).Take(take).ToArrayAsync(token);
        if (ids.Length == 0) return new([], []);
        var runs = await Owned(userId, characterId).Where(run => ids.Contains(run.IdGameRun) && run.Status == GameRunStatus.Vitoria)
            .Select(run => new GameRun {
                IdGameRun = run.IdGameRun, IdPersonagemJogadorOrigem = run.IdPersonagemJogadorOrigem,
                IdGameModeVersion = run.IdGameModeVersion, IdSistemaVersao = run.IdSistemaVersao,
                Status = run.Status, Seed = run.Seed, Fase = run.Fase, CriadaEmUtc = run.CriadaEmUtc, EncerradaEmUtc = run.EncerradaEmUtc,
                SnapshotInicialJson = run.SnapshotInicialJson, EstadoAtualJson = run.EstadoAtualJson, MapaJson = run.MapaJson,
                GameModeVersion = new GameModeVersion { Codigo = run.GameModeVersion.Codigo, Nome = run.GameModeVersion.Nome,
                    NumeroVersao = run.GameModeVersion.NumeroVersao },
                SistemaVersao = new SistemaVersao { NumeroVersao = run.SistemaVersao.NumeroVersao },
            }).ToListAsync(token);
        var battles = await context.GameRunBattles.AsNoTracking()
            .Where(battle => ids.Contains(battle.IdGameRun) && battle.Run.IdUsuario == userId &&
                battle.Run.Status == GameRunStatus.Vitoria &&
                (!characterId.HasValue || battle.Run.IdPersonagemJogadorOrigem == characterId.Value))
            .Select(battle => new { battle.IdGameRun, battle.VencedorId,
                PlayerId = EF.Functions.JsonUnquote(EF.Functions.JsonExtract<string>(battle.ResultadoJson, "$.personagem.id")),
                Xp = EF.Functions.JsonUnquote(EF.Functions.JsonExtract<string>(battle.ResultadoJson, "$.xpConcedido")),
                Currency = EF.Functions.JsonUnquote(EF.Functions.JsonExtract<string>(battle.ResultadoJson, "$.moedaConcedida")),
                Enemies = EF.Functions.JsonExtract<string>(battle.ResultadoJson, "$.oponentes"),
                Enemy = EF.Functions.JsonExtract<string>(battle.ResultadoJson, "$.oponente") })
            .ToListAsync(token);
        // MySQL returns JSON_EXTRACT as JSON even for numbers; read compact text, never GetInt32 on a JSON column.
        static int? Integer(string? text) => int.TryParse(text, out int value) ? value : null;
        return new(runs.OrderByDescending(run => run.IdGameRun).ToArray(), battles.Select(battle =>
            new GameRunVictoryBattleData(battle.IdGameRun, battle.VencedorId, battle.PlayerId,
                Integer(battle.Xp), Integer(battle.Currency), battle.Enemies, battle.Enemy)).ToArray());
    }
}
