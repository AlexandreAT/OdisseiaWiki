using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace OdisseiaWiki.Services.Interfaces
{
    public interface ICidadeService
    {
        Task<ResultCidade> GetAllAsync(bool? visivel = null, int? idWikiEscopo = null);
        Task<CidadeDto?> GetByIdAsync(int id, int? idWikiEscopo = null);
        Task<ResultCidade> CreateAsync(CidadeDto dto, int? idWikiEscopo = null, int? idSistemaRpg = null);
        Task<ResultCidade> UpdateAsync(int id, CidadeDto dto, int? idWikiEscopo = null);
        Task<bool> DeleteAsync(int id, int? idWikiEscopo = null);
        Task<List<CidadeDto>> GetBatchAsync(List<int> ids, int? idWikiEscopo = null);
    }
}
