using System.Net.Mail;

namespace OdisseiaWiki.Settings;

public sealed class EmailSettings
{
    public const string SectionName = "Email";

    public string BrevoApiKey { get; init; } = string.Empty;
    public string From { get; init; } = string.Empty;
    public string FrontendUrl { get; init; } = string.Empty;
    public int ConfirmacaoEmailValidadeHoras { get; init; } = 24;
    public int RedefinicaoSenhaValidadeMinutos { get; init; } = 30;

    public bool HasValidSender
    {
        get
        {
            try
            {
                _ = new MailAddress(From);
                return !string.IsNullOrWhiteSpace(From);
            }
            catch (FormatException)
            {
                return false;
            }
        }
    }

    public bool HasValidFrontendUrl =>
        Uri.TryCreate(FrontendUrl, UriKind.Absolute, out Uri? frontendUri) &&
        (frontendUri.Scheme == Uri.UriSchemeHttp || frontendUri.Scheme == Uri.UriSchemeHttps);
}
