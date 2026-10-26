using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.GameRuns;
using OdisseiaWiki.GameRuns.Battle;
using OdisseiaWiki.GameRuns.Inventory;
using OdisseiaWiki.GameRuns.Map;
using OdisseiaWiki.Models;

namespace OdisseiaWiki.Services;

public sealed partial class GameRunEncounterService
{
    public async Task<GameRunOperationResult<GameRunDto>> EnterVendorAsync(long runId, string nodeId,
        int userId, GameRunMutationRequestDto request, CancellationToken token)
    {
        if (!Valid(request) || string.IsNullOrWhiteSpace(nodeId) || nodeId.Length > 80)
            return GameRunOperationResult<GameRunDto>.Fail("REQUISICAO_INVALIDA", "Escolha um vendedor disponível.");
        string hash = Hash($"ENTRAR_VENDEDOR|{runId}|{nodeId}|{request.RevisaoEsperada}");
        try
        {
            return await _runs.ExecuteWithUserLockAsync(userId, async () =>
            {
                GameRunCommand? previous = await _runs.GetCommandAsync(userId, request.ChaveIdempotencia, token);
                if (previous is not null) return Replay<GameRunDto>(previous, "ENTRAR_VENDEDOR", hash);
                GameRun? run = await _runs.GetByIdAsync(runId, userId, token);
                GameRunOperationResult<GameRunDto>? failure = Check<GameRunDto>(run, request.RevisaoEsperada!.Value);
                if (failure is not null) return failure;
                GameRunMapDto map = GameRunFirstMap.Read(run!.MapaJson, JsonOptions);
                GameRunMapNodeDto? node = map.Nodes.SingleOrDefault(item => item.Id == nodeId);
                if (run.NoAtualId is not null || node?.Type != "VENDEDOR" || node.State != "DISPONIVEL" ||
                    node.Payload?.Offers is not { Count: > 0 })
                    return GameRunOperationResult<GameRunDto>.Fail("VENDEDOR_INDISPONIVEL", "Este vendedor não está disponível.");
                try { GameRunMapGenerator.Select(map, nodeId); }
                catch (InvalidOperationException)
                {
                    return GameRunOperationResult<GameRunDto>.Fail("VENDEDOR_INDISPONIVEL", "O vendedor não pertence ao caminho atual.");
                }
                if (_itemValues is not null)
                    run.EstadoAtualJson = await _itemValues.ResolveAsync(run.EstadoAtualJson, run.GameModeVersion, token);
                run.MapaJson = JsonSerializer.Serialize(map, JsonOptions);
                run.NoAtualId = nodeId;
                run.Fase = node.Fase;
                run.Revisao++;
                run.AtualizadaEmUtc = DateTime.UtcNow;
                GameRunDto response = GameRunService.Map(run);
                await SaveCommand(run, userId, request, "ENTRAR_VENDEDOR", hash, response, token);
                return GameRunOperationResult<GameRunDto>.Ok(response);
            }, token);
        }
        catch (DbUpdateConcurrencyException) { return Stale<GameRunDto>(); }
        catch (KeyNotFoundException) { return MissingUser<GameRunDto>(); }
    }

