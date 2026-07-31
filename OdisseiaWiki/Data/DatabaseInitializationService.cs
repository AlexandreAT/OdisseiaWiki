using System.Data.Common;
using System.Diagnostics;
using System.Net.Sockets;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using MySqlConnector;
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
            _logger.LogInformation(
                "Migrations e seeder automáticos estão desativados. " +
                "A conectividade inicial com o banco ainda será validada.");
        }

        int attempt = 0;
        while (!stoppingToken.IsCancellationRequested)
        {
            attempt++;
            Stopwatch attemptStopwatch = Stopwatch.StartNew();
            try
            {
                await InitializeAsync(stoppingToken);
                attemptStopwatch.Stop();
                _state.MarkInitializedAndAvailable();
                _logger.LogInformation(
                    "Banco inicializado com sucesso na tentativa {Attempt}, em {AttemptDurationMs} ms. " +
                    "Migrations: {ApplyMigrations}; Seeder: {SeedOnStartup}.",
                    attempt,
                    attemptStopwatch.ElapsedMilliseconds,
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
                attemptStopwatch.Stop();
                _state.MarkUnavailable();
                LogInitializationFailure(
                    exception,
                    attempt,
                    attemptStopwatch.ElapsedMilliseconds);

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
        bool lockAcquired = false;

        try
        {
            if (!_settings.ApplyMigrationsOnStartup && !_settings.SeedOnStartup)
                return;

            lockAcquired = await TryAcquireInitializationLockAsync(
                context.Database.GetDbConnection(),
                cancellationToken);

            if (!lockAcquired)
                throw new InvalidOperationException(
                    "Não foi possível obter o lock de inicialização do banco.");

            if (_settings.ApplyMigrationsOnStartup)
                await context.Database.MigrateAsync(cancellationToken);

            if (_settings.SeedOnStartup)
                await DatabaseSeeder.SeedAsync(scope.ServiceProvider);
        }
        finally
        {
            if (lockAcquired)
            {
                await ReleaseInitializationLockBestEffortAsync(
                    context.Database.GetDbConnection(),
                    cancellationToken);
            }

            await CloseConnectionBestEffortAsync(context);
        }
    }

    private void LogInitializationFailure(
        Exception exception,
        int attempt,
        long attemptDurationMilliseconds)
    {
        Exception rootException = exception.GetBaseException();
        MySqlException? mySqlException = FindException<MySqlException>(exception);
        SocketException? socketException = FindException<SocketException>(exception);
        string exceptionChain = BuildExceptionChain(exception);

        if (mySqlException is not null || socketException is not null)
        {
            _logger.LogWarning(
                "Inicialização do banco falhou na tentativa {Attempt}. " +
                "Categoria: {FailureCategory}; cadeia de exceções: {ExceptionChain}; " +
                "exceção interna final: {RootExceptionType}; " +
                "código MySQL: {MySqlErrorNumber}; SQL state: {SqlState}; transitório: {IsTransient}. " +
                "Socket error: {SocketErrorCode}; código nativo do socket: {SocketNativeErrorCode}. " +
                "A tentativa durou {AttemptDurationMs} ms. Nova tentativa em {RetryAfterSeconds} " +
                "segundos, sem encerrar a API.",
                attempt,
                ClassifyFailure(mySqlException, socketException),
                exceptionChain,
                rootException.GetType().Name,
                mySqlException?.Number,
                mySqlException?.SqlState,
                mySqlException?.IsTransient,
                socketException?.SocketErrorCode,
                socketException?.NativeErrorCode,
                attemptDurationMilliseconds,
                _settings.InitializationRetrySeconds);
            return;
        }

        _logger.LogWarning(
            "Inicialização do banco falhou na tentativa {Attempt}. " +
            "Categoria: {FailureCategory}; cadeia de exceções: {ExceptionChain}; " +
            "exceção interna final: {RootExceptionType}; " +
            "HResult interno: {RootHResult}. A tentativa durou {AttemptDurationMs} ms. " +
            "Nova tentativa em {RetryAfterSeconds} segundos, sem encerrar a API.",
            attempt,
            "Não classificada",
            exceptionChain,
            rootException.GetType().Name,
            rootException.HResult,
            attemptDurationMilliseconds,
            _settings.InitializationRetrySeconds);
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

    private static string BuildExceptionChain(Exception exception)
    {
        List<string> exceptionTypes = [];
        Exception? current = exception;

        while (current is not null)
        {
            exceptionTypes.Add(current.GetType().Name);
            current = current.InnerException;
        }

        return string.Join(" -> ", exceptionTypes);
    }

    private static string ClassifyFailure(
        MySqlException? mySqlException,
        SocketException? socketException)
    {
        if (socketException is not null)
        {
            return socketException.SocketErrorCode switch
            {
                SocketError.HostNotFound or SocketError.TryAgain or SocketError.NoData =>
                    "Falha de resolução DNS",
                SocketError.TimedOut => "Timeout de rede",
                SocketError.ConnectionRefused or SocketError.ConnectionReset or
                    SocketError.ConnectionAborted => "Conexão de rede recusada ou interrompida",
                _ => "Falha de rede",
            };
        }

        return mySqlException?.Number switch
        {
            1040 => "Limite de conexões do MySQL",
            1042 => "Servidor MySQL inacessível (rede, DNS ou TLS)",
            1045 => "Autenticação MySQL recusada",
            1049 => "Banco de dados inexistente",
            _ when mySqlException?.IsTransient == true => "Falha transitória do MySQL",
            _ => "Falha do MySQL",
        };
    }

    private async Task<bool> TryAcquireInitializationLockAsync(
        DbConnection connection,
        CancellationToken cancellationToken)
    {
        await using DbCommand command = connection.CreateCommand();
        command.CommandText = "SELECT GET_LOCK(@lockName, @timeoutSeconds);";
        command.CommandTimeout = _settings.InitializationLockTimeoutSeconds + 5;

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

    private async Task ReleaseInitializationLockBestEffortAsync(
        DbConnection connection,
        CancellationToken cancellationToken)
    {
        if (connection.State != System.Data.ConnectionState.Open)
            return;

        try
        {
            await using DbCommand command = connection.CreateCommand();
            command.CommandText = "SELECT RELEASE_LOCK(@lockName);";

            DbParameter lockName = command.CreateParameter();
            lockName.ParameterName = "@lockName";
            lockName.Value = InitializationLockName;
            command.Parameters.Add(lockName);

            await command.ExecuteScalarAsync(cancellationToken);
        }
        catch (Exception exception)
        {
            Exception rootException = exception.GetBaseException();
            _logger.LogDebug(
                "Não foi possível liberar explicitamente o lock de inicialização. " +
                "Exceção externa: {OuterExceptionType}; exceção interna: {RootExceptionType}. " +
                "O MySQL libera o lock quando a conexão é encerrada.",
                exception.GetType().Name,
                rootException.GetType().Name);
        }
    }

    private async Task CloseConnectionBestEffortAsync(OdisseiaContext context)
    {
        try
        {
            await context.Database.CloseConnectionAsync();
        }
        catch (Exception exception)
        {
            Exception rootException = exception.GetBaseException();
            _logger.LogDebug(
                "Não foi possível fechar explicitamente a conexão de inicialização. " +
                "Exceção externa: {OuterExceptionType}; exceção interna: {RootExceptionType}.",
                exception.GetType().Name,
                rootException.GetType().Name);
        }
    }
}
