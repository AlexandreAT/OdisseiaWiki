using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Security;
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
        [Authorize(Policy = AuthorizationPolicies.Admin)]
        public async Task<IActionResult> Create(CreatePageWithBlocksDto dto)
        {
            var result = await _service.CreateAsync(dto);
            return Ok(result);
        }

        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string termo)
        {
            List<SearchItemDto> result = await _service.SearchAsync(termo);

            if (!User.IsAdmin())
                result = result.Where(page => page.Visivel).ToList();

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

            if (page == null || (!page.Visivel && !User.IsAdmin()))
                return NotFound(ResultPage.Fail("Página não encontrada."));

            return Ok(ResultPage.Ok(page));
        }

        [HttpGet("id/{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var page = await _service.GetByIdAsync(id);

            if (page == null || (!page.Visivel && !User.IsAdmin()))
                return NotFound(ResultPage.Fail("Página não encontrada."));

            return Ok(ResultPage.Ok(page));
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] bool? visivel = null)
        {
            if (!User.IsAdmin())
                visivel = true;

            var pages = await _service.GetAllAsync(visivel);

            return Ok(ResultPage.Ok(pages));
        }

        [HttpGet("referencing/{entityType}/{entityId}")]
        public async Task<IActionResult> GetReferencing(
            string entityType,
            string entityId,
            [FromQuery] bool? visivel = null)
        {
            if (!User.IsAdmin())
                visivel = true;

            List<PageDto> pages = await _service.GetReferencingAsync(entityType, entityId, visivel);
            return Ok(ResultPage.Ok(pages));
        }

        [HttpPut("{id:int}")]
        [Authorize(Policy = AuthorizationPolicies.Admin)]
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
            catch (InvalidOperationException ex)
            {
                return BadRequest(new
                {
                    sucesso = false,
                    mensagemErro = ex.Message
                });
            }
        }

        [HttpDelete("{id:int}")]
        [Authorize(Policy = AuthorizationPolicies.Admin)]
        public async Task<IActionResult> Delete(int id)
        {
            bool deleted = await _service.DeleteAsync(id);

            if (!deleted)
                return NotFound();

            return NoContent();
        }
    }
}
