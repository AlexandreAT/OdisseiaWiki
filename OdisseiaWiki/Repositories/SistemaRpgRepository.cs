using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Data;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;

namespace OdisseiaWiki.Repositories;

public sealed class SistemaRpgRepository : ISistemaRpgRepository
{
    private readonly OdisseiaContext _context;

    public SistemaRpgRepository(OdisseiaContext context) => _context = context;

    public Task<List<SistemaRpg>> GetAllAsync(bool includeInactive = false)
    {
        IQueryable<SistemaRpg> query = _context.SistemasRpg
            .AsNoTracking()
            .Include(s => s.VersaoPublicada)
            .Include(s => s.Versoes);

        if (!includeInactive)
            query = query.Where(s => s.Ativo);

        return query.OrderBy(s => s.Nome).AsSplitQuery().ToListAsync();
    }

    public Task<SistemaRpg?> GetByIdAsync(int id, bool tracked = false)
    {
        IQueryable<SistemaRpg> query = _context.SistemasRpg
            .Include(s => s.VersaoPublicada)
            .Include(s => s.Versoes);
        if (!tracked)
            query = query.AsNoTracking();
        return query.AsSplitQuery().FirstOrDefaultAsync(s => s.IdSistemaRpg == id);
    }

    public Task<SistemaRpg?> GetByCodeAsync(string code, bool tracked = false)
    {
        IQueryable<SistemaRpg> query = _context.SistemasRpg
            .Include(s => s.VersaoPublicada)
            .Include(s => s.Versoes);
        if (!tracked)
            query = query.AsNoTracking();
        return query.AsSplitQuery().FirstOrDefaultAsync(s => s.Codigo == code);
    }

    public Task<List<SistemaVersao>> GetVersionsAsync(int idSistemaRpg) =>
        _context.SistemaVersoes
            .AsNoTracking()
            .Where(v => v.IdSistemaRpg == idSistemaRpg)
            .OrderByDescending(v => v.DataCriacao)
            .ToListAsync();

    public Task<SistemaVersao?> GetVersionAsync(
        int idSistemaVersao,
        bool includeConfiguration = false,
        bool tracked = false)
    {
        IQueryable<SistemaVersao> query = _context.SistemaVersoes
            .Include(v => v.SistemaRpg)
            .ThenInclude(s => s.VersaoPublicada);

        if (includeConfiguration)
        {
            query = query
                .Include(v => v.Modulos)
                .Include(v => v.Niveis)
                .Include(v => v.MarcosNivel)
                .Include(v => v.FontesExperiencia)
                .Include(v => v.Racas).ThenInclude(r => r.Passivas)
                .Include(v => v.Atributos)
                .Include(v => v.Recursos)
                .Include(v => v.Movimento)
                .Include(v => v.PontosAcao)
                .Include(v => v.Acoes)
                .Include(v => v.ResultadosDado)
                .Include(v => v.TiposDano)
                .Include(v => v.TiposDefesa)
                .Include(v => v.TiposMagia)
                .Include(v => v.SkillConfig)
                .Include(v => v.Condicoes)
                .Include(v => v.Descansos)
                .Include(v => v.Morte);
        }

        if (!tracked)
            query = query.AsNoTracking();

        return query.AsSplitQuery().FirstOrDefaultAsync(v => v.IdSistemaVersao == idSistemaVersao);
    }

    public Task<SistemaVersao?> GetVersionByNumberAsync(
        int idSistemaRpg,
        string numeroVersao,
        bool tracked = false)
    {
        IQueryable<SistemaVersao> query = _context.SistemaVersoes;
        if (!tracked)
            query = query.AsNoTracking();
        return query.FirstOrDefaultAsync(v =>
            v.IdSistemaRpg == idSistemaRpg && v.NumeroVersao == numeroVersao);
    }

    public Task<bool> SystemCodeExistsAsync(string code, int? exceptId = null) =>
        _context.SistemasRpg.AnyAsync(s => s.Codigo == code && (!exceptId.HasValue || s.IdSistemaRpg != exceptId));

    public Task<bool> VersionNumberExistsAsync(
        int idSistemaRpg,
        string numeroVersao,
        int? exceptId = null) =>
        _context.SistemaVersoes.AnyAsync(v =>
            v.IdSistemaRpg == idSistemaRpg &&
            v.NumeroVersao == numeroVersao &&
            (!exceptId.HasValue || v.IdSistemaVersao != exceptId));

    public Task<int> CountMesasBySystemAsync(int idSistemaRpg) =>
        _context.Mesas.CountAsync(m =>
            m.IdSistemaVersao.HasValue &&
            _context.SistemaVersoes.Any(v =>
                v.IdSistemaVersao == m.IdSistemaVersao.Value &&
                v.IdSistemaRpg == idSistemaRpg));

    public Task<int> CountMesasByVersionAsync(int idSistemaVersao) =>
        _context.Mesas.CountAsync(m => m.IdSistemaVersao == idSistemaVersao);

    public Task<bool> HasDerivedVersionsAsync(int idSistemaVersao) =>
        _context.SistemaVersoes.AnyAsync(v => v.IdVersaoBase == idSistemaVersao);

    public Task<Mesa?> GetMesaAsync(int idMesa, bool tracked = false)
    {
        IQueryable<Mesa> query = _context.Mesas
            .Include(m => m.SistemaVersao)
            .ThenInclude(v => v!.SistemaRpg);
        if (!tracked)
            query = query.AsNoTracking();
        return query.FirstOrDefaultAsync(m => m.Idmesa == idMesa);
    }

    public Task<List<Mesa>> GetMesasWithoutVersionAsync() =>
        _context.Mesas.Where(m => m.IdSistemaVersao == null).ToListAsync();

    public Task<List<Raca>> GetRacesAsync() =>
        _context.Racas.AsNoTracking().ToListAsync();

    public Task<List<Passiva>> GetPassivasAsync() =>
        _context.Passivas.AsNoTracking().ToListAsync();

    public async Task AddSystemAsync(SistemaRpg sistema)
    {
        await _context.SistemasRpg.AddAsync(sistema);
    }

    public async Task AddVersionAsync(SistemaVersao versao)
    {
        await _context.SistemaVersoes.AddAsync(versao);
    }

    public void RemoveSystem(SistemaRpg sistema) => _context.SistemasRpg.Remove(sistema);

    public void RemoveVersion(SistemaVersao versao) => _context.SistemaVersoes.Remove(versao);

    public void RemoveRange(IEnumerable<object> entities) => _context.RemoveRange(entities);

    public Task SaveChangesAsync() => _context.SaveChangesAsync();

    public async Task ExecuteInTransactionAsync(Func<Task> operation)
    {
        var strategy = _context.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();
            await operation();
            await transaction.CommitAsync();
        });
    }
}
