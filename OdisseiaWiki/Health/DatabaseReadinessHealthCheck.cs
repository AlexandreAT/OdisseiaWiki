using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using MySqlConnector;
using OdisseiaWiki.Data;

namespace OdisseiaWiki.Health;

public sealed class DatabaseReadinessHealthCheck : IHealthCheck
{
    private readonly OdisseiaContext _context;
    private readonly DatabaseInitializationState _initializationState;
    private readonly ILogger<DatabaseReadinessHealthCheck> _logger;

    public DatabaseReadinessHealthCheck(
        OdisseiaContext context,
        DatabaseInitializationState initializationState,
        ILogger<DatabaseReadinessHealthCheck> logger)
    {
        _context = context;
        _initializationState = initializationState;
        _logger = logger;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        if (!_initializationState.IsInitializationComplete)
            return HealthCheckResult.Unhealthy("A inicialização do banco ainda não foi concluída.");

        try
        {
            bool canConnect = await _context.Database.CanConnectAsync(cancellationToken);
            if (canConnect)
            {
                if (_initializationState.MarkAvailable())
                    _logger.LogInformation("Conectividade com o banco restabelecida.");

                return HealthCheckResult.Healthy();
            }

            if (_initializationState.MarkUnavailable())
            {
                _logger.LogWarning(
                    "O banco deixou de responder ao health check de prontidão.");
            }

            return HealthCheckResult.Unhealthy("O banco não está acessível.");
        }
        catch (Exception exception)
        {
            if (_initializationState.MarkUnavailable())
            {
                MySqlException? mySqlException = FindException<MySqlException>(exception);
                _logger.LogWarning(
                    "O banco deixou de responder ao health check de prontidão. " +
                    "Exceção externa: {OuterExceptionType}; exceção interna: {RootExceptionType}; " +
                    "código MySQL: {MySqlErrorNumber}; SQL state: {SqlState}; transitório: {IsTransient}.",
                    exception.GetType().Name,
                    exception.GetBaseException().GetType().Name,
                    mySqlException?.Number,
                    mySqlException?.SqlState,
                    mySqlException?.IsTransient);
            }

            return HealthCheckResult.Unhealthy("O banco não está acessível.");
        }
    }

    private static TException? FindException<TException>(Exception exception)
        where TException : Exception
    {
        Exception? current = exception;
        while (current is not null)
        {
            if (current is TException typedException)
                return typedException;

            current = current.InnerException;
        }

        return null;
    }
}
