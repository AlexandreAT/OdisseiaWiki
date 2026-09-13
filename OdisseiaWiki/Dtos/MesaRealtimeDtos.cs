namespace OdisseiaWiki.Dtos;

/// <summary>
/// Snapshot de presença da experiência "Mesa em jogo". A lista contém usuários
/// distintos, mesmo quando o mesmo jogador mantém mais de uma guia conectada.
/// </summary>
public sealed record MesaPresencaAtualizadaDto(
    int IdMesa,
    IReadOnlyList<int> IdsUsuariosOnline,
    DateTime AtualizadoEmUtc)
{
    public int QuantidadeUsuariosOnline => IdsUsuariosOnline.Count;
}

/// <summary>
/// Invalida informações agregadas da Mesa sem publicar seus dados no canal.
/// Alterações de personagem também usam este evento para que nem o identificador
/// de um personagem invisível seja exposto pelo transporte em tempo real.
/// </summary>
public sealed record MesaInvalidadaDto(
    int IdMesa,
    DateTime AtualizadoEmUtc);

/// <summary>
/// Informa somente à conexão removida que ela perdeu acesso à experiência ao vivo.
/// O motivo administrativo continua sendo obtido pelo fluxo persistido da Mesa.
/// </summary>
public sealed record MesaAcessoRevogadoDto(
    int IdMesa,
    DateTime AtualizadoEmUtc);
