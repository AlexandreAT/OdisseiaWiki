using OdisseiaWiki.Dtos;
using OdisseiaWiki.Helpers;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Interfaces;
using System.Text.Json;

namespace OdisseiaWiki.Services
{
    public class ItemService : IItemService
    {
        private readonly IItemRepository _repository;

        public ItemService(IItemRepository repository) => _repository = repository;

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
                Tags = dto.Tags != null && dto.Tags.Any()
                    ? JsonSerializer.Serialize(dto.Tags)
                    : null,
                Visivel = dto.Visivel,
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
            item.Tags = dto.Tags != null && dto.Tags.Any()
                ? JsonSerializer.Serialize(dto.Tags)
                : item.Tags;
            item.Visivel = dto.Visivel;
            item.Idpersonagem = dto.Idpersonagem;

            await _repository.UpdateAsync(item);
            return true;
        }

        public async Task<bool> DeleteAsync(string id)
        {
            var item = await _repository.GetByIdAsync(id);
            if (item is null) return false;

            await _repository.DeleteAsync(id);
            return true;
        }
    }
}
