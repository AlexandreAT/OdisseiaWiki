using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;

namespace OdisseiaWiki.Services.Interfaces
{
    public interface IMesaService
    {
        Task<ResultMesa> CreateAsync(MesaDto dto);
        Task<MesaOperacaoResultado<MesaResumoDto>> CreateSocialAsync(
            int idUsuario,
            MesaCriarDto dto);
        Task<List<Mesa>> GetAllAsync();
        Task<Mesa?> GetByIdAsync(int id);
        Task<List<Mesa>> GetAccessibleAsync(int idUsuario);
        Task<bool> IsOwnerAsync(int idMesa, int idUsuario);
        Task<bool> CanUseAsync(int idMesa, int idUsuario);
        Task<bool> CanAccessLiveAsync(int idMesa, int idUsuario);
        Task<Mesa> ObterMesaPadraoAsync();
        Task<ResultMesa> UpdateAsync(int id, MesaDto dto);
        Task<MesaOperacaoResultado<MesaResumoDto>> UpdateSocialAsync(
            int idMesa,
            int idUsuario,
            bool admin,
            MesaAtualizarDto dto);
        Task<MesaOperacaoResultado<MesaResumoDto>> UpdateLiveStatusAsync(
            int idMesa,
            int idUsuario,
            bool aoVivo);
        Task<MesaHubDto> GetHubAsync(
            int idUsuario,
            int paginaCriadas,
            int paginaParticipando);
        Task<PaginacaoResultadoDto<MesaResumoDto>> SearchAsync(
            string? termo,
            int? idSistemaRpg,
            bool somenteComVagas,
            int pagina,
            int tamanhoPagina,
            int? idUsuario);
        Task<MesaOperacaoResultado<MesaResumoDto>> GetPublicPageAsync(
            int idMesa,
            int? idUsuario);
        Task<MesaOperacaoResultado<bool>> RequestEntryAsync(
            int idMesa,
            int idUsuario,
            MesaSolicitacaoCriarDto dto);
        Task<MesaOperacaoResultado<IReadOnlyCollection<MesaSolicitacaoDto>>> GetRequestsAsync(
            int idMesa,
            int idUsuario,
            bool admin);
        Task<MesaOperacaoResultado<bool>> AcceptRequestAsync(
            int idMesa,
            int idSolicitacao,
            int idUsuario,
            bool admin);
        Task<MesaOperacaoResultado<bool>> RefuseRequestAsync(
            int idMesa,
            int idSolicitacao,
            int idUsuario,
            bool admin);
        Task<MesaOperacaoResultado<IReadOnlyCollection<MesaJogadorDto>>> GetMembersAsync(
            int idMesa,
            int idUsuario,
            bool admin);
        Task<MesaOperacaoResultado<bool>> ExpelMemberAsync(
            int idMesa,
            int idUsuarioAlvo,
            int idUsuarioMestre,
            bool admin,
            MesaExpulsarDto dto);
        Task<IReadOnlyCollection<MesaExpulsaoDto>> GetExpulsionRecordsAsync(int idUsuario);
        Task<bool> DeleteAsync(int id);
    }
}
