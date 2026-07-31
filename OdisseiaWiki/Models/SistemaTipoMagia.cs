using System.ComponentModel.DataAnnotations;

namespace OdisseiaWiki.Models;

public class SistemaTipoMagia
{
    [Key]
    public int IdSistemaTipoMagia { get; set; }
    public int IdSistemaVersao { get; set; }
    [Required, MaxLength(50)]
    public string Codigo { get; set; } = null!;
    [Required, MaxLength(150)]
    public string Nome { get; set; } = null!;
    [MaxLength(2000)]
    public string? Descricao { get; set; }
    [MaxLength(30)]
    public string? Cor { get; set; }
    [MaxLength(100)]
    public string? Afinidade { get; set; }
    public decimal CustoBase { get; set; }
    public int Ordem { get; set; }
    public string? ConfiguracaoJson { get; set; }
    public virtual SistemaVersao SistemaVersao { get; set; } = null!;
}
