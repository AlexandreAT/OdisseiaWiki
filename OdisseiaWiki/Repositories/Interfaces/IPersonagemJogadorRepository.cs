using OdisseiaWiki.Models;

namespace OdisseiaWiki.Repositories.Interfaces
{
    public interface IPersonagemJogadorRepository
    {
        Task<List<PersonagemJogador>> GetAllAsync();
        Task<PersonagemJogador?> GetByIdAsync(int id);
        Task<List<PersonagemJogador>> GetByUsuarioIdAsync(int usuarioId);
        Task<PersonagemJogador> CreateAsync(PersonagemJogador personagem);
        Task<PersonagemJogador> UpdateAsync(PersonagemJogador personagem);
        Task<bool> DeleteAsync(int id);
    }
}