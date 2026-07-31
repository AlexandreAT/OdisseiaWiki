using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using OdisseiaWiki.Data;
using OdisseiaWiki.Settings;

namespace OdisseiaWiki.Middleware;

public sealed class DatabaseReadinessMiddleware
{
    private readonly RequestDelegate _next;
    private readonly DatabaseInitializationState _initializationState;
    private readonly DatabaseSettings _settings;

    public DatabaseReadinessMiddleware(
        RequestDelegate next,
        DatabaseInitializationState initializationState,
        IOptions<DatabaseSettings> options)
    {
        _next = next;
        _initializationState = initializationState;
        _settings = options.Value;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (!context.Request.Path.StartsWithSegments("/api") ||
            _initializationState.IsReady)
        {
            await _next(context);
            return;
        }

        context.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
        context.Response.ContentType = "application/problem+json";
        context.Response.Headers.RetryAfter =
            Math.Max(1, _settings.InitializationRetrySeconds).ToString();

        ProblemDetails problem = new()
        {
            Status = StatusCodes.Status503ServiceUnavailable,
            Title = "Servidor em inicialização",
            Detail = "O servidor ainda está concluindo a conexão com o banco de dados. " +
                "Tente novamente em alguns instantes.",
            Instance = context.Request.Path,
        };
        problem.Extensions["traceId"] = context.TraceIdentifier;

        await context.Response.WriteAsync(
            JsonSerializer.Serialize(problem),
            context.RequestAborted);
    }
}
