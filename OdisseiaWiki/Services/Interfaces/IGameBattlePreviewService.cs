using OdisseiaWiki.Dtos;

namespace OdisseiaWiki.Services.Interfaces;

public interface IGameBattlePreviewService
{
    Task<GameRunOperationResult<GameBattlePreviewDto>> PreviewAsync(
        long idGameRun, int idUsuario, CancellationToken cancellationToken);
    Task<GameRunOperationResult<GameBattlePreviewDto>> PreviewAsync(
        long idGameRun, int idUsuario, string enemyKey, CancellationToken cancellationToken);
    Task<GameRunOperationResult<IReadOnlyList<GameTrainingEnemyDto>>> GetOpponentsAsync(
        long idGameRun, int idUsuario, CancellationToken cancellationToken);
}
