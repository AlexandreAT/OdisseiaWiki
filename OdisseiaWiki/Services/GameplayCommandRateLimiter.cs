using System.Threading.RateLimiting;

namespace OdisseiaWiki.Services;

public enum GameplayCommandRateCategory
{
    Roll,
    Manual,
    Lifecycle,
}

public interface IGameplayCommandRateLimiter
{
    bool TryAcquire(
        int idMesa,
        int idUsuario,
        GameplayCommandRateCategory category,
        out int retryAfterSeconds);
}

public sealed class GameplayCommandRateLimiter : IGameplayCommandRateLimiter, IDisposable
{
    private readonly bool _disabled;
    private readonly PartitionedRateLimiter<GameplayRateKey> _limiter;

    public GameplayCommandRateLimiter(IHostEnvironment environment)
    {
        _disabled = environment.IsDevelopment();
        _limiter = PartitionedRateLimiter.Create<GameplayRateKey, GameplayRateKey>(key =>
            RateLimitPartition.GetFixedWindowLimiter(key, partition => new FixedWindowRateLimiterOptions
            {
                PermitLimit = partition.Category switch
                {
                    GameplayCommandRateCategory.Roll => 30,
                    GameplayCommandRateCategory.Manual => 20,
                    _ => 10,
                },
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true,
            }));
    }

    public bool TryAcquire(
        int idMesa,
        int idUsuario,
        GameplayCommandRateCategory category,
        out int retryAfterSeconds)
    {
        retryAfterSeconds = 0;
        if (_disabled)
            return true;

        using RateLimitLease lease = _limiter.AttemptAcquire(
            new GameplayRateKey(idMesa, idUsuario, category));
        if (lease.IsAcquired)
            return true;

        retryAfterSeconds = lease.TryGetMetadata(MetadataName.RetryAfter, out TimeSpan retryAfter)
            ? Math.Max(1, (int)Math.Ceiling(retryAfter.TotalSeconds))
            : 60;
        return false;
    }

    public void Dispose() => _limiter.Dispose();

    private readonly record struct GameplayRateKey(
        int IdMesa,
        int IdUsuario,
        GameplayCommandRateCategory Category);
}
