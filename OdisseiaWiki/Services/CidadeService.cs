using OdisseiaWiki.Dtos;
using OdisseiaWiki.Helpers;
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

            var cidade = new Cidade
            {
                Nome = dto.Nome,
                Descricao = RichTextHelper.SerializeRichText(dto.Descricao),
                Imagem = dto.Imagem,
                GaleriaImagem = dto.GaleriaImagem != null && dto.GaleriaImagem.Any()
                    ? JsonSerializer.Serialize(dto.GaleriaImagem)
                    : null,
                Tags = dto.Tags != null && dto.Tags.Any()
                    ? JsonSerializer.Serialize(dto.Tags)
                    : null,
                PontosDeInteresse = dto.PontosDeInteresse != null && dto.PontosDeInteresse.Any()
                    ? JsonSerializer.Serialize(dto.PontosDeInteresse)
                    : null,
                Visivel = dto.Visivel,
                DataCriacao = DateTime.UtcNow
            };

            var criada = await _repository.CreateAsync(cidade);
            return ResultCidade.Ok(criada);
        }

        public async Task<ResultCidade> UpdateAsync(int id, CidadeDto dto)
        {
            var cidade = await _repository.GetByIdAsync(id);
            if (cidade == null)
                return ResultCidade.Fail($"Cidade com id {id} não encontrada.");

            cidade.Nome = dto.Nome ?? cidade.Nome;
            cidade.Descricao = dto.Descricao.HasValue 
                ? RichTextHelper.SerializeRichText(dto.Descricao) 
                : cidade.Descricao;
            cidade.Imagem = dto.Imagem ?? cidade.Imagem;
            cidade.GaleriaImagem = dto.GaleriaImagem != null && dto.GaleriaImagem.Any()
                ? JsonSerializer.Serialize(dto.GaleriaImagem)
                : cidade.GaleriaImagem;
            cidade.Tags = dto.Tags != null && dto.Tags.Any()
                ? JsonSerializer.Serialize(dto.Tags)
                : cidade.Tags;
            cidade.PontosDeInteresse = dto.PontosDeInteresse != null && dto.PontosDeInteresse.Any()
                ? JsonSerializer.Serialize(dto.PontosDeInteresse)
                : cidade.PontosDeInteresse;
            cidade.Visivel = dto.Visivel;

            var atualizada = await _repository.UpdateAsync(cidade);
            return ResultCidade.Ok(atualizada);
        }

        public async Task<ResultCidade> GetAllAsync(bool? visivel = null)
        {
            var cidades = await _repository.GetAllAsync(visivel);

            var dtos = cidades.Select(c => new CidadeDto
            {
                Idcidade = c.Idcidade,
                Nome = c.Nome,
                Descricao = RichTextHelper.DeserializeRichText(c.Descricao),
                Imagem = c.Imagem,
                GaleriaImagem = !string.IsNullOrWhiteSpace(c.GaleriaImagem)
                    ? JsonSerializer.Deserialize<List<string>>(c.GaleriaImagem)
                    : null,
                Tags = !string.IsNullOrWhiteSpace(c.Tags)
                    ? JsonSerializer.Deserialize<List<string>>(c.Tags)
                    : null,
                PontosDeInteresse = !string.IsNullOrWhiteSpace(c.PontosDeInteresse)
                    ? JsonSerializer.Deserialize<List<PontoDeInteresseDto>>(c.PontosDeInteresse)
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
