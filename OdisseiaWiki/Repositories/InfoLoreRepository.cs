using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Data;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace OdisseiaWiki.Repositories
{
    public class InfoLoreRepository : IInfoLoreRepository
    {
        private readonly OdisseiaContext _context;

        public InfoLoreRepository(OdisseiaContext context)
        {
            _context = context;
        }

        public async Task<List<Infolore>> GetAllAsync(bool? visivel = null)
        {
            var query = _context.Infolores.AsNoTracking();

            if (visivel.HasValue)
                query = query.Where(i => i.Visivel == visivel.Value);

            return await query.ToListAsync();
        }

        public async Task<Infolore?> GetByIdAsync(int id)
            => await _context.Infolores.FindAsync(id);

        public async Task<Infolore> CreateAsync(Infolore infoLore)
        {
            _context.Infolores.Add(infoLore);
            await _context.SaveChangesAsync();
            return infoLore;
        }

        public async Task<Infolore> UpdateAsync(Infolore infoLore)
        {
            _context.Infolores.Update(infoLore);
            await _context.SaveChangesAsync();
            return infoLore;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var infoLore = await _context.Infolores.FindAsync(id);
            if (infoLore == null) return false;

            _context.Infolores.Remove(infoLore);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<Infolore>> SearchAsync(string termo)
        {
            var termoLower = termo.ToLower();
            
            return await _context.Infolores
                .AsNoTracking()
                .Where(i => 
                    i.Titulo.ToLower().Contains(termoLower) ||
                    (i.Tags != null && i.Tags.ToLower().Contains(termoLower)))
                .ToListAsync();
        }
    }
}