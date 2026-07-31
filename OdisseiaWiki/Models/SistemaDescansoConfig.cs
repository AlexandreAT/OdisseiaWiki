using System.ComponentModel.DataAnnotations;
using OdisseiaWiki.Enums;

namespace OdisseiaWiki.Models;

public class SistemaDescansoConfig
{
    [Key]
    public int IdSistemaDescansoConfig { get; set; }
    public int IdSistemaVersao { get; set; }
    [Required, MaxLength(50)]
    public string Tipo { get; set; } = null!;
    [Required, MaxLength(150)]
    public string Nome { get; set; } = null!;
    public int? DuracaoMinimaMinutos { get; set; }
    public int? DuracaoMaximaMinutos { get; set; }
    public decimal RecuperacaoVida { get; set; }
    public decimal RecuperacaoMana { get; set; }
    public decimal RecuperacaoEstamina { get; set; }
    public SistemaRecuperacaoTipo TipoRecuperacao { get; set; }
    public bool ExigeGuarda { get; set; }
    public int? IntervaloTesteGuardaMinutos { get; set; }
    public bool PermiteAtividades { get; set; }
    public string? ConfiguracaoJson { get; set; }
    public int Ordem { get; set; }
    public virtual SistemaVersao SistemaVersao { get; set; } = null!;
}
