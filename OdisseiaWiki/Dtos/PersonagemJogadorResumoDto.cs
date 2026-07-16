namespace OdisseiaWiki.Dtos;

public sealed class PersonagemJogadorResumoDto
{
    public int IdpersonagemJogador { get; init; }
    public int Idusuario { get; init; }
    public int Idmesa { get; init; }
    public int Idraca { get; init; }
    public int? Idcidade { get; init; }
    public string Nome { get; init; } = string.Empty;
    public string? Imagem { get; init; }
    public DateTime DataCriacao { get; init; }
}
