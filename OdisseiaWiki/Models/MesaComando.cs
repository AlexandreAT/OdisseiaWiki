using System.ComponentModel.DataAnnotations;
using OdisseiaWiki.Enums;

namespace OdisseiaWiki.Models;

public sealed class MesaComando
{
    [Key]
    public long IdMesaComando { get; set; }
    public int IdMesa { get; set; }
    public long? IdMesaSessao { get; set; }
    [Required, MaxLength(36)]
    public string ChaveIdempotencia { get; set; } = null!;
    [Required, MaxLength(64)]
    public string HashPayload { get; set; } = null!;
    public int? IdUsuarioAtor { get; set; }
    public int? IdPersonagemJogador { get; set; }
    [Required, MaxLength(50)]
    public string Tipo { get; set; } = null!;
    public long? RevisaoMesaEsperada { get; set; }
    public long? RevisaoSessaoEsperada { get; set; }
    public long? RevisaoPersonagemEsperada { get; set; }
    public string? RevisoesAlvosJson { get; set; }
    public MesaComandoStatus Status { get; set; } = MesaComandoStatus.Concluido;
    [Required]
    public string RespostaJson { get; set; } = null!;
    public DateTime CriadoEmUtc { get; set; } = DateTime.UtcNow;
    public DateTime ConcluidoEmUtc { get; set; } = DateTime.UtcNow;

    public Mesa Mesa { get; set; } = null!;
    public MesaSessao? Sessao { get; set; }
    public Usuario? UsuarioAtor { get; set; }
    public PersonagemJogador? PersonagemJogador { get; set; }
    public ICollection<MesaEvento> Eventos { get; set; } = new List<MesaEvento>();
}
