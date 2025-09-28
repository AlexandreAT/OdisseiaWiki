using OdisseiaWiki.Dtos;

namespace OdisseiaWiki.Services.Interfaces
{
    public interface ICidadeService
    {
        Task<ResultCidade> GetAllAsync();
    }
}
