using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OdisseiaWiki.Models
{
    public partial class Passiva
    {
        [Key]
        public int Idpassiva { get; set; }

        [Required]
        [MaxLength(100)]
        public string Nome { get; set; } = null!;

        public string? Descricao { get; set; }

        public string? StatusJson { get; set; }

        public string? Tags { get; set; }

        public bool Visivel { get; set; } = true;

        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

        public virtual ICollection<Passivaraca> Passivaracas { get; set; } = new List<Passivaraca>();

        public virtual ICollection<Personagen> Personagens { get; set; } = new List<Personagen>();

        public virtual ICollection<PersonagemJogador> PersonagensJogadores { get; set; } = new List<PersonagemJogador>();
    }
}