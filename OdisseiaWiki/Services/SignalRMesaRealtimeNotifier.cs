using Microsoft.AspNetCore.SignalR;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Hubs;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Services;

public sealed class SignalRMesaRealtimeNotifier : IMesaRealtimeNotifier
{
    private static readonly TimeSpan RealtimeBroadcastTimeout = TimeSpan.FromSeconds(2);

    private readonly IHubContext<MesaEmJogoHub, IMesaEmJogoClient> _hub;
    private readonly IMesaPresenceTracker _presenceTracker;
    private readonly ILogger<SignalRMesaRealtimeNotifier> _logger;

    public SignalRMesaRealtimeNotifier(
        IHubContext<MesaEmJogoHub, IMesaEmJogoClient> hub,
        IMesaPresenceTracker presenceTracker,
        ILogger<SignalRMesaRealtimeNotifier> logger)
    {
        _hub = hub;
        _presenceTracker = presenceTracker;
        _logger = logger;
    }

    public Task NotificarPersonagemAlteradoAsync(
        int idMesa,
        int idPersonagemJogador,
        CancellationToken cancellationToken = default)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(idMesa);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(idPersonagemJogador);

        // O id é validado para detectar integração incorreta, mas não é enviado.
        // O cliente relê a projeção autorizada da Mesa, evitando que o Hub revele
        // até mesmo a existência de um personagem configurado como invisível.
        MesaInvalidadaDto evento = new(idMesa, DateTime.UtcNow, "personagens");
        return BroadcastSafelyAsync(
            idMesa,
            "personagens",
            () => _hub.Clients.Group(MesaRealtimeGroups.ForMesa(idMesa)).MesaInvalidada(evento));
    }

    public Task NotificarMesaAlteradaAsync(
        int idMesa,
        CancellationToken cancellationToken = default)
        => NotificarMesaSecaoAlteradaAsync(idMesa, "mesa", cancellationToken);

    public Task NotificarMesaSecaoAlteradaAsync(
        int idMesa,
        string secao,
        CancellationToken cancellationToken = default)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(idMesa);

        MesaInvalidadaDto evento = new(idMesa, DateTime.UtcNow, secao);
        return BroadcastSafelyAsync(
            idMesa,
            secao,
            () => _hub.Clients.Group(MesaRealtimeGroups.ForMesa(idMesa)).MesaInvalidada(evento));
    }

    public async Task RevogarAcessoUsuarioAsync(
        int idMesa,
        int idUsuario,
        CancellationToken cancellationToken = default)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(idMesa);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(idUsuario);

        MesaPresenceRevocation revocation =
            _presenceTracker.RemoveUser(idMesa, idUsuario);
        if (revocation.ConnectionIds.Count == 0)
            return;

        try
        {
            foreach (string connectionId in revocation.ConnectionIds)
            {
                await _hub.Groups.RemoveFromGroupAsync(
                    connectionId,
                    MesaRealtimeGroups.ForMesa(idMesa),
                    cancellationToken);
            }

            MesaAcessoRevogadoDto evento = new(idMesa, DateTime.UtcNow);
            await _hub.Clients
                .Clients(revocation.ConnectionIds)
                .AcessoRevogado(evento);

            await _hub.Clients
                .Group(MesaRealtimeGroups.ForMesa(idMesa))
                .PresencaAtualizada(revocation.Change.Snapshot);
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception,
                "Falha ao notificar a revogação de acesso da Mesa {MesaId}.",
                idMesa);
        }
    }

    private async Task BroadcastSafelyAsync(int idMesa, string secao, Func<Task> broadcast)
    {
        try
        {
            Task broadcastTask = broadcast();
            Task completedTask = await Task.WhenAny(
                broadcastTask,
                Task.Delay(RealtimeBroadcastTimeout));

            if (completedTask != broadcastTask)
            {
                _ = broadcastTask.ContinueWith(
                    task => _logger.LogDebug(
                        task.Exception,
                        "A transmiss\u00e3o atrasada da se\u00e7\u00e3o {Section} da Mesa {MesaId} falhou ap\u00f3s o tempo limite.",
                        secao,
                        idMesa),
                    CancellationToken.None,
                    TaskContinuationOptions.OnlyOnFaulted | TaskContinuationOptions.ExecuteSynchronously,
                    TaskScheduler.Default);

                _logger.LogWarning(
                    "A transmiss\u00e3o da se\u00e7\u00e3o {Section} da Mesa {MesaId} excedeu o tempo limite. O comando salvo seguir\u00e1 normalmente.",
                    secao,
                    idMesa);
                return;
            }

            await broadcastTask;
        }
        catch (OperationCanceledException)
        {
            // A conexão do destinatário foi encerrada. O comando já está persistido.
        }
        catch (Exception exception)
        {
            // The command was already committed before the broadcast starts.
            // A transient transport failure must not fail the gameplay command.
            _logger.LogWarning(exception,
                "Falha ao notificar a seção {Section} da Mesa {MesaId} em tempo real.",
                secao,
                idMesa);
        }
    }
}
