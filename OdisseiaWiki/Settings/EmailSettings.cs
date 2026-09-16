namespace OdisseiaWiki.Settings;

public sealed class EmailSettings
{
    public const string SectionName = "Email";

    public string Host { get; init; } = "smtp.gmail.com";
    public int Port { get; init; } = 587;
    public string Username { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
    public string From { get; init; } = string.Empty;
    public string FrontendUrl { get; init; } = string.Empty;
    public int ConfirmacaoEmailValidadeHoras { get; init; } = 24;
    public int RedefinicaoSenhaValidadeMinutos { get; init; } = 30;
}
