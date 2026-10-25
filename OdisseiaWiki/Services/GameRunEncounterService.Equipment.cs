using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.GameRuns;
using OdisseiaWiki.GameRuns.Battle;
using OdisseiaWiki.GameRuns.Inventory;
using OdisseiaWiki.Models;

namespace OdisseiaWiki.Services;

public sealed partial class GameRunEncounterService
{
    public async Task<GameRunOperationResult<GameRunDto>> UpdateConditionOriginAsync(long runId, int userId,
        GameRunConditionOriginRequestDto request, CancellationToken token)
    {
        if (!Valid(request) || runId <= 0 || string.IsNullOrWhiteSpace(request.IdInstancia) ||
            string.IsNullOrWhiteSpace(request.Codigo) || string.IsNullOrWhiteSpace(request.Gatilho))
            return GameRunOperationResult<GameRunDto>.Fail("REQUISICAO_INVALIDA", "Informe uma condição válida da run.");
        string hash = Hash($"CONFIGURAR_CONDICAO|{runId}|{request.RevisaoEsperada}|{System.Text.Json.JsonSerializer.Serialize(request)}");
        try
        {
            return await _runs.ExecuteWithUserLockAsync(userId, async () =>
            {
                var previous = await _runs.GetCommandAsync(userId, request.ChaveIdempotencia, token);
                if (previous is not null) return Replay<GameRunDto>(previous, "CONFIGURAR_CONDICAO", hash);
                var run = await _runs.GetByIdAsync(runId, userId, token);
                if (run is null) return GameRunOperationResult<GameRunDto>.Fail("RUN_NAO_ENCONTRADA", "Run não encontrada.");
                if (run.Revisao != request.RevisaoEsperada) return Stale<GameRunDto>();
                if (run.Status != GameRunStatus.Ativa || run.NoAtualId is not null)
                    return GameRunOperationResult<GameRunDto>.Fail("RUN_INDISPONIVEL", "Conclua o encontro antes de configurar condições.");
                SistemaVersao? version = await _systems.GetVersionAsync(run.IdSistemaVersao, includeConfiguration: true);
                if (version is null) return GameRunOperationResult<GameRunDto>.Fail("SISTEMA_INDISPONIVEL", "Sistema indisponível.");
                try { run.EstadoAtualJson = GameRunCarry.UpdateConditionOrigin(run.EstadoAtualJson, request, version); }
                catch (Exception error) when (error is InvalidOperationException or System.Text.Json.JsonException)
                { return GameRunOperationResult<GameRunDto>.Fail("CONDICAO_INVALIDA", error.Message); }
                run.Revisao++;
                run.AtualizadaEmUtc = DateTime.UtcNow;
                var response = GameRunService.Map(run);
                await SaveCommand(run, userId, request, "CONFIGURAR_CONDICAO", hash, response, token);
                return GameRunOperationResult<GameRunDto>.Ok(response);
            }, token);
        }
        catch (DbUpdateConcurrencyException) { return Stale<GameRunDto>(); }
        catch (KeyNotFoundException) { return MissingUser<GameRunDto>(); }
    }

    public async Task<GameRunOperationResult<GameRunDto>> EquipDefenseAsync(long runId, int userId,
        string itemId, GameRunEquipDefenseRequestDto request, CancellationToken token)
    {
        if (!Valid(request) || runId <= 0 || string.IsNullOrWhiteSpace(itemId) || itemId.Length > 100)
            return GameRunOperationResult<GameRunDto>.Fail("REQUISICAO_INVALIDA", "Informe um item válido da run.");
        string hash = Hash($"EQUIPAR_DEFESA|{runId}|{request.RevisaoEsperada}|{itemId}|{request.Equipado}");
        try
        {
            return await _runs.ExecuteWithUserLockAsync(userId, async () =>
            {
                var previous = await _runs.GetCommandAsync(userId, request.ChaveIdempotencia, token);
                if (previous is not null) return Replay<GameRunDto>(previous, "EQUIPAR_DEFESA", hash);
                var run = await _runs.GetByIdAsync(runId, userId, token);
                if (run is null) return GameRunOperationResult<GameRunDto>.Fail("RUN_NAO_ENCONTRADA", "Run não encontrada.");
                if (run.Revisao != request.RevisaoEsperada) return Stale<GameRunDto>();
                if (run.NoAtualId is not null || run.Status != GameRunStatus.Ativa &&
                    !(run.Status == GameRunStatus.Vitoria && GameRunLoot.IsReceivedItem(run.EstadoAtualJson, itemId)))
                    return GameRunOperationResult<GameRunDto>.Fail("RUN_INDISPONIVEL", "Conclua o combate antes de alterar o equipamento.");
                try
                {
                    SistemaVersao? version = await _systems.GetVersionAsync(
                        run.IdSistemaVersao, includeConfiguration: true);
                    if (version is null)
                        return GameRunOperationResult<GameRunDto>.Fail(
                            "SISTEMA_INDISPONIVEL", "A versão das regras desta run não está disponível.");
                    string before = run.EstadoAtualJson;
                    bool wasEquipped = GameRunDefensiveEquipment.IsEquipped(before, itemId);
                    string after = GameRunDefensiveEquipment.SetEquipped(before, itemId, request.Equipado);
                    run.EstadoAtualJson = wasEquipped == request.Equipado ? after :
                        request.Equipado
                            ? GameRunCarry.ApplyConsumedItemConditions(
                                before, after, itemId, version, trigger: "AO_EQUIPAR")
                            : GameRunCarry.RemoveUnequippedItemConditions(after, itemId, version);
                }
                catch (Exception error) when (error is InvalidOperationException or System.Text.Json.JsonException)
                {
                    return GameRunOperationResult<GameRunDto>.Fail("ITEM_INVALIDO", error.Message);
                }
                run.Revisao++;
                run.AtualizadaEmUtc = DateTime.UtcNow;
                var response = GameRunService.Map(run);
                await SaveCommand(run, userId, request, "EQUIPAR_DEFESA", hash, response, token);
                return GameRunOperationResult<GameRunDto>.Ok(response);
            }, token);
        }
        catch (DbUpdateConcurrencyException) { return Stale<GameRunDto>(); }
        catch (KeyNotFoundException) { return MissingUser<GameRunDto>(); }
    }
}
