using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;

namespace OdisseiaWiki.Services.Helpers;

/// <summary>Shared by sheet proposals and the roguelike, using the pinned System only.</summary>
internal static class GameplayAreaDamage
{
    internal static Dictionary<string, int> Resolve(SistemaVersao version,
        IReadOnlyList<GameplayResolvedResultRange> ranges, int baseDamage)
    {
        var rules = SistemaRpgConfiguration.LerRegras<SistemaRpgConfiguration.RegrasCombate>(version, SistemaModuloTipo.Combate);
        var damage = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        foreach (var range in ranges)
        {
            decimal percent = rules.DanoAreaPorResultado?.FirstOrDefault(rule =>
                rule.CodigoResultado.Trim().Equals(range.Code, StringComparison.OrdinalIgnoreCase))?.Percentual
                ?? (range.CriticalFailure ? 0 : range.Critical || range.Code.StartsWith("ACERTO", StringComparison.OrdinalIgnoreCase) ? 100 : 0);
            decimal value = decimal.Round(baseDamage * percent / 100m, 0, MidpointRounding.AwayFromZero);
            if (percent is < 0 or > 10000 || value > int.MaxValue)
                throw new InvalidOperationException("O percentual de dano em área desta versão do Sistema é inválido.");
            damage[range.Code] = Math.Max(0, (int)value);
        }
        return damage;
    }
}
