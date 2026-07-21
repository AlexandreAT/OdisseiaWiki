using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;
using OdisseiaWiki.Security;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CidadesController : ControllerBase
    {
        private readonly ICidadeService _service;

        public CidadesController(ICidadeService service)
        {
            _service = service;
        }

        [HttpPost]
        [Authorize(Policy = AuthorizationPolicies.Admin)]
        public async Task<IActionResult> Create([FromBody] CidadeDto dto)
        {
            ResultCidade resultado = await _service.CreateAsync(dto);

            if (!resultado.Sucesso)
                return BadRequest(resultado);

            return Ok(resultado);
        }

        [HttpPut("{id:int}")]
        [Authorize(Policy = AuthorizationPolicies.Admin)]
        public async Task<IActionResult> Update(int id, [FromBody] CidadeDto dto)
        {
            ResultCidade resultado = await _service.UpdateAsync(id, dto);

            if (!resultado.Sucesso)
                return BadRequest(resultado);

            return Ok(resultado);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] bool? visivel = null)
        {
            if (!User.IsAdmin())
                visivel = true;

            ResultCidade resultado = await _service.GetAllAsync(visivel);

            if (!resultado.Sucesso)
                return BadRequest(resultado.MensagemErro);

            return Ok(resultado);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            CidadeDto? cidade = await _service.GetByIdAsync(id);

            return cidade is null || (!cidade.Visivel && !User.IsAdmin())
                ? NotFound($"Cidade com id {id} não encontrada.")
                : Ok(cidade);
        }

        [HttpDelete("{id:int}")]
        [Authorize(Policy = AuthorizationPolicies.Admin)]
        public async Task<IActionResult> Delete(int id)
        {
            bool sucesso = await _service.DeleteAsync(id);

            return !sucesso
                ? NotFound($"Cidade com id {id} não encontrada.")
                : NoContent();
        }

        [HttpPost("batch")]
        public async Task<IActionResult> GetBatch([FromBody] BatchRequestDto dto)
        {
            if (dto?.Ids == null || dto.Ids.Count == 0)
                return BadRequest("Lista de ids inválida.");

            List<CidadeDto> cidades =
                await _service.GetBatchAsync(dto.Ids);

            if (!User.IsAdmin())
                cidades = cidades.Where(cidade => cidade.Visivel).ToList();

            return Ok(cidades);
        }
    }
}
