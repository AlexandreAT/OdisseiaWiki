using OdisseiaWiki.Dtos;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Services;

/// <summary>
/// Registro local e thread-safe de presença. O estado é efêmero por definição:
/// após reinício, cada cliente SignalR reconecta e registra novamente sua presença.
/// </summary>
public sealed class MesaPresenceTracker : IMesaPresenceTracker
{
    private readonly object _sync = new();
    private readonly Dictionary<string, MesaConnectionPresence> _connections =
        new(StringComparer.Ordinal);
    private readonly Dictionary<int, Dictionary<int, HashSet<string>>> _mesas = new();

    public MesaPresenceRegistration Register(int idMesa, int idUsuario, string idConexao)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(idMesa);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(idUsuario);
        ArgumentException.ThrowIfNullOrWhiteSpace(idConexao);

        lock (_sync)
        {
            if (_connections.TryGetValue(idConexao, out MesaConnectionPresence? current) &&
                current.IdMesa == idMesa &&
                current.IdUsuario == idUsuario)
            {
                return new MesaPresenceRegistration(
                    current,
                    new[] { new MesaPresenceChange(CreateSnapshotUnsafe(idMesa), false) });
            }

            List<MesaPresenceChange> changes = new();
            if (current is not null)
            {
                bool oldUsersChanged = RemoveConnectionUnsafe(current);
                changes.Add(new MesaPresenceChange(
                    CreateSnapshotUnsafe(current.IdMesa),
                    oldUsersChanged));
            }

            if (!_mesas.TryGetValue(idMesa, out Dictionary<int, HashSet<string>>? users))
            {
                users = new Dictionary<int, HashSet<string>>();
                _mesas[idMesa] = users;
            }

            bool newUserOnline = !users.TryGetValue(idUsuario, out HashSet<string>? userConnections);
            if (userConnections is null)
            {
                userConnections = new HashSet<string>(StringComparer.Ordinal);
                users[idUsuario] = userConnections;
            }

            userConnections.Add(idConexao);
            MesaConnectionPresence registered = new(idMesa, idUsuario, idConexao);
            _connections[idConexao] = registered;
            changes.Add(new MesaPresenceChange(CreateSnapshotUnsafe(idMesa), newUserOnline));

            return new MesaPresenceRegistration(registered, MergeChanges(changes));
        }
    }

    public MesaPresenceRemoval RemoveConnection(string idConexao)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(idConexao);

        lock (_sync)
        {
            if (!_connections.TryGetValue(idConexao, out MesaConnectionPresence? presence))
                return new MesaPresenceRemoval(null, Array.Empty<MesaPresenceChange>());

            bool usersChanged = RemoveConnectionUnsafe(presence);
            return new MesaPresenceRemoval(
                presence,
                new[]
                {
                    new MesaPresenceChange(CreateSnapshotUnsafe(presence.IdMesa), usersChanged),
                });
        }
    }

    public MesaPresenceRevocation RemoveUser(int idMesa, int idUsuario)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(idMesa);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(idUsuario);

        lock (_sync)
        {
            if (!_mesas.TryGetValue(idMesa, out Dictionary<int, HashSet<string>>? users) ||
                !users.TryGetValue(idUsuario, out HashSet<string>? connections))
            {
                return new MesaPresenceRevocation(
                    Array.Empty<string>(),
                    new MesaPresenceChange(CreateSnapshotUnsafe(idMesa), false));
            }

            string[] connectionIds = connections.Order(StringComparer.Ordinal).ToArray();
            foreach (string connectionId in connectionIds)
                _connections.Remove(connectionId);

            users.Remove(idUsuario);
            if (users.Count == 0)
                _mesas.Remove(idMesa);

            return new MesaPresenceRevocation(
                connectionIds,
                new MesaPresenceChange(CreateSnapshotUnsafe(idMesa), true));
        }
    }

    public MesaConnectionPresence? GetConnection(string idConexao)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(idConexao);

        lock (_sync)
            return _connections.GetValueOrDefault(idConexao);
    }

    public MesaPresencaAtualizadaDto GetSnapshot(int idMesa)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(idMesa);

        lock (_sync)
            return CreateSnapshotUnsafe(idMesa);
    }

    private bool RemoveConnectionUnsafe(MesaConnectionPresence presence)
    {
        _connections.Remove(presence.IdConexao);
        if (!_mesas.TryGetValue(
                presence.IdMesa,
                out Dictionary<int, HashSet<string>>? users) ||
            !users.TryGetValue(presence.IdUsuario, out HashSet<string>? userConnections))
        {
            return false;
        }

        userConnections.Remove(presence.IdConexao);
        if (userConnections.Count > 0)
            return false;

        users.Remove(presence.IdUsuario);
        if (users.Count == 0)
            _mesas.Remove(presence.IdMesa);

        return true;
    }

    private MesaPresencaAtualizadaDto CreateSnapshotUnsafe(int idMesa)
    {
        int[] onlineUserIds = _mesas.TryGetValue(
                idMesa,
                out Dictionary<int, HashSet<string>>? users)
            ? users.Keys.Order().ToArray()
            : Array.Empty<int>();

        return new MesaPresencaAtualizadaDto(idMesa, onlineUserIds, DateTime.UtcNow);
    }

    private static IReadOnlyList<MesaPresenceChange> MergeChanges(
        IEnumerable<MesaPresenceChange> changes)
        => changes
            .GroupBy(change => change.Snapshot.IdMesa)
            .Select(group => new MesaPresenceChange(
                group.Last().Snapshot,
                group.Any(change => change.UsuariosOnlineAlterados)))
            .ToArray();
}
