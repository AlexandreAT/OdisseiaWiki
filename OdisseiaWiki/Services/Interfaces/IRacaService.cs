using OdisseiaWiki.Dtos;
using System.Threading.Tasks;

namespace OdisseiaWiki.Services.Interfaces
{
    public interface IRacaService
    {
        Task<ResultRaca> GetAllAsync(bool? visivel = null, int? idMesa = null, int? idWikiEscopo = null);
        Task<RacaDto?> GetByIdAsync(int id, int? idMesa = null, int? idWikiEscopo = null);
        Task<ResultRaca> CreateAsync(RacaDto dto, int? idWikiEscopo = null);
        Task<ResultRaca> UpdateAsync(int id, RacaDto dto, int? idWikiEscopo = null);
        Task<bool> DeleteAsync(int id, int? idWikiEscopo = null);
        Task<List<RacaDto>> GetBatchAsync(List<int> ids, int? idWikiEscopo = null);
    }
}
