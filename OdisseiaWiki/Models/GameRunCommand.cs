using System.ComponentModel.DataAnnotations;
using OdisseiaWiki.Enums;

namespace OdisseiaWiki.Models;

public sealed class GameRunCommand
{
    [Key]
    public long IdGameRunCommand { get; set; }
    public long IdGameRun { get; set; }
    public int IdUsuario { get; set; }

    [Required, MaxLength(36)]
    public string ChaveIdempotencia { get; set; } = null!;

    [Required, MaxLength(64)]
    public string HashPayload { get; set; } = null!;

    [Required, MaxLength(40)]
    public string Tipo { get; set; } = null!;

    public long? RevisaoEsperada { get; set; }
    public GameRunCommandStatus Status { get; set; } = GameRunCommandStatus.Concluido;

    [Required]
    public string RespostaJson { get; set; } = null!;

    public DateTime CriadoEmUtc { get; set; } = DateTime.UtcNow;
    public DateTime ConcluidoEmUtc { get; set; } = DateTime.UtcNow;

    public GameRun Run { get; set; } = null!;
}
