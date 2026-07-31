using System.ComponentModel.DataAnnotations;
using OdisseiaWiki.Enums;

namespace OdisseiaWiki.Models;

public class SistemaAtributoConfig
{
    [Key]
    public int IdSistemaAtributoConfig { get; set; }
    public int IdSistemaVersao { get; set; }
    [Required, MaxLength(50)]
    public string CodigoAtributo { get; set; } = null!;
    [Required, MaxLength(150)]
    public string Nome { get; set; } = null!;
    public SistemaAtributoGrupo Grupo { get; set; }
    public int ValorMinimo { get; set; }
    public int ValorMaximoNatural { get; set; }
    public int? ValorMaximoAbsoluto { get; set; }
    public int ValorComum { get; set; }
    [MaxLength(500)]
    public string? FormulaTeste { get; set; }
    public int? LimiteUso { get; set; }
    [MaxLength(50)]
    public string? TipoLimiteUso { get; set; }
    [MaxLength(2000)]
    public string? Descricao { get; set; }
    public int Ordem { get; set; }
    public bool Ativo { get; set; } = true;
    public string? ConfiguracaoJson { get; set; }
    public virtual SistemaVersao SistemaVersao { get; set; } = null!;
}
