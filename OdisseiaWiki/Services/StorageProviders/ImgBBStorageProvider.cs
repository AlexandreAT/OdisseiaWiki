using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Http;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Services.Interfaces;
using OdisseiaWiki.Settings;
using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace OdisseiaWiki.Services.StorageProviders
{
    public class ImgBBStorageProvider : IImgBBStorageProvider
    {
        private readonly HttpClient _http;
        private readonly ImgBBSettings _settings;

        public ImgBBStorageProvider(HttpClient http, IOptions<ImgBBSettings> options)
        {
            _http = http;
            _settings = options.Value;
        }

        public async Task<ResultSaveImage> SaveAsync(IFormFile file, string subFolder)
        {
            try
            {
                await using var ms = new System.IO.MemoryStream();
                await file.CopyToAsync(ms);
                string base64 = Convert.ToBase64String(ms.ToArray());

                // Monta request conforme API ImgBB (key na query, image em form)
                var requestUrl = $"{_settings.Endpoint}?key={_settings.ApiKey}";

                var content = new MultipartFormDataContent
                {
                    { new StringContent(base64, Encoding.UTF8), "image" },
                    // opcional: nome original
                    { new StringContent(file.FileName ?? "upload"), "name" }
                };

                using var resp = await _http.PostAsync(requestUrl, content);
                if (!resp.IsSuccessStatusCode)
                {
                    var err = await resp.Content.ReadAsStringAsync();
                    return ResultSaveImage.Fail($"ImgBB retornou erro: {resp.StatusCode} - {err}");
                }

                using var stream = await resp.Content.ReadAsStreamAsync();
                using var doc = await JsonDocument.ParseAsync(stream);
                if (doc.RootElement.TryGetProperty("data", out var data))
                {
                    string imageUrl = data.GetProperty("url").GetString() ?? string.Empty;
                    string? deleteUrl = data.TryGetProperty("delete_url", out var d) ? d.GetString() : null;
                    // Opcional: retornar deleteUrl em MensagemErro (não ideal, mas útil)
                    return ResultSaveImage.Ok(imageUrl);
                }

                return ResultSaveImage.Fail("Resposta ImgBB inválida.");
            }
            catch (Exception ex)
            {
                return ResultSaveImage.Fail($"Erro ao enviar para ImgBB: {ex.Message}");
            }
        }
    }
}