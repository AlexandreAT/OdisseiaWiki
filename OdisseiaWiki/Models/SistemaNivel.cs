using System.ComponentModel.DataAnnotations;

namespace OdisseiaWiki.Models;

public class SistemaNivel
{
    [Key]
    public int IdSistemaNivel { get; set; }
    public int IdSistemaVersao { get; set; }
    public int Nivel { get; set; }
    public int XpParaProximoNivel { get; set; }
    public int PontosNivel { get; set; }
    public int PontosAtributo { get; set; }
    public int PontosSkill { get; set; }
    public int PontosUltimate { get; set; }
    public bool PermiteNovaMagia { get; set; }
    public bool PermiteNovaSkill { get; set; }
    public int Ordem { get; set; }
    [MaxLength(1000)]
    public string? Observacao { get; set; }
    public virtual SistemaVersao SistemaVersao { get; set; } = null!;
}
