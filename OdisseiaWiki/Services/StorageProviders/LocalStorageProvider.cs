using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Services.Interfaces;
using System;
using System.IO;
using System.Threading.Tasks;

namespace OdisseiaWiki.Services.StorageProviders
{
    public class LocalStorageProvider : ILocalStorageProvider
    {
        private readonly IWebHostEnvironment _env;
        private const string BaseFolder = "assets_dynamic";

        public LocalStorageProvider(IWebHostEnvironment env)
        {
            _env = env;
        }

        public async Task<ResultSaveImage> SaveAsync(IFormFile file, string subFolder)
        {
            try
            {
                // subFolder esperado: "{type}/{safeEntity}/{optionalFolder}"
                string basePath = Path.Combine(_env.WebRootPath, BaseFolder, subFolder);

                if (!Directory.Exists(basePath))
                    Directory.CreateDirectory(basePath);

                string fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
                string fullPath = Path.Combine(basePath, fileName);

                await using (var stream = new FileStream(fullPath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                string relativePath = Path.Combine(BaseFolder, subFolder, fileName).Replace("\\", "/");
                return ResultSaveImage.Ok(relativePath);
            }
            catch (Exception ex)
            {
                return ResultSaveImage.Fail($"Erro ao salvar localmente: {ex.Message}");
            }
        }
    }
}