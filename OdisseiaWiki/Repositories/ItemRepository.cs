using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Data;
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

        public async Task<List<Item>> GetAllAsync(bool? visivel = null)
        {
            var query = _context.Itens.AsNoTracking();

            if (visivel.HasValue)
                query = query.Where(i => i.Visivel == visivel.Value);

            return await query.ToListAsync();
        }

        public async Task<Item?> GetByIdAsync(string id)
            => await _context.Itens.FindAsync(id);

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

        public async Task<List<Item>> SearchAsync(string termo)
        {
            var termoLower = termo.ToLower();

            var itens = await _context.Itens
                .AsNoTracking()
                .ToListAsync();

            return itens.Where(i =>
                i.Nome.ToLower().Contains(termoLower) ||
                (JsonSafeHelper.DeserializeTags(i.Tags)?
                    .Any(tag => tag.ToLower().Contains(termoLower)) ?? false)
            ).ToList();
        }
    }
}
