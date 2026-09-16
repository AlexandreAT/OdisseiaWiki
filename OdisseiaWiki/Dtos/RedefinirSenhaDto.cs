namespace OdisseiaWiki.Dtos;

public sealed class RedefinirSenhaDto
{
    public string Token { get; init; } = string.Empty;
    public string NovaSenha { get; init; } = string.Empty;
    public string ConfirmacaoSenha { get; init; } = string.Empty;
}
