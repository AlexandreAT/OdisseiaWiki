using System.Net;
using System.Net.Http.Json;
using System.Net.Mail;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using OdisseiaWiki.Models;
using OdisseiaWiki.Services.Interfaces;
using OdisseiaWiki.Settings;

namespace OdisseiaWiki.Services;

public sealed class BrevoApiEmailService : IEmailService
{
    private readonly HttpClient _httpClient;
    private readonly EmailSettings _settings;
    private readonly ILogger<BrevoApiEmailService> _logger;

    public BrevoApiEmailService(
        HttpClient httpClient,
        IOptions<EmailSettings> emailOptions,
        ILogger<BrevoApiEmailService> logger)
    {
        _httpClient = httpClient;
        _settings = emailOptions.Value;
        _logger = logger;
    }

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(_settings.BrevoApiKey) &&
        _settings.HasValidSender &&
        _settings.HasValidFrontendUrl;

    public Task SendEmailConfirmationAsync(Usuario usuario, string token, DateTime expiraEm)
    {
        Uri link = BuildLink("confirmEmail", token);
        return SendAsync(
            usuario.Email,
            usuario.Nome,
            "Confirme seu e-mail no OdisseiaWiki",
            "Confirme seu e-mail",
            "Confirme seu e-mail para ativar sua conta no OdisseiaWiki.",
            "Confirmar e-mail",
            link,
            expiraEm,
            "Se você não criou uma conta, ignore este e-mail.");
    }

    public Task SendPasswordResetAsync(Usuario usuario, string token, DateTime expiraEm)
    {
        Uri link = BuildLink("resetPassword", token);
        return SendAsync(
            usuario.Email,
            usuario.Nome,
            "Redefina sua senha no OdisseiaWiki",
            "Redefina sua senha",
            $"Recebemos uma solicitação para redefinir a senha da sua conta. Seu nickname para entrar é: {usuario.Nickname}.",
            "Redefinir senha",
            link,
            expiraEm,
            "Se você não solicitou a redefinição, ignore este e-mail. Sua senha continuará a mesma.");
    }

    private async Task SendAsync(
        string recipientEmail,
        string recipientName,
        string subject,
        string title,
        string description,
        string actionLabel,
        Uri actionLink,
        DateTime expiraEm,
        string footer)
    {
        EnsureConfigured();

        try
        {
            MailAddress sender = new(_settings.From);
            BrevoEmailRequest requestBody = new(
                new BrevoEmailAddress(sender.Address, GetSenderName(sender)),
                new[] { new BrevoEmailAddress(recipientEmail, recipientName) },
                subject,
                BuildHtml(title, recipientName, description, actionLabel, actionLink.AbsoluteUri, expiraEm, footer));

            using HttpRequestMessage request = new(HttpMethod.Post, "smtp/email")
            {
                Content = JsonContent.Create(requestBody),
            };
            request.Headers.Add("api-key", _settings.BrevoApiKey.Trim());

            using HttpResponseMessage response = await _httpClient.SendAsync(request);
            if (response.IsSuccessStatusCode)
                return;

            _logger.LogWarning(
                "A Brevo recusou o envio de e-mail de conta com status HTTP {StatusCode}.",
                (int)response.StatusCode);
            throw new EmailDeliveryException("O provedor de e-mail recusou o envio.");
        }
        catch (EmailDeliveryException)
        {
            throw;
        }
        catch (HttpRequestException exception)
        {
            _logger.LogWarning(exception, "Não foi possível alcançar a Brevo para enviar o e-mail.");
            throw new EmailDeliveryException("Não foi possível conectar ao provedor de e-mail.");
        }
        catch (TaskCanceledException exception)
        {
            _logger.LogWarning(exception, "O envio de e-mail pela Brevo excedeu o tempo limite.");
            throw new EmailDeliveryException("O envio de e-mail excedeu o tempo limite.");
        }
        catch (FormatException exception)
        {
            _logger.LogWarning(exception, "O remetente ou destinatário do e-mail possui formato inválido.");
            throw new EmailDeliveryException("Não foi possível preparar o envio do e-mail.");
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Ocorreu um erro inesperado ao enviar e-mail pela Brevo.");
            throw new EmailDeliveryException("Não foi possível enviar o e-mail.");
        }
    }

    private Uri BuildLink(string queryParameter, string token)
    {
        EnsureConfigured();

        string baseUrl = _settings.FrontendUrl.TrimEnd('/');
        return new Uri($"{baseUrl}/login?{queryParameter}={Uri.EscapeDataString(token)}");
    }

    private void EnsureConfigured()
    {
        if (!IsConfigured)
            throw new EmailDeliveryException("O envio de e-mail não está configurado.");
    }

    private static string GetSenderName(MailAddress sender) =>
        string.IsNullOrWhiteSpace(sender.DisplayName) ? "OdisseiaWiki" : sender.DisplayName;

    private static string BuildHtml(
        string title,
        string name,
        string description,
        string actionLabel,
        string actionUrl,
        DateTime expiraEm,
        string footer)
    {
        string safeName = WebUtility.HtmlEncode(name);
        string safeDescription = WebUtility.HtmlEncode(description);
        string safeActionLabel = WebUtility.HtmlEncode(actionLabel);
        string safeActionUrl = WebUtility.HtmlEncode(actionUrl);
        string safeFooter = WebUtility.HtmlEncode(footer);
        string expiration = WebUtility.HtmlEncode(expiraEm.ToLocalTime().ToString("dd/MM/yyyy 'às' HH:mm"));

        return $"""
            <div style="font-family:Arial,sans-serif;background:#020a16;color:#edf7ff;padding:32px;max-width:600px;margin:auto">
              <h1 style="color:#00b8ff;margin:0 0 24px">OdisseiaWiki</h1>
              <h2 style="margin:0 0 16px">{WebUtility.HtmlEncode(title)}</h2>
              <p>Olá, {safeName}.</p>
              <p>{safeDescription}</p>
              <p style="margin:28px 0"><a href="{safeActionUrl}" style="background:#00b8ff;color:#00111f;padding:13px 20px;text-decoration:none;font-weight:bold">{safeActionLabel}</a></p>
              <p>Este link expira em {expiration}.</p>
              <p>{safeFooter}</p>
              <p style="font-size:12px;word-break:break-all">Se o botão não funcionar, use este link: {safeActionUrl}</p>
            </div>
            """;
    }

    private sealed record BrevoEmailRequest(
        [property: JsonPropertyName("sender")] BrevoEmailAddress Sender,
        [property: JsonPropertyName("to")] IReadOnlyCollection<BrevoEmailAddress> To,
        [property: JsonPropertyName("subject")] string Subject,
        [property: JsonPropertyName("htmlContent")] string HtmlContent);

    private sealed record BrevoEmailAddress(
        [property: JsonPropertyName("email")] string Email,
        [property: JsonPropertyName("name")] string Name);
}
