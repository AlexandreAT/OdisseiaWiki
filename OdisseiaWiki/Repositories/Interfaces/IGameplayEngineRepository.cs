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
    Task<PersonagemJogador?> GetCharacterForUpdateAsync(
        int idPersonagemJogador, CancellationToken cancellationToken = default);
    Task<MesaEvento?> GetEventAsync(
        long idMesaEvento, CancellationToken cancellationToken = default);
    Task<bool> HasEffectApplicationAsync(
        long idMesaSessao,
        long idEventoOrigem,
        string codigoEfeito,
        int idPersonagemAlvo,
        CancellationToken cancellationToken = default);
    Task<SistemaVersao?> GetSystemVersionAsync(
        int idSistemaVersao, CancellationToken cancellationToken = default);
    Task<bool> CanAccessTableAsync(
        int idMesa, int idUsuario, CancellationToken cancellationToken = default);
    /// <summary>
    /// Returns the next immutable ledger rows without applying viewer visibility.
    /// Visibility belongs to the service so an unreadable row can still advance
    /// the cursor used by that viewer.
    /// </summary>
    Task<List<MesaEvento>> GetEventsAfterSequenceAsync(
        long idMesaSessao,
        long afterSequence,
        int take,
        CancellationToken cancellationToken = default);
    void AddSession(MesaSessao session);
    void AddCommand(MesaComando command);
    void AddEvent(MesaEvento gameplayEvent);
    void AddRoll(MesaRolagem roll);
    void AddEffectApplication(MesaEfeitoAplicado effectApplication);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
