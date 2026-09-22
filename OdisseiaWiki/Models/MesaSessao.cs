using System.ComponentModel.DataAnnotations;
using OdisseiaWiki.Enums;

namespace OdisseiaWiki.Models;

public sealed class MesaSessao
{
    [Key]
    public long IdMesaSessao { get; set; }
    public int IdMesa { get; set; }
    public MesaSessaoStatus Status { get; set; } = MesaSessaoStatus.Ativa;
    public int IdSistemaVersao { get; set; }
    public int? IdUsuarioCriacao { get; set; }
    public int? IdUsuarioEncerramento { get; set; }
    public DateTime IniciadaEmUtc { get; set; } = DateTime.UtcNow;
    public DateTime? EncerradaEmUtc { get; set; }
    public long RevisaoEstado { get; set; }
    public long UltimaSequenciaEvento { get; set; }
    public int? ChaveAtiva { get; private set; }
    public int VersaoSchema { get; set; } = 1;
    public string? ContextoAberturaJson { get; set; }
    [MaxLength(250)]
    public string? MotivoEncerramento { get; set; }

    public Mesa Mesa { get; set; } = null!;
    public SistemaVersao SistemaVersao { get; set; } = null!;
    public Usuario? UsuarioCriacao { get; set; }
    public Usuario? UsuarioEncerramento { get; set; }
    public ICollection<MesaComando> Comandos { get; set; } = new List<MesaComando>();
    public ICollection<MesaEvento> Eventos { get; set; } = new List<MesaEvento>();
}
