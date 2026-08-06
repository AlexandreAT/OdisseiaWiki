using System.ComponentModel.DataAnnotations;
using OdisseiaWiki.Enums;

namespace OdisseiaWiki.Models;

public class SistemaItemEscopo
{
    [Key]
    public int IdSistemaItemEscopo { get; set; }

    public int IdSistemaVersao { get; set; }

    public int? IdEscopoPai { get; set; }

    public SistemaItemEscopoNivel Nivel { get; set; }

    [Required, MaxLength(50)]
    public string Codigo { get; set; } = null!;

    [Required, MaxLength(200)]
    public string CodigoCaminho { get; set; } = null!;

    [Required, MaxLength(150)]
    public string Nome { get; set; } = null!;

    public string? Descricao { get; set; }

    public int Ordem { get; set; }

    public bool Ativo { get; set; } = true;

    public virtual SistemaVersao SistemaVersao { get; set; } = null!;

    public virtual SistemaItemEscopo? EscopoPai { get; set; }

    public virtual ICollection<SistemaItemEscopo> Filhos { get; set; } = new List<SistemaItemEscopo>();

    public virtual ICollection<SistemaItemCampo> Campos { get; set; } = new List<SistemaItemCampo>();

    public virtual ICollection<SistemaItemFaixa> Faixas { get; set; } = new List<SistemaItemFaixa>();

    public virtual ICollection<SistemaItemReferencia> Referencias { get; set; } = new List<SistemaItemReferencia>();
}
