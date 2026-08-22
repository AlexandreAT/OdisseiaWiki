using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Security;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Controllers;

[ApiController]
[Authorize]
[Route("api/personagens-visibilidade")]
public sealed class PersonagensVisibilidadeController : ControllerBase
{
    private readonly IPersonagemVisibilidadeService _service;

    public PersonagensVisibilidadeController(IPersonagemVisibilidadeService service) => _service = service;

    [HttpGet("npc/{idPersonagem:int}")]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    public async Task<IActionResult> GetNpc(int idPersonagem) =>
        Responder(await _service.GetNpcAsync(idPersonagem));

    [HttpPut("npc/{idPersonagem:int}")]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    public async Task<IActionResult> SaveNpc(
        int idPersonagem,
        [FromBody] PersonagemVisibilidadeDto visibilidade) =>
        Responder(await _service.SaveNpcAsync(idPersonagem, visibilidade));

    [HttpGet("jogador/{idPersonagemJogador:int}")]
    public async Task<IActionResult> GetPersonagemJogador(int idPersonagemJogador)
    {
        int? idUsuario = User.GetUserId();
        if (!idUsuario.HasValue)
            return Unauthorized();

        return Responder(await _service.GetPersonagemJogadorAsync(
            idPersonagemJogador,
            idUsuario.Value,
            User.IsAdmin()));
    }

    [HttpPut("jogador/{idPersonagemJogador:int}")]
    public async Task<IActionResult> SavePersonagemJogador(
        int idPersonagemJogador,
        [FromBody] PersonagemVisibilidadeDto visibilidade)
    {
        int? idUsuario = User.GetUserId();
        if (!idUsuario.HasValue)
            return Unauthorized();

        return Responder(await _service.SavePersonagemJogadorAsync(
            idPersonagemJogador,
            visibilidade,
            idUsuario.Value,
            User.IsAdmin()));
    }

    private IActionResult Responder(ResultPersonagemVisibilidade resultado)
    {
        if (resultado.Sucesso)
            return Ok(resultado.Visibilidade);
        if (resultado.SemPermissao)
            return Forbid();
        if (resultado.NaoEncontrado)
            return NotFound(resultado.MensagemErro);

        return BadRequest(resultado.MensagemErro);
    }
}
