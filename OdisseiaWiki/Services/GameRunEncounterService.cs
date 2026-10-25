using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.GameRuns;
using OdisseiaWiki.GameRuns.Battle;
using OdisseiaWiki.GameRuns.Inventory;
using OdisseiaWiki.GameRuns.Map;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Helpers;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Services;

public sealed partial class GameRunEncounterService : IGameRunEncounterService
{
    private static readonly JsonSerializerOptions JsonOptions = CreateOptions();
    private readonly IGameRunRepository _runs;
    private readonly ISistemaRpgRepository _systems;
    private readonly GameBattlePreviewFactory _factory;
    private readonly IAutoBattleSimulator _simulator;
    private readonly GameRunItemValueResolver? _itemValues;

    public GameRunEncounterService(IGameRunRepository runs, ISistemaRpgRepository systems,
        GameBattlePreviewFactory factory, IAutoBattleSimulator simulator,
        GameRunItemValueResolver? itemValues = null)
    {
        _runs = runs;
        _systems = systems;
        _factory = factory;
        _simulator = simulator;
        _itemValues = itemValues;
    }

    public async Task<GameRunOperationResult<GameRunDto>> SelectAsync(
        long idGameRun, string noId, int idUsuario, GameRunMutationRequestDto request,
        CancellationToken cancellationToken)
    {
        if (!Valid(request) || idGameRun <= 0 || string.IsNullOrWhiteSpace(noId) || noId.Length > 80)
            return GameRunOperationResult<GameRunDto>.Fail("REQUISICAO_INVALIDA", "Escolha um nó disponível.");
        string hash = Hash($"SELECIONAR|{idGameRun}|{noId}|{request.RevisaoEsperada}");
        try
        {
            return await _runs.ExecuteWithUserLockAsync(idUsuario, async () =>
            {
                GameRunCommand? previous = await _runs.GetCommandAsync(
                    idUsuario, request.ChaveIdempotencia, cancellationToken);
                if (previous is not null) return Replay<GameRunDto>(previous, "SELECIONAR_NO", hash);

                GameRun? run = await _runs.GetByIdAsync(idGameRun, idUsuario, cancellationToken);
                GameRunOperationResult<GameRunDto>? failure = Check<GameRunDto>(run, request.RevisaoEsperada!.Value);
                if (failure is not null) return failure;
                if (run!.NoAtualId is not null)
                    return GameRunOperationResult<GameRunDto>.Fail("NO_JA_SELECIONADO", "Já existe um encontro selecionado.");
                GameRunMapDto map = GameRunFirstMap.Read(run.MapaJson, JsonOptions);
                GameRunMapNodeDto? node = map.Nodes.SingleOrDefault(item => item.Id == noId);
                if (node?.State != "DISPONIVEL" || node.Type is not ("COMBATE" or "ELITE" or "BOSS" or "CACADA"))
                    return GameRunOperationResult<GameRunDto>.Fail("NO_INDISPONIVEL", "Este encontro não está disponível.");

                try { GameRunMapGenerator.Select(map, noId); }
                catch (InvalidOperationException)
                {
                    return GameRunOperationResult<GameRunDto>.Fail(
                        "NO_INDISPONIVEL", "O encontro não pertence ao caminho atual.");
                }
                run.MapaJson = JsonSerializer.Serialize(map, JsonOptions);
                run.NoAtualId = noId;
                run.Fase = node.Fase;
                run.Revisao++;
                run.AtualizadaEmUtc = DateTime.UtcNow;
                GameRunDto response = GameRunService.Map(run);
                await SaveCommand(run, idUsuario, request, "SELECIONAR_NO", hash, response, cancellationToken);
                return GameRunOperationResult<GameRunDto>.Ok(response);
            }, cancellationToken);
        }
        catch (DbUpdateConcurrencyException) { return Stale<GameRunDto>(); }
        catch (KeyNotFoundException) { return MissingUser<GameRunDto>(); }
    }

