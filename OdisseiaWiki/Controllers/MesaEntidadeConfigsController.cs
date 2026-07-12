using Microsoft.AspNetCore.Mvc;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Controllers;

[ApiController]
[Route("api/mesa-entidade-configs")]
public class MesaEntidadeConfigsController : ControllerBase
{
    private readonly IMesaEntidadeConfigService _service;

    public MesaEntidadeConfigsController(IMesaEntidadeConfigService service) => _service = service;

    [HttpGet("{idMesa:int}/{tipoEntidade}/{idEntidade}")]
    public async Task<IActionResult> Get(int idMesa, MesaEntidadeTipo tipoEntidade, string idEntidade)
    {
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
        dto.Idmesa = idMesa;
        dto.TipoEntidade = tipoEntidade;
        dto.Identidade = idEntidade;

        var resultado = await _service.SaveAsync(dto);
        return resultado.Sucesso ? Ok(resultado) : BadRequest(resultado);
    }

    [HttpDelete("{idMesa:int}/{tipoEntidade}/{idEntidade}")]
    public async Task<IActionResult> Delete(
        int idMesa,
        MesaEntidadeTipo tipoEntidade,
        string idEntidade,
        [FromQuery] int idUsuario)
    {
        var resultado = await _service.DeleteAsync(idMesa, tipoEntidade, idEntidade, idUsuario);
        return resultado.Sucesso ? Ok(resultado) : BadRequest(resultado);
    }
}
