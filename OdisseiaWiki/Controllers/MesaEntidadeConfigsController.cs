using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Security;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Controllers;

[ApiController]
[Authorize]
[Route("api/mesa-entidade-configs")]
public class MesaEntidadeConfigsController : ControllerBase
{
    private readonly IMesaEntidadeConfigService _service;
    private readonly IMesaService _mesaService;

    public MesaEntidadeConfigsController(
        IMesaEntidadeConfigService service,
        IMesaService mesaService)
    {
        _service = service;
        _mesaService = mesaService;
    }

    [HttpGet("{idMesa:int}/{tipoEntidade}/{idEntidade}")]
    public async Task<IActionResult> Get(int idMesa, MesaEntidadeTipo tipoEntidade, string idEntidade)
    {
        int? userId = User.GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        if (!User.IsAdmin() && !await _mesaService.CanUseAsync(idMesa, userId.Value))
            return Forbid();

        var resultado = await _service.GetAsync(idMesa, tipoEntidade, idEntidade);
        return resultado.Sucesso ? Ok(resultado) : NotFound(resultado);
    }

    [HttpPut("{idMesa:int}/{tipoEntidade}/{idEntidade}")]
    public async Task<IActionResult> Save(
        int idMesa,
        MesaEntidadeTipo tipoEntidade,
        string idEntidade,
        [FromBody] MesaEntidadeConfigDto dto)
    {
        int? userId = User.GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        dto.Idmesa = idMesa;
        dto.TipoEntidade = tipoEntidade;
        dto.Identidade = idEntidade;
        dto.Idusuario = userId.Value;

        var resultado = await _service.SaveAsync(dto);
        return resultado.Sucesso ? Ok(resultado) : BadRequest(resultado);
    }

    [HttpDelete("{idMesa:int}/{tipoEntidade}/{idEntidade}")]
    public async Task<IActionResult> Delete(
        int idMesa,
        MesaEntidadeTipo tipoEntidade,
        string idEntidade)
    {
        int? userId = User.GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var resultado = await _service.DeleteAsync(idMesa, tipoEntidade, idEntidade, userId.Value);
        return resultado.Sucesso ? Ok(resultado) : BadRequest(resultado);
    }
}
