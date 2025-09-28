using System.ComponentModel.DataAnnotations;

namespace OdisseiaWiki.Models
{
    public partial class PersonagemJogador : PersonagemBase
    {
        [Key]
        public int IdpersonagemJogador { get; set; }

        [Required]
        public int Idmesa { get; set; }

        [Required]
        public int Idusuario { get; set; }

        public string? InfoSecundariasJson { get; set; }

        public virtual Mesa Mesa { get; set; } = null!;
        public virtual Usuario Usuario { get; set; } = null!;
    }
}
