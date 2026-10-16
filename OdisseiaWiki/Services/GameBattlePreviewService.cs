using System.Security.Cryptography;
using System.Text.Json;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.GameRuns.Battle;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Services;

public sealed class GameBattlePreviewService : IGameBattlePreviewService
{
    private readonly IGameRunService _runs;
    private readonly ISistemaRpgRepository _systems;
    private readonly GameBattlePreviewFactory _factory;
    private readonly IAutoBattleSimulator _simulator;

    public GameBattlePreviewService(
        IGameRunService runs,
        ISistemaRpgRepository systems,
        GameBattlePreviewFactory factory,
        IAutoBattleSimulator simulator)
    {
        _runs = runs;
        _systems = systems;
        _factory = factory;
        _simulator = simulator;
    }

    public async Task<GameRunOperationResult<GameBattlePreviewDto>> PreviewAsync(
        long idGameRun, int idUsuario, CancellationToken cancellationToken)
    {
        GameRunDto? run = await _runs.GetByIdAsync(idGameRun, idUsuario, cancellationToken);
        if (run is null)
            return GameRunOperationResult<GameBattlePreviewDto>.Fail(
                "RUN_NAO_ENCONTRADA", "Run não encontrada.");
        if (!string.Equals(run.Status, "Ativa", StringComparison.OrdinalIgnoreCase))
            return GameRunOperationResult<GameBattlePreviewDto>.Fail(
                "RUN_ENCERRADA", "A prévia de combate só está disponível para uma run ativa.");

        SistemaVersao? version = await _systems.GetVersionAsync(run.IdSistemaVersao, includeConfiguration: true);
        if (version is null)
            return GameRunOperationResult<GameBattlePreviewDto>.Fail(
                "SISTEMA_INDISPONIVEL", "A versão do Sistema desta run não está disponível.");

        try
        {
            GameBattlePreviewSetup setup = _factory.Build(run, version);
            // A new training request is a new simulation. Official battles keep their own persisted seed.
            int seed = RandomNumberGenerator.GetInt32(1, int.MaxValue);
            GameBattleResult result = _simulator.Simulate(setup.Input, new SeededGameRunRandomSource(seed));
            return GameRunOperationResult<GameBattlePreviewDto>.Ok(new GameBattlePreviewDto(
                1,
                run.IdGameRun,
                run.IdSistemaVersao,
                run.IdGameModeVersion,
                setup.WeaponNames,
                setup.FallbackActionName,
                Map(setup.Input.FirstActor),
                Map(setup.Input.SecondActor),
                result)
            {
                Oponentes = new[] { setup.Input.SecondActor }
                    .Concat(setup.Input.AdditionalEnemies).Select(Map).ToArray(),
            });
        }
        catch (Exception error) when (error is JsonException or InvalidOperationException or ArgumentException or OverflowException)
        {
            return GameRunOperationResult<GameBattlePreviewDto>.Fail(
                "PREVIA_INDISPONIVEL", error.Message);
        }
    }

    private static GameBattlePreviewActorDto Map(GameBattleActorSpec actor) => new(
        actor.Id,
        actor.Name,
        actor.HitPoints,
        actor.MaximumHitPoints,
        actor.Mana,
        actor.MaximumMana,
        actor.Stamina,
        actor.MaximumStamina,
        actor.Defenses,
        actor.Image);
}
