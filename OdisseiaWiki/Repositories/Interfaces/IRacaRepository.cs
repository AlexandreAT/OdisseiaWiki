using OdisseiaWiki.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace OdisseiaWiki.Repositories.Interfaces
{
    public interface IRacaRepository
    {
        Task<List<Raca>> GetAllAsync(bool? visivel = null);
        Task<Raca?> GetByIdAsync(int id);
        Task<Raca> CreateAsync(Raca raca);
        Task<Raca> UpdateAsync(Raca raca);
        Task<bool> DeleteAsync(int id);
        Task<List<Raca>> SearchAsync(string termo);
    }
}
