using Microsoft.AspNetCore.Mvc;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Services.Interfaces;
using System.Threading.Tasks;

namespace OdisseiaWiki.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InfoLoreController : ControllerBase
    {
        private readonly IInfoLoreService _service;

        public InfoLoreController(IInfoLoreService service)
        {
            _service = service;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] InfoLoreDto dto)
        {
            var resultado = await _service.CreateAsync(dto);

            if (!resultado.Sucesso)
                return BadRequest(resultado);

            return Ok(resultado);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] InfoLoreDto dto)
        {
            var resultado = await _service.UpdateAsync(id, dto);

            if (!resultado.Sucesso)
                return BadRequest(resultado);

            return Ok(resultado);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] bool? visivel = null)
        {
            var resultado = await _service.GetAllAsync(visivel);

            if (!resultado.Sucesso)
                return BadRequest(resultado.MensagemErro);

            return Ok(resultado);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var infoLore = await _service.GetByIdAsync(id);

            return infoLore is null
                ? NotFound($"InfoLore com id {id} não encontrado.")
                : Ok(infoLore);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var sucesso = await _service.DeleteAsync(id);

            return !sucesso
                ? NotFound($"InfoLore com id {id} não encontrado.")
                : NoContent();
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchGlobal([FromQuery] string termo)
        {
            if (string.IsNullOrWhiteSpace(termo))
                return BadRequest("O termo de busca é obrigatório.");

            var resultado = await _service.SearchGlobalAsync(termo);

            return Ok(resultado);
        }
    }
}