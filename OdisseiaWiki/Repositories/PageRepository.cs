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

        public async Task<List<Page>> SearchAsync(string termo, int? idWikiEscopo = null)
        {
            string normalizedTerm = termo.Trim().ToLowerInvariant();

            if (normalizedTerm.Length == 0)
                return new List<Page>();

            return await _context.Pages
                .AsNoTracking()
                .Where(page => page.IdWikiEscopo == (idWikiEscopo ?? WikiEscopo.IdOficial))
                .Where(p =>
                    p.Titulo.ToLower().Contains(normalizedTerm) ||
                    p.Slug.ToLower().Contains(normalizedTerm)
                )
                .OrderBy(p => p.Titulo)
                .ToListAsync();
        }

        public async Task<Page?> GetByIdAsync(int id, int? idWikiEscopo = null)
            => await _context.Pages
                .Include(p => p.Blocks.OrderBy(b => b.Ordem))
                .FirstOrDefaultAsync(p => p.IdPage == id &&
                    p.IdWikiEscopo == (idWikiEscopo ?? WikiEscopo.IdOficial));

        public Task<bool> ExistsVisibleAsync(int id, int? idWikiEscopo = null)
            => _context.Pages
                .AsNoTracking()
                .AnyAsync(page => page.IdPage == id && page.Visivel &&
                    page.IdWikiEscopo == (idWikiEscopo ?? WikiEscopo.IdOficial));

        public async Task<Page?> GetBySlugAsync(string slug, int? idWikiEscopo = null)
            => await _context.Pages
                .Include(p => p.Blocks.OrderBy(b => b.Ordem))
                .FirstOrDefaultAsync(p => p.Slug == slug &&
                    p.IdWikiEscopo == (idWikiEscopo ?? WikiEscopo.IdOficial));

        public async Task<List<Page>> GetAllAsync(bool? visivel = null, int? idWikiEscopo = null)
        {
            IQueryable<Page> query = _context.Pages.AsNoTracking()
                .Where(page => page.IdWikiEscopo == (idWikiEscopo ?? WikiEscopo.IdOficial));

            if (visivel.HasValue)
                query = query.Where(p => p.Visivel == visivel.Value);

            return await query.ToListAsync();
        }

        public async Task<List<Page>> GetWithRelationBlocksAsync(bool? visivel = null, int? idWikiEscopo = null)
        {
            IQueryable<Page> query = _context.Pages
                .AsNoTracking()
                .Include(page => page.Blocks.Where(block => block.Tipo == PageBlockType.Relation))
                .Where(page => page.IdWikiEscopo == (idWikiEscopo ?? WikiEscopo.IdOficial));

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
