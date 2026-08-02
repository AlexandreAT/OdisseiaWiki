using System.ComponentModel.DataAnnotations;

namespace OdisseiaWiki.Models;

public class SistemaTipoDano
{
    [Key]
    public int IdSistemaTipoDano { get; set; }
    public int IdSistemaVersao { get; set; }
    [Required, MaxLength(50)]
    public string Codigo { get; set; } = null!;
    [Required, MaxLength(150)]
    public string Nome { get; set; } = null!;
    [MaxLength(2000)]
    public string? Descricao { get; set; }
    public bool IgnoraArmadura { get; set; }
    public bool IgnoraProtecao { get; set; }
    public bool IgnoraEscudo { get; set; }
    public bool Periodico { get; set; }
    public bool Area { get; set; }
    public string? ConfiguracaoJson { get; set; }
    public int Ordem { get; set; }
    public virtual SistemaVersao SistemaVersao { get; set; } = null!;
}
