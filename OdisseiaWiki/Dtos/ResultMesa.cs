using OdisseiaWiki.Models;

namespace OdisseiaWiki.Dtos
{
    public class ResultMesa
    {
        public bool Sucesso { get; set; }
        public string? MensagemErro { get; set; }
        public Mesa? Mesa { get; set; }
    }
}
