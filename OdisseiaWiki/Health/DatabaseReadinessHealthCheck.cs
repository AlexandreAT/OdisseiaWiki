using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using OdisseiaWiki.Data;

namespace OdisseiaWiki.Health;

public sealed class DatabaseReadinessHealthCheck : IHealthCheck
{
    private readonly OdisseiaContext _context;
    private readonly DatabaseInitializationState _initializationState;

    public DatabaseReadinessHealthCheck(
        OdisseiaContext context,
        DatabaseInitializationState initializationState)
    {
        _context = context;
        _initializationState = initializationState;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        if (!_initializationState.IsReady)
            return HealthCheckResult.Unhealthy("A inicialização do banco ainda não foi concluída.");

        try
        {
            return await _context.Database.CanConnectAsync(cancellationToken)
                ? HealthCheckResult.Healthy()
                : HealthCheckResult.Unhealthy("O banco não está acessível.");
        }
        catch
        {
            return HealthCheckResult.Unhealthy("O banco não está acessível.");
        }
    }
}
