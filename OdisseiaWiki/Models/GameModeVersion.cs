using System.ComponentModel.DataAnnotations;
using OdisseiaWiki.Enums;

namespace OdisseiaWiki.Models;

public sealed class GameModeVersion
{
    [Key]
    public int IdGameModeVersion { get; set; }

    [Required, MaxLength(50)]
    public string Codigo { get; set; } = null!;

    [Required, MaxLength(20)]
    public string NumeroVersao { get; set; } = null!;

    public int IdSistemaVersao { get; set; }
    public int? IdMesa { get; set; }
    public int? IdUsuarioCriacao { get; set; }
    [MaxLength(100)] public string? Nome { get; set; }
    [MaxLength(500)] public string? Descricao { get; set; }
    [MaxLength(255)] public string? Banner { get; set; }
    public GameModeVersionStatus Status { get; set; } = GameModeVersionStatus.Rascunho;
    public int SchemaVersion { get; set; } = 1;

    [Required]
    public string ConfiguracaoJson { get; set; } = null!;

    public DateTime CriadaEmUtc { get; set; } = DateTime.UtcNow;
    public DateTime? PublicadaEmUtc { get; set; }

    public SistemaVersao SistemaVersao { get; set; } = null!;
    public Mesa? Mesa { get; set; }
    public ICollection<GameRun> Runs { get; set; } = new List<GameRun>();
}
