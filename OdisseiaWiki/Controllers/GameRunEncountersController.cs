using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Security;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Controllers;

[ApiController]
[Authorize]
[Route("api/game-runs/{idGameRun:long}")]
public sealed class GameRunEncountersController : ControllerBase
{
    private readonly IGameRunEncounterService _service;

    public GameRunEncountersController(IGameRunEncounterService service) => _service = service;

    [HttpPost("nodes/{noId}/vendor")]
    public async Task<IActionResult> EnterVendor(long idGameRun, string noId,
        GameRunMutationRequestDto request, CancellationToken token)
    {
        int? userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        var result = await _service.EnterVendorAsync(idGameRun, noId, userId.Value, request, token);
        return result.Sucesso ? Ok(result.Dados) : Failure(result.Codigo, result.Mensagem);
    }

    [HttpPost("vendor/buy")]
    public async Task<IActionResult> BuyVendorItem(long idGameRun,
        GameRunVendorPurchaseRequestDto request, CancellationToken token)
    {
        int? userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        var result = await _service.BuyVendorItemAsync(idGameRun, userId.Value, request, token);
        return result.Sucesso ? Ok(result.Dados) : Failure(result.Codigo, result.Mensagem);
    }

    [HttpPost("vendor/leave")]
    public async Task<IActionResult> LeaveVendor(long idGameRun,
        GameRunMutationRequestDto request, CancellationToken token)
    {
        int? userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        var result = await _service.LeaveVendorAsync(idGameRun, userId.Value, request, token);
        return result.Sucesso ? Ok(result.Dados) : Failure(result.Codigo, result.Mensagem);
    }

    [HttpPost("vendor/sell")]
    public async Task<IActionResult> SellVendorItems(long idGameRun,
        GameRunVendorSaleRequestDto request, CancellationToken token)
    {
        int? userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        var result = await _service.SellVendorItemsAsync(idGameRun, userId.Value, request, token);
        return result.Sucesso ? Ok(result.Dados) : Failure(result.Codigo, result.Mensagem);
    }

    [HttpPost("stash/transfer")]
    public async Task<IActionResult> TransferStashItem(long idGameRun,
        GameRunStashTransferRequestDto request, CancellationToken token)
    {
        int? userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        var result = await _service.TransferStashItemAsync(idGameRun, userId.Value, request, token);
        return result.Sucesso ? Ok(result.Dados) : Failure(result.Codigo, result.Mensagem);
    }

    [HttpGet("attributes")]
    public async Task<IActionResult> GetAttributes(long idGameRun, CancellationToken token)
    {
        int? userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        var result = await _service.GetAttributesAsync(idGameRun, userId.Value, token);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("attributes/upgrade")]
    public async Task<IActionResult> UpgradeAttribute(long idGameRun, GameRunUpgradeAttributeRequestDto request, CancellationToken token)
    {
        int? userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        var result = await _service.UpgradeAttributeAsync(idGameRun, userId.Value, request, token);
        return result.Sucesso ? Ok(result.Dados) : Failure(result.Codigo, result.Mensagem);
    }

    [HttpPost("loot/roll")]
    public async Task<IActionResult> ClaimLoot(long idGameRun, GameRunMutationRequestDto request, CancellationToken token)
    {
        int? userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        var result = await _service.ClaimLootAsync(idGameRun, userId.Value, request, token);
        return result.Sucesso ? Ok(result.Dados) : Failure(result.Codigo, result.Mensagem);
    }

    [HttpPost("inventory/items/{itemId}/drop")]
    public async Task<IActionResult> DropItem(long idGameRun, string itemId,
        GameRunMutationRequestDto request, CancellationToken token)
    {
        int? userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        var result = await _service.DropItemAsync(idGameRun, userId.Value, itemId, request, token);
        return result.Sucesso ? Ok(result.Dados) : Failure(result.Codigo, result.Mensagem);
    }

