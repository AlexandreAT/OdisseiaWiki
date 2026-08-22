using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Interfaces;
using OdisseiaWiki.Services.Helpers;
using OdisseiaWiki.Enums;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace OdisseiaWiki.Services
{
    public class PageService : IPageService
    {
        private static readonly HashSet<string> ReservedSlugs = new(StringComparer.OrdinalIgnoreCase)
        {
            "search",
            "conexoes"
        };

        private readonly IPageRepository _repository;
        private readonly IAssetService _assetService;
        private readonly ICidadeRepository _cidadeRepository;
        private readonly IRacaRepository _racaRepository;
        private readonly IItemRepository _itemRepository;
        private readonly IPersonagemRepository _personagemRepository;

        public PageService(
            IPageRepository repository,
            IAssetService assetService,
            ICidadeRepository cidadeRepository,
            IRacaRepository racaRepository,
            IItemRepository itemRepository,
            IPersonagemRepository personagemRepository)
        {
            _repository = repository;
            _assetService = assetService;
            _cidadeRepository = cidadeRepository;
            _racaRepository = racaRepository;
            _itemRepository = itemRepository;
            _personagemRepository = personagemRepository;
        }

        public async Task<ResultPage> CreateAsync(CreatePageWithBlocksDto dto)
        {
            ValidateReservedSlug(dto.Page.Slug);
            Page? slugExistente = await _repository.GetBySlugAsync(dto.Page.Slug);

            if (slugExistente != null)
                throw new InvalidOperationException("Já existe uma página com esse slug.");

            await ValidateReferencesAsync(dto.Blocks);

            Page page = new()
            {
                Titulo = dto.Page.Titulo,
                Slug = dto.Page.Slug,
                Descricao = dto.Page.Descricao,
                CoverImage = dto.Page.CoverImage,
                Visivel = dto.Page.Visivel,
                Destaque = dto.Page.Destaque,
                DataCriacao = DateTime.UtcNow
            };

            page.Blocks = dto.Blocks.Select(MapBlockDtoToEntity).ToList();

            Page created = await _repository.CreateAsync(page);

            return ResultPage.Ok(MapPageToDto(created));
        }

        public async Task<PageDto?> GetByIdAsync(
            int id,
            bool aplicarVisibilidadeDePersonagem = false)
        {
            Page? page = await _repository.GetByIdAsync(id);

            return page is null
                ? null
                : await MapPageParaLeituraAsync(page, aplicarVisibilidadeDePersonagem);
        }

        public async Task<PageDto?> GetBySlugAsync(
            string slug,
            bool aplicarVisibilidadeDePersonagem = false)
        {
            Page? page = await _repository.GetBySlugAsync(slug);

            return page is null
                ? null
                : await MapPageParaLeituraAsync(page, aplicarVisibilidadeDePersonagem);
        }

        public async Task<List<SearchItemDto>> SearchAsync(string termo)
        {
            List<Page> pages = ContentCategoryHelper.MatchesCategorySearch(termo, ContentCategoryHelper.Page)
                ? await _repository.GetAllAsync()
                : await _repository.SearchAsync(termo);

            return pages.Select(p => new SearchItemDto
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

        public async Task<List<PageDto>> GetAllAsync(bool? visivel = null)
        {
            List<Page> pages = await _repository.GetAllAsync(visivel);

            return pages.Select(MapPageToDto).ToList();
        }

        public async Task<List<PageDto>> GetReferencingAsync(
            string entityType,
            string entityId,
            bool? visivel = null,
            bool aplicarVisibilidadeDePersonagem = false)
        {
            if (aplicarVisibilidadeDePersonagem &&
                IsCharacterReference(entityType) &&
                (!int.TryParse(entityId, out int idPersonagem) ||
                 !await PodeExibirRelacionamentoPublicoAsync(idPersonagem)))
            {
                return new List<PageDto>();
            }

            List<Page> pages = await _repository.GetWithRelationBlocksAsync(visivel);

            return pages
                .Where(page => page.Blocks.Any(block => ReferencesEntity(block, entityType, entityId)))
                .OrderBy(page => page.Titulo)
                .Select(MapPageSummaryToDto)
                .ToList();
        }

        public async Task<PageDto> UpdateAsync(int id, CreatePageWithBlocksDto dto)
        {
            ValidateReservedSlug(dto.Page.Slug);
            Page? page = await _repository.GetByIdAsync(id);

            if (page == null)
                throw new InvalidOperationException($"Página com id {id} não encontrada.");

            Page? slugExistente = await _repository.GetBySlugAsync(dto.Page.Slug);

            if (slugExistente != null && slugExistente.IdPage != id)
                throw new InvalidOperationException("Já existe uma página com esse slug.");

            await ValidateReferencesAsync(dto.Blocks);

            HashSet<string> oldAssets = ExtractAssets(page);

            page.Titulo = dto.Page.Titulo;
            page.Slug = dto.Page.Slug;
            page.Descricao = dto.Page.Descricao;
            page.CoverImage = dto.Page.CoverImage;
            page.Visivel = dto.Page.Visivel;
            page.Destaque = dto.Page.Destaque;

            page.Blocks.Clear();

            foreach (PageBlockDto blockDto in dto.Blocks)
            {
                page.Blocks.Add(MapBlockDtoToEntity(blockDto));
            }

            Page updated = await _repository.UpdateAsync(page);

            await AssetReferenceHelper.DeleteRemovedAsync(
                _assetService,
                oldAssets,
                ExtractAssets(updated));

            return MapPageToDto(updated);
        }

        private static void ValidateReservedSlug(string slug)
        {
            if (ReservedSlugs.Contains(slug.Trim()))
                throw new InvalidOperationException("Esse slug é reservado para uma funcionalidade da Wiki.");
        }

        public async Task<bool> DeleteAsync(int id)
        {
            Page? page = await _repository.GetByIdAsync(id);
            if (page is null)
                return false;

            HashSet<string> assets = ExtractAssets(page);
            bool deleted = await _repository.DeleteAsync(id);
            if (deleted)
                await AssetReferenceHelper.DeleteAllAsync(_assetService, assets);
            return deleted;
        }

        private static HashSet<string> ExtractAssets(Page page)
            => AssetReferenceHelper.Extract(
                new[] { page.CoverImage, page.Descricao }
                    .Concat(page.Blocks.Select(block => block.Conteudo))
                    .ToArray());

        private static PageBlock MapBlockDtoToEntity(PageBlockDto dto)
        {
            return new PageBlock
            {
                Tipo = dto.Tipo,
                Conteudo = JsonSerializer.Serialize(dto.Conteudo),
                Ordem = dto.Ordem
            };
        }

        private static PageDto MapPageToDto(Page page)
        {
            return new PageDto
            {
                IdPage = page.IdPage,
                Titulo = page.Titulo,
                Slug = page.Slug,
                Descricao = page.Descricao,
                CoverImage = page.CoverImage,
                Visivel = page.Visivel,
                Destaque = page.Destaque,
                DataCriacao = page.DataCriacao,
                Blocks = page.Blocks
                    .OrderBy(b => b.Ordem)
                    .Select(b => new PageBlockDto
                    {
                        Tipo = b.Tipo,
                        Conteudo = JsonSerializer.Deserialize<object>(b.Conteudo)!,
                        Ordem = b.Ordem
                    })
                .ToList()
            };
        }

        private async Task<PageDto> MapPageParaLeituraAsync(
            Page page,
            bool aplicarVisibilidadeDePersonagem)
        {
            PageDto dto = MapPageToDto(page);
            if (!aplicarVisibilidadeDePersonagem)
                return dto;

            Dictionary<int, bool> relacoesPublicas = new();
            List<PageBlockDto> blocks = new();
            foreach (PageBlockDto block in dto.Blocks)
            {
                if (block.Tipo != PageBlockType.Relation)
                {
                    blocks.Add(block);
                    continue;
                }

                object? conteudo = await SanitizarRelacaoPublicaAsync(
                    block.Conteudo,
                    relacoesPublicas);
                if (conteudo is null)
                    continue;

                blocks.Add(new PageBlockDto
                {
                    Tipo = block.Tipo,
                    Conteudo = conteudo,
                    Ordem = block.Ordem,
                });
            }

            dto.Blocks = blocks;
            return dto;
        }

        private async Task<object?> SanitizarRelacaoPublicaAsync(
            object conteudo,
            IDictionary<int, bool> relacoesPublicas)
        {
            JsonNode? raiz;
            try
            {
                raiz = JsonSerializer.SerializeToNode(conteudo);
            }
            catch (Exception exception) when (exception is JsonException or NotSupportedException)
            {
                return conteudo;
            }

            if (raiz is null)
                return null;

            if (raiz is JsonArray array)
            {
                JsonArray resultado = new();
                foreach (JsonNode? entrada in array)
                {
                    JsonNode? sanitizada = await SanitizarEntradaDeRelacaoPublicaAsync(
                        entrada,
                        relacoesPublicas);
                    if (sanitizada is not null)
                        resultado.Add(sanitizada);
                }

                return resultado.Count == 0
                    ? null
                    : JsonSerializer.Deserialize<object>(resultado.ToJsonString());
            }

            JsonNode? entradaUnica = await SanitizarEntradaDeRelacaoPublicaAsync(
                raiz,
                relacoesPublicas);
            return entradaUnica is null
                ? null
                : JsonSerializer.Deserialize<object>(entradaUnica.ToJsonString());
        }

        private async Task<JsonNode?> SanitizarEntradaDeRelacaoPublicaAsync(
            JsonNode? entrada,
            IDictionary<int, bool> relacoesPublicas)
        {
            if (entrada is not JsonObject objeto)
                return entrada?.DeepClone();

            JsonNode? tipoNode = GetProperty(objeto, "tipoEntidade");
            if (tipoNode is not JsonValue tipoValue ||
                !tipoValue.TryGetValue(out string? tipo) ||
                !IsCharacterReference(tipo))
            {
                return objeto.DeepClone();
            }

            JsonNode? idNode = GetProperty(objeto, "idEntidade");
            if (!TryGetInteger(idNode, out int idPersonagem))
                return null;

            if (!relacoesPublicas.TryGetValue(idPersonagem, out bool podeExibir))
            {
                podeExibir = await PodeExibirRelacionamentoPublicoAsync(idPersonagem);
                relacoesPublicas[idPersonagem] = podeExibir;
            }

            if (!podeExibir)
                return null;

            return new JsonObject
            {
                ["tipoEntidade"] = tipoNode.DeepClone(),
                ["idEntidade"] = idNode!.DeepClone(),
            };
        }

        private async Task<bool> PodeExibirRelacionamentoPublicoAsync(int idPersonagem)
        {
            Personagen? personagem = await _personagemRepository.GetByIdAsync(idPersonagem);
            if (personagem?.Visivel != true)
                return false;

            return PersonagemVisibilidadeDefaults.FromEntity(
                personagem.ConfiguracaoVisibilidade,
                personagemJogador: false).PersonagensRelacionados;
        }

        private static JsonNode? GetProperty(JsonObject objeto, string propertyName)
        {
            foreach (KeyValuePair<string, JsonNode?> property in objeto)
            {
                if (string.Equals(property.Key, propertyName, StringComparison.OrdinalIgnoreCase))
                    return property.Value;
            }

            return null;
        }

        private static bool TryGetInteger(JsonNode? value, out int number)
        {
            if (value is JsonValue jsonValue)
            {
                if (jsonValue.TryGetValue(out int integer))
                {
                    number = integer;
                    return true;
                }

                if (jsonValue.TryGetValue(out string? text) && int.TryParse(text, out integer))
                {
                    number = integer;
                    return true;
                }
            }

            number = 0;
            return false;
        }

        private static bool IsCharacterReference(string? entityType) =>
            string.Equals(entityType?.Trim(), "personagem", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(entityType?.Trim(), "character", StringComparison.OrdinalIgnoreCase);

        private async Task ValidateReferencesAsync(IEnumerable<PageBlockDto> blocks)
        {
            var references = new HashSet<(string Type, string Id)>();

            foreach (PageBlockDto block in blocks.Where(block => block.Tipo == PageBlockType.Relation))
            {
                JsonElement root = block.Conteudo is JsonElement element
                    ? element
                    : JsonSerializer.SerializeToElement(block.Conteudo);

                IEnumerable<JsonElement> entries = root.ValueKind == JsonValueKind.Array
                    ? root.EnumerateArray().ToArray()
                    : new[] { root };

                foreach (JsonElement entry in entries)
                {
                    if (entry.ValueKind != JsonValueKind.Object
                        || !TryGetProperty(entry, "tipoEntidade", out JsonElement typeElement)
                        || !TryGetProperty(entry, "idEntidade", out JsonElement idElement)
                        || typeElement.ValueKind != JsonValueKind.String)
                        continue;

                    string type = typeElement.GetString()?.Trim() ?? string.Empty;
                    string referenceId = idElement.ValueKind == JsonValueKind.String
                        ? idElement.GetString()?.Trim() ?? string.Empty
                        : idElement.GetRawText().Trim();

                    if (!string.IsNullOrWhiteSpace(type) && !string.IsNullOrWhiteSpace(referenceId))
                        references.Add((type, referenceId));
                }
            }

            foreach ((string type, string referenceId) in references)
            {
                bool isVisible = type.ToLowerInvariant() switch
                {
                    "cidade" when int.TryParse(referenceId, out int cityId)
                        => (await _cidadeRepository.GetByIdAsync(cityId))?.Visivel == true,
                    "raca" when int.TryParse(referenceId, out int raceId)
                        => (await _racaRepository.GetByIdAsync(raceId))?.Visivel == true,
                    "item" => (await _itemRepository.GetByIdAsync(referenceId))?.Visivel == true,
                    "personagem" when int.TryParse(referenceId, out int characterId)
                        => (await _personagemRepository.GetByIdAsync(characterId))?.Visivel == true,
                    "page" or "pagina" or "página" when int.TryParse(referenceId, out int pageId)
                        => await _repository.ExistsVisibleAsync(pageId),
                    _ => false
                };

                if (!isVisible)
                    throw new InvalidOperationException(
                        $"A referência {type} ({referenceId}) não existe ou não está visível.");
            }
        }

        private static PageDto MapPageSummaryToDto(Page page)
        {
            return new PageDto
            {
                IdPage = page.IdPage,
                Titulo = page.Titulo,
                Slug = page.Slug,
                Descricao = page.Descricao,
                CoverImage = page.CoverImage,
                Visivel = page.Visivel,
                Destaque = page.Destaque,
                DataCriacao = page.DataCriacao
            };
        }

        private static bool ReferencesEntity(PageBlock block, string entityType, string entityId)
        {
            try
            {
                using JsonDocument document = JsonDocument.Parse(block.Conteudo);
                JsonElement root = document.RootElement;

                if (root.ValueKind == JsonValueKind.Array)
                    return root.EnumerateArray().Any(reference => ReferenceMatches(reference, entityType, entityId));

                return ReferenceMatches(root, entityType, entityId);
            }
            catch (JsonException)
            {
                return false;
            }
        }

        private static bool ReferenceMatches(JsonElement reference, string entityType, string entityId)
        {
            if (reference.ValueKind != JsonValueKind.Object
                || !TryGetProperty(reference, "tipoEntidade", out JsonElement typeElement)
                || !TryGetProperty(reference, "idEntidade", out JsonElement idElement)
                || typeElement.ValueKind != JsonValueKind.String)
                return false;

            string? referenceType = typeElement.GetString();
            string referenceId = idElement.ValueKind == JsonValueKind.String
                ? idElement.GetString() ?? string.Empty
                : idElement.GetRawText();

            return string.Equals(referenceType, entityType, StringComparison.OrdinalIgnoreCase)
                && string.Equals(referenceId, entityId, StringComparison.OrdinalIgnoreCase);
        }

        private static bool TryGetProperty(JsonElement element, string propertyName, out JsonElement value)
        {
            foreach (JsonProperty property in element.EnumerateObject())
            {
                if (string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase))
                {
                    value = property.Value;
                    return true;
                }
            }

            value = default;
            return false;
        }
    }
}
