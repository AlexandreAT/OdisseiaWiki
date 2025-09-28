using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Data;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;

namespace OdisseiaWiki.Repositories
{
    public class CidadeRepository : ICidadeRepository
    {
        private readonly OdisseiaContext _context;

        public CidadeRepository(OdisseiaContext context)
        {
            _context = context;
        }

        public async Task<List<Cidade>> GetAllAsync()
            => await _context.Cidades.AsNoTracking().ToListAsync();
    }
}
