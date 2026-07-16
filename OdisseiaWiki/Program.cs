using System.Security.Claims;
using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using MySqlConnector;
using OdisseiaWiki.Data;
using OdisseiaWiki.Health;
using OdisseiaWiki.Repositories;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Security;
using OdisseiaWiki.Services;
using OdisseiaWiki.Services.Interfaces;
using OdisseiaWiki.Services.StorageProviders;
using OdisseiaWiki.Settings;
using Polly;
using Polly.Extensions.Http;

namespace OdisseiaWiki;

public class Program
{
    private const string FrontendCorsPolicy = "Frontend";

    public static async Task Main(string[] args)
    {
        WebApplicationBuilder builder = WebApplication.CreateBuilder(args);
        ConfigureListeningAddress(builder);

        builder.Logging.AddFilter("System.Net.Http.HttpClient", LogLevel.Warning);

        builder.Services.AddControllers()
            .AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
            });
        builder.Services.AddProblemDetails();

        builder.Services.AddOptions<JwtSettings>()
            .Bind(builder.Configuration.GetSection(JwtSettings.SectionName))
            .Validate(settings => !string.IsNullOrWhiteSpace(settings.Issuer), "Jwt:Issuer é obrigatório.")
            .Validate(settings => !string.IsNullOrWhiteSpace(settings.Audience), "Jwt:Audience é obrigatório.")
            .Validate(settings => Encoding.UTF8.GetByteCount(settings.ChaveSecreta) >= 32,
                "Jwt:ChaveSecreta deve possuir pelo menos 32 bytes.")
            .Validate(settings => settings.ExpiracaoHoras is > 0 and <= 720,
                "Jwt:ExpiracaoHoras deve estar entre 1 e 720.")
            .ValidateOnStart();

        builder.Services.AddOptions<AuthorizationSettings>()
            .Bind(builder.Configuration.GetSection(AuthorizationSettings.SectionName));

        builder.Services.AddOptions<GoogleAuthSettings>()
            .Bind(builder.Configuration.GetSection(GoogleAuthSettings.SectionName))
            .Validate(settings => !string.IsNullOrWhiteSpace(settings.ClientId),
                "GoogleAuth:ClientId é obrigatório.")
            .ValidateOnStart();

        builder.Services.AddOptions<UploadSettings>()
            .Bind(builder.Configuration.GetSection(UploadSettings.SectionName))
            .Validate(settings => settings.MaxFileSizeBytes is > 0 and <= 20 * 1024 * 1024,
                "Uploads:MaxFileSizeBytes deve estar entre 1 byte e 20 MB.")
            .ValidateOnStart();

        builder.Services.AddOptions<CloudinarySettings>()
            .Bind(builder.Configuration.GetSection(CloudinarySettings.SectionName))
            .Validate(
                settings => builder.Environment.IsDevelopment() && settings.UseLocalStorageInDevelopment ||
                    !string.IsNullOrWhiteSpace(settings.CloudName),
                "Cloudinary:CloudName é obrigatório quando o armazenamento local não está ativo.")
            .Validate(
                settings => builder.Environment.IsDevelopment() && settings.UseLocalStorageInDevelopment ||
                    !string.IsNullOrWhiteSpace(settings.ApiKey),
                "Cloudinary:ApiKey é obrigatória quando o armazenamento local não está ativo.")
            .Validate(
                settings => builder.Environment.IsDevelopment() && settings.UseLocalStorageInDevelopment ||
                    !string.IsNullOrWhiteSpace(settings.ApiSecret),
                "Cloudinary:ApiSecret é obrigatória quando o armazenamento local não está ativo.")
            .Validate(
                settings => !string.IsNullOrWhiteSpace(settings.RootFolder) &&
                    !settings.RootFolder.Contains("..", StringComparison.Ordinal) &&
                    !settings.RootFolder.Contains('\\'),
                "Cloudinary:RootFolder é inválida.")
            .ValidateOnStart();

        builder.Services.AddOptions<DatabaseSettings>()
            .Bind(builder.Configuration.GetSection(DatabaseSettings.SectionName))
            .Validate(settings => Version.TryParse(settings.ServerVersion, out _),
                "Database:ServerVersion deve ser uma versão válida, por exemplo 8.0.0.")
            .Validate(settings => settings.MaximumPoolSize is > 0 and <= 50,
                "Database:MaximumPoolSize deve estar entre 1 e 50.")
            .Validate(settings => settings.ConnectionIdleTimeoutSeconds is > 0 and <= 600,
                "Database:ConnectionIdleTimeoutSeconds deve estar entre 1 e 600.")
            .Validate(settings => settings.RetryCount is >= 0 and <= 10,
                "Database:RetryCount deve estar entre 0 e 10.")
            .Validate(settings => settings.RetryDelaySeconds is > 0 and <= 60,
                "Database:RetryDelaySeconds deve estar entre 1 e 60.")
            .Validate(settings => settings.InitializationRetrySeconds is > 0 and <= 300,
                "Database:InitializationRetrySeconds deve estar entre 1 e 300.")
            .Validate(settings => settings.InitializationLockTimeoutSeconds is > 0 and <= 120,
                "Database:InitializationLockTimeoutSeconds deve estar entre 1 e 120.")
            .ValidateOnStart();

        builder.Services.AddOptions<ForwardedHeadersSettings>()
            .Bind(builder.Configuration.GetSection(ForwardedHeadersSettings.SectionName));

        UploadSettings uploadSettings = builder.Configuration
            .GetSection(UploadSettings.SectionName)
            .Get<UploadSettings>() ?? new UploadSettings();
        builder.Services.Configure<FormOptions>(options =>
        {
            options.MultipartBodyLengthLimit = uploadSettings.MaxFileSizeBytes;
        });

        string connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection não configurada.");

        DatabaseSettings databaseSettings = builder.Configuration
            .GetSection(DatabaseSettings.SectionName)
            .Get<DatabaseSettings>() ?? new DatabaseSettings();
        connectionString = BuildDatabaseConnectionString(
            connectionString,
            databaseSettings,
            builder.Environment);
        Version databaseServerVersion = Version.Parse(databaseSettings.ServerVersion);

        builder.Services.AddDbContext<OdisseiaContext>(options =>
            options.UseMySql(
                connectionString,
                new MySqlServerVersion(databaseServerVersion),
                mySqlOptions => mySqlOptions.EnableRetryOnFailure(
                    databaseSettings.RetryCount,
                    TimeSpan.FromSeconds(databaseSettings.RetryDelaySeconds),
                    errorNumbersToAdd: null)));

        builder.Services.AddSingleton<DatabaseInitializationState>();
        builder.Services.AddHostedService<DatabaseInitializationService>();
        builder.Services.AddHealthChecks()
            .AddCheck<DatabaseReadinessHealthCheck>(
                "database",
                tags: new[] { "ready" });

        JwtSettings jwtSettings = builder.Configuration
            .GetSection(JwtSettings.SectionName)
            .Get<JwtSettings>() ?? new JwtSettings();

        builder.Services
            .AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
                options.SaveToken = false;
                options.MapInboundClaims = false;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = jwtSettings.Issuer,
                    ValidateAudience = true,
                    ValidAudience = jwtSettings.Audience,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwtSettings.ChaveSecreta)),
                    ValidateLifetime = true,
                    RequireExpirationTime = true,
                    RequireSignedTokens = true,
                    ClockSkew = TimeSpan.FromMinutes(1),
                    NameClaimType = "id",
                    RoleClaimType = "role",
                };
                options.Events = new JwtBearerEvents
                {
                    OnChallenge = async context =>
                    {
                        context.HandleResponse();
                        await WriteProblemAsync(
                            context.HttpContext,
                            StatusCodes.Status401Unauthorized,
                            "Não autenticado",
                            "É necessário fornecer um token válido para acessar este recurso.");
                    },
                    OnForbidden = context => WriteProblemAsync(
                        context.HttpContext,
                        StatusCodes.Status403Forbidden,
                        "Acesso negado",
                        "Você não possui permissão para executar esta operação."),
                };
            });

        builder.Services.AddAuthorization(options =>
        {
            options.AddPolicy(AuthorizationPolicies.Admin, policy =>
                policy.RequireAuthenticatedUser()
                    .RequireRole(AuthorizationPolicies.AdminRole));
        });

        builder.Services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = async (context, _) =>
            {
                await WriteProblemAsync(
                    context.HttpContext,
                    StatusCodes.Status429TooManyRequests,
                    "Muitas requisições",
                    "Aguarde alguns instantes antes de tentar novamente.");
            };
            options.AddPolicy("authentication", context =>
                RateLimitPartition.GetFixedWindowLimiter(
                    context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 15,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0,
                        AutoReplenishment = true,
                    }));
            options.AddPolicy("uploads", context =>
                RateLimitPartition.GetFixedWindowLimiter(
                    context.User.FindFirstValue("id")
                        ?? context.Connection.RemoteIpAddress?.ToString()
                        ?? "unknown",
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 20,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0,
                        AutoReplenishment = true,
                    }));
        });

        ConfigureCors(builder);
        ConfigureForwardedHeaders(builder);
        RegisterApplicationServices(builder.Services, builder.Configuration);

        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen();

        WebApplication app = builder.Build();

        ForwardedHeadersSettings forwardedHeadersSettings = app.Services
            .GetRequiredService<IOptions<ForwardedHeadersSettings>>()
            .Value;
        if (forwardedHeadersSettings.Enabled)
            app.UseForwardedHeaders();

        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.UseExceptionHandler(exceptionHandlerApp =>
        {
            exceptionHandlerApp.Run(async context =>
            {
                Exception? exception = context.Features.Get<IExceptionHandlerFeature>()?.Error;
                ILogger<Program> logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
                logger.LogError(exception, "Erro inesperado ao processar {Method} {Path}",
                    context.Request.Method, context.Request.Path);

                await WriteProblemAsync(
                    context,
                    StatusCodes.Status500InternalServerError,
                    "Erro interno",
                    "Não foi possível concluir a solicitação.");
            });
        });

        // Assets locais existem somente para compatibilidade no desenvolvimento.
        // Em produção, todas as imagens novas possuem URL pública do Cloudinary.
        if (app.Environment.IsDevelopment())
            app.UseStaticFiles();
        app.UseRouting();
        app.UseCors(FrontendCorsPolicy);
        app.UseAuthentication();
        app.UseRateLimiter();
        app.UseAuthorization();
        app.MapControllers();
        app.MapHealthChecks("/health", new HealthCheckOptions
        {
            Predicate = _ => false,
            ResponseWriter = WriteHealthResponseAsync,
        }).AllowAnonymous();
        app.MapHealthChecks("/health/ready", new HealthCheckOptions
        {
            Predicate = registration => registration.Tags.Contains("ready"),
            ResponseWriter = WriteHealthResponseAsync,
        }).AllowAnonymous();

        await app.RunAsync();
    }

    private static void ConfigureListeningAddress(WebApplicationBuilder builder)
    {
        string? portValue = Environment.GetEnvironmentVariable("PORT");
        if (string.IsNullOrWhiteSpace(portValue))
            return;

        if (!int.TryParse(portValue, out int port) || port is < 1 or > 65535)
            throw new InvalidOperationException("A variável PORT deve conter uma porta TCP válida.");

        builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
    }

    private static string BuildDatabaseConnectionString(
        string connectionString,
        DatabaseSettings settings,
        IWebHostEnvironment environment)
    {
        MySqlConnectionStringBuilder connectionBuilder = new(connectionString);
        connectionBuilder.MaximumPoolSize = Math.Min(
            connectionBuilder.MaximumPoolSize,
            settings.MaximumPoolSize);
        connectionBuilder.MinimumPoolSize = 0;
        connectionBuilder.ConnectionIdleTimeout = settings.ConnectionIdleTimeoutSeconds;

        if (!environment.IsDevelopment() &&
            connectionBuilder.SslMode is MySqlSslMode.None or MySqlSslMode.Preferred)
        {
            throw new InvalidOperationException(
                "A conexão MySQL de produção deve configurar SslMode=Required, VerifyCA ou VerifyFull.");
        }

        return connectionBuilder.ConnectionString;
    }

    private static void ConfigureForwardedHeaders(WebApplicationBuilder builder)
    {
        ForwardedHeadersSettings settings = builder.Configuration
            .GetSection(ForwardedHeadersSettings.SectionName)
            .Get<ForwardedHeadersSettings>() ?? new ForwardedHeadersSettings();
        if (!settings.Enabled)
            return;

        bool isRender = string.Equals(
            Environment.GetEnvironmentVariable("RENDER"),
            "true",
            StringComparison.OrdinalIgnoreCase);

        builder.Services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders =
                ForwardedHeaders.XForwardedFor |
                ForwardedHeaders.XForwardedProto;
            options.ForwardLimit = 1;

            if (isRender)
            {
                // O origin do Web Service não é acessível diretamente e o Render é o único
                // proxy de entrada. Limitamos o processamento ao hop mais próximo.
                options.KnownNetworks.Clear();
                options.KnownProxies.Clear();
                return;
            }

            foreach (string proxyValue in settings.KnownProxies)
            {
                if (!IPAddress.TryParse(proxyValue, out IPAddress? proxyAddress))
                    throw new InvalidOperationException(
                        "ForwardedHeaders:KnownProxies contém um endereço IP inválido.");

                options.KnownProxies.Add(proxyAddress);
            }
        });
    }

    private static void ConfigureCors(WebApplicationBuilder builder)
    {
        List<string> allowedOrigins = builder.Configuration
            .GetSection("Cors:AllowedOrigins")
            .Get<string[]>()?
            .Where(origin => !string.IsNullOrWhiteSpace(origin))
            .Select(origin => origin.Trim().TrimEnd('/'))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList() ?? new List<string>();

        if (builder.Environment.IsDevelopment())
        {
            allowedOrigins.AddRange(new[]
            {
                "http://localhost:5173",
                "http://127.0.0.1:5173",
            });
        }

        allowedOrigins = allowedOrigins.Distinct(StringComparer.OrdinalIgnoreCase).ToList();

        if (allowedOrigins.Any(origin => origin.Contains('*')))
            throw new InvalidOperationException("Cors:AllowedOrigins não aceita wildcard.");

        if (!builder.Environment.IsDevelopment() && allowedOrigins.Count == 0)
            throw new InvalidOperationException("Configure ao menos uma origem em Cors:AllowedOrigins.");

        builder.Services.AddCors(options =>
        {
            options.AddPolicy(FrontendCorsPolicy, policy =>
            {
                policy.WithOrigins(allowedOrigins.ToArray())
                    .AllowAnyHeader()
                    .AllowAnyMethod();
            });
        });
    }

    private static void RegisterApplicationServices(IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<ITokenService, TokenService>();

        services.AddScoped<IUsuarioRepository, UsuarioRepository>();
        services.AddScoped<IPersonagemRepository, PersonagemRepository>();
        services.AddScoped<IPersonagemJogadorRepository, PersonagemJogadorRepository>();
        services.AddScoped<IRacaRepository, RacaRepository>();
        services.AddScoped<ICidadeRepository, CidadeRepository>();
        services.AddScoped<IItemRepository, ItemRepository>();
        services.AddScoped<IMesaRepository, MesaRepository>();
        services.AddScoped<IMesaEntidadeConfigRepository, MesaEntidadeConfigRepository>();
        services.AddScoped<IInfoLoreRepository, InfoLoreRepository>();
        services.AddScoped<IPageRepository, PageRepository>();
        services.AddScoped<IAssetReferenceRepository, AssetReferenceRepository>();

        services.AddScoped<IUsuarioService, UsuarioService>();
        services.AddScoped<IPersonagemService, PersonagemService>();
        services.AddScoped<IPersonagemJogadorService, PersonagemJogadorService>();
        services.AddScoped<IRacaService, RacaService>();
        services.AddScoped<ICidadeService, CidadeService>();
        services.AddScoped<IItemService, ItemService>();
        services.AddScoped<IMesaService, MesaService>();
        services.AddScoped<IMesaEntidadeConfigService, MesaEntidadeConfigService>();
        services.AddScoped<IInfoLoreService, InfoLoreService>();
        services.AddScoped<IPageService, PageService>();

        services.Configure<ImgBBSettings>(configuration.GetSection("ImgBB"));
        services.AddScoped<ILocalStorageProvider, LocalStorageProvider>();
        services.AddScoped<ICloudinaryStorageProvider, CloudinaryStorageProvider>();
        services.AddHttpClient<IImgBBStorageProvider, ImgBBStorageProvider>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(30);
        })
        .SetHandlerLifetime(TimeSpan.FromMinutes(5))
        .AddPolicyHandler(HttpPolicyExtensions
            .HandleTransientHttpError()
            .WaitAndRetryAsync(new[]
            {
                TimeSpan.FromSeconds(1),
                TimeSpan.FromSeconds(2),
                TimeSpan.FromSeconds(4),
            }));
        services.AddScoped<IAssetService, AssetService>();
    }

    private static async Task WriteProblemAsync(
        HttpContext context,
        int statusCode,
        string title,
        string detail)
    {
        if (context.Response.HasStarted)
            return;

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/problem+json";

        ProblemDetails problem = new()
        {
            Status = statusCode,
            Title = title,
            Detail = detail,
            Instance = context.Request.Path,
        };
        problem.Extensions["traceId"] = context.TraceIdentifier;

        await context.Response.WriteAsync(JsonSerializer.Serialize(problem));
    }

    private static Task WriteHealthResponseAsync(HttpContext context, HealthReport report)
    {
        context.Response.ContentType = "application/json; charset=utf-8";
        return context.Response.WriteAsync(JsonSerializer.Serialize(new
        {
            status = report.Status.ToString(),
        }));
    }
}
