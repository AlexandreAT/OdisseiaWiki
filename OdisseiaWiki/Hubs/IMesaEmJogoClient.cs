using OdisseiaWiki.Dtos;

namespace OdisseiaWiki.Hubs;

/// <summary>
/// Contrato dos eventos enviados aos clientes conectados à experiência da Mesa.
/// </summary>
public interface IMesaEmJogoClient
{
    Task PresencaAtualizada(MesaPresencaAtualizadaDto evento);
    Task MesaInvalidada(MesaInvalidadaDto evento);
    Task AcessoRevogado(MesaAcessoRevogadoDto evento);
}
