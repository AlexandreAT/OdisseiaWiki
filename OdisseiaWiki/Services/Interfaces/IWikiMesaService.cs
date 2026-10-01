using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;

namespace OdisseiaWiki.Services.Interfaces;

public interface IWikiMesaService
{
    Task<WikiMesaOperacaoResultado<WikiMesaResumoDto>> GetResumoAsync(int idMesa, int idUsuario, bool admin);
    Task<WikiMesaOperacaoResultado<bool>> PodeGerenciarAsync(int idMesa, int idUsuario, bool admin);
    Task<WikiMesaOperacaoResultado<WikiMesaBuscaDto>> BuscarAsync(int idMesa, int idUsuario, bool admin, string termo);
    Task<WikiMesaOperacaoResultado<WikiGraphDto>> GetGraphAsync(
        int idMesa,
        int idUsuario,
        bool admin,
        bool incluirWikiGeral = false,
        CancellationToken cancellationToken = default);

    Task<WikiMesaOperacaoResultado<List<PageDto>>> GetPaginasAsync(int idMesa, int idUsuario, bool admin, bool somenteProprias, bool? visivel);
    Task<WikiMesaOperacaoResultado<PageDto>> GetPaginaPorIdAsync(int idMesa, int idUsuario, bool admin, int idPagina);
    Task<WikiMesaOperacaoResultado<PageDto>> GetPaginaPorSlugAsync(int idMesa, int idUsuario, bool admin, string slug);
    Task<WikiMesaOperacaoResultado<List<PageDto>>> GetPaginasReferenciandoAsync(int idMesa, int idUsuario, bool admin, string tipoEntidade, string idEntidade, bool? visivel);
    Task<WikiMesaOperacaoResultado<ResultPage>> CriarPaginaAsync(int idMesa, int idUsuario, bool admin, CreatePageWithBlocksDto dto);
    Task<WikiMesaOperacaoResultado<ResultPage>> AtualizarPaginaAsync(int idMesa, int idUsuario, bool admin, int idPagina, CreatePageWithBlocksDto dto);
    Task<WikiMesaOperacaoResultado<bool>> ExcluirPaginaAsync(int idMesa, int idUsuario, bool admin, int idPagina);

    Task<WikiMesaOperacaoResultado<List<CidadeDto>>> GetCidadesAsync(int idMesa, int idUsuario, bool admin, bool somenteProprias, bool? visivel);
    Task<WikiMesaOperacaoResultado<CidadeDto>> GetCidadeAsync(int idMesa, int idUsuario, bool admin, int idCidade);
    Task<WikiMesaOperacaoResultado<ResultCidade>> CriarCidadeAsync(int idMesa, int idUsuario, bool admin, CidadeDto dto);
    Task<WikiMesaOperacaoResultado<ResultCidade>> AtualizarCidadeAsync(int idMesa, int idUsuario, bool admin, int idCidade, CidadeDto dto);
    Task<WikiMesaOperacaoResultado<bool>> ExcluirCidadeAsync(int idMesa, int idUsuario, bool admin, int idCidade);

    Task<WikiMesaOperacaoResultado<List<RacaDto>>> GetRacasAsync(int idMesa, int idUsuario, bool admin, bool somenteProprias, bool? visivel);
    Task<WikiMesaOperacaoResultado<RacaDto>> GetRacaAsync(int idMesa, int idUsuario, bool admin, int idRaca);
    Task<WikiMesaOperacaoResultado<ResultRaca>> CriarRacaAsync(int idMesa, int idUsuario, bool admin, RacaDto dto);
    Task<WikiMesaOperacaoResultado<ResultRaca>> AtualizarRacaAsync(int idMesa, int idUsuario, bool admin, int idRaca, RacaDto dto);
    Task<WikiMesaOperacaoResultado<bool>> ExcluirRacaAsync(int idMesa, int idUsuario, bool admin, int idRaca);

    Task<WikiMesaOperacaoResultado<List<Personagen>>> GetPersonagensAsync(int idMesa, int idUsuario, bool admin, bool somenteProprios, bool? visivel);
    Task<WikiMesaOperacaoResultado<Personagen>> GetPersonagemAsync(int idMesa, int idUsuario, bool admin, int idPersonagem);
    Task<WikiMesaOperacaoResultado<ResultPersonagem>> CriarPersonagemAsync(int idMesa, int idUsuario, bool admin, PersonagemDto dto);
    Task<WikiMesaOperacaoResultado<ResultPersonagem>> AtualizarPersonagemAsync(int idMesa, int idUsuario, bool admin, int idPersonagem, PersonagemDto dto);
    Task<WikiMesaOperacaoResultado<bool>> ExcluirPersonagemAsync(int idMesa, int idUsuario, bool admin, int idPersonagem);

    Task<WikiMesaOperacaoResultado<List<ItemDto>>> GetItensAsync(int idMesa, int idUsuario, bool admin, bool somenteProprios, bool? visivel);
    Task<WikiMesaOperacaoResultado<ItemDto>> GetItemAsync(int idMesa, int idUsuario, bool admin, string idItem);
    Task<WikiMesaOperacaoResultado<ItemSaveResultDto>> CriarItemAsync(int idMesa, int idUsuario, bool admin, ItemCreateDto dto);
    Task<WikiMesaOperacaoResultado<ItemSaveResultDto>> AtualizarItemAsync(int idMesa, int idUsuario, bool admin, string idItem, ItemUpdateDto dto);
    Task<WikiMesaOperacaoResultado<bool>> ExcluirItemAsync(int idMesa, int idUsuario, bool admin, string idItem);
}
