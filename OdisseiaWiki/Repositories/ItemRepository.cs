using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Data;
using OdisseiaWiki.Repositories.Interfaces;

namespace OdisseiaWiki.Repositories
{
    public class ItemRepository : IItemRepository
    {
        private readonly OdisseiaContext _context;

        public ItemRepository(OdisseiaContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Item>> GetAllAsync() =>
            await _context.Itens.AsNoTracking().ToListAsync();

        public async Task<Item?> GetByIdAsync(string id) =>
            await _context.Itens.FirstOrDefaultAsync(i => i.Iditem == id);

        public async Task AddAsync(Item item)
        {
            await _context.Itens.AddAsync(item);
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
            if (item is null) return;
            _context.Itens.Remove(item);
            await _context.SaveChangesAsync();
        }
    }
}
