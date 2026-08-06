using System.ComponentModel.DataAnnotations;

namespace OdisseiaWiki.Models;

public class SistemaItemFaixa
{
    [Key]
    public int IdSistemaItemFaixa { get; set; }

    public int IdSistemaItemEscopo { get; set; }

    [Required, MaxLength(50)]
    public string CodigoCampo { get; set; } = null!;

    [Required, MaxLength(150)]
    public string Nome { get; set; } = null!;

    public decimal? ValorMinimo { get; set; }

    public decimal? ValorMaximo { get; set; }

    public decimal? ValorReferencia { get; set; }

    [MaxLength(50)]
    public string? Unidade { get; set; }

    public string? Descricao { get; set; }

    public int Ordem { get; set; }

    public virtual SistemaItemEscopo Escopo { get; set; } = null!;
}
