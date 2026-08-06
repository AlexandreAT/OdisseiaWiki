using OdisseiaWiki.Models;
using OdisseiaWiki.Enums;

namespace OdisseiaWiki.Repositories.Interfaces;

public interface ISistemaRpgRepository
{
    Task<List<SistemaRpg>> GetAllAsync(bool includeInactive = false);
    Task<SistemaRpg?> GetByIdAsync(int id, bool tracked = false);
    Task<SistemaRpg?> GetByCodeAsync(string code, bool tracked = false);
    Task<List<SistemaVersao>> GetVersionsAsync(int idSistemaRpg);
    Task<SistemaVersao?> GetVersionAsync(int idSistemaVersao, bool includeConfiguration = false, bool tracked = false);
    Task<SistemaVersao?> GetVersionByNumberAsync(int idSistemaRpg, string numeroVersao, bool tracked = false);
    Task<bool> SystemCodeExistsAsync(string code, int? exceptId = null);
    Task<bool> VersionNumberExistsAsync(int idSistemaRpg, string numeroVersao, int? exceptId = null);
    Task<int> CountMesasBySystemAsync(int idSistemaRpg);
    Task<int> CountMesasByVersionAsync(int idSistemaVersao);
    Task<bool> HasDerivedVersionsAsync(int idSistemaVersao);
    Task<Mesa?> GetMesaAsync(int idMesa, bool tracked = false);
    Task<PersonagemJogador?> GetPlayerCharacterAsync(int idPersonagemJogador, bool tracked = false);
    Task<Mesa?> GetMesaForMigrationPreviewAsync(int idMesa);
    Task<SistemaPatchNote?> GetPatchNoteByVersionAsync(int idSistemaVersao);
    Task<List<Mesa>> GetMesasWithoutVersionAsync();
    Task SynchronizeDefaultMesaVersionAsync(int idSistemaVersao);
    Task<List<Raca>> GetRacesAsync();
    Task<List<Passiva>> GetPassivasAsync();
    Task<SistemaEntidadeGlobalVinculoSnapshot?> GetGlobalEntityBindingAsync(
        SistemaEntidadeGlobalTipo tipoEntidade,
        string idEntidade);
    Task<Raca?> GetRaceRuntimeAsync(int idRaca);
    Task<MesaEntidadeConfig?> GetMesaEntityConfigAsync(
        int idMesa,
        MesaEntidadeTipo tipoEntidade,
        string idEntidade);
    Task AddSystemAsync(SistemaRpg sistema);
    Task AddVersionAsync(SistemaVersao versao);
    Task AddPatchNoteAsync(SistemaPatchNote patchNote);
    void RemoveSystem(SistemaRpg sistema);
    void RemoveVersion(SistemaVersao versao);
    void RemoveRange(IEnumerable<object> entities);
    Task SaveChangesAsync();
    Task ExecuteInTransactionAsync(Func<Task> operation);
}
