using OdisseiaWiki.Dtos;

namespace OdisseiaWiki.Services.Interfaces;

public interface IWikiGraphService
{
    Task<WikiGraphDto> GetAsync(
        bool includeHiddenMetadata,
        CancellationToken cancellationToken = default);

    Task<WikiGraphDto> GetComContextoAsync(
        bool includeHiddenMetadata,
        IReadOnlyCollection<int>? idWikiEscopos = null,
        string? mesaRoutePrefix = null,
        int? idWikiEscopoMesa = null,
        int? idSistemaRpg = null,
        int? idSistemaVersao = null,
        bool permitirOcultosDaMesa = false,
        CancellationToken cancellationToken = default);
}
