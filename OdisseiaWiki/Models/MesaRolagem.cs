using System.ComponentModel.DataAnnotations;

namespace OdisseiaWiki.Models;

public sealed class MesaRolagem
{
    [Key]
    public long IdMesaEvento { get; set; }
    [Required, MaxLength(200)]
    public string Expressao { get; set; } = null!;
    public string GruposJson { get; set; } = "[]";
    public string ModificadoresJson { get; set; } = "[]";
    public int? ValorNatural { get; set; }
    public int Subtotal { get; set; }
    public int Total { get; set; }
    [MaxLength(50)]
    public string? CodigoResultado { get; set; }
    [MaxLength(150)]
    public string? NomeResultado { get; set; }
    public int? ValorAssociado { get; set; }
    public bool Manual { get; set; }

    public MesaEvento Evento { get; set; } = null!;
}
