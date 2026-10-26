using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.GameRuns;
using OdisseiaWiki.GameRuns.Inventory;
using OdisseiaWiki.GameRuns.Map;
using OdisseiaWiki.Models;

namespace OdisseiaWiki.Services;

public sealed partial class GameRunEncounterService
{
    public async Task<GameRunProtectedDepositDto?> GetProtectedDepositAsync(long runId, int userId, CancellationToken token)
    {
        var run = await _runs.GetByIdAsync(runId, userId, token);
        if (run is null) return null;
        // The recap is immutable even if a later run retrieves these protected items.
        if (run.Status != OdisseiaWiki.Enums.GameRunStatus.Ativa)
        {
            using var snapshot = System.Text.Json.JsonDocument.Parse(run.EstadoAtualJson);
            if (snapshot.RootElement.TryGetProperty("protectedDepositAtEnd", out var recap))
                return System.Text.Json.JsonSerializer.Deserialize<GameRunProtectedDepositDto>(recap, JsonOptions);
        }
        var version = await _systems.GetVersionAsync(run.IdSistemaVersao, includeConfiguration: true);
        if (version is null) return null;
        var memory = await _runs.GetCharacterMemoryAsync(userId, run.IdPersonagemJogadorOrigem, token);
        return GameProtectedDeposit.View(GameCharacterMilestones.Read(memory?.EstadoJson),
            run.GameModeVersion.Codigo, version.IdSistemaRpg, run.IdSistemaVersao, run.GameModeVersion.ConfiguracaoJson);
    }

    private async Task CaptureProtectedDepositAtEnd(GameRun run, SistemaVersao version, CancellationToken token)
    {
        var memory = await _runs.GetCharacterMemoryAsync(run.IdUsuario, run.IdPersonagemJogadorOrigem, token);
        var deposit = GameProtectedDeposit.View(GameCharacterMilestones.Read(memory?.EstadoJson),
            run.GameModeVersion.Codigo, version.IdSistemaRpg, run.IdSistemaVersao, run.GameModeVersion.ConfiguracaoJson);
        var snapshot = System.Text.Json.Nodes.JsonNode.Parse(run.EstadoAtualJson)!.AsObject();
        snapshot["protectedDepositAtEnd"] = System.Text.Json.JsonSerializer.SerializeToNode(deposit, JsonOptions);
        run.EstadoAtualJson = snapshot.ToJsonString(JsonOptions);
    }

    public async Task<GameRunOperationResult<GameRunDto>> ChangeProtectedItemAsync(long runId, int userId,
        GameRunProtectedItemRequestDto request, CancellationToken token)
    {
        if (!Valid(request) || string.IsNullOrWhiteSpace(request.ItemId) || request.ItemId.Length > 100 ||
            request.Action is not ("PROTECT" or "RELEASE" or "TAKE"))
            return GameRunOperationResult<GameRunDto>.Fail("REQUISICAO_INVALIDA", "Escolha uma operação válida para o depósito.");
        string hash = Hash($"PROTECTED|{runId}|{request.RevisaoEsperada}|{request.ItemId}|{request.Action}");
        try
        {
            return await _runs.ExecuteWithUserLockAsync(userId, async () =>
            {
                var previous = await _runs.GetCommandAsync(userId, request.ChaveIdempotencia, token);
                if (previous is not null) return Replay<GameRunDto>(previous, "PROTECTED", hash);
                var run = await _runs.GetByIdAsync(runId, userId, token);
                var map = run is null ? new GameRunMapDto() : GameRunFirstMap.Read(run.MapaJson, JsonOptions);
                var failure = Check<GameRunDto>(run, request.RevisaoEsperada!.Value,
                    allowVictory: run is not null && GameRunEconomy.CanAccessStash(map, run.NoAtualId));
                if (failure is not null) return failure;
                if (!GameRunEconomy.CanAccessStash(map, run!.NoAtualId))
                    return GameRunOperationResult<GameRunDto>.Fail("STASH_INDISPONIVEL", "Visite uma Base ou um Mercador para acessar o depósito.");
                var active = await _runs.GetActiveAsync(userId, token);
                if (active is not null && active.IdGameRun != runId)
                    return GameRunOperationResult<GameRunDto>.Fail("RUN_ENCERRADA", "Use o depósito da sua jornada atual.");
                if (await _runs.GetOwnedCharacterAsync(userId, run.IdPersonagemJogadorOrigem, token) is null)
                    return GameRunOperationResult<GameRunDto>.Fail("PERSONAGEM_NAO_ENCONTRADO", "Este personagem não está mais disponível.");
                var version = await _systems.GetVersionAsync(run.IdSistemaVersao, includeConfiguration: true);
                if (version is null) return GameRunOperationResult<GameRunDto>.Fail("SISTEMA_INDISPONIVEL", "Sistema indisponível.");
                var memory = await _runs.GetCharacterMemoryAsync(userId, run.IdPersonagemJogadorOrigem, token);
                var state = GameCharacterMilestones.Read(memory?.EstadoJson);
                string updated;
                try
                {
                    updated = GameProtectedDeposit.Change(run.EstadoAtualJson, state, run.GameModeVersion.Codigo,
                        version.IdSistemaRpg, run.IdSistemaVersao, run.GameModeVersion.ConfiguracaoJson,
                        request.ItemId, request.Action);
                    updated = GameRunCarry.Reconcile(updated, version);
                }
                catch (InvalidOperationException error)
                {
                    return GameRunOperationResult<GameRunDto>.Fail("PROTECAO_INVALIDA", error.Message);
                }
                if (memory is null)
                {
                    memory = new GameCharacterMemory { IdPersonagemJogador = run.IdPersonagemJogadorOrigem };
                    await _runs.AddCharacterMemoryAsync(memory, token);
                }
                memory.EstadoJson = state.Serialize();
                memory.AtualizadaEmUtc = DateTime.UtcNow;
                run.EstadoAtualJson = updated;
                run.Revisao++;
                run.AtualizadaEmUtc = DateTime.UtcNow;
                var response = GameRunService.Map(run);
                await SaveCommand(run, userId, request, "PROTECTED", hash, response, token);
                return GameRunOperationResult<GameRunDto>.Ok(response);
            }, token);
        }
        catch (DbUpdateConcurrencyException) { return Stale<GameRunDto>(); }
        catch (KeyNotFoundException) { return MissingUser<GameRunDto>(); }
    }
}
