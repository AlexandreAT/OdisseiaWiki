using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Security;
using OdisseiaWiki.Services.Interfaces;
using System.Threading.Tasks;

namespace OdisseiaWiki.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RacasController : ControllerBase
    {
        private readonly IRacaService _service;
        private readonly IMesaService _mesaService;

        public RacasController(IRacaService service, IMesaService mesaService)
        {
            _service = service;
            _mesaService = mesaService;
        }

        [HttpPost]
        [Authorize(Policy = AuthorizationPolicies.Admin)]
        public async Task<IActionResult> Create([FromBody] RacaDto dto)
        {
            var resultado = await _service.CreateAsync(dto);

            if (!resultado.Sucesso)
                return BadRequest(resultado);

            return Ok(resultado);
        }

        [HttpPut("{id:int}")]
        [Authorize(Policy = AuthorizationPolicies.Admin)]
        public async Task<IActionResult> Update(int id, [FromBody] RacaDto dto)
        {
            var resultado = await _service.UpdateAsync(id, dto);

            if (!resultado.Sucesso)
                return BadRequest(resultado);

            return Ok(resultado);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] bool? visivel = null, [FromQuery] int? idMesa = null)
        {
            IActionResult? mesaAccessError = await ValidateMesaAccessAsync(idMesa);
            if (mesaAccessError is not null)
                return mesaAccessError;

            if (!User.IsAdmin())
                visivel = true;

            var resultado = await _service.GetAllAsync(visivel, idMesa);

            if (!resultado.Sucesso)
                return BadRequest(resultado.MensagemErro);

            return Ok(resultado);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id, [FromQuery] int? idMesa = null)
        {
            IActionResult? mesaAccessError = await ValidateMesaAccessAsync(idMesa);
            if (mesaAccessError is not null)
                return mesaAccessError;

            var raca = await _service.GetByIdAsync(id, idMesa);

            return raca is null || (!raca.Visivel && !User.IsAdmin())
                ? NotFound($"Raça com id {id} não encontrada.")
                : Ok(raca);
        }

        [HttpDelete("{id:int}")]
        [Authorize(Policy = AuthorizationPolicies.Admin)]
        public async Task<IActionResult> Delete(int id)
        {
            var sucesso = await _service.DeleteAsync(id);

            return !sucesso
                ? NotFound($"Raça com id {id} não encontrada.")
                : NoContent();
        }

        [HttpPost("batch")]
        public async Task<IActionResult> GetBatch([FromBody] BatchRequestDto dto)
        {
            if (dto?.Ids == null || dto.Ids.Count == 0)
                return BadRequest("Lista de ids inválida.");

            List<RacaDto> racas =
                await _service.GetBatchAsync(dto.Ids);

            if (!User.IsAdmin())
                racas = racas.Where(raca => raca.Visivel).ToList();

            return Ok(racas);
        }

        private async Task<IActionResult?> ValidateMesaAccessAsync(int? idMesa)
        {
            if (!idMesa.HasValue || User.IsAdmin())
                return null;

            int? userId = User.GetUserId();
            if (!userId.HasValue)
                return Unauthorized();

            return await _mesaService.CanUseAsync(idMesa.Value, userId.Value)
                ? null
                : Forbid();
        }
    }
}
