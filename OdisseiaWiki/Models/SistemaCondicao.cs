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
    [MaxLength(50)]
    public string? CodigoRecurso { get; set; }
    [MaxLength(30)]
    public string? OperacaoEfeito { get; set; }
    public decimal? ValorEfeito { get; set; }
    [MaxLength(30)]
    public string? MomentoEfeito { get; set; }
    [MaxLength(50)]
    public string? CodigoRecursoGatilho { get; set; }
    [MaxLength(10)]
    public string? OperadorGatilho { get; set; }
    public decimal? ValorGatilho { get; set; }
    public int? CooldownTurnos { get; set; }
    [MaxLength(500)]
    public string? RegraRemocao { get; set; }
    public string? ConfiguracaoPadraoJson { get; set; }
    public int Ordem { get; set; }
    public virtual SistemaVersao SistemaVersao { get; set; } = null!;
}
