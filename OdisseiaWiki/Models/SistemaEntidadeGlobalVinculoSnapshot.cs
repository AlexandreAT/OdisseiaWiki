using OdisseiaWiki.Enums;

namespace OdisseiaWiki.Models;

/// <summary>
/// Projeção de leitura do vínculo armazenado diretamente em uma entidade global.
/// Não é uma entidade persistida e não contém nenhum valor mecânico da ficha.
/// </summary>
public sealed class SistemaEntidadeGlobalVinculoSnapshot
{
    public SistemaEntidadeGlobalTipo TipoEntidade { get; init; }
    public string IdEntidade { get; init; } = null!;
    public int? IdSistemaRpg { get; init; }
    public int? IdSistemaVersao { get; init; }
    public bool AcompanharPublicacaoAtual { get; init; } = true;
    public ItemTipo? TipoItem { get; init; }
    public string? EstadoJson { get; init; }
    public string? SkillsJson { get; init; }
    public string? MagiasJson { get; init; }
}
