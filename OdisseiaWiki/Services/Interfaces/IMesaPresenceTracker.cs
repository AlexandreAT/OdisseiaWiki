using OdisseiaWiki.Dtos;

namespace OdisseiaWiki.Services.Interfaces;

public sealed record MesaConnectionPresence(
    int IdMesa,
    int IdUsuario,
    string IdConexao);

public sealed record MesaPresenceChange(
    MesaPresencaAtualizadaDto Snapshot,
    bool UsuariosOnlineAlterados);

public sealed record MesaPresenceRegistration(
    MesaConnectionPresence Current,
    IReadOnlyList<MesaPresenceChange> Changes);

public sealed record MesaPresenceRemoval(
    MesaConnectionPresence? Removed,
    IReadOnlyList<MesaPresenceChange> Changes);

public sealed record MesaPresenceRevocation(
    IReadOnlyList<string> ConnectionIds,
    MesaPresenceChange Change);

/// <summary>
/// Registro em memória da presença estritamente vinculada à tela "Mesa em jogo".
/// Uma pessoa conta uma única vez, independentemente da quantidade de conexões.
/// </summary>
public interface IMesaPresenceTracker
{
    MesaPresenceRegistration Register(int idMesa, int idUsuario, string idConexao);
    MesaPresenceRemoval RemoveConnection(string idConexao);
    MesaPresenceRevocation RemoveUser(int idMesa, int idUsuario);
    MesaConnectionPresence? GetConnection(string idConexao);
    MesaPresencaAtualizadaDto GetSnapshot(int idMesa);
}
