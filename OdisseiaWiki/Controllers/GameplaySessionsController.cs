using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Security;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Controllers;

[ApiController]
[Authorize]
[Route("api/mesas/{idMesa:int}/sessoes")]
public sealed class GameplaySessionsController : ControllerBase
{
    private readonly IGameplayEngineService _service;

    public GameplaySessionsController(IGameplayEngineService service)
    {
        _service = service;
    }

    [HttpGet("atual")]
    [EnableRateLimiting("gameplay-read")]
    public async Task<IActionResult> GetCurrent(
        int idMesa,
        CancellationToken cancellationToken)
    {
        int? idUsuario = User.GetUserId();
        if (!idUsuario.HasValue)
            return Unauthorized();
        GameplayOperationResult<GameplaySessionDto?> result = await _service.GetCurrentSessionAsync(
            idMesa,
            idUsuario.Value,
            cancellationToken);
        if (!result.Sucesso)
            return MapFailure(result);
        return result.Dados is null ? NoContent() : Ok(result.Dados);
    }

    [HttpPost("iniciar")]
    [RequestSizeLimit(32 * 1024)]
    public async Task<IActionResult> Start(
        int idMesa,
        [FromBody] GameplaySessionStartRequestDto request,
        CancellationToken cancellationToken)
    {
        int? idUsuario = User.GetUserId();
        if (!idUsuario.HasValue)
            return Unauthorized();
        GameplayOperationResult<GameplayCommandResponseDto> result = await _service.StartSessionAsync(
            idMesa,
            idUsuario.Value,
            request,
            cancellationToken);
        return result.Sucesso ? Ok(result.Dados) : MapFailure(result);
    }

    [HttpPost("{idMesaSessao:long}/encerrar")]
    [RequestSizeLimit(32 * 1024)]
    public async Task<IActionResult> End(
        int idMesa,
        long idMesaSessao,
        [FromBody] GameplaySessionEndRequestDto request,
        CancellationToken cancellationToken)
    {
        int? idUsuario = User.GetUserId();
        if (!idUsuario.HasValue)
            return Unauthorized();
        GameplayOperationResult<GameplayCommandResponseDto> result = await _service.EndSessionAsync(
            idMesa,
            idMesaSessao,
            idUsuario.Value,
            request,
            cancellationToken);
        return result.Sucesso ? Ok(result.Dados) : MapFailure(result);
    }

    [HttpPost("{idMesaSessao:long}/rolagens")]
    [RequestSizeLimit(32 * 1024)]
    public async Task<IActionResult> Roll(
        int idMesa,
        long idMesaSessao,
        [FromBody] GameplayRollRequestDto request,
        CancellationToken cancellationToken)
    {
        int? idUsuario = User.GetUserId();
        if (!idUsuario.HasValue)
            return Unauthorized();
        GameplayOperationResult<GameplayCommandResponseDto> result = await _service.RollAsync(
            idMesa,
            idMesaSessao,
            idUsuario.Value,
            request,
            cancellationToken);
        return result.Sucesso ? Ok(result.Dados) : MapFailure(result);
    }

    [HttpPost("{idMesaSessao:long}/registros-manuais")]
    [RequestSizeLimit(32 * 1024)]
    public async Task<IActionResult> RegisterManual(
        int idMesa,
        long idMesaSessao,
        [FromBody] GameplayManualRecordRequestDto request,
        CancellationToken cancellationToken)
    {
        int? idUsuario = User.GetUserId();
        if (!idUsuario.HasValue)
            return Unauthorized();
        GameplayOperationResult<GameplayCommandResponseDto> result = await _service.RegisterManualAsync(
            idMesa,
            idMesaSessao,
            idUsuario.Value,
            request,
            cancellationToken);
        return result.Sucesso ? Ok(result.Dados) : MapFailure(result);
    }

