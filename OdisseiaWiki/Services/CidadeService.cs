using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Interfaces;
using System.Text.Json;

namespace OdisseiaWiki.Services
{
    public class CidadeService : ICidadeService
    {
        private readonly ICidadeRepository _repository;

        public CidadeService(ICidadeRepository repository)
        {
            _repository = repository;
        }

        public async Task<ResultCidade> CreateAsync(CidadeDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Nome))
                return ResultCidade.Fail("O nome é obrigatório.");

            if (string.IsNullOrWhiteSpace(dto.Imagem))
                return ResultCidade.Fail("A imagem padrão é obrigatória.");

            Cidade? cidade = new Cidade
            {
                Nome = dto.Nome,
                Descricao = dto.Descricao,
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

            Cidade? criada = await _repository.CreateAsync(cidade);
            return ResultCidade.Ok(criada);
        }

        public async Task<ResultCidade> UpdateAsync(int id, CidadeDto dto)
        {
            Cidade? cidade = await _repository.GetByIdAsync(id);
            if (cidade == null)
                return ResultCidade.Fail($"Cidade com id {id} não encontrada.");

            cidade.Nome = dto.Nome ?? cidade.Nome;
            cidade.Descricao = dto.Descricao ?? cidade.Descricao;
            cidade.Imagem = dto.Imagem ?? cidade.Imagem;
            cidade.GaleriaImagem = dto.GaleriaImagem != null && dto.GaleriaImagem.Any()
                ? JsonSerializer.Serialize(dto.GaleriaImagem)
                : cidade.GaleriaImagem;
            cidade.Tags = dto.Tags != null && dto.Tags.Any()
                ? JsonSerializer.Serialize(dto.Tags)
                : cidade.Tags;
            cidade.Visivel = dto.Visivel;

            Cidade? atualizada = await _repository.UpdateAsync(cidade);
            return ResultCidade.Ok(atualizada);
        }

        public async Task<ResultCidade> GetAllAsync(bool? visivel = null)
        {
            List<Cidade>? cidades = await _repository.GetAllAsync(visivel);

            List<CidadeDto>? dtos = cidades.Select(c => new CidadeDto
            {
                Idcidade = c.Idcidade,
                Nome = c.Nome,
                Descricao = c.Descricao,
                Imagem = c.Imagem,
                GaleriaImagem = !string.IsNullOrWhiteSpace(c.GaleriaImagem)
                    ? JsonSerializer.Deserialize<List<string>>(c.GaleriaImagem)
                    : null,
                Tags = !string.IsNullOrWhiteSpace(c.Tags)
                    ? JsonSerializer.Deserialize<List<string>>(c.Tags)
                    : null,
                Visivel = c.Visivel
            }).ToList();

            return ResultCidade.Ok(dtos);
        }

        public async Task<Cidade?> GetByIdAsync(int id)
            => await _repository.GetByIdAsync(id);

        public async Task<bool> DeleteAsync(int id)
            => await _repository.DeleteAsync(id);
    }
}
