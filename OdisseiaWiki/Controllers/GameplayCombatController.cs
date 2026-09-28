using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Security;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Controllers;

[ApiController]
[Authorize]
[Route("api/mesas/{idMesa:int}/sessoes/{idMesaSessao:long}/combate")]
public sealed class GameplayCombatController : ControllerBase
{
    private readonly IGameplayCombatService _service;
    public GameplayCombatController(IGameplayCombatService service) => _service = service;

    [HttpGet]
    [EnableRateLimiting("gameplay-read")]
    public async Task<IActionResult> Get(int idMesa, long idMesaSessao, CancellationToken token)
    {
        int? userId = User.GetUserId();
        if (!userId.HasValue) return Unauthorized();
        GameplayOperationResult<GameplayCombatSnapshotDto?> result = await _service.GetCurrentAsync(idMesa, idMesaSessao, userId.Value, token);
        if (!result.Sucesso) return Failure(result);
        return result.Dados is null ? NoContent() : Ok(result.Dados);
    }

    [HttpGet("catalogo")]
    [EnableRateLimiting("gameplay-read")]
    public async Task<IActionResult> GetCatalog(int idMesa, long idMesaSessao, CancellationToken token)
    {
        int? userId = User.GetUserId();
        if (!userId.HasValue) return Unauthorized();
        GameplayOperationResult<GameplayStateCatalogDto> result = await _service.GetCatalogAsync(idMesa, idMesaSessao, userId.Value, token);
        return result.Sucesso ? Ok(result.Dados) : Failure(result);
    }

    [HttpPost("iniciar")]
    public Task<IActionResult> Start(int idMesa, long idMesaSessao, [FromBody] GameplayCombatStartRequestDto request, CancellationToken token)
        => Execute(idMesa, idMesaSessao, (userId) => _service.StartAsync(idMesa, idMesaSessao, userId, request, token));

    [HttpPost("npcs")]
    public Task<IActionResult> AddNpc(int idMesa, long idMesaSessao, [FromBody] GameplayCombatAddNpcRequestDto request, CancellationToken token)
        => Execute(idMesa, idMesaSessao, (userId) => _service.AddNpcAsync(idMesa, idMesaSessao, userId, request, token));

    [HttpPost("iniciativa")]
    public Task<IActionResult> RollInitiative(int idMesa, long idMesaSessao, [FromBody] GameplayCombatInitiativeRequestDto request, CancellationToken token)
        => Execute(idMesa, idMesaSessao, (userId) => _service.RollInitiativeAsync(idMesa, idMesaSessao, userId, request, token));

    [HttpPost("ativar")]
    public Task<IActionResult> Activate(int idMesa, long idMesaSessao, [FromBody] GameplayCombatActivateRequestDto request, CancellationToken token)
        => Execute(idMesa, idMesaSessao, (userId) => _service.ActivateAsync(idMesa, idMesaSessao, userId, request, token));

    [HttpPost("avancar")]
    public Task<IActionResult> Advance(int idMesa, long idMesaSessao, [FromBody] GameplayCombatAdvanceRequestDto request, CancellationToken token)
        => Execute(idMesa, idMesaSessao, (userId) => _service.AdvanceAsync(idMesa, idMesaSessao, userId, request, token));

    [HttpPost("encerrar")]
    public Task<IActionResult> End(int idMesa, long idMesaSessao, [FromBody] GameplayCombatEndRequestDto request, CancellationToken token)
        => Execute(idMesa, idMesaSessao, (userId) => _service.EndAsync(idMesa, idMesaSessao, userId, request, token));

    [HttpPost("condicoes")]
    public Task<IActionResult> ApplyCondition(int idMesa, long idMesaSessao, [FromBody] GameplayConditionApplyRequestDto request, CancellationToken token)
        => Execute(idMesa, idMesaSessao, (userId) => _service.ApplyConditionAsync(idMesa, idMesaSessao, userId, request, token));

    [HttpPost("condicoes/remover")]
    public Task<IActionResult> RemoveCondition(int idMesa, long idMesaSessao, [FromBody] GameplayConditionRemoveRequestDto request, CancellationToken token)
        => Execute(idMesa, idMesaSessao, (userId) => _service.RemoveConditionAsync(idMesa, idMesaSessao, userId, request, token));

    [HttpPost("descansos")]
    public Task<IActionResult> ApplyRest(int idMesa, long idMesaSessao, [FromBody] GameplayRestApplyRequestDto request, CancellationToken token)
        => Execute(idMesa, idMesaSessao, (userId) => _service.ApplyRestAsync(idMesa, idMesaSessao, userId, request, token));

    [HttpPost("sobrevivencia")]
    public Task<IActionResult> RollSurvival(int idMesa, long idMesaSessao, [FromBody] GameplaySurvivalRollRequestDto request, CancellationToken token)
        => Execute(idMesa, idMesaSessao, (userId) => _service.RollSurvivalAsync(idMesa, idMesaSessao, userId, request, token));

    private async Task<IActionResult> Execute(
        int idMesa,
        long idMesaSessao,
        Func<int, Task<GameplayOperationResult<GameplayCombatCommandResponseDto>>> action)
    {
        _ = idMesa;
        _ = idMesaSessao;
        int? userId = User.GetUserId();
        if (!userId.HasValue) return Unauthorized();
        GameplayOperationResult<GameplayCombatCommandResponseDto> result = await action(userId.Value);
        return result.Sucesso ? Ok(result.Dados) : Failure(result);
    }

    private ObjectResult Failure<T>(GameplayOperationResult<T> result)
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
        var problem = new ProblemDetails
        {
            Status = status,
            Title = "Ação de combate inválida",
            Detail = result.Mensagem,
            Instance = HttpContext.Request.Path,
        };
        problem.Extensions["code"] = result.Codigo;
        problem.Extensions["traceId"] = HttpContext.TraceIdentifier;
        return StatusCode(status, problem);
    }
}
