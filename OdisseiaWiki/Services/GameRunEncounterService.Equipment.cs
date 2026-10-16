using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.GameRuns.Battle;

namespace OdisseiaWiki.Services;

public sealed partial class GameRunEncounterService
{
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
                if (run.Status != GameRunStatus.Ativa || run.NoAtualId is not null)
                    return GameRunOperationResult<GameRunDto>.Fail("RUN_INDISPONIVEL", "Conclua o combate antes de alterar o equipamento.");
                try { run.EstadoAtualJson = GameRunDefensiveEquipment.SetEquipped(run.EstadoAtualJson, itemId, request.Equipado); }
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
