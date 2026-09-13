using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;
using OdisseiaWiki.Security;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class MesaController : ControllerBase
{
    private readonly IMesaService _service;
    private readonly IMesaPersonagemService _personagemService;

    public MesaController(IMesaService service, IMesaPersonagemService personagemService)
    {
        _service = service;
        _personagemService = personagemService;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] MesaCriarDto dto)
    {
        int? userId = User.GetUserId();
        if (!userId.HasValue) return Unauthorized();
        MesaOperacaoResultado<MesaResumoDto> resultado =
            await _service.CreateSocialAsync(userId.Value, dto);
        return resultado.Sucesso && resultado.Dados is not null
            ? CreatedAtAction(nameof(GetPublicPage), new { id = resultado.Dados.IdMesa }, resultado.Dados)
            : MapFailure(resultado);
    }

    [HttpGet("hub")]
    public async Task<IActionResult> GetHub(
        [FromQuery] int criadasPagina = 1,
        [FromQuery] int participandoPagina = 1)
    {
        int? userId = User.GetUserId();
        return userId.HasValue
            ? Ok(await _service.GetHubAsync(userId.Value, criadasPagina, participandoPagina))
            : Unauthorized();
    }

    [HttpGet("pesquisar")]
    [AllowAnonymous]
    public async Task<IActionResult> Search(
        [FromQuery] string? termo = null,
        [FromQuery] int? idSistemaRpg = null,
        [FromQuery] bool somenteComVagas = false,
        [FromQuery] int pagina = 1,
        [FromQuery] int tamanhoPagina = 12)
        => Ok(await _service.SearchAsync(
            termo,
            idSistemaRpg,
            somenteComVagas,
            pagina,
            tamanhoPagina,
            User.GetUserId()));

    [HttpGet("{id:int}/publica")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublicPage(int id)
    {
        MesaOperacaoResultado<MesaResumoDto> resultado =
            await _service.GetPublicPageAsync(id, User.GetUserId());
        return resultado.Sucesso ? Ok(resultado.Dados) : MapFailure(resultado);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        int? userId = User.GetUserId();
        if (!userId.HasValue) return Unauthorized();
        List<Mesa> mesas = User.IsAdmin()
            ? await _service.GetAllAsync()
            : await _service.GetAccessibleAsync(userId.Value);
        return Ok(mesas);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        int? userId = User.GetUserId();
        if (!userId.HasValue) return Unauthorized();
        if (!User.IsAdmin() && !await _service.CanUseAsync(id, userId.Value)) return Forbid();
        Mesa? mesa = await _service.GetByIdAsync(id);
        return mesa is null ? NotFound() : Ok(mesa);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] MesaAtualizarDto dto)
    {
        int? userId = User.GetUserId();
        if (!userId.HasValue) return Unauthorized();
        MesaOperacaoResultado<MesaResumoDto> resultado = await _service.UpdateSocialAsync(
            id,
            userId.Value,
            User.IsAdmin(),
            dto);
        return resultado.Sucesso ? Ok(resultado.Dados) : MapFailure(resultado);
    }

    [HttpPut("{id:int}/ao-vivo")]
    public async Task<IActionResult> UpdateLiveStatus(int id, [FromBody] MesaAtualizarAoVivoDto dto)
    {
        int? userId = User.GetUserId();
        if (!userId.HasValue) return Unauthorized();
        MesaOperacaoResultado<MesaResumoDto> resultado = await _service.UpdateLiveStatusAsync(
            id,
            userId.Value,
            dto.AoVivo);
        return resultado.Sucesso ? Ok(resultado.Dados) : MapFailure(resultado);
    }

    [HttpPost("{id:int}/solicitacoes")]
    public async Task<IActionResult> RequestEntry(int id, [FromBody] MesaSolicitacaoCriarDto dto)
    {
        int? userId = User.GetUserId();
        if (!userId.HasValue) return Unauthorized();
        MesaOperacaoResultado<bool> resultado =
            await _service.RequestEntryAsync(id, userId.Value, dto);
        return resultado.Sucesso ? StatusCode(StatusCodes.Status201Created) : MapFailure(resultado);
    }

    [HttpGet("{id:int}/solicitacoes")]
    public async Task<IActionResult> GetRequests(int id)
    {
        int? userId = User.GetUserId();
        if (!userId.HasValue) return Unauthorized();
        MesaOperacaoResultado<IReadOnlyCollection<MesaSolicitacaoDto>> resultado =
            await _service.GetRequestsAsync(id, userId.Value, User.IsAdmin());
        return resultado.Sucesso ? Ok(resultado.Dados) : MapFailure(resultado);
    }

    [HttpPost("{id:int}/solicitacoes/{idSolicitacao:int}/aceitar")]
    public async Task<IActionResult> AcceptRequest(int id, int idSolicitacao)
    {
        int? userId = User.GetUserId();
        if (!userId.HasValue) return Unauthorized();
        MesaOperacaoResultado<bool> resultado = await _service.AcceptRequestAsync(
            id,
            idSolicitacao,
            userId.Value,
            User.IsAdmin());
        return resultado.Sucesso ? NoContent() : MapFailure(resultado);
    }

    [HttpDelete("{id:int}/solicitacoes/{idSolicitacao:int}")]
    public async Task<IActionResult> RefuseRequest(int id, int idSolicitacao)
    {
        int? userId = User.GetUserId();
        if (!userId.HasValue) return Unauthorized();
        MesaOperacaoResultado<bool> resultado = await _service.RefuseRequestAsync(
            id,
            idSolicitacao,
            userId.Value,
            User.IsAdmin());
        return resultado.Sucesso ? NoContent() : MapFailure(resultado);
    }

    [HttpGet("{id:int}/jogadores")]
    public async Task<IActionResult> GetMembers(int id)
    {
        int? userId = User.GetUserId();
        if (!userId.HasValue) return Unauthorized();
        MesaOperacaoResultado<IReadOnlyCollection<MesaJogadorDto>> resultado =
            await _service.GetMembersAsync(id, userId.Value, User.IsAdmin());
        return resultado.Sucesso ? Ok(resultado.Dados) : MapFailure(resultado);
    }

    [HttpDelete("{id:int}/jogadores/{idUsuario:int}")]
    public async Task<IActionResult> ExpelMember(int id, int idUsuario, [FromBody] MesaExpulsarDto dto)
    {
        int? currentUserId = User.GetUserId();
        if (!currentUserId.HasValue) return Unauthorized();
        MesaOperacaoResultado<bool> resultado = await _service.ExpelMemberAsync(
            id,
            idUsuario,
            currentUserId.Value,
            User.IsAdmin(),
            dto);
        return resultado.Sucesso ? NoContent() : MapFailure(resultado);
    }

    [HttpGet("expulsoes")]
    public async Task<IActionResult> GetExpulsionRecords()
    {
        int? userId = User.GetUserId();
        return userId.HasValue
            ? Ok(await _service.GetExpulsionRecordsAsync(userId.Value))
            : Unauthorized();
    }

    [HttpGet("{id:int}/personagens/gerenciamento")]
    public async Task<IActionResult> GetManagementCharacters(int id)
    {
        int? userId = User.GetUserId();
        if (!userId.HasValue) return Unauthorized();
        MesaOperacaoResultado<MesaPersonagensGerenciamentoDto> resultado =
            await _personagemService.GetManagementAsync(id, userId.Value, User.IsAdmin());
        return resultado.Sucesso ? Ok(resultado.Dados) : MapFailure(resultado);
    }

    [HttpGet("{id:int}/personagens/ao-vivo")]
    public async Task<IActionResult> GetLiveCharacters(int id)
    {
        int? userId = User.GetUserId();
        if (!userId.HasValue) return Unauthorized();
        MesaOperacaoResultado<MesaAoVivoSnapshotDto> resultado =
            await _personagemService.GetLiveAsync(id, userId.Value, User.IsAdmin());
        return resultado.Sucesso ? Ok(resultado.Dados) : MapFailure(resultado);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        int? userId = User.GetUserId();
        if (!userId.HasValue) return Unauthorized();
        if (!User.IsAdmin() && !await _service.IsOwnerAsync(id, userId.Value)) return Forbid();
        bool sucesso = await _service.DeleteAsync(id);
        return sucesso ? NoContent() : BadRequest("Mesa não encontrada ou protegida pelo sistema.");
    }

    private IActionResult MapFailure<T>(MesaOperacaoResultado<T> resultado)
        => resultado.Erro switch
        {
            MesaOperacaoErro.NaoEncontrado => NotFound(new { mensagem = resultado.Mensagem }),
            MesaOperacaoErro.Proibido => StatusCode(
                StatusCodes.Status403Forbidden,
                new { mensagem = resultado.Mensagem }),
            MesaOperacaoErro.Conflito => Conflict(new { mensagem = resultado.Mensagem }),
            _ => BadRequest(new { mensagem = resultado.Mensagem }),
        };
}
