using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.GameRuns;
using OdisseiaWiki.GameRuns.Map;
using OdisseiaWiki.GameRuns.Inventory;
using OdisseiaWiki.Models;

namespace OdisseiaWiki.Services;

public sealed partial class GameRunEncounterService
{
    public Task<GameRunOperationResult<GameRunDto>> BeginStoryAsync(long runId, string nodeId, int userId,
        GameRunMutationRequestDto request, CancellationToken token) => StoryCommand(runId, nodeId, userId, request, null, token);

    public Task<GameRunOperationResult<GameRunDto>> ChooseStoryAsync(long runId, string nodeId, int userId,
        GameStoryRequestDto request, CancellationToken token) => StoryCommand(runId, nodeId, userId, request, request.ChoiceCode, token);

    private async Task<GameRunOperationResult<GameRunDto>> StoryCommand(long runId, string nodeId, int userId,
        GameRunMutationRequestDto request, string? choiceCode, CancellationToken token)
    {
        if (!Valid(request) || runId <= 0 || string.IsNullOrWhiteSpace(nodeId) || nodeId.Length > 80 ||
            choiceCode is not null && (string.IsNullOrWhiteSpace(choiceCode) || choiceCode.Length > 80))
            return GameRunOperationResult<GameRunDto>.Fail("REQUISICAO_INVALIDA", "Escolha uma opção válida da rota.");
        string operation = choiceCode is null ? "ABRIR_HISTORIA" : "ESCOLHER_HISTORIA";
        string hash = Hash($"{operation}|{runId}|{nodeId}|{request.RevisaoEsperada}|{choiceCode}");
        try
        {
            return await _runs.ExecuteWithUserLockAsync(userId, async () =>
            {
                var previous = await _runs.GetCommandAsync(userId, request.ChaveIdempotencia, token);
                if (previous is not null) return Replay<GameRunDto>(previous, operation, hash);
                var run = await _runs.GetByIdAsync(runId, userId, token);
                var failure = Check<GameRunDto>(run, request.RevisaoEsperada!.Value);
                if (failure is not null) return failure;
                if (GameRunLoot.Read(run!.EstadoAtualJson) is { Roll: null })
                    return GameRunOperationResult<GameRunDto>.Fail("LOOT_PENDENTE", "Receba o loot antes de continuar.");
                var map = GameRunFirstMap.Read(run.MapaJson, JsonOptions);
                var node = map.Nodes.SingleOrDefault(node => node.Id == nodeId);
                if (node is null || choiceCode is null && (run.NoAtualId is not null || node.State != "DISPONIVEL") ||
                    choiceCode is not null && (run.NoAtualId != nodeId || node.State != "SELECIONADO") ||
                    node.Type is not ("SURPRESA" or "EVENTO" or "MISSAO"))
                    return GameRunOperationResult<GameRunDto>.Fail("ROTA_INDISPONIVEL", "Esta escolha não pertence à rota atual.");
                var version = await _systems.GetVersionAsync(run.IdSistemaVersao, includeConfiguration: true);
                if (version is null) return GameRunOperationResult<GameRunDto>.Fail("SISTEMA_INDISPONIVEL", "Sistema indisponível.");
                string oldState = run.EstadoAtualJson;
                string? oldNode = run.NoAtualId;
                int oldPhase = run.Fase;
                var oldStatus = run.Status;
                var oldEnd = run.EncerradaEmUtc;
                try
                {
                    if (choiceCode is null)
                    {
                        if (node.Type == "SURPRESA")
                        {
                            GameRunMapGenerator.RevealSurprise(map, node, run.GameModeVersion.ConfiguracaoJson);
                            var memory = await _runs.GetCharacterMemoryAsync(userId, run.IdPersonagemJogadorOrigem, token);
                            GameRunNpcs.ApplyMemory(map, GameCharacterMilestones.Read(memory?.EstadoJson), run.GameModeVersion.Codigo, version.IdSistemaRpg);
                        }
                        else
                        {
                            if (node.Type == "EVENTO" && node.Payload?.Choices is not { Count: > 0 })
                                throw new InvalidOperationException("Este evento não possui escolhas configuradas.");
                            if (node.Type == "MISSAO" && node.Payload?.Mission is null)
                                throw new InvalidOperationException("Esta missão não possui um objetivo publicado.");
                            GameRunMapGenerator.Select(map, nodeId);
                            run.NoAtualId = nodeId;
                        }
                        run.Fase = node.Fase;
                    }
                    else if (node.Type == "EVENTO")
                    {
                        var choice = node.Payload?.Choices.SingleOrDefault(choice => choice.Code == choiceCode)
                            ?? throw new InvalidOperationException("Escolha uma das opções publicadas deste evento.");
                        run.EstadoAtualJson = GameStoryEffects.Apply(oldState, node.Id, node.Name, "EVENTO", choice.Label,
                            choice.ResultText, choice.Cost, choice.Outcome, version, node.Image);
                        if (node.Payload!.GameMinutes > 0)
                            run.EstadoAtualJson = GameRunCarry.AdvanceGameTime(run.EstadoAtualJson, node.Payload.GameMinutes, version);
                        node.Payload.StoryChoice = choiceCode;
                        map = CompleteServiceNode(run, map, node, version);
                    }
                    else if (node.Type == "MISSAO" && node.Payload?.Mission is { } mission)
                    {
                        if (choiceCode is not ("ACCEPT" or "DECLINE") || choiceCode == "DECLINE" && !mission.CanDecline)
                            throw new InvalidOperationException("Escolha se deseja aceitar a missão.");
                        bool accept = choiceCode == "ACCEPT";
                        run.EstadoAtualJson = GameStoryEffects.Apply(oldState, node.Id, node.Name,
                            accept ? "MISSAO_ACEITA" : "MISSAO_RECUSADA", accept ? "Aceitar missão" : "Deixar para trás",
                            null, accept ? mission.Cost : new(), new(), version, node.Image);
                        node.Payload.StoryChoice = choiceCode;
                        if (!accept) map = CompleteServiceNode(run, map, node, version);
                        else
                        {
                            var secondary = new GameRunMapGenerator().CreateSecretArea(run.Seed, run.GameModeVersion.ConfiguracaoJson,
                                mission.AreaCode, nodeId);
                            if (secondary.IsSecretFinal) throw new InvalidOperationException("A área de missão não pode ser um final secreto.");
                            map = GameRunMapGenerator.EnterSecret(map, secondary, nodeId);
                            var memory = await _runs.GetCharacterMemoryAsync(userId, run.IdPersonagemJogadorOrigem, token);
                            GameRunNpcs.ApplyMemory(map, GameCharacterMilestones.Read(memory?.EstadoJson), run.GameModeVersion.Codigo, version.IdSistemaRpg);
                            run.NoAtualId = null;
                        }
                    }
                    else throw new InvalidOperationException("Este encontro já foi revelado.");
                }
                catch (Exception error) when (error is JsonException or InvalidOperationException or ArgumentException or OverflowException)
                {
                    run.EstadoAtualJson = oldState;
                    run.NoAtualId = oldNode; run.Fase = oldPhase; run.Status = oldStatus; run.EncerradaEmUtc = oldEnd;
                    return GameRunOperationResult<GameRunDto>.Fail("ESCOLHA_INVALIDA", error.Message);
                }
                run.MapaJson = JsonSerializer.Serialize(map, JsonOptions);
                run.Revisao++; run.AtualizadaEmUtc = DateTime.UtcNow;
                var response = GameRunService.Map(run);
                await SaveCommand(run, userId, request, operation, hash, response, token);
                return GameRunOperationResult<GameRunDto>.Ok(response);
            }, token);
        }
        catch (DbUpdateConcurrencyException) { return Stale<GameRunDto>(); }
        catch (KeyNotFoundException) { return MissingUser<GameRunDto>(); }
    }

    private static GameRunMapDto ReturnFromSecondaryArea(GameRun run, GameRunMapDto map, SistemaVersao version)
    {
        var portal = (map.ParentMap?.Nodes ?? map.ParentNodes)?.SingleOrDefault(node => node.Id == map.SecretReturnNodeId);
        if (portal is { Type: "MISSAO", Payload.Mission: { } mission, Payload.StoryChoice: "ACCEPT", Payload.MissionCompleted: false })
        {
            run.EstadoAtualJson = GameStoryEffects.Apply(run.EstadoAtualJson, portal.Id, portal.Name, "MISSAO_CONCLUIDA",
                "Objetivo concluído", null, new(), mission.Reward, version, portal.Image);
            portal.Payload.MissionCompleted = true;
        }
        return GameRunMapGenerator.ReturnFromSecret(map);
    }

    private static bool StoryLifeLost(GameRun run) => JsonNode.Parse(run.EstadoAtualJson)?["status"]?["status"]?["vida"] is { } life &&
        int.TryParse(life.ToString(), out int value) && value <= 0;
}
