using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Data;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Repositories;
using OdisseiaWiki.Services;
using OdisseiaWiki.Services.Interfaces;

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

            // Registrando o serviço
            builder.Services.AddScoped<IUsuarioService, UsuarioService>();
            builder.Services.AddScoped<IAssetService, AssetService>();
            builder.Services.AddScoped<IPersonagemService, PersonagemService>();
            builder.Services.AddScoped<IPersonagemJogadorService, PersonagemJogadorService>();
            builder.Services.AddScoped<IRacaService, RacaService>();
            builder.Services.AddScoped<ICidadeService, CidadeService>();
            builder.Services.AddScoped<IItemService, ItemService>();
            builder.Services.AddScoped<IMesaService, MesaService>();

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

            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            var app = builder.Build();

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
