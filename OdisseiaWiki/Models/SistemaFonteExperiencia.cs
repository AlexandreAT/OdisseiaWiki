using System.ComponentModel.DataAnnotations;

namespace OdisseiaWiki.Models;

public class SistemaFonteExperiencia
{
    [Key]
    public int IdSistemaFonteExperiencia { get; set; }
    public int IdSistemaVersao { get; set; }
    [Required, MaxLength(50)]
    public string Codigo { get; set; } = null!;
    [Required, MaxLength(150)]
    public string Nome { get; set; } = null!;
    [MaxLength(50)]
    public string? TipoTeste { get; set; }
    [MaxLength(500)]
    public string? Formula { get; set; }
    public int? ValorMinimo { get; set; }
    public int? ValorMaximo { get; set; }
    public bool UsaVantagem { get; set; }
    [MaxLength(2000)]
    public string? Descricao { get; set; }
    public string? ConfiguracaoJson { get; set; }
    public int Ordem { get; set; }
    public virtual SistemaVersao SistemaVersao { get; set; } = null!;
}
