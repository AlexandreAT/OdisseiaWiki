using OdisseiaWiki.Dtos;

namespace OdisseiaWiki.Services.Interfaces
{
    public interface IPersonagemJogadorService
    {
        Task<ResultPersonagemJogador> CreateAsync(PersonagemJogadorDto dto);
        Task<List<PersonagemJogadorDto>> GetAllAsync();
        Task<List<PersonagemJogadorDto>> GetByIdsAsync(IReadOnlyCollection<int> ids);
        Task<List<PersonagemJogadorDto>> GetByUsuarioIdAsync(int id);
        Task<List<PersonagemJogadorDto>> GetByMesaIdAsync(int idMesa);
        Task<PersonagemJogadorDto?> GetByIdAsync(int id);
        Task<bool?> AtualizarVisivelAsync(int id, bool visivel);
        Task<ResultPersonagemJogador> AtualizarRecursosAsync(int id, AtualizarRecursosPersonagemDto dto);
        Task<ResultPersonagemJogador> UpdateAsync(int id, PersonagemJogadorDto dto);
        Task<ResultPersonagemJogador> AtualizarSistemaAsync(int id);
        Task<bool> DeleteAsync(int id);
        Task<int> DeleteManyAsync(IReadOnlyCollection<int> ids);
    }
}
