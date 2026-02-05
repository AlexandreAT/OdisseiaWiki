using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Data;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace OdisseiaWiki.Repositories
{
    public class PersonagemRepository : IPersonagemRepository
    {
        private readonly OdisseiaContext _context;

        public PersonagemRepository(OdisseiaContext context)
        {
            _context = context;
        }

        public async Task<List<Personagen>> GetAllAsync(bool? visivel = null)
        {
            var query = _context.Personagens.AsNoTracking();

            if (visivel.HasValue)
                query = query.Where(p => p.Visivel == visivel.Value);

            return await query.ToListAsync();
        }

        public async Task<Personagen?> GetByIdAsync(int id)
            => await _context.Personagens.FindAsync(id);

        public async Task<Personagen> CreateAsync(Personagen personagem)
        {
            _context.Personagens.Add(personagem);
            await _context.SaveChangesAsync();
            return personagem;
        }

        public async Task<Personagen> UpdateAsync(Personagen personagem)
        {
            _context.Personagens.Update(personagem);
            await _context.SaveChangesAsync();
            return personagem;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var personagem = await _context.Personagens.FindAsync(id);
            if (personagem == null) return false;

            _context.Personagens.Remove(personagem);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
