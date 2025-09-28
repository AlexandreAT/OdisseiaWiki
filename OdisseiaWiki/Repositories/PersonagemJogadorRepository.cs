using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Data;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;

namespace OdisseiaWiki.Repositories
{
    public class PersonagemJogadorRepository : IPersonagemJogadorRepository
    {
        private readonly OdisseiaContext _context;

        public PersonagemJogadorRepository(OdisseiaContext context)
        {
            _context = context;
        }

        public async Task<List<PersonagemJogador>> GetAllAsync()
            => await _context.PersonagemJogadores
                .AsNoTracking()
                .ToListAsync();

        public async Task<PersonagemJogador?> GetByIdAsync(int id) => await _context.PersonagemJogadores.FindAsync(id);

        public async Task<List<PersonagemJogador>> GetByUsuarioIdAsync(int usuarioId)
        {
            return await _context.PersonagemJogadores
                .AsNoTracking()
                .Where(p => p.Idusuario == usuarioId)
                .ToListAsync();
        }


        public async Task<PersonagemJogador> CreateAsync(PersonagemJogador personagem)
        {
            _context.PersonagemJogadores.Add(personagem);
            await _context.SaveChangesAsync();
            return personagem;
        }

        public async Task<PersonagemJogador> UpdateAsync(PersonagemJogador personagem)
        {
            _context.PersonagemJogadores.Update(personagem);
            await _context.SaveChangesAsync();
            return personagem;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            PersonagemJogador personagem = await _context.PersonagemJogadores.FindAsync(id);
            if (personagem == null) return false;

            _context.PersonagemJogadores.Remove(personagem);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}