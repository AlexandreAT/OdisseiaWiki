using OdisseiaWiki.Dtos;

namespace OdisseiaWiki.Services.Interfaces;

public interface IGameRunEncounterService
{
    Task<GameRunOperationResult<GameRunDto>> UpgradeWeaponAsync(long runId, int userId, GameRunVendorPurchaseRequestDto request, CancellationToken token);
    Task<GameRunOperationResult<GameRunBaseResolutionDto>> VisitNpcAsync(long runId, string nodeId, int userId, GameRunMutationRequestDto request, CancellationToken token);
    Task<GameRunProtectedDepositDto?> GetProtectedDepositAsync(long runId, int userId, CancellationToken token);
    Task<GameRunOperationResult<GameRunDto>> ChangeProtectedItemAsync(long runId, int userId, GameRunProtectedItemRequestDto request, CancellationToken token);
    Task<GameRunOperationResult<GameRunDto>> EnterVendorAsync(long runId, string nodeId, int userId, GameRunMutationRequestDto request, CancellationToken token);
    Task<GameRunOperationResult<GameRunDto>> BuyVendorItemAsync(long runId, int userId, GameRunVendorPurchaseRequestDto request, CancellationToken token);
    Task<GameRunOperationResult<GameRunDto>> SellVendorItemsAsync(long runId, int userId, GameRunVendorSaleRequestDto request, CancellationToken token);
    Task<GameRunOperationResult<GameRunDto>> LeaveVendorAsync(long runId, int userId, GameRunMutationRequestDto request, CancellationToken token);
    Task<GameRunOperationResult<GameRunDto>> TransferStashItemAsync(long runId, int userId, GameRunStashTransferRequestDto request, CancellationToken token);
    Task<OdisseiaWiki.GameRuns.GameAttributeOptions?> GetAttributesAsync(long runId, int userId, CancellationToken token);
    Task<GameRunOperationResult<GameRunDto>> ClaimLootAsync(long runId, int userId, GameRunMutationRequestDto request, CancellationToken token);
    Task<GameRunOperationResult<GameRunDto>> DropItemAsync(long runId, int userId, string itemId, GameRunMutationRequestDto request, CancellationToken token);
    Task<GameRunOperationResult<GameRunDto>> UpdateConditionOriginAsync(long runId, int userId,
        GameRunConditionOriginRequestDto request, CancellationToken token);
    Task<GameRunOperationResult<GameRunDto>> EquipDefenseAsync(long runId, int userId, string itemId,
        GameRunEquipDefenseRequestDto request, CancellationToken token);
    Task<GameRunOperationResult<GameRunDto>> UpgradeAttributeAsync(long runId, int userId, GameRunUpgradeAttributeRequestDto request, CancellationToken token);
    Task<GameRunOperationResult<GameRunDto>> SelectAsync(
        long idGameRun, string noId, int idUsuario, GameRunMutationRequestDto request,
        CancellationToken cancellationToken);
    Task<GameRunOperationResult<GameRunBattleResolutionDto>> ResolveAsync(
        long idGameRun, int idUsuario, GameRunMutationRequestDto request,
        CancellationToken cancellationToken);
    Task<GameRunEncounterSetupDto?> GetCurrentSetupAsync(
        long idGameRun, int idUsuario, CancellationToken cancellationToken);
    Task<GameBattlePreviewDto?> GetBattleAsync(
        long idGameRun, int idUsuario, CancellationToken cancellationToken);
    Task<IReadOnlyList<GameRunBattleRecordDto>?> GetBattlesAsync(
        long idGameRun, int idUsuario, CancellationToken cancellationToken);
    Task<GameRunOperationResult<GameRunDto>> UpgradeMapAsync(
        long idGameRun, int idUsuario, GameRunMutationRequestDto request,
        CancellationToken cancellationToken);
    Task<GameRunOperationResult<GameRunBaseResolutionDto>> EnterBaseAsync(
        long idGameRun, string noId, int idUsuario, GameRunMutationRequestDto request,
        CancellationToken cancellationToken);
    Task<GameRunMediumRestPreviewDto?> GetMediumRestPreviewAsync(
        long idGameRun, int idUsuario, CancellationToken cancellationToken);
    Task<GameRunOperationResult<GameRunMediumRestResolutionDto>> MediumRestAsync(
        long idGameRun, int idUsuario, GameRunMutationRequestDto request,
        CancellationToken cancellationToken);
    Task<GameRunOperationResult<GameRunDto>> UpdateWeaponOrderAsync(
        long idGameRun, int idUsuario, GameRunWeaponOrderRequestDto request,
        CancellationToken cancellationToken);
    Task<GameRunOperationResult<GameRunDto>> UpdateLoadoutAsync(
        long idGameRun, int idUsuario, GameRunLoadoutRequestDto request,
        CancellationToken cancellationToken);
    Task<GameRunOperationResult<GameRunConsumeItemResultDto>> ConsumeItemAsync(
        long idGameRun, int idUsuario, GameRunConsumeItemRequestDto request,
        CancellationToken cancellationToken);
}
