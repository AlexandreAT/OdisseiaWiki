using OdisseiaWiki.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace OdisseiaWiki.Repositories.Interfaces
{
    public interface ICidadeRepository
    {
        Task<List<Cidade>> GetAllAsync(bool? visivel = null, int? idWikiEscopo = null);
        Task<Cidade?> GetByIdAsync(int id, int? idWikiEscopo = null);
        Task<Cidade> CreateAsync(Cidade cidade);
        Task<Cidade> UpdateAsync(Cidade cidade);
        Task<bool> DeleteAsync(int id);
        Task<List<Cidade>> SearchAsync(string termo, int? idWikiEscopo = null);
        Task<List<Cidade>> GetBatchAsync(List<int> ids, int? idWikiEscopo = null);
    }
}
