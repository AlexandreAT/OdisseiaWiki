using OdisseiaWiki.Models;

namespace OdisseiaWiki.Repositories.Interfaces
{
    public interface ICidadeRepository
    {
        Task<List<Cidade>> GetAllAsync();
    }
}
