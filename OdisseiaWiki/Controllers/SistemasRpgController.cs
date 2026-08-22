using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Security;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Controllers;

[ApiController]
[Route("api/sistemas-rpg")]
public sealed class SistemasRpgController : ControllerBase
{
    private readonly ISistemaRpgService _service;
    private readonly ISistemaRpgResolver _resolver;
    private readonly IMesaService _mesaService;
    private readonly IPersonagemJogadorService _personagemJogadorService;

    public SistemasRpgController(
        ISistemaRpgService service,
        ISistemaRpgResolver resolver,
        IMesaService mesaService,
        IPersonagemJogadorService personagemJogadorService)
    {
        _service = service;
        _resolver = resolver;
        _mesaService = mesaService;
        _personagemJogadorService = personagemJogadorService;
    }

    [HttpGet]
    public async Task<ActionResult<List<SistemaRpgResumoDto>>> ObterTodos()
        => Ok(await _service.ObterTodosAsync(User.IsAdmin()));

    [HttpGet("{idSistemaRpg:int}")]
    public async Task<IActionResult> Obter(int idSistemaRpg)
    {
        var resultado = await _service.ObterAsync(idSistemaRpg, User.IsAdmin());
        if (resultado.Sucesso && !User.IsAdmin() && resultado.Dados?.Ativo == false)
            return NotFound();

        return Responder(resultado);
    }

    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [HttpPost]
    public async Task<IActionResult> Criar([FromBody] SistemaRpgCreateDto dto)
        => Responder(await _service.CriarAsync(dto));

    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [HttpPut("{idSistemaRpg:int}")]
    public async Task<IActionResult> Atualizar(int idSistemaRpg, [FromBody] SistemaRpgUpdateDto dto)
        => Responder(await _service.AtualizarAsync(idSistemaRpg, dto));

    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [HttpDelete("{idSistemaRpg:int}")]
    public async Task<IActionResult> Excluir(int idSistemaRpg)
    {
        var resultado = await _service.ExcluirAsync(idSistemaRpg);
        return resultado.Sucesso ? NoContent() : ResponderErro(resultado);
    }

    [HttpGet("{idSistemaRpg:int}/versoes")]
    public async Task<IActionResult> ObterVersoes(int idSistemaRpg)
        => Responder(await _service.ObterVersoesAsync(idSistemaRpg, User.IsAdmin()));

    [HttpGet("{idSistemaRpg:int}/versoes/{idSistemaVersao:int}")]
    public async Task<IActionResult> ObterVersao(int idSistemaRpg, int idSistemaVersao)
        => Responder(await _service.ObterVersaoAsync(idSistemaRpg, idSistemaVersao, User.IsAdmin()));

    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [HttpPost("{idSistemaRpg:int}/versoes")]
    public async Task<IActionResult> CriarVersao(
        int idSistemaRpg,
        [FromBody] SistemaVersaoCreateDto dto)
        => Responder(await _service.CriarVersaoAsync(idSistemaRpg, dto));

    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [HttpPost("versoes/{idSistemaVersao:int}/duplicar")]
    public async Task<IActionResult> DuplicarVersao(
        int idSistemaVersao,
        [FromBody] SistemaVersaoDuplicarDto dto)
        => Responder(await _service.DuplicarVersaoAsync(idSistemaVersao, dto));

    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [HttpPost("versoes/{idSistemaVersao:int}/publicar")]
    public async Task<IActionResult> PublicarVersao(int idSistemaVersao)
        => Responder(await _service.PublicarVersaoAsync(idSistemaVersao));

    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [HttpGet("versoes/{idSistemaVersao:int}/patch-note")]
    public async Task<IActionResult> ObterPatchNote(int idSistemaVersao)
        => Responder(await _service.ObterPatchNoteAsync(idSistemaVersao));

    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [HttpPost("versoes/{idSistemaVersao:int}/arquivar")]
    public async Task<IActionResult> ArquivarVersao(int idSistemaVersao)
        => Responder(await _service.ArquivarVersaoAsync(idSistemaVersao));

    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [HttpDelete("{idSistemaRpg:int}/versoes/{idSistemaVersao:int}")]
    public async Task<IActionResult> ExcluirVersao(int idSistemaRpg, int idSistemaVersao)
    {
        var resultado = await _service.ExcluirVersaoAsync(idSistemaRpg, idSistemaVersao);
        return resultado.Sucesso ? NoContent() : ResponderErro(resultado);
    }

