using OdisseiaWiki.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace OdisseiaWiki.Repositories.Interfaces
{
    public interface ICidadeRepository
    {
        Task<List<Cidade>> GetAllAsync(bool? visivel = null);
        Task<Cidade?> GetByIdAsync(int id);
        Task<Cidade> CreateAsync(Cidade cidade);
        Task<Cidade> UpdateAsync(Cidade cidade);
        Task<bool> DeleteAsync(int id);
    }
}
