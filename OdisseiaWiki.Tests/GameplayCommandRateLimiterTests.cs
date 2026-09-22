using Microsoft.Extensions.Hosting;
using Moq;
using OdisseiaWiki.Services;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class GameplayCommandRateLimiterTests
{
    [Fact]
    public void TryAcquire_LimitaComandosPorMesaUsuarioECategoria()
    {
        var environment = new Mock<IHostEnvironment>();
        environment.SetupGet(item => item.EnvironmentName).Returns("Production");
        using var limiter = new GameplayCommandRateLimiter(environment.Object);

        for (int index = 0; index < 20; index++)
            Assert.True(limiter.TryAcquire(10, 7, GameplayCommandRateCategory.Manual, out _));

        Assert.False(limiter.TryAcquire(10, 7, GameplayCommandRateCategory.Manual, out int retryAfter));
        Assert.True(retryAfter > 0);
        Assert.True(limiter.TryAcquire(11, 7, GameplayCommandRateCategory.Manual, out _));
        Assert.True(limiter.TryAcquire(10, 8, GameplayCommandRateCategory.Manual, out _));
        Assert.True(limiter.TryAcquire(10, 7, GameplayCommandRateCategory.Roll, out _));
    }

    [Fact]
    public void TryAcquire_NaoLimitaDesenvolvimento()
    {
        var environment = new Mock<IHostEnvironment>();
        environment.SetupGet(item => item.EnvironmentName).Returns("Development");
        using var limiter = new GameplayCommandRateLimiter(environment.Object);

        for (int index = 0; index < 50; index++)
            Assert.True(limiter.TryAcquire(10, 7, GameplayCommandRateCategory.Lifecycle, out _));
    }
}
