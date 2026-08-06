using System.Text.Json;
using System.Text.Json.Nodes;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Interfaces;
using OdisseiaWiki.Services.Helpers;

namespace OdisseiaWiki.Services;

public class MesaEntidadeConfigService : IMesaEntidadeConfigService
{
    private static readonly IReadOnlyDictionary<MesaEntidadeTipo, HashSet<string>> AllowedFields =
        new Dictionary<MesaEntidadeTipo, HashSet<string>>
        {
            [MesaEntidadeTipo.Raca] = Fields(
                "vidaBase", "estaminaBase", "manaBase", "capacidadeCargaBase", "codigoAtributoInicial"),
            [MesaEntidadeTipo.Item] = Fields(
                "nome", "descricao", "peso", "discricao", "quantidade", "efeito", "imagem",
                "atributosJson", "tags", "visivel", "destaque"),
            [MesaEntidadeTipo.Passiva] = Fields(
                "nome", "descricao", "statusJson", "tags", "visivel", "destaque"),
            [MesaEntidadeTipo.Proficiencia] = Fields(
                "nome", "descricao", "statusJson", "tags", "visivel", "destaque"),
            [MesaEntidadeTipo.Cidade] = Fields(
                "nome", "descricao", "imagem", "galeriaImagem", "tags", "pontosDeInteresse", "visivel", "destaque"),
        };

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
    };

    private readonly IMesaEntidadeConfigRepository _configRepository;
    private readonly IMesaRepository _mesaRepository;

    public MesaEntidadeConfigService(
        IMesaEntidadeConfigRepository configRepository,
        IMesaRepository mesaRepository)
    {
        _configRepository = configRepository;
        _mesaRepository = mesaRepository;
    }

    public async Task<ResultMesaEntidadeConfig> GetAsync(int idMesa, MesaEntidadeTipo tipoEntidade, string idEntidade)
    {
        if (await _mesaRepository.GetByIdAsync(idMesa) is null)
            return ResultMesaEntidadeConfig.Fail("Mesa não encontrada.");

        var configuracao = await _configRepository.GetAsync(idMesa, tipoEntidade, idEntidade);
        return configuracao is null
            ? ResultMesaEntidadeConfig.Fail("Configuração não encontrada.")
            : ResultMesaEntidadeConfig.Ok(MapToDto(configuracao));
    }

    public async Task<ResultMesaEntidadeConfig> SaveAsync(MesaEntidadeConfigDto dto, bool isAdmin = false)
    {
        if (dto.Idmesa <= 0 || dto.Idusuario <= 0 || string.IsNullOrWhiteSpace(dto.Identidade))
            return ResultMesaEntidadeConfig.Fail("Mesa, usuário e entidade são obrigatórios.");

        if (dto.ConfigJson.ValueKind != JsonValueKind.Object)
            return ResultMesaEntidadeConfig.Fail("ConfigJson deve ser um objeto JSON.");

        if (!TryValidateDelta(dto.TipoEntidade, dto.ConfigJson, out string? schemaError))
            return ResultMesaEntidadeConfig.Fail(schemaError!);

        if (await _mesaRepository.GetByIdAsync(dto.Idmesa) is null)
            return ResultMesaEntidadeConfig.Fail("Mesa não encontrada.");

        if ((await _mesaRepository.GetByCodigoSistemaAsync(SystemMesaConstants.CodigoMesaPadrao))?.Idmesa == dto.Idmesa)
            return ResultMesaEntidadeConfig.Fail("A mesa padrão não aceita configurações personalizadas.");

        if (!isAdmin && !await _mesaRepository.IsOwnerAsync(dto.Idmesa, dto.Idusuario))
            return ResultMesaEntidadeConfig.Fail("Usuário sem permissão para configurar esta mesa.");

        if (!await _configRepository.EntityExistsAsync(dto.TipoEntidade, dto.Identidade))
            return ResultMesaEntidadeConfig.Fail("Entidade não encontrada para o tipo informado.");

        var configuracao = await _configRepository.GetAsync(dto.Idmesa, dto.TipoEntidade, dto.Identidade);
        if (configuracao is null)
        {
            configuracao = new MesaEntidadeConfig
            {
                Idmesa = dto.Idmesa,
                TipoEntidade = dto.TipoEntidade,
                Identidade = dto.Identidade,
                ConfigJson = dto.ConfigJson.GetRawText(),
                DataCriacao = DateTime.UtcNow,
                DataAtualizacao = DateTime.UtcNow,
            };
            await _configRepository.CreateAsync(configuracao);
        }
        else
        {
            configuracao.ConfigJson = dto.ConfigJson.GetRawText();
            configuracao.DataAtualizacao = DateTime.UtcNow;
            await _configRepository.UpdateAsync(configuracao);
        }

        return ResultMesaEntidadeConfig.Ok(MapToDto(configuracao));
    }

    public async Task<ResultMesaEntidadeConfig> DeleteAsync(
        int idMesa,
        MesaEntidadeTipo tipoEntidade,
        string idEntidade,
        int idUsuario,
        bool isAdmin = false)
    {
        if (await _mesaRepository.GetByIdAsync(idMesa) is null)
            return ResultMesaEntidadeConfig.Fail("Mesa não encontrada.");

        if ((await _mesaRepository.GetByCodigoSistemaAsync(SystemMesaConstants.CodigoMesaPadrao))?.Idmesa == idMesa)
            return ResultMesaEntidadeConfig.Fail("A mesa padrão não aceita configurações personalizadas.");

        if (!isAdmin && !await _mesaRepository.IsOwnerAsync(idMesa, idUsuario))
            return ResultMesaEntidadeConfig.Fail("Usuário sem permissão para configurar esta mesa.");

        var configuracao = await _configRepository.GetAsync(idMesa, tipoEntidade, idEntidade);
        if (configuracao is null)
            return ResultMesaEntidadeConfig.Fail("Configuração não encontrada.");

        await _configRepository.DeleteAsync(configuracao);
        return ResultMesaEntidadeConfig.Ok(MapToDto(configuracao));
    }

    public async Task<T> ApplyOverrideAsync<T>(int? idMesa, MesaEntidadeTipo tipoEntidade, string idEntidade, T entidadeBase)
    {
        if (!idMesa.HasValue)
            return entidadeBase;

        var configuracao = await _configRepository.GetAsync(idMesa.Value, tipoEntidade, idEntidade);
        if (configuracao is null)
            return entidadeBase;

        var baseNode = JsonSerializer.SerializeToNode(entidadeBase, JsonOptions);
        var overrideNode = JsonNode.Parse(configuracao.ConfigJson);
        if (baseNode is null || overrideNode is null)
            return entidadeBase;

        return JsonOverrideMerger.Merge(baseNode, overrideNode).Deserialize<T>(JsonOptions) ?? entidadeBase;
    }

    public async Task<IReadOnlyDictionary<string, T>> ApplyOverridesAsync<T>(
        int? idMesa,
        MesaEntidadeTipo tipoEntidade,
        IReadOnlyDictionary<string, T> entidadesBase)
    {
        if (!idMesa.HasValue || entidadesBase.Count == 0)
            return entidadesBase;

        List<MesaEntidadeConfig> configuracoes = await _configRepository.GetAllAsync(
            idMesa.Value,
            tipoEntidade);
        if (configuracoes.Count == 0)
            return entidadesBase;

        Dictionary<string, T> resultado = entidadesBase.ToDictionary(
            pair => pair.Key,
            pair => pair.Value,
            StringComparer.OrdinalIgnoreCase);
        foreach (MesaEntidadeConfig configuracao in configuracoes)
        {
            if (!resultado.TryGetValue(configuracao.Identidade, out T? entidadeBase))
                continue;

            JsonNode? baseNode = JsonSerializer.SerializeToNode(entidadeBase, JsonOptions);
            JsonNode? overrideNode = JsonNode.Parse(configuracao.ConfigJson);
            if (baseNode is null || overrideNode is null)
                continue;

            T? entidadeResolvida = JsonOverrideMerger.Merge(baseNode, overrideNode)
                .Deserialize<T>(JsonOptions);
            if (entidadeResolvida is not null)
                resultado[configuracao.Identidade] = entidadeResolvida;
        }

        return resultado;
    }

    private static MesaEntidadeConfigDto MapToDto(MesaEntidadeConfig configuracao) => new()
    {
        Idmesa = configuracao.Idmesa,
        TipoEntidade = configuracao.TipoEntidade,
        Identidade = configuracao.Identidade,
        ConfigJson = JsonDocument.Parse(configuracao.ConfigJson).RootElement.Clone(),
        DataCriacao = configuracao.DataCriacao,
        DataAtualizacao = configuracao.DataAtualizacao,
    };

    private static HashSet<string> Fields(params string[] names) =>
        names.Select(NormalizeField).ToHashSet(StringComparer.Ordinal);

    private static bool TryValidateDelta(
        MesaEntidadeTipo tipo,
        JsonElement config,
        out string? error)
    {
        error = null;
        JsonProperty[] properties = config.EnumerateObject().ToArray();
        if (properties.Length == 0)
        {
            error = "O override deve informar ao menos uma diferença.";
            return false;
        }

        if (!AllowedFields.TryGetValue(tipo, out HashSet<string>? allowed))
        {
            error = "O tipo de entidade não possui schema de override configurado.";
            return false;
        }

        foreach (JsonProperty property in properties)
        {
            if (!allowed.Contains(NormalizeField(property.Name)))
            {
                error = $"O campo '{property.Name}' não pertence ao schema de override de {tipo}.";
                return false;
            }

            if (!ValidateSafeJson(property.Value, depth: 0, ref error))
                return false;
        }

        if (tipo == MesaEntidadeTipo.Raca)
        {
            foreach (JsonProperty property in properties)
            {
                string field = NormalizeField(property.Name);
                bool isAttribute = field == NormalizeField("codigoAtributoInicial");
                if (isAttribute && property.Value.ValueKind is not (JsonValueKind.String or JsonValueKind.Null))
                {
                    error = $"O campo '{property.Name}' deve ser texto ou nulo.";
                    return false;
                }

                if (!isAttribute && (!property.Value.TryGetInt32(out int number) || number < 0))
                {
                    error = $"O campo '{property.Name}' deve ser um inteiro maior ou igual a zero.";
                    return false;
                }
            }
        }

        return true;
    }

    private static bool ValidateSafeJson(JsonElement value, int depth, ref string? error)
    {
        if (depth > 8)
        {
            error = "O override excede a profundidade máxima permitida.";
            return false;
        }

        if (value.ValueKind == JsonValueKind.Object)
        {
            JsonProperty[] properties = value.EnumerateObject().ToArray();
            if (properties.Length > 200)
            {
                error = "Um objeto do override possui campos demais.";
                return false;
            }
            foreach (JsonProperty property in properties)
            {
                if (!ValidateSafeJson(property.Value, depth + 1, ref error))
                {
                    return false;
                }
            }

            return true;
        }

        if (value.ValueKind == JsonValueKind.Array)
        {
            JsonElement[] values = value.EnumerateArray().ToArray();
            if (values.Length > 100)
            {
                error = "Uma lista do override possui itens demais.";
                return false;
            }
            foreach (JsonElement item in values)
            {
                if (!ValidateSafeJson(item, depth + 1, ref error))
                {
                    return false;
                }
            }

            return true;
        }

        if (value.ValueKind == JsonValueKind.String && value.GetString()?.Length > 4000)
        {
            error = "Um texto do override excede 4.000 caracteres.";
            return false;
        }

        return value.ValueKind is not JsonValueKind.Undefined;
    }

    private static string NormalizeField(string value) => new(
        value.Where(char.IsLetterOrDigit).Select(char.ToLowerInvariant).ToArray());
}
