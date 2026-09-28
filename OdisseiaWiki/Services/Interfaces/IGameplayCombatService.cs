using OdisseiaWiki.Dtos;

namespace OdisseiaWiki.Services.Interfaces;

public interface IGameplayCombatService
{
    Task<GameplayOperationResult<GameplayCombatSnapshotDto?>> GetCurrentAsync(int idMesa, long idMesaSessao, int idUsuario, CancellationToken cancellationToken = default);
    Task<GameplayOperationResult<GameplayStateCatalogDto>> GetCatalogAsync(int idMesa, long idMesaSessao, int idUsuario, CancellationToken cancellationToken = default);
    Task<GameplayOperationResult<GameplayCombatCommandResponseDto>> StartAsync(int idMesa, long idMesaSessao, int idUsuario, GameplayCombatStartRequestDto request, CancellationToken cancellationToken = default);
    Task<GameplayOperationResult<GameplayCombatCommandResponseDto>> AddNpcAsync(int idMesa, long idMesaSessao, int idUsuario, GameplayCombatAddNpcRequestDto request, CancellationToken cancellationToken = default);
    Task<GameplayOperationResult<GameplayCombatCommandResponseDto>> RollInitiativeAsync(int idMesa, long idMesaSessao, int idUsuario, GameplayCombatInitiativeRequestDto request, CancellationToken cancellationToken = default);
    Task<GameplayOperationResult<GameplayCombatCommandResponseDto>> ActivateAsync(int idMesa, long idMesaSessao, int idUsuario, GameplayCombatActivateRequestDto request, CancellationToken cancellationToken = default);
    Task<GameplayOperationResult<GameplayCombatCommandResponseDto>> AdvanceAsync(int idMesa, long idMesaSessao, int idUsuario, GameplayCombatAdvanceRequestDto request, CancellationToken cancellationToken = default);
    Task<GameplayOperationResult<GameplayCombatCommandResponseDto>> EndAsync(int idMesa, long idMesaSessao, int idUsuario, GameplayCombatEndRequestDto request, CancellationToken cancellationToken = default);
    Task<GameplayOperationResult<GameplayCombatCommandResponseDto>> ApplyConditionAsync(int idMesa, long idMesaSessao, int idUsuario, GameplayConditionApplyRequestDto request, CancellationToken cancellationToken = default);
    Task<GameplayOperationResult<GameplayCombatCommandResponseDto>> RemoveConditionAsync(int idMesa, long idMesaSessao, int idUsuario, GameplayConditionRemoveRequestDto request, CancellationToken cancellationToken = default);
    Task<GameplayOperationResult<GameplayCombatCommandResponseDto>> ApplyRestAsync(int idMesa, long idMesaSessao, int idUsuario, GameplayRestApplyRequestDto request, CancellationToken cancellationToken = default);
    Task<GameplayOperationResult<GameplayCombatCommandResponseDto>> RollSurvivalAsync(int idMesa, long idMesaSessao, int idUsuario, GameplaySurvivalRollRequestDto request, CancellationToken cancellationToken = default);
}
