using System.ComponentModel.DataAnnotations;
using OdisseiaWiki.Enums;

namespace OdisseiaWiki.Models;

public class SistemaItemReferencia
{
    [Key]
    public int IdSistemaItemReferencia { get; set; }

    public int IdSistemaItemEscopo { get; set; }

    public SistemaItemReferenciaTipo Tipo { get; set; }

    [Required, MaxLength(50)]
    public string Codigo { get; set; } = null!;

    [Required, MaxLength(150)]
    public string Nome { get; set; } = null!;

    [MaxLength(250)]
    public string? Valor { get; set; }

    public string? Descricao { get; set; }

    public int Ordem { get; set; }

    public virtual SistemaItemEscopo Escopo { get; set; } = null!;
}
