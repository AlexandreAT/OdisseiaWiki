using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;
using OdisseiaWiki.Services;
using OdisseiaWiki.Services.Interfaces;
using OdisseiaWiki.Security;

namespace OdisseiaWiki.Controllers
{
    [ApiController]
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
        [AllowAnonymous]
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
        [AllowAnonymous]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginDto dto)
        {
            ResultLoginUsuario resultado = await _service.LoginGoogleAsync(dto.TokenGoogle);

            if (!resultado.Sucesso)
                return BadRequest(resultado);

            return Ok(resultado);
        }

        [HttpPost("login")]
        [AllowAnonymous]
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
        [AllowAnonymous]
        [EnableRateLimiting("account-email")]
        public async Task<IActionResult> ConfirmEmail([FromBody] ConfirmarEmailDto dto)
        {
            ResultAccountAction resultado = await _service.ConfirmarEmailAsync(dto.Token);
            return resultado.Sucesso ? Ok(resultado) : BadRequest(resultado);
        }

        [HttpPost("email-confirmation/resend")]
        [AllowAnonymous]
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
        [AllowAnonymous]
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
        [AllowAnonymous]
        [EnableRateLimiting("account-email")]
        public async Task<IActionResult> ResetPassword([FromBody] RedefinirSenhaDto dto)
        {
            ResultAccountAction resultado = await _service.RedefinirSenhaAsync(dto);
            return resultado.Sucesso ? Ok(resultado) : BadRequest(resultado);
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetCurrentProfile()
        {
            int? idUsuario = User.GetUserId();
            if (!idUsuario.HasValue)
                return Unauthorized();

            UsuarioPerfilDto? perfil = await _service.ObterPerfilAsync(idUsuario.Value);
            return perfil is null ? NotFound("Usuário não encontrado.") : Ok(perfil);
        }

        [HttpPatch("me")]
        [Authorize]
        public async Task<IActionResult> UpdateCurrentProfile([FromBody] AtualizarUsuarioPerfilDto dto)
        {
            int? idUsuario = User.GetUserId();
            if (!idUsuario.HasValue)
                return Unauthorized();

            ResultUsuarioPerfil resultado = await _service.AtualizarPerfilAsync(idUsuario.Value, dto);
            if (!resultado.Sucesso)
                return resultado.MensagemErro == "Usuário não encontrado."
                    ? NotFound(resultado.MensagemErro)
                    : BadRequest(resultado.MensagemErro);

            return Ok(resultado.Dados);
        }

        [HttpPost("me/password-recovery")]
        [Authorize]
        [EnableRateLimiting("account-email")]
        public async Task<IActionResult> RequestCurrentUserPasswordReset()
        {
            int? idUsuario = User.GetUserId();
            if (!idUsuario.HasValue)
                return Unauthorized();

            ResultAccountAction resultado = await _service
                .SolicitarRedefinicaoSenhaDoUsuarioAsync(idUsuario.Value);
            return resultado.Sucesso ? Ok(resultado) : BadRequest(resultado);
        }

        [HttpDelete("me")]
        [Authorize]
        public async Task<IActionResult> DeleteCurrentAccount([FromBody] ExcluirContaDto dto)
        {
            int? idUsuario = User.GetUserId();
            if (!idUsuario.HasValue)
                return Unauthorized();

            ResultAccountAction resultado = await _service.ExcluirContaAsync(
                idUsuario.Value,
                dto.Confirmacao);
            return resultado.Sucesso ? NoContent() : BadRequest(resultado);
        }
    }
}
