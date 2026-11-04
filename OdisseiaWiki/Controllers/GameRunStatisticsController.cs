using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OdisseiaWiki.Security;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Controllers;

[ApiController]
[Authorize]
[Route("api/game-runs/statistics")]
public sealed class GameRunStatisticsController(IGameRunStatisticsService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery, Range(1, int.MaxValue)] int? characterId, CancellationToken token)
    {
        int? userId = User.GetUserId();
        if (userId is null or <= 0) return Unauthorized();
        return Ok(await service.GetAsync(userId.Value, characterId, token));
    }

    [HttpGet("victories")]
    public async Task<IActionResult> Victories([FromQuery, Range(1, int.MaxValue)] int? characterId,
        [FromQuery, Range(typeof(long), "1", "9223372036854775807")] long? before,
        [FromQuery, Range(1, 25)] int limit = 10, CancellationToken token = default)
    {
        int? userId = User.GetUserId();
        if (userId is null or <= 0) return Unauthorized();
        return Ok(await service.GetVictoriesAsync(userId.Value, characterId, before, limit, token));
    }
}
