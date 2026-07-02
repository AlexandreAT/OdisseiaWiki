using System.ComponentModel.DataAnnotations;

namespace OdisseiaWiki.Models
{
    public partial class Proficiencia
    {
        [Key]
        public int Idproficiencia { get; set; }

        [Required]
        [MaxLength(100)]
        public string Nome { get; set; } = null!;

        public string? Descricao { get; set; }

        public string? StatusJson { get; set; }

        public string? Tags { get; set; }

        public bool Visivel { get; set; } = true;

        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

        public virtual ICollection<PersonagemProficiencia> Personagens { get; set; } = new List<PersonagemProficiencia>();
    }
}
