using System.ComponentModel.DataAnnotations;
using OdisseiaWiki.Enums;

namespace OdisseiaWiki.Models;

public class SistemaItemCampo
{
    [Key]
    public int IdSistemaItemCampo { get; set; }

    public int IdSistemaItemEscopo { get; set; }

    [Required, MaxLength(50)]
    public string Codigo { get; set; } = null!;

    [Required, MaxLength(150)]
    public string Nome { get; set; } = null!;

    public SistemaItemCampoTipo Tipo { get; set; }

    [MaxLength(50)]
    public string? Unidade { get; set; }

    public bool Obrigatorio { get; set; }

    public string? Descricao { get; set; }

    public int Ordem { get; set; }

    public virtual SistemaItemEscopo Escopo { get; set; } = null!;
}
