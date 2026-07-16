namespace OdisseiaWiki.Settings;

public sealed class UploadSettings
{
    public const string SectionName = "Uploads";
    public const long DefaultMaxFileSizeBytes = 10 * 1024 * 1024;

    public long MaxFileSizeBytes { get; init; } = DefaultMaxFileSizeBytes;
}
