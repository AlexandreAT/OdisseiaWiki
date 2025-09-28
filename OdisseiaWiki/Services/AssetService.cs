using OdisseiaWiki.Dtos;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Services
{
    public class AssetService : IAssetService
    {
        private readonly IWebHostEnvironment _env;

        public AssetService(IWebHostEnvironment env)
        {
            _env = env;
        }

        public async Task<ResultSaveImage> SaveImageAsync(IFormFile file, string type, string entityName, string? folderName = null)
        {
            try
            {
                // Normaliza nome da entidade (sem espaços, minúsculo)
                string safeEntity = entityName.ToLower().Replace(" ", "-");

                // Cria a base do caminho físico
                string basePath = Path.Combine(_env.WebRootPath, "assets_dynamic", type, safeEntity);

                if (!string.IsNullOrEmpty(folderName))
                    basePath = Path.Combine(basePath, folderName);

                // Se não existir, cria as pastas
                if (!Directory.Exists(basePath))
                    Directory.CreateDirectory(basePath);

                // Gera nome único
                string fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
                string fullPath = Path.Combine(basePath, fileName);

                // Salva no disco
                using (var stream = new FileStream(fullPath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Caminho relativo que será salvo no banco
                string relativePath = Path.Combine("assets_dynamic", type, safeEntity, folderName ?? "", fileName)
                    .Replace("\\", "/");

                return ResultSaveImage.Ok(relativePath);
            }
            catch (Exception ex)
            {
                return ResultSaveImage.Fail($"Erro ao salvar imagem: {ex.Message}");
            }
        }
    }
}
