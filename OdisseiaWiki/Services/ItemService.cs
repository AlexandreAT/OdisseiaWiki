using OdisseiaWiki.Dtos;
using OdisseiaWiki.Helpers;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Helpers;
using OdisseiaWiki.Services.Interfaces;
using System.Text.Json;

namespace OdisseiaWiki.Services
{
    public class ItemService : IItemService
    {
        private readonly IItemRepository _repository;
        private readonly IAssetService _assetService;

        public ItemService(IItemRepository repository, IAssetService assetService)
        {
            _repository = repository;
            _assetService = assetService;
        }

        public async Task<IEnumerable<ItemDto>> GetAllAsync(bool? visivel = null)
        {
            var items = await _repository.GetAllAsync(visivel);
            
            return items.Select(i => new ItemDto
            {
                Iditem = i.Iditem,
                Nome = i.Nome,
                Tipo = i.Tipo,
                Quantidade = i.Quantidade,
                Peso = i.Peso,
                Descricao = RichTextHelper.DeserializeRichText(i.Descricao),
                Efeito = i.Efeito,
                Imagem = i.Imagem,
                AtributosJson = !string.IsNullOrWhiteSpace(i.AtributosJson)
                    ? JsonSerializer.Deserialize<object>(i.AtributosJson)
                    : null,
                IditemBase = i.IditemBase,
                Tags = !string.IsNullOrWhiteSpace(i.Tags)
                    ? JsonSerializer.Deserialize<List<string>>(i.Tags)
                    : null,
                Visivel = i.Visivel,
                Destaque = i.Destaque,
                DataCriacao = i.DataCriacao,
                Idpersonagem = i.Idpersonagem
            });
        }

        public async Task<ItemDto?> GetByIdAsync(string id)
        {
            var item = await _repository.GetByIdAsync(id);
            if (item is null) return null;
            
            return new ItemDto
            {
                Iditem = item.Iditem,
                Nome = item.Nome,
                Tipo = item.Tipo,
                Quantidade = item.Quantidade,
                Peso = item.Peso,
                Descricao = RichTextHelper.DeserializeRichText(item.Descricao),
                Efeito = item.Efeito,
                Imagem = item.Imagem,
                AtributosJson = !string.IsNullOrWhiteSpace(item.AtributosJson)
                    ? JsonSerializer.Deserialize<object>(item.AtributosJson)
                    : null,
                IditemBase = item.IditemBase,
                Tags = !string.IsNullOrWhiteSpace(item.Tags)
                    ? JsonSerializer.Deserialize<List<string>>(item.Tags)
                    : null,
                Visivel = item.Visivel,
                Destaque = item.Destaque,
                DataCriacao = item.DataCriacao,
                Idpersonagem = item.Idpersonagem
            };
        }

        public async Task<string> CreateAsync(ItemCreateDto dto)
        {
            var item = new Item
            {
                Iditem = Guid.NewGuid().ToString(),
                Nome = dto.Nome,
                Tipo = dto.Tipo,
                Descricao = RichTextHelper.SerializeRichText(dto.Descricao),
                Peso = dto.Peso,
                Quantidade = dto.Quantidade,
                Efeito = dto.Efeito,
                Imagem = dto.Imagem,
                AtributosJson = dto.AtributosJson != null 
                    ? JsonSerializer.Serialize(dto.AtributosJson) 
                    : null,
                IditemBase = dto.IditemBase,
                Tags = JsonSerializer.Serialize(ContentCategoryHelper.EnsureCategoryTag(dto.Tags, ContentCategoryHelper.Item)),
                Visivel = dto.Visivel,
                Destaque = dto.Destaque,
                Idpersonagem = dto.Idpersonagem,
                DataCriacao = DateTime.UtcNow
            };

            await _repository.AddAsync(item);
            return item.Iditem;
        }

        public async Task<bool> UpdateAsync(ItemUpdateDto dto)
        {
            var item = await _repository.GetByIdAsync(dto.Iditem);
            if (item is null) return false;

            HashSet<string> oldAssets = AssetReferenceHelper.Extract(
                item.Imagem, item.Descricao, item.AtributosJson);

            item.Nome = dto.Nome;
            item.Tipo = dto.Tipo;
            item.Descricao = dto.Descricao.HasValue
                ? RichTextHelper.SerializeRichText(dto.Descricao)
                : item.Descricao;
            item.Peso = dto.Peso;
            item.Quantidade = dto.Quantidade;
            item.Efeito = dto.Efeito;
            item.Imagem = dto.Imagem;
            item.AtributosJson = dto.AtributosJson != null
                ? JsonSerializer.Serialize(dto.AtributosJson)
                : item.AtributosJson;
            item.IditemBase = dto.IditemBase;
            item.Tags = JsonSerializer.Serialize(ContentCategoryHelper.EnsureCategoryTag(
                dto.Tags ?? JsonSafeHelper.DeserializeTags(item.Tags),
                ContentCategoryHelper.Item));
            item.Visivel = dto.Visivel;
            item.Destaque = dto.Destaque;
            item.Idpersonagem = dto.Idpersonagem;

            await _repository.UpdateAsync(item);
            await AssetReferenceHelper.DeleteRemovedAsync(
                _assetService,
                oldAssets,
                AssetReferenceHelper.Extract(item.Imagem, item.Descricao, item.AtributosJson));
            return true;
        }

        public async Task<bool> DeleteAsync(string id)
        {
            var item = await _repository.GetByIdAsync(id);
            if (item is null) return false;

            HashSet<string> assets = AssetReferenceHelper.Extract(
                item.Imagem, item.Descricao, item.AtributosJson);
            await _repository.DeleteAsync(id);
            await AssetReferenceHelper.DeleteAllAsync(_assetService, assets);
            return true;
        }

        public async Task<List<ItemDto>> GetBatchAsync(List<string> ids)
        {
            List<Item> items = await _repository.GetBatchAsync(ids);

            return items.Select(i => new ItemDto
            {
                Iditem = i.Iditem,
                Nome = i.Nome,
                Tipo = i.Tipo,
                Quantidade = i.Quantidade,
                Peso = i.Peso,
                Descricao = RichTextHelper.DeserializeRichText(i.Descricao),
                Efeito = i.Efeito,
                Imagem = i.Imagem,
                AtributosJson = !string.IsNullOrWhiteSpace(i.AtributosJson)
                    ? JsonSerializer.Deserialize<object>(i.AtributosJson)
                    : null,
                IditemBase = i.IditemBase,
                Tags = !string.IsNullOrWhiteSpace(i.Tags)
                    ? JsonSerializer.Deserialize<List<string>>(i.Tags)
                    : null,
                Visivel = i.Visivel,
                Destaque = i.Destaque,
                DataCriacao = i.DataCriacao,
                Idpersonagem = i.Idpersonagem
            }).ToList();
        }
    }
}
