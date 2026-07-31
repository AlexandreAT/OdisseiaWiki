using System.ComponentModel.DataAnnotations;

namespace OdisseiaWiki.Models;

public class SistemaRacaConfig
{
    [Key]
    public int IdSistemaRacaConfig { get; set; }
    public int IdSistemaVersao { get; set; }
    public int? IdRaca { get; set; }
    [Required, MaxLength(50)]
    public string CodigoRaca { get; set; } = null!;
    [Required, MaxLength(150)]
    public string NomeExibicao { get; set; } = null!;
    public bool Jogavel { get; set; } = true;
    public int VidaBase { get; set; }
    public int EstaminaBase { get; set; }
    public int ManaBase { get; set; }
    public int CapacidadeCargaBase { get; set; }
    [MaxLength(50)]
    public string? CodigoAtributoInicial { get; set; }
    public string? ConfiguracaoJson { get; set; }
    public int Ordem { get; set; }
    public virtual SistemaVersao SistemaVersao { get; set; } = null!;
    public virtual Raca? Raca { get; set; }
    public virtual ICollection<SistemaRacaPassiva> Passivas { get; set; } = new List<SistemaRacaPassiva>();
}
