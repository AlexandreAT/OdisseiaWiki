using OdisseiaWiki.Models;

namespace OdisseiaWiki.Repositories.Interfaces
{
    public interface IMesaRepository
    {
        Task<List<Mesa>> GetAllAsync();
        Task<Mesa?> GetByIdAsync(int id);
        Task<List<Mesa>> GetByUsuarioIdAsync(int usuarioId);
        Task<Mesa> CreateAsync(Mesa mesa);
        Task<Mesa> UpdateAsync(Mesa mesa);
        Task<bool> DeleteAsync(int id);
    }
}