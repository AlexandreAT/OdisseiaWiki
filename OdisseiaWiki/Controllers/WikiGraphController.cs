using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Security;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/wiki/graph")]
public sealed class WikiGraphController : ControllerBase
{
    private readonly IWikiGraphService _service;

    public WikiGraphController(IWikiGraphService service)
    {
        _service = service;
    }

    [HttpGet]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<ActionResult<WikiGraphDto>> Get(CancellationToken cancellationToken)
    {
        bool includeHiddenMetadata = User.Identity?.IsAuthenticated == true && User.IsAdmin();
        WikiGraphDto graph = await _service.GetAsync(includeHiddenMetadata, cancellationToken);
        return Ok(graph);
    }
}
