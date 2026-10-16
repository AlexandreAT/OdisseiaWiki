using OdisseiaWiki.Dtos;

namespace OdisseiaWiki.Services.Interfaces;

public interface IGameModeManagementService
{
    Task<IReadOnlyList<GameModeLootOptionDto>> GetLootOptionsAsync(CancellationToken cancellationToken);
    Task<GameRunOperationResult<GameModeEditorDto>> GetAsync(int? idSistemaVersao, CancellationToken cancellationToken);
    Task<IReadOnlyList<GameModeSystemVersionDto>> GetSystemVersionsAsync(CancellationToken cancellationToken);
    Task<IReadOnlyList<GameModeRestOptionDto>> GetRestOptionsAsync(int? idSistemaVersao, CancellationToken cancellationToken);
    Task<IReadOnlyList<GameModeNpcOptionDto>> GetNpcOptionsAsync(int? idSistemaVersao, CancellationToken cancellationToken);
    Task<GameRunOperationResult<GameModeEditorDto>> CreateDraftAsync(int? idSistemaVersao, CancellationToken cancellationToken);
    Task<GameRunOperationResult<GameModeEditorDto>> CloneDraftAsync(
        int sourceSystemVersionId, int targetSystemVersionId, CancellationToken cancellationToken);
    Task<GameRunOperationResult<GameModeEditorDto>> SaveDraftAsync(
        int id, GameModeEditorUpdateDto update, CancellationToken cancellationToken);
    Task<GameRunOperationResult<GameModeEditorDto>> PublishAsync(int id, CancellationToken cancellationToken);
}
