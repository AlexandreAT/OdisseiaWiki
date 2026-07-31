using System.ComponentModel.DataAnnotations;

namespace OdisseiaWiki.Models;

public class SistemaPontosAcaoConfig
{
    [Key]
    public int IdSistemaPontosAcaoConfig { get; set; }
    public int IdSistemaVersao { get; set; }
    public bool Habilitado { get; set; }
    public int PontosPorTurno { get; set; }
    public int SegundosPorPonto { get; set; }
    public bool PermiteAcumular { get; set; }
    public int LimiteAcumulado { get; set; }
    public string? ConfiguracaoJson { get; set; }
    public virtual SistemaVersao SistemaVersao { get; set; } = null!;
}
