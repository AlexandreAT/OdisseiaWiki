using Microsoft.AspNetCore.Mvc;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PagesController : ControllerBase
    {
        private readonly IPageService _service;

        public PagesController(IPageService service)
        {
            _service = service;
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreatePageWithBlocksDto dto)
        {
            var result = await _service.CreateAsync(dto);
            return Ok(result);
        }

        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string termo)
        {
            List<SearchItemDto> result = await _service.SearchAsync(termo);

            return Ok(new
            {
                sucesso = true,
                pages = result
            });
        }

        [HttpGet("{slug}")]
        public async Task<IActionResult> GetBySlug(string slug)
        {
            var page = await _service.GetBySlugAsync(slug);

            if (page == null)
                return NotFound(ResultPage.Fail("Página não encontrada."));

            return Ok(ResultPage.Ok(page));
        }

        [HttpGet("id/{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var page = await _service.GetByIdAsync(id);

            if (page == null)
                return NotFound(ResultPage.Fail("Página não encontrada."));

            return Ok(ResultPage.Ok(page));
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] bool? visivel = null)
        {
            var pages = await _service.GetAllAsync(visivel);

            return Ok(ResultPage.Ok(pages));
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] CreatePageWithBlocksDto dto)
        {
            try
            {
                PageDto result = await _service.UpdateAsync(id, dto);

                return Ok(new
                {
                    sucesso = true,
                    page = result
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    sucesso = false,
                    mensagemErro = ex.Message
                });
            }
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            bool deleted = await _service.DeleteAsync(id);

            if (!deleted)
                return NotFound();

            return NoContent();
        }
    }
}