    [HttpGet("versoes/{idSistemaVersao:int}/configuracao-geral")]
    public async Task<IActionResult> ObterConfiguracaoGeral(int idSistemaVersao)
        => Responder(await _service.ObterConfiguracaoGeralAsync(idSistemaVersao, User.IsAdmin()));

    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [HttpPut("versoes/{idSistemaVersao:int}/configuracao-geral")]
    public async Task<IActionResult> AtualizarConfiguracaoGeral(
        int idSistemaVersao,
        [FromBody] SistemaConfiguracaoGeralDto dto)
        => Responder(await _service.AtualizarConfiguracaoGeralAsync(idSistemaVersao, dto));

    [HttpGet("versoes/{idSistemaVersao:int}/criacao")]
    public async Task<IActionResult> ObterCriacao(int idSistemaVersao)
        => Responder(await _service.ObterCriacaoAsync(idSistemaVersao, User.IsAdmin()));

    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [HttpPut("versoes/{idSistemaVersao:int}/criacao")]
    public async Task<IActionResult> AtualizarCriacao(
        int idSistemaVersao,
        [FromBody] SistemaCriacaoConfigDto dto)
        => Responder(await _service.AtualizarCriacaoAsync(idSistemaVersao, dto));

    [HttpGet("versoes/{idSistemaVersao:int}/progressao")]
    public async Task<IActionResult> ObterProgressao(int idSistemaVersao)
        => Responder(await _service.ObterProgressaoAsync(idSistemaVersao, User.IsAdmin()));

    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [HttpPut("versoes/{idSistemaVersao:int}/progressao")]
    public async Task<IActionResult> AtualizarProgressao(
        int idSistemaVersao,
        [FromBody] SistemaProgressaoConfigDto dto)
        => Responder(await _service.AtualizarProgressaoAsync(idSistemaVersao, dto));

    [HttpGet("versoes/{idSistemaVersao:int}/exploracao")]
    public async Task<IActionResult> ObterExploracao(int idSistemaVersao)
        => Responder(await _service.ObterExploracaoAsync(idSistemaVersao, User.IsAdmin()));

    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [HttpPut("versoes/{idSistemaVersao:int}/exploracao")]
    public async Task<IActionResult> AtualizarExploracao(
        int idSistemaVersao,
        [FromBody] SistemaExploracaoConfigDto dto)
        => Responder(await _service.AtualizarExploracaoAsync(idSistemaVersao, dto));

    [HttpGet("versoes/{idSistemaVersao:int}/combate")]
    public async Task<IActionResult> ObterCombate(int idSistemaVersao)
        => Responder(await _service.ObterCombateAsync(idSistemaVersao, User.IsAdmin()));

    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [HttpPut("versoes/{idSistemaVersao:int}/combate")]
    public async Task<IActionResult> AtualizarCombate(
        int idSistemaVersao,
        [FromBody] SistemaCombateConfigDto dto)
        => Responder(await _service.AtualizarCombateAsync(idSistemaVersao, dto));

    [HttpGet("versoes/{idSistemaVersao:int}/poderes")]
    public async Task<IActionResult> ObterPoderes(int idSistemaVersao)
        => Responder(await _service.ObterPoderesAsync(idSistemaVersao, User.IsAdmin()));

    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [HttpPut("versoes/{idSistemaVersao:int}/poderes")]
    public async Task<IActionResult> AtualizarPoderes(
        int idSistemaVersao,
        [FromBody] SistemaPoderesConfigDto dto)
        => Responder(await _service.AtualizarPoderesAsync(idSistemaVersao, dto));

