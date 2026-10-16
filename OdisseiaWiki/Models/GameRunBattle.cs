using System.ComponentModel.DataAnnotations;

namespace OdisseiaWiki.Models;

public sealed class GameRunBattle
{
    [Key]
    public long IdGameRunBattle { get; set; }
    public long IdGameRun { get; set; }
    [Required, MaxLength(80)]
    public string NoId { get; set; } = string.Empty;
    public int Ordem { get; set; }
    public int Seed { get; set; }
    [MaxLength(20)]
    public string? VencedorId { get; set; }
    [Required]
    public string ResultadoJson { get; set; } = string.Empty;
    [Required]
    public string EstadoAntesJson { get; set; } = string.Empty;
    [Required]
    public string EstadoDepoisJson { get; set; } = string.Empty;
    public DateTime CriadaEmUtc { get; set; } = DateTime.UtcNow;
    public GameRun Run { get; set; } = null!;
}
