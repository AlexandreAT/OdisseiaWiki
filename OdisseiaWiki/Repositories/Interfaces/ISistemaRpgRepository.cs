using OdisseiaWiki.Models;

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
    Task<List<Mesa>> GetMesasWithoutVersionAsync();
    Task<List<Raca>> GetRacesAsync();
    Task<List<Passiva>> GetPassivasAsync();
    Task AddSystemAsync(SistemaRpg sistema);
    Task AddVersionAsync(SistemaVersao versao);
    void RemoveSystem(SistemaRpg sistema);
    void RemoveVersion(SistemaVersao versao);
    void RemoveRange(IEnumerable<object> entities);
    Task SaveChangesAsync();
    Task ExecuteInTransactionAsync(Func<Task> operation);
}
