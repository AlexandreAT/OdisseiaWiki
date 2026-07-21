using OdisseiaWiki.Dtos;
using OdisseiaWiki.Helpers;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Helpers;
using OdisseiaWiki.Services.Interfaces;
using System.Text.Json;

namespace OdisseiaWiki.Services
{
    public class CidadeService : ICidadeService
    {
        private readonly ICidadeRepository _repository;
        private readonly IAssetService _assetService;

        public CidadeService(ICidadeRepository repository, IAssetService assetService)
        {
            _repository = repository;
            _assetService = assetService;
        }

        public async Task<ResultCidade> CreateAsync(CidadeDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Nome))
                return ResultCidade.Fail("O nome é obrigatório.");

            if (string.IsNullOrWhiteSpace(dto.Imagem))
                return ResultCidade.Fail("A imagem padrão é obrigatória.");

            if (!TryNormalizePontosDeInteresse(dto.PontosDeInteresse, out List<PontoDeInteresseDto>? pontos, out string? pontosError))
                return ResultCidade.Fail(pontosError!);

            var cidade = new Cidade
            {
                Nome = dto.Nome,
                Descricao = RichTextHelper.SerializeRichText(dto.Descricao),
                Imagem = dto.Imagem,
                GaleriaImagem = dto.GaleriaImagem != null && dto.GaleriaImagem.Any()
                    ? JsonSerializer.Serialize(dto.GaleriaImagem)
                    : null,
                Tags = JsonSerializer.Serialize(ContentCategoryHelper.EnsureCategoryTag(dto.Tags, ContentCategoryHelper.Cidade)),
                PontosDeInteresse = pontos != null && pontos.Count > 0
                    ? JsonSerializer.Serialize(pontos)
                    : null,
                Visivel = dto.Visivel,
                Destaque = dto.Destaque,
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

            HashSet<string> oldAssets = AssetReferenceHelper.Extract(
                cidade.Imagem, cidade.GaleriaImagem, cidade.PontosDeInteresse, cidade.Descricao);

            cidade.Nome = dto.Nome ?? cidade.Nome;
            cidade.Descricao = dto.Descricao.HasValue 
                ? RichTextHelper.SerializeRichText(dto.Descricao) 
                : cidade.Descricao;
            cidade.Imagem = dto.Imagem ?? cidade.Imagem;
            if (dto.GaleriaImagem is not null)
            {
                cidade.GaleriaImagem = dto.GaleriaImagem.Count > 0
                    ? JsonSerializer.Serialize(dto.GaleriaImagem)
                    : null;
            }
            cidade.Tags = JsonSerializer.Serialize(ContentCategoryHelper.EnsureCategoryTag(
                dto.Tags ?? JsonSafeHelper.DeserializeTags(cidade.Tags),
                ContentCategoryHelper.Cidade));
            if (dto.PontosDeInteresse is not null)
            {
                if (!TryNormalizePontosDeInteresse(dto.PontosDeInteresse, out List<PontoDeInteresseDto>? pontos, out string? pontosError))
                    return ResultCidade.Fail(pontosError!);

                cidade.PontosDeInteresse = pontos != null && pontos.Count > 0
                    ? JsonSerializer.Serialize(pontos)
                    : null;
            }
            cidade.Visivel = dto.Visivel;
            cidade.Destaque = dto.Destaque;

            var atualizada = await _repository.UpdateAsync(cidade);
            HashSet<string> currentAssets = AssetReferenceHelper.Extract(
                atualizada.Imagem, atualizada.GaleriaImagem, atualizada.PontosDeInteresse, atualizada.Descricao);
            await AssetReferenceHelper.DeleteRemovedAsync(_assetService, oldAssets, currentAssets);
            return ResultCidade.Ok(atualizada);
        }

        public async Task<ResultCidade> GetAllAsync(bool? visivel = null)
        {
            var cidades = await _repository.GetAllAsync(visivel);

            var dtos = cidades.Select(MapToDto).ToList();

            return ResultCidade.Ok(dtos);
        }

