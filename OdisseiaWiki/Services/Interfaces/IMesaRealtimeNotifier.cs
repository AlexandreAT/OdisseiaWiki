namespace OdisseiaWiki.Services.Interfaces;

/// <summary>
/// Ponte desacoplada entre persistência e SignalR. Services de domínio devem
/// chamá-la somente depois da transação ter sido concluída com sucesso.
/// </summary>
public interface IMesaRealtimeNotifier
{
    Task NotificarPersonagemAlteradoAsync(
        int idMesa,
        int idPersonagemJogador,
        CancellationToken cancellationToken = default);

    Task NotificarMesaAlteradaAsync(
        int idMesa,
        CancellationToken cancellationToken = default);

    Task RevogarAcessoUsuarioAsync(
        int idMesa,
        int idUsuario,
        CancellationToken cancellationToken = default);
}
