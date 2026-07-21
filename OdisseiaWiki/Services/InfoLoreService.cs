using OdisseiaWiki.Dtos;
using OdisseiaWiki.Helpers;
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
    public class InfoLoreService : IInfoLoreService
    {
        private readonly IInfoLoreRepository _infoLoreRepo;
        private readonly ICidadeRepository _cidadeRepo;
        private readonly IPersonagemRepository _personagemRepo;
        private readonly IItemRepository _itemRepo;
        private readonly IRacaRepository _racaRepo;
        private readonly IPageRepository _pageRepo;
        private readonly IAssetService _assetService;
        private readonly ILogger<InfoLoreService> _logger;

        public InfoLoreService(
            IInfoLoreRepository infoLoreRepo,
            ICidadeRepository cidadeRepo,
            IPersonagemRepository personagemRepo,
            IItemRepository itemRepo,
            IRacaRepository racaRepo,
            IPageRepository pageRepo,
            IAssetService assetService,
            ILogger<InfoLoreService> logger)
        {
            _infoLoreRepo = infoLoreRepo;
            _cidadeRepo = cidadeRepo;
            _personagemRepo = personagemRepo;
            _itemRepo = itemRepo;
            _racaRepo = racaRepo;
            _pageRepo = pageRepo;
            _assetService = assetService;
            _logger = logger;
        }

        public async Task<ResultInfoLore> CreateAsync(InfoLoreDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Titulo))
                return ResultInfoLore.Fail("O título é obrigatório.");

            var infoLore = new Infolore
            {
                Titulo = dto.Titulo,
                Conteudo = RichTextHelper.SerializeRichText(dto.Conteudo),
                Imagem = dto.Imagem,
                Tags = JsonSerializer.Serialize(ContentCategoryHelper.EnsureCategoryTag(dto.Tags, ContentCategoryHelper.InfoLore)),
                Visivel = dto.Visivel,
                Destaque = dto.Destaque,
                DataCriacao = DateTime.UtcNow
            };

            var criado = await _infoLoreRepo.CreateAsync(infoLore);
            return ResultInfoLore.Ok(MapToDto(criado));
        }

        public async Task<ResultInfoLore> UpdateAsync(int id, InfoLoreDto dto)
        {
            var infoLore = await _infoLoreRepo.GetByIdAsync(id);
            if (infoLore == null)
                return ResultInfoLore.Fail($"InfoLore com id {id} não encontrado.");

            HashSet<string> oldAssets = AssetReferenceHelper.Extract(infoLore.Imagem, infoLore.Conteudo);

            infoLore.Titulo = dto.Titulo ?? infoLore.Titulo;
            infoLore.Conteudo = dto.Conteudo != null
                ? RichTextHelper.SerializeRichText(dto.Conteudo)
                : infoLore.Conteudo;
            infoLore.Imagem = dto.Imagem ?? infoLore.Imagem;
            infoLore.Tags = JsonSerializer.Serialize(ContentCategoryHelper.EnsureCategoryTag(
                dto.Tags ?? JsonSafeHelper.DeserializeTags(infoLore.Tags),
                ContentCategoryHelper.InfoLore));
            infoLore.Visivel = dto.Visivel;
            infoLore.Destaque = dto.Destaque;

            var atualizado = await _infoLoreRepo.UpdateAsync(infoLore);
            await AssetReferenceHelper.DeleteRemovedAsync(
                _assetService,
                oldAssets,
                AssetReferenceHelper.Extract(atualizado.Imagem, atualizado.Conteudo));
            return ResultInfoLore.Ok(MapToDto(atualizado));
        }

        public async Task<ResultInfoLore> GetAllAsync(bool? visivel = null)
        {
            var infoLores = await _infoLoreRepo.GetAllAsync(visivel);

            var dtos = infoLores.Select(MapToDto).ToList();

            return ResultInfoLore.Ok(dtos);
        }

        public async Task<InfoLoreDto?> GetByIdAsync(int id)
        {
            var infoLore = await _infoLoreRepo.GetByIdAsync(id);
            return infoLore != null ? MapToDto(infoLore) : null;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            Infolore? infoLore = await _infoLoreRepo.GetByIdAsync(id);
            if (infoLore is null)
                return false;

            HashSet<string> assets = AssetReferenceHelper.Extract(infoLore.Imagem, infoLore.Conteudo);
            bool deleted = await _infoLoreRepo.DeleteAsync(id);
            if (deleted)
                await AssetReferenceHelper.DeleteAllAsync(_assetService, assets);
            return deleted;
        }

        public async Task<GlobalSearchResultDto> SearchGlobalAsync(string termo)
        {
            if (string.IsNullOrWhiteSpace(termo))
                return new GlobalSearchResultDto();

            termo = termo.Trim();

            var result = new GlobalSearchResultDto();

            // Busca sequencial com tratamento de erro individual
            try
            {
                //Tags = JsonSafeHelper.DeserializeTags(i.Tags),
                var cidades = ContentCategoryHelper.MatchesCategorySearch(termo, ContentCategoryHelper.Cidade)
                    ? await _cidadeRepo.GetAllAsync()
                    : await _cidadeRepo.SearchAsync(termo);
                result.Cidades = cidades.Select(c => new SearchItemDto
                {
                    Id = c.Idcidade,
                    Nome = c.Nome,
                    Imagem = c.Imagem,
                    Tags = JsonSafeHelper.DeserializeTags(c.Tags),
                    Visivel = c.Visivel,
                    Destaque = c.Destaque,
                    TipoEntidade = "Cidade"
                }).ToList();
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Falha ao buscar cidades pelo termo {SearchTerm}.", termo);
                result.Cidades = new List<SearchItemDto>();
            }

            try
            {
                var personagens = ContentCategoryHelper.MatchesCategorySearch(termo, ContentCategoryHelper.Personagem)
                    ? await _personagemRepo.GetAllAsync()
                    : await _personagemRepo.SearchAsync(termo);
                result.Personagens = personagens.Select(p => new SearchItemDto
                {
                    Id = p.Idpersonagem,
                    Nome = p.Nome,
                    Imagem = p.Imagem,
                    Tags = JsonSafeHelper.DeserializeTags(p.Tags),
                    Visivel = p.Visivel,
                    Destaque = p.Destaque,
                    TipoEntidade = "Personagem"
                }).ToList();
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Falha ao buscar personagens pelo termo {SearchTerm}.", termo);
                result.Personagens = new List<SearchItemDto>();
            }

            try
            {
                var itens = ContentCategoryHelper.MatchesCategorySearch(termo, ContentCategoryHelper.Item)
                    ? await _itemRepo.GetAllAsync()
                    : await _itemRepo.SearchAsync(termo);
                result.Itens = itens.Select(i => new SearchItemDto
                {
                    IdString = i.Iditem,
                    Nome = i.Nome,
                    Imagem = i.Imagem,
                    Tags = JsonSafeHelper.DeserializeTags(i.Tags),
                    Visivel = i.Visivel,
                    Destaque = i.Destaque,
                    TipoEntidade = "Item"
                }).ToList();
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Falha ao buscar itens pelo termo {SearchTerm}.", termo);
                result.Itens = new List<SearchItemDto>();
            }

            try
            {
                var infoLores = ContentCategoryHelper.MatchesCategorySearch(termo, ContentCategoryHelper.InfoLore)
                    ? await _infoLoreRepo.GetAllAsync()
                    : await _infoLoreRepo.SearchAsync(termo);
                result.InfoLores = infoLores.Select(il => new SearchItemDto
                {
                    Id = il.IdinfoLore,
                    Nome = il.Titulo,
                    Imagem = il.Imagem,
                    Tags = JsonSafeHelper.DeserializeTags(il.Tags),
                    Visivel = il.Visivel,
                    Destaque = il.Destaque,
                    TipoEntidade = "InfoLore"
                }).ToList();
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Falha ao buscar conteúdos de lore pelo termo {SearchTerm}.", termo);
                result.InfoLores = new List<SearchItemDto>();
            }

            try
            {
                var racas = ContentCategoryHelper.MatchesCategorySearch(termo, ContentCategoryHelper.Raca)
                    ? await _racaRepo.GetAllAsync()
                    : await _racaRepo.SearchAsync(termo);
                result.Racas = racas.Select(r => new SearchItemDto
                {
                    Id = r.Idraca,
                    Nome = r.Nome,
                    Imagem = r.Imagem,
                    Tags = JsonSafeHelper.DeserializeTags(r.Tags),
                    Visivel = r.Visivel,
                    Destaque = r.Destaque,
                    TipoEntidade = "Raca"
                }).ToList();
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Falha ao buscar raças pelo termo {SearchTerm}.", termo);
                result.Racas = new List<SearchItemDto>();
            }

            try
            {
                var pages = ContentCategoryHelper.MatchesCategorySearch(termo, ContentCategoryHelper.Page)
                    ? await _pageRepo.GetAllAsync()
                    : await _pageRepo.SearchAsync(termo);

                result.Pages = pages
                    .OrderBy(page => page.Titulo, StringComparer.CurrentCultureIgnoreCase)
                    .Select(p => new SearchItemDto
                {
                    Id = p.IdPage,
                    Nome = p.Titulo,
                    Imagem = p.CoverImage,
                    Visivel = p.Visivel,
                    Destaque = p.Destaque,
                    Slug = p.Slug,
                    Tags = new List<string> { "Página" },
                    TipoEntidade = "Page"
                }).ToList();
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Falha ao buscar páginas pelo termo {SearchTerm}.", termo);
                result.Pages = new List<SearchItemDto>();
            }

            return result;
        }

        private static InfoLoreDto MapToDto(Infolore infoLore) => new()
        {
            IdinfoLore = infoLore.IdinfoLore,
            Titulo = infoLore.Titulo,
            Conteudo = RichTextHelper.DeserializeRichText(infoLore.Conteudo),
            Imagem = infoLore.Imagem,
            Tags = !string.IsNullOrWhiteSpace(infoLore.Tags)
                ? JsonSerializer.Deserialize<List<string>>(infoLore.Tags)
                : null,
            Visivel = infoLore.Visivel,
            Destaque = infoLore.Destaque,
            DataCriacao = infoLore.DataCriacao
        };
    }
}
