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
}
