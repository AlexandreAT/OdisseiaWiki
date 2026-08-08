using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Security;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Controllers;

[ApiController]
[Route("api/personagens-comparacao")]
public sealed class PersonagensComparacaoController : ControllerBase
{
    private readonly IPersonagemComparacaoService _service;

    public PersonagensComparacaoController(IPersonagemComparacaoService service)
    {
        _service = service;
    }

    [HttpGet("pesquisar")]
    [AllowAnonymous]
    public async Task<IActionResult> Search(
        [FromQuery] PersonagemComparacaoOrigem origem,
        [FromQuery] int? idPersonagemAtual,
        [FromQuery] int? idMesa,
        [FromQuery] string termo = "")
    {
        PersonagemComparacaoPesquisaResultadoDto result = await _service.SearchAsync(
            origem,
            idPersonagemAtual,
            idMesa,
            termo,
            User.GetUserId(),
            User.IsAdmin());

        return result.AcessoPermitido ? Ok(result.Personagens) : Forbid();
    }

    [HttpGet("{origem}/{id:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> Get(PersonagemComparacaoOrigem origem, int id)
    {
        PersonagemComparacaoPesquisaResultadoDto result = await _service.GetAsync(
            origem,
            id,
            User.GetUserId(),
            User.IsAdmin());

        if (!result.AcessoPermitido) return Forbid();
        return result.Personagens.FirstOrDefault() is { } personagem
            ? Ok(personagem)
            : NotFound();
    }
}
