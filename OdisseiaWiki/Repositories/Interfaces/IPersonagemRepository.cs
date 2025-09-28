using OdisseiaWiki.Models;

namespace OdisseiaWiki.Repositories.Interfaces
{
    public interface IPersonagemRepository
    {
        Task<List<Personagen>> GetAllAsync();
        Task<Personagen?> GetByIdAsync(int id);
        Task<Personagen> CreateAsync(Personagen personagem);
        Task<Personagen> UpdateAsync(Personagen personagem);
        Task<bool> DeleteAsync(int id);
    }
}
