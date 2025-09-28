using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Interfaces;
using System.Text.Json;

namespace OdisseiaWiki.Services
{
    public class PersonagemService : IPersonagemService
    {
        private readonly IPersonagemRepository _repository;

        public PersonagemService(IPersonagemRepository repository)
        {
            _repository = repository;
        }

        public async Task<ResultPersonagem> CreateAsync(PersonagemDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Nome))
                return ResultPersonagem.Fail("Nome é obrigatório.");

            var personagem = new Personagen
            {
                Nome = dto.Nome,
                Idraca = dto.Idraca,
                Idcidade = dto.Idcidade,
                Historia = dto.Historia,
                StatusJson = JsonSerializer.Serialize(dto.StatusJson),
                Imagem = dto.Imagem,
                GaleriaImagem = dto.GaleriaImagem != null ? JsonSerializer.Serialize(dto.GaleriaImagem) : null,
                InventarioJson = dto.InventarioJson != null ? JsonSerializer.Serialize(dto.InventarioJson) : null,
                Skills = dto.Skills != null ? JsonSerializer.Serialize(dto.Skills) : null,
                Magia = dto.Magia != null ? JsonSerializer.Serialize(dto.Magia) : null,
                PersonagemsVinculados = dto.PersonagemsVinculados != null ? JsonSerializer.Serialize(dto.PersonagemsVinculados) : null,
                Costumes = dto.Costumes != null ? JsonSerializer.Serialize(dto.Costumes) : null,
                Alinhamento = dto.Alinhamento,
                Tracos = dto.Tracos != null ? JsonSerializer.Serialize(dto.Tracos) : null,
                Nanites = dto.Nanites?.ToString(),
                DataCriacao = DateOnly.FromDateTime(DateTime.UtcNow)
            };

            var criado = await _repository.CreateAsync(personagem);
            return ResultPersonagem.Ok(criado);
        }

        public async Task<List<Personagen>> GetAllAsync()
            => await _repository.GetAllAsync();

        public async Task<Personagen?> GetByIdAsync(int id)
            => await _repository.GetByIdAsync(id);

        public async Task<ResultPersonagem> UpdateAsync(int id, PersonagemDto dto)
        {
            var personagem = await _repository.GetByIdAsync(id);
            if (personagem == null)
                return ResultPersonagem.Fail($"Personagem com id {id} não encontrado.");

            personagem.Nome = dto.Nome ?? personagem.Nome;
            personagem.Idraca = dto.Idraca;
            personagem.Idcidade = dto.Idcidade;
            personagem.Historia = dto.Historia ?? personagem.Historia;
            personagem.StatusJson = dto.StatusJson != null ? JsonSerializer.Serialize(dto.StatusJson) : personagem.StatusJson;
            personagem.Imagem = dto.Imagem ?? personagem.Imagem;
            personagem.GaleriaImagem = dto.GaleriaImagem != null ? JsonSerializer.Serialize(dto.GaleriaImagem) : personagem.GaleriaImagem;
            personagem.InventarioJson = dto.InventarioJson != null ? JsonSerializer.Serialize(dto.InventarioJson) : personagem.InventarioJson;
            personagem.Skills = dto.Skills != null ? JsonSerializer.Serialize(dto.Skills) : personagem.Skills;
            personagem.Magia = dto.Magia != null ? JsonSerializer.Serialize(dto.Magia) : personagem.Magia;
            personagem.PersonagemsVinculados = dto.PersonagemsVinculados != null ? JsonSerializer.Serialize(dto.PersonagemsVinculados) : personagem.PersonagemsVinculados;
            personagem.Costumes = dto.Costumes != null ? JsonSerializer.Serialize(dto.Costumes) : personagem.Costumes;
            personagem.Alinhamento = dto.Alinhamento ?? personagem.Alinhamento;
            personagem.Tracos = dto.Tracos != null ? string.Join(",", dto.Tracos) : personagem.Tracos;
            personagem.Nanites = dto.Nanites?.ToString() ?? personagem.Nanites;

            var atualizado = await _repository.UpdateAsync(personagem);
            return ResultPersonagem.Ok(atualizado);
        }

        public async Task<bool> DeleteAsync(int id)
            => await _repository.DeleteAsync(id);
    }
}
