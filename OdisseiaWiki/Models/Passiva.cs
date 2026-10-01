using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

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

    public int IdWikiEscopo { get; set; } = WikiEscopo.IdOficial;
        public bool Destaque { get; set; } = false;

        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

        [JsonIgnore]
        public virtual ICollection<Passivaraca> Passivaracas { get; set; } = new List<Passivaraca>();

        [JsonIgnore]
        public virtual ICollection<Personagen> Personagens { get; set; } = new List<Personagen>();

        [JsonIgnore]
        public virtual ICollection<PersonagemJogador> PersonagensJogadores { get; set; } = new List<PersonagemJogador>();
        [JsonIgnore]
        public virtual WikiEscopo WikiEscopo { get; set; } = null!;
    }
}
