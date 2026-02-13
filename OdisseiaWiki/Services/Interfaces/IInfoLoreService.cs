using OdisseiaWiki.Dtos;
using System.Threading.Tasks;

namespace OdisseiaWiki.Services.Interfaces
{
    public interface IInfoLoreService
    {
        Task<ResultInfoLore> GetAllAsync(bool? visivel = null);
        Task<InfoLoreDto?> GetByIdAsync(int id);
        Task<ResultInfoLore> CreateAsync(InfoLoreDto dto);
        Task<ResultInfoLore> UpdateAsync(int id, InfoLoreDto dto);
        Task<bool> DeleteAsync(int id);
        Task<GlobalSearchResultDto> SearchGlobalAsync(string termo);
    }
}