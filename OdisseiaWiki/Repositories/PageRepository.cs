using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Data;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;

namespace OdisseiaWiki.Repositories
{
    public class PageRepository : IPageRepository
    {
        private readonly OdisseiaContext _context;

        public PageRepository(OdisseiaContext context)
        {
            _context = context;
        }

        public async Task<Page> CreateAsync(Page page)
        {
            _context.Pages.Add(page);

            await _context.SaveChangesAsync();

            return page;
        }

        public async Task<List<Page>> SearchAsync(string termo)
        {
            string normalizedTerm = termo.Trim().ToLowerInvariant();

            if (normalizedTerm.Length == 0)
                return new List<Page>();

            return await _context.Pages
                .AsNoTracking()
                .Where(p =>
                    p.Titulo.ToLower().Contains(normalizedTerm) ||
                    p.Slug.ToLower().Contains(normalizedTerm)
                )
                .OrderBy(p => p.Titulo)
                .ToListAsync();
        }

        public async Task<Page?> GetByIdAsync(int id)
            => await _context.Pages
                .Include(p => p.Blocks.OrderBy(b => b.Ordem))
                .FirstOrDefaultAsync(p => p.IdPage == id);

        public async Task<Page?> GetBySlugAsync(string slug)
            => await _context.Pages
                .Include(p => p.Blocks.OrderBy(b => b.Ordem))
                .FirstOrDefaultAsync(p => p.Slug == slug);

        public async Task<List<Page>> GetAllAsync(bool? visivel = null)
        {
            IQueryable<Page> query = _context.Pages.AsNoTracking();

            if (visivel.HasValue)
                query = query.Where(p => p.Visivel == visivel.Value);

            return await query.ToListAsync();
        }

        public async Task<List<Page>> GetWithRelationBlocksAsync(bool? visivel = null)
        {
            IQueryable<Page> query = _context.Pages
                .AsNoTracking()
                .Include(page => page.Blocks.Where(block => block.Tipo == PageBlockType.Relation));

            if (visivel.HasValue)
                query = query.Where(page => page.Visivel == visivel.Value);

            return await query.ToListAsync();
        }

        public async Task<Page> UpdateAsync(Page page)
        {
            _context.Pages.Update(page);

            await _context.SaveChangesAsync();

            return page;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            Page? page = await _context.Pages.FindAsync(id);

            if (page == null)
                return false;

            _context.Pages.Remove(page);

            await _context.SaveChangesAsync();

            return true;
        }
    }
}
