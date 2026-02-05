using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace OdisseiaWiki.Services.Interfaces
{
    public interface ICidadeService
    {
        Task<ResultCidade> GetAllAsync(bool? visivel = null);
        Task<Cidade?> GetByIdAsync(int id);
        Task<ResultCidade> CreateAsync(CidadeDto dto);
        Task<ResultCidade> UpdateAsync(int id, CidadeDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
