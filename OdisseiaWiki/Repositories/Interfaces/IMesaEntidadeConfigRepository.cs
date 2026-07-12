using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;

namespace OdisseiaWiki.Repositories.Interfaces;

public interface IMesaEntidadeConfigRepository
{
    Task<MesaEntidadeConfig?> GetAsync(int idMesa, MesaEntidadeTipo tipoEntidade, string idEntidade);
    Task<MesaEntidadeConfig> CreateAsync(MesaEntidadeConfig configuracao);
    Task<MesaEntidadeConfig> UpdateAsync(MesaEntidadeConfig configuracao);
    Task<bool> DeleteAsync(MesaEntidadeConfig configuracao);
    Task<bool> EntityExistsAsync(MesaEntidadeTipo tipoEntidade, string idEntidade);
}
