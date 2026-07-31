using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using OdisseiaWiki.Settings;

namespace OdisseiaWiki.Data;

public sealed class DatabaseRecoveryService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly DatabaseInitializationState _state;
    private readonly DatabaseSettings _settings;
    private readonly ILogger<DatabaseRecoveryService> _logger;

    public DatabaseRecoveryService(
        IServiceScopeFactory scopeFactory,
        DatabaseInitializationState state,
        IOptions<DatabaseSettings> options,
        ILogger<DatabaseRecoveryService> logger)
    {
        _scopeFactory = scopeFactory;
        _state = state;
        _settings = options.Value;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        TimeSpan retryInterval =
            TimeSpan.FromSeconds(_settings.InitializationRetrySeconds);

        try
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                await Task.Delay(retryInterval, stoppingToken);

                if (!_state.IsInitializationComplete || _state.IsReady)
                    continue;

                try
                {
                    await using AsyncServiceScope scope = _scopeFactory.CreateAsyncScope();
                    OdisseiaContext context =
                        scope.ServiceProvider.GetRequiredService<OdisseiaContext>();

                    if (await context.Database.CanConnectAsync(stoppingToken) &&
                        _state.MarkAvailable())
                    {
                        _logger.LogInformation(
                            "Conectividade com o banco restabelecida pelo monitor de recuperação.");
                    }
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    return;
                }
                catch (Exception exception)
                {
                    _logger.LogDebug(
                        "O monitor ainda não conseguiu restabelecer a conexão com o banco. " +
                        "Exceção externa: {OuterExceptionType}; exceção interna: {RootExceptionType}.",
                        exception.GetType().Name,
                        exception.GetBaseException().GetType().Name);
                }
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            // Encerramento normal do host.
        }
    }
}
