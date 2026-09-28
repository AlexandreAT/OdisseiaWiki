using System.ComponentModel.DataAnnotations;
using OdisseiaWiki.Enums;

namespace OdisseiaWiki.Models;

public sealed class MesaCombate
{
    [Key]
    public long IdMesaCombate { get; set; }
    public long IdMesaSessao { get; set; }
    public MesaCombateStatus Status { get; set; } = MesaCombateStatus.Preparacao;
    public int RodadaAtual { get; set; }
    public int IndiceTurnoAtual { get; set; } = -1;
    public long? IdParticipanteAtual { get; set; }
    public long Revisao { get; set; }
    public int? IdUsuarioCriacao { get; set; }
    public int? IdUsuarioEncerramento { get; set; }
    public DateTime CriadoEmUtc { get; set; } = DateTime.UtcNow;
    public DateTime? IniciadoEmUtc { get; set; }
    public DateTime? EncerradoEmUtc { get; set; }
    public int? ChaveAtiva { get; private set; }

    public MesaSessao Sessao { get; set; } = null!;
    public Usuario? UsuarioCriacao { get; set; }
    public Usuario? UsuarioEncerramento { get; set; }
    public MesaCombateParticipante? ParticipanteAtual { get; set; }
    public ICollection<MesaCombateParticipante> Participantes { get; set; } = new List<MesaCombateParticipante>();
    public ICollection<MesaCondicaoAtiva> Condicoes { get; set; } = new List<MesaCondicaoAtiva>();
    public ICollection<MesaCooldownAtivo> Cooldowns { get; set; } = new List<MesaCooldownAtivo>();
}
