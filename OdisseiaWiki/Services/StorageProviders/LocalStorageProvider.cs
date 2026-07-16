using OdisseiaWiki.Dtos;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Services.StorageProviders;

public class LocalStorageProvider : ILocalStorageProvider
{
    private const string BaseFolder = "assets_dynamic";
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<LocalStorageProvider> _logger;

    public LocalStorageProvider(
        IWebHostEnvironment environment,
        ILogger<LocalStorageProvider> logger)
    {
        _environment = environment;
        _logger = logger;
    }

    public async Task<ResultSaveImage> SaveAsync(
        IFormFile file,
        string subFolder,
        string? publicId = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            string webRoot = _environment.WebRootPath
                ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
            string storageRoot = Path.GetFullPath(Path.Combine(webRoot, BaseFolder));
            string targetDirectory = Path.GetFullPath(Path.Combine(storageRoot, subFolder));
            string requiredPrefix = storageRoot.TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;

            if (!targetDirectory.StartsWith(requiredPrefix, StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning("Tentativa de upload fora do diretório permitido: {SubFolder}", subFolder);
                return ResultSaveImage.Fail("Destino do arquivo inválido.");
            }

            Directory.CreateDirectory(targetDirectory);

            string extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            string fileName = $"{Guid.NewGuid():N}{extension}";
            string fullPath = Path.Combine(targetDirectory, fileName);

            await using FileStream stream = new(
                fullPath,
                FileMode.CreateNew,
                FileAccess.Write,
                FileShare.None,
                bufferSize: 81920,
                useAsync: true);
            await file.CopyToAsync(stream, cancellationToken);

            string relativePath = Path.Combine(BaseFolder, subFolder, fileName).Replace("\\", "/");
            return ResultSaveImage.Ok(relativePath, "local", relativePath);
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Falha ao salvar imagem no armazenamento local.");
            return ResultSaveImage.Fail("Não foi possível salvar a imagem.");
        }
    }

    public Task<bool> DeleteAsync(
        string assetIdentifier,
        CancellationToken cancellationToken = default)
    {
        try
        {
            string normalized = assetIdentifier.TrimStart('/', '\\').Replace('/', Path.DirectorySeparatorChar);
            string webRoot = _environment.WebRootPath
                ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
            string storageRoot = Path.GetFullPath(Path.Combine(webRoot, BaseFolder));
            string fullPath = Path.GetFullPath(Path.Combine(webRoot, normalized));
            string requiredPrefix = storageRoot.TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;

            if (!fullPath.StartsWith(requiredPrefix, StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning("Exclusão local ignorada fora do diretório permitido.");
                return Task.FromResult(false);
            }

            if (File.Exists(fullPath))
                File.Delete(fullPath);

            return Task.FromResult(true);
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Falha ao excluir imagem do armazenamento local.");
            return Task.FromResult(false);
        }
    }
}
