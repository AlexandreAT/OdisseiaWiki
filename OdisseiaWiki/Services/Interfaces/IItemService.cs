using OdisseiaWiki.Dtos;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace OdisseiaWiki.Services.Interfaces
{
    public interface IItemService
    {
        Task<IEnumerable<ItemDto>> GetAllAsync(bool? visivel = null, int? idWikiEscopo = null);
        Task<ItemDto?> GetByIdAsync(string id, int? idWikiEscopo = null);
        Task<string> CreateAsync(ItemCreateDto dto, int? idWikiEscopo = null);
        Task<ItemSaveResultDto> CreateWithRuntimeAsync(ItemCreateDto dto, int? idWikiEscopo = null);
        Task<bool> UpdateAsync(ItemUpdateDto dto, int? idWikiEscopo = null);
        Task<ItemSaveResultDto?> UpdateWithRuntimeAsync(ItemUpdateDto dto, int? idWikiEscopo = null);
        Task<bool> DeleteAsync(string id, int? idWikiEscopo = null);
        Task<List<ItemDto>> GetBatchAsync(List<string> ids, int? idWikiEscopo = null);
        Task<ItemDto> SanitizarReferenciasPublicasAsync(ItemDto item);
    }
}
