namespace OdisseiaWiki.Repositories.Interfaces;

public interface IAssetReferenceRepository
{
    Task<bool> IsReferencedAsync(string assetUrl, CancellationToken cancellationToken = default);
}
