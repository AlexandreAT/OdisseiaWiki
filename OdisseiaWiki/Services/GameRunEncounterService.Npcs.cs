using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.GameRuns;
using OdisseiaWiki.GameRuns.Inventory;
using OdisseiaWiki.GameRuns.Map;
using OdisseiaWiki.Models;

namespace OdisseiaWiki.Services;

public sealed partial class GameRunEncounterService
{
    public async Task<GameRunOperationResult<GameRunDto>> UpgradeWeaponAsync(long runId, int userId,
        GameRunVendorPurchaseRequestDto request, CancellationToken token)
    {
        if (!Valid(request) || string.IsNullOrWhiteSpace(request.ItemId) || request.ItemId.Length > 100 || request.ToStash)
            return GameRunOperationResult<GameRunDto>.Fail("REQUISICAO_INVALIDA", "Escolha uma arma da mochila.");
        string hash = Hash($"MELHORAR_ARMA|{runId}|{request.ItemId}|{request.RevisaoEsperada}");
        try
        {
            return await _runs.ExecuteWithUserLockAsync(userId, async () =>
            {
                var previous = await _runs.GetCommandAsync(userId, request.ChaveIdempotencia, token);
                if (previous is not null) return Replay<GameRunDto>(previous, "MELHORAR_ARMA", hash);
                var run = await _runs.GetByIdAsync(runId, userId, token);
                var failure = Check<GameRunDto>(run, request.RevisaoEsperada!.Value);
                if (failure is not null) return failure;
                var map = GameRunFirstMap.Read(run!.MapaJson, JsonOptions);
                var node = map.Nodes.SingleOrDefault(item => item.Id == run.NoAtualId);
                if (node is not { Type: "NPC", State: "SELECIONADO", Payload.NpcType: "ENGENHEIRO", Payload.NpcServiceVisited: true } ||
                    GameRunNpcs.NeedsRescue(node))
                    return GameRunOperationResult<GameRunDto>.Fail("NPC_INDISPONIVEL", "Visite um Engenheiro para melhorar sua arma.");
                try { run.EstadoAtualJson = GameRunNpcServices.UpgradeWeapon(run.EstadoAtualJson, request.ItemId, node.Payload.Upgrade); }
                catch (Exception error) when (error is InvalidOperationException or JsonException or OverflowException)
                { return GameRunOperationResult<GameRunDto>.Fail("MELHORIA_INVALIDA", error.Message); }
                run.Revisao++;
                run.AtualizadaEmUtc = DateTime.UtcNow;
                var response = GameRunService.Map(run);
                await SaveCommand(run, userId, request, "MELHORAR_ARMA", hash, response, token);
                return GameRunOperationResult<GameRunDto>.Ok(response);
            }, token);
        }
        catch (DbUpdateConcurrencyException) { return Stale<GameRunDto>(); }
        catch (KeyNotFoundException) { return MissingUser<GameRunDto>(); }
    }

