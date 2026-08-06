using System.ComponentModel.DataAnnotations;

namespace OdisseiaWiki.Models;

/// <summary>
/// Snapshot imutável do diff produzido na publicação de uma versão.
/// O conteúdo estruturado fica em DiffJson e não é atualizado depois da criação.
/// </summary>
public class SistemaPatchNote
{
    [Key]
    public int IdSistemaPatchNote { get; set; }

    public int IdSistemaRpg { get; set; }

    public int IdSistemaVersao { get; set; }

    public int? IdVersaoAnterior { get; set; }

    [Required, MaxLength(50)]
    public string CodigoSistema { get; set; } = null!;

    [Required, MaxLength(150)]
    public string NomeSistema { get; set; } = null!;

    [MaxLength(20)]
    public string? NumeroVersaoAnterior { get; set; }

    [Required, MaxLength(20)]
    public string NumeroVersaoNova { get; set; } = null!;

    [Required, MaxLength(200)]
    public string Titulo { get; set; } = null!;

    [Required, MaxLength(2000)]
    public string Resumo { get; set; } = null!;

    public bool VersaoInicial { get; set; }

    public DateTime DataGeracao { get; set; } = DateTime.UtcNow;

    [Required]
    public string DiffJson { get; set; } = null!;

    public virtual SistemaRpg SistemaRpg { get; set; } = null!;

    public virtual SistemaVersao SistemaVersao { get; set; } = null!;

    public virtual SistemaVersao? VersaoAnterior { get; set; }
}
