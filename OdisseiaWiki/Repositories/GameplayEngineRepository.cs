using System.Data;
using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Data;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;

namespace OdisseiaWiki.Repositories;

public sealed class GameplayEngineRepository : IGameplayEngineRepository
{
    private readonly OdisseiaContext _context;

    public GameplayEngineRepository(OdisseiaContext context)
    {
        _context = context;
    }

    public async Task<T> ExecuteInTransactionAsync<T>(
        Func<CancellationToken, Task<T>> operation,
        CancellationToken cancellationToken = default)
    {
        var strategy = _context.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            _context.ChangeTracker.Clear();
            await using var transaction = await _context.Database.BeginTransactionAsync(
                IsolationLevel.Serializable,
                cancellationToken);
            try
            {
                T result = await operation(cancellationToken);
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

    public Task<Mesa?> GetMesaAsync(int idMesa, CancellationToken cancellationToken = default)
        => _context.Mesas.AsNoTracking().FirstOrDefaultAsync(
            item => item.Idmesa == idMesa,
            cancellationToken);

    public Task<Mesa?> LockMesaAsync(int idMesa, CancellationToken cancellationToken = default)
        => _context.Mesas
            .FromSqlInterpolated($"SELECT * FROM `mesas` WHERE `IDMesa` = {idMesa} FOR UPDATE")
            .SingleOrDefaultAsync(cancellationToken);

    public Task<MesaSessao?> GetSessionAsync(
        long idMesaSessao,
        CancellationToken cancellationToken = default)
        => _context.MesaSessoes.AsNoTracking().FirstOrDefaultAsync(
            item => item.IdMesaSessao == idMesaSessao,
            cancellationToken);

    public Task<MesaSessao?> LockSessionAsync(
        long idMesaSessao,
        CancellationToken cancellationToken = default)
        => _context.MesaSessoes
            .FromSqlInterpolated(
                $"SELECT * FROM `mesasessoes` WHERE `IDMesaSessao` = {idMesaSessao} FOR UPDATE")
            .SingleOrDefaultAsync(cancellationToken);

    public Task<MesaComando?> GetCommandAsync(
        int idMesa,
        int idUsuarioAtor,
        string key,
        CancellationToken cancellationToken = default)
        => _context.MesaComandos.AsNoTracking().FirstOrDefaultAsync(
            item => item.IdMesa == idMesa &&
                item.IdUsuarioAtor == idUsuarioAtor &&
                item.ChaveIdempotencia == key,
            cancellationToken);

    public Task<PersonagemJogador?> GetCharacterAsync(
        int idPersonagemJogador,
        CancellationToken cancellationToken = default)
        => _context.PersonagemJogadores.AsNoTracking().FirstOrDefaultAsync(
            item => item.IdpersonagemJogador == idPersonagemJogador,
            cancellationToken);

    public Task<PersonagemJogador?> GetCharacterForUpdateAsync(
        int idPersonagemJogador,
        CancellationToken cancellationToken = default)
        => _context.PersonagemJogadores.FirstOrDefaultAsync(
            item => item.IdpersonagemJogador == idPersonagemJogador,
            cancellationToken);

    public Task<MesaEvento?> GetEventAsync(
        long idMesaEvento,
        CancellationToken cancellationToken = default)
        => _context.MesaEventos.AsNoTracking()
            .FirstOrDefaultAsync(item => item.IdMesaEvento == idMesaEvento, cancellationToken);

    public Task<bool> HasEffectApplicationAsync(
        long idMesaSessao,
        long idEventoOrigem,
        string codigoEfeito,
        int idPersonagemAlvo,
        CancellationToken cancellationToken = default)
    {
        return _context.MesaEfeitosAplicados.AsNoTracking().AnyAsync(item =>
            item.IdMesaSessao == idMesaSessao &&
            item.IdEventoOrigem == idEventoOrigem &&
            item.ChaveEfeito == codigoEfeito &&
            item.IdPersonagemAlvo == idPersonagemAlvo,
            cancellationToken);
    }

    public Task<SistemaVersao?> GetSystemVersionAsync(
        int idSistemaVersao,
        CancellationToken cancellationToken = default)
        => _context.SistemaVersoes.AsNoTracking()
            .Include(item => item.SistemaRpg)
            .Include(item => item.Modulos)
            .Include(item => item.FontesExperiencia)
            .Include(item => item.Atributos)
            .Include(item => item.Recursos)
            .Include(item => item.Acoes)
            .Include(item => item.ResultadosDado)
            .FirstOrDefaultAsync(
            item => item.IdSistemaVersao == idSistemaVersao,
            cancellationToken);

    public Task<bool> CanAccessTableAsync(
        int idMesa,
        int idUsuario,
        CancellationToken cancellationToken = default)
        => _context.Mesas.AnyAsync(mesa =>
            mesa.Idmesa == idMesa &&
            !mesa.PadraoSistema &&
            (mesa.IdusuarioCriacao == idUsuario ||
             _context.Mesausuarios.Any(link =>
                 link.Idmesa == idMesa && link.Idusuario == idUsuario)),
            cancellationToken);

    public Task<List<MesaEvento>> GetEventsAfterSequenceAsync(
        long idMesaSessao,
        long afterSequence,
        int take,
        CancellationToken cancellationToken = default)
        => _context.MesaEventos
            .AsNoTracking()
            .Include(item => item.Rolagem)
            .Include(item => item.PersonagemJogador)
            .Where(item => item.IdMesaSessao == idMesaSessao && item.Sequencia > afterSequence)
            .OrderBy(item => item.Sequencia)
            .Take(take)
            .ToListAsync(cancellationToken);

    public void AddSession(MesaSessao session) => _context.MesaSessoes.Add(session);
    public void AddCommand(MesaComando command) => _context.MesaComandos.Add(command);
    public void AddEvent(MesaEvento gameplayEvent) => _context.MesaEventos.Add(gameplayEvent);
    public void AddRoll(MesaRolagem roll) => _context.MesaRolagens.Add(roll);
    public void AddEffectApplication(MesaEfeitoAplicado effectApplication) =>
        _context.MesaEfeitosAplicados.Add(effectApplication);

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => _context.SaveChangesAsync(cancellationToken);
}
