using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Data;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;

namespace OdisseiaWiki.Repositories
{
    public class RacaRepository : IRacaRepository
    {
        private readonly OdisseiaContext _context;

        public RacaRepository(OdisseiaContext context)
        {
            _context = context;
        }

        public async Task<List<Raca>> GetAllAsync()
            => await _context.Racas.AsNoTracking().ToListAsync();
    }
}
