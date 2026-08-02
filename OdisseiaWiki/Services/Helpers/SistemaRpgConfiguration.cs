using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;

namespace OdisseiaWiki.Services.Helpers;

internal static partial class SistemaRpgConfiguration
{
    public const string CodigoPadrao = "ODISSEIA";
    public const string VersaoPadrao = "1.0";

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
    };

    [GeneratedRegex("^[A-Z][A-Z0-9_]{2,49}$", RegexOptions.CultureInvariant)]
    private static partial Regex CodigoRegex();

    [GeneratedRegex("^\\d+\\.\\d+(?:\\.\\d+)?$", RegexOptions.CultureInvariant)]
    private static partial Regex VersaoRegex();

    [GeneratedRegex("^D(?<faces>[2-9]|[1-9]\\d{1,3})$", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex DadoRegex();

    public static bool CodigoValido(string codigo) => CodigoRegex().IsMatch(codigo);
    public static bool VersaoValida(string versao) => VersaoRegex().IsMatch(versao);

    public static int? ObterFacesDado(string dado)
    {
        Match match = DadoRegex().Match(dado.Trim());
        return match.Success && int.TryParse(match.Groups["faces"].Value, out int faces) ? faces : null;
    }

    public static string NormalizarCodigo(string? valor, string fallback)
    {
        string source = string.IsNullOrWhiteSpace(valor) ? fallback : valor;
        string decomposed = source.Normalize(NormalizationForm.FormD);
        StringBuilder builder = new();
        foreach (char character in decomposed)
        {
            UnicodeCategory category = CharUnicodeInfo.GetUnicodeCategory(character);
            if (category == UnicodeCategory.NonSpacingMark)
                continue;
            builder.Append(char.IsLetterOrDigit(character) ? char.ToUpperInvariant(character) : '_');
        }

        string normalized = Regex.Replace(builder.ToString(), "_+", "_").Trim('_');
        if (normalized.Length == 0)
            normalized = "CONFIG";
        if (char.IsDigit(normalized[0]))
            normalized = $"C_{normalized}";
        return normalized.Length <= 50 ? normalized : normalized[..50].TrimEnd('_');
    }

    public static T LerRegras<T>(SistemaVersao versao, SistemaModuloTipo tipo) where T : new()
    {
        string? json = versao.Modulos.FirstOrDefault(m => m.TipoModulo == tipo)?.ConfiguracaoJson;
        if (string.IsNullOrWhiteSpace(json))
            return new T();

        try
        {
            return JsonSerializer.Deserialize<T>(json, JsonOptions) ?? new T();
        }
        catch (JsonException)
        {
            return new T();
        }
    }

    public static void GravarRegras<T>(SistemaVersao versao, SistemaModuloTipo tipo, T regras, int ordemPadrao)
    {
        SistemaModulo? modulo = versao.Modulos.FirstOrDefault(m => m.TipoModulo == tipo);
        if (modulo is null)
        {
            modulo = new SistemaModulo
            {
                IdSistemaVersao = versao.IdSistemaVersao,
                TipoModulo = tipo,
                Habilitado = true,
                SchemaVersion = 1,
                Ordem = ordemPadrao,
            };
            versao.Modulos.Add(modulo);
        }

        modulo.ConfiguracaoJson = JsonSerializer.Serialize(regras, JsonOptions);
    }

    public static RaceExtras LerExtrasRaca(SistemaRacaConfig raca)
    {
        if (string.IsNullOrWhiteSpace(raca.ConfiguracaoJson))
            return new RaceExtras();
        try
        {
            return JsonSerializer.Deserialize<RaceExtras>(raca.ConfiguracaoJson, JsonOptions) ?? new RaceExtras();
        }
        catch (JsonException)
        {
            return new RaceExtras();
        }
    }

    public static string? GravarExtrasRaca(SistemaRacaConfigDto dto)
    {
        RaceExtras extras = new()
        {
            Passivas = dto.Passivas,
            Variantes = dto.Variantes,
            NivelDesbloqueio = dto.NivelDesbloqueio,
            Observacoes = dto.Observacoes,
        };
        return JsonSerializer.Serialize(extras, JsonOptions);
    }

    internal sealed class RegrasGerais
    {
        public string DadoTesteGeral { get; set; } = "D6";
        public bool UsaVantagem { get; set; } = true;
        public bool UsaDesvantagem { get; set; } = true;
        public int CriticoNatural { get; set; } = 6;
        public int FalhaCriticaNatural { get; set; } = 1;
        public string RegraArredondamento { get; set; } = "Arredondar para baixo.";
        public bool RegraEspecificaPrevalece { get; set; } = true;
        public bool AutoridadeMestre { get; set; } = true;
        public string? ObservacoesRegrasFundamentais { get; set; }
    }

    internal sealed class RegrasCriacao
    {
        public int NivelInicial { get; set; } = 1;
        public int PontosIniciais { get; set; }
        public int PontosAtributoIniciais { get; set; }
        public int PontosSkillIniciais { get; set; }
        public int MaximoSkillsIniciais { get; set; }
        public int MaximoMagiasIniciais { get; set; }
        public int MaximoUltimatesIniciais { get; set; }
    }

    internal sealed class RegrasProgressao
    {
        public int NivelMaximo { get; set; } = 20;
        public bool PermiteXpExcedente { get; set; }
    }

    internal sealed class RegrasExploracao
    {
        public bool CargaUsaLimite { get; set; } = true;
        public string? PenalidadeExcessoCarga { get; set; }
        public string? FurtividadeObservacoes { get; set; }
    }

    internal sealed class RegrasCombate
    {
        public bool UsaIniciativa { get; set; } = true;
        public string? FormulaIniciativa { get; set; }
        public int SegundosPorTurno { get; set; } = 6;
        public string? RegraDeclaracaoAcoes { get; set; }
    }

    internal sealed class RegrasPoderes
    {
        public int LimiteMagias { get; set; }
        public bool PermiteMagiasCompostas { get; set; }
        public string? RegraAprendizadoMagia { get; set; }
    }

    internal sealed class RegrasSobrevivencia
    {
        public string? RegraLoot { get; set; }
        public string? RegraRefeicoes { get; set; }
    }

    internal sealed class RaceExtras
    {
        public string? Passivas { get; set; }
        public string? Variantes { get; set; }
        public int NivelDesbloqueio { get; set; }
        public string? Observacoes { get; set; }
    }
}
