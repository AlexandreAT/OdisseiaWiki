using OdisseiaWiki.Models;

namespace OdisseiaWiki.Repositories.Interfaces
{
    public interface IRacaRepository
    {
        Task<List<Raca>> GetAllAsync();
    }
}
