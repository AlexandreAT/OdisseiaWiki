using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.GameRuns;
using OdisseiaWiki.GameRuns.Inventory;
using OdisseiaWiki.GameRuns.Battle;

namespace OdisseiaWiki.Services;

public sealed partial class GameRunEncounterService
{
    public async Task<GameRunOperationResult<GameRunDto>> DropItemAsync(long runId, int userId,
        string itemId, GameRunMutationRequestDto request, CancellationToken token)
    {
        if (!Valid(request) || runId <= 0 || string.IsNullOrWhiteSpace(itemId) || itemId.Length > 100)
            return GameRunOperationResult<GameRunDto>.Fail("REQUISICAO_INVALIDA", "Informe um item válido da run.");
        string hash = Hash($"DEIXAR_ITEM|{runId}|{request.RevisaoEsperada}|{itemId}");
        try
        {
            return await _runs.ExecuteWithUserLockAsync(userId, async () =>
            {
                var previous = await _runs.GetCommandAsync(userId, request.ChaveIdempotencia, token);
                if (previous is not null) return Replay<GameRunDto>(previous, "DEIXAR_ITEM", hash);
                var run = await _runs.GetByIdAsync(runId, userId, token);
                if (run is null) return GameRunOperationResult<GameRunDto>.Fail("RUN_NAO_ENCONTRADA", "Run não encontrada.");
                if (run.Revisao != request.RevisaoEsperada) return Stale<GameRunDto>();
                if (run.Status != GameRunStatus.Ativa || run.NoAtualId is not null)
                    return GameRunOperationResult<GameRunDto>.Fail("RUN_INDISPONIVEL", "Conclua o combate antes de deixar um item.");
                var version = await _systems.GetVersionAsync(run.IdSistemaVersao, includeConfiguration: true);
                if (version is null) return GameRunOperationResult<GameRunDto>.Fail("SISTEMA_INDISPONIVEL", "Sistema indisponível.");
                try
                {
                    string unequipped = GameRunDefensiveEquipment.UnequipIfNeeded(run.EstadoAtualJson, itemId);
                    string cleared = GameRunCarry.RemoveUnequippedItemConditions(unequipped, itemId, version);
                    run.EstadoAtualJson = GameRunCarry.Reconcile(GameRunCarry.Drop(cleared, itemId), version);
                }
                catch (Exception error) when (error is InvalidOperationException or System.Text.Json.JsonException)
                {
                    return GameRunOperationResult<GameRunDto>.Fail("ITEM_INVALIDO", error.Message);
                }
                if (GameRunActionLoadout.Read(run.LoadoutJson) is { } actions)
                    run.LoadoutJson = GameRunActionLoadout.Serialize(actions.Where(action =>
                        !(action.Tipo.Equals("ITEM", StringComparison.OrdinalIgnoreCase) &&
                          action.IdInstancia == itemId)).ToArray());
                run.Revisao++;
                run.AtualizadaEmUtc = DateTime.UtcNow;
                var response = GameRunService.Map(run);
                await SaveCommand(run, userId, request, "DEIXAR_ITEM", hash, response, token);
                return GameRunOperationResult<GameRunDto>.Ok(response);
            }, token);
        }
        catch (DbUpdateConcurrencyException) { return Stale<GameRunDto>(); }
        catch (KeyNotFoundException) { return MissingUser<GameRunDto>(); }
    }

    public async Task<GameAttributeOptions?> GetAttributesAsync(long runId, int userId, CancellationToken token)
    {
        var run = await _runs.GetByIdAsync(runId, userId, token);
        if (run is null) return null;
        var version = await _systems.GetVersionAsync(run.IdSistemaVersao, includeConfiguration: true);
        return version is null ? null : GameRunAttributes.Options(run.EstadoAtualJson, version);
    }

    public Task<GameRunOperationResult<GameRunDto>> ClaimLootAsync(long runId, int userId,
        GameRunMutationRequestDto request, CancellationToken token) =>
        RewardCommand(runId, userId, request, "REVELAR_LOOT", null, token);

    public Task<GameRunOperationResult<GameRunDto>> UpgradeAttributeAsync(long runId, int userId,
        GameRunUpgradeAttributeRequestDto request, CancellationToken token) =>
        RewardCommand(runId, userId, request, "EVOLUIR_ATRIBUTO", request.Codigo, token);

    private async Task<GameRunOperationResult<GameRunDto>> RewardCommand(long runId, int userId,
        GameRunMutationRequestDto request, string type, string? code, CancellationToken token)
    {
        if (!Valid(request)) return GameRunOperationResult<GameRunDto>.Fail("REQUISICAO_INVALIDA", "Informe uma revisão e chave válidas.");
        string hash = Hash($"{type}|{runId}|{request.RevisaoEsperada}|{code}");
        try
        {
            return await _runs.ExecuteWithUserLockAsync(userId, async () =>
            {
                var previous = await _runs.GetCommandAsync(userId, request.ChaveIdempotencia, token);
                if (previous is not null) return Replay<GameRunDto>(previous, type, hash);
                var run = await _runs.GetByIdAsync(runId, userId, token);
                if (run is null) return GameRunOperationResult<GameRunDto>.Fail("RUN_NAO_ENCONTRADA", "Run não encontrada.");
                if (run.Revisao != request.RevisaoEsperada) return Stale<GameRunDto>();
                if (run.Status is not (GameRunStatus.Ativa or GameRunStatus.Vitoria) || run.NoAtualId is not null)
                    return GameRunOperationResult<GameRunDto>.Fail("RUN_INDISPONIVEL", "Conclua o combate antes de alterar as recompensas.");
                try
                {
                    if (type == "REVELAR_LOOT")
                    {
                        var loot = GameRunLoot.Read(run.EstadoAtualJson);
                        if (loot?.Roll is not null) return GameRunOperationResult<GameRunDto>.Ok(GameRunService.Map(run), true);
                        var version = await _systems.GetVersionAsync(run.IdSistemaVersao, includeConfiguration: true);
                        if (version is null) return GameRunOperationResult<GameRunDto>.Fail(
                            "SISTEMA_INDISPONIVEL", "Sistema indisponível.");
                        run.EstadoAtualJson = GameRunCarry.Reconcile(
                            GameRunLoot.Claim(run.EstadoAtualJson).Snapshot, version);
                        if (_itemValues is not null)
                            run.EstadoAtualJson = await _itemValues.ResolveAsync(run.EstadoAtualJson, run.GameModeVersion, token);
                    }
                    else
                    {
                        var version = await _systems.GetVersionAsync(run.IdSistemaVersao, includeConfiguration: true);
                        if (version is null) return GameRunOperationResult<GameRunDto>.Fail("SISTEMA_INDISPONIVEL", "Sistema indisponível.");
                        run.EstadoAtualJson = GameRunCarry.Reconcile(
                            GameRunAttributes.Upgrade(run.EstadoAtualJson, version, code ?? ""), version);
                    }
                }
                catch (Exception error) when (error is InvalidOperationException or OverflowException)
                {
                    return GameRunOperationResult<GameRunDto>.Fail("RECOMPENSA_INVALIDA", error.Message);
                }
                run.Revisao++;
                run.AtualizadaEmUtc = DateTime.UtcNow;
                var response = GameRunService.Map(run);
                await SaveCommand(run, userId, request, type, hash, response, token);
                return GameRunOperationResult<GameRunDto>.Ok(response);
            }, token);
        }
        catch (DbUpdateConcurrencyException) { return Stale<GameRunDto>(); }
        catch (KeyNotFoundException) { return MissingUser<GameRunDto>(); }
    }
}
