using System.Data;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Data;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;

namespace OdisseiaWiki.Repositories;

public sealed class GameRunRepository : IGameRunRepository
{
    private const string ModeCode = "ROGUELIKE_MVP";
    private const string ModeVersion = "0.2.0";
    private const string BaseModeVersion = "0.3.0";
    private const string BranchConfiguration = """
        {
          "schemaVersion": 1,
          "previewUseTotalForRanges": true,
          "previewEnemy": { "name": "Sentinela de Treino", "maxVida": 300, "defesa": 0 },
          "previewFallbackAction": { "name": "Ataque de treino", "baseDamage": 40 },
          "previewDamageByResult": {
            "FALHA_CRITICA": 0, "ERRO": 0, "ACERTO": 80,
            "ACERTO_PRECISO": 130, "CRITICO": 160
          },
          "previewPlayerDamageByResult": {
            "FALHA_CRITICA": { "multiplier": 0, "bonus": 0 },
            "ERRO": { "multiplier": 0, "bonus": 0 },
            "ACERTO": { "multiplier": 1, "bonus": 0 },
            "ACERTO_PRECISO": { "multiplier": 1, "bonus": 50 },
            "CRITICO": { "multiplier": 2, "bonus": 0 }
          },
          "map": { "schemaVersion": 2, "branchEncounterCodes": ["CACADOR", "GUARDIAO"] },
          "encounters": {
            "CACADOR": {
              "mapName": "Rota do Caçador",
              "enemy": { "name": "Caçador", "maxVida": 220, "defesa": 0 },
              "damageByResult": {
                "FALHA_CRITICA": 0, "ERRO": 0, "ACERTO": 100,
                "ACERTO_PRECISO": 160, "CRITICO": 200
              }
            },
            "GUARDIAO": {
              "mapName": "Rota do Guardião",
              "enemy": { "name": "Guardião", "maxVida": 420, "defesa": 0 },
              "damageByResult": {
                "FALHA_CRITICA": 0, "ERRO": 0, "ACERTO": 50,
                "ACERTO_PRECISO": 85, "CRITICO": 130
              }
            }
          }
        }
        """;

    private static readonly HashSet<string> ExpectedAttackResults = new(StringComparer.Ordinal)
    {
        "FALHA_CRITICA", "ERRO", "ACERTO", "ACERTO_PRECISO", "CRITICO",
    };

    private readonly OdisseiaContext _context;

    public GameRunRepository(OdisseiaContext context) => _context = context;

    public Task<GameCharacterMemory?> GetCharacterMemoryAsync(int userId, int characterId, CancellationToken token) =>
        _context.GameCharacterMemories.FirstOrDefaultAsync(item => item.IdPersonagemJogador == characterId &&
            item.Personagem.Idusuario == userId, token);
    public Task AddCharacterMemoryAsync(GameCharacterMemory memory, CancellationToken token) =>
        _context.GameCharacterMemories.AddAsync(memory, token).AsTask();
    public async Task<IReadOnlyList<GameRunBattle>> GetCharacterVictoriesAsync(
        int userId, int characterId, int systemId, CancellationToken token) =>
        await _context.GameRunBattles.AsNoTracking().Where(battle => battle.VencedorId == "player" &&
            battle.Run.IdUsuario == userId && battle.Run.IdPersonagemJogadorOrigem == characterId &&
            battle.Run.SistemaVersao.IdSistemaRpg == systemId)
            .Include(battle => battle.Run).ThenInclude(run => run.GameModeVersion)
            .OrderBy(battle => battle.CriadaEmUtc).ThenBy(battle => battle.IdGameRunBattle).ToListAsync(token);

    public async Task<IReadOnlyList<PersonagemJogador>> GetCharactersAsync(
        int idUsuario, CancellationToken cancellationToken) =>
        await _context.PersonagemJogadores.AsNoTracking()
            .Where(item => item.Idusuario == idUsuario && item.IdPersonagemOrigem == null)
            .OrderBy(item => item.Nome)
            .Select(item => new PersonagemJogador
            {
                IdpersonagemJogador = item.IdpersonagemJogador,
                Idmesa = item.Idmesa,
                Nome = item.Nome,
                Imagem = item.Imagem,
                Idraca = item.Idraca,
                IdSistemaVersao = item.IdSistemaVersao,
                  Mesa = new Mesa { Nome = item.Mesa.Nome },
            })
            .ToListAsync(cancellationToken);