    public async Task<GameRunOperationResult<GameRunBattleResolutionDto>> ResolveAsync(
        long idGameRun, int idUsuario, GameRunMutationRequestDto request,
        CancellationToken cancellationToken)
    {
        if (!Valid(request) || idGameRun <= 0)
            return GameRunOperationResult<GameRunBattleResolutionDto>.Fail(
                "REQUISICAO_INVALIDA", "Informe a revisão e uma chave de idempotência válidas.");
        IReadOnlyList<GameRunTargetDto> chosenTargets =
            (request as GameRunBattleRequestDto)?.Alvos ?? [];
        if (chosenTargets.Count > 4 || chosenTargets.Any(target => target is null ||
            string.IsNullOrWhiteSpace(target.ActorId) || string.IsNullOrWhiteSpace(target.TargetId)) ||
            chosenTargets.Select(target => target.ActorId).Distinct(StringComparer.Ordinal).Count() != chosenTargets.Count)
            return GameRunOperationResult<GameRunBattleResolutionDto>.Fail(
                "ALVO_INVALIDO", "Escolha um alvo válido para cada membro da equipe.");
        string hash = Hash($"RESOLVER_COMBATE|{idGameRun}|{request.RevisaoEsperada}|" +
            JsonSerializer.Serialize(chosenTargets, JsonOptions));
        try
        {
            return await _runs.ExecuteWithUserLockAsync(idUsuario, async () =>
            {
                GameRunCommand? previous = await _runs.GetCommandAsync(
                    idUsuario, request.ChaveIdempotencia, cancellationToken);
                if (previous is not null)
                    return Replay<GameRunBattleResolutionDto>(previous, "RESOLVER_COMBATE", hash);

                GameRun? run = await _runs.GetByIdAsync(idGameRun, idUsuario, cancellationToken);
                GameRunOperationResult<GameRunBattleResolutionDto>? failure = Check<GameRunBattleResolutionDto>(
                    run, request.RevisaoEsperada!.Value);
                if (failure is not null) return failure;
                if (run!.NoAtualId is null)
                    return GameRunOperationResult<GameRunBattleResolutionDto>.Fail(
                        "NO_INDISPONIVEL", "Selecione o encontro antes de iniciar o combate.");
                GameRunMapDto map = GameRunFirstMap.Read(run.MapaJson, JsonOptions);
                GameRunMapNodeDto? node = map.Nodes.SingleOrDefault(item => item.Id == run.NoAtualId);
                if (node?.State != "SELECIONADO" || node.Type is not ("COMBATE" or "ELITE" or "BOSS" or "CACADA"))
                    return GameRunOperationResult<GameRunBattleResolutionDto>.Fail(
                        "NO_INDISPONIVEL", "O encontro selecionado não está disponível.");
                if (await _runs.GetBattleAsync(run.IdGameRun, run.NoAtualId, cancellationToken) is not null)
                    return GameRunOperationResult<GameRunBattleResolutionDto>.Fail(
                        "COMBATE_JA_RESOLVIDO", "Este encontro já foi resolvido.");

                SistemaVersao? version = await _systems.GetVersionAsync(
                    run.IdSistemaVersao, includeConfiguration: true);
                if (version is null)
                    return GameRunOperationResult<GameRunBattleResolutionDto>.Fail(
                        "SISTEMA_INDISPONIVEL", "A versão das regras desta run não está disponível.");
                run.EstadoAtualJson = GameRunCarry.Reconcile(run.EstadoAtualJson, version);

                GameBattlePreviewSetup setup;
                try { setup = _factory.Build(GameRunService.Map(run), version, node.Payload?.EncounterCode); }
                catch (Exception error) when (error is JsonException or InvalidOperationException or ArgumentException or OverflowException)
                {
                    return GameRunOperationResult<GameRunBattleResolutionDto>.Fail(
                        "COMBATE_INDISPONIVEL", error.Message);
                }
                var targetMap = chosenTargets.ToDictionary(target => target.ActorId,
                    target => target.TargetId, StringComparer.Ordinal);
                if (targetMap.Any(target =>
                    target.Key != setup.Input.FirstActor.Id ||
                    !new[] { setup.Input.SecondActor.Id }
                        .Concat(setup.Input.AdditionalEnemies.Select(actor => actor.Id))
                        .Contains(target.Value, StringComparer.Ordinal)))
                    return GameRunOperationResult<GameRunBattleResolutionDto>.Fail(
                        "ALVO_INVALIDO", "Escolha um inimigo deste encontro.");
                setup = setup with { Input = setup.Input with
                {
                    PreferredTargets = targetMap,
                    OpeningOpportunityAttack = map.OpeningOpportunityPending,
                } };

                int seed = RandomNumberGenerator.GetInt32(1, int.MaxValue);
                GameBattleResult result;
                GameBattleActorState player;
                int xpReward = 0;
                int currencyReward = 0;
                IReadOnlyList<int> reachedLevels = [];
                GameRunGrantedPoints grantedPoints = new();
                string before = run.EstadoAtualJson;
                string after;
                try
                {
                    result = _simulator.Simulate(setup.Input, new SeededGameRunRandomSource(seed));
                    player = result.Actors.Single(actor => actor.Id == "player");
                    string battleState = ApplyResult(before, player);
                    foreach (IGrouping<string, GameBattleEvent> consumed in result.Events
                        .Where(gameEvent => gameEvent.Type == GameBattleEventTypes.ItemConsumed &&
                            gameEvent.ActorId == "player" && gameEvent.Payload is ItemConsumedPayload)
                        .GroupBy(gameEvent => ((ItemConsumedPayload)gameEvent.Payload).ActionId,
                            StringComparer.Ordinal))
                    {
                        if (!consumed.Key.StartsWith("item:", StringComparison.Ordinal)) continue;
                        battleState = GameRunConsumable.SpendInBattle(battleState,
                            consumed.Key[5..], consumed.Count());
                    }
                    after = GameRunCarry.Reconcile(GameRunCarry.PreserveBattleTriggers(
                        battleState, version, result.Events), version);
                    if (result.WinnerActorId == "player" && node.Payload?.EncounterCode is string encounterCode)
                    {
                        GameBattlePreviewConfig? mode = JsonSerializer.Deserialize<GameBattlePreviewConfig>(
                            run.GameModeVersion.ConfiguracaoJson, JsonOptions);
                        if (mode?.Encounters?.TryGetValue(encounterCode, out GameBattleEncounterConfig? encounter) == true)
                        {
                            xpReward = encounter.XpReward;
                            currencyReward = encounter.CurrencyReward;
                            var progressionRules = SistemaRpgConfiguration.LerRegras<SistemaRpgConfiguration.RegrasProgressao>(version, SistemaModuloTipo.Progressao);
                            after = GameRunLoot.Prepare(after, run.NoAtualId, encounter, progressionRules.DadoLootFaces ?? 0);
                            after = GameRunXpReward.Apply(after, xpReward);
                            after = GameRunEconomy.Credit(after, encounter.CurrencyReward);
                            if (xpReward > 0)
                            {
                                GameRunProgressionResult progression = GameRunProgression.Apply(after, version);
                                after = GameRunCarry.Reconcile(progression.SnapshotJson, version);
                                reachedLevels = progression.LevelsReached;
                                grantedPoints = progression.PointsGranted;
                            }
                        }
                    }
                }
                catch (Exception error) when (error is JsonException or InvalidOperationException or
                    ArgumentException or OverflowException or GameRunConsumableException)
                {
                    return GameRunOperationResult<GameRunBattleResolutionDto>.Fail(
                        "COMBATE_INDISPONIVEL", error.Message);
                }
                GameBattlePreviewDto battle = new(
                    1, run.IdGameRun, run.IdSistemaVersao, run.IdGameModeVersion,
                    setup.WeaponNames, setup.FallbackActionName,
                    MapActor(setup.Input.FirstActor), MapActor(setup.Input.SecondActor), result)
                {
                    XpConcedido = xpReward,
                    MoedaConcedida = currencyReward,
                    NiveisAlcancados = reachedLevels,
                    PontosConcedidos = grantedPoints,
                    Oponentes = new[] { setup.Input.SecondActor }
                        .Concat(setup.Input.AdditionalEnemies).Select(MapActor).ToArray(),
                };

                DateTime now = DateTime.UtcNow;
                GameRunBattle? previousBattle = await _runs.GetLastBattleAsync(run.IdGameRun, cancellationToken);
                int battleOrder = (previousBattle?.Ordem ?? 0) + 1;
                string completedNodeId = run.NoAtualId;
                await _runs.AddBattleAsync(new GameRunBattle
                {
                    IdGameRun = run.IdGameRun,
                    NoId = run.NoAtualId,
                    Ordem = battleOrder,
                    Seed = seed,
                    VencedorId = result.WinnerActorId,
                    ResultadoJson = JsonSerializer.Serialize(battle, JsonOptions),
                    EstadoAntesJson = before,
                    EstadoDepoisJson = after,
                    CriadaEmUtc = now,
                }, cancellationToken);
                run.EstadoAtualJson = after;
                if (GameRunActionLoadout.Read(run.LoadoutJson) is { } equippedActions)
                {
                    HashSet<string> exhausted = player.Actions.Where(action => action.RemainingQuantity == 0)
                        .Select(action => action.ActionId).ToHashSet(StringComparer.Ordinal);
                    if (exhausted.Count > 0)
                        run.LoadoutJson = GameRunActionLoadout.Serialize(equippedActions.Where(action =>
                            !exhausted.Contains($"{action.Tipo.ToLowerInvariant()}:{action.IdInstancia}")).ToArray());
                }
                map.OpeningOpportunityPending = false;
                GameRunMapGenerator.Complete(map, run.NoAtualId,
                    unlockChildren: result.WinnerActorId == "player");
                bool completedSecret = result.WinnerActorId == "player" &&
                    map.ParentNodes is not null && node.Connections.Count == 0;
                bool finalSecret = completedSecret && map.IsSecretFinal;
                string? portalId = null;
                if (completedSecret && !finalSecret)
                {
                    do
                    {
                        portalId = map.SecretReturnNodeId;
                        map = GameRunMapGenerator.ReturnFromSecret(map);
                        GameRunMapNodeDto portal = map.Nodes.Single(parent => parent.Id == portalId);
                        run.Fase = portal.Fase;
                        if (portal.Connections.Count > 0 || map.ParentNodes is null || map.IsSecretFinal) break;
                    } while (true);
                }
                run.MapaJson = JsonSerializer.Serialize(map, JsonOptions);
                run.NoAtualId = null;
                if (result.WinnerActorId != "player")
                {
                    run.Status = GameRunStatus.Derrota;
                    run.EncerradaEmUtc = now;
                }
                else if (finalSecret || completedSecret && portalId is not null &&
                    (map.ParentNodes is null || map.IsSecretFinal) &&
                    map.Nodes.Single(parent => parent.Id == portalId).Connections.Count == 0 ||
                    !completedSecret && (map.SchemaVersion >= 5
                        ? node.Connections.Count == 0 : node.Type == "BOSS"))
                {
                    run.Status = GameRunStatus.Vitoria;
                    run.EncerradaEmUtc = now;
                }
                run.Revisao++;
                run.AtualizadaEmUtc = now;
                var response = new GameRunBattleResolutionDto(
                    GameRunService.Map(run), battle, completedNodeId, battleOrder, now);
                if (result.WinnerActorId == "player")
                    await RememberVictory(run, version, node.Payload?.EncounterCode, cancellationToken);
                await SaveCommand(run, idUsuario, request, "RESOLVER_COMBATE", hash, response, cancellationToken);
                return GameRunOperationResult<GameRunBattleResolutionDto>.Ok(response);
            }, cancellationToken);
        }
        catch (DbUpdateConcurrencyException) { return Stale<GameRunBattleResolutionDto>(); }
        catch (KeyNotFoundException) { return MissingUser<GameRunBattleResolutionDto>(); }
    }

    public async Task<GameBattlePreviewDto?> GetBattleAsync(
        long idGameRun, int idUsuario, CancellationToken cancellationToken)
    {
        GameRun? run = await _runs.GetByIdAsync(idGameRun, idUsuario, cancellationToken);
        if (run is null) return null;
        GameRunBattle? battle = await _runs.GetBattleAsync(
            idGameRun, GameRunFirstMap.EncounterId, cancellationToken);
        return battle is null ? null : JsonSerializer.Deserialize<GameBattlePreviewDto>(
            battle.ResultadoJson, JsonOptions);
    }

