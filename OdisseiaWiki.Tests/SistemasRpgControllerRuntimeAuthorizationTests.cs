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

public sealed class SistemasRpgControllerRuntimeAuthorizationTests
{
    [Fact]
    public async Task ResolverContextoRuntime_ContextoGlobalPermanecePublico()
    {
        (SistemasRpgController controller, Mock<ISistemaRpgResolver> resolver, Mock<IMesaService> mesas) =
            NovoController(new ClaimsPrincipal(new ClaimsIdentity()));
        SistemaRuntimeContextoDto contexto = new();
        resolver.Setup(service => service.ResolverContextoAsync(It.IsAny<SistemaRuntimeConsultaDto>()))
            .ReturnsAsync(contexto);

        ActionResult<SistemaRuntimeContextoDto> response =
            await controller.ResolverContextoRuntime(new SistemaRuntimeConsultaDto());

        OkObjectResult ok = Assert.IsType<OkObjectResult>(response.Result);
        Assert.Same(contexto, ok.Value);
        mesas.Verify(service => service.CanUseAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task ResolverContextoRuntime_MesaSemAutenticacaoRetornaUnauthorized()
    {
        (SistemasRpgController controller, Mock<ISistemaRpgResolver> resolver, _) =
            NovoController(new ClaimsPrincipal(new ClaimsIdentity()));

        ActionResult<SistemaRuntimeContextoDto> response =
            await controller.ResolverContextoRuntime(new SistemaRuntimeConsultaDto { IdMesa = 7 });

        Assert.IsType<UnauthorizedResult>(response.Result);
        resolver.Verify(service => service.ResolverContextoAsync(It.IsAny<SistemaRuntimeConsultaDto>()), Times.Never);
    }

    [Fact]
    public async Task ResolverContextoRuntime_MesaSemPermissaoRetornaForbidden()
    {
        (SistemasRpgController controller, Mock<ISistemaRpgResolver> resolver, Mock<IMesaService> mesas) =
            NovoController(Usuario(3));
        mesas.Setup(service => service.CanUseAsync(7, 3)).ReturnsAsync(false);

        ActionResult<SistemaRuntimeContextoDto> response =
            await controller.ResolverContextoRuntime(new SistemaRuntimeConsultaDto { IdMesa = 7 });

        Assert.IsType<ForbidResult>(response.Result);
        resolver.Verify(service => service.ResolverContextoAsync(It.IsAny<SistemaRuntimeConsultaDto>()), Times.Never);
    }

    [Fact]
    public async Task ResolverContextoRuntime_UsuarioAutorizadoPodeResolverMesa()
    {
        (SistemasRpgController controller, Mock<ISistemaRpgResolver> resolver, Mock<IMesaService> mesas) =
            NovoController(Usuario(3));
        SistemaRuntimeContextoDto contexto = new() { IdMesa = 7 };
        mesas.Setup(service => service.CanUseAsync(7, 3)).ReturnsAsync(true);
        resolver.Setup(service => service.ResolverContextoAsync(It.IsAny<SistemaRuntimeConsultaDto>()))
            .ReturnsAsync(contexto);

        ActionResult<SistemaRuntimeContextoDto> response =
            await controller.ResolverContextoRuntime(new SistemaRuntimeConsultaDto { IdMesa = 7 });

        OkObjectResult ok = Assert.IsType<OkObjectResult>(response.Result);
        Assert.Same(contexto, ok.Value);
    }

    [Fact]
    public async Task ResolverContextoRuntime_AdminIgnoraVinculoDaMesa()
    {
        ClaimsPrincipal admin = Usuario(1, AuthorizationPolicies.AdminRole);
        (SistemasRpgController controller, Mock<ISistemaRpgResolver> resolver, Mock<IMesaService> mesas) =
            NovoController(admin);
        resolver.Setup(service => service.ResolverContextoAsync(It.IsAny<SistemaRuntimeConsultaDto>()))
            .ReturnsAsync(new SistemaRuntimeContextoDto { IdMesa = 7 });

        ActionResult<SistemaRuntimeContextoDto> response =
            await controller.ResolverContextoRuntime(new SistemaRuntimeConsultaDto { IdMesa = 7 });

        Assert.IsType<OkObjectResult>(response.Result);
        mesas.Verify(service => service.CanUseAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task ResolverLegado_ContextoGlobalPermanecePublico()
    {
        (SistemasRpgController controller, Mock<ISistemaRpgResolver> resolver, Mock<IMesaService> mesas) =
            NovoController(new ClaimsPrincipal(new ClaimsIdentity()));
        SistemaResolvidoDto contexto = new();
        resolver.Setup(service => service.ResolverAsync(null)).ReturnsAsync(contexto);

        ActionResult<SistemaResolvidoDto> response = await controller.Resolver();

        OkObjectResult ok = Assert.IsType<OkObjectResult>(response.Result);
        Assert.Same(contexto, ok.Value);
        mesas.Verify(service => service.CanUseAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task ResolverLegado_MesaSemAutenticacaoRetornaUnauthorized()
    {
        (SistemasRpgController controller, Mock<ISistemaRpgResolver> resolver, _) =
            NovoController(new ClaimsPrincipal(new ClaimsIdentity()));

        ActionResult<SistemaResolvidoDto> response = await controller.Resolver(7);

        Assert.IsType<UnauthorizedResult>(response.Result);
        resolver.Verify(service => service.ResolverAsync(It.IsAny<int?>()), Times.Never);
    }

    [Fact]
    public async Task ResolverLegado_MesaSemPermissaoRetornaForbidden()
    {
        (SistemasRpgController controller, Mock<ISistemaRpgResolver> resolver, Mock<IMesaService> mesas) =
            NovoController(Usuario(3));
        mesas.Setup(service => service.CanUseAsync(7, 3)).ReturnsAsync(false);

        ActionResult<SistemaResolvidoDto> response = await controller.Resolver(7);

        Assert.IsType<ForbidResult>(response.Result);
        resolver.Verify(service => service.ResolverAsync(It.IsAny<int?>()), Times.Never);
    }

    private static (SistemasRpgController Controller, Mock<ISistemaRpgResolver> Resolver, Mock<IMesaService> Mesas)
        NovoController(ClaimsPrincipal user)
    {
        Mock<ISistemaRpgService> service = new();
        Mock<ISistemaRpgResolver> resolver = new();
        Mock<IMesaService> mesas = new();
        Mock<IPersonagemJogadorService> personagens = new();
        SistemasRpgController controller = new(
            service.Object,
            resolver.Object,
            mesas.Object,
            personagens.Object)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user },
            },
        };

        return (controller, resolver, mesas);
    }

    private static ClaimsPrincipal Usuario(int id, string? role = null)
    {
        List<Claim> claims = new() { new Claim(ClaimTypes.NameIdentifier, id.ToString()) };
        if (!string.IsNullOrWhiteSpace(role))
            claims.Add(new Claim(ClaimTypes.Role, role));

        return new ClaimsPrincipal(new ClaimsIdentity(claims, "Test"));
    }
}
