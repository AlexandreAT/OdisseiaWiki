using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Helpers;
using OdisseiaWiki.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace OdisseiaWiki.Services
{
    public class RacaService : IRacaService
    {
        private readonly IRacaRepository _repository;
        private readonly IMesaEntidadeConfigService _mesaEntidadeConfigService;
        private readonly IAssetService _assetService;

        public RacaService(
            IRacaRepository repository,
            IMesaEntidadeConfigService mesaEntidadeConfigService,
            IAssetService assetService)
        {
            _repository = repository;
            _mesaEntidadeConfigService = mesaEntidadeConfigService;
            _assetService = assetService;
        }

        public async Task<ResultRaca> CreateAsync(RacaDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Nome))
                return ResultRaca.Fail("O nome é obrigatório.");

            var raca = new Raca
            {
                Nome = dto.Nome,
                StatusJson = dto.StatusJson != null 
                    ? JsonSerializer.Serialize(dto.StatusJson) 
                    : null,
                Imagem = dto.Imagem,
                GaleriaImagem = dto.GaleriaImagem != null && dto.GaleriaImagem.Any()
                    ? JsonSerializer.Serialize(dto.GaleriaImagem)
                    : null,
                Tags = JsonSerializer.Serialize(ContentCategoryHelper.EnsureCategoryTag(dto.Tags, ContentCategoryHelper.Raca)),
                Visivel = dto.Visivel,
                Destaque = dto.Destaque,
                DataCriacao = DateTime.UtcNow
            };

            var criada = await _repository.CreateAsync(raca);
            return ResultRaca.Ok(MapToDto(criada));
        }

        public async Task<ResultRaca> UpdateAsync(int id, RacaDto dto)
        {
            var raca = await _repository.GetByIdAsync(id);
            if (raca == null)
                return ResultRaca.Fail($"Raça com id {id} não encontrada.");

            HashSet<string> oldAssets = AssetReferenceHelper.Extract(raca.Imagem, raca.GaleriaImagem);

            raca.Nome = dto.Nome ?? raca.Nome;
            raca.StatusJson = dto.StatusJson != null
                ? JsonSerializer.Serialize(dto.StatusJson)
                : raca.StatusJson;
            raca.Imagem = dto.Imagem ?? raca.Imagem;
            if (dto.GaleriaImagem is not null)
            {
                raca.GaleriaImagem = dto.GaleriaImagem.Count > 0
                    ? JsonSerializer.Serialize(dto.GaleriaImagem)
                    : null;
            }
            raca.Tags = JsonSerializer.Serialize(ContentCategoryHelper.EnsureCategoryTag(
                dto.Tags ?? JsonSafeHelper.DeserializeTags(raca.Tags),
                ContentCategoryHelper.Raca));
            raca.Visivel = dto.Visivel;
            raca.Destaque = dto.Destaque;

            var atualizada = await _repository.UpdateAsync(raca);
            await AssetReferenceHelper.DeleteRemovedAsync(
                _assetService,
                oldAssets,
                AssetReferenceHelper.Extract(atualizada.Imagem, atualizada.GaleriaImagem));
            return ResultRaca.Ok(MapToDto(atualizada));
        }

        public async Task<ResultRaca> GetAllAsync(bool? visivel = null, int? idMesa = null)
        {
            var racas = await _repository.GetAllAsync(visivel);

            var dtos = await Task.WhenAll(racas.Select(raca => MapToDtoAsync(raca, idMesa)));

            return ResultRaca.Ok(dtos.ToList());
        }

        public async Task<RacaDto?> GetByIdAsync(int id, int? idMesa = null)
        {
            var raca = await _repository.GetByIdAsync(id);
            return raca != null ? await MapToDtoAsync(raca, idMesa) : null;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            Raca? raca = await _repository.GetByIdAsync(id);
            if (raca is null)
                return false;

            HashSet<string> assets = AssetReferenceHelper.Extract(raca.Imagem, raca.GaleriaImagem);
            bool deleted = await _repository.DeleteAsync(id);
            if (deleted)
                await AssetReferenceHelper.DeleteAllAsync(_assetService, assets);
            return deleted;
        }

        private static RacaDto MapToDto(Raca raca) => new()
        {
            Idraca = raca.Idraca,
            Nome = raca.Nome,
            StatusJson = !string.IsNullOrWhiteSpace(raca.StatusJson)
                ? JsonSerializer.Deserialize<RacaStatusDto>(raca.StatusJson)
                : null,
            Imagem = raca.Imagem,
            GaleriaImagem = !string.IsNullOrWhiteSpace(raca.GaleriaImagem)
                ? JsonSerializer.Deserialize<List<string>>(raca.GaleriaImagem)
                : null,
            Tags = !string.IsNullOrWhiteSpace(raca.Tags)
                ? JsonSerializer.Deserialize<List<string>>(raca.Tags)
                : null,
            Visivel = raca.Visivel,
            Destaque = raca.Destaque,
            DataCriacao = raca.DataCriacao
        };

        private Task<RacaDto> MapToDtoAsync(Raca raca, int? idMesa)
            => _mesaEntidadeConfigService.ApplyOverrideAsync(
                idMesa,
                Enums.MesaEntidadeTipo.Raca,
                raca.Idraca.ToString(),
                MapToDto(raca));

        public async Task<List<RacaDto>> GetBatchAsync(List<int> ids)
        {
            List<Raca> racas = await _repository.GetBatchAsync(ids);

            return racas
                .Select(MapToDto)
                .ToList();
        }
    }
}
