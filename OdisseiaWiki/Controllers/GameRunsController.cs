using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Security;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Controllers;

[ApiController]
[Authorize]
[Route("api/game-runs")]
public sealed class GameRunsController : ControllerBase
{
    private readonly IGameRunService _service;

    public GameRunsController(IGameRunService service) => _service = service;

    [HttpGet("characters")]
    public async Task<IActionResult> GetCharacters(CancellationToken cancellationToken)
    {
        int? idUsuario = User.GetUserId();
        if (!idUsuario.HasValue)
            return Unauthorized();
        return Ok(await _service.GetCharactersAsync(idUsuario.Value, cancellationToken));
    }

    [HttpGet("active")]
    public async Task<IActionResult> GetActive(CancellationToken cancellationToken)
    {
        int? idUsuario = User.GetUserId();
        if (!idUsuario.HasValue)
            return Unauthorized();
        GameRunDto? run = await _service.GetActiveAsync(idUsuario.Value, cancellationToken);
        return run is null ? NoContent() : Ok(run);
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id, CancellationToken cancellationToken)
    {
        int? idUsuario = User.GetUserId();
        if (!idUsuario.HasValue)
            return Unauthorized();
        GameRunDto? run = await _service.GetByIdAsync(id, idUsuario.Value, cancellationToken);
        return run is null ? NotFound() : Ok(run);
    }

    [HttpPost]
    [RequestSizeLimit(32 * 1024)]
    public async Task<IActionResult> Create(
        [FromBody] GameRunCreateRequestDto request,
        CancellationToken cancellationToken)
    {
        int? idUsuario = User.GetUserId();
        if (!idUsuario.HasValue)
            return Unauthorized();
        GameRunOperationResult<GameRunDto> result = await _service.CreateAsync(
            idUsuario.Value, request, cancellationToken);
        if (!result.Sucesso)
            return MapFailure(result);
        return result.Repetido
            ? Ok(result.Dados)
            : CreatedAtAction(nameof(GetById), new { id = result.Dados!.IdGameRun }, result.Dados);
    }

    [HttpPost("{id:long}/abandon")]
    [RequestSizeLimit(32 * 1024)]
    public async Task<IActionResult> Abandon(
        long id,
        [FromBody] GameRunAbandonRequestDto request,
        CancellationToken cancellationToken)
    {
        int? idUsuario = User.GetUserId();
        if (!idUsuario.HasValue)
            return Unauthorized();
        GameRunOperationResult<GameRunDto> result = await _service.AbandonAsync(
            id, idUsuario.Value, request, cancellationToken);
        return result.Sucesso ? Ok(result.Dados) : MapFailure(result);
    }

    [HttpPost("{id:long}/restart")]
    [RequestSizeLimit(32 * 1024)]
    public async Task<IActionResult> Restart(
        long id,
        [FromBody] GameRunRestartRequestDto request,
        CancellationToken cancellationToken)
    {
        int? idUsuario = User.GetUserId();
        if (!idUsuario.HasValue)
            return Unauthorized();
        GameRunOperationResult<GameRunDto> result = await _service.RestartAsync(
            id, idUsuario.Value, request, cancellationToken);
        return result.Sucesso ? Ok(result.Dados) : MapFailure(result);
    }

    private IActionResult MapFailure(GameRunOperationResult<GameRunDto> result)
    {
        object error = new { result.Codigo, result.Mensagem };
        return result.Codigo switch
        {
            "PERSONAGEM_NAO_ENCONTRADO" or "RUN_NAO_ENCONTRADA" or
                "USUARIO_NAO_ENCONTRADO" => NotFound(error),
            "RUN_ATIVA_EXISTENTE" or "RUN_ENCERRADA" or
                "REVISAO_DESATUALIZADA" or "CHAVE_IDEMPOTENCIA_REUTILIZADA" => Conflict(error),
            _ => BadRequest(error),
        };
    }
}
