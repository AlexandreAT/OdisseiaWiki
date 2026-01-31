using Microsoft.AspNetCore.Mvc;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PersonagemJogadorController : ControllerBase
    {
        private readonly IPersonagemJogadorService _service;

        public PersonagemJogadorController(IPersonagemJogadorService service)
        {
            _service = service;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] PersonagemJogadorDto dto)
        {
            ResultPersonagemJogador resultado = await _service.CreateAsync(dto);

            if (!resultado.Sucesso)
                return BadRequest(resultado);

            return Ok(resultado);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] PersonagemJogadorDto dto)
        {
            ResultPersonagemJogador resultado = await _service.UpdateAsync(id, dto);

            if (!resultado.Sucesso)
                return BadRequest(resultado);
            
            return Ok(resultado);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
         {
            List<PersonagemJogador> personagens = await _service.GetAllAsync();
            return Ok(personagens);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            PersonagemJogador personagem = await _service.GetByIdAsync(id);

            return personagem is null
                ? NotFound($"PersonagemJogador com id {id} não encontrado.")
                : Ok(personagem);
        }

        [HttpGet("usuario/{usuarioId:int}")]
        public async Task<IActionResult> GetByUsuarioId(int usuarioId)
        {
            List<PersonagemJogador> personagens = await _service.GetByUsuarioIdAsync(usuarioId);

            if (personagens == null || !personagens.Any())
                return NotFound($"Nenhum personagem encontrado.");

            return Ok(personagens);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            bool sucesso = await _service.DeleteAsync(id);

            return !sucesso
                ? NotFound($"PersonagemJogador com id {id} não encontrado.")
                : NoContent();
        }
    }
}