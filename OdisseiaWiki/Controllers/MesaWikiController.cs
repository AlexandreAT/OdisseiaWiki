using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;
using OdisseiaWiki.Security;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Controllers;

/// <summary>
/// Endpoints contextuais da Wiki de uma Mesa. Nenhuma consulta desta rota
/// reutiliza os endpoints globais sem passar pelo resolvedor de escopo.
/// </summary>
[ApiController]
[Authorize]
[Route("api/mesas/{idMesa:int}/wiki")]
public sealed class MesaWikiController : ControllerBase
{
    private readonly IWikiMesaService _service;
    private readonly IAssetService _assetService;

    public MesaWikiController(IWikiMesaService service, IAssetService assetService)
    {
        _service = service;
        _assetService = assetService;
    }

    [HttpGet]
    public async Task<IActionResult> GetResumo(int idMesa) =>
        Responder(await _service.GetResumoAsync(idMesa, IdUsuario(), User.IsAdmin()));

    [HttpGet("search")]
    public async Task<IActionResult> Buscar(int idMesa, [FromQuery] string termo = "") =>
        Responder(await _service.BuscarAsync(idMesa, IdUsuario(), User.IsAdmin(), termo));

    [HttpGet("graph")]
    public async Task<IActionResult> GetGraph(
        int idMesa,
        [FromQuery] bool incluirWikiGeral = false,
        CancellationToken cancellationToken = default) =>
        Responder(await _service.GetGraphAsync(
            idMesa,
            IdUsuario(),
            User.IsAdmin(),
            incluirWikiGeral,
            cancellationToken));

