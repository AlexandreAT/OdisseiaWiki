using OdisseiaWiki.Dtos;

namespace OdisseiaWiki.Services.Interfaces;

public interface IGameRunService
{
    Task<IReadOnlyList<GameRunCharacterOptionDto>> GetCharactersAsync(
        int idUsuario, CancellationToken cancellationToken);
    Task<IReadOnlyList<GameAdventureDto>> GetCharacterGamesAsync(
        int idUsuario, int idPersonagemJogador, CancellationToken cancellationToken);
    Task<GameRunDto?> GetActiveAsync(int idUsuario, CancellationToken cancellationToken);
    Task<GameRunDto?> GetByIdAsync(long idGameRun, int idUsuario, CancellationToken cancellationToken);
    Task<GameRunOperationResult<GameRunDto>> CreateAsync(
        int idUsuario, GameRunCreateRequestDto request, CancellationToken cancellationToken);
    Task<GameRunOperationResult<GameRunDto>> AbandonAsync(
        long idGameRun, int idUsuario, GameRunAbandonRequestDto request, CancellationToken cancellationToken);
    Task<GameRunOperationResult<GameRunDto>> RestartAsync(
        long idGameRun, int idUsuario, GameRunRestartRequestDto request, CancellationToken cancellationToken);
}
