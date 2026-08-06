using System.Text.Json;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;

namespace OdisseiaWiki.Services.Interfaces;

public interface IMesaEntidadeConfigService
{
    Task<ResultMesaEntidadeConfig> GetAsync(int idMesa, MesaEntidadeTipo tipoEntidade, string idEntidade);
    Task<ResultMesaEntidadeConfig> SaveAsync(MesaEntidadeConfigDto dto, bool isAdmin = false);
    Task<ResultMesaEntidadeConfig> DeleteAsync(int idMesa, MesaEntidadeTipo tipoEntidade, string idEntidade, int idUsuario, bool isAdmin = false);
    Task<T> ApplyOverrideAsync<T>(int? idMesa, MesaEntidadeTipo tipoEntidade, string idEntidade, T entidadeBase);
    Task<IReadOnlyDictionary<string, T>> ApplyOverridesAsync<T>(
        int? idMesa,
        MesaEntidadeTipo tipoEntidade,
        IReadOnlyDictionary<string, T> entidadesBase);
}
