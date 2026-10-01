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
    public class ItemRepository : IItemRepository
    {
        private readonly OdisseiaContext _context;

        public ItemRepository(OdisseiaContext context)
        {
            _context = context;
        }

        public async Task<List<Item>> GetAllAsync(bool? visivel = null, int? idWikiEscopo = null)
        {
            var query = _context.Itens.AsNoTracking()
                .Where(item => item.IdWikiEscopo == (idWikiEscopo ?? WikiEscopo.IdOficial));

            if (visivel.HasValue)
                query = query.Where(i => i.Visivel == visivel.Value);

            return await query.ToListAsync();
        }

        public Task<Item?> GetByIdAsync(string id) => GetByIdAsync(id, null);

        public async Task<Item?> GetByIdAsync(string id, int? idWikiEscopo)
            => await _context.Itens.FirstOrDefaultAsync(item => item.Iditem == id &&
                item.IdWikiEscopo == (idWikiEscopo ?? WikiEscopo.IdOficial));

        public async Task AddAsync(Item item)
        {
            _context.Itens.Add(item);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Item item)
        {
            _context.Itens.Update(item);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(string id)
        {
            var item = await GetByIdAsync(id);
            if (item != null)
            {
                _context.Itens.Remove(item);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<List<Item>> SearchAsync(string termo, int? idWikiEscopo = null)
        {
            var termoLower = termo.ToLower();

            var itens = await _context.Itens
                .AsNoTracking()
                .Where(item => item.IdWikiEscopo == (idWikiEscopo ?? WikiEscopo.IdOficial))
                .ToListAsync();

            return itens.Where(i =>
                i.Nome.ToLower().Contains(termoLower) ||
                (JsonSafeHelper.DeserializeTags(i.Tags)?
                    .Any(tag => tag.ToLower().Contains(termoLower)) ?? false)
            ).ToList();
        }

        public async Task<List<Item>> GetBatchAsync(List<string> ids, int? idWikiEscopo = null)
        {
            return await _context.Itens
                .AsNoTracking()
                .Where(i => ids.Contains(i.Iditem) &&
                    i.IdWikiEscopo == (idWikiEscopo ?? WikiEscopo.IdOficial))
                .ToListAsync();
        }
    }
}
