using System.Collections.Generic;
using System.Threading.Tasks;

namespace OdisseiaWiki.Repositories.Interfaces
{
    public interface IItemRepository
    {
        Task<List<Item>> GetAllAsync(bool? visivel = null);
        Task<Item?> GetByIdAsync(string id);
        Task AddAsync(Item item);
        Task UpdateAsync(Item item);
        Task DeleteAsync(string id);
        Task<List<Item>> SearchAsync(string termo);
    }
}
