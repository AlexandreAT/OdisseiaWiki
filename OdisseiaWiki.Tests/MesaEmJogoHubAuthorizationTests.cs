using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using Moq;
using OdisseiaWiki.Hubs;
using OdisseiaWiki.Services;
using OdisseiaWiki.Services.Interfaces;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class MesaEmJogoHubAuthorizationTests
{
    [Fact]
    public async Task EntrarNaMesa_SemIdentidadeValida_NaoConsultaNemIngressaEmGrupo()
    {
        Mock<IMesaService> mesas = new();
        Mock<IGroupManager> groups = new();
        MesaEmJogoHub hub = CreateHub(
            mesas,
            groups,
            new ClaimsPrincipal(new ClaimsIdentity()));

        HubException error = await Assert.ThrowsAsync<HubException>(
            () => hub.EntrarNaMesa(15));

        Assert.Contains("não possui acesso", error.Message);
        mesas.Verify(
            item => item.CanAccessLiveAsync(It.IsAny<int>(), It.IsAny<int>()),
            Times.Never);
        groups.Verify(
            item => item.AddToGroupAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task EntrarNaMesa_UsuarioSemVinculo_NaoIngressaEmGrupo()
    {
        Mock<IMesaService> mesas = new();
        mesas.Setup(item => item.CanAccessLiveAsync(15, 9)).ReturnsAsync(false);
        Mock<IGroupManager> groups = new();
        ClaimsPrincipal user = new(new ClaimsIdentity(
            new[] { new Claim("id", "9") },
            authenticationType: "test"));
        MesaEmJogoHub hub = CreateHub(mesas, groups, user);

        await Assert.ThrowsAsync<HubException>(() => hub.EntrarNaMesa(15));

        mesas.Verify(item => item.CanAccessLiveAsync(15, 9), Times.Once);
        groups.Verify(
            item => item.AddToGroupAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ObservarMesa_UsuarioComAcesso_EntraNoGrupoSemRegistrarPresenca()
    {
        Mock<IMesaService> mesas = new();
        mesas.Setup(item => item.CanUseAsync(15, 9)).ReturnsAsync(true);
        Mock<IGroupManager> groups = new();
        ClaimsPrincipal user = new(new ClaimsIdentity(
            new[] { new Claim("id", "9") },
            authenticationType: "test"));
        MesaEmJogoHub hub = CreateHub(mesas, groups, user);

        await hub.ObservarMesa(15);

        mesas.Verify(item => item.CanUseAsync(15, 9), Times.Once);
        mesas.Verify(
            item => item.CanAccessLiveAsync(It.IsAny<int>(), It.IsAny<int>()),
            Times.Never);
        groups.Verify(
            item => item.AddToGroupAsync(
                "connection-a",
                MesaRealtimeGroups.ForMesa(15),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ObservarMesa_UsuarioSemAcesso_NaoIngressaEmGrupo()
    {
        Mock<IMesaService> mesas = new();
        mesas.Setup(item => item.CanUseAsync(15, 9)).ReturnsAsync(false);
        Mock<IGroupManager> groups = new();
        ClaimsPrincipal user = new(new ClaimsIdentity(
            new[] { new Claim("id", "9") },
            authenticationType: "test"));
        MesaEmJogoHub hub = CreateHub(mesas, groups, user);

        await Assert.ThrowsAsync<HubException>(() => hub.ObservarMesa(15));

        groups.Verify(
            item => item.AddToGroupAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static MesaEmJogoHub CreateHub(
        Mock<IMesaService> mesas,
        Mock<IGroupManager> groups,
        ClaimsPrincipal user)
    {
        Mock<HubCallerContext> context = new();
        context.SetupGet(item => item.User).Returns(user);
        context.SetupGet(item => item.ConnectionId).Returns("connection-a");
        context.SetupGet(item => item.ConnectionAborted).Returns(CancellationToken.None);

        return new MesaEmJogoHub(mesas.Object, new MesaPresenceTracker())
        {
            Context = context.Object,
            Groups = groups.Object,
        };
    }
}
