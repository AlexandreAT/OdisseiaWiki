using OdisseiaWiki.Dtos;

namespace OdisseiaWiki.Services.Interfaces;

public interface IMesaPersonagemService
{
    Task<MesaOperacaoResultado<MesaPersonagensGerenciamentoDto>> GetManagementAsync(
        int idMesa,
        int idUsuario,
        bool admin);

    Task<MesaOperacaoResultado<MesaAoVivoSnapshotDto>> GetLiveAsync(
        int idMesa,
        int idUsuario,
        bool admin);

    Task<MesaOperacaoResultado<IReadOnlyCollection<MesaNpcCatalogoDto>>> SearchNpcCatalogAsync(
        int idMesa, int idUsuario, bool admin, string? term);
    Task<MesaOperacaoResultado<MesaPersonagemResumoDto>> AddNpcInstanceAsync(
        int idMesa, int idUsuario, bool admin, MesaNpcAdicionarDto dto);
    Task<MesaOperacaoResultado<bool>> SetNpcVisibilityAsync(
        int idMesa, int idPersonagemJogador, int idUsuario, bool admin, bool visivel);
    Task<MesaOperacaoResultado<bool>> RemoveNpcInstanceAsync(
        int idMesa, int idPersonagemJogador, int idUsuario, bool admin);
    Task<MesaOperacaoResultado<bool>> PublishNpcInstanceAsync(
        int idMesa, int idPersonagemJogador, int idUsuario, bool admin);
}
