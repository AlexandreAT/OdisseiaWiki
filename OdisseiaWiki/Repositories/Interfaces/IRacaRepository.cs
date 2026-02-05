using OdisseiaWiki.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace OdisseiaWiki.Repositories.Interfaces
{
    public interface IRacaRepository
    {
        Task<List<Raca>> GetAllAsync(bool? visivel = null);
    }
}
