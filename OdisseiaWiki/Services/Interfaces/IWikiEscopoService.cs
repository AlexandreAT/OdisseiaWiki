using OdisseiaWiki.Models;

namespace OdisseiaWiki.Services.Interfaces;

public interface IWikiEscopoService
{
    Task<WikiEscopo> EnsureOficialAsync(CancellationToken cancellationToken = default);
    Task<WikiEscopo> EnsureMesaAsync(int idMesa, CancellationToken cancellationToken = default);
    Task<WikiEscopo?> GetByMesaAsync(int idMesa, CancellationToken cancellationToken = default);
}
