using System.ComponentModel.DataAnnotations;

namespace OdisseiaWiki.Models;

public class SistemaTipoDefesa
{
    [Key]
    public int IdSistemaTipoDefesa { get; set; }
    public int IdSistemaVersao { get; set; }
    [Required, MaxLength(50)]
    public string Codigo { get; set; } = null!;
    [Required, MaxLength(150)]
    public string Nome { get; set; } = null!;
    [MaxLength(2000)]
    public string? Descricao { get; set; }
    public int OrdemAplicacao { get; set; }
    [Required, MaxLength(50)]
    public string TipoComportamento { get; set; } = null!;
    [MaxLength(500)]
    public string? Formula { get; set; }
    public string? ConfiguracaoJson { get; set; }
    public int Ordem { get; set; }
    public virtual SistemaVersao SistemaVersao { get; set; } = null!;
}
