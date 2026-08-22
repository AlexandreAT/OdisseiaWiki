using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;

namespace OdisseiaWiki.Services.Interfaces
{
    public interface IPageService
    {
        Task<ResultPage> CreateAsync(CreatePageWithBlocksDto dto);

        Task<PageDto?> GetByIdAsync(int id, bool aplicarVisibilidadeDePersonagem = false);

        Task<PageDto?> GetBySlugAsync(string slug, bool aplicarVisibilidadeDePersonagem = false);

        Task<List<SearchItemDto>> SearchAsync(string termo);

        Task<List<PageDto>> GetAllAsync(bool? visivel = null);

        Task<List<PageDto>> GetReferencingAsync(
            string entityType,
            string entityId,
            bool? visivel = null,
            bool aplicarVisibilidadeDePersonagem = false);

        Task<PageDto> UpdateAsync(int id, CreatePageWithBlocksDto dto);

        Task<bool> DeleteAsync(int id);
    }
}
