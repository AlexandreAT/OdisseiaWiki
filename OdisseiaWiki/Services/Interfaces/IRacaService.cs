using OdisseiaWiki.Dtos;
using System.Threading.Tasks;

namespace OdisseiaWiki.Services.Interfaces
{
    public interface IRacaService
    {
        Task<ResultRaca> GetAllAsync(bool? visivel = null);
        Task<RacaDto?> GetByIdAsync(int id);
        Task<ResultRaca> CreateAsync(RacaDto dto);
        Task<ResultRaca> UpdateAsync(int id, RacaDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
