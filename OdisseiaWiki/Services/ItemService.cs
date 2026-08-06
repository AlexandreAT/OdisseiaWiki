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
        private readonly ISistemaRpgResolver _sistemaRpgResolver;
        private readonly ISistemaEntidadeVinculoService _sistemaEntidadeVinculoService;

        public ItemService(
            IItemRepository repository,
            IAssetService assetService,
            ISistemaRpgResolver sistemaRpgResolver,
            ISistemaEntidadeVinculoService sistemaEntidadeVinculoService)
        {
            _repository = repository;
            _assetService = assetService;
            _sistemaRpgResolver = sistemaRpgResolver;
            _sistemaEntidadeVinculoService = sistemaEntidadeVinculoService;
        }

        public async Task<IEnumerable<ItemDto>> GetAllAsync(bool? visivel = null)
        {
            var items = await _repository.GetAllAsync(visivel);
            
            return items.Select(MapToDto);
        }

        public async Task<ItemDto?> GetByIdAsync(string id)
        {
            var item = await _repository.GetByIdAsync(id);
            if (item is null) return null;
            
            ItemDto dto = MapToDto(item);
            dto.SistemaRuntime = await _sistemaRpgResolver.ResolverContextoAsync(new SistemaRuntimeConsultaDto
            {
                TipoEntidade = Enums.SistemaEntidadeGlobalTipo.Item,
                IdEntidade = item.Iditem,
            });
            return dto;
        }

        public async Task<string> CreateAsync(ItemCreateDto dto) =>
            (await CreateWithRuntimeAsync(dto)).Id;

        public async Task<ItemSaveResultDto> CreateWithRuntimeAsync(ItemCreateDto dto)
        {
            SistemaEntidadeVinculoResultado vinculo = await _sistemaEntidadeVinculoService.ValidarAsync(
                dto.IdSistemaRpg,
                dto.IdSistemaVersao,
                dto.AcompanharPublicacaoAtual);
            if (!vinculo.Sucesso)
                throw new InvalidOperationException(vinculo.MensagemErro);

            var item = new Item
            {
                Iditem = Guid.NewGuid().ToString(),
                Nome = dto.Nome,
                Tipo = dto.Tipo,
                Descricao = RichTextHelper.SerializeRichText(dto.Descricao),
                Peso = dto.Peso,
                Discricao = dto.Discricao,
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
                IdSistemaRpg = vinculo.IdSistemaRpg,
                IdSistemaVersao = vinculo.IdSistemaVersao,
                AcompanharPublicacaoAtual = vinculo.AcompanharPublicacaoAtual,
                Idpersonagem = dto.Idpersonagem,
                DataCriacao = DateTime.UtcNow
            };

            await _repository.AddAsync(item);
            ItemDto salvo = MapToDto(item);
            salvo.SistemaRuntime = await ResolverRuntimeAsync(item);
            return ItemSaveResultDto.Ok(salvo);
        }

        public async Task<bool> UpdateAsync(ItemUpdateDto dto) =>
            await UpdateWithRuntimeAsync(dto) is not null;

        public async Task<ItemSaveResultDto?> UpdateWithRuntimeAsync(ItemUpdateDto dto)
        {
            var item = await _repository.GetByIdAsync(dto.Iditem);
            if (item is null) return null;

            bool alterarVinculo = dto.AcompanharPublicacaoAtual.HasValue ||
                dto.IdSistemaRpg.HasValue ||
                dto.IdSistemaVersao.HasValue;
            if (alterarVinculo)
            {
                bool acompanhar = dto.AcompanharPublicacaoAtual ?? item.AcompanharPublicacaoAtual;
                SistemaEntidadeVinculoResultado vinculo = await _sistemaEntidadeVinculoService.ValidarAsync(
                    dto.IdSistemaRpg,
                    dto.IdSistemaVersao,
                    acompanhar,
                    new SistemaEntidadeVinculoExistente(
                        item.IdSistemaRpg,
                        item.IdSistemaVersao,
                        item.AcompanharPublicacaoAtual));
                if (!vinculo.Sucesso)
                    throw new InvalidOperationException(vinculo.MensagemErro);

                item.IdSistemaRpg = vinculo.IdSistemaRpg;
                item.IdSistemaVersao = vinculo.IdSistemaVersao;
                item.AcompanharPublicacaoAtual = vinculo.AcompanharPublicacaoAtual;
            }

            HashSet<string> oldAssets = AssetReferenceHelper.Extract(
                item.Imagem, item.Descricao, item.AtributosJson);

            item.Nome = dto.Nome;
            item.Tipo = dto.Tipo;
            item.Descricao = dto.Descricao.HasValue
                ? RichTextHelper.SerializeRichText(dto.Descricao)
                : item.Descricao;
            item.Peso = dto.Peso;
            item.Discricao = dto.Discricao;
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
            ItemDto salvo = MapToDto(item);
            salvo.SistemaRuntime = await ResolverRuntimeAsync(item);
            return ItemSaveResultDto.Ok(salvo);
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

            return items.Select(MapToDto).ToList();
        }

        private Task<SistemaRuntimeContextoDto> ResolverRuntimeAsync(Item item) =>
            _sistemaRpgResolver.ResolverContextoAsync(
                new SistemaRuntimeConsultaDto
                {
                    TipoEntidade = Enums.SistemaEntidadeGlobalTipo.Item,
                    IdEntidade = item.Iditem,
                },
                new SistemaEntidadeGlobalVinculoSnapshot
                {
                    TipoEntidade = Enums.SistemaEntidadeGlobalTipo.Item,
                    IdEntidade = item.Iditem,
                    IdSistemaRpg = item.IdSistemaRpg,
                    IdSistemaVersao = item.IdSistemaVersao,
                    AcompanharPublicacaoAtual = item.AcompanharPublicacaoAtual,
                    TipoItem = item.Tipo,
                    EstadoJson = item.AtributosJson,
                });

        private static ItemDto MapToDto(Item i) => new()
            {
                Iditem = i.Iditem,
                Nome = i.Nome,
                Tipo = i.Tipo,
                Quantidade = i.Quantidade,
                Peso = i.Peso,
                Discricao = i.Discricao,
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
                IdSistemaRpg = i.IdSistemaRpg,
                IdSistemaVersao = i.IdSistemaVersao,
                AcompanharPublicacaoAtual = i.AcompanharPublicacaoAtual,
                DataCriacao = i.DataCriacao,
                Idpersonagem = i.Idpersonagem
            };
    }
}
