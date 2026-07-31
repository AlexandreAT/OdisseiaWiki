using System.ComponentModel.DataAnnotations;

namespace OdisseiaWiki.Models;

public class SistemaMorteConfig
{
    [Key]
    public int IdSistemaMorteConfig { get; set; }
    public int IdSistemaVersao { get; set; }
    public int LimiteBeiraDaMorte { get; set; }
    public int QuantidadeTestesCombate { get; set; }
    public int QuantidadeTestesForaCombate { get; set; }
    public int SucessosNecessarios { get; set; }
    [Required, MaxLength(20)]
    public string DadoSobrevivencia { get; set; } = null!;
    public int ResultadoMinimoSucesso { get; set; }
    public int LimiteVidaDesmembramento { get; set; }
    public decimal MultiplicadorDanoDesmembramento { get; set; }
    public int LimiteVidaInstaKill { get; set; }
    public decimal MultiplicadorDanoInstaKill { get; set; }
    public bool PermiteEstabilizacaoManual { get; set; }
    [MaxLength(2000)]
    public string? Observacoes { get; set; }
    public string? ConfiguracaoJson { get; set; }
    public virtual SistemaVersao SistemaVersao { get; set; } = null!;
}
