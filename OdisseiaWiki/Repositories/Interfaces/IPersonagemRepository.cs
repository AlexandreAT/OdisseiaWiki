using OdisseiaWiki.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace OdisseiaWiki.Repositories.Interfaces
{
    public interface IPersonagemRepository
    {
        Task<List<Personagen>> GetAllAsync(bool? visivel = null, int? idWikiEscopo = null);
        Task<Personagen?> GetByIdAsync(int id);
        Task<Personagen?> GetByIdAsync(int id, int? idWikiEscopo);
        Task<List<ProficienciaResumoView>> GetProficienciasByPersonagemIdAsync(int id);
        Task<Personagen> CreateAsync(Personagen personagem);
        Task<Personagen> UpdateAsync(Personagen personagem);
        Task<bool> DeleteAsync(int id);
        Task<List<Personagen>> SearchAsync(string termo, int? idWikiEscopo = null);
        Task<List<Personagen>> GetBatchAsync(List<int> ids, int? idWikiEscopo = null);
        Task<List<PersonagemComparacaoRegistro>> SearchVisibleForComparisonAsync(
            string term,
            int? excludedId,
            int limit);
        Task<List<PersonagemComparacaoRegistro>> SearchAllOfficialForComparisonAsync(
            string term,
            int? excludedId,
            int limit);
        Task<PersonagemComparacaoRegistro?> GetForComparisonAsync(int id, bool requireVisible);
    }
}
