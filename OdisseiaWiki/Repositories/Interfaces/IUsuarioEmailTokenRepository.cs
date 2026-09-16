using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;

namespace OdisseiaWiki.Repositories.Interfaces;

public interface IUsuarioEmailTokenRepository
{
    Task CreateReplacingActiveAsync(UsuarioEmailToken token, DateTime agora);
    Task InvalidateActiveAsync(int idUsuario, UsuarioEmailTokenTipo tipo, DateTime agora);
    Task<Usuario?> ConsumeEmailConfirmationAsync(string hashToken, DateTime agora);
    Task<Usuario?> ConsumePasswordResetAsync(string hashToken, string senhaHash, DateTime agora);
}
