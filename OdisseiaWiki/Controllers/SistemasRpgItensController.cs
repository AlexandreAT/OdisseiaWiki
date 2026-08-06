using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Security;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Controllers;

[ApiController]
[Route("api/sistemas-rpg/versoes/{idSistemaVersao:int}/itens")]
public sealed class SistemasRpgItensController : ControllerBase
{
    private readonly ISistemaRpgItemCatalogService _service;

    public SistemasRpgItensController(ISistemaRpgItemCatalogService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> Obter(int idSistemaVersao) =>
        Responder(await _service.ObterAsync(idSistemaVersao, User.IsAdmin()));

    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [HttpPut]
    public async Task<IActionResult> Atualizar(
        int idSistemaVersao,
        [FromBody] SistemaItensConfigDto dto) =>
        Responder(await _service.AtualizarAsync(idSistemaVersao, dto));

    private IActionResult Responder<T>(SistemaOperacaoResultado<T> resultado)
    {
        if (resultado.Sucesso)
            return Ok(resultado.Dados);

        string mensagem = resultado.MensagemErro ?? "A operação não pôde ser concluída.";
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
                ["itens"] = new[] { mensagem },
            })
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "O catálogo de itens informado é inválido.",
            }),
        };
    }
}
