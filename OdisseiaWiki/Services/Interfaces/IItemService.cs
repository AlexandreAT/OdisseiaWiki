using OdisseiaWiki.Dtos;

namespace OdisseiaWiki.Services.Interfaces
{
    public interface IItemService
    {
        Task<IEnumerable<ItemDto>> GetAllAsync();
        Task<ItemDto?> GetByIdAsync(string id);
        Task<string> CreateAsync(ItemCreateDto dto);
        Task<bool> UpdateAsync(ItemUpdateDto dto);
        Task<bool> DeleteAsync(string id);
    }
}