    public async Task<GameRunOperationResult<GameRunBaseResolutionDto>> VisitNpcAsync(long runId, string nodeId,
        int userId, GameRunMutationRequestDto request, CancellationToken token)
    {
        if (!Valid(request) || string.IsNullOrWhiteSpace(nodeId) || nodeId.Length > 80)
            return GameRunOperationResult<GameRunBaseResolutionDto>.Fail("REQUISICAO_INVALIDA", "Escolha um NPC disponível.");
        string hash = Hash($"NPC|{runId}|{nodeId}|{request.RevisaoEsperada}");
        try
        {
            return await _runs.ExecuteWithUserLockAsync(userId, async () =>
            {
                var previous = await _runs.GetCommandAsync(userId, request.ChaveIdempotencia, token);
                if (previous is not null) return Replay<GameRunBaseResolutionDto>(previous, "NPC", hash);
                var run = await _runs.GetByIdAsync(runId, userId, token);
                var failure = Check<GameRunBaseResolutionDto>(run, request.RevisaoEsperada!.Value);
                if (failure is not null) return failure;
                var map = GameRunFirstMap.Read(run!.MapaJson, JsonOptions);
                var node = map.Nodes.SingleOrDefault(item => item.Id == nodeId);
                if (run.NoAtualId is not null || node?.Type != "NPC" || node.State != "DISPONIVEL" ||
                    node.Payload is not { NpcCode.Length: > 0, NpcType: "MERCADOR" or "MEDICO" or "SABIO" or "ENGENHEIRO" } payload)
                    return GameRunOperationResult<GameRunBaseResolutionDto>.Fail("NPC_INDISPONIVEL", "Este NPC não está disponível no caminho atual.");
                var version = await _systems.GetVersionAsync(run.IdSistemaVersao, includeConfiguration: true);
                if (version is null) return GameRunOperationResult<GameRunBaseResolutionDto>.Fail("SISTEMA_INDISPONIVEL", "Sistema indisponível.");
                var memory = await _runs.GetCharacterMemoryAsync(userId, run.IdPersonagemJogadorOrigem, token);
                var state = GameCharacterMilestones.Read(memory?.EstadoJson);
                bool rescue = payload.NpcLocked && !GameRunNpcs.IsRescued(state, run.GameModeVersion.Codigo,
                    version.IdSistemaRpg, payload.NpcCode);
                if (rescue && await _runs.GetOwnedCharacterAsync(userId, run.IdPersonagemJogadorOrigem, token) is null)
                    return GameRunOperationResult<GameRunBaseResolutionDto>.Fail("PERSONAGEM_NAO_ENCONTRADO", "Este personagem não está mais disponível.");
                if (!rescue && payload.NpcType == "MERCADOR" && payload.Offers is not { Count: > 0 })
                    return GameRunOperationResult<GameRunBaseResolutionDto>.Fail("NPC_INDISPONIVEL", "O catálogo deste Mercador não está configurado.");
                try { GameRunMapGenerator.Select(map, nodeId); }
                catch (InvalidOperationException)
                {
                    return GameRunOperationResult<GameRunBaseResolutionDto>.Fail("NPC_INDISPONIVEL", "Este NPC não pertence ao caminho atual.");
                }
                int life = 0, mana = 0, stamina = 0;
                string updated = run.EstadoAtualJson;
                if (!rescue && payload.NpcType == "MEDICO")
                {
                    try { (updated, life, mana, stamina) = GameRunRecovery.RestoreToLimits(updated, version); }
                    catch (Exception error) when (error is InvalidOperationException or JsonException or OverflowException)
                    {
                        return GameRunOperationResult<GameRunBaseResolutionDto>.Fail("CURA_INDISPONIVEL", error.Message);
                    }
                }
                if (rescue)
                {
                    state.RescuedNpcs.Add(new(run.GameModeVersion.Codigo, version.IdSistemaRpg, payload.NpcCode));
                    if (memory is null)
                    {
                        memory = new GameCharacterMemory { IdPersonagemJogador = run.IdPersonagemJogadorOrigem };
                        await _runs.AddCharacterMemoryAsync(memory, token);
                    }
                    memory.EstadoJson = state.Serialize();
                    memory.AtualizadaEmUtc = DateTime.UtcNow;
                }
                GameRunNpcs.ApplyMemory(map, state, run.GameModeVersion.Codigo, version.IdSistemaRpg);
                payload.NpcServiceVisited = !rescue;
                if (rescue || payload.NpcType == "MEDICO") map = CompleteServiceNode(run, map, node);
                else { run.NoAtualId = nodeId; run.Fase = node.Fase; }
                run.MapaJson = JsonSerializer.Serialize(map, JsonOptions);
                run.EstadoAtualJson = updated;
                run.Revisao++;
                run.AtualizadaEmUtc = DateTime.UtcNow;
                var response = new GameRunBaseResolutionDto(GameRunService.Map(run), nodeId, node.Name, life, mana, stamina)
                { Tipo = rescue ? "NPC_RESGATE" : $"NPC_{payload.NpcType}" };
                await SaveCommand(run, userId, request, "NPC", hash, response, token);
                return GameRunOperationResult<GameRunBaseResolutionDto>.Ok(response);
            }, token);
        }
        catch (DbUpdateConcurrencyException) { return Stale<GameRunBaseResolutionDto>(); }
        catch (KeyNotFoundException) { return MissingUser<GameRunBaseResolutionDto>(); }
    }

    private static GameRunMapDto CompleteServiceNode(GameRun run, GameRunMapDto map, GameRunMapNodeDto node)
    {
        GameRunMapGenerator.Complete(map, node.Id);
        var completed = node;
        while (completed.Connections.Count == 0 && map.ParentNodes is not null && !map.IsSecretFinal)
        {
            string portalId = map.SecretReturnNodeId!;
            map = GameRunMapGenerator.ReturnFromSecret(map);
            completed = map.Nodes.Single(parent => parent.Id == portalId);
        }
        run.Fase = completed.Fase;
        if (completed.Connections.Count == 0)
        {
            run.Status = GameRunStatus.Vitoria;
            run.EncerradaEmUtc = DateTime.UtcNow;
        }
        run.NoAtualId = null;
        return map;
    }
}
