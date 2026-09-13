using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Security;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Hubs;

[Authorize]
public sealed class MesaEmJogoHub : Hub<IMesaEmJogoClient>
{
    private readonly IMesaService _mesaService;
    private readonly IMesaPresenceTracker _presenceTracker;

    public MesaEmJogoHub(
        IMesaService mesaService,
        IMesaPresenceTracker presenceTracker)
    {
        _mesaService = mesaService;
        _presenceTracker = presenceTracker;
    }

    /// <summary>
    /// Mantém o cliente inscrito em alterações da Mesa sem registrá-lo como
    /// jogador online. Isso permite receber o início/encerramento da sessão
    /// em tempo real, mesmo enquanto a Mesa está offline.
    /// </summary>
    public async Task ObservarMesa(int idMesa)
    {
        if (idMesa <= 0)
            throw new HubException("Mesa inválida.");

        int? idUsuario = Context.User?.GetUserId();
        if (!idUsuario.HasValue || !await _mesaService.CanUseAsync(idMesa, idUsuario.Value))
            throw new HubException("Você não possui acesso a esta Mesa.");

        await Groups.AddToGroupAsync(
            Context.ConnectionId,
            MesaRealtimeGroups.ForMesa(idMesa),
            Context.ConnectionAborted);
    }

    /// <summary>
    /// Registra presença somente após validar o vínculo no servidor. O cliente
    /// informa o id da Mesa, nunca o nome interno do grupo SignalR.
    /// </summary>
    public async Task<MesaPresencaAtualizadaDto> EntrarNaMesa(int idMesa)
    {
        if (idMesa <= 0)
            throw new HubException("Mesa inválida.");

        int? idUsuario = Context.User?.GetUserId();
        if (!idUsuario.HasValue ||
            !await _mesaService.CanAccessLiveAsync(idMesa, idUsuario.Value))
        {
            throw new HubException("Você não possui acesso à Mesa em jogo.");
        }

        MesaConnectionPresence? previous =
            _presenceTracker.GetConnection(Context.ConnectionId);
        if (previous is not null && previous.IdMesa != idMesa)
        {
            await Groups.RemoveFromGroupAsync(
                Context.ConnectionId,
                MesaRealtimeGroups.ForMesa(previous.IdMesa),
                Context.ConnectionAborted);
        }

        await Groups.AddToGroupAsync(
            Context.ConnectionId,
            MesaRealtimeGroups.ForMesa(idMesa),
            Context.ConnectionAborted);

        MesaPresenceRegistration registration = _presenceTracker.Register(
            idMesa,
            idUsuario.Value,
            Context.ConnectionId);

        await BroadcastChangesAsync(registration.Changes);
        return registration.Changes
            .Single(change => change.Snapshot.IdMesa == idMesa)
            .Snapshot;
    }

    public async Task SairDaMesa()
    {
        MesaPresenceRemoval removal =
            _presenceTracker.RemoveConnection(Context.ConnectionId);
        if (removal.Removed is null)
            return;

        await Groups.RemoveFromGroupAsync(
            Context.ConnectionId,
            MesaRealtimeGroups.ForMesa(removal.Removed.IdMesa),
            Context.ConnectionAborted);
        await BroadcastChangesAsync(removal.Changes);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        MesaPresenceRemoval removal =
            _presenceTracker.RemoveConnection(Context.ConnectionId);
        await BroadcastChangesAsync(removal.Changes);
        await base.OnDisconnectedAsync(exception);
    }

    private async Task BroadcastChangesAsync(
        IEnumerable<MesaPresenceChange> changes)
    {
        foreach (MesaPresenceChange change in changes)
        {
            if (!change.UsuariosOnlineAlterados)
                continue;

            await Clients
                .Group(MesaRealtimeGroups.ForMesa(change.Snapshot.IdMesa))
                .PresencaAtualizada(change.Snapshot);
        }
    }
}
