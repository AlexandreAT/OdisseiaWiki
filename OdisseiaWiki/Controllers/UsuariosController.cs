using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;
using OdisseiaWiki.Services;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Controllers
{
    [ApiController]
    [AllowAnonymous]
    [EnableRateLimiting("authentication")]
    [Route("api/[controller]")]
    public class UsuariosController : ControllerBase
    {
        private readonly IUsuarioService _service;

        public UsuariosController(IUsuarioService service)
        {
            _service = service;
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
                return resultado.EmailNaoConfirmado
                    ? BadRequest(resultado)
                    : BadRequest(resultado.MensagemErro);

            return Ok(resultado);
        }

        [HttpPost("email-confirmation/confirm")]
        [EnableRateLimiting("account-email")]
        public async Task<IActionResult> ConfirmEmail([FromBody] ConfirmarEmailDto dto)
        {
            ResultAccountAction resultado = await _service.ConfirmarEmailAsync(dto.Token);
            return resultado.Sucesso ? Ok(resultado) : BadRequest(resultado);
        }

        [HttpPost("email-confirmation/resend")]
        [EnableRateLimiting("account-email")]
        public async Task<IActionResult> ResendEmailConfirmation([FromBody] SolicitarEmailDto dto)
        {
            await _service.ReenviarConfirmacaoEmailAsync(dto.Email);
            return Ok(new
            {
                sucesso = true,
                mensagem = "Se houver uma conta pendente vinculada a este e-mail, enviaremos um novo link.",
            });
        }

        [HttpPost("password-recovery")]
        [EnableRateLimiting("account-email")]
        public async Task<IActionResult> RequestPasswordReset([FromBody] SolicitarEmailDto dto)
        {
            await _service.SolicitarRedefinicaoSenhaAsync(dto.Email);
            return Ok(new
            {
                sucesso = true,
                mensagem = "Se existir uma conta vinculada a este e-mail, enviaremos as instruções de recuperação e o nickname para entrar.",
            });
        }

        [HttpPost("password-reset")]
        [EnableRateLimiting("account-email")]
        public async Task<IActionResult> ResetPassword([FromBody] RedefinirSenhaDto dto)
        {
            ResultAccountAction resultado = await _service.RedefinirSenhaAsync(dto);
            return resultado.Sucesso ? Ok(resultado) : BadRequest(resultado);
        }
    }
}
