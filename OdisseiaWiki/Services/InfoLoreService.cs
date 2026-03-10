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

        public InfoLoreService(
            IInfoLoreRepository infoLoreRepo,
            ICidadeRepository cidadeRepo,
            IPersonagemRepository personagemRepo,
            IItemRepository itemRepo,
            IRacaRepository racaRepo)
        {
            _infoLoreRepo = infoLoreRepo;
            _cidadeRepo = cidadeRepo;
            _personagemRepo = personagemRepo;
            _itemRepo = itemRepo;
            _racaRepo = racaRepo;
        }

        public async Task<ResultInfoLore> CreateAsync(InfoLoreDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Titulo))
                return ResultInfoLore.Fail("O título é obrigatório.");

            var infoLore = new Infolore
            {
                Titulo = dto.Titulo,
                Descricao = RichTextHelper.SerializeRichText(dto.Descricao),
                Imagem = dto.Imagem,
                Ordem = dto.Ordem,
                Tags = dto.Tags != null && dto.Tags.Any()
                    ? JsonSerializer.Serialize(dto.Tags)
                    : null,
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
            infoLore.Descricao = dto.Descricao.HasValue
                ? RichTextHelper.SerializeRichText(dto.Descricao)
                : infoLore.Descricao;
            infoLore.Imagem = dto.Imagem ?? infoLore.Imagem;
            infoLore.Ordem = dto.Ordem ?? infoLore.Ordem;
            infoLore.Tags = dto.Tags != null && dto.Tags.Any()
                ? JsonSerializer.Serialize(dto.Tags)
                : infoLore.Tags;
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
                var cidades = await _cidadeRepo.SearchAsync(termo);
                result.Cidades = cidades.Select(c => new SearchItemDto
                {
                    Id = c.Idcidade,
                    Nome = c.Nome,
                    Imagem = c.Imagem,
                    Tags = !string.IsNullOrWhiteSpace(c.Tags)
                        ? JsonSerializer.Deserialize<List<string>>(c.Tags)
                        : null,
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
                var personagens = await _personagemRepo.SearchAsync(termo);
                result.Personagens = personagens.Select(p => new SearchItemDto
                {
                    Id = p.Idpersonagem,
                    Nome = p.Nome,
                    Imagem = p.Imagem,
                    Tags = !string.IsNullOrWhiteSpace(p.Tags)
                        ? JsonSerializer.Deserialize<List<string>>(p.Tags)
                        : null,
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
                var itens = await _itemRepo.SearchAsync(termo);
                result.Itens = itens.Select(i => new SearchItemDto
                {
                    IdString = i.Iditem,
                    Nome = i.Nome,
                    Imagem = i.Imagem,
                    Tags = !string.IsNullOrWhiteSpace(i.Tags)
                        ? JsonSerializer.Deserialize<List<string>>(i.Tags)
                        : null,
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
                var infoLores = await _infoLoreRepo.SearchAsync(termo);
                result.InfoLores = infoLores.Select(il => new SearchItemDto
                {
                    Id = il.IdinfoLore,
                    Nome = il.Titulo,
                    Imagem = il.Imagem,
                    Tags = !string.IsNullOrWhiteSpace(il.Tags)
                        ? JsonSerializer.Deserialize<List<string>>(il.Tags)
                        : null,
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
                var racas = await _racaRepo.SearchAsync(termo);
                result.Racas = racas.Select(r => new SearchItemDto
                {
                    Id = r.Idraca,
                    Nome = r.Nome,
                    Imagem = r.Imagem,
                    Tags = !string.IsNullOrWhiteSpace(r.Tags)
                        ? JsonSerializer.Deserialize<List<string>>(r.Tags)
                        : null,
                    Visivel = r.Visivel,
                    TipoEntidade = "Raca"
                }).ToList();
            }
            catch
            {
                result.Racas = new List<SearchItemDto>();
            }

            return result;
        }

        private static InfoLoreDto MapToDto(Infolore infoLore) => new()
        {
            IdinfoLore = infoLore.IdinfoLore,
            Titulo = infoLore.Titulo,
            Descricao = RichTextHelper.DeserializeRichText(infoLore.Descricao),
            Imagem = infoLore.Imagem,
            Ordem = infoLore.Ordem,
            Tags = !string.IsNullOrWhiteSpace(infoLore.Tags)
                ? JsonSerializer.Deserialize<List<string>>(infoLore.Tags)
                : null,
            Visivel = infoLore.Visivel,
            DataCriacao = infoLore.DataCriacao
        };
    }
}