using OdisseiaWiki.Dtos;

namespace OdisseiaWiki.Services.Interfaces;

public interface IGameModeManagementService
{
    Task<IReadOnlyList<GameModeLootOptionDto>> GetLootOptionsAsync(CancellationToken cancellationToken,
        int? idMesa = null, int? idSistemaVersao = null);
    Task<GameRunOperationResult<GameModeEditorDto>> GetAsync(int? idSistemaVersao, CancellationToken cancellationToken);
    Task<IReadOnlyList<GameModeSystemVersionDto>> GetSystemVersionsAsync(CancellationToken cancellationToken);
    Task<IReadOnlyList<GameModeRestOptionDto>> GetRestOptionsAsync(int? idSistemaVersao, CancellationToken cancellationToken);
    Task<IReadOnlyList<GameModeNpcOptionDto>> GetNpcOptionsAsync(int? idSistemaVersao, CancellationToken cancellationToken,
        int? idMesa = null);
    Task<GameRunOperationResult<GameModeEditorDto>> CreateDraftAsync(int? idSistemaVersao, CancellationToken cancellationToken);
    Task<GameRunOperationResult<GameModeEditorDto>> CloneDraftAsync(
        int sourceSystemVersionId, int targetSystemVersionId, CancellationToken cancellationToken);
    Task<GameRunOperationResult<GameModeEditorDto>> SaveDraftAsync(
        int id, GameModeEditorUpdateDto update, CancellationToken cancellationToken, int? idMesa = null);
    Task<GameRunOperationResult<GameModeEditorDto>> PublishAsync(int id, CancellationToken cancellationToken,
        int? idMesa = null);
    Task<bool> CanManageAdventureAsync(int? idMesa, int userId, bool admin, CancellationToken token);
    Task<bool> CanManageDraftAsync(int id, int? idMesa, int userId, bool admin, CancellationToken token);
    Task<bool> CanUseAdventureSystemVersionAsync(int? idMesa, int? versionId, int userId,
        bool admin, CancellationToken token);
    Task<int?> GetAdventureSystemVersionAsync(int? idMesa, int userId, bool admin, CancellationToken token);
    Task<IReadOnlyList<GameModeSystemVersionDto>> GetAdventureSystemVersionsAsync(
        int? idMesa, int userId, bool admin, CancellationToken token);
    Task<IReadOnlyList<GameModeRestOptionDto>> GetRestOptionsForVersionAsync(
        int idSistemaVersao, CancellationToken token);
    Task<IReadOnlyList<GameAdventureDto>> ListAdventuresAsync(
        int? idMesa, int userId, bool admin, CancellationToken token);
    Task<GameRunOperationResult<GameModeEditorDto>> GetAdventureAsync(
        string code, int? idMesa, int? idSistemaVersao, int userId, bool admin, CancellationToken token);
    Task<GameRunOperationResult<GameModeEditorDto>> CreateAdventureAsync(
        GameAdventureCreateDto request, int userId, bool admin, CancellationToken token);
    Task<GameRunOperationResult<GameModeEditorDto>> CreateAdventureDraftAsync(
        string code, int? idMesa, int userId, bool admin, CancellationToken token);
    Task<GameRunOperationResult<GameModeEditorDto>> AdaptAdventureAsync(
        string code, int idMesa, int userId, bool admin, CancellationToken token);
}
