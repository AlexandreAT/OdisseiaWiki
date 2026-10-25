using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;

namespace OdisseiaWiki.Services.Helpers;

/// <summary>Only explicit published removal rules are executable. Older narrative text stays assisted.</summary>
public static class SistemaCondicaoRemocao
{
    public static string[] Codigos(string? value) => (value ?? string.Empty)
        .Split(';', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
        .Select(part => Code(part) switch
        {
            "DESCANSO_NORMAL_OU_LONGO" => "DESCANSO_NORMAL",
            "APOS_A_DURACAO_CONFIGURADA" => "DURACAO",
            var code => code,
        }).Distinct().ToArray();

    public static bool AoTerminarDuracao(SistemaCondicao rule) =>
        Has(rule, "DURACAO") || Has(rule, "APOS_A_DURACAO_CONFIGURADA") ||
        string.IsNullOrWhiteSpace(rule.RegraRemocao) && rule.DuracaoPadrao is > 0;

    public static bool AoCessarGatilho(SistemaCondicao rule) =>
        Has(rule, "GATILHO_CESSOU") ||
        string.IsNullOrWhiteSpace(rule.RegraRemocao) && rule.RemocaoAutomatica ||
        Has(rule, "REDUZIR_A_CARGA_ATE_A_CAPACIDADE") && rule.RemocaoAutomatica;

    public static bool AoDescansar(SistemaCondicao rule, string? restType)
    {
        int level = Code(restType) switch { "SIMPLES" => 1, "NORMAL" or "MEDIO" => 2, "LONGO" => 3, _ => 0 };
        int minimum = Has(rule, "DESCANSO_SIMPLES") ? 1
            : Has(rule, "DESCANSO_NORMAL") ? 2
            : Has(rule, "DESCANSO_LONGO") ? 3
            : Has(rule, "DESCANSO_NORMAL_OU_LONGO") ? 2
            : string.IsNullOrWhiteSpace(rule.RegraRemocao) &&
              rule.UnidadeDuracao == SistemaUnidadeDuracao.Descanso ? 1 : 0;
        return minimum > 0 && level >= minimum;
    }

    public static bool AoCurar(SistemaCondicao rule) => Has(rule, "CURA");
    public static bool AoUsarMagiaDeRemocao(SistemaCondicao rule) => Has(rule, "MAGIA");

    private static bool Has(SistemaCondicao rule, string expected) =>
        (rule.RegraRemocao ?? string.Empty).Split(';', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
            .Any(part => Code(part) == expected);

    private static string Code(string? value) => (value ?? string.Empty).Trim().ToUpperInvariant()
        .Replace(' ', '_').Replace('-', '_').Replace('Á', 'A').Replace('Ã', 'A')
        .Replace('É', 'E').Replace('Ê', 'E').Replace('Í', 'I').Replace('Ó', 'O')
        .Replace('Ô', 'O').Replace('Õ', 'O').Replace('Ú', 'U').Replace('Ç', 'C');
}
