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

        public int? IdSistemaVersao { get; set; }

        public string? InfoSecundariasJson { get; set; }

        public bool Visivel { get; set; } = true;

        public virtual Mesa Mesa { get; set; } = null!;
        public virtual Usuario Usuario { get; set; } = null!;

        public virtual SistemaVersao? SistemaVersao { get; set; }
        public virtual PersonagemVisibilidade? ConfiguracaoVisibilidade { get; set; }
    }
}