    public async Task<GameRunEncounterSetupDto?> GetCurrentSetupAsync(
        long idGameRun, int idUsuario, CancellationToken cancellationToken)
    {
        GameRun? run = await _runs.GetByIdAsync(idGameRun, idUsuario, cancellationToken);
        if (run?.NoAtualId is null) return null;
        GameRunMapDto map = GameRunFirstMap.Read(run.MapaJson, JsonOptions);
        GameRunMapNodeDto? node = map.Nodes.SingleOrDefault(item => item.Id == run.NoAtualId);
        if (node?.State != "SELECIONADO" ||
            node.Type is not ("COMBATE" or "ELITE" or "BOSS" or "CACADA")) return null;
        SistemaVersao? version = await _systems.GetVersionAsync(
            run.IdSistemaVersao, includeConfiguration: true);
        if (version is null) return null;
        GameBattlePreviewSetup setup = _factory.Build(GameRunService.Map(run), version,
            node.Payload?.EncounterCode);
        return new GameRunEncounterSetupDto(
            [MapActor(setup.Input.FirstActor)],
            new[] { setup.Input.SecondActor }.Concat(setup.Input.AdditionalEnemies)
                .Select(MapActor).ToArray(),
            setup.Input.UseInitiative ? setup.Input.FirstActor.Initiative?.Formula : null);
    }

    public async Task<IReadOnlyList<GameRunBattleRecordDto>?> GetBattlesAsync(
        long idGameRun, int idUsuario, CancellationToken cancellationToken)
    {
        GameRun? run = await _runs.GetByIdAsync(idGameRun, idUsuario, cancellationToken);
        if (run is null) return null;
        IReadOnlyList<GameRunBattle> battles = await _runs.GetBattlesAsync(idGameRun, cancellationToken);
        return battles.Select(item => new GameRunBattleRecordDto(
            item.NoId, item.Ordem, item.CriadaEmUtc,
            JsonSerializer.Deserialize<GameBattlePreviewDto>(item.ResultadoJson, JsonOptions)
                ?? throw new JsonException("O histórico do combate está vazio."))).ToArray();
    }

    public async Task<GameRunOperationResult<GameRunDto>> UpdateWeaponOrderAsync(
        long idGameRun, int idUsuario, GameRunWeaponOrderRequestDto request,
        CancellationToken cancellationToken)
    {
        if (!Valid(request) || idGameRun <= 0 || request.OrdemArmas is null or { Count: > 200 })
            return GameRunOperationResult<GameRunDto>.Fail(
                "REQUISICAO_INVALIDA", "Informe a ordem das armas e a revisão da run.");
        string hash = Hash($"ORDENAR_ARMAS|{idGameRun}|{request.RevisaoEsperada}|" +
            JsonSerializer.Serialize(request.OrdemArmas));
        try
        {
            return await _runs.ExecuteWithUserLockAsync(idUsuario, async () =>
            {
                GameRunCommand? previous = await _runs.GetCommandAsync(
                    idUsuario, request.ChaveIdempotencia, cancellationToken);
                if (previous is not null) return Replay<GameRunDto>(previous, "ORDENAR_ARMAS", hash);

                GameRun? run = await _runs.GetByIdAsync(idGameRun, idUsuario, cancellationToken);
                GameRunOperationResult<GameRunDto>? failure = Check<GameRunDto>(run, request.RevisaoEsperada!.Value);
                if (failure is not null) return failure;
                if (run!.NoAtualId is not null)
                    return GameRunOperationResult<GameRunDto>.Fail(
                        "COMBATE_PENDENTE", "Conclua o encontro selecionado antes de reorganizar as armas.");

                IReadOnlyList<string> available = GameRunWeaponOrder.WeaponIds(
                    GameRunService.Map(run).EstadoAtual.Inventario);
                IReadOnlyList<string> requested = request.OrdemArmas!;
                if (available.Count != available.Distinct(StringComparer.Ordinal).Count() ||
                    requested.Count != available.Count ||
                    requested.Distinct(StringComparer.Ordinal).Count() != requested.Count ||
                    !available.ToHashSet(StringComparer.Ordinal).SetEquals(requested))
                    return GameRunOperationResult<GameRunDto>.Fail(
                        "ORDEM_ARMAS_INVALIDA", "A ordem deve conter exatamente as armas desta run, sem repetições.");

                run.LoadoutJson = GameRunWeaponOrder.Serialize(requested);
                run.Revisao++;
                run.AtualizadaEmUtc = DateTime.UtcNow;
                GameRunDto response = GameRunService.Map(run);
                await SaveCommand(run, idUsuario, request, "ORDENAR_ARMAS", hash, response, cancellationToken);
                return GameRunOperationResult<GameRunDto>.Ok(response);
            }, cancellationToken);
        }
        catch (DbUpdateConcurrencyException) { return Stale<GameRunDto>(); }
        catch (KeyNotFoundException) { return MissingUser<GameRunDto>(); }
    }

