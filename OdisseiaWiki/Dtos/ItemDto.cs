using OdisseiaWiki.Enums;

namespace OdisseiaWiki.Dtos
{
    public class ItemDto
    {
        public string Iditem { get; set; } = null!;
        public string Nome { get; set; } = null!;
        public string Tipo { get; set; } = null!;
        public int Quantidade { get; set; }
        public decimal? Peso { get; set; }
        public string? Descricao { get; set; }
        public string? Efeito { get; set; }
        public string? Imagem { get; set; }
        public string? AtributosJson { get; set; }
        public string? IditemBase { get; set; }
        public string? DataCriacao { get; set; }
        public int? Idpersonagem { get; set; }
    }

}
