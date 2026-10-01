using System.Collections.Generic;
using System.Threading.Tasks;

namespace OdisseiaWiki.Repositories.Interfaces
{
    public interface IItemRepository
    {
        Task<List<Item>> GetAllAsync(bool? visivel = null, int? idWikiEscopo = null);
        Task<Item?> GetByIdAsync(string id);
        Task<Item?> GetByIdAsync(string id, int? idWikiEscopo);
        Task AddAsync(Item item);
        Task UpdateAsync(Item item);
        Task DeleteAsync(string id);
        Task<List<Item>> SearchAsync(string termo, int? idWikiEscopo = null);
        Task<List<Item>> GetBatchAsync(List<string> ids, int? idWikiEscopo = null);
    }
}
