using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;
using OdisseiaWiki.Security;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Controllers
{
    [ApiController]
    [Authorize]
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
            int? userId = User.GetUserId();
            if (!userId.HasValue)
                return Unauthorized();

            dto.IdusuarioCriacao = userId.Value;
            ResultMesa resultado = await _service.CreateAsync(dto);

            if (!resultado.Sucesso)
                return BadRequest(resultado.MensagemErro);

            return Ok(resultado.Mesa);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            int? userId = User.GetUserId();
            if (!userId.HasValue)
                return Unauthorized();

            List<Mesa> mesas = User.IsAdmin()
                ? await _service.GetAllAsync()
                : await _service.GetAccessibleAsync(userId.Value);
            return Ok(mesas);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] MesaDto dto)
        {
            int? userId = User.GetUserId();
            if (!userId.HasValue)
                return Unauthorized();

            if (!User.IsAdmin() && !await _service.IsOwnerAsync(id, userId.Value))
                return Forbid();

            dto.IdusuarioCriacao = userId.Value;
            var resultado = await _service.UpdateAsync(id, dto);
            return resultado.Sucesso ? Ok(resultado.Mesa) : BadRequest(resultado.MensagemErro);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            int? userId = User.GetUserId();
            if (!userId.HasValue)
                return Unauthorized();

            if (!User.IsAdmin() && !await _service.IsOwnerAsync(id, userId.Value))
                return Forbid();

            var sucesso = await _service.DeleteAsync(id);
            return sucesso ? NoContent() : BadRequest("Mesa não encontrada ou protegida pelo sistema.");
        }
    }
}
