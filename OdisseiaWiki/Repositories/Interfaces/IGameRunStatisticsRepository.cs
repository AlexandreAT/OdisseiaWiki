using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;

namespace OdisseiaWiki.Repositories.Interfaces;

public sealed record GameRunStatisticsCount(int CharacterId, GameRunStatus Status, long Count, long LatestRunId);
public sealed record GameRunStatisticsCharacter(int CharacterId, string? Name, string? Image);
public sealed record GameRunStatisticsData(IReadOnlyList<GameRunStatisticsCount> Counts,
    IReadOnlyList<GameRunStatisticsCharacter> Characters);
public sealed record GameRunVictoryBattleData(long RunId, string? WinnerId, string? PlayerId,
    int? Xp, int? Currency, string? EnemiesJson, string? EnemyJson);
public sealed record GameRunVictoryStatisticsData(IReadOnlyList<GameRun> Runs,
    IReadOnlyList<GameRunVictoryBattleData> Battles);

public interface IGameRunStatisticsRepository
{
    Task<GameRunStatisticsData> GetCountsAsync(int userId, int? characterId, CancellationToken token);
    Task<GameRunVictoryStatisticsData> GetVictoriesAsync(int userId, int? characterId,
        long? before, int take, CancellationToken token);
}
