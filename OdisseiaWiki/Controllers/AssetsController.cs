using Microsoft.AspNetCore.Mvc;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AssetsController : ControllerBase
    {
        private readonly IAssetService _assetService;

        public AssetsController(IAssetService assetService)
        {
            _assetService = assetService;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadImage([FromForm] IFormFile file, [FromForm] string type, [FromForm] string entityName, [FromForm] string? folderName = null)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Nenhum arquivo enviado.");

            ResultSaveImage result = await _assetService.SaveImageAsync(file, type, entityName, folderName);

            if (!result.Sucesso)
                return BadRequest(result.MensagemErro);

            return Ok(new { path = result.Path });
        }
    }

}
