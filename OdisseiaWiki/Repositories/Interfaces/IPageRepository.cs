using OdisseiaWiki.Models;

namespace OdisseiaWiki.Repositories.Interfaces
{
    public interface IPageRepository
    {
        Task<Page> CreateAsync(Page page);

        Task<Page?> GetByIdAsync(int id, int? idWikiEscopo = null);

        Task<bool> ExistsVisibleAsync(int id, int? idWikiEscopo = null);

        Task<List<Page>> SearchAsync(string termo, int? idWikiEscopo = null);

        Task<Page?> GetBySlugAsync(string slug, int? idWikiEscopo = null);

        Task<List<Page>> GetAllAsync(bool? visivel = null, int? idWikiEscopo = null);

        Task<List<Page>> GetWithRelationBlocksAsync(bool? visivel = null, int? idWikiEscopo = null);

        Task<Page> UpdateAsync(Page page);

        Task<bool> DeleteAsync(int id);
    }
}
