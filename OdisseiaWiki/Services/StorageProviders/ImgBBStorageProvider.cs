using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Options;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Services.Interfaces;
using OdisseiaWiki.Settings;

namespace OdisseiaWiki.Services.StorageProviders;

public class ImgBBStorageProvider : IImgBBStorageProvider
{
    private readonly HttpClient _httpClient;
    private readonly ImgBBSettings _settings;
    private readonly ILogger<ImgBBStorageProvider> _logger;

    public ImgBBStorageProvider(
        HttpClient httpClient,
        IOptions<ImgBBSettings> options,
        ILogger<ImgBBStorageProvider> logger)
    {
        _httpClient = httpClient;
        _settings = options.Value;
        _logger = logger;
    }

    public async Task<ResultSaveImage> SaveAsync(IFormFile file, string subFolder)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(_settings.ApiKey))
            {
                _logger.LogError("ImgBB:ApiKey não está configurada.");
                return ResultSaveImage.Fail("O armazenamento externo não está configurado.");
            }

            string requestUrl = $"{_settings.Endpoint}?key={Uri.EscapeDataString(_settings.ApiKey)}";
            await using Stream fileStream = file.OpenReadStream();
            using StreamContent imageContent = new(fileStream);
            imageContent.Headers.ContentType = MediaTypeHeaderValue.Parse(file.ContentType);

            string safeFileName = $"{Guid.NewGuid():N}{Path.GetExtension(file.FileName).ToLowerInvariant()}";
            using MultipartFormDataContent content = new();
            content.Add(imageContent, "image", safeFileName);

            using HttpResponseMessage response = await _httpClient.PostAsync(requestUrl, content);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("ImgBB rejeitou um upload com status {StatusCode}.", response.StatusCode);
                return ResultSaveImage.Fail("O armazenamento externo rejeitou a imagem.");
            }

            await using Stream responseStream = await response.Content.ReadAsStreamAsync();
            using JsonDocument document = await JsonDocument.ParseAsync(responseStream);
            if (document.RootElement.TryGetProperty("data", out JsonElement data) &&
                data.TryGetProperty("url", out JsonElement urlElement) &&
                !string.IsNullOrWhiteSpace(urlElement.GetString()))
            {
                return ResultSaveImage.Ok(urlElement.GetString()!);
            }

            _logger.LogWarning("ImgBB retornou uma resposta sem URL para o upload.");
            return ResultSaveImage.Fail("O armazenamento externo retornou uma resposta inválida.");
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Falha ao enviar imagem ao ImgBB.");
            return ResultSaveImage.Fail("Não foi possível enviar a imagem.");
        }
    }
}
