using System.ComponentModel.DataAnnotations;

namespace OdisseiaWiki.Models
{
    public class Page
    {
        [Key]
        public int IdPage { get; set; }

        [Required]
        [MaxLength(150)]
        public string Titulo { get; set; } = null!;

        [Required]
        [MaxLength(150)]
        public string Slug { get; set; } = null!;

        public string? Descricao { get; set; }

        public string? CoverImage { get; set; }

        public bool Visivel { get; set; } = true;

        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

        public virtual ICollection<PageBlock> Blocks { get; set; } = new List<PageBlock>();
    }
}
