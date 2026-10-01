using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Data;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;

namespace OdisseiaWiki.Repositories;

public sealed class WikiEscopoRepository : IWikiEscopoRepository
{
    private readonly OdisseiaContext _context;

    public WikiEscopoRepository(OdisseiaContext context) => _context = context;

    public async Task<WikiEscopo> EnsureOficialAsync(CancellationToken cancellationToken = default)
    {
        WikiEscopo? existing = await _context.WikiEscopos
            .FirstOrDefaultAsync(scope => scope.Chave == WikiEscopo.ChaveOficial, cancellationToken);
        if (existing is not null)
            return existing;

        WikiEscopo official = new()
        {
            IdWikiEscopo = WikiEscopo.IdOficial,
            Tipo = WikiEscopoTipo.Oficial,
            Chave = WikiEscopo.ChaveOficial,
            DataCriacao = DateTime.UtcNow,
        };
        _context.WikiEscopos.Add(official);
        await _context.SaveChangesAsync(cancellationToken);
        return official;
    }

    public Task<WikiEscopo?> GetByMesaAsync(int idMesa, CancellationToken cancellationToken = default) =>
        _context.WikiEscopos.FirstOrDefaultAsync(scope => scope.IdMesa == idMesa, cancellationToken);

    public async Task<WikiEscopo> EnsureMesaAsync(int idMesa, CancellationToken cancellationToken = default)
    {
        WikiEscopo? existing = await GetByMesaAsync(idMesa, cancellationToken);
        if (existing is not null)
            return existing;

        WikiEscopo scope = new()
        {
            Tipo = WikiEscopoTipo.Mesa,
            Chave = $"MESA:{idMesa}",
            IdMesa = idMesa,
            DataCriacao = DateTime.UtcNow,
        };
        _context.WikiEscopos.Add(scope);
        try
        {
            await _context.SaveChangesAsync(cancellationToken);
            return scope;
        }
        catch (DbUpdateException)
        {
            _context.Entry(scope).State = EntityState.Detached;
            WikiEscopo? concorrente = await GetByMesaAsync(idMesa, cancellationToken);
            if (concorrente is not null)
                return concorrente;

            throw;
        }
    }
}
