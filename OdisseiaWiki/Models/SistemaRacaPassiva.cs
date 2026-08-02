using System.ComponentModel.DataAnnotations;

namespace OdisseiaWiki.Models;

public class SistemaRacaPassiva
{
    [Key]
    public int IdSistemaRacaPassiva { get; set; }
    public int IdSistemaRacaConfig { get; set; }
    public int? IdPassiva { get; set; }
    [Required, MaxLength(50)]
    public string CodigoPassiva { get; set; } = null!;
    [Required, MaxLength(150)]
    public string NomeExibicao { get; set; } = null!;
    [MaxLength(100)]
    public string? Variante { get; set; }
    public int Ordem { get; set; }
    public int NivelDesbloqueio { get; set; }
    public virtual SistemaRacaConfig SistemaRacaConfig { get; set; } = null!;
    public virtual Passiva? Passiva { get; set; }
}
