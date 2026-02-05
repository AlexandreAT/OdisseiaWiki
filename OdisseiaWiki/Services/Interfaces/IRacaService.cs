using OdisseiaWiki.Dtos;
using System.Threading.Tasks;

namespace OdisseiaWiki.Services.Interfaces
{
    public interface IRacaService
    {
        Task<ResultRaca> GetAllAsync(bool? visivel = null);
    }
}
