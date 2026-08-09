namespace OdisseiaWiki.Repositories.Interfaces;

public interface IWikiGraphRepository
{
    Task<WikiGraphSnapshot> GetSnapshotAsync(CancellationToken cancellationToken = default);
}
