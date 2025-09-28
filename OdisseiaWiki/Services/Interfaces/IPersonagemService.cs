using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;

namespace OdisseiaWiki.Services.Interfaces
{
    public interface IPersonagemService
    {
        Task<ResultPersonagem> CreateAsync(PersonagemDto dto);
        Task<List<Personagen>> GetAllAsync();
        Task<Personagen?> GetByIdAsync(int id);
        Task<ResultPersonagem> UpdateAsync(int id, PersonagemDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
