namespace OdisseiaWiki.Dtos;

public sealed class ResultAccountAction
{
    public bool Sucesso { get; init; }
    public string? MensagemErro { get; init; }

    public static ResultAccountAction Ok() => new() { Sucesso = true };

    public static ResultAccountAction Falha(string mensagem) => new()
    {
        Sucesso = false,
        MensagemErro = mensagem,
    };
}