    public async Task<GameRunOperationResult<GameRunDto>> BuyVendorItemAsync(long runId, int userId,
        GameRunVendorPurchaseRequestDto request, CancellationToken token)
    {
        if (!Valid(request) || string.IsNullOrWhiteSpace(request.ItemId) || request.ItemId.Length > 100)
            return GameRunOperationResult<GameRunDto>.Fail("REQUISICAO_INVALIDA", "Escolha uma oferta válida.");
        string hash = Hash($"COMPRAR|{runId}|{request.RevisaoEsperada}|{request.ItemId}|{request.ToStash}");
        try
        {
            return await _runs.ExecuteWithUserLockAsync(userId, async () =>
            {
                GameRunCommand? previous = await _runs.GetCommandAsync(userId, request.ChaveIdempotencia, token);
                if (previous is not null) return Replay<GameRunDto>(previous, "COMPRAR", hash);
                GameRun? run = await _runs.GetByIdAsync(runId, userId, token);
                GameRunOperationResult<GameRunDto>? failure = Check<GameRunDto>(run, request.RevisaoEsperada!.Value);
                if (failure is not null) return failure;
                if (request.ToStash && !GameRunEconomy.StashEnabled)
                    return GameRunOperationResult<GameRunDto>.Fail("STASH_INDISPONIVEL", GameRunEconomy.StashUnavailableMessage);
                GameRunMapDto map = GameRunFirstMap.Read(run!.MapaJson, JsonOptions);
                GameRunMapNodeDto? node = map.Nodes.SingleOrDefault(item => item.Id == run.NoAtualId);
                if (node is null || !GameRunNpcs.HasCatalog(node) || GameRunNpcs.NeedsRescue(node) ||
                    node.Type == "NPC" && node.Payload?.NpcServiceVisited != true || node.State != "SELECIONADO")
                    return GameRunOperationResult<GameRunDto>.Fail("VENDEDOR_INDISPONIVEL", "Entre no vendedor antes de comprar.");
                GameModeVendorOfferDto? offer = node.Payload?.Offers?.SingleOrDefault(item => item.ItemId == request.ItemId);
                if (offer?.Snapshot is null || offer.Stock < 1)
                    return GameRunOperationResult<GameRunDto>.Fail("ESTOQUE_ESGOTADO", "Esta oferta não está mais disponível.");
                try
                {
                    bool service = node.Type == "NPC" && node.Payload?.NpcType is "SABIO" or "ENGENHEIRO";
                    if (service && request.ToStash)
                        return GameRunOperationResult<GameRunDto>.Fail("DESTINO_INVALIDO", "Este serviço entrega diretamente ao personagem.");
                    var system = await _systems.GetVersionAsync(run.IdSistemaVersao, includeConfiguration: true);
                    if (system is null) return GameRunOperationResult<GameRunDto>.Fail("SISTEMA_INDISPONIVEL", "Sistema indisponível.");
                    if (node.Payload?.NpcType == "ENGENHEIRO" && offer.Snapshot["tipo"]?.ToString() != "implante")
                        return GameRunOperationResult<GameRunDto>.Fail("OFERTA_INVALIDA", "O Engenheiro vende apenas próteses.");
                    string updated = node.Payload?.NpcType == "SABIO"
                        ? GameRunNpcServices.Learn(run.EstadoAtualJson, offer, system)
                        : GameRunEconomy.Buy(run.EstadoAtualJson, offer.Snapshot, offer.ItemId, offer.Price, request.ToStash);
                    if (_itemValues is not null)
                        updated = await _itemValues.ResolveAsync(updated, run.GameModeVersion, token);
                    if (!request.ToStash)
                    {
                        updated = GameRunCarry.Reconcile(updated, system);
                    }
                    run.EstadoAtualJson = updated;
                }
                catch (Exception error) when (error is InvalidOperationException or JsonException or OverflowException or FormatException)
                {
                    return GameRunOperationResult<GameRunDto>.Fail("COMPRA_INVALIDA", error.Message);
                }
                offer.Stock--;
                run.MapaJson = JsonSerializer.Serialize(map, JsonOptions);
                run.Revisao++;
                run.AtualizadaEmUtc = DateTime.UtcNow;
                GameRunDto response = GameRunService.Map(run);
                await SaveCommand(run, userId, request, "COMPRAR", hash, response, token);
                return GameRunOperationResult<GameRunDto>.Ok(response);
            }, token);
        }
        catch (DbUpdateConcurrencyException) { return Stale<GameRunDto>(); }
        catch (KeyNotFoundException) { return MissingUser<GameRunDto>(); }
    }

    public async Task<GameRunOperationResult<GameRunDto>> LeaveVendorAsync(long runId, int userId,
        GameRunMutationRequestDto request, CancellationToken token)
    {
        if (!Valid(request)) return GameRunOperationResult<GameRunDto>.Fail("REQUISICAO_INVALIDA", "Informe a revisão da run.");
        string hash = Hash($"SAIR_VENDEDOR|{runId}|{request.RevisaoEsperada}");
        try
        {
            return await _runs.ExecuteWithUserLockAsync(userId, async () =>
            {
                GameRunCommand? previous = await _runs.GetCommandAsync(userId, request.ChaveIdempotencia, token);
                if (previous is not null) return Replay<GameRunDto>(previous, "SAIR_VENDEDOR", hash);
                GameRun? run = await _runs.GetByIdAsync(runId, userId, token);
                GameRunOperationResult<GameRunDto>? failure = Check<GameRunDto>(run, request.RevisaoEsperada!.Value);
                if (failure is not null) return failure;
                GameRunMapDto map = GameRunFirstMap.Read(run!.MapaJson, JsonOptions);
                GameRunMapNodeDto? node = map.Nodes.SingleOrDefault(item => item.Id == run.NoAtualId);
                if (node is null || !GameRunNpcs.HasCatalog(node) || GameRunNpcs.NeedsRescue(node) ||
                    node.Type == "NPC" && node.Payload?.NpcServiceVisited != true || node.State != "SELECIONADO")
                    return GameRunOperationResult<GameRunDto>.Fail("VENDEDOR_INDISPONIVEL", "Não há vendedor aberto.");
                map = CompleteServiceNode(run, map, node);
                run.MapaJson = JsonSerializer.Serialize(map, JsonOptions);
                run.NoAtualId = null;
                run.Revisao++;
                run.AtualizadaEmUtc = DateTime.UtcNow;
                GameRunDto response = GameRunService.Map(run);
                await SaveCommand(run, userId, request, "SAIR_VENDEDOR", hash, response, token);
                return GameRunOperationResult<GameRunDto>.Ok(response);
            }, token);
        }
        catch (DbUpdateConcurrencyException) { return Stale<GameRunDto>(); }
        catch (KeyNotFoundException) { return MissingUser<GameRunDto>(); }
    }

