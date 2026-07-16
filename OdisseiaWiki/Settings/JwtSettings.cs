namespace OdisseiaWiki.Settings;

public sealed class JwtSettings
{
    public const string SectionName = "Jwt";

    public string Issuer { get; init; } = string.Empty;
    public string Audience { get; init; } = string.Empty;
    public string ChaveSecreta { get; init; } = string.Empty;
    public int ExpiracaoHoras { get; init; } = 168;
}
