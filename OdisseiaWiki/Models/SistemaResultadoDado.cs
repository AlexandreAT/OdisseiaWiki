using System.ComponentModel.DataAnnotations;

namespace OdisseiaWiki.Models;

public class SistemaResultadoDado
{
    [Key]
    public int IdSistemaResultadoDado { get; set; }
    public int IdSistemaVersao { get; set; }
    [Required, MaxLength(50)]
    public string CodigoTeste { get; set; } = null!;
    [Required, MaxLength(150)]
    public string NomeTeste { get; set; } = null!;
    [Required, MaxLength(20)]
    public string Dado { get; set; } = null!;
    public int QuantidadeDados { get; set; } = 1;
    public int ResultadoMinimo { get; set; }
    public int ResultadoMaximo { get; set; }
    public bool ExigeNatural { get; set; }
    [Required, MaxLength(50)]
    public string CodigoResultado { get; set; } = null!;
    [Required, MaxLength(150)]
    public string NomeResultado { get; set; } = null!;
    [MaxLength(2000)]
    public string? Descricao { get; set; }
    public string? EfeitoJson { get; set; }
    public int Ordem { get; set; }
    public virtual SistemaVersao SistemaVersao { get; set; } = null!;
}
