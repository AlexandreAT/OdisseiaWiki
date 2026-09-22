using OdisseiaWiki.Models;

namespace OdisseiaWiki.Repositories.Interfaces;

public interface IGameplayEngineRepository
{
    Task<T> ExecuteInTransactionAsync<T>(
        Func<CancellationToken, Task<T>> operation,
        CancellationToken cancellationToken = default);
    Task<Mesa?> GetMesaAsync(int idMesa, CancellationToken cancellationToken = default);
    Task<Mesa?> LockMesaAsync(int idMesa, CancellationToken cancellationToken = default);
    Task<MesaSessao?> GetSessionAsync(long idMesaSessao, CancellationToken cancellationToken = default);
    Task<MesaSessao?> LockSessionAsync(long idMesaSessao, CancellationToken cancellationToken = default);
    Task<MesaComando?> GetCommandAsync(
        int idMesa, int idUsuarioAtor, string key, CancellationToken cancellationToken = default);
    Task<PersonagemJogador?> GetCharacterAsync(
        int idPersonagemJogador, CancellationToken cancellationToken = default);
    Task<SistemaVersao?> GetSystemVersionAsync(
        int idSistemaVersao, CancellationToken cancellationToken = default);
    Task<bool> CanAccessTableAsync(
        int idMesa, int idUsuario, CancellationToken cancellationToken = default);
    Task<List<MesaEvento>> GetVisibleEventsAsync(
        long idMesaSessao,
        int idUsuario,
        bool isMaster,
        long afterSequence,
        int take,
        CancellationToken cancellationToken = default);
    void AddSession(MesaSessao session);
    void AddCommand(MesaComando command);
    void AddEvent(MesaEvento gameplayEvent);
    void AddRoll(MesaRolagem roll);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