    public Task<PersonagemJogador?> GetOwnedCharacterAsync(
        int idUsuario, int idPersonagemJogador, CancellationToken cancellationToken) =>
        _context.PersonagemJogadores.AsNoTracking()
            .FirstOrDefaultAsync(item =>
                item.Idusuario == idUsuario &&
                item.IdpersonagemJogador == idPersonagemJogador &&
                item.IdPersonagemOrigem == null,
                cancellationToken);

    public async Task<IReadOnlyList<GameModeVersion>> GetPublishedModesAsync(
        IReadOnlyCollection<int> systemVersionIds, CancellationToken cancellationToken) =>
        systemVersionIds.Count == 0 ? [] : await _context.GameModeVersions.AsNoTracking()
            .Where(item => systemVersionIds.Contains(item.IdSistemaVersao) &&
                item.Status == GameModeVersionStatus.Publicado)
            .OrderByDescending(item => item.PublicadaEmUtc)
            .ThenByDescending(item => item.IdGameModeVersion)
            .ToListAsync(cancellationToken);

    public Task<GameRun?> GetActiveAsync(int idUsuario, CancellationToken cancellationToken) =>
        _context.GameRuns.AsNoTracking()
            .Include(item => item.GameModeVersion)
            .FirstOrDefaultAsync(item =>
                item.IdUsuario == idUsuario && item.Status == GameRunStatus.Ativa,
                cancellationToken);

    public Task<GameRun?> GetByIdAsync(
        long idGameRun, int idUsuario, CancellationToken cancellationToken) =>
        _context.GameRuns
            .Include(item => item.GameModeVersion)
            .FirstOrDefaultAsync(item =>
                item.IdGameRun == idGameRun && item.IdUsuario == idUsuario,
                cancellationToken);

    public Task<GameRunCommand?> GetCommandAsync(
        int idUsuario, Guid chave, CancellationToken cancellationToken) =>
        _context.GameRunCommands.AsNoTracking()
            .FirstOrDefaultAsync(item =>
                item.IdUsuario == idUsuario &&
                item.ChaveIdempotencia == chave.ToString("D"),
                cancellationToken);

    public Task<GameModeVersion?> GetOrCreateModeVersionAsync(
        int idSistemaVersao, CancellationToken cancellationToken) =>
        GetCurrentModeVersionAsync(idSistemaVersao, cancellationToken);

    private async Task<GameModeVersion?> GetCurrentModeVersionAsync(
        int idSistemaVersao, CancellationToken cancellationToken)
    {
        GameModeVersion? latest = await _context.GameModeVersions
            .Where(item => item.IdSistemaVersao == idSistemaVersao &&
                item.IdMesa == null && item.Codigo == ModeCode && item.Status == GameModeVersionStatus.Publicado)
            .OrderByDescending(item => item.PublicadaEmUtc)
            .ThenByDescending(item => item.IdGameModeVersion)
            .FirstOrDefaultAsync(cancellationToken);
        return latest ?? await GetOrCreateModeVersionAsync(idSistemaVersao, BaseModeVersion, cancellationToken);
    }

    public async Task<GameModeVersion?> GetOrCreateModeVersionAsync(
        int idSistemaVersao, string numeroVersao, CancellationToken cancellationToken)
    {
        if (numeroVersao is not (ModeVersion or BaseModeVersion))
            return null;
        // Serialize o provisionamento da versão do modo entre usuários diferentes.
        SistemaVersao? version = await _context.SistemaVersoes
            .FromSqlInterpolated($"SELECT * FROM `sistemaversoes` WHERE `IdSistemaVersao` = {idSistemaVersao} FOR UPDATE")
            .SingleOrDefaultAsync(cancellationToken);
        if (version is null || version.Status == SistemaVersaoStatus.Rascunho)
            return null;

        string? systemCode = await _context.SistemasRpg.AsNoTracking()
            .Where(item => item.IdSistemaRpg == version.IdSistemaRpg && item.Ativo)
            .Select(item => item.Codigo)
            .SingleOrDefaultAsync(cancellationToken);
        if (!string.Equals(systemCode, "ODISSEIA", StringComparison.Ordinal))
            return null;

        var attackResults = await _context.SistemaResultadosDado.AsNoTracking()
            .Where(item => item.IdSistemaVersao == idSistemaVersao && item.CodigoTeste == "ATAQUE_COMUM")
            .Select(item => new { item.CodigoResultado, item.Dado, item.QuantidadeDados })
            .ToArrayAsync(cancellationToken);
        if (attackResults.Length != ExpectedAttackResults.Count ||
            !ExpectedAttackResults.SetEquals(attackResults.Select(item => item.CodigoResultado)) ||
            attackResults.Any(item => item.QuantidadeDados != 1 ||
                !string.Equals(item.Dado, "D20", StringComparison.OrdinalIgnoreCase)))
            return null;

        GameModeVersion? existing = await _context.GameModeVersions
            .FirstOrDefaultAsync(item =>
                item.IdSistemaVersao == idSistemaVersao &&
                item.Codigo == ModeCode && item.NumeroVersao == numeroVersao,
                cancellationToken);
        if (existing is not null)
            return existing.Status == GameModeVersionStatus.Publicado ? existing : null;

        DateTime now = DateTime.UtcNow;
        GameModeVersion mode = new()
        {
            IdSistemaVersao = idSistemaVersao,
            Codigo = ModeCode,
            NumeroVersao = numeroVersao,
            Status = GameModeVersionStatus.Publicado,
            SchemaVersion = 1,
            ConfiguracaoJson = numeroVersao == BaseModeVersion ? BaseConfiguration() : BranchConfiguration,
            CriadaEmUtc = now,
            PublicadaEmUtc = now,
        };
        _context.GameModeVersions.Add(mode);
        await _context.SaveChangesAsync(cancellationToken);
        return mode;
    }

