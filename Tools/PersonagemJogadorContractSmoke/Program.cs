using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using OdisseiaWiki.Controllers;
using OdisseiaWiki.Data;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories;
using OdisseiaWiki.Services;
using OdisseiaWiki.Services.Interfaces;

string repositoryRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../../"));
string backendRoot = Path.Combine(repositoryRoot, "OdisseiaWiki");
IConfiguration configuration = new ConfigurationBuilder()
    .SetBasePath(backendRoot)
    .AddJsonFile("appsettings.json", optional: true)
    .AddJsonFile("appsettings.Development.json", optional: true)
    .AddEnvironmentVariables()
    .Build();

string connectionString = configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection não configurada.");

DbContextOptions<OdisseiaContext> options = new DbContextOptionsBuilder<OdisseiaContext>()
    .UseMySql(connectionString, ServerVersion.AutoDetect(connectionString))
    .Options;

await using OdisseiaContext context = new(options);
await using var transaction = await context.Database.BeginTransactionAsync();

string suffix = Guid.NewGuid().ToString("N")[..12];
Usuario user = new()
{
    Nome = $"Smoke {suffix}",
    Email = $"smoke-{suffix}@example.invalid",
    Nickname = $"smoke-{suffix}",
    Senha = "not-used",
    DataRegistro = DateTime.UtcNow,
    DataCriacao = DateTime.UtcNow,
};
Raca race = new()
{
    Nome = $"Smoke race {suffix}",
    DataCriacao = DateTime.UtcNow,
};
context.Usuarios.Add(user);
context.Racas.Add(race);
await context.SaveChangesAsync();

Mesa mesa = new()
{
    Nome = $"Smoke mesa {suffix}",
    IdusuarioCriacao = user.Idusuario,
    DataCriacao = DateTime.UtcNow,
};
context.Mesas.Add(mesa);
await context.SaveChangesAsync();

AssetReferenceRepository assetReferenceRepository = new(context);
FakeAssetService assetService = new(assetReferenceRepository);
MesaRepository mesaRepository = new(context);
MesaService mesaService = new(mesaRepository, assetService);
PersonagemJogadorRepository personagemRepository = new(context);
PersonagemJogadorService service = new(
    personagemRepository,
    mesaRepository,
    mesaService,
    assetService);
PersonagemJogadorController controller = new(service)
{
    ControllerContext = new ControllerContext
    {
        HttpContext = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(
                [new Claim(ClaimTypes.NameIdentifier, user.Idusuario.ToString())],
                "smoke")),
        },
    },
};

string oldImageUrl = $"https://res.cloudinary.com/test/image/upload/v1/odisseia/smoke/{suffix}-old.webp";
string newImageUrl = $"https://res.cloudinary.com/test/image/upload/v1/odisseia/smoke/{suffix}-new.webp";
PersonagemJogadorDto linkedPayload = CreatePayload($"Smoke linked {suffix}", race.Idraca, mesa.Idmesa);
linkedPayload.Imagem = oldImageUrl;
IActionResult createResult = await controller.Create(linkedPayload);
CreatedAtActionResult created = AssertType<CreatedAtActionResult>(createResult, "POST vinculado");
Assert(created.StatusCode == StatusCodes.Status201Created, "POST vinculado não retornou 201.");
ResultPersonagemJogador createdBody = AssertType<ResultPersonagemJogador>(created.Value, "corpo do POST");
Assert(createdBody.Sucesso && createdBody.Personagem is not null, "POST não retornou resumo de sucesso.");
AssertSafeJson(createdBody);

int linkedId = createdBody.Personagem!.IdpersonagemJogador;
int linkedCount = await context.PersonagemJogadores.CountAsync(entity => entity.Nome == linkedPayload.Nome);
Assert(linkedCount == 1, "O POST criou registro duplicado.");