    [HttpGet("versoes/{idSistemaVersao:int}/sobrevivencia")]
    public async Task<IActionResult> ObterSobrevivencia(int idSistemaVersao)
        => Responder(await _service.ObterSobrevivenciaAsync(idSistemaVersao, User.IsAdmin()));

    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [HttpPut("versoes/{idSistemaVersao:int}/sobrevivencia")]
    public async Task<IActionResult> AtualizarSobrevivencia(
        int idSistemaVersao,
        [FromBody] SistemaSobrevivenciaConfigDto dto)
        => Responder(await _service.AtualizarSobrevivenciaAsync(idSistemaVersao, dto));

    [HttpGet("resolver")]
    public async Task<ActionResult<SistemaResolvidoDto>> Resolver([FromQuery] int? idMesa = null)
    {
        if (idMesa.HasValue)
        {
            if (User.Identity?.IsAuthenticated != true)
                return Unauthorized();

            int? userId = User.GetUserId();
            if (!userId.HasValue)
                return Unauthorized();

            if (!User.IsAdmin() && !await _mesaService.CanUseAsync(idMesa.Value, userId.Value))
                return Forbid();
        }

        return Ok(await _resolver.ResolverAsync(idMesa));
    }

    [HttpGet("runtime/contexto")]
    public async Task<ActionResult<SistemaRuntimeContextoDto>> ResolverContextoRuntime(
        [FromQuery] SistemaRuntimeConsultaDto consulta)
    {
        if (consulta.IdPersonagemJogador.HasValue)
        {
            int? userId = User.GetUserId();
            if (!userId.HasValue)
                return Unauthorized();

            PersonagemJogadorDto? personagem = await _personagemJogadorService.GetByIdAsync(
                consulta.IdPersonagemJogador.Value);
            if (personagem is null)
                return NotFound("Personagem de jogador não encontrado.");
            if (!User.IsAdmin() && personagem.Idusuario != userId.Value)
            {
                return personagem.Visivel
                    ? Forbid()
                    : NotFound("Personagem de jogador nÃ£o encontrado.");
            }
        }

        if (consulta.IdMesa.HasValue)
        {
            if (User.Identity?.IsAuthenticated != true)
                return Unauthorized();

            int? userId = User.GetUserId();
            if (!userId.HasValue)
                return Unauthorized();

            if (!User.IsAdmin() &&
                !await _mesaService.CanUseAsync(consulta.IdMesa.Value, userId.Value))
            {
                return Forbid();
            }
        }

        return Ok(await _resolver.ResolverContextoAsync(consulta));
    }

    [Authorize]
    [HttpPost("mesas/{idMesa:int}/migracao/preview")]
    public async Task<IActionResult> ObterPreviaMigracaoMesa(
        int idMesa,
        [FromBody] MesaMigracaoPreviewRequestDto dto)
    {
        var userId = User.GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        if (!User.IsAdmin() && !await _mesaService.IsOwnerAsync(idMesa, userId.Value))
            return Forbid();

        return Responder(await _service.ObterPreviaMigracaoMesaAsync(
            idMesa,
            dto.IdSistemaVersaoDestino));
    }

    [Authorize]
    [HttpPost("mesas/{idMesa:int}/migrar")]
    public async Task<IActionResult> MigrarMesa(
        int idMesa,
        [FromBody] MesaMigrarSistemaDto dto)
    {
        var userId = User.GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        if (!User.IsAdmin() && !await _mesaService.IsOwnerAsync(idMesa, userId.Value))
            return Forbid();

        return Responder(await _service.MigrarMesaAsync(
            idMesa,
            dto.IdSistemaVersao,
            dto.ConfirmarPreservacaoValores));
    }

    private IActionResult Responder<T>(SistemaOperacaoResultado<T> resultado)
        => resultado.Sucesso ? Ok(resultado.Dados) : ResponderErro(resultado);

    private IActionResult ResponderErro<T>(SistemaOperacaoResultado<T> resultado)
    {
        var mensagem = resultado.MensagemErro ?? "A operação não pôde ser concluída.";
        return resultado.TipoErro switch
        {
            SistemaOperacaoErro.NaoEncontrado => Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Recurso não encontrado",
                detail: mensagem),
            SistemaOperacaoErro.Conflito => Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "Operação bloqueada",
                detail: mensagem),
            _ => BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                ["sistema"] = new[] { mensagem },
            })
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "A configuração informada é inválida.",
            }),
        };
    }
}
