using System.ComponentModel.DataAnnotations;
using OdisseiaWiki.Enums;

namespace OdisseiaWiki.Models;

public sealed class MesaCondicaoAtiva
{
    [Key]
    public long IdMesaCondicaoAtiva { get; set; }
    public long IdMesaCombate { get; set; }
    public long IdParticipante { get; set; }
    public int IdSistemaCondicao { get; set; }
    [Required, MaxLength(50)] public string CodigoSnapshot { get; set; } = null!;
    [Required, MaxLength(150)] public string NomeSnapshot { get; set; } = null!;
    public MesaCondicaoStatus Status { get; set; } = MesaCondicaoStatus.Ativa;
    public int Acumulos { get; set; } = 1;
    public decimal? Valor { get; set; }
    public int? Duracao { get; set; }
    public SistemaUnidadeDuracao UnidadeDuracao { get; set; }
    public int RodadaAplicacao { get; set; }
    public int TurnoAplicacao { get; set; }
    public int? TurnosRestantes { get; set; }
    public int? CooldownTurnos { get; set; }
    public bool GatilhoRearmado { get; set; }
    [Required] public string RegraSnapshotJson { get; set; } = "{}";
    public int? IdUsuarioAplicacao { get; set; }
    public DateTime AplicadaEmUtc { get; set; } = DateTime.UtcNow;
    public DateTime? RemovidaEmUtc { get; set; }
    [MaxLength(500)] public string? MotivoRemocao { get; set; }

    public MesaCombate Combate { get; set; } = null!;
    public MesaCombateParticipante Participante { get; set; } = null!;
    public SistemaCondicao SistemaCondicao { get; set; } = null!;
    public Usuario? UsuarioAplicacao { get; set; }
}
