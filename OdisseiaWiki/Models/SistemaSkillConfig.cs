using System.ComponentModel.DataAnnotations;

namespace OdisseiaWiki.Models;

public class SistemaSkillConfig
{
    [Key]
    public int IdSistemaSkillConfig { get; set; }
    public int IdSistemaVersao { get; set; }
    public int MaximoSkills { get; set; }
    public int NivelMaximoSkill { get; set; }
    public int MaximoUltimates { get; set; }
    public int NivelDesbloqueioUltimate { get; set; }
    public int? MaximoMagias { get; set; }
    public bool UsaCooldown { get; set; }
    public bool PermiteArtesEtericas { get; set; }
    [MaxLength(2000)]
    public string? Observacoes { get; set; }
    public string? ConfiguracaoJson { get; set; }
    public virtual SistemaVersao SistemaVersao { get; set; } = null!;
}
