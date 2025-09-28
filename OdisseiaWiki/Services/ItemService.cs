using OdisseiaWiki.Dtos;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Services
{
    public class ItemService : IItemService
    {
        private readonly IItemRepository _repository;

        public ItemService(IItemRepository repository) => _repository = repository;

        public async Task<IEnumerable<ItemDto>> GetAllAsync() =>
        (await _repository.GetAllAsync())
        .Select(i => new ItemDto
        {
            Iditem = i.Iditem,
            Nome = i.Nome,
            Tipo = i.Tipo.ToString().ToLowerInvariant(),
            Quantidade = i.Quantidade,
            Peso = i.Peso,
            Descricao = i.Descricao,
            Efeito = i.Efeito,
            Imagem = i.Imagem,
            AtributosJson = i.AtributosJson,
            IditemBase = i.IditemBase,
            DataCriacao = i.DataCriacao.ToString("yyyy-MM-dd"),
            Idpersonagem = i.Idpersonagem
        });

        public async Task<ItemDto?> GetByIdAsync(string id)
        {
            var item = await _repository.GetByIdAsync(id);
            if (item is null) return null;
            return new ItemDto
            {
                Iditem = item.Iditem,
                Nome = item.Nome,
                Tipo = item.Tipo.ToString().ToLowerInvariant(),
                Quantidade = item.Quantidade,
                Peso = item.Peso,
                Descricao = item.Descricao,
                Efeito = item.Efeito,
                Imagem = item.Imagem,
                AtributosJson = item.AtributosJson,
                IditemBase = item.IditemBase,
                DataCriacao = item.DataCriacao.ToString("yyyy-MM-dd"),
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
                Descricao = dto.Descricao,
                Peso = dto.Peso,
                Quantidade = dto.Quantidade,
                Efeito = dto.Efeito,
                Imagem = dto.Imagem,
                AtributosJson = dto.AtributosJson,
                IditemBase = dto.IditemBase,
                Idpersonagem = dto.Idpersonagem,
                DataCriacao = DateOnly.FromDateTime(DateTime.UtcNow)
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
            item.Descricao = dto.Descricao;
            item.Peso = dto.Peso;
            item.Quantidade = dto.Quantidade;
            item.Efeito = dto.Efeito;
            item.Imagem = dto.Imagem;
            item.AtributosJson = dto.AtributosJson;
            item.IditemBase = dto.IditemBase;
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
