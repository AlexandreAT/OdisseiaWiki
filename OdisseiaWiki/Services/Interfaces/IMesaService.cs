using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;

namespace OdisseiaWiki.Services.Interfaces
{
    public interface IMesaService
    {
        Task<ResultMesa> CreateAsync(MesaDto dto);
        Task<List<Mesa>> GetAllAsync();
    }
}
