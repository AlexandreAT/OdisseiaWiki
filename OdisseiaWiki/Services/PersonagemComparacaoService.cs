using System.Text.Json;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Services;

public sealed class PersonagemComparacaoService : IPersonagemComparacaoService
{
    private const int ResultLimit = 12;
    private readonly IPersonagemRepository _personagens;
    private readonly IPersonagemJogadorRepository _jogadores;
    private readonly IMesaService _mesas;
    private readonly ISistemaRpgResolver _resolver;

    public PersonagemComparacaoService(
        IPersonagemRepository personagens,
        IPersonagemJogadorRepository jogadores,
        IMesaService mesas,
        ISistemaRpgResolver resolver)
    {
        _personagens = personagens;
        _jogadores = jogadores;
        _mesas = mesas;
        _resolver = resolver;
    }

    public async Task<PersonagemComparacaoPesquisaResultadoDto> SearchAsync(
        PersonagemComparacaoOrigem origem,
        int? idPersonagemAtual,
        int? idMesa,
        string term,
        int? idUsuario,
        bool administrador)
    {
        string normalizedTerm = term.Trim();
        if (normalizedTerm.Length == 0)
            return new PersonagemComparacaoPesquisaResultadoDto();

        int? effectiveTableId = null;
        if (origem == PersonagemComparacaoOrigem.Jogador)
        {
            effectiveTableId = idPersonagemAtual.HasValue
                ? await _jogadores.GetTableIdAsync(idPersonagemAtual.Value)
                : idMesa;

            if (!effectiveTableId.HasValue || !idUsuario.HasValue)
                return Denied();

            if (!administrador && !await _mesas.CanUseAsync(effectiveTableId.Value, idUsuario.Value))
                return Denied();
        }

        List<PersonagemComparacaoRegistro> registros = await _personagens
            .SearchVisibleForComparisonAsync(
                normalizedTerm,
                origem == PersonagemComparacaoOrigem.Npc ? idPersonagemAtual : null,
                ResultLimit);

        if (origem == PersonagemComparacaoOrigem.Jogador && effectiveTableId.HasValue)
        {
            registros.AddRange(await _jogadores.SearchTableForComparisonAsync(
                effectiveTableId.Value,
                normalizedTerm,
                idPersonagemAtual,
                ResultLimit));
        }

        List<PersonagemComparacaoRegistro> ordered = registros
            .OrderByDescending(registro => registro.Nome.StartsWith(normalizedTerm, StringComparison.OrdinalIgnoreCase))
            .ThenBy(registro => registro.Nome)
            .Take(ResultLimit)
            .ToList();

        return new PersonagemComparacaoPesquisaResultadoDto
        {
            Personagens = await MapAsync(ordered),
        };
    }

    public async Task<PersonagemComparacaoPesquisaResultadoDto> GetAsync(
        PersonagemComparacaoOrigem origem,
        int id,
        int? idUsuario,
        bool administrador)
    {
        PersonagemComparacaoRegistro? registro;
        if (origem == PersonagemComparacaoOrigem.Npc)
        {
            registro = await _personagens.GetForComparisonAsync(id, requireVisible: !administrador);
        }
        else
        {
            if (!idUsuario.HasValue)
                return Denied();

            registro = await _jogadores.GetForComparisonAsync(id);
            if (registro?.IdMesa is int tableId
                && !administrador
                && !await _mesas.CanUseAsync(tableId, idUsuario.Value))
                return Denied();
        }

        return new PersonagemComparacaoPesquisaResultadoDto
        {
            Personagens = registro is null
                ? new List<PersonagemComparacaoDto>()
                : await MapAsync(new[] { registro }),
        };
    }

    private async Task<List<PersonagemComparacaoDto>> MapAsync(
        IEnumerable<PersonagemComparacaoRegistro> registros)
    {
        var result = new List<PersonagemComparacaoDto>();
        foreach (PersonagemComparacaoRegistro registro in registros)
        {
            SistemaRuntimeContextoDto runtime = await _resolver.ResolverContextoAsync(
                registro.Jogador
                    ? new SistemaRuntimeConsultaDto { IdPersonagemJogador = registro.Id }
                    : new SistemaRuntimeConsultaDto
                    {
                        TipoEntidade = SistemaEntidadeGlobalTipo.Npc,
                        IdEntidade = registro.Id.ToString(),
                        IdRaca = registro.IdRaca,
                    });

            result.Add(new PersonagemComparacaoDto
            {
                Id = registro.Id,
                Origem = registro.Jogador
                    ? PersonagemComparacaoOrigem.Jogador
                    : PersonagemComparacaoOrigem.Npc,
                Nome = registro.Nome,
                Imagem = registro.Imagem,
                IdMesa = registro.IdMesa,
                MesaNome = registro.MesaNome,
                QuantidadeSkills = CountEntries(registro.SkillsJson),
                Status = ParseStatus(registro.StatusJson),
                SistemaRuntime = SummarizeRuntime(runtime),
            });
        }

        return result;
    }

    private static PersonagemComparacaoSistemaDto SummarizeRuntime(SistemaRuntimeContextoDto runtime)
    {
        var scales = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);