        public async Task<List<CidadeDto>> GetBatchAsync(List<int> ids)
        {
            List<Cidade> cidades = await _repository.GetBatchAsync(ids);

            return cidades.Select(MapToDto).ToList();
        }

        public async Task<CidadeDto?> GetByIdAsync(int id)
        {
            Cidade? cidade = await _repository.GetByIdAsync(id);
            return cidade is null ? null : MapToDto(cidade);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            Cidade? cidade = await _repository.GetByIdAsync(id);
            if (cidade is null)
                return false;

            HashSet<string> assets = AssetReferenceHelper.Extract(
                cidade.Imagem, cidade.GaleriaImagem, cidade.PontosDeInteresse, cidade.Descricao);
            bool deleted = await _repository.DeleteAsync(id);
            if (deleted)
                await AssetReferenceHelper.DeleteAllAsync(_assetService, assets);
            return deleted;
        }

        private static CidadeDto MapToDto(Cidade cidade)
        {
            return new CidadeDto
            {
                Idcidade = cidade.Idcidade,
                Nome = cidade.Nome,
                Descricao = RichTextHelper.DeserializeRichText(cidade.Descricao),
                Imagem = cidade.Imagem,
                GaleriaImagem = !string.IsNullOrWhiteSpace(cidade.GaleriaImagem)
                    ? JsonSerializer.Deserialize<List<ImagemGaleriaDto>>(cidade.GaleriaImagem)
                    : null,
                Tags = !string.IsNullOrWhiteSpace(cidade.Tags)
                    ? JsonSerializer.Deserialize<List<string>>(cidade.Tags)
                    : null,
                PontosDeInteresse = DeserializePontosDeInteresse(cidade.PontosDeInteresse),
                Visivel = cidade.Visivel,
                Destaque = cidade.Destaque,
                DataCriacao = cidade.DataCriacao
            };
        }

        private static List<PontoDeInteresseDto>? DeserializePontosDeInteresse(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
                return null;

            try
            {
                List<PontoDeInteresseDto>? stored = JsonSerializer.Deserialize<List<PontoDeInteresseDto>>(
                    json,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                return TryNormalizePontosDeInteresse(stored, out List<PontoDeInteresseDto>? normalized, out _)
                    ? normalized
                    : null;
            }
            catch (JsonException)
            {
                return null;
            }
        }

        private static bool TryNormalizePontosDeInteresse(
            IEnumerable<PontoDeInteresseDto>? source,
            out List<PontoDeInteresseDto>? normalized,
            out string? error)
        {
            normalized = null;
            error = null;

            if (source is null)
                return true;

            List<PontoDeInteresseDto> result = new();

            foreach (PontoDeInteresseDto point in source)
            {
                string name = (point.Nome ?? point.Titulo ?? string.Empty).Trim();
                string? description = string.IsNullOrWhiteSpace(point.Descricao)
                    ? null
                    : point.Descricao.Trim();
                string? image = string.IsNullOrWhiteSpace(point.Imagem)
                    ? null
                    : point.Imagem.Trim();

                if (name.Length == 0 && description is null && image is null)
                    continue;

                if (name.Length == 0)
                {
                    error = "Todo ponto de interesse deve possuir um nome.";
                    return false;
                }

                if (name.Length > 100)
                {
                    error = "O nome do ponto de interesse deve ter no máximo 100 caracteres.";
                    return false;
                }

                if (description?.Length > 300)
                {
                    error = "A descrição do ponto de interesse deve ter no máximo 300 caracteres.";
                    return false;
                }

                if (image?.Length > 2048)
                {
                    error = "O caminho da imagem do ponto de interesse é inválido.";
                    return false;
                }

                result.Add(new PontoDeInteresseDto
                {
                    Nome = name,
                    Descricao = description,
                    Imagem = image
                });
            }

            normalized = result.Count > 0 ? result : null;
            return true;
        }
    }
}
