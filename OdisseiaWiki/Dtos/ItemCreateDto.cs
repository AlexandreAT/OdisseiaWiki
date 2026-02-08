using System.Text.Json;
using OdisseiaWiki.Enums;

namespace OdisseiaWiki.Dtos
{
    public class ItemCreateDto
    {
        public string Nome { get; set; } = null!;
        public ItemTipo Tipo { get; set; }
        public JsonElement? Descricao { get; set; }
        public decimal? Peso { get; set; }
        public int Quantidade { get; set; } = 1;
        public string? Efeito { get; set; }
        public string? Imagem { get; set; }
        public object? AtributosJson { get; set; }
        public string? IditemBase { get; set; }
        public List<string>? Tags { get; set; }
        public bool Visivel { get; set; } = true;
        public int? Idpersonagem { get; set; }
    }
}
