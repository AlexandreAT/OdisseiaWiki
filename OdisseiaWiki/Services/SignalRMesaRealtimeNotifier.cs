using Microsoft.AspNetCore.SignalR;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Hubs;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Services;

public sealed class SignalRMesaRealtimeNotifier : IMesaRealtimeNotifier
{
    private readonly IHubContext<MesaEmJogoHub, IMesaEmJogoClient> _hub;
    private readonly IMesaPresenceTracker _presenceTracker;

    public SignalRMesaRealtimeNotifier(
        IHubContext<MesaEmJogoHub, IMesaEmJogoClient> hub,
        IMesaPresenceTracker presenceTracker)
    {
        _hub = hub;
        _presenceTracker = presenceTracker;
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
        MesaInvalidadaDto evento = new(idMesa, DateTime.UtcNow);
        return _hub.Clients
            .Group(MesaRealtimeGroups.ForMesa(idMesa))
            .MesaInvalidada(evento);
    }

    public Task NotificarMesaAlteradaAsync(
        int idMesa,
        CancellationToken cancellationToken = default)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(idMesa);

        MesaInvalidadaDto evento = new(idMesa, DateTime.UtcNow);
        return _hub.Clients
            .Group(MesaRealtimeGroups.ForMesa(idMesa))
            .MesaInvalidada(evento);
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
}
