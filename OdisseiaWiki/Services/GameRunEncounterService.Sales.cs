using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.GameRuns;
using OdisseiaWiki.GameRuns.Battle;
using OdisseiaWiki.GameRuns.Inventory;
using OdisseiaWiki.GameRuns.Map;
using OdisseiaWiki.Models;

namespace OdisseiaWiki.Services;

public sealed partial class GameRunEncounterService
{
    public async Task<GameRunOperationResult<GameRunDto>> SellVendorItemsAsync(long runId, int userId,
        GameRunVendorSaleRequestDto request, CancellationToken token)
    {
        if (!Valid(request) || request.Items is null || request.Items.Count is < 1 or > 100 ||
            request.Items.Any(line => line is null || string.IsNullOrWhiteSpace(line.ItemId) ||
                line.ItemId.Length > 100 || line.Quantity is < 1 or > 1_000_000))
            return GameRunOperationResult<GameRunDto>.Fail("REQUISICAO_INVALIDA", "Escolha os itens e a quantidade da venda.");
        string hash = Hash($"VENDER|{runId}|{request.RevisaoEsperada}|{request.FromStash}|" +
            JsonSerializer.Serialize(request.Items.OrderBy(line => line.ItemId, StringComparer.Ordinal), JsonOptions));
        try
        {
            return await _runs.ExecuteWithUserLockAsync(userId, async () =>
            {
                GameRunCommand? previous = await _runs.GetCommandAsync(userId, request.ChaveIdempotencia, token);
                if (previous is not null) return Replay<GameRunDto>(previous, "VENDER", hash);
                GameRun? run = await _runs.GetByIdAsync(runId, userId, token);
                GameRunOperationResult<GameRunDto>? failure = Check<GameRunDto>(run, request.RevisaoEsperada!.Value);
                if (failure is not null) return failure;
                if (request.FromStash && !GameRunEconomy.StashEnabled)
                    return GameRunOperationResult<GameRunDto>.Fail("STASH_INDISPONIVEL", GameRunEconomy.StashUnavailableMessage);
                GameRunMapDto map = GameRunFirstMap.Read(run!.MapaJson, JsonOptions);
                GameRunMapNodeDto? node = map.Nodes.SingleOrDefault(item => item.Id == run.NoAtualId);
                if (node?.Type != "VENDEDOR" || node.State != "SELECIONADO")
                    return GameRunOperationResult<GameRunDto>.Fail("VENDEDOR_INDISPONIVEL", "Entre no vendedor antes de vender.");
                var version = await _systems.GetVersionAsync(run.IdSistemaVersao, includeConfiguration: true);
                if (version is null) return GameRunOperationResult<GameRunDto>.Fail("SISTEMA_INDISPONIVEL", "Sistema indisponível.");
                try
                {
                    if (_itemValues is not null)
                        run.EstadoAtualJson = await _itemValues.ResolveAsync(run.EstadoAtualJson, run.GameModeVersion, token);
                    int discount = JsonSerializer.Deserialize<GameBattlePreviewConfig>(run.GameModeVersion.ConfiguracaoJson, JsonOptions)
                        ?.SaleDiscountPercent ?? 0;
                    GameRunSale sale = GameRunEconomy.Sell(run.EstadoAtualJson, request.Items, discount, request.FromStash);
                    if (!request.FromStash && sale.RemovedItemIds.Count > 0)
                    {
                        // Validate the whole sale first, then remove equipment effects while their sources still exist.
                        string prepared = run.EstadoAtualJson;
                        foreach (string itemId in sale.RemovedItemIds)
                        {
                            prepared = GameRunDefensiveEquipment.UnequipIfNeeded(prepared, itemId);
                            prepared = GameRunCarry.RemoveUnequippedItemConditions(prepared, itemId, version);
                        }
                        sale = GameRunEconomy.Sell(prepared, request.Items, discount, false);
                    }
                    string updated = GameRunCarry.Reconcile(sale.Snapshot, version);
                    string? loadout = run.LoadoutJson;
                    if (!request.FromStash && GameRunActionLoadout.Read(loadout) is { } actions)
                        loadout = GameRunActionLoadout.Serialize(actions.Where(action =>
                            !sale.RemovedItemIds.Contains(action.IdInstancia)).ToArray());
                    run.EstadoAtualJson = updated;
                    run.LoadoutJson = loadout;
                }
                catch (Exception error) when (error is InvalidOperationException or JsonException or OverflowException)
                {
                    return GameRunOperationResult<GameRunDto>.Fail("VENDA_INVALIDA", error.Message);
                }
                run.Revisao++;
                run.AtualizadaEmUtc = DateTime.UtcNow;
                GameRunDto response = GameRunService.Map(run);
                await SaveCommand(run, userId, request, "VENDER", hash, response, token);
                return GameRunOperationResult<GameRunDto>.Ok(response);
            }, token);
        }
        catch (DbUpdateConcurrencyException) { return Stale<GameRunDto>(); }
        catch (KeyNotFoundException) { return MissingUser<GameRunDto>(); }
    }
}
