using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;

namespace OdisseiaWiki.Services.Interfaces
{
    public interface IPageService
    {
        Task<ResultPage> CreateAsync(CreatePageWithBlocksDto dto);

        Task<PageDto?> GetByIdAsync(int id);

        Task<PageDto?> GetBySlugAsync(string slug);

        Task<List<SearchItemDto>> SearchAsync(string termo);

        Task<List<PageDto>> GetAllAsync(bool? visivel = null);

        Task<List<PageDto>> GetReferencingAsync(string entityType, string entityId, bool? visivel = null);

        Task<PageDto> UpdateAsync(int id, CreatePageWithBlocksDto dto);

        Task<bool> DeleteAsync(int id);
    }
}
