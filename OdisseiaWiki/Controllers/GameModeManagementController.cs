using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Security;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Controllers;

[ApiController]
[Authorize(Policy = AuthorizationPolicies.Admin)]
[Route("api/game-mode/management")]
public sealed class GameModeManagementController : ControllerBase
{
    private readonly IGameModeManagementService _service;
    public GameModeManagementController(IGameModeManagementService service) => _service = service;

    [HttpGet("loot-items")]
    public async Task<IActionResult> GetLootItems(CancellationToken token) =>
        Ok(await _service.GetLootOptionsAsync(token));

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] int? idSistemaVersao, CancellationToken token) =>
        Respond(await _service.GetAsync(idSistemaVersao, token));

    [HttpGet("system-versions")]
    public async Task<IActionResult> GetSystemVersions(CancellationToken token) =>
        Ok(await _service.GetSystemVersionsAsync(token));

    [HttpGet("rest-options")]
    public async Task<IActionResult> GetRestOptions([FromQuery] int? idSistemaVersao, CancellationToken token) =>
        Ok(await _service.GetRestOptionsAsync(idSistemaVersao, token));

    [HttpGet("npcs")]
    public async Task<IActionResult> GetNpcs([FromQuery] int? idSistemaVersao, CancellationToken token) =>
        Ok(await _service.GetNpcOptionsAsync(idSistemaVersao, token));

    [HttpPost("draft")]
    public async Task<IActionResult> CreateDraft([FromQuery] int? idSistemaVersao, CancellationToken token) =>
        Respond(await _service.CreateDraftAsync(idSistemaVersao, token));

    [HttpPost("draft/clone")]
    public async Task<IActionResult> CloneDraft([FromQuery] int idSistemaVersaoOrigem,
        [FromQuery] int idSistemaVersaoDestino, CancellationToken token) =>
        Respond(await _service.CloneDraftAsync(idSistemaVersaoOrigem, idSistemaVersaoDestino, token));

    [HttpPut("draft/{id:int}")]
    [RequestSizeLimit(128 * 1024)]
    public async Task<IActionResult> SaveDraft(int id, [FromBody] GameModeEditorUpdateDto update, CancellationToken token) =>
        Respond(await _service.SaveDraftAsync(id, update, token));

    [HttpPost("draft/{id:int}/publish")]
    public async Task<IActionResult> Publish(int id, CancellationToken token) =>
        Respond(await _service.PublishAsync(id, token));

    private IActionResult Respond(GameRunOperationResult<GameModeEditorDto> result) =>
        result.Sucesso ? Ok(result.Dados) : BadRequest(new { result.Codigo, result.Mensagem });
}
