using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using OdisseiaWiki.Settings;

namespace OdisseiaWiki.Data;

public sealed class DatabaseInitializationService : BackgroundService
{
    private const string InitializationLockName = "odisseia_database_initialization";
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly DatabaseInitializationState _state;
    private readonly DatabaseSettings _settings;
    private readonly ILogger<DatabaseInitializationService> _logger;

    public DatabaseInitializationService(
        IServiceScopeFactory scopeFactory,
        DatabaseInitializationState state,
        IOptions<DatabaseSettings> options,
        ILogger<DatabaseInitializationService> logger)
    {
        _scopeFactory = scopeFactory;
        _state = state;
        _settings = options.Value;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_settings.ApplyMigrationsOnStartup && !_settings.SeedOnStartup)
        {
            _state.MarkReady();
            _logger.LogInformation("Inicialização automática do banco está desativada.");
            return;
        }

        int attempt = 0;
        while (!stoppingToken.IsCancellationRequested)
        {
            attempt++;
            try
            {
                await InitializeAsync(stoppingToken);
                _state.MarkReady();
                _logger.LogInformation(
                    "Banco inicializado com sucesso. Migrations: {ApplyMigrations}; Seeder: {SeedOnStartup}.",
                    _settings.ApplyMigrationsOnStartup,
                    _settings.SeedOnStartup);
                return;
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                return;
            }
            catch (Exception exception)
            {
                _state.MarkUnavailable();
                _logger.LogWarning(
                    "Inicialização do banco falhou na tentativa {Attempt} ({ExceptionType}). " +
                    "Uma nova tentativa será feita sem encerrar a API.",
                    attempt,
                    exception.GetType().Name);

                await Task.Delay(
                    TimeSpan.FromSeconds(_settings.InitializationRetrySeconds),
                    stoppingToken);
            }
        }
    }

    private async Task InitializeAsync(CancellationToken cancellationToken)
    {
        await using AsyncServiceScope scope = _scopeFactory.CreateAsyncScope();
        OdisseiaContext context = scope.ServiceProvider.GetRequiredService<OdisseiaContext>();

        await context.Database.OpenConnectionAsync(cancellationToken);
        bool lockAcquired = await TryAcquireInitializationLockAsync(
            context.Database.GetDbConnection(),
            cancellationToken);

        if (!lockAcquired)
            throw new InvalidOperationException("Não foi possível obter o lock de inicialização do banco.");

        try
        {
            if (_settings.ApplyMigrationsOnStartup)
                await context.Database.MigrateAsync(cancellationToken);

            if (_settings.SeedOnStartup)
                await DatabaseSeeder.SeedAsync(scope.ServiceProvider);
        }
        finally
        {
            await ReleaseInitializationLockAsync(
                context.Database.GetDbConnection(),
                cancellationToken);
            await context.Database.CloseConnectionAsync();
        }
    }

    private async Task<bool> TryAcquireInitializationLockAsync(
        DbConnection connection,
        CancellationToken cancellationToken)
    {
        await using DbCommand command = connection.CreateCommand();
        command.CommandText = "SELECT GET_LOCK(@lockName, @timeoutSeconds);";

        DbParameter lockName = command.CreateParameter();
        lockName.ParameterName = "@lockName";
        lockName.Value = InitializationLockName;
        command.Parameters.Add(lockName);

        DbParameter timeout = command.CreateParameter();
        timeout.ParameterName = "@timeoutSeconds";
        timeout.Value = _settings.InitializationLockTimeoutSeconds;
        command.Parameters.Add(timeout);

        object? result = await command.ExecuteScalarAsync(cancellationToken);
        return Convert.ToInt32(result) == 1;
    }

    private static async Task ReleaseInitializationLockAsync(
        DbConnection connection,
        CancellationToken cancellationToken)
    {
        if (connection.State != System.Data.ConnectionState.Open)
            return;

        await using DbCommand command = connection.CreateCommand();
        command.CommandText = "SELECT RELEASE_LOCK(@lockName);";

        DbParameter lockName = command.CreateParameter();
        lockName.ParameterName = "@lockName";
        lockName.Value = InitializationLockName;
        command.Parameters.Add(lockName);

        await command.ExecuteScalarAsync(cancellationToken);
    }
}