    [HttpPut("inventory/condition-origin")]
    public async Task<IActionResult> UpdateConditionOrigin(long idGameRun,
        GameRunConditionOriginRequestDto request, CancellationToken token)
    {
        int? userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        var result = await _service.UpdateConditionOriginAsync(idGameRun, userId.Value, request, token);
        return result.Sucesso ? Ok(result.Dados) : Failure(result.Codigo, result.Mensagem);
    }

    [HttpPut("inventory/items/{itemId}/defense")]
    public async Task<IActionResult> EquipDefense(long idGameRun, string itemId,
        GameRunEquipDefenseRequestDto request, CancellationToken token)
    {
        int? userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        var result = await _service.EquipDefenseAsync(idGameRun, userId.Value, itemId, request, token);
        return result.Sucesso ? Ok(result.Dados) : Failure(result.Codigo, result.Mensagem);
    }

    [HttpPost("nodes/{noId}/select")]
    [RequestSizeLimit(32 * 1024)]
    public async Task<IActionResult> Select(long idGameRun, string noId,
        [FromBody] GameRunMutationRequestDto request, CancellationToken cancellationToken)
    {
        int? userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        GameRunOperationResult<GameRunDto> result = await _service.SelectAsync(
            idGameRun, noId, userId.Value, request, cancellationToken);
        return result.Sucesso ? Ok(result.Dados) : Failure(result.Codigo, result.Mensagem);
    }

    [HttpPost("battles/current/resolve")]
    [RequestSizeLimit(32 * 1024)]
    public async Task<IActionResult> Resolve(long idGameRun,
        [FromBody] GameRunBattleRequestDto request, CancellationToken cancellationToken)
    {
        int? userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        GameRunOperationResult<GameRunBattleResolutionDto> result = await _service.ResolveAsync(
            idGameRun, userId.Value, request, cancellationToken);
        return result.Sucesso ? Ok(result.Dados) : Failure(result.Codigo, result.Mensagem);
    }

    [HttpGet("battles/current/setup")]
    public async Task<IActionResult> GetCurrentSetup(long idGameRun, CancellationToken cancellationToken)
    {
        int? userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        GameRunEncounterSetupDto? setup = await _service.GetCurrentSetupAsync(
            idGameRun, userId.Value, cancellationToken);
        return setup is null ? NotFound() : Ok(setup);
    }

    [HttpGet("battles/first")]
    public async Task<IActionResult> GetFirstBattle(long idGameRun, CancellationToken cancellationToken)
    {
        int? userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        GameBattlePreviewDto? battle = await _service.GetBattleAsync(
            idGameRun, userId.Value, cancellationToken);
        return battle is null ? NoContent() : Ok(battle);
    }

    [HttpGet("battles")]
    public async Task<IActionResult> GetBattles(long idGameRun, CancellationToken cancellationToken)
    {
        int? userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        IReadOnlyList<GameRunBattleRecordDto>? battles = await _service.GetBattlesAsync(
            idGameRun, userId.Value, cancellationToken);
        return battles is null ? NotFound() : Ok(battles);
    }

    [HttpPost("map/upgrade")]
    [RequestSizeLimit(32 * 1024)]
    public async Task<IActionResult> UpgradeMap(long idGameRun,
        [FromBody] GameRunMutationRequestDto request, CancellationToken cancellationToken)
    {
        int? userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        GameRunOperationResult<GameRunDto> result = await _service.UpgradeMapAsync(
            idGameRun, userId.Value, request, cancellationToken);
        return result.Sucesso ? Ok(result.Dados) : Failure(result.Codigo, result.Mensagem);
    }