    [HttpPost("assets")]
    [EnableRateLimiting("uploads")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(20 * 1024 * 1024)]
    public async Task<IActionResult> UploadAsset(
        int idMesa,
        [FromForm] IFormFile file,
        [FromForm] string type,
        [FromForm] string entityName,
        [FromForm] string? folderName = null)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { mensagemErro = "Nenhum arquivo enviado." });

        string tipoNormalizado = type?.Trim().ToLowerInvariant() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(entityName) || tipoNormalizado is not (
            "cidade" or "cidades" or "item" or "itens" or "pages" or "pages/gallery" or
            "pages/images" or "personagem" or "personagens" or "raca" or "racas"))
        {
            return BadRequest("Destino do arquivo invÃ¡lido.");
        }

        WikiMesaOperacaoResultado<bool> acesso = await _service.PodeGerenciarAsync(idMesa, IdUsuario(), User.IsAdmin());
        if (!acesso.Sucesso)
            return MapearFalha(acesso);
        if (!acesso.Dados)
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                mensagemErro = "Somente o mestre pode enviar imagens para a Wiki desta Mesa."
            });

        ResultSaveImage resultado = await _assetService.SaveImageAsync(
            file,
            "mesawiki",
            $"mesa-{idMesa}-{tipoNormalizado}-{entityName}",
            folderName);
        if (!resultado.Sucesso)
            return BadRequest(new
            {
                mensagemErro = resultado.MensagemErro ?? "Não foi possível salvar a imagem."
            });

        return Ok(new
        {
            path = resultado.Path,
            url = resultado.Url,
            provider = resultado.Provider,
            publicId = resultado.PublicId,
        });
    }

    [HttpGet("pages")]
    public async Task<IActionResult> GetPaginas(int idMesa, [FromQuery] bool proprias = false, [FromQuery] bool? visivel = null) =>
        Responder(await _service.GetPaginasAsync(idMesa, IdUsuario(), User.IsAdmin(), proprias, visivel));

    [HttpGet("pages/id/{idPagina:int}")]
    public async Task<IActionResult> GetPaginaPorId(int idMesa, int idPagina) =>
        Responder(await _service.GetPaginaPorIdAsync(idMesa, IdUsuario(), User.IsAdmin(), idPagina));

    [HttpGet("pages/referencing/{tipoEntidade}/{idEntidade}")]
    public async Task<IActionResult> GetPaginasReferenciando(
        int idMesa,
        string tipoEntidade,
        string idEntidade,
        [FromQuery] bool? visivel = null) =>
        Responder(await _service.GetPaginasReferenciandoAsync(
            idMesa, IdUsuario(), User.IsAdmin(), tipoEntidade, idEntidade, visivel));

    [HttpGet("pages/{slug}")]
    public async Task<IActionResult> GetPagina(int idMesa, string slug) =>
        Responder(await _service.GetPaginaPorSlugAsync(idMesa, IdUsuario(), User.IsAdmin(), slug));

    [HttpPost("pages")]
    public async Task<IActionResult> CriarPagina(int idMesa, [FromBody] CreatePageWithBlocksDto dto) =>
        Responder(await _service.CriarPaginaAsync(idMesa, IdUsuario(), User.IsAdmin(), dto));

    [HttpPut("pages/{idPagina:int}")]
    public async Task<IActionResult> AtualizarPagina(int idMesa, int idPagina, [FromBody] CreatePageWithBlocksDto dto) =>
        Responder(await _service.AtualizarPaginaAsync(idMesa, IdUsuario(), User.IsAdmin(), idPagina, dto));

    [HttpDelete("pages/{idPagina:int}")]
    public async Task<IActionResult> ExcluirPagina(int idMesa, int idPagina) =>
        ResponderNoContent(await _service.ExcluirPaginaAsync(idMesa, IdUsuario(), User.IsAdmin(), idPagina));

    [HttpGet("cidades")]
    public async Task<IActionResult> GetCidades(int idMesa, [FromQuery] bool proprias = false, [FromQuery] bool? visivel = null) =>
        Responder(await _service.GetCidadesAsync(idMesa, IdUsuario(), User.IsAdmin(), proprias, visivel));

    [HttpGet("cidades/{idCidade:int}")]
    public async Task<IActionResult> GetCidade(int idMesa, int idCidade) =>
        Responder(await _service.GetCidadeAsync(idMesa, IdUsuario(), User.IsAdmin(), idCidade));

    [HttpPost("cidades")]
    public async Task<IActionResult> CriarCidade(int idMesa, [FromBody] CidadeDto dto) =>
        Responder(await _service.CriarCidadeAsync(idMesa, IdUsuario(), User.IsAdmin(), dto));

    [HttpPut("cidades/{idCidade:int}")]
    public async Task<IActionResult> AtualizarCidade(int idMesa, int idCidade, [FromBody] CidadeDto dto) =>
        Responder(await _service.AtualizarCidadeAsync(idMesa, IdUsuario(), User.IsAdmin(), idCidade, dto));

    [HttpDelete("cidades/{idCidade:int}")]
    public async Task<IActionResult> ExcluirCidade(int idMesa, int idCidade) =>
        ResponderNoContent(await _service.ExcluirCidadeAsync(idMesa, IdUsuario(), User.IsAdmin(), idCidade));

    [HttpGet("racas")]
    public async Task<IActionResult> GetRacas(int idMesa, [FromQuery] bool proprias = false, [FromQuery] bool? visivel = null) =>
        Responder(await _service.GetRacasAsync(idMesa, IdUsuario(), User.IsAdmin(), proprias, visivel));

    [HttpGet("racas/{idRaca:int}")]
    public async Task<IActionResult> GetRaca(int idMesa, int idRaca) =>
        Responder(await _service.GetRacaAsync(idMesa, IdUsuario(), User.IsAdmin(), idRaca));

    [HttpPost("racas")]
    public async Task<IActionResult> CriarRaca(int idMesa, [FromBody] RacaDto dto) =>
        Responder(await _service.CriarRacaAsync(idMesa, IdUsuario(), User.IsAdmin(), dto));

    [HttpPut("racas/{idRaca:int}")]
    public async Task<IActionResult> AtualizarRaca(int idMesa, int idRaca, [FromBody] RacaDto dto) =>
        Responder(await _service.AtualizarRacaAsync(idMesa, IdUsuario(), User.IsAdmin(), idRaca, dto));

    [HttpDelete("racas/{idRaca:int}")]
    public async Task<IActionResult> ExcluirRaca(int idMesa, int idRaca) =>
        ResponderNoContent(await _service.ExcluirRacaAsync(idMesa, IdUsuario(), User.IsAdmin(), idRaca));

    [HttpGet("personagens")]
    public async Task<IActionResult> GetPersonagens(int idMesa, [FromQuery] bool proprios = false, [FromQuery] bool? visivel = null) =>
        Responder(await _service.GetPersonagensAsync(idMesa, IdUsuario(), User.IsAdmin(), proprios, visivel));

    [HttpGet("personagens/{idPersonagem:int}")]
    public async Task<IActionResult> GetPersonagem(int idMesa, int idPersonagem) =>
        Responder(await _service.GetPersonagemAsync(idMesa, IdUsuario(), User.IsAdmin(), idPersonagem));

    [HttpPost("personagens")]
    public async Task<IActionResult> CriarPersonagem(int idMesa, [FromBody] PersonagemDto dto) =>
        Responder(await _service.CriarPersonagemAsync(idMesa, IdUsuario(), User.IsAdmin(), dto));

    [HttpPut("personagens/{idPersonagem:int}")]
    public async Task<IActionResult> AtualizarPersonagem(int idMesa, int idPersonagem, [FromBody] PersonagemDto dto) =>
        Responder(await _service.AtualizarPersonagemAsync(idMesa, IdUsuario(), User.IsAdmin(), idPersonagem, dto));

    [HttpDelete("personagens/{idPersonagem:int}")]
    public async Task<IActionResult> ExcluirPersonagem(int idMesa, int idPersonagem) =>
        ResponderNoContent(await _service.ExcluirPersonagemAsync(idMesa, IdUsuario(), User.IsAdmin(), idPersonagem));

    [HttpGet("itens")]
    public async Task<IActionResult> GetItens(int idMesa, [FromQuery] bool proprios = false, [FromQuery] bool? visivel = null) =>
        Responder(await _service.GetItensAsync(idMesa, IdUsuario(), User.IsAdmin(), proprios, visivel));

    [HttpGet("itens/{idItem}")]
    public async Task<IActionResult> GetItem(int idMesa, string idItem) =>
        Responder(await _service.GetItemAsync(idMesa, IdUsuario(), User.IsAdmin(), idItem));

    [HttpPost("itens")]
    public async Task<IActionResult> CriarItem(int idMesa, [FromBody] ItemCreateDto dto) =>
        Responder(await _service.CriarItemAsync(idMesa, IdUsuario(), User.IsAdmin(), dto));

    [HttpPut("itens/{idItem}")]
    public async Task<IActionResult> AtualizarItem(int idMesa, string idItem, [FromBody] ItemUpdateDto dto) =>
        Responder(await _service.AtualizarItemAsync(idMesa, IdUsuario(), User.IsAdmin(), idItem, dto));

    [HttpDelete("itens/{idItem}")]
    public async Task<IActionResult> ExcluirItem(int idMesa, string idItem) =>
        ResponderNoContent(await _service.ExcluirItemAsync(idMesa, IdUsuario(), User.IsAdmin(), idItem));

    private int IdUsuario() => User.GetUserId() ?? 0;

    private IActionResult Responder<T>(WikiMesaOperacaoResultado<T> resultado) =>
        resultado.Sucesso
            ? Ok(resultado.Dados)
            : MapearFalha(resultado);

    private IActionResult ResponderNoContent(WikiMesaOperacaoResultado<bool> resultado) =>
        resultado.Sucesso
            ? NoContent()
            : MapearFalha(resultado);

    private IActionResult MapearFalha<T>(WikiMesaOperacaoResultado<T> resultado) => resultado.Erro switch
    {
        WikiMesaOperacaoErro.NaoEncontrado => NotFound(new { mensagemErro = resultado.MensagemErro }),
        WikiMesaOperacaoErro.Proibido => Forbid(),
        _ => BadRequest(new { mensagemErro = resultado.MensagemErro }),
    };
}
