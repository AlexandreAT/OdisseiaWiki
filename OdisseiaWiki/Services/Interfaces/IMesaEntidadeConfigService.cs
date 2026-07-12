using System.Text.Json;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;

namespace OdisseiaWiki.Services.Interfaces;

public interface IMesaEntidadeConfigService
{
    Task<ResultMesaEntidadeConfig> GetAsync(int idMesa, MesaEntidadeTipo tipoEntidade, string idEntidade);
    Task<ResultMesaEntidadeConfig> SaveAsync(MesaEntidadeConfigDto dto);
    Task<ResultMesaEntidadeConfig> DeleteAsync(int idMesa, MesaEntidadeTipo tipoEntidade, string idEntidade, int idUsuario);
    Task<T> ApplyOverrideAsync<T>(int? idMesa, MesaEntidadeTipo tipoEntidade, string idEntidade, T entidadeBase);
}
