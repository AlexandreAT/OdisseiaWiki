using OdisseiaWiki.Dtos;

namespace OdisseiaWiki.Services.Interfaces;

public interface IGameRunStatisticsService
{
    Task<GameRunStatisticsDto> GetAsync(int userId, int? characterId, CancellationToken token);
    Task<GameRunVictoryStatisticsPageDto> GetVictoriesAsync(int userId, int? characterId,
        long? before, int limit, CancellationToken token);
}
