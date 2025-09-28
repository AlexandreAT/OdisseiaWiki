using OdisseiaWiki.Enums;
using System.ComponentModel.DataAnnotations;

namespace OdisseiaWiki.Dtos
{
    public class ItemCreateDto
    {
        [Required, MaxLength(100)]
        public string Nome { get; set; } = null!;

        [Required, MaxLength(50)]
        public ItemTipo Tipo { get; set; }

        [MaxLength(200)]
        public string? Descricao { get; set; }

        public decimal? Peso { get; set; }
        public int Quantidade { get; set; } = 1;

        [MaxLength(100)]
        public string? Efeito { get; set; }

        [MaxLength(50)]
        public string? Imagem { get; set; }

        public string? AtributosJson { get; set; }
        public string? IditemBase { get; set; }
        public int? Idpersonagem { get; set; }
    }
}
