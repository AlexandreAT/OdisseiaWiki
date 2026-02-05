using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Data;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace OdisseiaWiki.Repositories
{
    public class RacaRepository : IRacaRepository
    {
        private readonly OdisseiaContext _context;

        public RacaRepository(OdisseiaContext context)
        {
            _context = context;
        }

        public async Task<List<Raca>> GetAllAsync(bool? visivel = null)
        {
            var query = _context.Racas.AsNoTracking();

            if (visivel.HasValue)
                query = query.Where(r => r.Visivel == visivel.Value);

            return await query.ToListAsync();
        }
    }
}