    [HttpGet("{idMesaSessao:long}/eventos")]
    [EnableRateLimiting("gameplay-read")]
    public async Task<IActionResult> GetEvents(
        int idMesa,
        long idMesaSessao,
        [FromQuery] string? cursor,
        [FromQuery] int limite = 30,
        CancellationToken cancellationToken = default)
    {
        int? idUsuario = User.GetUserId();
        if (!idUsuario.HasValue)
            return Unauthorized();
        GameplayOperationResult<GameplayEventPageDto> result = await _service.GetEventsAsync(
            idMesa,
            idMesaSessao,
            idUsuario.Value,
            cursor,
            limite,
            cancellationToken);
        return result.Sucesso ? Ok(result.Dados) : MapFailure(result);
    }

    private ObjectResult MapFailure<T>(GameplayOperationResult<T> result)
    {
        int status = result.Erro switch
        {
            GameplayOperationError.NaoEncontrado => StatusCodes.Status404NotFound,
            GameplayOperationError.Proibido => StatusCodes.Status403Forbidden,
            GameplayOperationError.Conflito => StatusCodes.Status409Conflict,
            GameplayOperationError.RegraNaoPermitida => StatusCodes.Status422UnprocessableEntity,
            GameplayOperationError.LimiteTaxa => StatusCodes.Status429TooManyRequests,
            _ => StatusCodes.Status400BadRequest,
        };
        ProblemDetails problem = new()
        {
            Status = status,
            Title = status == StatusCodes.Status409Conflict ? "Conflito de gameplay" : "Ação de gameplay inválida",
            Detail = result.Mensagem,
            Instance = HttpContext.Request.Path,
        };
        problem.Extensions["code"] = result.Codigo;
        problem.Extensions["traceId"] = HttpContext.TraceIdentifier;
        if (result.RetryAfterSeconds is int retryAfter)
        {
            Response.Headers.RetryAfter = retryAfter.ToString();
            problem.Extensions["retryAfter"] = retryAfter;
        }
        return StatusCode(status, problem);
    }
}

[ApiController]
[Authorize]
[Route("api/personagens-jogador/{idPersonagemJogador:int}/rolagens")]
public sealed class GameplaySimulationsController : ControllerBase
{
    private readonly IGameplayEngineService _service;

    public GameplaySimulationsController(IGameplayEngineService service)
    {
        _service = service;
    }

    [HttpPost("simular")]
    [EnableRateLimiting("gameplay-simulation")]
    [RequestSizeLimit(32 * 1024)]
    public async Task<IActionResult> Simulate(
        int idPersonagemJogador,
        [FromBody] GameplayRollRequestDto request,
        CancellationToken cancellationToken)
    {
        int? idUsuario = User.GetUserId();
        if (!idUsuario.HasValue)
            return Unauthorized();
        GameplayOperationResult<GameplaySimulationResponseDto> result = await _service.SimulateAsync(
            idPersonagemJogador,
            idUsuario.Value,
            request,
            cancellationToken);
        if (result.Sucesso)
            return Ok(result.Dados);

        int status = result.Erro switch
        {
            GameplayOperationError.NaoEncontrado => StatusCodes.Status404NotFound,
            GameplayOperationError.Proibido => StatusCodes.Status403Forbidden,
            GameplayOperationError.Conflito => StatusCodes.Status409Conflict,
            GameplayOperationError.RegraNaoPermitida => StatusCodes.Status422UnprocessableEntity,
            GameplayOperationError.LimiteTaxa => StatusCodes.Status429TooManyRequests,
            _ => StatusCodes.Status400BadRequest,
        };
        ProblemDetails problem = new()
        {
            Status = status,
            Title = "Simulação inválida",
            Detail = result.Mensagem,
            Instance = HttpContext.Request.Path,
        };
        problem.Extensions["code"] = result.Codigo;
        problem.Extensions["traceId"] = HttpContext.TraceIdentifier;
        if (result.RetryAfterSeconds is int retryAfter)
        {
            Response.Headers.RetryAfter = retryAfter.ToString();
            problem.Extensions["retryAfter"] = retryAfter;
        }
        return StatusCode(status, problem);
    }
}
