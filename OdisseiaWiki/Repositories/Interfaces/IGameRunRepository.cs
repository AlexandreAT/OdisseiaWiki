using OdisseiaWiki.Models;

namespace OdisseiaWiki.Repositories.Interfaces;

public interface IGameRunRepository
{
    Task<GameCharacterMemory?> GetCharacterMemoryAsync(int userId, int characterId, CancellationToken token);
    Task AddCharacterMemoryAsync(GameCharacterMemory memory, CancellationToken token);
    // Read-only milestone projection: battle identity/date, run map and mode code/configuration; no replay/resource snapshots.
    Task<IReadOnlyList<GameRunBattle>> GetCharacterVictoriesAsync(int userId, int characterId, int systemId, CancellationToken token);
    Task<IReadOnlyList<PersonagemJogador>> GetCharactersAsync(int idUsuario, CancellationToken cancellationToken);
    Task<IReadOnlyList<GameModeVersion>> GetPublishedModesAsync(
        IReadOnlyCollection<int> systemVersionIds, CancellationToken cancellationToken);
    Task<PersonagemJogador?> GetOwnedCharacterAsync(
        int idUsuario, int idPersonagemJogador, CancellationToken cancellationToken);
    Task<GameRun?> GetActiveAsync(int idUsuario, CancellationToken cancellationToken);
    Task<GameRun?> GetByIdAsync(long idGameRun, int idUsuario, CancellationToken cancellationToken);
    Task<GameRunCommand?> GetCommandAsync(int idUsuario, Guid chave, CancellationToken cancellationToken);
    Task<GameModeVersion?> GetOrCreateModeVersionAsync(int idSistemaVersao, CancellationToken cancellationToken);
    Task<GameModeVersion?> GetOrCreateModeVersionAsync(
        int idSistemaVersao, string numeroVersao, CancellationToken cancellationToken);
    Task AddRunAsync(GameRun run, CancellationToken cancellationToken);
    Task AddCommandAsync(GameRunCommand command, CancellationToken cancellationToken);
    Task AddBattleAsync(GameRunBattle battle, CancellationToken cancellationToken);
    Task<GameRunBattle?> GetBattleAsync(long idGameRun, string noId, CancellationToken cancellationToken);
    Task<GameRunBattle?> GetLastBattleAsync(long idGameRun, CancellationToken cancellationToken);
    Task<IReadOnlyList<GameRunBattle>> GetBattlesAsync(long idGameRun, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
    Task<T> ExecuteWithUserLockAsync<T>(
        int idUsuario, Func<Task<T>> operation, CancellationToken cancellationToken);
}
