using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.GameRuns;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Services;

public sealed class GameRunStatisticsService(IGameRunStatisticsRepository repository) : IGameRunStatisticsService
{
    public async Task<GameRunStatisticsDto> GetAsync(int userId, int? characterId, CancellationToken token)
    {
        Validate(userId, characterId);
        var data = await repository.GetCountsAsync(userId, characterId, token);
        static GameRunStatisticsCountersDto Counters(IEnumerable<GameRunStatisticsCount> rows)
        {
            var values = rows.ToArray();
            long Count(GameRunStatus status) => values.Where(row => row.Status == status).Sum(row => row.Count);
            return new(values.Sum(row => row.Count), Count(GameRunStatus.Vitoria), Count(GameRunStatus.Derrota),
                Count(GameRunStatus.Abandonada), Count(GameRunStatus.Ativa));
        }
        var characters = data.Counts.GroupBy(row => row.CharacterId).OrderBy(group => group.Key).Select(group => {
            var name = data.Characters.FirstOrDefault(row => row.CharacterId == group.Key);
            return new GameRunCharacterStatisticsDto(group.Key, string.IsNullOrWhiteSpace(name?.Name) ? "Personagem" : name.Name,
                name?.Image == "null" ? null : name?.Image, Counters(group));
        }).ToArray();
        return new(Counters(data.Counts), characters);
    }

    public async Task<GameRunVictoryStatisticsPageDto> GetVictoriesAsync(int userId, int? characterId,
        long? before, int limit, CancellationToken token)
    {
        Validate(userId, characterId);
        if (before is <= 0 || limit is < 1 or > 25) throw new ArgumentOutOfRangeException(nameof(limit));
        var data = await repository.GetVictoriesAsync(userId, characterId, before, limit + 1, token);
        var page = data.Runs.Take(limit).Select(run => GameRunVictoryStatistics.Create(run,
            data.Battles.Where(battle => battle.RunId == run.IdGameRun).ToArray())).ToArray();
        return new(page, data.Runs.Count > limit ? page[^1].IdGameRun : null);
    }

    private static void Validate(int userId, int? characterId)
    {
        if (userId <= 0 || characterId is <= 0) throw new ArgumentOutOfRangeException(nameof(characterId));
    }
}
