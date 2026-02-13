using System.Collections.Generic;

namespace OdisseiaWiki.Dtos
{
    public class GlobalSearchResultDto
    {
        public List<SearchItemDto> Cidades { get; set; } = new();
        public List<SearchItemDto> Personagens { get; set; } = new();
        public List<SearchItemDto> Itens { get; set; } = new();
        public List<SearchItemDto> InfoLores { get; set; } = new();
        public List<SearchItemDto> Racas { get; set; } = new();
        public int TotalResultados => Cidades.Count + Personagens.Count + Itens.Count + InfoLores.Count + Racas.Count;
    }

    public class SearchItemDto
    {
        public int? Id { get; set; }
        public string? IdString { get; set; } // Para Item que tem ID string
        public string Nome { get; set; } = null!;
        public string? Imagem { get; set; }
        public List<string>? Tags { get; set; }
        public bool Visivel { get; set; }
        public string TipoEntidade { get; set; } = null!; // "Cidade", "Personagem", "Item", "InfoLore", "Raca"
    }
}