namespace OdisseiaWiki.Settings;

public sealed class AuthorizationSettings
{
    public const string SectionName = "Authorization";

    public string[] AdminEmails { get; init; } = Array.Empty<string>();
    public bool RequireVerifiedEmailForAdmin { get; init; } = true;
}
