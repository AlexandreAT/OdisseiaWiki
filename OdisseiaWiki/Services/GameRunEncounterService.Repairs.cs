using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.GameRuns;
using OdisseiaWiki.GameRuns.Map;

namespace OdisseiaWiki.Services;

public sealed partial class GameRunEncounterService
{
    public async Task<GameRunOperationResult<GameRunDto>> RepairDefenseAsync(long runId, int userId,
        GameRunVendorPurchaseRequestDto request, CancellationToken token)
    {
        if (!Valid(request) || string.IsNullOrWhiteSpace(request.ItemId) || request.ItemId.Length > 100 || request.ToStash)
            return GameRunOperationResult<GameRunDto>.Fail("REQUISICAO_INVALIDA", "Escolha um equipamento da mochila para consertar.");
        string hash = Hash($"CONSERTAR_DEFESA|{runId}|{request.ItemId}|{request.RevisaoEsperada}");
        try
        {
            return await _runs.ExecuteWithUserLockAsync(userId, async () =>
            {
                var previous = await _runs.GetCommandAsync(userId, request.ChaveIdempotencia, token);
                if (previous is not null) return Replay<GameRunDto>(previous, "CONSERTAR_DEFESA", hash);
                var run = await _runs.GetByIdAsync(runId, userId, token);
                var failure = Check<GameRunDto>(run, request.RevisaoEsperada!.Value);
                if (failure is not null) return failure;
                var map = GameRunFirstMap.Read(run!.MapaJson, JsonOptions);
                var node = map.Nodes.SingleOrDefault(item => item.Id == run.NoAtualId);
                if (node is not { Type: "NPC", State: "SELECIONADO", Payload.NpcType: "ENGENHEIRO", Payload.NpcServiceVisited: true } ||
                    GameRunNpcs.NeedsRescue(node))
                    return GameRunOperationResult<GameRunDto>.Fail("NPC_INDISPONIVEL", "Visite um Engenheiro para consertar seu equipamento.");
                try { run.EstadoAtualJson = GameRunNpcServices.RepairDefense(run.EstadoAtualJson, request.ItemId, node.Payload.RepairPricePer10Percent); }
                catch (Exception error) when (error is InvalidOperationException or JsonException or OverflowException)
                { return GameRunOperationResult<GameRunDto>.Fail("CONSERTO_INVALIDO", error.Message); }
                run.Revisao++;
                run.AtualizadaEmUtc = DateTime.UtcNow;
                var response = GameRunService.Map(run);
                await SaveCommand(run, userId, request, "CONSERTAR_DEFESA", hash, response, token);
                return GameRunOperationResult<GameRunDto>.Ok(response);
            }, token);
        }
        catch (DbUpdateConcurrencyException) { return Stale<GameRunDto>(); }
        catch (KeyNotFoundException) { return MissingUser<GameRunDto>(); }
    }
}
