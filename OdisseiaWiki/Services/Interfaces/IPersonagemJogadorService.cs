using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;

namespace OdisseiaWiki.Services.Interfaces
{
    public interface IPersonagemJogadorService
    {
        Task<ResultPersonagemJogador> CreateAsync(PersonagemJogadorDto dto);
        Task<List<PersonagemJogador>> GetAllAsync();
        Task<List<PersonagemJogador>> GetByUsuarioIdAsync(int id);
        Task<PersonagemJogador?> GetByIdAsync(int id);
        Task<ResultPersonagemJogador> UpdateAsync(int id, PersonagemJogadorDto dto);
        Task<bool> DeleteAsync(int id);
    }
}