        foreach (SistemaRecursoConfigDto resource in runtime.Criacao?.Recursos ?? [])
        {
            string code = NormalizeCode(resource.Codigo);
            if (code is "vida" or "mana" or "estamina" && resource.ValorMaximo is > 0)
                scales[code] = resource.ValorMaximo.Value;
        }

        foreach (SistemaAtributoConfigDto attribute in runtime.Criacao?.Atributos ?? [])
        {
            string code = NormalizeCode(attribute.Codigo);
            if (code is not ("resistencia" or "agilidade" or "sabedoria" or "precisao" or "forca"))
                continue;

            int maximum = attribute.ValorMaximoAbsoluto is > 0
                ? attribute.ValorMaximoAbsoluto.Value
                : attribute.ValorMaximoNatural;
            if (maximum > 0) scales[code] = maximum;
        }

        return new PersonagemComparacaoSistemaDto
        {
            IdSistemaRpg = runtime.IdSistemaRpg,
            IdSistemaVersao = runtime.IdSistemaVersao,
            CodigoSistema = runtime.CodigoSistema,
            NomeSistema = runtime.NomeSistema,
            NumeroVersao = runtime.NumeroVersao,
            UsaFallbackLegado = runtime.UsaFallbackLegado,
            Escalas = scales,
        };
    }

    private static PersonagemComparacaoStatusDto ParseStatus(string json)
    {
        var result = new PersonagemComparacaoStatusDto();
        if (string.IsNullOrWhiteSpace(json)) return result;

        try
        {
            using JsonDocument document = JsonDocument.Parse(json);
            JsonElement root = document.RootElement;
            JsonElement status = Property(root, "status");
            JsonElement attributes = Property(root, "atributos");
            JsonElement primary = Property(attributes, "principais");
            JsonElement defenses = Property(root, "defesas");

            result.Vida = PreferPositive(status, "vidaMaxima", "vida");
            result.Estamina = PreferPositive(status, "estaminaMaxima", "estamina");
            result.Mana = PreferPositive(status, "manaMaxima", "mana");
            result.Resistencia = Number(primary, "resistencia");
            result.Agilidade = Number(primary, "agilidade");
            result.Sabedoria = Number(primary, "sabedoria");
            result.Precisao = Number(primary, "precisao");
            result.Forca = Number(primary, "forca");
            result.Escudo = Number(defenses, "escudo");
            result.Protecao = Number(defenses, "protecao");
            result.Armadura = Number(defenses, "armadura");
            result.Outras = Number(defenses, "outras");
            result.Nivel = Math.Max(1, (int)Number(root, "nivel"));
        }
        catch (JsonException)
        {
            // Fichas legadas incompletas continuam comparáveis com valores neutros.
        }

        return result;
    }

    private static int CountEntries(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return 0;
        try
        {
            using JsonDocument document = JsonDocument.Parse(json);
            if (document.RootElement.ValueKind != JsonValueKind.Array) return 0;

            return document.RootElement.EnumerateArray().Count(entry => entry.ValueKind switch
            {
                JsonValueKind.Object => HasMeaningfulEntry(entry),
                JsonValueKind.String => !string.IsNullOrWhiteSpace(entry.GetString()),
                JsonValueKind.Null or JsonValueKind.Undefined => false,
                _ => true,
            });
        }
        catch (JsonException)
        {
            return 0;
        }
    }

    private static bool HasMeaningfulEntry(JsonElement entry)
    {
        JsonElement name = Property(entry, "nome");
        if (name.ValueKind == JsonValueKind.String)
            return !string.IsNullOrWhiteSpace(name.GetString());

        return entry.EnumerateObject().Any(property => property.Value.ValueKind switch
        {
            JsonValueKind.String => !string.IsNullOrWhiteSpace(property.Value.GetString()),
            JsonValueKind.Number or JsonValueKind.True => true,
            JsonValueKind.Array => property.Value.GetArrayLength() > 0,
            JsonValueKind.Object => property.Value.EnumerateObject().Any(),
            _ => false,
        });
    }

    private static decimal PreferPositive(JsonElement element, string preferred, string fallback)
    {
        decimal value = Number(element, preferred);
        return value > 0 ? value : Number(element, fallback);
    }

    private static decimal Number(JsonElement element, string name)
    {
        JsonElement property = Property(element, name);
        if (property.ValueKind == JsonValueKind.Number && property.TryGetDecimal(out decimal number))
            return number;
        if (property.ValueKind == JsonValueKind.String && decimal.TryParse(property.GetString(), out number))
            return number;
        return 0;
    }

    private static JsonElement Property(JsonElement element, string name)
    {
        if (element.ValueKind != JsonValueKind.Object) return default;
        foreach (JsonProperty property in element.EnumerateObject())
        {
            if (property.Name.Equals(name, StringComparison.OrdinalIgnoreCase))
                return property.Value;
        }
        return default;
    }

    private static string NormalizeCode(string value)
    {
        string normalized = value.Normalize(System.Text.NormalizationForm.FormD);
        return string.Concat(normalized
            .Where(character => System.Globalization.CharUnicodeInfo.GetUnicodeCategory(character)
                != System.Globalization.UnicodeCategory.NonSpacingMark)
            .Where(char.IsLetterOrDigit))
            .ToLowerInvariant();
    }

    private static PersonagemComparacaoPesquisaResultadoDto Denied()
        => new() { AcessoPermitido = false };
}
