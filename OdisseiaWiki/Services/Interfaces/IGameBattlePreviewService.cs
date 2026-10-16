using OdisseiaWiki.Dtos;

namespace OdisseiaWiki.Services.Interfaces;

public interface IGameBattlePreviewService
{
    Task<GameRunOperationResult<GameBattlePreviewDto>> PreviewAsync(
        long idGameRun, int idUsuario, CancellationToken cancellationToken);
}
