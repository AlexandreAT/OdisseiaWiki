using System.ComponentModel.DataAnnotations;

namespace OdisseiaWiki.Models;

public class SistemaMarcoNivel
{
    [Key]
    public int IdSistemaMarcoNivel { get; set; }
    public int IdSistemaVersao { get; set; }
    public int Nivel { get; set; }
    [Required, MaxLength(50)]
    public string Codigo { get; set; } = null!;
    [Required, MaxLength(150)]
    public string Nome { get; set; } = null!;
    [MaxLength(2000)]
    public string? Descricao { get; set; }
    [Required, MaxLength(50)]
    public string TipoRecompensa { get; set; } = null!;
    public string? ConfiguracaoJson { get; set; }
    public int Ordem { get; set; }
    public virtual SistemaVersao SistemaVersao { get; set; } = null!;
}
