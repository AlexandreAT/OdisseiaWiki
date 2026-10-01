using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Security;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class AssetsController : ControllerBase
    {
        private readonly IAssetService _assetService;

        public AssetsController(IAssetService assetService)
        {
            _assetService = assetService;
        }

        [HttpPost("upload")]
        [EnableRateLimiting("uploads")]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(20 * 1024 * 1024)]
        public async Task<IActionResult> UploadImage([FromForm] IFormFile file, [FromForm] string type, [FromForm] string entityName, [FromForm] string? folderName = null)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { mensagemErro = "Nenhum arquivo enviado." });

            if (string.IsNullOrWhiteSpace(type) || string.IsNullOrWhiteSpace(entityName))
                return BadRequest(new { mensagemErro = "Tipo e entidade são obrigatórios." });

            string normalizedType = type.Trim().ToLowerInvariant();
            // O próprio mestre pode enviar o banner da Mesa que está criando/editando.
            // A associação do arquivo à Mesa continua protegida nos endpoints de Mesa.
            if (!User.IsAdmin() && normalizedType is not ("player" or "perfil" or "personagemjogador" or "mesa" or "mesas"))
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    mensagemErro = "Você não possui permissão para enviar este tipo de imagem."
                });

            ResultSaveImage result = await _assetService.SaveImageAsync(file, type, entityName, folderName);

            if (!result.Sucesso)
                return BadRequest(new
                {
                    mensagemErro = result.MensagemErro ?? "Não foi possível salvar a imagem."
                });

            return Ok(new
            {
                path = result.Path,
                url = result.Url,
                provider = result.Provider,
                publicId = result.PublicId,
            });
        }
    }

}
