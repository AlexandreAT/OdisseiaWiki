using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Data;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Helpers;
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

        public async Task<List<Cidade>> GetAllAsync(bool? visivel = null, int? idWikiEscopo = null)
        {
            var query = _context.Cidades.AsNoTracking()
                .Where(cidade => cidade.IdWikiEscopo == (idWikiEscopo ?? WikiEscopo.IdOficial));

            if (visivel.HasValue)
                query = query.Where(c => c.Visivel == visivel.Value);

            return await query.ToListAsync();
        }

        public async Task<Cidade?> GetByIdAsync(int id, int? idWikiEscopo = null)
            => await _context.Cidades.FirstOrDefaultAsync(cidade =>
                cidade.Idcidade == id &&
                cidade.IdWikiEscopo == (idWikiEscopo ?? WikiEscopo.IdOficial));

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

        public async Task<List<Cidade>> SearchAsync(string termo, int? idWikiEscopo = null)
        {
            var termoLower = termo.ToLower();

            var cidades = await _context.Cidades
                .AsNoTracking()
                .Where(cidade => cidade.IdWikiEscopo == (idWikiEscopo ?? WikiEscopo.IdOficial))
                .ToListAsync();

            return cidades.Where(i =>
                i.Nome.ToLower().Contains(termoLower) ||
                (JsonSafeHelper.DeserializeTags(i.Tags)?
                    .Any(tag => tag.ToLower().Contains(termoLower)) ?? false)
            ).ToList();
        }

        public async Task<List<Cidade>> GetBatchAsync(List<int> ids, int? idWikiEscopo = null)
        {
            return await _context.Cidades
                .AsNoTracking()
                .Where(c => ids.Contains(c.Idcidade) &&
                    c.IdWikiEscopo == (idWikiEscopo ?? WikiEscopo.IdOficial))
                .ToListAsync();
        }
    }
}
