using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Services;

public class PersonagemVisibilidadeService : IPersonagemVisibilidadeService
{
    private readonly IPersonagemVisibilidadeRepository _repository;

    public PersonagemVisibilidadeService(IPersonagemVisibilidadeRepository repository) => _repository = repository;

    public async Task<ResultPersonagemVisibilidade> GetNpcAsync(int idPersonagem)
    {
        if (!await _repository.NpcExistsAsync(idPersonagem))
            return ResultPersonagemVisibilidade.NotFound(
                $"Personagem com id {idPersonagem} não encontrado.");

        PersonagemVisibilidade? configuracao = await _repository.GetByPersonagemIdAsync(idPersonagem);
        return ResultPersonagemVisibilidade.Ok(
            PersonagemVisibilidadeDefaults.FromEntity(configuracao, personagemJogador: false));
    }

    public async Task<ResultPersonagemVisibilidade> SaveNpcAsync(
        int idPersonagem,
        PersonagemVisibilidadeDto visibilidade)
    {
        if (!await _repository.NpcExistsAsync(idPersonagem))
            return ResultPersonagemVisibilidade.NotFound(
                $"Personagem com id {idPersonagem} não encontrado.");

        PersonagemVisibilidade? configuracao = await _repository.GetByPersonagemIdAsync(idPersonagem);
        if (configuracao is null)
        {
            configuracao = PersonagemVisibilidadeDefaults.CreateEntity(
                idPersonagem: idPersonagem,
                idPersonagemJogador: null,
                dto: visibilidade);
            await _repository.CreateAsync(configuracao);
        }
        else
        {
            PersonagemVisibilidadeDefaults.ApplyToEntity(configuracao, visibilidade);
            configuracao.DataAtualizacao = DateTime.UtcNow;
            await _repository.UpdateAsync(configuracao);
        }

        return ResultPersonagemVisibilidade.Ok(
            PersonagemVisibilidadeDefaults.FromEntity(configuracao, personagemJogador: false));
    }

    public async Task<ResultPersonagemVisibilidade> GetPersonagemJogadorAsync(
        int idPersonagemJogador,
        int idUsuarioSolicitante,
        bool isAdmin)
    {
        ResultPersonagemVisibilidade? acesso = await ValidarAcessoPersonagemJogadorAsync(
            idPersonagemJogador,
            idUsuarioSolicitante,
            isAdmin);
        if (acesso is not null)
            return acesso;

        PersonagemVisibilidade? configuracao = await _repository
            .GetByPersonagemJogadorIdAsync(idPersonagemJogador);
        return ResultPersonagemVisibilidade.Ok(
            PersonagemVisibilidadeDefaults.FromEntity(configuracao, personagemJogador: true));
    }

    public async Task<ResultPersonagemVisibilidade> SavePersonagemJogadorAsync(
        int idPersonagemJogador,
        PersonagemVisibilidadeDto visibilidade,
        int idUsuarioSolicitante,
        bool isAdmin)
    {
        ResultPersonagemVisibilidade? acesso = await ValidarAcessoPersonagemJogadorAsync(
            idPersonagemJogador,
            idUsuarioSolicitante,
            isAdmin);
        if (acesso is not null)
            return acesso;

        PersonagemVisibilidade? configuracao = await _repository
            .GetByPersonagemJogadorIdAsync(idPersonagemJogador);
        if (configuracao is null)
        {
            configuracao = PersonagemVisibilidadeDefaults.CreateEntity(
                idPersonagem: null,
                idPersonagemJogador: idPersonagemJogador,
                dto: visibilidade);
            await _repository.CreateAsync(configuracao);
        }
        else
        {
            PersonagemVisibilidadeDefaults.ApplyToEntity(configuracao, visibilidade);
            configuracao.DataAtualizacao = DateTime.UtcNow;
            await _repository.UpdateAsync(configuracao);
        }

        return ResultPersonagemVisibilidade.Ok(
            PersonagemVisibilidadeDefaults.FromEntity(configuracao, personagemJogador: true));
    }

    private async Task<ResultPersonagemVisibilidade?> ValidarAcessoPersonagemJogadorAsync(
        int idPersonagemJogador,
        int idUsuarioSolicitante,
        bool isAdmin)
    {
        int? idDono = await _repository.GetPersonagemJogadorOwnerIdAsync(idPersonagemJogador);
        if (!idDono.HasValue)
        {
            return ResultPersonagemVisibilidade.NotFound(
                $"PersonagemJogador com id {idPersonagemJogador} não encontrado.");
        }

        if (!isAdmin && idDono.Value != idUsuarioSolicitante)
            return ResultPersonagemVisibilidade.Forbidden(
                "Usuário sem permissão para alterar a visibilidade desta ficha.");

        return null;
    }
}
