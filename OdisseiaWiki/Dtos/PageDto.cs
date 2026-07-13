namespace OdisseiaWiki.Dtos
{
    public class PageDto
    {
        public int IdPage { get; set; }

        public string Titulo { get; set; } = null!;

        public string Slug { get; set; } = null!;

        public string? Descricao { get; set; }

        public string? CoverImage { get; set; }

        public bool Visivel { get; set; }
        public bool Destaque { get; set; }

        public DateTime DataCriacao { get; set; }

        public List<PageBlockDto> Blocks { get; set; } = new();
    }
}
