using Microsoft.AspNetCore.Mvc;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;
using OdisseiaWiki.Services;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsuariosController : ControllerBase
    {
        private readonly IUsuarioService _service;
        private readonly ITokenService _tokenService;

        public UsuariosController(IUsuarioService service, ITokenService tokenService)
        {
            _service = service;
            _tokenService = tokenService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterUsuarioDto dto)
        {
            ResultRegisterUsuario resultado = await _service.Register(dto);

            if (!resultado.Sucesso)
                return BadRequest(resultado.MensagemErro);

            Usuario usuario = resultado.Usuario!;
            return Ok(new
            {
                usuario.Idusuario,
                usuario.Nome,
                usuario.Email,
                usuario.Nickname,
                usuario.ImagemUrl
            });
        }

        [HttpPost("google-login")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginDto dto)
        {
            ResultLoginUsuario resultado = await _service.LoginGoogleAsync(dto.TokenGoogle);

            if (!resultado.Sucesso)
                return BadRequest(resultado);

            return Ok(resultado);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginUsuarioDto dto)
        {
            ResultLoginUsuario resultado = await _service.Login(dto);

            if (!resultado.Sucesso)
                return BadRequest(resultado.MensagemErro);

            return Ok(resultado);
        }
    }
}
