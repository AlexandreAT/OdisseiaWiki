using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Security;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Controllers
{
    [ApiController]
    [Authorize]
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
            int? userId = User.GetUserId();
            if (!userId.HasValue)
                return Unauthorized();

            dto.Idusuario = userId.Value;
            ResultPersonagemJogador resultado = await _service.CreateAsync(dto);

            if (!resultado.Sucesso)
                return BadRequest(resultado);

            return CreatedAtAction(
                nameof(GetById),
                new { id = resultado.Personagem!.IdpersonagemJogador },
                resultado);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] PersonagemJogadorDto dto)
        {
            int? userId = User.GetUserId();
            if (!userId.HasValue)
                return Unauthorized();

            PersonagemJogadorDto? personagem = await _service.GetByIdAsync(id);
            if (personagem is null)
                return NotFound($"PersonagemJogador com id {id} não encontrado.");

            if (!User.IsAdmin() && personagem.Idusuario != userId.Value)
                return Forbid();

            dto.Idusuario = personagem.Idusuario;
            ResultPersonagemJogador resultado = await _service.UpdateAsync(id, dto);

            if (!resultado.Sucesso)
                return BadRequest(resultado);
            
            return Ok(resultado);
        }

        [HttpGet]
        [Authorize(Policy = AuthorizationPolicies.Admin)]
        public async Task<IActionResult> GetAll()
         {
            List<PersonagemJogadorDto> personagens = await _service.GetAllAsync();
            return Ok(personagens);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            int? userId = User.GetUserId();
            if (!userId.HasValue)
                return Unauthorized();

            PersonagemJogadorDto? personagem = await _service.GetByIdAsync(id);

            if (personagem is not null && !User.IsAdmin() && personagem.Idusuario != userId.Value)
                return Forbid();

            return personagem is null
                ? NotFound($"PersonagemJogador com id {id} não encontrado.")
                : Ok(personagem);
        }

        [HttpGet("usuario/{usuarioId:int}")]
        public async Task<IActionResult> GetByUsuarioId(int usuarioId)
        {
            int? authenticatedUserId = User.GetUserId();
            if (!authenticatedUserId.HasValue)
                return Unauthorized();

            if (!User.IsAdmin() && authenticatedUserId.Value != usuarioId)
                return Forbid();

            List<PersonagemJogadorDto> personagens = await _service.GetByUsuarioIdAsync(usuarioId);

            if (personagens == null || !personagens.Any())
                return NotFound($"Nenhum personagem encontrado.");

            return Ok(personagens);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            int? userId = User.GetUserId();
            if (!userId.HasValue)
                return Unauthorized();

            PersonagemJogadorDto? personagem = await _service.GetByIdAsync(id);
            if (personagem is null)
                return NotFound($"PersonagemJogador com id {id} não encontrado.");

            if (!User.IsAdmin() && personagem.Idusuario != userId.Value)
                return Forbid();

            bool sucesso = await _service.DeleteAsync(id);

            return !sucesso
                ? NotFound($"PersonagemJogador com id {id} não encontrado.")
                : NoContent();
        }
    }
}
