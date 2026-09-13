using System.ComponentModel.DataAnnotations;

namespace OdisseiaWiki.Models;

public sealed class MesaSolicitacaoEntrada
{
    [Key]
    public int IdMesaSolicitacaoEntrada { get; set; }

    public int Idmesa { get; set; }

    public int Idusuario { get; set; }

    [MaxLength(200)]
    public string? Mensagem { get; set; }

    public DateTime DataSolicitacao { get; set; } = DateTime.UtcNow;

    public Mesa Mesa { get; set; } = null!;

    public Usuario Usuario { get; set; } = null!;
}
