using System.ComponentModel.DataAnnotations;
using OdisseiaWiki.Enums;

namespace OdisseiaWiki.Models;

public class MesaEntidadeConfig
{
    [Key]
    public int IdmesaEntidadeConfig { get; set; }

    public int Idmesa { get; set; }

    public MesaEntidadeTipo TipoEntidade { get; set; }

    [MaxLength(100)]
    public string Identidade { get; set; } = null!;

    public string ConfigJson { get; set; } = null!;

    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

    public DateTime DataAtualizacao { get; set; } = DateTime.UtcNow;

    public virtual Mesa IdmesaNavigation { get; set; } = null!;
}
