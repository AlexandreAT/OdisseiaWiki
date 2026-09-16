using OdisseiaWiki.Models;

namespace OdisseiaWiki.Services.Interfaces;

public interface IEmailService
{
    bool IsConfigured { get; }

    Task SendEmailConfirmationAsync(Usuario usuario, string token, DateTime expiraEm);
    Task SendPasswordResetAsync(Usuario usuario, string token, DateTime expiraEm);
}