    public async Task<GameRunOperationResult<GameRunDto>> TransferStashItemAsync(long runId, int userId,
        GameRunStashTransferRequestDto request, CancellationToken token)
    {
        if (!Valid(request) || string.IsNullOrWhiteSpace(request.ItemId) || request.ItemId.Length > 100)
            return GameRunOperationResult<GameRunDto>.Fail("REQUISICAO_INVALIDA", "Escolha um item válido.");
        string hash = Hash($"STASH|{runId}|{request.RevisaoEsperada}|{request.ItemId}|{request.ToStash}");
        try
        {
            return await _runs.ExecuteWithUserLockAsync(userId, async () =>
            {
                GameRunCommand? previous = await _runs.GetCommandAsync(userId, request.ChaveIdempotencia, token);
                if (previous is not null) return Replay<GameRunDto>(previous, "STASH", hash);
                GameRun? run = await _runs.GetByIdAsync(runId, userId, token);
                GameRunMapDto map = run is null ? new() : GameRunFirstMap.Read(run.MapaJson, JsonOptions);
                GameRunOperationResult<GameRunDto>? failure = Check<GameRunDto>(run, request.RevisaoEsperada!.Value,
                    allowVictory: run is not null && GameRunEconomy.CanAccessStash(map, run.NoAtualId));
                if (failure is not null) return failure;
                if (!GameRunEconomy.StashEnabled)
                    return GameRunOperationResult<GameRunDto>.Fail("STASH_INDISPONIVEL", GameRunEconomy.StashUnavailableMessage);
                if (!GameRunEconomy.CanAccessStash(map, run!.NoAtualId))
                    return GameRunOperationResult<GameRunDto>.Fail("STASH_INDISPONIVEL", "Visite uma Base ou um Mercador para acessar o depósito.");
                var version = await _systems.GetVersionAsync(run.IdSistemaVersao, includeConfiguration: true);
                if (version is null) return GameRunOperationResult<GameRunDto>.Fail("SISTEMA_INDISPONIVEL", "Sistema indisponível.");
                try
                {
                    string snapshot = run.EstadoAtualJson;
                    if (request.ToStash)
                    {
                        snapshot = GameRunDefensiveEquipment.UnequipIfNeeded(snapshot, request.ItemId);
                        snapshot = GameRunCarry.RemoveUnequippedItemConditions(snapshot, request.ItemId, version);
                    }
                    run.EstadoAtualJson = GameRunCarry.Reconcile(
                        GameRunEconomy.Transfer(snapshot, request.ItemId, request.ToStash), version);
                    if (_itemValues is not null)
                        run.EstadoAtualJson = await _itemValues.ResolveAsync(run.EstadoAtualJson, run.GameModeVersion, token);
                }
                catch (Exception error) when (error is InvalidOperationException or JsonException)
                {
                    return GameRunOperationResult<GameRunDto>.Fail("ITEM_INVALIDO", error.Message);
                }
                if (request.ToStash && GameRunActionLoadout.Read(run.LoadoutJson) is { } actions)
                    run.LoadoutJson = GameRunActionLoadout.Serialize(actions.Where(action =>
                        action.IdInstancia != request.ItemId).ToArray());
                run.Revisao++;
                run.AtualizadaEmUtc = DateTime.UtcNow;
                GameRunDto response = GameRunService.Map(run);
                await SaveCommand(run, userId, request, "STASH", hash, response, token);
                return GameRunOperationResult<GameRunDto>.Ok(response);
            }, token);
        }
        catch (DbUpdateConcurrencyException) { return Stale<GameRunDto>(); }
        catch (KeyNotFoundException) { return MissingUser<GameRunDto>(); }
    }
}
