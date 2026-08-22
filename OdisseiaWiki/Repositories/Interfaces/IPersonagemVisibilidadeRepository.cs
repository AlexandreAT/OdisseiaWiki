using OdisseiaWiki.Models;

namespace OdisseiaWiki.Repositories.Interfaces;

public interface IPersonagemVisibilidadeRepository
{
    Task<bool> NpcExistsAsync(int idPersonagem);
    Task<int?> GetPersonagemJogadorOwnerIdAsync(int idPersonagemJogador);
    Task<PersonagemVisibilidade?> GetByPersonagemIdAsync(int idPersonagem);
    Task<PersonagemVisibilidade?> GetByPersonagemJogadorIdAsync(int idPersonagemJogador);
    Task<PersonagemVisibilidade> CreateAsync(PersonagemVisibilidade configuracao);
    Task<PersonagemVisibilidade> UpdateAsync(PersonagemVisibilidade configuracao);
}
