using OdisseiaWiki.Dtos;
using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace OdisseiaWiki.Services.Interfaces
{
    public interface IStorageProvider
    {
        Task<ResultSaveImage> SaveAsync(IFormFile file, string subFolder);
    }
}