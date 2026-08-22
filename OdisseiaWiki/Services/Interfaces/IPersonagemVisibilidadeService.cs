using OdisseiaWiki.Dtos;

namespace OdisseiaWiki.Services.Interfaces;

public interface IPersonagemVisibilidadeService
{
    Task<ResultPersonagemVisibilidade> GetNpcAsync(int idPersonagem);
    Task<ResultPersonagemVisibilidade> SaveNpcAsync(
        int idPersonagem,
        PersonagemVisibilidadeDto visibilidade);
    Task<ResultPersonagemVisibilidade> GetPersonagemJogadorAsync(
        int idPersonagemJogador,
        int idUsuarioSolicitante,
        bool isAdmin);
    Task<ResultPersonagemVisibilidade> SavePersonagemJogadorAsync(
        int idPersonagemJogador,
        PersonagemVisibilidadeDto visibilidade,
        int idUsuarioSolicitante,
        bool isAdmin);
}
