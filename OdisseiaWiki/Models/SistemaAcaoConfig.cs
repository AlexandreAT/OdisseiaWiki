using System.ComponentModel.DataAnnotations;

namespace OdisseiaWiki.Models;

public class SistemaAcaoConfig
{
    [Key]
    public int IdSistemaAcaoConfig { get; set; }
    public int IdSistemaVersao { get; set; }
    [Required, MaxLength(50)]
    public string Codigo { get; set; } = null!;
    [Required, MaxLength(150)]
    public string Nome { get; set; } = null!;
    [Required, MaxLength(50)]
    public string Tipo { get; set; } = null!;
    public decimal CustoPontosAcao { get; set; }
    public decimal CustoEstamina { get; set; }
    public decimal CustoMana { get; set; }
    public bool EncerraTurno { get; set; }
    public bool PermiteCombo { get; set; }
    public bool ExigeAlvo { get; set; }
    [MaxLength(500)]
    public string? Formula { get; set; }
    [MaxLength(2000)]
    public string? Descricao { get; set; }
    public int Ordem { get; set; }
    public string? ConfiguracaoJson { get; set; }
    public virtual SistemaVersao SistemaVersao { get; set; } = null!;
}
