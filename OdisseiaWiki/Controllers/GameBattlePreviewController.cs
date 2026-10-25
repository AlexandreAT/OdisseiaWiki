using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Security;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Controllers;

[ApiController]
[Authorize]
[Route("api/game-runs/{idGameRun:long}/battles/preview")]
public sealed class GameBattlePreviewController : ControllerBase
{
    private readonly IGameBattlePreviewService _service;

    public GameBattlePreviewController(IGameBattlePreviewService service)
    {
        _service = service;
    }

    [HttpGet]
    [HttpPost]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<ActionResult<GameBattlePreviewDto>> Preview(
        long idGameRun, CancellationToken cancellationToken, [FromQuery] string? enemyKey = null)
    {
        int? userId = User.GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        GameRunOperationResult<GameBattlePreviewDto> result = enemyKey is null
            ? await _service.PreviewAsync(idGameRun, userId.Value, cancellationToken)
            : await _service.PreviewAsync(idGameRun, userId.Value, enemyKey, cancellationToken);
        if (result.Sucesso && result.Dados is not null)
            return Ok(result.Dados);
        if (result.Codigo == "RUN_NAO_ENCONTRADA")
            return NotFound(new { result.Codigo, result.Mensagem });
        return Conflict(new { result.Codigo, result.Mensagem });
    }

    [HttpGet("opponents")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> Opponents(long idGameRun, CancellationToken token)
    {
        int? userId = User.GetUserId();
        if (!userId.HasValue) return Unauthorized();
        var result = await _service.GetOpponentsAsync(idGameRun, userId.Value, token);
        if (result.Sucesso) return Ok(result.Dados);
        if (result.Codigo == "RUN_NAO_ENCONTRADA") return NotFound(new { result.Codigo, result.Mensagem });
        return Conflict(new { result.Codigo, result.Mensagem });
    }
}
