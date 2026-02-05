using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace OdisseiaWiki.Services.Interfaces
{
    public interface IPersonagemService
    {
        Task<ResultPersonagem> CreateAsync(PersonagemDto dto);
        Task<ResultPersonagem> UpdateAsync(int id, PersonagemDto dto);
        Task<List<Personagen>> GetAllAsync(bool? visivel = null);
        Task<Personagen?> GetByIdAsync(int id);
        Task<bool> DeleteAsync(int id);
    }
}
