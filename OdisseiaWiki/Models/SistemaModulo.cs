using System.ComponentModel.DataAnnotations;
using OdisseiaWiki.Enums;

namespace OdisseiaWiki.Models;

public class SistemaModulo
{
    [Key]
    public int IdSistemaModulo { get; set; }
    public int IdSistemaVersao { get; set; }
    public SistemaModuloTipo TipoModulo { get; set; }
    public bool Habilitado { get; set; } = true;
    public int SchemaVersion { get; set; } = 1;
    public string? ConfiguracaoJson { get; set; }
    public int Ordem { get; set; }
    public virtual SistemaVersao SistemaVersao { get; set; } = null!;
}
