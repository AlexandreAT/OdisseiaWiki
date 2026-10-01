using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace OdisseiaWiki.Services.Interfaces
{
    public interface IPersonagemService
    {
        Task<ResultPersonagem> CreateAsync(PersonagemDto dto, int? idWikiEscopo = null);
        Task<ResultPersonagem> UpdateAsync(int id, PersonagemDto dto, int? idWikiEscopo = null);
        Task<List<Personagen>> GetAllAsync(bool? visivel = null, int? idWikiEscopo = null);
        Task<Personagen?> GetByIdAsync(int id, int? idWikiEscopo = null);
        Task ProjectForPublicAsync(Personagen personagem);
        Task<bool?> AtualizarVisivelAsync(int id, bool visivel, int? idWikiEscopo = null);
        Task<bool> DeleteAsync(int id, int? idWikiEscopo = null);
        Task<List<Personagen>> GetBatchAsync(List<int> ids, int? idWikiEscopo = null);
    }
}
