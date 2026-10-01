namespace OdisseiaWiki.Repositories.Interfaces;

public interface IWikiGraphRepository
{
    Task<WikiGraphSnapshot> GetSnapshotAsync(CancellationToken cancellationToken = default);
    Task<WikiGraphSnapshot> GetSnapshotAsync(IReadOnlyCollection<int>? idWikiEscopos, CancellationToken cancellationToken = default);
}
