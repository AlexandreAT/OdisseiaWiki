using System.ComponentModel.DataAnnotations;

namespace OdisseiaWiki.Models;

public class SistemaMovimentoConfig
{
    [Key]
    public int IdSistemaMovimentoConfig { get; set; }
    public int IdSistemaVersao { get; set; }
    public bool UsaGrid { get; set; }
    public decimal MetrosPorQuadrado { get; set; }
    public int MovimentoGratuito { get; set; }
    public decimal CustoEstaminaPorQuadrado { get; set; }
    public int? MaximoQuadradosTurno { get; set; }
    public bool PermiteMoverAposAtaque { get; set; }
    [MaxLength(2000)]
    public string? Observacoes { get; set; }
    public string? ConfiguracaoJson { get; set; }
    public virtual SistemaVersao SistemaVersao { get; set; } = null!;
}
