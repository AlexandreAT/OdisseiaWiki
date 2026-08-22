using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Data;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;

namespace OdisseiaWiki.Repositories;

public class PersonagemVisibilidadeRepository : IPersonagemVisibilidadeRepository
{
    private readonly OdisseiaContext _context;

    public PersonagemVisibilidadeRepository(OdisseiaContext context) => _context = context;

    public Task<bool> NpcExistsAsync(int idPersonagem) => _context.Personagens
        .AsNoTracking()
        .AnyAsync(personagem => personagem.Idpersonagem == idPersonagem);

    public Task<int?> GetPersonagemJogadorOwnerIdAsync(int idPersonagemJogador) => _context.PersonagemJogadores
        .AsNoTracking()
        .Where(personagem => personagem.IdpersonagemJogador == idPersonagemJogador)
        .Select(personagem => (int?)personagem.Idusuario)
        .FirstOrDefaultAsync();

    public Task<PersonagemVisibilidade?> GetByPersonagemIdAsync(int idPersonagem) => _context.PersonagensVisibilidade
        .FirstOrDefaultAsync(configuracao => configuracao.Idpersonagem == idPersonagem);

    public Task<PersonagemVisibilidade?> GetByPersonagemJogadorIdAsync(int idPersonagemJogador) => _context.PersonagensVisibilidade
        .FirstOrDefaultAsync(configuracao => configuracao.IdpersonagemJogador == idPersonagemJogador);

    public async Task<PersonagemVisibilidade> CreateAsync(PersonagemVisibilidade configuracao)
    {
        _context.PersonagensVisibilidade.Add(configuracao);
        await _context.SaveChangesAsync();
        return configuracao;
    }

    public async Task<PersonagemVisibilidade> UpdateAsync(PersonagemVisibilidade configuracao)
    {
        _context.PersonagensVisibilidade.Update(configuracao);
        await _context.SaveChangesAsync();
        return configuracao;
    }
}
