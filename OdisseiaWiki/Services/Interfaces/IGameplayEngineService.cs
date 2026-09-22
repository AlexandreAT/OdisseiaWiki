using OdisseiaWiki.Dtos;

namespace OdisseiaWiki.Services.Interfaces;

public interface IGameplayEngineService
{
    Task<GameplayOperationResult<GameplaySessionDto?>> GetCurrentSessionAsync(
        int idMesa, int idUsuario, CancellationToken cancellationToken = default);
    Task<GameplayOperationResult<GameplayCommandResponseDto>> StartSessionAsync(
        int idMesa, int idUsuario, GameplaySessionStartRequestDto request,
        CancellationToken cancellationToken = default);
    Task<GameplayOperationResult<GameplayCommandResponseDto>> EndSessionAsync(
        int idMesa, long idMesaSessao, int idUsuario, GameplaySessionEndRequestDto request,
        CancellationToken cancellationToken = default);
    Task<GameplayOperationResult<GameplayCommandResponseDto>> RollAsync(
        int idMesa, long idMesaSessao, int idUsuario, GameplayRollRequestDto request,
        CancellationToken cancellationToken = default);
    Task<GameplayOperationResult<GameplayCommandResponseDto>> RegisterManualAsync(
        int idMesa, long idMesaSessao, int idUsuario, GameplayManualRecordRequestDto request,
        CancellationToken cancellationToken = default);
    Task<GameplayOperationResult<GameplayEventPageDto>> GetEventsAsync(
        int idMesa, long idMesaSessao, int idUsuario, string? cursor, int limit,
        CancellationToken cancellationToken = default);
    Task<GameplayOperationResult<GameplaySimulationResponseDto>> SimulateAsync(
        int idPersonagemJogador, int idUsuario, GameplayRollRequestDto request,
        CancellationToken cancellationToken = default);
    Task<GameplayOperationResult<GameplaySessionDto?>> SetLegacyLiveStatusAsync(
        int idMesa, int idUsuario, bool aoVivo, CancellationToken cancellationToken = default);
}