    public async Task<GameRunOperationResult<GameRunDto>> UpdateLoadoutAsync(
        long idGameRun, int idUsuario, GameRunLoadoutRequestDto request,
        CancellationToken cancellationToken)
    {
        if (!Valid(request) || idGameRun <= 0 || request.Acoes is null or { Count: > 6 })
            return GameRunOperationResult<GameRunDto>.Fail(
                "REQUISICAO_INVALIDA", "Equipe até cinco ações e informe a revisão da run.");
        string hash = Hash($"SALVAR_LOADOUT|{idGameRun}|{request.RevisaoEsperada}|" +
            JsonSerializer.Serialize(request.Acoes, JsonOptions));
        try
        {
            return await _runs.ExecuteWithUserLockAsync(idUsuario, async () =>
            {
                GameRunCommand? previous = await _runs.GetCommandAsync(
                    idUsuario, request.ChaveIdempotencia, cancellationToken);
                if (previous is not null) return Replay<GameRunDto>(previous, "SALVAR_LOADOUT", hash);

                GameRun? run = await _runs.GetByIdAsync(idGameRun, idUsuario, cancellationToken);
                GameRunOperationResult<GameRunDto>? failure = Check<GameRunDto>(run, request.RevisaoEsperada!.Value);
                if (failure is not null) return failure;
                if (run!.NoAtualId is not null)
                    return GameRunOperationResult<GameRunDto>.Fail(
                        "COMBATE_PENDENTE", "Conclua o encontro selecionado antes de alterar o loadout.");
                if (GameRunActionLoadout.Read(run.LoadoutJson) is null)
                    return GameRunOperationResult<GameRunDto>.Fail(
                        "LOADOUT_INDISPONIVEL", "Esta run usa a ordem de armas da versão anterior.");

                GameRunDto current = GameRunService.Map(run);
                IReadOnlyList<GameRunActionSelectionDto> requested = request.Acoes!;
                int restCount = requested.Count(action => action?.Tipo?.Equals(
                    "DESCANSO", StringComparison.OrdinalIgnoreCase) == true);
                if (restCount > 1 || requested.Count - restCount > 5)
                    return GameRunOperationResult<GameRunDto>.Fail("LOADOUT_INVALIDO",
                        "Equipe até cinco ações e, opcionalmente, um descanso.");
                if (requested.Any(action => action is null || string.IsNullOrWhiteSpace(action.Tipo) ||
                    string.IsNullOrWhiteSpace(action.IdInstancia) ||
                    action.IdInstancia.Length > 100 ||
                    action.QuantidadeAtaques is < 1 or > 100 ||
                    action.ModoDisparo is not (null or "TIRO" or "RAJADA") ||
                    action.Tipo.ToUpperInvariant() is not ("ITEM" or "PROTESE" or "SKILL" or "MAGIA" or "DESCANSO") ||
                    action.Tipo.Equals("DESCANSO", StringComparison.OrdinalIgnoreCase) &&
                        (action.IdInstancia != "descanso-simples" || action.Alcance is not null ||
                         action.ModoDisparo is not null || action.QuantidadeAtaques != 1) ||
                    action.Alcance is not null &&
                        (action.Tipo.ToUpperInvariant() is not ("ITEM" or "PROTESE") ||
                         action.Alcance is not ("CURTA" or "MEDIA" or "LONGA"))) ||
                    requested.Select(action => $"{action.Tipo.ToUpperInvariant()}:{action.IdInstancia}")
                        .Distinct(StringComparer.Ordinal).Count() != requested.Count)
                    return GameRunOperationResult<GameRunDto>.Fail(
                        "LOADOUT_INVALIDO", "Use ações distintas da sua ficha.");
                foreach (GameRunActionSelectionDto selection in requested)
                {
                    if (selection.Tipo.Equals("DESCANSO", StringComparison.OrdinalIgnoreCase)) continue;
                    JsonElement? source = selection.Tipo.ToUpperInvariant() switch
                    {
                        "ITEM" => current.EstadoAtual.Inventario,
                        "PROTESE" => current.EstadoAtual.Implantes,
                        "SKILL" => current.EstadoAtual.Skills,
                        "MAGIA" => current.EstadoAtual.Magia,
                        _ => null,
                    };
                    JsonElement? entry = FindEntry(source, selection.IdInstancia);
                    if (entry is null)
                        return GameRunOperationResult<GameRunDto>.Fail(
                            "LOADOUT_INVALIDO", "Uma ação não pertence ao inventário desta run.");
                    if (selection.Tipo.ToUpperInvariant() is "ITEM" or "PROTESE")
                    {
                        decimal weight = ReadDecimal(entry.Value, "peso") ?? 0;
                        decimal quantity = ReadDecimal(entry.Value, "quantidade") ?? 1;
                        if (weight < 0 || quantity <= 0)
                            return GameRunOperationResult<GameRunDto>.Fail(
                                "CARGA_INVALIDA", "Um item equipado possui peso inválido.");
                    }
                }
                SistemaVersao? version = await _systems.GetVersionAsync(
                    run.IdSistemaVersao, includeConfiguration: true);
                if (version is null)
                    return GameRunOperationResult<GameRunDto>.Fail(
                        "SISTEMA_INDISPONIVEL", "A versão do Sistema desta run não está disponível.");
                run.EstadoAtualJson = GameRunCarry.Reconcile(run.EstadoAtualJson, version);
                int maxSkills = version.SkillConfig?.MaximoSkills ?? 0;
                SistemaRpgConfiguration.RegrasPoderes powers =
                    SistemaRpgConfiguration.LerRegras<SistemaRpgConfiguration.RegrasPoderes>(
                        version, SistemaModuloTipo.Poderes);
                int maxMagic = powers.LimiteMagias > 0 ? powers.LimiteMagias
                    : version.SkillConfig?.MaximoMagias ?? 0;
                if (requested.Count(action => action.Tipo.Equals("SKILL", StringComparison.OrdinalIgnoreCase)) > maxSkills ||
                    requested.Count(action => action.Tipo.Equals("MAGIA", StringComparison.OrdinalIgnoreCase)) > maxMagic)
                    return GameRunOperationResult<GameRunDto>.Fail(
                        "LIMITE_PODERES", "A seleção excede o limite de skills ou magias da versão do Sistema.");

                string old = run.LoadoutJson!;
                run.LoadoutJson = GameRunActionLoadout.Serialize(requested);
                try
                {
                    GameBattlePreviewSetup setup = _factory.Build(GameRunService.Map(run), version);
                    if (setup.Input.FirstActor.Actions.Count - 1 != requested.Count - restCount)
                        throw new InvalidOperationException("Uma das ações não possui ataque ou utilitário executável nesta versão.");
                }
                catch (Exception error) when (error is JsonException or InvalidOperationException or ArgumentException)
                {
                    run.LoadoutJson = old;
                    return GameRunOperationResult<GameRunDto>.Fail("ACAO_INEXECUTAVEL", error.Message);
                }

                run.Revisao++;
                run.AtualizadaEmUtc = DateTime.UtcNow;
                GameRunDto response = GameRunService.Map(run);
                await SaveCommand(run, idUsuario, request, "SALVAR_LOADOUT", hash, response, cancellationToken);
                return GameRunOperationResult<GameRunDto>.Ok(response);
            }, cancellationToken);
        }
        catch (DbUpdateConcurrencyException) { return Stale<GameRunDto>(); }
        catch (KeyNotFoundException) { return MissingUser<GameRunDto>(); }
    }

    public async Task<GameRunOperationResult<GameRunConsumeItemResultDto>> ConsumeItemAsync(
        long idGameRun, int idUsuario, GameRunConsumeItemRequestDto request,
        CancellationToken cancellationToken)
    {
        if (!Valid(request) || idGameRun <= 0 || request.Quantidade is < 1 or > 100 ||
            string.IsNullOrWhiteSpace(request.IdInstancia) ||
            request.IdInstancia.Length > 100)
            return GameRunOperationResult<GameRunConsumeItemResultDto>.Fail(
                "REQUISICAO_INVALIDA", "Informe um consumível válido e a revisão da run.");
        string hash = Hash($"CONSUMIR_ITEM|{idGameRun}|{request.RevisaoEsperada}|{request.IdInstancia}|{request.Quantidade}");
        try
        {
            return await _runs.ExecuteWithUserLockAsync(idUsuario, async () =>
            {
                GameRunCommand? previous = await _runs.GetCommandAsync(
                    idUsuario, request.ChaveIdempotencia, cancellationToken);
                if (previous is not null)
                    return Replay<GameRunConsumeItemResultDto>(previous, "CONSUMIR_ITEM", hash);

                GameRun? run = await _runs.GetByIdAsync(idGameRun, idUsuario, cancellationToken);
                GameRunOperationResult<GameRunConsumeItemResultDto>? failure =
                    Check<GameRunConsumeItemResultDto>(run, request.RevisaoEsperada!.Value,
                        allowVictory: run is not null && GameRunLoot.IsReceivedItem(run.EstadoAtualJson, request.IdInstancia));
                if (failure is not null) return failure;
                if (run!.NoAtualId is not null)
                    return GameRunOperationResult<GameRunConsumeItemResultDto>.Fail(
                        "COMBATE_PENDENTE", "Conclua o combate antes de usar um consumível.");

                SistemaVersao? itemSystem = await _systems.GetVersionAsync(run.IdSistemaVersao, includeConfiguration: true);
                if (itemSystem is null) return GameRunOperationResult<GameRunConsumeItemResultDto>.Fail(
                    "SISTEMA_INDISPONIVEL", "A versão do Sistema desta run não está disponível.");

                GameRunConsumableEffect effect;
                string unequippedSnapshot = run.EstadoAtualJson;
                try
                {
                    unequippedSnapshot = GameRunDefensiveEquipment.UnequipIfNeeded(run.EstadoAtualJson, request.IdInstancia);
                    unequippedSnapshot = GameRunCarry.RemoveUnequippedItemConditions(
                        unequippedSnapshot, request.IdInstancia, itemSystem);
                    effect = GameRunConsumable.Use(unequippedSnapshot, request.IdInstancia, request.Quantidade, itemSystem);
                }
                catch (GameRunConsumableException error)
                {
                    return GameRunOperationResult<GameRunConsumeItemResultDto>.Fail(error.Code, error.Message);
                }
                catch (JsonException)
                {
                    return GameRunOperationResult<GameRunConsumeItemResultDto>.Fail(
                        "ITEM_INVALIDO", "O inventário da run está inválido.");
                }

                string withoutRemovedEquipment = GameRunDefensiveEquipment.RemoveMissingBonuses(
                    unequippedSnapshot, effect.SnapshotJson);
                string healed = effect.LifeRestored > 0 || effect.ClearsConditionsOnCure
                    ? GameRunCarry.RecoverConditionsAtCure(withoutRemovedEquipment, itemSystem)
                    : GameRunCarry.Reconcile(withoutRemovedEquipment, itemSystem);
                run.EstadoAtualJson = GameRunCarry.ApplyConsumedItemConditions(
                    unequippedSnapshot, healed, request.IdInstancia, itemSystem, request.Quantidade);
                if (effect.RemainingQuantity == 0 && GameRunActionLoadout.Read(run.LoadoutJson) is { } actions)
                    run.LoadoutJson = GameRunActionLoadout.Serialize(actions.Where(action =>
                        !string.Equals(action.Tipo, "ITEM", StringComparison.OrdinalIgnoreCase) ||
                        !string.Equals(action.IdInstancia, request.IdInstancia, StringComparison.Ordinal)).ToArray());
                run.Revisao++;
                run.AtualizadaEmUtc = DateTime.UtcNow;
                GameRunConsumeItemResultDto response = new(GameRunService.Map(run), effect.ItemName,
                    effect.RemainingQuantity, effect.LifeRestored, effect.ManaRestored, effect.StaminaRestored);
                await SaveCommand(run, idUsuario, request, "CONSUMIR_ITEM", hash, response, cancellationToken);
                return GameRunOperationResult<GameRunConsumeItemResultDto>.Ok(response);
            }, cancellationToken);
        }
        catch (DbUpdateConcurrencyException) { return Stale<GameRunConsumeItemResultDto>(); }
        catch (KeyNotFoundException) { return MissingUser<GameRunConsumeItemResultDto>(); }
    }

