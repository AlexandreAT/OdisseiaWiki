using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Data;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;

namespace OdisseiaWiki.Repositories
{
    public class MesaRepository : IMesaRepository
    {
        private readonly OdisseiaContext _context;

        public MesaRepository(OdisseiaContext context)
        {
            _context = context;
        }

        public async Task<List<Mesa>> GetAllAsync()
            => await _context.Mesas
                .AsNoTracking()
                .ToListAsync();

        public async Task<Mesa?> GetByIdAsync(int id)
            => await _context.Mesas.FindAsync(id);

        public async Task<List<Mesa>> GetByUsuarioIdAsync(int usuarioId)
        {
            return await _context.Mesas
                .AsNoTracking()
                .Where(m => m.IdusuarioCriacao == usuarioId)
                .ToListAsync();
        }

        public async Task<Mesa> CreateAsync(Mesa mesa)
        {
            _context.Mesas.Add(mesa);
            await _context.SaveChangesAsync();
            return mesa;
        }

        public async Task<Mesa> UpdateAsync(Mesa mesa)
        {
            _context.Mesas.Update(mesa);
            await _context.SaveChangesAsync();
            return mesa;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var mesa = await _context.Mesas.FindAsync(id);
            if (mesa == null) return false;

            _context.Mesas.Remove(mesa);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}