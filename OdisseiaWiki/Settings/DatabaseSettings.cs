namespace OdisseiaWiki.Settings;

public sealed class DatabaseSettings
{
    public const string SectionName = "Database";

    public string ServerVersion { get; init; } = "8.0.0";

    public uint MaximumPoolSize { get; init; } = 10;

    public uint ConnectionIdleTimeoutSeconds { get; init; } = 60;

    public int RetryCount { get; init; } = 3;

    public int RetryDelaySeconds { get; init; } = 5;

    public bool ApplyMigrationsOnStartup { get; init; }

    public bool SeedOnStartup { get; init; } = true;

    public int InitializationRetrySeconds { get; init; } = 10;

    public int InitializationLockTimeoutSeconds { get; init; } = 30;
}