    private static string BaseConfiguration()
    {
        JsonObject config = JsonNode.Parse(BranchConfiguration)!.AsObject();
        config["map"]!["schemaVersion"] = 3;
        config["base"] = new JsonObject { ["restType"] = "SIMPLES" };
        return config.ToJsonString();
    }

    internal static string CreateBaseConfigurationForDraft() => BaseConfiguration();

    public Task AddRunAsync(GameRun run, CancellationToken cancellationToken)
    {
        // Published modes are read without tracking. Adding their detached graph
        // with the run would attempt to INSERT the already-published version.
        if (run.GameModeVersion is { } mode)
        {
            GameModeVersion? tracked = _context.GameModeVersions.Local
                .FirstOrDefault(item => item.IdGameModeVersion == mode.IdGameModeVersion);
            if (tracked is not null) run.GameModeVersion = tracked;
            else if (_context.Entry(mode).State == EntityState.Detached)
                _context.Entry(mode).State = EntityState.Unchanged;
        }
        return _context.GameRuns.AddAsync(run, cancellationToken).AsTask();
    }

    public Task AddCommandAsync(GameRunCommand command, CancellationToken cancellationToken) =>
        _context.GameRunCommands.AddAsync(command, cancellationToken).AsTask();

    public Task AddBattleAsync(GameRunBattle battle, CancellationToken cancellationToken) =>
        _context.GameRunBattles.AddAsync(battle, cancellationToken).AsTask();

    public Task<GameRunBattle?> GetBattleAsync(long idGameRun, string noId, CancellationToken cancellationToken) =>
        _context.GameRunBattles.AsNoTracking().FirstOrDefaultAsync(
            item => item.IdGameRun == idGameRun && item.NoId == noId, cancellationToken);

    public Task<GameRunBattle?> GetLastBattleAsync(long idGameRun, CancellationToken cancellationToken) =>
        _context.GameRunBattles.AsNoTracking().Where(item => item.IdGameRun == idGameRun)
            .OrderByDescending(item => item.Ordem).FirstOrDefaultAsync(cancellationToken);

    public async Task<IReadOnlyList<GameRunBattle>> GetBattlesAsync(long idGameRun, CancellationToken cancellationToken) =>
        await _context.GameRunBattles.AsNoTracking().Where(item => item.IdGameRun == idGameRun)
            .OrderBy(item => item.Ordem).ToListAsync(cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken) =>
        _context.SaveChangesAsync(cancellationToken);

    public async Task<T> ExecuteWithUserLockAsync<T>(
        int idUsuario, Func<Task<T>> operation, CancellationToken cancellationToken)
    {
        var strategy = _context.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            _context.ChangeTracker.Clear();
            await using var transaction = await _context.Database.BeginTransactionAsync(
                IsolationLevel.ReadCommitted, cancellationToken);
            try
            {
                Usuario? owner = await _context.Usuarios
                    .FromSqlInterpolated($"SELECT * FROM `usuarios` WHERE `IDUsuario` = {idUsuario} FOR UPDATE")
                    .SingleOrDefaultAsync(cancellationToken);
                if (owner is null)
                    throw new KeyNotFoundException("USUARIO_NAO_ENCONTRADO");

                T result = await operation();
                await transaction.CommitAsync(cancellationToken);
                return result;
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                throw;
            }
        });
    }
}
