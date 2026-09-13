using OdisseiaWiki.Models;

namespace OdisseiaWiki.Repositories.Interfaces
{
    public interface IMesaRepository
    {
        Task<List<Mesa>> GetAllAsync();
        Task<Mesa?> GetByIdAsync(int id);
        Task<Mesa?> GetDetailedByIdAsync(int id);
        Task<Mesa?> GetByCodigoSistemaAsync(string codigoSistema);
        Task<Mesa> EnsureSystemDefaultAsync(
            string codigoSistema,
            string nome,
            int? idSistemaVersao);
        Task<bool> IsOwnerAsync(int idMesa, int idUsuario);
        Task<bool> UsuarioPodeUsarMesaAsync(int idMesa, int idUsuario);
        Task<bool> UsuarioPodeAcessarMesaSocialAsync(int idMesa, int idUsuario);
        Task<List<Mesa>> GetAccessibleByUsuarioIdAsync(int usuarioId);
        Task<List<Mesa>> GetByUsuarioIdAsync(int usuarioId);
        Task<(List<Mesa> Itens, int Total)> GetOwnedPageAsync(
            int usuarioId,
            int pagina,
            int tamanhoPagina);
        Task<(List<Mesa> Itens, int Total)> GetParticipatingPageAsync(
            int usuarioId,
            int pagina,
            int tamanhoPagina);
        Task<(List<Mesa> Itens, int Total)> SearchPageAsync(
            string? termo,
            int? idSistemaRpg,
            bool somenteComVagas,
            int pagina,
            int tamanhoPagina);
        Task<SistemaVersao?> GetSelectableVersionAsync(int idSistemaVersao);
        Task<int> CountMembersAsync(int idMesa);
        Task<List<Mesausuario>> GetMembersAsync(int idMesa);
        Task<IReadOnlyDictionary<int, int>> GetMemberCharacterCountsAsync(int idMesa);
        Task<HashSet<int>> GetParticipantUserIdsAsync(int idMesa);
        Task<List<MesaSolicitacaoEntrada>> GetRequestsAsync(int idMesa);
        Task<MesaSolicitacaoEntrada?> GetUserRequestAsync(int idMesa, int idUsuario);
        Task<MesaParticipacaoPersistenciaResultado> CreateRequestAsync(
            int idMesa,
            int idUsuario,
            string? mensagem);
        Task<MesaParticipacaoPersistenciaResultado> AcceptRequestAsync(
            int idMesa,
            int idSolicitacao,
            int idMestre);
        Task<MesaParticipacaoPersistenciaResultado> RefuseRequestAsync(
            int idMesa,
            int idSolicitacao,
            int idMestre);
        Task<MesaParticipacaoPersistenciaResultado> ExpelMemberAsync(
            int idMesa,
            int idUsuario,
            int idMestre,
            string motivo);
        Task<List<MesaExpulsaoRegistro>> GetExpulsionRecordsAsync(int idUsuario);
        Task<Mesa> CreateAsync(Mesa mesa);
        Task<Mesa> UpdateAsync(Mesa mesa);
        Task<bool> DeleteAsync(int id);
    }

    public enum MesaParticipacaoPersistenciaResultado
    {
        Sucesso,
        MesaNaoEncontrada,
        SolicitacaoNaoEncontrada,
        UsuarioNaoParticipa,
        MestreNaoAutorizado,
        MestreNaoPodeSolicitarOuSerExpulso,
        UsuarioJaParticipa,
        SolicitacaoDuplicada,
        MesaLotada,
        Conflito,
    }
}
