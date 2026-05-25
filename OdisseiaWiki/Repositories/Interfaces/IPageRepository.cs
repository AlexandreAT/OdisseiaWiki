using OdisseiaWiki.Models;

namespace OdisseiaWiki.Repositories.Interfaces
{
    public interface IPageRepository
    {
        Task<Page> CreateAsync(Page page);

        Task<Page?> GetByIdAsync(int id);

        Task<List<Page>> SearchAsync(string termo);

        Task<Page?> GetBySlugAsync(string slug);

        Task<List<Page>> GetAllAsync(bool? visivel = null);

        Task<Page> UpdateAsync(Page page);

        Task<bool> DeleteAsync(int id);
    }
}
