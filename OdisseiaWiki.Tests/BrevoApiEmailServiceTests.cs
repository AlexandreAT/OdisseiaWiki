using System.Net;
using System.Text.Json;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using OdisseiaWiki.Models;
using OdisseiaWiki.Services;
using OdisseiaWiki.Settings;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class BrevoApiEmailServiceTests
{
    [Fact]
    public async Task SendEmailConfirmationAsync_EnviaPayloadEsperadoPelaApiDaBrevo()
    {
        RecordingHttpMessageHandler handler = new(HttpStatusCode.Created);
        BrevoApiEmailService service = CreateService(handler);

        await service.SendEmailConfirmationAsync(
            new Usuario
            {
                Nome = "Novo usuário",
                Email = "novo@teste.com",
            },
            "token-de-confirmacao",
            new DateTime(2030, 1, 2, 3, 4, 5, DateTimeKind.Utc));

        Assert.Equal(HttpMethod.Post, handler.Method);
        Assert.Equal("https://api.brevo.com/v3/smtp/email", handler.RequestUri?.ToString());
        Assert.Equal("chave-da-api-brevo", handler.ApiKey);

        using JsonDocument payload = JsonDocument.Parse(handler.Body);
        JsonElement root = payload.RootElement;
        Assert.Equal("OdisseiaWiki", root.GetProperty("sender").GetProperty("name").GetString());
        Assert.Equal("odisseiawiki@gmail.com", root.GetProperty("sender").GetProperty("email").GetString());
        Assert.Equal("novo@teste.com", root.GetProperty("to")[0].GetProperty("email").GetString());
        Assert.Equal("Confirme seu e-mail no OdisseiaWiki", root.GetProperty("subject").GetString());
        Assert.Contains("confirmEmail=token-de-confirmacao", root.GetProperty("htmlContent").GetString());
    }

    [Fact]
    public async Task SendPasswordResetAsync_ConverteRecusaDaBrevoEmErroControlado()
    {
        RecordingHttpMessageHandler handler = new(HttpStatusCode.TooManyRequests);
        BrevoApiEmailService service = CreateService(handler);

        EmailDeliveryException exception = await Assert.ThrowsAsync<EmailDeliveryException>(() =>
            service.SendPasswordResetAsync(
                new Usuario
                {
                    Nome = "Conta",
                    Nickname = "conta",
                    Email = "conta@teste.com",
                },
                "token-de-redefinicao",
                DateTime.UtcNow.AddMinutes(30)));

        Assert.Equal("O provedor de e-mail recusou o envio.", exception.Message);
    }

    private static BrevoApiEmailService CreateService(RecordingHttpMessageHandler handler)
    {
        HttpClient httpClient = new(handler)
        {
            BaseAddress = new Uri("https://api.brevo.com/v3/"),
        };

        return new BrevoApiEmailService(
            httpClient,
            Options.Create(new EmailSettings
            {
                BrevoApiKey = "chave-da-api-brevo",
                From = "OdisseiaWiki <odisseiawiki@gmail.com>",
                FrontendUrl = "https://odisseiawiki.netlify.app",
            }),
            NullLogger<BrevoApiEmailService>.Instance);
    }

    private sealed class RecordingHttpMessageHandler : HttpMessageHandler
    {
        private readonly HttpStatusCode _statusCode;

        public RecordingHttpMessageHandler(HttpStatusCode statusCode)
        {
            _statusCode = statusCode;
        }

        public HttpMethod? Method { get; private set; }
        public Uri? RequestUri { get; private set; }
        public string? ApiKey { get; private set; }
        public string Body { get; private set; } = string.Empty;

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            Method = request.Method;
            RequestUri = request.RequestUri;
            ApiKey = request.Headers.GetValues("api-key").Single();
            Body = await request.Content!.ReadAsStringAsync(cancellationToken);

            return new HttpResponseMessage(_statusCode)
            {
                Content = new StringContent("{}"),
            };
        }
    }
}
