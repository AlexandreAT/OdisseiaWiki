using System.ComponentModel.DataAnnotations;

namespace OdisseiaWiki.Models;

public class SistemaRecursoConfig
{
    [Key]
    public int IdSistemaRecursoConfig { get; set; }
    public int IdSistemaVersao { get; set; }
    [Required, MaxLength(50)]
    public string Codigo { get; set; } = null!;
    [Required, MaxLength(150)]
    public string Nome { get; set; } = null!;
    public decimal ValorMinimo { get; set; }
    public decimal ValorPadrao { get; set; }
    public decimal? ValorMaximo { get; set; }
    public bool PermiteValorNegativo { get; set; }
    public decimal RecuperacaoPadrao { get; set; }
    public decimal RecuperacaoDescansoSimples { get; set; }
    public decimal RecuperacaoDescansoNormal { get; set; }
    public decimal RecuperacaoDescansoLongo { get; set; }
    [MaxLength(50)]
    public string? CondicaoAoZerar { get; set; }
    [MaxLength(500)]
    public string? FormulaValorInicial { get; set; }
    [MaxLength(500)]
    public string? FormulaValorMaximo { get; set; }
    [MaxLength(500)]
    public string? Formula { get; set; }
    public int Ordem { get; set; }
    public bool Ativo { get; set; } = true;
    public string? ConfiguracaoJson { get; set; }
    public virtual SistemaVersao SistemaVersao { get; set; } = null!;
}
