using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using OdisseiaWiki.Controllers;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Security;
using OdisseiaWiki.Services.Interfaces;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class WikiGraphControllerTests
{
    [Fact]
    public async Task Get_AdminAutenticadoSolicitaMetadadosOcultos()
    {
        ClaimsPrincipal user = new(new ClaimsIdentity(
            new[] { new Claim(ClaimTypes.Role, AuthorizationPolicies.AdminRole) },
            authenticationType: "Test"));
        (WikiGraphController controller, Mock<IWikiGraphService> service, WikiGraphDto expected) =
            CreateController(user, includeHiddenMetadata: true);

        ActionResult<WikiGraphDto> result = await controller.Get(CancellationToken.None);

        OkObjectResult ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(expected, ok.Value);
        service.Verify(
            item => item.GetAsync(true, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Get_ClaimAdminSemIdentidadeAutenticadaMantemProjecaoPublica()
    {
        ClaimsPrincipal user = new(new ClaimsIdentity(
            new[] { new Claim(ClaimTypes.Role, AuthorizationPolicies.AdminRole) }));
        (WikiGraphController controller, Mock<IWikiGraphService> service, WikiGraphDto expected) =
            CreateController(user, includeHiddenMetadata: false);

        ActionResult<WikiGraphDto> result = await controller.Get(CancellationToken.None);

        OkObjectResult ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(expected, ok.Value);
        service.Verify(
            item => item.GetAsync(false, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static (
        WikiGraphController Controller,
        Mock<IWikiGraphService> Service,
        WikiGraphDto Expected) CreateController(
            ClaimsPrincipal user,
            bool includeHiddenMetadata)
    {
        WikiGraphDto expected = new();
        Mock<IWikiGraphService> service = new(MockBehavior.Strict);
        service
            .Setup(item => item.GetAsync(includeHiddenMetadata, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        WikiGraphController controller = new(service.Object)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            }
        };

        return (controller, service, expected);
    }
}
