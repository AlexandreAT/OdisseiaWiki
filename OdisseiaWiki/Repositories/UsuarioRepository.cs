using OdisseiaWiki.Data;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace OdisseiaWiki.Repositories
{
    public class UsuarioRepository : IUsuarioRepository
    {
        private readonly OdisseiaContext _context;

        public UsuarioRepository(OdisseiaContext context)
        {
            _context = context;
        }

        public async Task<List<Usuario>> GetAllAsync()
        {
            return await _context.Usuarios.AsNoTracking().ToListAsync();
        }

        public async Task<Usuario> GetByIdAsync(int id)
        {
            return await _context.Usuarios.FindAsync(id);
        }

        public async Task<Usuario?> GetByEmailAsync(string email)
        {
            return await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<Usuario?> GetByNameAsync(string nome)
        {
            return await _context.Usuarios.FirstOrDefaultAsync(u => u.Nome == nome);
        }

        public async Task<Usuario?> GetByNicknameAsync(string nickname)
        {
            return await _context.Usuarios.FirstOrDefaultAsync(u => u.Nickname.ToLower() == nickname.ToLower());
        }

        public async Task<Usuario> CreateAsync(Usuario usuario)
        {
            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();
            return usuario;
        }

        public async Task<Usuario> UpdateAsync(Usuario usuario)
        {
            _context.Usuarios.Update(usuario);
            await _context.SaveChangesAsync();
            return usuario;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var usuario = await _context.Usuarios.FindAsync(id);
            if (usuario == null) return false;

            _context.Usuarios.Remove(usuario);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
