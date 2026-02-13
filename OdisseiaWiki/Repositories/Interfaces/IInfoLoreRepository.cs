using OdisseiaWiki.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace OdisseiaWiki.Repositories.Interfaces
{
    public interface IInfoLoreRepository
    {
        Task<List<Infolore>> GetAllAsync(bool? visivel = null);
        Task<Infolore?> GetByIdAsync(int id);
        Task<Infolore> CreateAsync(Infolore infoLore);
        Task<Infolore> UpdateAsync(Infolore infoLore);
        Task<bool> DeleteAsync(int id);
        Task<List<Infolore>> SearchAsync(string termo);
    }
}