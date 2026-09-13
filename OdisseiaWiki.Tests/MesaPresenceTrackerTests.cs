using OdisseiaWiki.Services;
using OdisseiaWiki.Services.Interfaces;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class MesaPresenceTrackerTests
{
    [Fact]
    public void Register_MultiplasConexoesDoMesmoUsuario_ContaUmaUnicaPresenca()
    {
        MesaPresenceTracker tracker = new();

        MesaPresenceRegistration first = tracker.Register(10, 7, "connection-a");
        MesaPresenceRegistration second = tracker.Register(10, 7, "connection-b");

        Assert.True(first.Changes.Single().UsuariosOnlineAlterados);
        Assert.False(second.Changes.Single().UsuariosOnlineAlterados);
        Assert.Equal(new[] { 7 }, tracker.GetSnapshot(10).IdsUsuariosOnline);
        Assert.Equal(1, tracker.GetSnapshot(10).QuantidadeUsuariosOnline);
    }

    [Fact]
    public void RemoveConnection_MantemUsuarioOnlineEnquantoOutraGuiaEstiverConectada()
    {
        MesaPresenceTracker tracker = new();
        tracker.Register(10, 7, "connection-a");
        tracker.Register(10, 7, "connection-b");

        MesaPresenceRemoval firstRemoval = tracker.RemoveConnection("connection-a");
        MesaPresenceRemoval lastRemoval = tracker.RemoveConnection("connection-b");

        Assert.False(firstRemoval.Changes.Single().UsuariosOnlineAlterados);
        Assert.True(lastRemoval.Changes.Single().UsuariosOnlineAlterados);
        Assert.Empty(tracker.GetSnapshot(10).IdsUsuariosOnline);
    }

    [Fact]
    public void Register_MesmaConexaoEmOutraMesa_RemovePresencaDaMesaAnterior()
    {
        MesaPresenceTracker tracker = new();
        tracker.Register(10, 7, "connection-a");

        MesaPresenceRegistration registration =
            tracker.Register(20, 7, "connection-a");

        Assert.Equal(2, registration.Changes.Count);
        Assert.All(registration.Changes, change =>
            Assert.True(change.UsuariosOnlineAlterados));
        Assert.Empty(tracker.GetSnapshot(10).IdsUsuariosOnline);
        Assert.Equal(new[] { 7 }, tracker.GetSnapshot(20).IdsUsuariosOnline);
        Assert.Equal(20, tracker.GetConnection("connection-a")?.IdMesa);
    }

    [Fact]
    public void RemoveUser_RevogaTodasAsConexoesESomenteDaMesaInformada()
    {
        MesaPresenceTracker tracker = new();
        tracker.Register(10, 7, "connection-a");
        tracker.Register(10, 7, "connection-b");
        tracker.Register(10, 8, "connection-c");
        tracker.Register(20, 7, "connection-d");

        MesaPresenceRevocation revocation = tracker.RemoveUser(10, 7);

        Assert.Equal(new[] { "connection-a", "connection-b" }, revocation.ConnectionIds);
        Assert.True(revocation.Change.UsuariosOnlineAlterados);
        Assert.Equal(new[] { 8 }, revocation.Change.Snapshot.IdsUsuariosOnline);
        Assert.Null(tracker.GetConnection("connection-a"));
        Assert.Equal(new[] { 7 }, tracker.GetSnapshot(20).IdsUsuariosOnline);
    }

    [Fact]
    public async Task OperacoesConcorrentes_PreservamUsuariosDistintosSemDuplicacao()
    {
        MesaPresenceTracker tracker = new();

        await Task.WhenAll(Enumerable.Range(1, 100).Select(index => Task.Run(() =>
            tracker.Register(10, (index % 10) + 1, $"connection-{index}"))));

        Assert.Equal(10, tracker.GetSnapshot(10).QuantidadeUsuariosOnline);

        await Task.WhenAll(Enumerable.Range(1, 100).Select(index => Task.Run(() =>
            tracker.RemoveConnection($"connection-{index}"))));

        Assert.Empty(tracker.GetSnapshot(10).IdsUsuariosOnline);
    }
}
