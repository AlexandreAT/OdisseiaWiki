using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Interfaces;
using System.Text.Json;

namespace OdisseiaWiki.Services
{
    public class PersonagemJogadorService : IPersonagemJogadorService
    {
        private readonly IPersonagemJogadorRepository _repository;

        public PersonagemJogadorService(IPersonagemJogadorRepository repository)
        {
            _repository = repository;
        }

        public async Task<ResultPersonagemJogador> CreateAsync(PersonagemJogadorDto personagemDto)
        {
            if (string.IsNullOrWhiteSpace(personagemDto.Nome))
                return ResultFail("O nome é obrigatório.");

            PersonagemJogador personagem = MapDtoToModel(personagemDto);

            personagem.Idcidade = personagem.Idcidade == 0 ? null : personagem.Idcidade;

            PersonagemJogador criado = await _repository.CreateAsync(personagem);
            return ResultOk(criado);
        }

        public async Task<ResultPersonagemJogador> UpdateAsync(int id, PersonagemJogadorDto personagemDto)
        {
            PersonagemJogador personagem = await _repository.GetByIdAsync(id);
            if (personagem == null)
                return ResultFail($"PersonagemJogador com id {id} não encontrado.");

            personagem = MapDtoToModel(personagemDto, personagem);

            personagem.Idcidade = personagem.Idcidade == 0 ? null : personagem.Idcidade;

            PersonagemJogador atualizado = await _repository.UpdateAsync(personagem);
            return ResultOk(atualizado);
        }

        public async Task<List<PersonagemJogador>> GetAllAsync() => await _repository.GetAllAsync();

        public async Task<List<PersonagemJogador>> GetByUsuarioIdAsync(int usuarioId) => await _repository.GetByUsuarioIdAsync(usuarioId);

        public async Task<PersonagemJogador?> GetByIdAsync(int id) => await _repository.GetByIdAsync(id);

        public async Task<bool> DeleteAsync(int id) => await _repository.DeleteAsync(id);

        private static PersonagemJogador MapDtoToModel(PersonagemJogadorDto personagemDto, PersonagemJogador? personagem = null)
        {
            personagem ??= new PersonagemJogador
            {
                DataCriacao = personagemDto.DataCriacao != default
                    ? personagemDto.DataCriacao
                    : DateTime.UtcNow
            };

            personagem.Nome = personagemDto.Nome ?? personagem.Nome;
            personagem.Idraca = personagemDto.Idraca;
            personagem.Idcidade = personagemDto.Idcidade;
            personagem.Idmesa = personagemDto.Idmesa;
            personagem.Idusuario = personagemDto.Idusuario;

            personagem.Alinhamento = personagemDto.Alinhamento ?? personagem.Alinhamento;
            personagem.Historia = personagemDto.Historia ?? personagem.Historia;
            personagem.Imagem = personagemDto.Imagem ?? personagem.Imagem;
            personagem.Nanites = personagemDto.Nanites?.ToString() ?? personagem.Nanites;
            personagem.InfoSecundariasJson = personagemDto.InfoSecundariasJson ?? personagem.InfoSecundariasJson;

            personagem.Costumes = personagemDto.Costumes != null ? JsonSerializer.Serialize(personagemDto.Costumes) : personagem.Costumes;
            personagem.Tracos = personagemDto.Tracos != null ? JsonSerializer.Serialize(personagemDto.Tracos) : personagem.Tracos;
            personagem.InventarioJson = personagemDto.InventarioJson != null ? JsonSerializer.Serialize(personagemDto.InventarioJson) : personagem.InventarioJson;
            personagem.Skills = personagemDto.Skills != null ? JsonSerializer.Serialize(personagemDto.Skills) : personagem.Skills;
            personagem.Magia = personagemDto.Magia != null ? JsonSerializer.Serialize(personagemDto.Magia) : personagem.Magia;
            personagem.StatusJson = personagemDto.StatusJson != null ? JsonSerializer.Serialize(personagemDto.StatusJson) : personagem.StatusJson;
            personagem.PersonagemsVinculados = personagemDto.PersonagemsVinculados != null ? JsonSerializer.Serialize(personagemDto.PersonagemsVinculados) : personagem.PersonagemsVinculados;

            return personagem;
        }

        private static ResultPersonagemJogador ResultFail(string mensagem) => new() { Sucesso = false, MensagemErro = mensagem };

        private static ResultPersonagemJogador ResultOk(PersonagemJogador personagem) => new() { Sucesso = true, Personagem = personagem };
    }
}