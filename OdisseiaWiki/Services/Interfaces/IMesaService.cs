using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;

namespace OdisseiaWiki.Services.Interfaces
{
    public interface IMesaService
    {
        Task<ResultMesa> CreateAsync(MesaDto dto);
        Task<List<Mesa>> GetAllAsync();
        Task<Mesa> ObterMesaPadraoAsync();
        Task<ResultMesa> UpdateAsync(int id, MesaDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