    private static JsonElement? FindEntry(JsonElement? source, string id) =>
        Entries(source).FirstOrDefault(entry =>
            entry.ValueKind == JsonValueKind.Object &&
            string.Equals(ReadText(entry, "id"), id, StringComparison.Ordinal)) is { ValueKind: JsonValueKind.Object } found
            ? found : null;

    private static IReadOnlyList<JsonElement> Entries(JsonElement? source)
    {
        if (source is not { } value) return [];
        if (value.ValueKind == JsonValueKind.Array) return value.EnumerateArray().ToArray();
        if (value.ValueKind != JsonValueKind.Object) return [];
        foreach (string key in new[] { "itens", "inventario", "items", "implantes", "proteses", "skills", "magias" })
        {
            JsonElement property = value.EnumerateObject().FirstOrDefault(pair =>
                pair.Name.Equals(key, StringComparison.OrdinalIgnoreCase)).Value;
            if (property.ValueKind == JsonValueKind.Array) return property.EnumerateArray().ToArray();
        }
        return [];
    }

    private static string? ReadText(JsonElement source, string field) =>
        source.EnumerateObject().FirstOrDefault(pair =>
            pair.Name.Equals(field, StringComparison.OrdinalIgnoreCase)).Value is { ValueKind: JsonValueKind.String } value
            ? value.GetString() : null;

    private static decimal? ReadDecimal(JsonElement source, string field)
    {
        JsonElement property = source.EnumerateObject().FirstOrDefault(pair =>
            pair.Name.Equals(field, StringComparison.OrdinalIgnoreCase)).Value;
        if (property.ValueKind is not (JsonValueKind.String or JsonValueKind.Number)) return null;
        string? text = property.ValueKind == JsonValueKind.String ? property.GetString() : property.GetRawText();
        return decimal.TryParse(text, System.Globalization.NumberStyles.Number,
            System.Globalization.CultureInfo.InvariantCulture, out decimal value) ? value : null;
    }

    public async Task<GameRunOperationResult<GameRunDto>> UpgradeMapAsync(
        long idGameRun, int idUsuario, GameRunMutationRequestDto request,
        CancellationToken cancellationToken)
    {
        if (!Valid(request) || idGameRun <= 0)
            return GameRunOperationResult<GameRunDto>.Fail(
                "REQUISICAO_INVALIDA", "Informe a revisão e uma chave de idempotência válidas.");
        string hash = Hash($"AMPLIAR_MAPA|{idGameRun}|{request.RevisaoEsperada}");
        try
        {
            return await _runs.ExecuteWithUserLockAsync(idUsuario, async () =>
            {
                GameRunCommand? previous = await _runs.GetCommandAsync(
                    idUsuario, request.ChaveIdempotencia, cancellationToken);
                if (previous is not null) return Replay<GameRunDto>(previous, "AMPLIAR_MAPA", hash);

                GameRun? run = await _runs.GetByIdAsync(idGameRun, idUsuario, cancellationToken);
                GameRunOperationResult<GameRunDto>? failure = Check<GameRunDto>(run, request.RevisaoEsperada!.Value);
                if (failure is not null) return failure;
                GameRunMapDto currentMap = GameRunFirstMap.Read(run!.MapaJson, JsonOptions);
                if (currentMap.SchemaVersion is not (1 or 2))
                    return GameRunOperationResult<GameRunDto>.Fail(
                        "MAPA_INDISPONIVEL", "Esta run já usa a versão atual do mapa.");
                if (run.NoAtualId is not null)
                    return GameRunOperationResult<GameRunDto>.Fail(
                        "MAPA_INDISPONIVEL", "Conclua o combate selecionado antes de atualizar o mapa.");

                foreach (GameRunMapNodeDto completed in currentMap.Nodes.Where(item =>
                    item.Type == "COMBATE" && item.State == "CONCLUIDO"))
                {
                    if (await _runs.GetBattleAsync(run.IdGameRun, completed.Id, cancellationToken) is null)
                        return GameRunOperationResult<GameRunDto>.Fail(
                            "MAPA_INDISPONIVEL", "O histórico da rota concluída não está disponível.");
                }

                GameModeVersion? mode = await _runs.GetOrCreateModeVersionAsync(
                    run.IdSistemaVersao, "0.3.0", cancellationToken);
                if (mode is null || mode.NumeroVersao != "0.3.0")
                    return GameRunOperationResult<GameRunDto>.Fail(
                        "MODO_INDISPONIVEL", "A versão atual do mapa não está disponível.");
                GameRunMapDto nextMap;
                try
                {
                    nextMap = new GameRunMapGenerator().Create(run.Seed, mode.ConfiguracaoJson);
                    foreach (GameRunMapNodeDto previousNode in currentMap.Nodes)
                    {
                        GameRunMapNodeDto? updated = nextMap.Nodes.SingleOrDefault(item => item.Id == previousNode.Id);
                        if (updated is null || updated.Type != previousNode.Type ||
                            updated.Layer != previousNode.Layer)
                            throw new InvalidOperationException("As rotas da nova versão não correspondem à run.");
                        // A rota já jogada pertence ao modo fixado na run antiga.
                        updated.Name = previousNode.Name;
                        updated.Payload = previousNode.Payload;
                        updated.State = previousNode.State;
                    }
                    foreach (GameRunMapNodeDto completed in currentMap.Nodes
                        .Where(item => item.State == "CONCLUIDO")
                        .OrderBy(item => item.Layer))
                        GameRunMapGenerator.Complete(nextMap, completed.Id);
                    nextMap.MediumRestUsedMapKeys = currentMap.MediumRestUsedMapKeys;
                    nextMap.OpeningOpportunityPending = currentMap.OpeningOpportunityPending;
                    GameRunMapGenerator.Validate(nextMap);
                }
                catch (Exception error) when (error is JsonException or InvalidOperationException)
                {
                    return GameRunOperationResult<GameRunDto>.Fail("MAPA_INDISPONIVEL", error.Message);
                }
                run.IdGameModeVersion = mode.IdGameModeVersion;
                run.GameModeVersion = mode;
                run.MapaJson = JsonSerializer.Serialize(nextMap, JsonOptions);
                run.Revisao++;
                run.AtualizadaEmUtc = DateTime.UtcNow;
                GameRunDto response = GameRunService.Map(run);
                await SaveCommand(run, idUsuario, request, "AMPLIAR_MAPA", hash, response, cancellationToken);
                return GameRunOperationResult<GameRunDto>.Ok(response);
            }, cancellationToken);
        }
        catch (DbUpdateConcurrencyException) { return Stale<GameRunDto>(); }
        catch (KeyNotFoundException) { return MissingUser<GameRunDto>(); }
    }

