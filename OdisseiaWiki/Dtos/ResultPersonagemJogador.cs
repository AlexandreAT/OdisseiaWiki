using OdisseiaWiki.Models;

namespace OdisseiaWiki.Dtos
{
    public class ResultPersonagemJogador
    {
        public bool Sucesso { get; set; }
        public string? MensagemErro { get; set; }
        public PersonagemJogador? Personagem { get; set; }
    }
}
