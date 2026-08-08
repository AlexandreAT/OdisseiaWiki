using OdisseiaWiki.Dtos;

namespace OdisseiaWiki.Services.Interfaces;

public interface IPersonagemComparacaoService
{
    Task<PersonagemComparacaoPesquisaResultadoDto> SearchAsync(
        PersonagemComparacaoOrigem origem,
        int? idPersonagemAtual,
        int? idMesa,
        string term,
        int? idUsuario,
        bool administrador);

    Task<PersonagemComparacaoPesquisaResultadoDto> GetAsync(
        PersonagemComparacaoOrigem origem,
        int id,
        int? idUsuario,
        bool administrador);
}
