using System.ComponentModel.DataAnnotations;
using OdisseiaWiki.Enums;

namespace OdisseiaWiki.Models;

public class SistemaVersao
{
    [Key]
    public int IdSistemaVersao { get; set; }

    public int IdSistemaRpg { get; set; }

    [Required, MaxLength(20)]
    public string NumeroVersao { get; set; } = null!;

    public SistemaVersaoStatus Status { get; set; } = SistemaVersaoStatus.Rascunho;

    public int? IdVersaoBase { get; set; }

    public string? Changelog { get; set; }

    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

    public DateTime DataAtualizacao { get; set; } = DateTime.UtcNow;

    public DateTime? DataPublicacao { get; set; }

    public DateTime? DataArquivamento { get; set; }

    public virtual SistemaRpg SistemaRpg { get; set; } = null!;

    public virtual SistemaVersao? VersaoBase { get; set; }

    public virtual ICollection<SistemaVersao> VersoesDerivadas { get; set; } = new List<SistemaVersao>();

    public virtual ICollection<SistemaModulo> Modulos { get; set; } = new List<SistemaModulo>();
    public virtual ICollection<SistemaNivel> Niveis { get; set; } = new List<SistemaNivel>();
    public virtual ICollection<SistemaMarcoNivel> MarcosNivel { get; set; } = new List<SistemaMarcoNivel>();
    public virtual ICollection<SistemaFonteExperiencia> FontesExperiencia { get; set; } = new List<SistemaFonteExperiencia>();
    public virtual ICollection<SistemaRacaConfig> Racas { get; set; } = new List<SistemaRacaConfig>();
    public virtual ICollection<SistemaAtributoConfig> Atributos { get; set; } = new List<SistemaAtributoConfig>();
    public virtual ICollection<SistemaRecursoConfig> Recursos { get; set; } = new List<SistemaRecursoConfig>();
    public virtual SistemaMovimentoConfig? Movimento { get; set; }
    public virtual SistemaPontosAcaoConfig? PontosAcao { get; set; }
    public virtual ICollection<SistemaAcaoConfig> Acoes { get; set; } = new List<SistemaAcaoConfig>();
    public virtual ICollection<SistemaResultadoDado> ResultadosDado { get; set; } = new List<SistemaResultadoDado>();
    public virtual ICollection<SistemaTipoDano> TiposDano { get; set; } = new List<SistemaTipoDano>();
    public virtual ICollection<SistemaTipoDefesa> TiposDefesa { get; set; } = new List<SistemaTipoDefesa>();
    public virtual ICollection<SistemaTipoMagia> TiposMagia { get; set; } = new List<SistemaTipoMagia>();
    public virtual SistemaSkillConfig? SkillConfig { get; set; }
    public virtual ICollection<SistemaCondicao> Condicoes { get; set; } = new List<SistemaCondicao>();
    public virtual ICollection<SistemaDescansoConfig> Descansos { get; set; } = new List<SistemaDescansoConfig>();
    public virtual SistemaMorteConfig? Morte { get; set; }
    public virtual ICollection<Mesa> Mesas { get; set; } = new List<Mesa>();
}
