using OdisseiaWiki.Models;

namespace OdisseiaWiki.Repositories.Interfaces
{
    public interface IPersonagemJogadorRepository
    {
        Task<List<PersonagemJogador>> GetAllAsync();
        Task<List<PersonagemJogador>> GetByIdsAsync(IEnumerable<int> ids);
        Task<PersonagemJogador?> GetByIdAsync(int id);
        Task<PersonagemJogador?> GetByIdWithDetailsAsync(int id);
        Task<List<PersonagemJogador>> GetByUsuarioIdAsync(int usuarioId);
        Task<Dictionary<int, List<Proficiencia>>> GetProficienciasByPersonagemIdsAsync(IEnumerable<int> personagemIds);
        Task<PersonagemJogador> CreateAsync(PersonagemJogador personagem);
        Task<PersonagemJogador> UpdateAsync(PersonagemJogador personagem);
        Task<bool> DeleteAsync(int id);
        Task<int> DeleteManyAsync(IEnumerable<int> ids);
    }
}
