using OdisseiaWiki.Dtos;

namespace OdisseiaWiki.Services.Interfaces;

public interface IWikiGraphService
{
    Task<WikiGraphDto> GetAsync(
        bool includeHiddenMetadata,
        CancellationToken cancellationToken = default);
}
