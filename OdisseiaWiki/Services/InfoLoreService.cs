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

        public InfoLoreService(
            IInfoLoreRepository infoLoreRepo,
            ICidadeRepository cidadeRepo,
            IPersonagemRepository personagemRepo,
            IItemRepository itemRepo,
            IRacaRepository racaRepo,
            IPageRepository pageRepo)
        {
            _infoLoreRepo = infoLoreRepo;
            _cidadeRepo = cidadeRepo;
            _personagemRepo = personagemRepo;
            _itemRepo = itemRepo;
            _racaRepo = racaRepo;
            _pageRepo = pageRepo;
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

            if (!string.IsNullOrWhiteSpace(infoLore.Imagem) &&
                dto.Imagem != null &&
                infoLore.Imagem != dto.Imagem)
            {
                AssetFileHelper.DeleteIfExists(infoLore.Imagem);
            }

            // =============== QUANDO TIVER GALERIA DE IMAGENS ===============
            //List<string>? oldGaleria = !string.IsNullOrWhiteSpace(infoLore.GaleriaImagem)
            //    ? JsonSerializer.Deserialize<List<string>>(infoLore.GaleriaImagem)
            //    : new List<string>();

            //List<string>? removedImages = AssetDiffHelper.GetRemovedFiles(oldGaleria, dto.GaleriaImagem);

            //foreach (string? img in removedImages)
            //{
            //    AssetFileHelper.DeleteIfExists(img);
            //}

            infoLore.Titulo = dto.Titulo ?? infoLore.Titulo;
            infoLore.Conteudo = dto.Conteudo != null
                ? RichTextHelper.SerializeRichText(dto.Conteudo)
                : infoLore.Conteudo;
            infoLore.Imagem = dto.Imagem ?? infoLore.Imagem;
            infoLore.Tags = JsonSerializer.Serialize(ContentCategoryHelper.EnsureCategoryTag(
                dto.Tags ?? JsonSafeHelper.DeserializeTags(infoLore.Tags),
                ContentCategoryHelper.InfoLore));
            infoLore.Visivel = dto.Visivel;

            var atualizado = await _infoLoreRepo.UpdateAsync(infoLore);
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
            => await _infoLoreRepo.DeleteAsync(id);

        public async Task<GlobalSearchResultDto> SearchGlobalAsync(string termo)
        {
            if (string.IsNullOrWhiteSpace(termo))
                return new GlobalSearchResultDto();

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
                    TipoEntidade = "Cidade"
                }).ToList();
            }
            catch
            {
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
                    TipoEntidade = "Personagem"
                }).ToList();
            }
            catch
            {
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
                    TipoEntidade = "Item"
                }).ToList();
            }
            catch
            {
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
                    TipoEntidade = "InfoLore"
                }).ToList();
            }
            catch
            {
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
                    TipoEntidade = "Raca"
                }).ToList();
            }
            catch
            {
                result.Racas = new List<SearchItemDto>();
            }

            try
            {
                var pages = ContentCategoryHelper.MatchesCategorySearch(termo, ContentCategoryHelper.Page)
                    ? await _pageRepo.GetAllAsync()
                    : await _pageRepo.SearchAsync(termo);

                result.Pages = pages.Select(p => new SearchItemDto
                {
                    Id = p.IdPage,
                    Nome = p.Titulo,
                    Imagem = p.CoverImage,
                    Visivel = p.Visivel,
                    Slug = p.Slug,
                    TipoEntidade = "Page"
                }).ToList();
            }
            catch
            {
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
            DataCriacao = infoLore.DataCriacao
        };
    }
}
