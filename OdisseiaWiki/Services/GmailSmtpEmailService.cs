using System.Net;
using System.Net.Sockets;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using OdisseiaWiki.Models;
using OdisseiaWiki.Services.Interfaces;
using OdisseiaWiki.Settings;

namespace OdisseiaWiki.Services;

public sealed class GmailSmtpEmailService : IEmailService
{
    private readonly EmailSettings _settings;
    private readonly ILogger<GmailSmtpEmailService> _logger;

    public GmailSmtpEmailService(
        IOptions<EmailSettings> emailOptions,
        ILogger<GmailSmtpEmailService> logger)
    {
        _settings = emailOptions.Value;
        _logger = logger;
    }

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(_settings.Host)
        && _settings.Port is > 0 and <= 65535
        && !string.IsNullOrWhiteSpace(_settings.Username)
        && !string.IsNullOrWhiteSpace(_settings.Password)
        && !string.IsNullOrWhiteSpace(_settings.From)
        && Uri.TryCreate(_settings.FrontendUrl, UriKind.Absolute, out Uri? frontendUri)
        && (frontendUri.Scheme == Uri.UriSchemeHttp || frontendUri.Scheme == Uri.UriSchemeHttps);

    public Task SendEmailConfirmationAsync(Usuario usuario, string token, DateTime expiraEm)
    {
        Uri link = BuildLink("confirmEmail", token);
        return SendAsync(
            usuario.Email,
            "Confirme seu e-mail no OdisseiaWiki",
            "Confirme seu e-mail",
            usuario.Nome,
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
            "Redefina sua senha no OdisseiaWiki",
            "Redefina sua senha",
            usuario.Nome,
            $"Recebemos uma solicitação para redefinir a senha da sua conta. Seu nickname para entrar é: {usuario.Nickname}.",
            "Redefinir senha",
            link,
            expiraEm,
            "Se você não solicitou a redefinição, ignore este e-mail. Sua senha continuará a mesma.");
    }

    private async Task SendAsync(
        string recipient,
        string subject,
        string title,
        string name,
        string description,
        string actionLabel,
        Uri actionLink,
        DateTime expiraEm,
        string footer)
    {
        EnsureConfigured();

        try
        {
            string actionUrl = actionLink.AbsoluteUri;
            MimeMessage message = BuildMessage(
                recipient,
                subject,
                BuildHtml(title, name, description, actionLabel, actionUrl, expiraEm, footer),
                BuildText(description, actionLabel, actionUrl, expiraEm, footer));

            using SmtpClient client = new()
            {
                Timeout = 20_000,
            };

            await client.ConnectAsync(_settings.Host, _settings.Port, SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(_settings.Username, _settings.Password);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }
        catch (MailKit.Security.AuthenticationException exception)
        {
            _logger.LogWarning(exception, "O Gmail recusou as credenciais SMTP do envio de e-mail.");
            throw new EmailDeliveryException("Não foi possível autenticar no provedor de e-mail.");
        }
        catch (SslHandshakeException exception)
        {
            _logger.LogWarning(exception, "Não foi possível estabelecer uma conexão TLS segura com o Gmail.");
            throw new EmailDeliveryException("Não foi possível estabelecer uma conexão segura com o provedor de e-mail.");
        }
        catch (SmtpCommandException exception)
        {
            _logger.LogWarning(exception, "O Gmail recusou o envio de e-mail de conta.");
            throw new EmailDeliveryException("O provedor de e-mail recusou o envio.");
        }
        catch (SmtpProtocolException exception)
        {
            _logger.LogWarning(exception, "Ocorreu um erro de protocolo ao enviar e-mail pelo Gmail.");
            throw new EmailDeliveryException("Não foi possível enviar o e-mail pelo provedor.");
        }
        catch (SocketException exception)
        {
            _logger.LogWarning(exception, "Não foi possível alcançar o Gmail para enviar o e-mail.");
            throw new EmailDeliveryException("Não foi possível conectar ao provedor de e-mail.");
        }
        catch (IOException exception)
        {
            _logger.LogWarning(exception, "Ocorreu um erro de comunicação ao enviar e-mail pelo Gmail.");
            throw new EmailDeliveryException("Não foi possível conectar ao provedor de e-mail.");
        }
        catch (TaskCanceledException exception)
        {
            _logger.LogWarning(exception, "O envio de e-mail pelo Gmail excedeu o tempo limite.");
            throw new EmailDeliveryException("O envio de e-mail excedeu o tempo limite.");
        }
        catch (FormatException exception)
        {
            _logger.LogWarning(exception, "O remetente ou destinatário do e-mail possui formato inválido.");
            throw new EmailDeliveryException("Não foi possível preparar o envio do e-mail.");
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Ocorreu um erro inesperado ao enviar e-mail pelo Gmail.");
            throw new EmailDeliveryException("Não foi possível enviar o e-mail.");
        }
    }

    private MimeMessage BuildMessage(string recipient, string subject, string html, string text)
    {
        MimeMessage message = new();
        message.From.Add(MailboxAddress.Parse(_settings.From));
        message.To.Add(MailboxAddress.Parse(recipient));
        message.Subject = subject;
        message.Body = new BodyBuilder
        {
            HtmlBody = html,
            TextBody = text,
        }.ToMessageBody();

        return message;
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

    private static string BuildText(
        string description,
        string actionLabel,
        string actionUrl,
        DateTime expiraEm,
        string footer)
    {
        return $"OdisseiaWiki\n\n{description}\n\n{actionLabel}: {actionUrl}\n\n" +
            $"Este link expira em {expiraEm.ToLocalTime():dd/MM/yyyy 'às' HH:mm}.\n\n{footer}";
    }
}
