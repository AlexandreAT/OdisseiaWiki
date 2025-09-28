using OdisseiaWiki.Dtos.OdisseiaWiki.Dtos;

namespace OdisseiaWiki.Dtos
{
    public class RacaDto
    {
        public int Idraca { get; set; }
        public string Nome { get; set; } = null!;
        public RacaStatusDto? StatusJson { get; set; }
        public string? Imagem { get; set; }
        public List<string>? GaleriaImagem { get; set; }
    }
}
