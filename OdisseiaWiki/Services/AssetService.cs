using System.Globalization;
using System.Text;
using Microsoft.Extensions.Options;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Services.Interfaces;
using OdisseiaWiki.Settings;
using OdisseiaWiki.Repositories.Interfaces;

namespace OdisseiaWiki.Services;

public class AssetService : IAssetService
{
    private static readonly IReadOnlyDictionary<string, string> AllowedFileTypes =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            [".jpg"] = "image/jpeg",
            [".jpeg"] = "image/jpeg",
            [".png"] = "image/png",
            [".gif"] = "image/gif",
            [".webp"] = "image/webp",
        };

    private static readonly HashSet<string> AllowedAssetTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "cidade",
        "cidades",
        "item",
        "itens",
        "mesa",
        "mesas",
        "pages",
        "pages/gallery",
        "pages/images",
        "perfil",
        "personagem",
        "personagens",
        "personagemjogador",
        "player",
        "raca",
        "racas",
    };

    private readonly ILocalStorageProvider _local;
    private readonly ICloudinaryStorageProvider _cloudinary;
    private readonly UploadSettings _settings;
    private readonly CloudinarySettings _cloudinarySettings;
    private readonly IWebHostEnvironment _environment;
    private readonly IAssetReferenceRepository _assetReferences;
    private readonly ILogger<AssetService> _logger;

    public AssetService(
        ILocalStorageProvider local,
        ICloudinaryStorageProvider cloudinary,
        IOptions<UploadSettings> options,
        IOptions<CloudinarySettings> cloudinaryOptions,
        IWebHostEnvironment environment,
        IAssetReferenceRepository assetReferences,
        ILogger<AssetService> logger)
    {
        _local = local;
        _cloudinary = cloudinary;
        _settings = options.Value;
        _cloudinarySettings = cloudinaryOptions.Value;
        _environment = environment;
        _assetReferences = assetReferences;
        _logger = logger;
    }

    public async Task<bool> DeleteIfUnreferencedAsync(
        string? assetUrl,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(assetUrl))
            return true;

        try
        {
            if (await _assetReferences.IsReferencedAsync(assetUrl, cancellationToken))
            {
                _logger.LogInformation("Asset não excluído porque ainda possui referências no banco.");
                return true;
            }

            if (_cloudinary.TryGetPublicId(assetUrl, out string publicId))
                return await _cloudinary.DeleteAsync(publicId, cancellationToken);

            if (_environment.IsDevelopment() &&
                (assetUrl.StartsWith("assets_dynamic/", StringComparison.OrdinalIgnoreCase) ||
                 assetUrl.StartsWith("/assets_dynamic/", StringComparison.OrdinalIgnoreCase)))
            {
                return await _local.DeleteAsync(assetUrl, cancellationToken);
            }

            // URLs externas antigas (incluindo ImgBB) permanecem válidas. Sem delete token
            // persistido não há uma exclusão remota segura a executar.
            return true;
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            // A atualização da entidade já foi confirmada antes desta limpeza.
            // Em caso de falha, preserva o arquivo e registra a pendência.
            _logger.LogError(
                exception,
                "Falha ao verificar ou excluir um asset removido. O arquivo foi preservado para evitar perda de dados.");
            return false;
        }
    }

    public async Task<ResultSaveImage> SaveImageAsync(
        IFormFile file,
        string type,
        string entityName,
        string? folderName = null)
    {
        ResultSaveImage? validationError = await ValidateFileAsync(file);
        if (validationError is not null)
            return validationError;

        if (!TryBuildSubFolder(type, entityName, folderName, out string subFolder))
            return ResultSaveImage.Fail("Destino do arquivo inválido.");

        bool useLocal = _environment.IsDevelopment() &&
            _cloudinarySettings.UseLocalStorageInDevelopment;

        return useLocal
            ? await _local.SaveAsync(file, subFolder)
            : await _cloudinary.SaveAsync(file, subFolder);
    }

    private async Task<ResultSaveImage?> ValidateFileAsync(IFormFile file)
    {
        if (file is null || file.Length == 0)
            return ResultSaveImage.Fail("Arquivo inválido.");

        if (file.Length > _settings.MaxFileSizeBytes)
            return ResultSaveImage.Fail(
                $"A imagem excede o limite de {_settings.MaxFileSizeBytes / (1024 * 1024)} MB.");

        string extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedFileTypes.TryGetValue(extension, out string? expectedMimeType))
            return ResultSaveImage.Fail("Formato não permitido. Use JPG, PNG, GIF ou WebP.");

        string submittedMimeType = file.ContentType.Split(';', 2)[0].Trim();
        if (!string.Equals(submittedMimeType, expectedMimeType, StringComparison.OrdinalIgnoreCase))
            return ResultSaveImage.Fail("O tipo do arquivo não corresponde à extensão informada.");

        if (!await HasValidSignatureAsync(file, extension))
            return ResultSaveImage.Fail("O conteúdo do arquivo não corresponde a uma imagem válida.");

        return null;
    }

    private static async Task<bool> HasValidSignatureAsync(IFormFile file, string extension)
    {
        byte[] header = new byte[12];
        await using Stream stream = file.OpenReadStream();
        int bytesRead = await stream.ReadAsync(header.AsMemory(0, header.Length));

        return extension switch
        {
            ".jpg" or ".jpeg" => bytesRead >= 3 &&
                header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF,
            ".png" => bytesRead >= 8 &&
                header.AsSpan(0, 8).SequenceEqual(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }),
            ".gif" => bytesRead >= 6 &&
                (Encoding.ASCII.GetString(header, 0, 6) is "GIF87a" or "GIF89a"),
            ".webp" => bytesRead >= 12 &&
                Encoding.ASCII.GetString(header, 0, 4) == "RIFF" &&
                Encoding.ASCII.GetString(header, 8, 4) == "WEBP",
            _ => false,
        };
    }

    private static bool TryBuildSubFolder(
        string type,
        string entityName,
        string? folderName,
        out string subFolder)
    {
        subFolder = string.Empty;
        string normalizedType = type?.Trim().ToLowerInvariant() ?? string.Empty;

        if (!AllowedAssetTypes.Contains(normalizedType) ||
            ContainsUnsafePathToken(normalizedType) ||
            ContainsUnsafePathToken(entityName) ||
            (!string.IsNullOrWhiteSpace(folderName) && ContainsUnsafePathToken(folderName)))
        {
            return false;
        }

        string safeEntity = SanitizeSegment(entityName, 80);
        string safeFolder = SanitizeSegment(folderName, 40);
        if (string.IsNullOrWhiteSpace(safeEntity) ||
            (!string.IsNullOrWhiteSpace(folderName) && string.IsNullOrWhiteSpace(safeFolder)))
        {
            return false;
        }

        subFolder = string.IsNullOrWhiteSpace(safeFolder)
            ? $"{normalizedType}/{safeEntity}"
            : $"{normalizedType}/{safeEntity}/{safeFolder}";
        return true;
    }

    private static bool ContainsUnsafePathToken(string? value)
        => string.IsNullOrWhiteSpace(value) ||
           value.Contains("..", StringComparison.Ordinal) ||
           value.Contains('\\') ||
           value.StartsWith('/') ||
           Path.IsPathRooted(value);

    private static string SanitizeSegment(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        string decomposed = value.Trim().Normalize(NormalizationForm.FormD);
        StringBuilder result = new();
        bool lastWasSeparator = false;

        foreach (char character in decomposed)
        {
            UnicodeCategory category = CharUnicodeInfo.GetUnicodeCategory(character);
            if (category == UnicodeCategory.NonSpacingMark)
                continue;

            if (char.IsLetterOrDigit(character) || character == '_')
            {
                result.Append(char.ToLowerInvariant(character));
                lastWasSeparator = false;
            }
            else if (!lastWasSeparator && result.Length > 0)
            {
                result.Append('-');
                lastWasSeparator = true;
            }

            if (result.Length >= maxLength)
                break;
        }

        return result.ToString().Trim('-');
    }

}
