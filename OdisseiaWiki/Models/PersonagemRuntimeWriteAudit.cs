namespace OdisseiaWiki.Models;

/// <summary>
/// Immutable audit data for a character-sheet write. The repository only uses
/// it when the character's table has an active gameplay session.
/// </summary>
public sealed record PersonagemRuntimeWriteAudit(
    int IdUsuarioAtor,
    Guid ChaveIdempotencia,
    string HashPayload,
    string TipoComando,
    string DadosEventoJson);