    public async Task<GameRunOperationResult<GameRunBaseResolutionDto>> EnterBaseAsync(
        long idGameRun, string noId, int idUsuario, GameRunMutationRequestDto request,
        CancellationToken cancellationToken)
    {
        if (!Valid(request) || idGameRun <= 0 || string.IsNullOrWhiteSpace(noId) || noId.Length > 80)
            return GameRunOperationResult<GameRunBaseResolutionDto>.Fail(
                "REQUISICAO_INVALIDA", "Escolha uma Base disponível.");
        string hash = Hash($"DESCANSAR_BASE|{idGameRun}|{noId}|{request.RevisaoEsperada}");
        try
        {
            return await _runs.ExecuteWithUserLockAsync(idUsuario, async () =>
            {
                GameRunCommand? previous = await _runs.GetCommandAsync(
                    idUsuario, request.ChaveIdempotencia, cancellationToken);
                if (previous is not null)
                    return Replay<GameRunBaseResolutionDto>(previous, "DESCANSAR_BASE", hash);

                GameRun? run = await _runs.GetByIdAsync(idGameRun, idUsuario, cancellationToken);
                GameRunOperationResult<GameRunBaseResolutionDto>? failure = Check<GameRunBaseResolutionDto>(
                    run, request.RevisaoEsperada!.Value);
                if (failure is not null) return failure;
                GameRunMapDto map = GameRunFirstMap.Read(run!.MapaJson, JsonOptions);
                GameRunMapNodeDto? node = map.Nodes.SingleOrDefault(item => item.Id == noId);
                if (run.NoAtualId is not null || map.SchemaVersion is not (3 or 4 or 5) ||
                    node?.Type is not ("BASE" or "DESCANSO" or "EVENTO" or "ATALHO" or "AREA_SECRETA") || node.State != "DISPONIVEL")
                    return GameRunOperationResult<GameRunBaseResolutionDto>.Fail(
                        "BASE_INDISPONIVEL", "Esta opção não está disponível.");

                string updated = run.EstadoAtualJson;
                (int vida, int mana, int estamina) recovery = (0, 0, 0);
                int repairedProtection = 0;
                string resultName = node.Name;
                if (node.Type is not ("EVENTO" or "ATALHO" or "AREA_SECRETA"))
                {
                    SistemaVersao? version = await _systems.GetVersionAsync(
                        run.IdSistemaVersao, includeConfiguration: true);
                    if (version is null)
                        return GameRunOperationResult<GameRunBaseResolutionDto>.Fail(
                            "SISTEMA_INDISPONIVEL", "A versão das regras desta run não está disponível.");

                    string? restType;
                    try
                    {
                        JsonNode? mode = JsonNode.Parse(run.GameModeVersion.ConfiguracaoJson);
                        restType = mode?["base"]?["restType"]?.GetValue<string>();
                        if (node.Type == "BASE" && node.AreaCode is not null && mode?["areas"] is JsonArray areas)
                        {
                            JsonNode? area = areas.FirstOrDefault(item =>
                                string.Equals(item?["code"]?.ToString(), node.AreaCode,
                                    StringComparison.OrdinalIgnoreCase));
                            restType = area?["baseRestType"]?.ToString() is { Length: > 0 } configured
                                ? configured : restType;
                        }
                    }
                    catch (Exception error) when (error is JsonException or InvalidOperationException)
                    {
                        return GameRunOperationResult<GameRunBaseResolutionDto>.Fail(
                            "DESCANSO_INDISPONIVEL", "A regra de descanso desta Base não está disponível.");
                    }
                    SistemaDescansoConfig? rest = version.Descansos.FirstOrDefault(item =>
                        string.Equals(item.Tipo, restType, StringComparison.OrdinalIgnoreCase));
                    if (rest is null || rest.TipoRecuperacao == SistemaRecuperacaoTipo.Formula ||
                        (node.Type != "BASE" && rest.ExigeGuarda))
                        return GameRunOperationResult<GameRunBaseResolutionDto>.Fail(
                            "DESCANSO_INDISPONIVEL", "A versão publicada não possui um descanso automático para esta Base.");
                    resultName = rest.Nome;
                    try
                    {
                        (updated, recovery) = ApplyRest(
                            GameRunCarry.RecoverConditionsAtRest(run.EstadoAtualJson, version, rest.Tipo), rest, version);
                        updated = GameRunCarry.Reconcile(updated, version);
                    }
                    catch (Exception error) when (error is JsonException or InvalidOperationException or
                        ArgumentException or OverflowException)
                    {
                        return GameRunOperationResult<GameRunBaseResolutionDto>.Fail(
                            "DESCANSO_INDISPONIVEL", error.Message);
                    }
                    if (node.Type == "BASE" && JsonNode.Parse(run.GameModeVersion.ConfiguracaoJson)?
                        ["repairProtectionAtBase"]?.GetValue<bool>() != false)
                    {
                        (updated, repairedProtection) = GameRunDefensiveEquipment.RestoreProtectionAtBase(updated);
                    }
                }
                else if (node.Type == "EVENTO" && node.Payload?.GameMinutes > 0)
                {
                    SistemaVersao? version = await _systems.GetVersionAsync(
                        run.IdSistemaVersao, includeConfiguration: true);
                    if (version is null)
                        return GameRunOperationResult<GameRunBaseResolutionDto>.Fail(
                            "SISTEMA_INDISPONIVEL", "A versão das regras desta run não está disponível.");
                    try
                    {
                        updated = GameRunCarry.AdvanceGameTime(updated, node.Payload.GameMinutes, version);
                    }
                    catch (Exception error) when (error is JsonException or InvalidOperationException or
                        ArgumentException or OverflowException)
                    {
                        return GameRunOperationResult<GameRunBaseResolutionDto>.Fail(
                            "EVENTO_INDISPONIVEL", "Não foi possível avançar o tempo deste evento.");
                    }
                }
                string? returnPortalId = null;
                try
                {
                    GameRunMapGenerator.Select(map, noId);
                    if (node.Type == "AREA_SECRETA")
                    {
                        if (string.IsNullOrWhiteSpace(node.Payload?.SecretAreaCode))
                            throw new InvalidOperationException("A passagem secreta não indica uma área válida.");
                        GameRunMapDto secret = new GameRunMapGenerator().CreateSecretArea(
                            run.Seed, run.GameModeVersion.ConfiguracaoJson,
                            node.Payload.SecretAreaCode, noId);
                        map = GameRunMapGenerator.EnterSecret(map, secret, noId);
                    }
                    else if (node.Type == "ATALHO") GameRunMapGenerator.CompleteShortcut(map, noId);
                    else GameRunMapGenerator.Complete(map, noId);
                    if (node.Type != "AREA_SECRETA" && map.ParentNodes is not null &&
                        node.Connections.Count == 0 && !map.IsSecretFinal)
                    {
                        do
                        {
                            returnPortalId = map.SecretReturnNodeId;
                            map = GameRunMapGenerator.ReturnFromSecret(map);
                            GameRunMapNodeDto portal = map.Nodes.Single(parent => parent.Id == returnPortalId);
                            if (portal.Connections.Count > 0 || map.ParentNodes is null || map.IsSecretFinal) break;
                        } while (true);
                    }
                }
                catch (Exception error) when (error is JsonException or InvalidOperationException or
                    ArgumentException or OverflowException)
                {
                    return GameRunOperationResult<GameRunBaseResolutionDto>.Fail(
                        "DESCANSO_INDISPONIVEL", error.Message);
                }

                run.EstadoAtualJson = updated;
                run.MapaJson = JsonSerializer.Serialize(map, JsonOptions);
                GameRunMapNodeDto? returnPortal = returnPortalId is null ? null :
                    map.Nodes.Single(parent => parent.Id == returnPortalId);
                run.Fase = returnPortal?.Fase ?? node.Fase;
                bool terminal = returnPortal?.Connections.Count == 0 ||
                    node.Type != "AREA_SECRETA" && returnPortal is null && node.Connections.Count == 0;
                terminal |= node.Type != "AREA_SECRETA" && map.IsSecretFinal &&
                    node.Connections.Count == 0;
                if (map.SchemaVersion >= 5 && terminal)
                {
                    run.Status = GameRunStatus.Vitoria;
                    run.EncerradaEmUtc = DateTime.UtcNow;
                }
                run.Revisao++;
                run.AtualizadaEmUtc = DateTime.UtcNow;
                var response = new GameRunBaseResolutionDto(
                    GameRunService.Map(run), noId, resultName,
                    recovery.vida, recovery.mana, recovery.estamina)
                    { Tipo = node.Type, ProtecaoReparada = repairedProtection };
                await SaveCommand(run, idUsuario, request, "DESCANSAR_BASE", hash, response, cancellationToken);
                return GameRunOperationResult<GameRunBaseResolutionDto>.Ok(response);
            }, cancellationToken);
        }
        catch (DbUpdateConcurrencyException) { return Stale<GameRunBaseResolutionDto>(); }
        catch (KeyNotFoundException) { return MissingUser<GameRunBaseResolutionDto>(); }
    }

    public async Task<GameRunMediumRestPreviewDto?> GetMediumRestPreviewAsync(
        long idGameRun, int idUsuario, CancellationToken cancellationToken)
    {
        GameRun? run = await _runs.GetByIdAsync(idGameRun, idUsuario, cancellationToken);
        if (run is null) return null;
        GameRunMapDto map = GameRunFirstMap.Read(run.MapaJson, JsonOptions);
        SistemaVersao? version = await _systems.GetVersionAsync(
            run.IdSistemaVersao, includeConfiguration: true);
        return MediumRestPreview(run, map, version);
    }

