using System.ComponentModel.DataAnnotations;

namespace OdisseiaWiki.Models;

public sealed class MesaExpulsaoRegistro
{
    [Key]
    public int IdMesaExpulsaoRegistro { get; set; }

    public int? Idmesa { get; set; }

    public int Idusuario { get; set; }

    public int IdusuarioMestre { get; set; }

    [Required, MaxLength(100)]
    public string NomeMesa { get; set; } = null!;

    [Required, MaxLength(500)]
    public string Motivo { get; set; } = null!;

    public DateTime DataExpulsao { get; set; } = DateTime.UtcNow;

    public DateTime? DataLeitura { get; set; }

    public Mesa? Mesa { get; set; }

    public Usuario Usuario { get; set; } = null!;

    public Usuario Mestre { get; set; } = null!;
}
