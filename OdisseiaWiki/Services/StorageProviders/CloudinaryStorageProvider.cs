using System.Text.RegularExpressions;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Options;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Services.Interfaces;
using OdisseiaWiki.Settings;

namespace OdisseiaWiki.Services.StorageProviders;

public sealed partial class CloudinaryStorageProvider : ICloudinaryStorageProvider
{
    private readonly Cloudinary? _cloudinary;
    private readonly CloudinarySettings _settings;
    private readonly ILogger<CloudinaryStorageProvider> _logger;

    public CloudinaryStorageProvider(
        IOptions<CloudinarySettings> options,
        ILogger<CloudinaryStorageProvider> logger)
    {
        _settings = options.Value;
        _logger = logger;
        if (HasCredentials(_settings))
        {
            _cloudinary = new Cloudinary(new Account(
                _settings.CloudName,
                _settings.ApiKey,
                _settings.ApiSecret));
            _cloudinary.Api.Secure = true;
        }
        else
        {
            _logger.LogInformation(
                "Cloudinary não inicializado; o armazenamento local pode ser usado no desenvolvimento.");
        }
    }

    public async Task<ResultSaveImage> SaveAsync(
        IFormFile file,
        string subFolder,
        string? publicId = null,
        CancellationToken cancellationToken = default)
    {
        if (_cloudinary is null)
        {
            _logger.LogError("Upload solicitado sem configuração completa do Cloudinary.");
            return ResultSaveImage.Fail("O armazenamento de imagens não está configurado.");
        }

        try
        {
            string targetPublicId = string.IsNullOrWhiteSpace(publicId)
                ? $"{NormalizeFolder(_settings.RootFolder)}/{NormalizeFolder(subFolder)}/{Guid.NewGuid():N}"
                : NormalizePublicId(publicId);

            if (string.IsNullOrWhiteSpace(targetPublicId) ||
                !targetPublicId.StartsWith($"{NormalizeFolder(_settings.RootFolder)}/", StringComparison.Ordinal))
            {
                _logger.LogWarning("Tentativa de upload com public ID fora da pasta permitida.");
                return ResultSaveImage.Fail("Destino do arquivo inválido.");
            }

            await using Stream stream = file.OpenReadStream();
            ImageUploadParams uploadParams = new()
            {
                File = new FileDescription(file.FileName, stream),
                PublicId = targetPublicId,
                Overwrite = !string.IsNullOrWhiteSpace(publicId),
                Invalidate = !string.IsNullOrWhiteSpace(publicId),
                UniqueFilename = false,
                UseFilename = false,
            };

            ImageUploadResult result = await _cloudinary.UploadAsync(uploadParams, cancellationToken);
            if (result.Error is not null || result.SecureUrl is null || string.IsNullOrWhiteSpace(result.PublicId))
            {
                _logger.LogWarning("Cloudinary rejeitou upload: {Error}", result.Error?.Message);
                return ResultSaveImage.Fail("O armazenamento de imagens rejeitou o arquivo.");
            }

            return ResultSaveImage.Ok(result.SecureUrl.AbsoluteUri, "cloudinary", result.PublicId);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            return ResultSaveImage.Fail("O envio da imagem foi cancelado.");
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Falha ao enviar imagem ao Cloudinary.");
            return ResultSaveImage.Fail("Não foi possível salvar a imagem.");
        }
    }

    public async Task<bool> DeleteAsync(
        string assetIdentifier,
        CancellationToken cancellationToken = default)
    {
        if (_cloudinary is null)
        {
            _logger.LogWarning("Exclusão solicitada sem configuração completa do Cloudinary.");
            return false;
        }

        string publicId = NormalizePublicId(assetIdentifier);
        if (string.IsNullOrWhiteSpace(publicId) ||
            !publicId.StartsWith($"{NormalizeFolder(_settings.RootFolder)}/", StringComparison.Ordinal))
        {
            _logger.LogWarning("Exclusão ignorada para public ID fora da pasta gerenciada.");
            return false;
        }

        try
        {
            DeletionResult result = await _cloudinary.DestroyAsync(new DeletionParams(publicId)
            {
                ResourceType = ResourceType.Image,
                Invalidate = true,
            });

            return result.Error is null && result.Result is "ok" or "not found";
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Falha ao excluir asset {PublicId} do Cloudinary.", publicId);
            return false;
        }
    }

    public bool TryGetPublicId(string url, out string publicId)
    {
        publicId = string.Empty;
        if (_cloudinary is null ||
            !Uri.TryCreate(url, UriKind.Absolute, out Uri? uri) ||
            !string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase) ||
            !string.Equals(uri.Host, "res.cloudinary.com", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        string expectedPrefix = $"/{Uri.EscapeDataString(_settings.CloudName)}/image/upload/";
        if (!uri.AbsolutePath.StartsWith(expectedPrefix, StringComparison.OrdinalIgnoreCase))
            return false;

        string remainder = Uri.UnescapeDataString(uri.AbsolutePath[expectedPrefix.Length..]);
        remainder = VersionPrefixRegex().Replace(remainder, string.Empty);
        string root = $"{NormalizeFolder(_settings.RootFolder)}/";
        int rootIndex = remainder.IndexOf(root, StringComparison.Ordinal);
        if (rootIndex < 0)
            return false;

        string candidate = remainder[rootIndex..];
        int extensionIndex = candidate.LastIndexOf('.');
        if (extensionIndex > candidate.LastIndexOf('/'))
            candidate = candidate[..extensionIndex];

        candidate = NormalizePublicId(candidate);
        if (!candidate.StartsWith(root, StringComparison.Ordinal))
            return false;

        publicId = candidate;
        return true;
    }

    private static string NormalizeFolder(string value)
        => string.Join('/', value.Split('/', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(segment => segment.Replace("..", string.Empty, StringComparison.Ordinal)));

    private static string NormalizePublicId(string value)
        => NormalizeFolder(value).TrimEnd('/');

    private static bool HasCredentials(CloudinarySettings settings)
        => !string.IsNullOrWhiteSpace(settings.CloudName) &&
           !string.IsNullOrWhiteSpace(settings.ApiKey) &&
           !string.IsNullOrWhiteSpace(settings.ApiSecret);

    [GeneratedRegex(@"^(?:[^/]+/)*v\d+/")]
    private static partial Regex VersionPrefixRegex();
}
