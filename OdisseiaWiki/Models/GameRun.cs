using System.ComponentModel.DataAnnotations;
using OdisseiaWiki.Enums;

namespace OdisseiaWiki.Models;

public sealed class GameRun
{
    [Key]
    public long IdGameRun { get; set; }
    public int IdUsuario { get; set; }
    // Mantido como valor de origem: excluir a ficha não deve excluir nem invalidar a run.
    public int IdPersonagemJogadorOrigem { get; set; }
    public int IdGameModeVersion { get; set; }
    public int IdSistemaVersao { get; set; }
    public GameRunStatus Status { get; set; } = GameRunStatus.Ativa;
    public long Seed { get; set; }
    public int Fase { get; set; } = 1;

    [MaxLength(80)]
    public string? NoAtualId { get; set; }

    public long Revisao { get; set; }
    public int? ChaveAtiva { get; private set; }

    [Required]
    public string SnapshotInicialJson { get; set; } = null!;

    [Required]
    public string EstadoAtualJson { get; set; } = null!;

    public string? MapaJson { get; set; }
    public string? LoadoutJson { get; set; }
    public DateTime CriadaEmUtc { get; set; } = DateTime.UtcNow;
    public DateTime AtualizadaEmUtc { get; set; } = DateTime.UtcNow;
    public DateTime? EncerradaEmUtc { get; set; }

    public Usuario Usuario { get; set; } = null!;
    public GameModeVersion GameModeVersion { get; set; } = null!;
    public SistemaVersao SistemaVersao { get; set; } = null!;
    public ICollection<GameRunCommand> Comandos { get; set; } = new List<GameRunCommand>();
    public ICollection<GameRunBattle> Batalhas { get; set; } = new List<GameRunBattle>();
}
