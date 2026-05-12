using OdisseiaWiki.Enums;
using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace OdisseiaWiki.Models
{
    public class PageBlock
    {
        [Key]
        public int IdPageBlock { get; set; }

        [Required]
        public int IdPage { get; set; }

        [Required]
        public PageBlockType Tipo { get; set; }

        [Required]
        public string Conteudo { get; set; } = null!;

        public int Ordem { get; set; }

        public virtual Page Page { get; set; } = null!;
    }
}
