using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Security;
using OdisseiaWiki.Services.Interfaces;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace OdisseiaWiki.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ItemsController : ControllerBase
    {
        private readonly IItemService _service;

        public ItemsController(IItemService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] bool? visivel = null)
        {
            if (!User.IsAdmin())
                visivel = true;

            var items = await _service.GetAllAsync(visivel);
            return Ok(items);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var item = await _service.GetByIdAsync(id);
            
            return item is null || (!item.Visivel && !User.IsAdmin())
                ? NotFound($"Item com id {id} não encontrado.")
                : Ok(item);
        }

        [HttpPost]
        [Authorize(Policy = AuthorizationPolicies.Admin)]
        public async Task<IActionResult> Create([FromBody] ItemCreateDto dto)
        {
            try
            {
                ItemSaveResultDto resultado = await _service.CreateWithRuntimeAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = resultado.Id }, resultado);
            }
            catch (InvalidOperationException exception)
            {
                return BadRequest(new { mensagemErro = exception.Message });
            }
        }

        [HttpPut]
        [Authorize(Policy = AuthorizationPolicies.Admin)]
        public async Task<IActionResult> Update([FromBody] ItemUpdateDto dto)
        {
            ItemSaveResultDto? resultado;
            try
            {
                resultado = await _service.UpdateWithRuntimeAsync(dto);
            }
            catch (InvalidOperationException exception)
            {
                return BadRequest(new { mensagemErro = exception.Message });
            }
            
            return resultado is null
                ? NotFound($"Item com id {dto.Iditem} não encontrado.")
                : Ok(resultado);
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = AuthorizationPolicies.Admin)]
        public async Task<IActionResult> Delete(string id)
        {
            var sucesso = await _service.DeleteAsync(id);
            
            return !sucesso
                ? NotFound($"Item com id {id} não encontrado.")
                : NoContent();
        }
    }
}
