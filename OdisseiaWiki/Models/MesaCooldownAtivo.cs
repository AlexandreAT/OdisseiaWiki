using System.ComponentModel.DataAnnotations;
using OdisseiaWiki.Enums;

namespace OdisseiaWiki.Models;

public sealed class MesaCooldownAtivo
{
    [Key] public long IdMesaCooldownAtivo { get; set; }
    public long IdMesaCombate { get; set; }
    public long IdParticipante { get; set; }
    [Required, MaxLength(40)] public string TipoOrigem { get; set; } = null!;
    [Required, MaxLength(160)] public string IdOrigem { get; set; } = null!;
    [Required, MaxLength(150)] public string NomeSnapshot { get; set; } = null!;
    public int TurnosRestantes { get; set; }
    public MesaCooldownStatus Status { get; set; } = MesaCooldownStatus.Ativo;
    public int RodadaInicio { get; set; }
    public int TurnoInicio { get; set; }
    public DateTime CriadoEmUtc { get; set; } = DateTime.UtcNow;
    public DateTime? EncerradoEmUtc { get; set; }

    public MesaCombate Combate { get; set; } = null!;
    public MesaCombateParticipante Participante { get; set; } = null!;
}
