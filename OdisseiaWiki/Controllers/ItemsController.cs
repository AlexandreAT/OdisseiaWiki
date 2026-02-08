using Microsoft.AspNetCore.Mvc;
using OdisseiaWiki.Dtos;
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
            var items = await _service.GetAllAsync(visivel);
            return Ok(items);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var item = await _service.GetByIdAsync(id);
            
            return item is null
                ? NotFound($"Item com id {id} não encontrado.")
                : Ok(item);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ItemCreateDto dto)
        {
            var id = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id }, new { id });
        }

        [HttpPut]
        public async Task<IActionResult> Update([FromBody] ItemUpdateDto dto)
        {
            var sucesso = await _service.UpdateAsync(dto);
            
            return !sucesso
                ? NotFound($"Item com id {dto.Iditem} não encontrado.")
                : NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var sucesso = await _service.DeleteAsync(id);
            
            return !sucesso
                ? NotFound($"Item com id {id} não encontrado.")
                : NoContent();
        }
    }
}