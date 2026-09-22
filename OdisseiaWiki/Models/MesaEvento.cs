using System.ComponentModel.DataAnnotations;
using OdisseiaWiki.Enums;

namespace OdisseiaWiki.Models;

public sealed class MesaEvento
{
    [Key]
    public long IdMesaEvento { get; set; }
    public long IdMesaSessao { get; set; }
    public long? IdMesaComando { get; set; }
    public long Sequencia { get; set; }
    [Required, MaxLength(50)]
    public string Tipo { get; set; } = null!;
    public GameplayEventOrigin Origem { get; set; }
    public GameplayEventVisibility Visibilidade { get; set; }
    public int? IdUsuarioAtor { get; set; }
    public int? IdPersonagemJogador { get; set; }
    public int? IdSistemaRpg { get; set; }
    public int? IdSistemaVersaoEfetiva { get; set; }
    public int? IdSistemaVersaoPersonagem { get; set; }
    [MaxLength(80)]
    public string? CodigoRegra { get; set; }
    public int SchemaVersion { get; set; } = 1;
    [Required]
    public string DadosJson { get; set; } = null!;
    public DateTime OcorreuEmUtc { get; set; } = DateTime.UtcNow;

    public MesaSessao Sessao { get; set; } = null!;
    public MesaComando? Comando { get; set; }
    public Usuario? UsuarioAtor { get; set; }
    public PersonagemJogador? PersonagemJogador { get; set; }
    public SistemaRpg? SistemaRpg { get; set; }
    public SistemaVersao? SistemaVersaoEfetiva { get; set; }
    public SistemaVersao? SistemaVersaoPersonagem { get; set; }
    public MesaRolagem? Rolagem { get; set; }
}
