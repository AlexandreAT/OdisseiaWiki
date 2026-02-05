using OdisseiaWiki.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace OdisseiaWiki.Repositories.Interfaces
{
    public interface IPersonagemRepository
    {
        Task<List<Personagen>> GetAllAsync(bool? visivel = null);
        Task<Personagen?> GetByIdAsync(int id);
        Task<Personagen> CreateAsync(Personagen personagem);
        Task<Personagen> UpdateAsync(Personagen personagem);
        Task<bool> DeleteAsync(int id);
    }
}
