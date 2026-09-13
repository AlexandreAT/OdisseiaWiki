using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Services;

/// <summary>
/// Implementação nula útil para consumidores isolados e testes unitários que não
/// inicializam o host SignalR. A aplicação web registra o notifier real.
/// </summary>
public sealed class NullMesaRealtimeNotifier : IMesaRealtimeNotifier
{
    public Task NotificarPersonagemAlteradoAsync(
        int idMesa,
        int idPersonagemJogador,
        CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    public Task NotificarMesaAlteradaAsync(
        int idMesa,
        CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    public Task RevogarAcessoUsuarioAsync(
        int idMesa,
        int idUsuario,
        CancellationToken cancellationToken = default)
        => Task.CompletedTask;
}
