using Microsoft.AspNetCore.Identity;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Helpers;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Helpers;
using OdisseiaWiki.Services.Interfaces;
using System.Text.Json;

namespace OdisseiaWiki.Services
{
    public class PersonagemService : IPersonagemService
    {
        private readonly IPersonagemRepository _repository;
        private readonly IAssetService _assetService;

        public PersonagemService(IPersonagemRepository repository, IAssetService assetService)
        {
            _repository = repository;
            _assetService = assetService;
        }

        public async Task<ResultPersonagem> CreateAsync(PersonagemDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Nome))
                return ResultPersonagem.Fail("Nome é obrigatório.");

            if (dto.StatusJson?.status != null)
            {
                if (dto.StatusJson.status.vidaMaxima == 0)
                    dto.StatusJson.status.vidaMaxima = dto.StatusJson.status.vida;
                
                if (dto.StatusJson.status.estaminaMaxima == 0)
                    dto.StatusJson.status.estaminaMaxima = dto.StatusJson.status.estamina;
                
                if (dto.StatusJson.status.manaMaxima == 0)
                    dto.StatusJson.status.manaMaxima = dto.StatusJson.status.mana;
            }

            var personagem = new Personagen
            {
                Nome = dto.Nome,
                Idraca = dto.Idraca,
                Idcidade = dto.Idcidade,
                Historia = RichTextHelper.SerializeRichText(dto.Historia),
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
                Tags = JsonSerializer.Serialize(ContentCategoryHelper.EnsureCategoryTag(dto.Tags, ContentCategoryHelper.Personagem)),
                Visivel = dto.Visivel,
                Destaque = dto.Destaque,
                Implantes = dto.Implantes != null ? JsonSerializer.Serialize(dto.Implantes) : null,
                Idpassiva = dto.Idpassiva,
                Ultimate = dto.Ultimate != null ? JsonSerializer.Serialize(dto.Ultimate) : null,
                DataCriacao = DateTime.UtcNow
            };

            var criado = await _repository.CreateAsync(personagem);
            return ResultPersonagem.Ok(criado);
        }

        public async Task<List<Personagen>> GetAllAsync(bool? visivel = null)
            => await _repository.GetAllAsync(visivel);

        public async Task<Personagen?> GetByIdAsync(int id)
            => await _repository.GetByIdAsync(id);

        public async Task<ResultPersonagem> UpdateAsync(int id, PersonagemDto dto)
        {
            var personagem = await _repository.GetByIdAsync(id);
            if (personagem == null)
                return ResultPersonagem.Fail($"Personagem com id {id} não encontrado.");

            HashSet<string> oldAssets = ExtractAssets(personagem);

            personagem.Nome = dto.Nome ?? personagem.Nome;
            personagem.Idraca = dto.Idraca;
            personagem.Idcidade = dto.Idcidade;
            personagem.Historia = dto.Historia.HasValue 
                ? RichTextHelper.SerializeRichText(dto.Historia) 
                : personagem.Historia;
            personagem.StatusJson = dto.StatusJson != null ? JsonSerializer.Serialize(dto.StatusJson) : personagem.StatusJson;
            personagem.Imagem = dto.Imagem ?? personagem.Imagem;
            personagem.GaleriaImagem = dto.GaleriaImagem != null
                ? JsonSerializer.Serialize(dto.GaleriaImagem)
                : personagem.GaleriaImagem;
            personagem.InventarioJson = dto.InventarioJson != null ? JsonSerializer.Serialize(dto.InventarioJson) : personagem.InventarioJson;
            personagem.Skills = dto.Skills != null ? JsonSerializer.Serialize(dto.Skills) : personagem.Skills;
            personagem.Magia = dto.Magia != null ? JsonSerializer.Serialize(dto.Magia) : personagem.Magia;
            personagem.PersonagemsVinculados = dto.PersonagemsVinculados != null ? JsonSerializer.Serialize(dto.PersonagemsVinculados) : personagem.PersonagemsVinculados;
            personagem.Costumes = dto.Costumes != null ? JsonSerializer.Serialize(dto.Costumes) : personagem.Costumes;
            personagem.Alinhamento = dto.Alinhamento ?? personagem.Alinhamento;
            personagem.Tracos = dto.Tracos != null ? JsonSerializer.Serialize(dto.Tracos) : personagem.Tracos;
            personagem.Nanites = dto.Nanites?.ToString() ?? personagem.Nanites;
            personagem.Tags = JsonSerializer.Serialize(ContentCategoryHelper.EnsureCategoryTag(
                dto.Tags ?? JsonSafeHelper.DeserializeTags(personagem.Tags),
                ContentCategoryHelper.Personagem));
            personagem.Implantes = dto.Implantes != null ? JsonSerializer.Serialize(dto.Implantes) : personagem.Implantes;
            personagem.Idpassiva = dto.Idpassiva ?? personagem.Idpassiva;
            personagem.Visivel = dto.Visivel;
            personagem.Destaque = dto.Destaque;

            var atualizado = await _repository.UpdateAsync(personagem);
            await AssetReferenceHelper.DeleteRemovedAsync(
                _assetService,
                oldAssets,
                ExtractAssets(atualizado));
            return ResultPersonagem.Ok(atualizado);
        }

        public async Task<List<Personagen>> GetBatchAsync(List<int> ids)
        {
            return await _repository.GetBatchAsync(ids);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            Personagen? personagem = await _repository.GetByIdAsync(id);
            if (personagem is null)
                return false;

            HashSet<string> assets = ExtractAssets(personagem);
            bool deleted = await _repository.DeleteAsync(id);
            if (deleted)
                await AssetReferenceHelper.DeleteAllAsync(_assetService, assets);
            return deleted;
        }

        private static HashSet<string> ExtractAssets(Personagen personagem)
            => AssetReferenceHelper.Extract(
                personagem.Imagem,
                personagem.GaleriaImagem,
                personagem.InventarioJson,
                personagem.Skills,
                personagem.Magia,
                personagem.Historia,
                personagem.Implantes,
                personagem.Ultimate);
    }
}