    public async Task<GameRunOperationResult<GameRunMediumRestResolutionDto>> MediumRestAsync(
        long idGameRun, int idUsuario, GameRunMutationRequestDto request,
        CancellationToken cancellationToken)
    {
        if (!Valid(request) || idGameRun <= 0)
            return GameRunOperationResult<GameRunMediumRestResolutionDto>.Fail(
                "REQUISICAO_INVALIDA", "Informe a revisão e uma chave de idempotência válidas.");
        string hash = Hash($"DESCANSO_MEDIO|{idGameRun}|{request.RevisaoEsperada}");
        try
        {
            return await _runs.ExecuteWithUserLockAsync(idUsuario, async () =>
            {
                GameRunCommand? previous = await _runs.GetCommandAsync(
                    idUsuario, request.ChaveIdempotencia, cancellationToken);
                if (previous is not null)
                    return Replay<GameRunMediumRestResolutionDto>(previous, "DESCANSO_MEDIO", hash);

                GameRun? run = await _runs.GetByIdAsync(idGameRun, idUsuario, cancellationToken);
                GameRunOperationResult<GameRunMediumRestResolutionDto>? failure =
                    Check<GameRunMediumRestResolutionDto>(run, request.RevisaoEsperada!.Value);
                if (failure is not null) return failure;
                GameRunMapDto map = GameRunFirstMap.Read(run!.MapaJson, JsonOptions);
                SistemaVersao? version = await _systems.GetVersionAsync(
                    run.IdSistemaVersao, includeConfiguration: true);
                GameRunMediumRestPreviewDto preview = MediumRestPreview(run, map, version);
                if (!preview.Disponivel)
                    return GameRunOperationResult<GameRunMediumRestResolutionDto>.Fail(
                        map.MediumRestUsedMapKeys.Contains(MediumRestMapKey(map))
                            ? "DESCANSO_JA_USADO" : "DESCANSO_INDISPONIVEL",
                        preview.Motivo ?? "O descanso médio não está disponível.");

                SistemaDescansoConfig rest = version!.Descansos.First(item =>
                    string.Equals(item.Tipo, "NORMAL", StringComparison.OrdinalIgnoreCase));
                (string updated, (int vida, int mana, int estamina) recovery) =
                    ApplyRest(GameRunCarry.RecoverConditionsAtRest(run.EstadoAtualJson, version, rest.Tipo), rest, version);
                run.EstadoAtualJson = GameRunCarry.Reconcile(updated, version);
                map.MediumRestUsedMapKeys = [.. map.MediumRestUsedMapKeys, MediumRestMapKey(map)];
                map.OpeningOpportunityPending = true;
                run.MapaJson = JsonSerializer.Serialize(map, JsonOptions);
                run.Revisao++;
                run.AtualizadaEmUtc = DateTime.UtcNow;
                var response = new GameRunMediumRestResolutionDto(GameRunService.Map(run), rest.Nome,
                    recovery.vida, recovery.mana, recovery.estamina);
                await SaveCommand(run, idUsuario, request, "DESCANSO_MEDIO", hash, response, cancellationToken);
                return GameRunOperationResult<GameRunMediumRestResolutionDto>.Ok(response);
            }, cancellationToken);
        }
        catch (DbUpdateConcurrencyException) { return Stale<GameRunMediumRestResolutionDto>(); }
        catch (KeyNotFoundException) { return MissingUser<GameRunMediumRestResolutionDto>(); }
    }

    private static string MediumRestMapKey(GameRunMapDto map) =>
        map.ParentNodes is not null ? $"SECRETA:{map.SecretReturnNodeId}" : "MAPA_PRINCIPAL";

    private static GameRunMediumRestPreviewDto MediumRestPreview(
        GameRun run, GameRunMapDto map, SistemaVersao? version)
    {
        SistemaDescansoConfig? rest = version?.Descansos.FirstOrDefault(item =>
            string.Equals(item.Tipo, "NORMAL", StringComparison.OrdinalIgnoreCase));
        string name = rest?.Nome ?? "Descanso médio";
        string? reason = run.Status != GameRunStatus.Ativa ? "A run já terminou." :
            run.NoAtualId is not null ? "Conclua o encontro antes de descansar." :
            map.MediumRestUsedMapKeys.Contains(MediumRestMapKey(map))
                ? "O descanso médio deste mapa já foi usado." :
            rest is null ? "A versão publicada do Sistema não possui descanso normal." :
            rest.TipoRecuperacao == SistemaRecuperacaoTipo.Formula
                ? "A fórmula deste descanso não pode ser executada automaticamente." : null;
        if (reason is not null)
            return new(false, name, 0, 0, 0, reason, map.OpeningOpportunityPending);
        try
        {
            (_, (int vida, int mana, int estamina) recovery) = ApplyRest(
                GameRunCarry.RecoverConditionsAtRest(run.EstadoAtualJson, version!, rest!.Tipo), rest, version!);
            return new(true, name, recovery.vida, recovery.mana, recovery.estamina,
                null, map.OpeningOpportunityPending);
        }
        catch (Exception error) when (error is JsonException or InvalidOperationException or
            ArgumentException or OverflowException)
        {
            return new(false, name, 0, 0, 0, error.Message, map.OpeningOpportunityPending);
        }
    }

    private static (string updated, (int vida, int mana, int estamina) recovery) ApplyRest(
        string snapshotJson, SistemaDescansoConfig rest, SistemaVersao version)
    {
        JsonNode root = JsonNode.Parse(snapshotJson)
            ?? throw new JsonException("O estado da run está vazio.");
        JsonObject? status = Find(root as JsonObject, "status") as JsonObject;
        JsonObject? resources = Find(status, "status") as JsonObject;
        if (resources is null)
            throw new JsonException("A ficha da run não possui recursos.");

        int life = Recover("vida", "vidaMaxima", rest.RecuperacaoVida);
        int mana = Recover("mana", "manaMaxima", rest.RecuperacaoMana);
        int stamina = Recover("estamina", "estaminaMaxima", rest.RecuperacaoEstamina);
        ResetUses(Find(root as JsonObject, "inventario"));
        ResetUses(Find(root as JsonObject, "implantes"));
        string rested = root.ToJsonString(JsonOptions);
        if (life > 0) rested = GameRunCarry.RecoverConditionsAtCure(rested, version);
        rested = GameRunCarry.AdvanceGameTime(rested, rest.DuracaoMinimaMinutos ?? 0, version);
        return (rested,
            (life, mana, stamina));

        static void ResetUses(JsonNode? collection)
        {
            if (collection is JsonObject wrapper)
            {
                collection = Find(wrapper, "itens") ?? Find(wrapper, "inventario") ??
                    Find(wrapper, "items") ?? Find(wrapper, "implantes") ?? Find(wrapper, "proteses");
            }
            if (collection is not JsonArray entries) return;
            foreach (JsonObject item in entries.OfType<JsonObject>())
            {
                if (Find(item, "atributos") is not JsonObject attributes ||
                    !int.TryParse(Find(attributes, "capacidadeUso")?.ToString(), out int maximum) || maximum <= 0)
                    continue;
                Set(attributes, "capacidadeUsoRestante", maximum);
            }
        }

        int Recover(string field, string maximumField, decimal configured)
        {
            if (GameRunCarry.BlocksRecovery((JsonObject)root, version, field.ToUpperInvariant())) return 0;
            JsonNode? currentNode = Find(resources, field);
            JsonNode? maximumNode = Find(resources, maximumField);
            if ((currentNode is not null && !int.TryParse(currentNode.ToString(), out _)) ||
                (maximumNode is not null && !int.TryParse(maximumNode.ToString(), out _)) ||
                configured < 0)
                throw new InvalidOperationException("Os recursos da ficha não permitem este descanso.");

            int current = currentNode is null ? 0 : int.Parse(currentNode.ToString());
            // Snapshots antigos podem não registrar o máximo. Sem esse limite não
            // inferimos capacidade a partir do Sistema nem restauramos além do atual.
            int maximum = maximumNode is null ? current : int.Parse(maximumNode.ToString());
            if (current < 0 || maximum < 0)
                throw new InvalidOperationException("Os recursos da ficha não permitem este descanso.");
            maximum = Math.Max(current, maximum);

            int amount = rest.TipoRecuperacao == SistemaRecuperacaoTipo.Percentual
                ? decimal.ToInt32(decimal.Floor(maximum * configured / 100m))
                : decimal.ToInt32(decimal.Truncate(configured));
            int recovered = Math.Min(maximum - current, Math.Max(0, amount));
            Set(resources, field, current + recovered);
            return recovered;
        }
    }

