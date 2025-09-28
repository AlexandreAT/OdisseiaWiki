using OdisseiaWiki.Dtos;

namespace OdisseiaWiki.Services.Interfaces
{
    public interface IAssetService
    {
        Task<ResultSaveImage> SaveImageAsync(IFormFile file, string type, string entityName, string? folderName = null);
    }
}
