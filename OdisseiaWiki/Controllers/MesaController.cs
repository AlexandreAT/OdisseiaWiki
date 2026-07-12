using Microsoft.AspNetCore.Mvc;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MesaController : ControllerBase
    {
        private readonly IMesaService _service;

        public MesaController(IMesaService service)
        {
            _service = service;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] MesaDto dto)
        {
            ResultMesa resultado = await _service.CreateAsync(dto);

            if (!resultado.Sucesso)
                return BadRequest(resultado.MensagemErro);

            return Ok(resultado.Mesa);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            List<Mesa> mesas = await _service.GetAllAsync();
            return Ok(mesas);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] MesaDto dto)
        {
            var resultado = await _service.UpdateAsync(id, dto);
            return resultado.Sucesso ? Ok(resultado.Mesa) : BadRequest(resultado.MensagemErro);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var sucesso = await _service.DeleteAsync(id);
            return sucesso ? NoContent() : BadRequest("Mesa não encontrada ou protegida pelo sistema.");
        }
    }
}
