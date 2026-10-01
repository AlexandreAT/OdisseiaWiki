using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Services;

public sealed class WikiEscopoService : IWikiEscopoService
{
    private readonly IWikiEscopoRepository _repository;

    public WikiEscopoService(IWikiEscopoRepository repository) => _repository = repository;

    public Task<WikiEscopo> EnsureOficialAsync(CancellationToken cancellationToken = default) =>
        _repository.EnsureOficialAsync(cancellationToken);

    public Task<WikiEscopo> EnsureMesaAsync(int idMesa, CancellationToken cancellationToken = default) =>
        _repository.EnsureMesaAsync(idMesa, cancellationToken);

    public Task<WikiEscopo?> GetByMesaAsync(int idMesa, CancellationToken cancellationToken = default) =>
        _repository.GetByMesaAsync(idMesa, cancellationToken);
}
