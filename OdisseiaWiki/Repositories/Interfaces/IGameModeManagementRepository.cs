using OdisseiaWiki.Models;
using OdisseiaWiki.Dtos;

namespace OdisseiaWiki.Repositories.Interfaces;

public interface IGameModeManagementRepository
{
    Task<IReadOnlyList<Item>> GetLootItemsAsync(CancellationToken cancellationToken);
    Task<int?> GetCurrentSystemVersionIdAsync(CancellationToken cancellationToken);
    Task<IReadOnlyList<GameModeSystemVersionDto>> GetSystemVersionsAsync(CancellationToken cancellationToken);
    Task<GameModeVersion?> GetDraftByIdAsync(int id, CancellationToken cancellationToken);
    Task<IReadOnlyList<string>> GetAttackOutcomeCodesAsync(int idSistemaVersao, CancellationToken cancellationToken);
    Task<string> GetDraftTemplateJsonAsync(CancellationToken cancellationToken);
    Task<IReadOnlyList<Personagen>> GetNpcCandidatesAsync(CancellationToken cancellationToken);
    Task<Personagen?> GetNpcAsync(int id, CancellationToken cancellationToken);
    Task<GameModeVersion?> GetLatestModeAsync(int idSistemaVersao, CancellationToken cancellationToken);
    Task<GameModeVersion?> GetDraftAsync(int idSistemaVersao, CancellationToken cancellationToken);
    Task<int> GetNextRevisionAsync(int idSistemaVersao, CancellationToken cancellationToken);
    Task AddAsync(GameModeVersion mode, CancellationToken cancellationToken);
    Task SaveAsync(CancellationToken cancellationToken);
}
