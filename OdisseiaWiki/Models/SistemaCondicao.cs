using System.ComponentModel.DataAnnotations;
using OdisseiaWiki.Enums;

namespace OdisseiaWiki.Models;

public class SistemaCondicao
{
    [Key]
    public int IdSistemaCondicao { get; set; }
    public int IdSistemaVersao { get; set; }
    [Required, MaxLength(50)]
    public string Codigo { get; set; } = null!;
    [Required, MaxLength(150)]
    public string Nome { get; set; } = null!;
    [MaxLength(2000)]
    public string? Descricao { get; set; }
    [Required, MaxLength(50)]
    public string Tipo { get; set; } = null!;
    public int? DuracaoPadrao { get; set; }
    public SistemaUnidadeDuracao UnidadeDuracao { get; set; }
    public bool Empilhavel { get; set; }
    public bool RemocaoAutomatica { get; set; }
    public bool PermiteSobrescrever { get; set; }
    public decimal? ValorPadrao { get; set; }
    public string? ConfiguracaoPadraoJson { get; set; }
    public int Ordem { get; set; }
    public virtual SistemaVersao SistemaVersao { get; set; } = null!;
}