    private static string ApplyResult(string snapshotJson, GameBattleActorState player)
    {
        JsonNode root = JsonNode.Parse(snapshotJson)
            ?? throw new JsonException("O estado da run está vazio.");
        JsonObject? status = Find(root as JsonObject, "status") as JsonObject;
        JsonObject? resources = Find(status, "status") as JsonObject;
        if (resources is null) throw new JsonException("A ficha da run não possui status.");
        Set(resources, "vida", player.HitPoints);
        Set(resources, "mana", player.Mana);
        Set(resources, "estamina", player.Stamina);
        status!["condicoesJogo"] = JsonSerializer.SerializeToNode(player.ActiveConditions, JsonOptions);
        status["turnosPerdidos"] = player.TurnsToSkip;
        JsonObject? defenses = Find(status, "defesas") as JsonObject;
        if (defenses is not null)
        {
            GameRunDefensiveEquipment.RecordSpentDefenses((JsonObject)root,
                Math.Max(0, (int.TryParse(Find(defenses, "escudo")?.ToString(), out int shieldBefore)
                    ? shieldBefore : 0) - player.Defenses.Shield),
                Math.Max(0, (int.TryParse(Find(defenses, "protecao")?.ToString(), out int protectionBefore)
                    ? protectionBefore : 0) - player.Defenses.Protection));
            Set(defenses, "escudo", player.Defenses.Shield);
            Set(defenses, "protecao", player.Defenses.Protection);
        }

        JsonNode? inventory = Find(root as JsonObject, "inventario");
        JsonArray? items = inventory as JsonArray
            ?? Find(inventory as JsonObject, "itens") as JsonArray
            ?? Find(inventory as JsonObject, "inventario") as JsonArray
            ?? Find(inventory as JsonObject, "items") as JsonArray;
        JsonNode? implants = Find(root as JsonObject, "implantes");
        JsonArray? prostheses = implants as JsonArray
            ?? Find(implants as JsonObject, "implantes") as JsonArray
            ?? Find(implants as JsonObject, "proteses") as JsonArray;
        if (items is not null || prostheses is not null)
        {
            foreach (GameBattleActionState action in player.Actions)
            {
                bool itemAction = action.ActionId.StartsWith("item:", StringComparison.Ordinal);
                bool prosthesisAction = action.ActionId.StartsWith("protese:", StringComparison.Ordinal);
                if (!itemAction && !prosthesisAction)
                    continue;
                string id = action.ActionId[(itemAction ? 5 : 8)..];
                JsonObject? item = (itemAction ? items : prostheses)?.OfType<JsonObject>().FirstOrDefault(entry =>
                    string.Equals(Find(entry, "id")?.ToString(), id, StringComparison.Ordinal));
                JsonObject? attributes = Find(item, "atributos") as JsonObject;
                if (attributes is null) continue;
                if (action.RemainingUses is int remainingUses)
                    Set(attributes, "capacidadeUsoRestante", remainingUses);
                // O carregador é um recurso do encontro, não da jornada. O log
                // preserva o consumo real; a próxima batalha começa com ele cheio.
                if (action.MagazineCapacity is not > 0) continue;
                JsonObject? ammo = Find(attributes, "municao") as JsonObject;
                if (Find(attributes, "municaoAtual") is not null || ammo is null)
                    Set(attributes, "municaoAtual", action.MagazineCapacity.Value);
                else Set(ammo, "atual", action.MagazineCapacity.Value);
            }
        }
        return root.ToJsonString(JsonOptions);
    }

    private static JsonNode? Find(JsonObject? source, string key) => source is null ? null
        : source.FirstOrDefault(entry => string.Equals(entry.Key, key, StringComparison.OrdinalIgnoreCase)).Value;

    private static void Set(JsonObject source, string key, int value)
    {
        string name = source.Select(entry => entry.Key)
            .FirstOrDefault(existing => string.Equals(existing, key, StringComparison.OrdinalIgnoreCase)) ?? key;
        source[name] = value;
    }

    private async Task SaveCommand<T>(GameRun run, int userId, GameRunMutationRequestDto request,
        string type, string hash, T response, CancellationToken token)
    {
        await _runs.AddCommandAsync(new GameRunCommand
        {
            IdGameRun = run.IdGameRun,
            IdUsuario = userId,
            ChaveIdempotencia = request.ChaveIdempotencia.ToString("D"),
            HashPayload = hash,
            Tipo = type,
            RevisaoEsperada = request.RevisaoEsperada,
            RespostaJson = JsonSerializer.Serialize(response, JsonOptions),
            CriadoEmUtc = run.AtualizadaEmUtc,
            ConcluidoEmUtc = run.AtualizadaEmUtc,
        }, token);
        await _runs.SaveChangesAsync(token);
    }

    private static GameRunOperationResult<T>? Check<T>(GameRun? run, long revision, bool allowVictory = false)
    {
        if (run is null) return GameRunOperationResult<T>.Fail("RUN_NAO_ENCONTRADA", "Run não encontrada.");
        if (run.Status != GameRunStatus.Ativa && !(allowVictory && run.Status == GameRunStatus.Vitoria))
            return GameRunOperationResult<T>.Fail("RUN_ENCERRADA", "Esta run já foi encerrada.");
        if (GameRunLoot.Read(run.EstadoAtualJson) is { Roll: null })
            return GameRunOperationResult<T>.Fail("LOOT_PENDENTE", "Revele o loot do último combate antes de continuar.");
        if (run.Revisao != revision) return Stale<T>();
        return null;
    }

    private static bool Valid(GameRunMutationRequestDto request) =>
        request.ChaveIdempotencia != Guid.Empty && request.RevisaoEsperada is >= 0;

    private static GameRunOperationResult<T> Replay<T>(GameRunCommand command, string type, string hash)
    {
        if (command.Tipo != type || command.HashPayload != hash)
            return GameRunOperationResult<T>.Fail("CHAVE_IDEMPOTENCIA_REUTILIZADA",
                "Esta chave de idempotência já foi usada em outro comando.");
        T response = JsonSerializer.Deserialize<T>(command.RespostaJson, JsonOptions)
            ?? throw new JsonException("A resposta salva do comando está vazia.");
        return GameRunOperationResult<T>.Ok(response, repetido: true);
    }

    private static GameRunOperationResult<T> Stale<T>() =>
        GameRunOperationResult<T>.Fail("REVISAO_DESATUALIZADA", "A run mudou. Recarregue antes de tentar novamente.");

    private static GameRunOperationResult<T> MissingUser<T>() =>
        GameRunOperationResult<T>.Fail("USUARIO_NAO_ENCONTRADO", "Usuário não encontrado.");

    private static string Hash(string payload) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(payload)));

    private static GameBattlePreviewActorDto MapActor(GameBattleActorSpec actor)
    {
        int Maximum(string resource, int original)
        {
            int maximum = original;
            foreach (GameBattleActiveCondition condition in actor.ActiveConditions.Where(item =>
                         item.Rule.Resource.Equals(resource, StringComparison.OrdinalIgnoreCase) &&
                         item.Rule.Operation.Equals("REDUZIR_LIMITE_PERCENTUAL", StringComparison.OrdinalIgnoreCase)))
                maximum = (int)Math.Floor(maximum * (100 - Math.Clamp(condition.Value, 0, 100)) / 100m);
            return maximum;
        }
        return new GameBattlePreviewActorDto(actor.Id, actor.Name, actor.HitPoints,
            Maximum("VIDA", actor.MaximumHitPoints), actor.Mana, Maximum("MANA", actor.MaximumMana),
            actor.Stamina, Maximum("ESTAMINA", actor.MaximumStamina), actor.Defenses, actor.Image)
            { Condicoes = actor.ActiveConditions };
    }

    private static JsonSerializerOptions CreateOptions()
    {
        JsonSerializerOptions options = new(JsonSerializerDefaults.Web);
        options.Converters.Add(new JsonStringEnumConverter());
        return options;
    }
}
