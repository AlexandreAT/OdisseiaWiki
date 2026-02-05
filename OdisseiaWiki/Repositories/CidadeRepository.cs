using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Data;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace OdisseiaWiki.Repositories
{
    public class CidadeRepository : ICidadeRepository
    {
        private readonly OdisseiaContext _context;

        public CidadeRepository(OdisseiaContext context)
        {
            _context = context;
        }

        public async Task<List<Cidade>> GetAllAsync(bool? visivel = null)
        {
            var query = _context.Cidades.AsNoTracking();

            if (visivel.HasValue)
                query = query.Where(c => c.Visivel == visivel.Value);

            return await query.ToListAsync();
        }

        public async Task<Cidade?> GetByIdAsync(int id)
            => await _context.Cidades.FindAsync(id);

        public async Task<Cidade> CreateAsync(Cidade cidade)
        {
            _context.Cidades.Add(cidade);
            await _context.SaveChangesAsync();
            return cidade;
        }

        public async Task<Cidade> UpdateAsync(Cidade cidade)
        {
            _context.Cidades.Update(cidade);
            await _context.SaveChangesAsync();
            return cidade;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            Cidade? cidade = await _context.Cidades.FindAsync(id);
            if (cidade == null) return false;

            _context.Cidades.Remove(cidade);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
