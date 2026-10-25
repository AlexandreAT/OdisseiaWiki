using System.Security.Cryptography;
using System.Text.Json;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.GameRuns.Battle;
using OdisseiaWiki.GameRuns;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Services;

public sealed class GameBattlePreviewService : IGameBattlePreviewService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly IGameRunService _runs;
    private readonly ISistemaRpgRepository _systems;
    private readonly GameBattlePreviewFactory _factory;
    private readonly IAutoBattleSimulator _simulator;
    private readonly IGameRunRepository? _repository;

    public GameBattlePreviewService(
        IGameRunService runs,
        ISistemaRpgRepository systems,
        GameBattlePreviewFactory factory,
        IAutoBattleSimulator simulator, IGameRunRepository? repository = null)
    {
        _runs = runs;
        _systems = systems;
        _factory = factory;
        _simulator = simulator;
        _repository = repository;
    }

    public async Task<GameRunOperationResult<GameBattlePreviewDto>> PreviewAsync(
        long idGameRun, int idUsuario, CancellationToken cancellationToken)
        => await PreviewAsync(idGameRun, idUsuario, "default", cancellationToken);

    public async Task<GameRunOperationResult<GameBattlePreviewDto>> PreviewAsync(
        long idGameRun, int idUsuario, string enemyKey, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(enemyKey) || enemyKey.Length > 64)
            return GameRunOperationResult<GameBattlePreviewDto>.Fail("OPONENTE_INVALIDO", "Escolha um oponente do treino.");
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
            GameBattleEncounterConfig? encounter = null;
            if (enemyKey != "default")
            {
                encounter = (await LearnedEnemies(run, idUsuario, version.IdSistemaRpg, cancellationToken))
                    .FirstOrDefault(item => item.Key == enemyKey)?.Encounter;
                if (encounter is null) return GameRunOperationResult<GameBattlePreviewDto>.Fail(
                    "OPONENTE_NAO_DESBLOQUEADO", "Este personagem ainda não derrotou esse inimigo neste Sistema.");
            }
            GameBattlePreviewSetup setup = _factory.Build(run, version, trainingEncounter: encounter);
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

    public async Task<GameRunOperationResult<IReadOnlyList<GameTrainingEnemyDto>>> GetOpponentsAsync(
        long idGameRun, int idUsuario, CancellationToken token)
    {
        var run = await _runs.GetByIdAsync(idGameRun, idUsuario, token);
        if (run is null) return GameRunOperationResult<IReadOnlyList<GameTrainingEnemyDto>>.Fail("RUN_NAO_ENCONTRADA", "Run não encontrada.");
        if (run.Status != "Ativa") return GameRunOperationResult<IReadOnlyList<GameTrainingEnemyDto>>.Fail("RUN_ENCERRADA", "O treino está disponível durante uma run ativa.");
        var version = await _systems.GetVersionAsync(run.IdSistemaVersao, includeConfiguration: true);
        if (version is null) return GameRunOperationResult<IReadOnlyList<GameTrainingEnemyDto>>.Fail("SISTEMA_INDISPONIVEL", "Sistema indisponível.");
        try
        {
            var config = run.ConfiguracaoModo.Deserialize<GameBattlePreviewConfig>(JsonOptions);
            if (config?.PreviewEnemy is not { } enemy)
                return GameRunOperationResult<IReadOnlyList<GameTrainingEnemyDto>>.Fail("PREVIA_INDISPONIVEL", "O treino não está configurado.");
            var result = new List<GameTrainingEnemyDto> { Describe("default", enemy) };
            result.AddRange((await LearnedEnemies(run, idUsuario, version.IdSistemaRpg, token))
                .OrderBy(item => item.Encounter.Enemy!.Name).Select(item => Describe(item.Key, item.Encounter.Enemy!)));
            return GameRunOperationResult<IReadOnlyList<GameTrainingEnemyDto>>.Ok(result);
        }
        catch (Exception error) when (error is JsonException or InvalidOperationException or ArgumentException)
        {
            return GameRunOperationResult<IReadOnlyList<GameTrainingEnemyDto>>.Fail("PREVIA_INDISPONIVEL", error.Message);
        }
    }

    private async Task<IReadOnlyList<GameDefeatedEnemyMemory>> LearnedEnemies(GameRunDto run, int userId, int systemId, CancellationToken token)
    {
        if (_repository is null || await _repository.GetOwnedCharacterAsync(userId, run.IdPersonagemJogadorOrigem, token) is null) return [];
        var memory = await _repository.GetCharacterMemoryAsync(userId, run.IdPersonagemJogadorOrigem, token);
        var state = GameCharacterMilestones.Read(memory?.EstadoJson);
        // Backfill existing victories without mutating a run or writing during a GET.
        foreach (var battle in await _repository.GetCharacterVictoriesAsync(userId, run.IdPersonagemJogadorOrigem, systemId, token) ?? [])
            state.LearnHistorical(battle, systemId);
        return state.DefeatedEnemies.Where(item => item.SystemId == systemId && item.Encounter.Enemy is not null).ToArray();
    }

    private static GameTrainingEnemyDto Describe(string key, GameBattlePreviewEnemy enemy) =>
        new(key, enemy.Name, enemy.Image, enemy.MaxVida, enemy.MaxMana, enemy.MaxEstamina);

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
        actor.Image) { Condicoes = actor.ActiveConditions };
}
