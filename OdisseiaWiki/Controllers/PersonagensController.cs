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
    public class PersonagensController : ControllerBase
    {
        private readonly IPersonagemService _service;

        public PersonagensController(IPersonagemService service)
        {
            _service = service;
        }

        [HttpPost]
        [Authorize(Policy = AuthorizationPolicies.Admin)]
        public async Task<IActionResult> Create([FromBody] PersonagemDto dto)
        {
            ResultPersonagem resultado = await _service.CreateAsync(dto);

            if (!resultado.Sucesso)
                return BadRequest(resultado);

            return Ok(resultado);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] bool? visivel = null)
        {
            if (!User.IsAdmin())
                visivel = true;

            List<Personagen> personagens = await _service.GetAllAsync(visivel);
            return Ok(personagens);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            Personagen? personagem = await _service.GetByIdAsync(id);
            if (personagem == null || (!personagem.Visivel && !User.IsAdmin()))
                return NotFound($"Personagem com id {id} não encontrado.");

            return Ok(personagem);
        }

        [HttpPut("{id:int}")]
        [Authorize(Policy = AuthorizationPolicies.Admin)]
        public async Task<IActionResult> Update(int id, [FromBody] PersonagemDto dto)
        {
            ResultPersonagem resultado = await _service.UpdateAsync(id, dto);
            if (!resultado.Sucesso)
                return BadRequest(resultado.MensagemErro);

            return Ok(resultado.Personagem);
        }

        [HttpDelete("{id:int}")]
        [Authorize(Policy = AuthorizationPolicies.Admin)]
        public async Task<IActionResult> Delete(int id)
        {
            bool sucesso = await _service.DeleteAsync(id);
            if (!sucesso)
                return NotFound($"Personagem com id {id} não encontrado.");

            return NoContent();
        }

        [HttpPost("batch")]
        public async Task<IActionResult> GetBatch([FromBody] BatchRequestDto dto)
        {
            if (dto?.Ids == null || dto.Ids.Count == 0)
                return BadRequest("Lista de ids inválida.");

            List<Personagen> personagens =
                await _service.GetBatchAsync(dto.Ids);

            if (!User.IsAdmin())
                personagens = personagens.Where(personagem => personagem.Visivel).ToList();

            return Ok(personagens);
        }
    }
}
