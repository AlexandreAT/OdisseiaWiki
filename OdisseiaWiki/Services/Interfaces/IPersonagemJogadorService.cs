using OdisseiaWiki.Dtos;

namespace OdisseiaWiki.Services.Interfaces
{
    public interface IPersonagemJogadorService
    {
        Task<ResultPersonagemJogador> CreateAsync(PersonagemJogadorDto dto);
        Task<List<PersonagemJogadorDto>> GetAllAsync();
        Task<List<PersonagemJogadorDto>> GetByUsuarioIdAsync(int id);
        Task<PersonagemJogadorDto?> GetByIdAsync(int id);
        Task<ResultPersonagemJogador> UpdateAsync(int id, PersonagemJogadorDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
