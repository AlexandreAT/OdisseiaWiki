using System.ComponentModel.DataAnnotations;
using OdisseiaWiki.Enums;

namespace OdisseiaWiki.Models;

public sealed class MesaCombateParticipante
{
    [Key]
    public long IdMesaCombateParticipante { get; set; }
    public long IdMesaCombate { get; set; }
    public MesaCombateParticipanteTipo Tipo { get; set; }
    public MesaCombateParticipanteStatus Status { get; set; } = MesaCombateParticipanteStatus.AguardandoIniciativa;
    public int? IdPersonagemJogador { get; set; }
    public int? IdUsuarioControlador { get; set; }
    [Required, MaxLength(150)]
    public string NomeSnapshot { get; set; } = null!;
    [MaxLength(500)]
    public string? ImagemSnapshot { get; set; }
    public int ModificadorIniciativa { get; set; }
    public int? Iniciativa { get; set; }
    public int? ValorNaturalIniciativa { get; set; }
    public int Ordem { get; set; }
    public int SucessosSobrevivencia { get; set; }
    public int FalhasSobrevivencia { get; set; }
    public int TurnosConcluidos { get; set; }
    public DateTime CriadoEmUtc { get; set; } = DateTime.UtcNow;
    public DateTime? IniciativaRoladaEmUtc { get; set; }

    public MesaCombate Combate { get; set; } = null!;
    public PersonagemJogador? PersonagemJogador { get; set; }
    public Usuario? UsuarioControlador { get; set; }
    public ICollection<MesaCondicaoAtiva> Condicoes { get; set; } = new List<MesaCondicaoAtiva>();
    public ICollection<MesaCooldownAtivo> Cooldowns { get; set; } = new List<MesaCooldownAtivo>();
}