    [HttpPost("nodes/{noId}/rest")]
    [HttpPost("nodes/{noId}/event")]
    [RequestSizeLimit(32 * 1024)]
    public async Task<IActionResult> EnterBase(long idGameRun, string noId,
        [FromBody] GameRunMutationRequestDto request, CancellationToken cancellationToken)
    {
        int? userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        GameRunOperationResult<GameRunBaseResolutionDto> result = await _service.EnterBaseAsync(
            idGameRun, noId, userId.Value, request, cancellationToken);
        return result.Sucesso ? Ok(result.Dados) : Failure(result.Codigo, result.Mensagem);
    }

    [HttpGet("rest/medium")]
    public async Task<IActionResult> GetMediumRest(long idGameRun, CancellationToken cancellationToken)
    {
        int? userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        GameRunMediumRestPreviewDto? preview = await _service.GetMediumRestPreviewAsync(
            idGameRun, userId.Value, cancellationToken);
        return preview is null ? NotFound() : Ok(preview);
    }

    [HttpPost("rest/medium")]
    [RequestSizeLimit(32 * 1024)]
    public async Task<IActionResult> MediumRest(long idGameRun,
        [FromBody] GameRunMutationRequestDto request, CancellationToken cancellationToken)
    {
        int? userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        GameRunOperationResult<GameRunMediumRestResolutionDto> result = await _service.MediumRestAsync(
            idGameRun, userId.Value, request, cancellationToken);
        return result.Sucesso ? Ok(result.Dados) : Failure(result.Codigo, result.Mensagem);
    }

    [HttpPut("inventory/weapon-order")]
    [RequestSizeLimit(32 * 1024)]
    public async Task<IActionResult> UpdateWeaponOrder(long idGameRun,
        [FromBody] GameRunWeaponOrderRequestDto request, CancellationToken cancellationToken)
    {
        int? userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        GameRunOperationResult<GameRunDto> result = await _service.UpdateWeaponOrderAsync(
            idGameRun, userId.Value, request, cancellationToken);
        return result.Sucesso ? Ok(result.Dados) : Failure(result.Codigo, result.Mensagem);
    }

    [HttpPut("inventory/loadout")]
    [RequestSizeLimit(32 * 1024)]
    public async Task<IActionResult> UpdateLoadout(long idGameRun,
        [FromBody] GameRunLoadoutRequestDto request, CancellationToken cancellationToken)
    {
        int? userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        GameRunOperationResult<GameRunDto> result = await _service.UpdateLoadoutAsync(
            idGameRun, userId.Value, request, cancellationToken);
        return result.Sucesso ? Ok(result.Dados) : Failure(result.Codigo, result.Mensagem);
    }

    [HttpPost("inventory/consume")]
    [RequestSizeLimit(32 * 1024)]
    public async Task<IActionResult> ConsumeItem(long idGameRun,
        [FromBody] GameRunConsumeItemRequestDto request, CancellationToken cancellationToken)
    {
        int? userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        GameRunOperationResult<GameRunConsumeItemResultDto> result = await _service.ConsumeItemAsync(
            idGameRun, userId.Value, request, cancellationToken);
        return result.Sucesso ? Ok(result.Dados) : Failure(result.Codigo, result.Mensagem);
    }

    private IActionResult Failure(string code, string message)
    {
        object error = new { Codigo = code, Mensagem = message };
        return code switch
        {
            "RUN_NAO_ENCONTRADA" or "USUARIO_NAO_ENCONTRADO" => NotFound(error),
            "REVISAO_DESATUALIZADA" or "CHAVE_IDEMPOTENCIA_REUTILIZADA" or
                "RUN_ENCERRADA" or "NO_JA_SELECIONADO" or "NO_INDISPONIVEL" or
                "COMBATE_JA_RESOLVIDO" or "MAPA_INDISPONIVEL" or "COMBATE_PENDENTE" or
                "BASE_INDISPONIVEL" or "DESCANSO_JA_USADO" or "VENDEDOR_INDISPONIVEL" or
                "ESTOQUE_ESGOTADO" => Conflict(error),
            _ => BadRequest(error),
        };
    }
}
