using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Security;
using OdisseiaWiki.Services;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Controllers;

[ApiController]
[Authorize]
[Route("api/game-adventures")]
public sealed class GameAdventuresController : ControllerBase
{
    private readonly IGameModeManagementService _service;
    public GameAdventuresController(IGameModeManagementService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] int? idMesa, CancellationToken token)
    {
        int? userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        if (!await _service.CanManageAdventureAsync(idMesa, userId.Value, User.IsAdmin(), token)) return Forbid();
        return Ok(await _service.ListAdventuresAsync(idMesa, userId.Value, User.IsAdmin(), token));
    }

    [HttpPost]
    [RequestSizeLimit(32 * 1024)]
    public async Task<IActionResult> Create([FromBody] GameAdventureCreateDto request, CancellationToken token)
    {
        int? userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        if (!await _service.CanManageAdventureAsync(request.IdMesa, userId.Value, User.IsAdmin(), token)) return Forbid();
        return Respond(await _service.CreateAdventureAsync(request, userId.Value, User.IsAdmin(), token));
    }

    [HttpGet("{code}")]
    public async Task<IActionResult> Get(string code, [FromQuery] int? idMesa,
        [FromQuery] int? idSistemaVersao, CancellationToken token)
    {
        int? userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        if (!await _service.CanManageAdventureAsync(idMesa, userId.Value, User.IsAdmin(), token)) return Forbid();
        return Respond(await _service.GetAdventureAsync(code, idMesa, idSistemaVersao,
            userId.Value, User.IsAdmin(), token));
    }

    [HttpPost("{code}/draft")]
    public async Task<IActionResult> Draft(string code, [FromQuery] int? idMesa, CancellationToken token)
    {
        int? userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        if (!await _service.CanManageAdventureAsync(idMesa, userId.Value, User.IsAdmin(), token)) return Forbid();
        return Respond(await _service.CreateAdventureDraftAsync(code, idMesa,
            userId.Value, User.IsAdmin(), token));
    }

    [HttpPost("{code}/adapt")]
    public async Task<IActionResult> Adapt(string code, [FromQuery] int? idMesa, CancellationToken token)
    {
        int? userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        if (!await _service.CanManageAdventureAsync(idMesa, userId.Value, User.IsAdmin(), token))
            return Forbid();
        return Respond(await _service.AdaptAdventureAsync(code, idMesa,
            userId.Value, User.IsAdmin(), token));
    }

    [HttpPut("draft/{id:int}")]
    [RequestSizeLimit(128 * 1024)]
    public async Task<IActionResult> Save(int id, [FromQuery] int? idMesa,
        [FromBody] GameModeEditorUpdateDto update, CancellationToken token)
    {
        int? userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        if (!await _service.CanManageDraftAsync(id, idMesa, userId.Value, User.IsAdmin(), token)) return Forbid();
        return Respond(await _service.SaveDraftAsync(id, update, token, idMesa));
    }

    [HttpPost("draft/{id:int}/publish")]
    public async Task<IActionResult> Publish(int id, [FromQuery] int? idMesa, CancellationToken token)
    {
        int? userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        if (!await _service.CanManageDraftAsync(id, idMesa, userId.Value, User.IsAdmin(), token)) return Forbid();
        return Respond(await _service.PublishAsync(id, token, idMesa));
    }

    [HttpGet("npcs")]
    public async Task<IActionResult> Npcs([FromQuery] int? idMesa,
        [FromQuery] int? idSistemaVersao, CancellationToken token)
    {
        int? userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        if (!await _service.CanManageAdventureAsync(idMesa, userId.Value, User.IsAdmin(), token)) return Forbid();
        if (!await _service.CanUseAdventureSystemVersionAsync(idMesa, idSistemaVersao,
            userId.Value, User.IsAdmin(), token)) return BadRequest(new { mensagem = "Versão de Sistema não pertence a um jogo desta Mesa." });
        return Ok(await _service.GetNpcOptionsAsync(idSistemaVersao, token, idMesa));
    }

    [HttpGet("loot-items")]
    public async Task<IActionResult> Loot([FromQuery] int? idMesa,
        [FromQuery] int? idSistemaVersao, CancellationToken token)
    {
        int? userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        if (!await _service.CanManageAdventureAsync(idMesa, userId.Value, User.IsAdmin(), token)) return Forbid();
        if (!await _service.CanUseAdventureSystemVersionAsync(idMesa, idSistemaVersao,
            userId.Value, User.IsAdmin(), token)) return BadRequest(new { mensagem = "Versão de Sistema não pertence a um jogo desta Mesa." });
        return Ok(await _service.GetLootOptionsAsync(token, idMesa, idSistemaVersao));
    }

    [HttpGet("system-versions")]
    public async Task<IActionResult> SystemVersions([FromQuery] int? idMesa, CancellationToken token)
    {
        int? userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        int? versionId = await _service.GetAdventureSystemVersionAsync(idMesa, userId.Value, User.IsAdmin(), token);
        if (versionId is null) return Forbid();
        return Ok(await _service.GetAdventureSystemVersionsAsync(idMesa, userId.Value, User.IsAdmin(), token));
    }

    [HttpGet("rest-options")]
    public async Task<IActionResult> RestOptions([FromQuery] int? idMesa,
        [FromQuery] int? idSistemaVersao, CancellationToken token)
    {
        int? userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        int? current = await _service.GetAdventureSystemVersionAsync(idMesa, userId.Value, User.IsAdmin(), token);
        if (current is null) return Forbid();
        if (!await _service.CanUseAdventureSystemVersionAsync(idMesa, idSistemaVersao,
            userId.Value, User.IsAdmin(), token)) return BadRequest(new { mensagem = "Versão de Sistema não pertence a um jogo desta Mesa." });
        return Ok(await _service.GetRestOptionsForVersionAsync(idSistemaVersao ?? current.Value, token));
    }

    private IActionResult Respond(GameRunOperationResult<GameModeEditorDto> result) =>
        result.Sucesso ? Ok(result.Dados) : BadRequest(new { result.Codigo, result.Mensagem });
}
