using OdisseiaWiki.Dtos;
using System.Threading.Tasks;

namespace OdisseiaWiki.Services.Interfaces
{
    public interface IRacaService
    {
        Task<ResultRaca> GetAllAsync(bool? visivel = null, int? idMesa = null);
        Task<RacaDto?> GetByIdAsync(int id, int? idMesa = null);
        Task<ResultRaca> CreateAsync(RacaDto dto);
        Task<ResultRaca> UpdateAsync(int id, RacaDto dto);
        Task<bool> DeleteAsync(int id);
        Task<List<RacaDto>> GetBatchAsync(List<int> ids);
    }
}
