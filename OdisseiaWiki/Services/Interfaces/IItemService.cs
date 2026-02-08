using OdisseiaWiki.Dtos;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace OdisseiaWiki.Services.Interfaces
{
    public interface IItemService
    {
        Task<IEnumerable<ItemDto>> GetAllAsync(bool? visivel = null);
        Task<ItemDto?> GetByIdAsync(string id);
        Task<string> CreateAsync(ItemCreateDto dto);
        Task<bool> UpdateAsync(ItemUpdateDto dto);
        Task<bool> DeleteAsync(string id);
    }
}
