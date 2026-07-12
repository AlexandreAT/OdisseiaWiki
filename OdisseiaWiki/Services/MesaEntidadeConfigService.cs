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

    public async Task<ResultMesaEntidadeConfig> SaveAsync(MesaEntidadeConfigDto dto)
    {
        if (dto.Idmesa <= 0 || dto.Idusuario <= 0 || string.IsNullOrWhiteSpace(dto.Identidade))
            return ResultMesaEntidadeConfig.Fail("Mesa, usuário e entidade são obrigatórios.");

        if (dto.ConfigJson.ValueKind != JsonValueKind.Object)
            return ResultMesaEntidadeConfig.Fail("ConfigJson deve ser um objeto JSON.");

        if (await _mesaRepository.GetByIdAsync(dto.Idmesa) is null)
            return ResultMesaEntidadeConfig.Fail("Mesa não encontrada.");

        if ((await _mesaRepository.GetByCodigoSistemaAsync(SystemMesaConstants.CodigoMesaPadrao))?.Idmesa == dto.Idmesa)
            return ResultMesaEntidadeConfig.Fail("A mesa padrão não aceita configurações personalizadas.");

        if (!await _mesaRepository.IsOwnerAsync(dto.Idmesa, dto.Idusuario))
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

    public async Task<ResultMesaEntidadeConfig> DeleteAsync(int idMesa, MesaEntidadeTipo tipoEntidade, string idEntidade, int idUsuario)
    {
        if (await _mesaRepository.GetByIdAsync(idMesa) is null)
            return ResultMesaEntidadeConfig.Fail("Mesa não encontrada.");

        if ((await _mesaRepository.GetByCodigoSistemaAsync(SystemMesaConstants.CodigoMesaPadrao))?.Idmesa == idMesa)
            return ResultMesaEntidadeConfig.Fail("A mesa padrão não aceita configurações personalizadas.");

        if (!await _mesaRepository.IsOwnerAsync(idMesa, idUsuario))
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

    private static MesaEntidadeConfigDto MapToDto(MesaEntidadeConfig configuracao) => new()
    {
        Idmesa = configuracao.Idmesa,
        TipoEntidade = configuracao.TipoEntidade,
        Identidade = configuracao.Identidade,
        ConfigJson = JsonDocument.Parse(configuracao.ConfigJson).RootElement.Clone(),
        DataCriacao = configuracao.DataCriacao,
        DataAtualizacao = configuracao.DataAtualizacao,
    };
}
