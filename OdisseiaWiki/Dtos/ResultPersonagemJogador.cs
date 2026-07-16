namespace OdisseiaWiki.Dtos;

public sealed class ResultPersonagemJogador
{
    public bool Sucesso { get; set; }
    public string? Mensagem { get; set; }
    public string? MensagemErro { get; set; }
    public PersonagemJogadorResumoDto? Personagem { get; set; }
}
