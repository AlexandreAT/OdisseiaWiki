using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Security;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ItemController : ControllerBase
    {
        private readonly IItemService _service;

        public ItemController(IItemService service) => _service = service;

        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await _service.GetAllAsync(User.IsAdmin() ? null : true));

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(string id)
        {
            ItemDto item = await _service.GetByIdAsync(id);
            return item is null || (!item.Visivel && !User.IsAdmin()) ? NotFound() : Ok(item);
        }

        [HttpPost]
        [Authorize(Policy = AuthorizationPolicies.Admin)]
        public async Task<IActionResult> Create([FromBody] ItemCreateDto dto)
        {
            string id = await _service.CreateAsync(dto);
            return Ok(new{ sucesso = true });
        }

        [HttpPut("{id:guid}")]
        [Authorize(Policy = AuthorizationPolicies.Admin)]
        public async Task<IActionResult> Update(string id, ItemUpdateDto dto)
        {
            if (id != dto.Iditem) return BadRequest("Id não corresponde ao item informado.");
            bool updated = await _service.UpdateAsync(dto);
            return updated ? NoContent() : NotFound();
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Policy = AuthorizationPolicies.Admin)]
        public async Task<IActionResult> Delete(string id)
        {
            bool deleted = await _service.DeleteAsync(id);
            return deleted ? NoContent() : NotFound();
        }

        [HttpPost("batch")]
        public async Task<IActionResult> GetBatch([FromBody] BatchStringRequestDto dto)
        {
            if (dto?.Ids == null || dto.Ids.Count == 0)
                return BadRequest("Lista de ids inválida.");

            List<ItemDto> items =
                await _service.GetBatchAsync(dto.Ids);

            if (!User.IsAdmin())
                items = items.Where(item => item.Visivel).ToList();

            return Ok(items);
        }
    }
}
