using System.ComponentModel.DataAnnotations;

using System.Text.Json.Serialization;

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
        public bool Destaque { get; set; } = false;

        public int IdWikiEscopo { get; set; } = WikiEscopo.IdOficial;

        /// <summary>
        /// Páginas podem ser editoriais e neutras. Quando informado, limita o
        /// conteúdo oficial ao Sistema compatível da Mesa.
        /// </summary>
        public int? IdSistemaRpg { get; set; }

        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

        public virtual ICollection<PageBlock> Blocks { get; set; } = new List<PageBlock>();
        [JsonIgnore]
        public virtual WikiEscopo WikiEscopo { get; set; } = null!;
        public virtual SistemaRpg? SistemaRpg { get; set; }
    }
}
