using System.ComponentModel.DataAnnotations;

namespace OdisseiaWiki.Models;

public sealed class MesaEfeitoAplicado
{
    [Key]
    public long IdMesaEfeitoAplicado { get; set; }
    public long IdMesaSessao { get; set; }
    public long IdEventoOrigem { get; set; }
    public long IdEventoAplicacao { get; set; }
    public int? IdPersonagemAlvo { get; set; }
    [Required, MaxLength(100)]
    public string ChaveEfeito { get; set; } = null!;
    [Required, MaxLength(64)]
    public string HashPlano { get; set; } = null!;
    public DateTime AplicadoEmUtc { get; set; } = DateTime.UtcNow;

    public MesaSessao Sessao { get; set; } = null!;
    public MesaEvento EventoOrigem { get; set; } = null!;
    public MesaEvento EventoAplicacao { get; set; } = null!;
    public PersonagemJogador? PersonagemAlvo { get; set; }
}
