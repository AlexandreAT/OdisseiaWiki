using System.ComponentModel.DataAnnotations;

namespace OdisseiaWiki.Models;

public class SistemaRpg
{
    [Key]
    public int IdSistemaRpg { get; set; }

    [Required, MaxLength(50)]
    public string Codigo { get; set; } = null!;

    [Required, MaxLength(150)]
    public string Nome { get; set; } = null!;

    public string? Descricao { get; set; }

    public bool Ativo { get; set; } = true;

    public int? IdVersaoPublicada { get; set; }

    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

    public DateTime DataAtualizacao { get; set; } = DateTime.UtcNow;

    public virtual SistemaVersao? VersaoPublicada { get; set; }

    public virtual ICollection<SistemaVersao> Versoes { get; set; } = new List<SistemaVersao>();

    public virtual ICollection<SistemaPatchNote> PatchNotes { get; set; } = new List<SistemaPatchNote>();
}
