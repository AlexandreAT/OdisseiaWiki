using OdisseiaWiki.Dtos;

namespace OdisseiaWiki.Services.Interfaces
{
    public interface IRacaService
    {
        Task<ResultRaca> GetAllAsync();
    }
}
