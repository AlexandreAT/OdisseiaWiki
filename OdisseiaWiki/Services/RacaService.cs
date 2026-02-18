using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
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

        public RacaService(IRacaRepository repository)
        {
            _repository = repository;
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
                Tags = dto.Tags != null && dto.Tags.Any()
                    ? JsonSerializer.Serialize(dto.Tags)
                    : null,
                Visivel = dto.Visivel,
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

            raca.Nome = dto.Nome ?? raca.Nome;
            raca.StatusJson = dto.StatusJson != null
                ? JsonSerializer.Serialize(dto.StatusJson)
                : raca.StatusJson;
            raca.Imagem = dto.Imagem ?? raca.Imagem;
            raca.GaleriaImagem = dto.GaleriaImagem != null && dto.GaleriaImagem.Any()
                ? JsonSerializer.Serialize(dto.GaleriaImagem)
                : raca.GaleriaImagem;
            raca.Tags = dto.Tags != null && dto.Tags.Any()
                ? JsonSerializer.Serialize(dto.Tags)
                : raca.Tags;
            raca.Visivel = dto.Visivel;

            var atualizada = await _repository.UpdateAsync(raca);
            return ResultRaca.Ok(MapToDto(atualizada));
        }

        public async Task<ResultRaca> GetAllAsync(bool? visivel = null)
        {
            var racas = await _repository.GetAllAsync(visivel);

            var dtos = racas.Select(MapToDto).ToList();

            return ResultRaca.Ok(dtos);
        }

        public async Task<RacaDto?> GetByIdAsync(int id)
        {
            var raca = await _repository.GetByIdAsync(id);
            return raca != null ? MapToDto(raca) : null;
        }

        public async Task<bool> DeleteAsync(int id)
            => await _repository.DeleteAsync(id);

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
            DataCriacao = raca.DataCriacao
        };
    }
}