PersonagemJogadorDto updatePayload = CreatePayload($"Smoke updated {suffix}", race.Idraca, mesa.Idmesa);
updatePayload.Imagem = newImageUrl;
IActionResult updateResult = await controller.Update(linkedId, updatePayload);
OkObjectResult updated = AssertType<OkObjectResult>(updateResult, "PUT");
ResultPersonagemJogador updatedBody = AssertType<ResultPersonagemJogador>(updated.Value, "corpo do PUT");
Assert(updatedBody.Sucesso && updatedBody.Personagem?.Nome == updatePayload.Nome, "PUT não retornou o resumo atualizado.");
AssertSafeJson(updatedBody);
Assert(assetService.DeleteChecks == 1, "PUT com troca de imagem nao verificou a imagem removida.");
Assert(assetService.LastCheckedAsset == oldImageUrl, "PUT verificou uma imagem removida inesperada.");

string cityGalleryUrl = $"https://res.cloudinary.com/test/image/upload/v1/odisseia/smoke/{suffix}-city-gallery.webp";
CidadeService cidadeService = new(new CidadeRepository(context), assetService);
ResultCidade cidadeCriada = await cidadeService.CreateAsync(new CidadeDto
{
    Nome = $"Smoke city {suffix}",
    Imagem = newImageUrl,
    GaleriaImagem = [cityGalleryUrl],
    PontosDeInteresse = [new PontoDeInteresseDto { Id = 1, Titulo = "Smoke point" }],
});
Assert(cidadeCriada.Sucesso && cidadeCriada.Cidade is not null, "Falha ao preparar cidade para teste.");
ResultCidade cidadeAtualizada = await cidadeService.UpdateAsync(cidadeCriada.Cidade!.Idcidade, new CidadeDto
{
    Nome = cidadeCriada.Cidade.Nome,
    Imagem = cidadeCriada.Cidade.Imagem,
    GaleriaImagem = [],
    PontosDeInteresse = [],
});
Assert(cidadeAtualizada.Cidade?.GaleriaImagem is null, "Lista vazia nao removeu a galeria da cidade.");
Assert(cidadeAtualizada.Cidade?.PontosDeInteresse is null, "Lista vazia nao removeu os pontos da cidade.");
Assert(assetService.CheckedAssets.Contains(cityGalleryUrl), "Galeria removida da cidade nao passou pela limpeza.");

string raceGalleryUrl = $"https://res.cloudinary.com/test/image/upload/v1/odisseia/smoke/{suffix}-race-gallery.webp";
race.GaleriaImagem = JsonSerializer.Serialize(new[] { raceGalleryUrl });
await context.SaveChangesAsync();
MesaEntidadeConfigRepository configRepository = new(context);
MesaEntidadeConfigService configService = new(configRepository, mesaRepository);
RacaService racaService = new(new RacaRepository(context), configService, assetService);
ResultRaca racaAtualizada = await racaService.UpdateAsync(race.Idraca, new RacaDto
{
    Nome = race.Nome,
    Imagem = race.Imagem,
    GaleriaImagem = [],
});
Assert(racaAtualizada.Sucesso, "Falha ao atualizar raca no teste.");
Raca? raceAfterUpdate = await context.Racas.FindAsync(race.Idraca);
Assert(raceAfterUpdate?.GaleriaImagem is null, "Lista vazia nao removeu a galeria da raca.");
Assert(assetService.CheckedAssets.Contains(raceGalleryUrl), "Galeria removida da raca nao passou pela limpeza.");

IActionResult getResult = await controller.GetById(linkedId);
OkObjectResult found = AssertType<OkObjectResult>(getResult, "GET por ID");
PersonagemJogadorDto foundBody = AssertType<PersonagemJogadorDto>(found.Value, "corpo do GET por ID");
Assert(foundBody.IdpersonagemJogador == linkedId && foundBody.Nome == updatePayload.Nome, "GET não encontrou o personagem atualizado.");
AssertSafeJson(foundBody);

