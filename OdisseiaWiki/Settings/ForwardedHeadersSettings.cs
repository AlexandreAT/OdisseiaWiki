namespace OdisseiaWiki.Settings;

public sealed class ForwardedHeadersSettings
{
    public const string SectionName = "ForwardedHeaders";

    public bool Enabled { get; init; }

    public string[] KnownProxies { get; init; } = Array.Empty<string>();
}
