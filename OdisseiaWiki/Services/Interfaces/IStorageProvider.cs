using OdisseiaWiki.Dtos;
using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace OdisseiaWiki.Services.Interfaces
{
    public interface IStorageProvider
    {
        Task<ResultSaveImage> SaveAsync(
            IFormFile file,
            string subFolder,
            string? publicId = null,
            CancellationToken cancellationToken = default);

        Task<bool> DeleteAsync(string assetIdentifier, CancellationToken cancellationToken = default);
    }
}
