using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;

namespace OdisseiaWiki.Services.Interfaces
{
    public interface IPageService
    {
        Task<ResultPage> CreateAsync(CreatePageWithBlocksDto dto, int? idWikiEscopo = null, int? idSistemaRpg = null);

        Task<PageDto?> GetByIdAsync(int id, bool aplicarVisibilidadeDePersonagem = false, int? idWikiEscopo = null);

        Task<PageDto?> GetBySlugAsync(string slug, bool aplicarVisibilidadeDePersonagem = false, int? idWikiEscopo = null);

        Task<List<SearchItemDto>> SearchAsync(string termo, int? idWikiEscopo = null);

        Task<List<PageDto>> GetAllAsync(bool? visivel = null, int? idWikiEscopo = null, bool ocultarReferenciasInvisiveis = false);

        Task<List<PageDto>> GetReferencingAsync(
            string entityType,
            string entityId,
            bool? visivel = null,
            bool aplicarVisibilidadeDePersonagem = false,
            int? idWikiEscopo = null);

        Task<PageDto> UpdateAsync(int id, CreatePageWithBlocksDto dto, int? idWikiEscopo = null);

        Task<bool> DeleteAsync(int id, int? idWikiEscopo = null);
    }
}