PersonagemJogadorDto defaultMesaPayload = CreatePayload($"Smoke default {suffix}", race.Idraca, 0);
IActionResult defaultMesaResult = await controller.Create(defaultMesaPayload);
CreatedAtActionResult defaultMesaCreated = AssertType<CreatedAtActionResult>(defaultMesaResult, "POST sem mesa");
ResultPersonagemJogador defaultMesaBody = AssertType<ResultPersonagemJogador>(defaultMesaCreated.Value, "corpo do POST sem mesa");
Assert(defaultMesaBody.Personagem is { Idmesa: > 0 }, "POST sem mesa não aplicou a mesa padrão.");
AssertSafeJson(defaultMesaBody);

int totalCreated = await context.PersonagemJogadores.CountAsync(entity =>
    entity.Nome == updatePayload.Nome || entity.Nome == defaultMesaPayload.Nome);
Assert(totalCreated == 2, "Quantidade inesperada de registros após os dois cenários.");

await transaction.RollbackAsync();
Console.WriteLine("OK: POST vinculado=201; POST sem mesa=201; PUT=200; GET=200; JSON sem ciclos; sem duplicação; transação revertida.");
return 0;

static PersonagemJogadorDto CreatePayload(string name, int raceId, int mesaId) => new()
{
    Nome = name,
    Idraca = raceId,
    Idmesa = mesaId,
    Historia = JsonSerializer.SerializeToElement(new { type = "doc", content = Array.Empty<object>() }),
    Costumes = [],
    Tracos = [],
    GaleriaImagem = [],
    InventarioJson = Array.Empty<object>(),
    Skills = Array.Empty<object>(),
    Magia = Array.Empty<object>(),
    PersonagemsVinculados = [],
    Implantes = [],
    DataCriacao = DateTime.UtcNow,
    StatusJson = new
    {
        status = new
        {
            vida = 100,
            vidaMaxima = 100,
            estamina = 50,
            estaminaMaxima = 50,
            mana = 30,
            manaMaxima = 30,
            capacidadeCarga = 10,
        },
        atributos = new
        {
            principais = new { resistencia = 1 },
            secundarios = new { sanidade = 1 },
        },
        nivel = 1,
        xp = 0,
        defesas = new { armadura = 0 },
    },
};

static void AssertSafeJson(object value)
{
    string json = JsonSerializer.Serialize(value, new JsonSerializerOptions(JsonSerializerDefaults.Web));
    Assert(!json.Contains("\"$id\"", StringComparison.Ordinal), "JSON contém $id.");
    Assert(!json.Contains("\"$ref\"", StringComparison.Ordinal), "JSON contém $ref.");
    Assert(!json.Contains("\"mesa\":", StringComparison.OrdinalIgnoreCase), "JSON expôs a navegação Mesa.");
    Assert(!json.Contains("\"personagensJogadores\":", StringComparison.OrdinalIgnoreCase), "JSON expôs coleção circular.");
}

static T AssertType<T>(object? value, string operation) where T : class
    => value as T ?? throw new InvalidOperationException($"Tipo inesperado em {operation}: {value?.GetType().Name ?? "null"}.");

static void Assert(bool condition, string message)
{
    if (!condition)
        throw new InvalidOperationException(message);
}

internal sealed class FakeAssetService : IAssetService
{
    private readonly AssetReferenceRepository _assetReferences;

    public FakeAssetService(AssetReferenceRepository assetReferences)
    {
        _assetReferences = assetReferences;
    }

    public int DeleteChecks { get; private set; }
    public string? LastCheckedAsset { get; private set; }
    public List<string> CheckedAssets { get; } = [];

    public Task<ResultSaveImage> SaveImageAsync(
        IFormFile file,
        string type,
        string entityName,
        string? folderName = null)
        => throw new NotSupportedException();

    public async Task<bool> DeleteIfUnreferencedAsync(
        string? assetUrl,
        CancellationToken cancellationToken = default)
    {
        DeleteChecks++;
        LastCheckedAsset = assetUrl;
        if (!string.IsNullOrWhiteSpace(assetUrl)) CheckedAssets.Add(assetUrl);
        return string.IsNullOrWhiteSpace(assetUrl) ||
            !await _assetReferences.IsReferencedAsync(assetUrl, cancellationToken);
    }
}
