using OdisseiaWiki.Models;

namespace OdisseiaWiki.Repositories.Interfaces;

public interface IWikiEscopoRepository
{
    Task<WikiEscopo> EnsureOficialAsync(CancellationToken cancellationToken = default);
    Task<WikiEscopo?> GetByMesaAsync(int idMesa, CancellationToken cancellationToken = default);
    Task<WikiEscopo> EnsureMesaAsync(int idMesa, CancellationToken cancellationToken = default);
}
