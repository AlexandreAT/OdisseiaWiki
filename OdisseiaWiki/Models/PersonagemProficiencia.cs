using System.ComponentModel.DataAnnotations;

namespace OdisseiaWiki.Models
{
    public class PersonagemProficiencia
    {
        [Key]
        public int IdpersonagemProficiencia { get; set; }

        public int? Idpersonagem { get; set; }

        public int? IdpersonagemJogador { get; set; }

        public int Idproficiencia { get; set; }

        public virtual Personagen? Personagem { get; set; }

        public virtual PersonagemJogador? PersonagemJogador { get; set; }

        public virtual Proficiencia Proficiencia { get; set; } = null!;
    }
}
