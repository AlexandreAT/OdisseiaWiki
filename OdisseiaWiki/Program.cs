using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Data;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Repositories;
using OdisseiaWiki.Services;
using OdisseiaWiki.Services.Interfaces;
using OdisseiaWiki.Services.StorageProviders;
using OdisseiaWiki.Settings;
using Polly;
using Polly.Extensions.Http;
using System.Net.Http;
using System;

namespace OdisseiaWiki
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.
            builder.Services.AddControllers();

            builder.Services.AddDbContext<OdisseiaContext>(options =>
                options.UseMySql(
                    builder.Configuration.GetConnectionString("DefaultConnection"),
                    ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("DefaultConnection"))
                )
            );

            builder.Services.AddScoped<ITokenService, TokenService>();

            // Registrando o repositório
            builder.Services.AddScoped<IUsuarioRepository, UsuarioRepository>();
            builder.Services.AddScoped<IPersonagemRepository, PersonagemRepository>();
            builder.Services.AddScoped<IPersonagemJogadorRepository, PersonagemJogadorRepository>();
            builder.Services.AddScoped<IRacaRepository, RacaRepository>();
            builder.Services.AddScoped<ICidadeRepository, CidadeRepository>();
            builder.Services.AddScoped<IItemRepository, ItemRepository>();
            builder.Services.AddScoped<IMesaRepository, MesaRepository>();

            // Registrando os serviços de domínio
            builder.Services.AddScoped<IUsuarioService, UsuarioService>();
            builder.Services.AddScoped<IPersonagemService, PersonagemService>();
            builder.Services.AddScoped<IPersonagemJogadorService, PersonagemJogadorService>();
            builder.Services.AddScoped<IRacaService, RacaService>();
            builder.Services.AddScoped<ICidadeService, CidadeService>();
            builder.Services.AddScoped<IItemService, ItemService>();
            builder.Services.AddScoped<IMesaService, MesaService>();

            // --- Configuração ImgBB: carregar seção ImgBB do appsettings para IOptions<ImgBBSettings>
            builder.Services.Configure<ImgBBSettings>(builder.Configuration.GetSection("ImgBB"));

            // --- Registro dos providers de storage (necessários para AssetService)
            // Local storage provider (implementa ILocalStorageProvider)
            builder.Services.AddScoped<ILocalStorageProvider, LocalStorageProvider>();

            // ImgBB provider via HttpClientFactory + retry policy (Polly)
            builder.Services.AddHttpClient<IImgBBStorageProvider, ImgBBStorageProvider>(client =>
            {
                // endpoint configurado via ImgBBSettings; aqui podemos definir timeouts padrão
                client.Timeout = TimeSpan.FromSeconds(30);
            })
            .SetHandlerLifetime(TimeSpan.FromMinutes(5))
            .AddPolicyHandler(HttpPolicyExtensions
                .HandleTransientHttpError()
                .WaitAndRetryAsync(new[] { TimeSpan.FromSeconds(1), TimeSpan.FromSeconds(2), TimeSpan.FromSeconds(4) }));

            // AssetService agora depende dos providers registrados acima
            builder.Services.AddScoped<IAssetService, AssetService>();

            // CORS
            builder.Services.AddCors(options =>
            {
                options.AddDefaultPolicy(policy =>
                {
                    policy
                        .AllowAnyOrigin()
                        .AllowAnyHeader()
                        .AllowAnyMethod();
                });
            });

            // Swagger/OpenAPI
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            var app = builder.Build();

            if (app.Environment.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
                app.UseCors();
            }

            app.UseStaticFiles();

            app.UseAuthorization();

            app.MapControllers();

            app.Run();
        }
    }
}
