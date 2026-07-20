using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Interfaces;
using OdisseiaWiki.Services.Helpers;
using System.Text.Json;

namespace OdisseiaWiki.Services
{
    public class PageService : IPageService
    {
        private readonly IPageRepository _repository;
        private readonly IAssetService _assetService;

        public PageService(IPageRepository repository, IAssetService assetService)
        {
            _repository = repository;
            _assetService = assetService;
        }

        public async Task<ResultPage> CreateAsync(CreatePageWithBlocksDto dto)
        {
            Page? slugExistente = await _repository.GetBySlugAsync(dto.Page.Slug);

            if (slugExistente != null)
                throw new InvalidOperationException("Já existe uma página com esse slug.");

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

        public async Task<PageDto?> GetByIdAsync(int id)
        {
            Page? page = await _repository.GetByIdAsync(id);

            return page != null
                ? MapPageToDto(page)
                : null;
        }

        public async Task<PageDto?> GetBySlugAsync(string slug)
        {
            Page? page = await _repository.GetBySlugAsync(slug);

            return page != null
                ? MapPageToDto(page)
                : null;
        }

        public async Task<List<SearchItemDto>> SearchAsync(string termo)
        {
            List<Page> pages = await _repository.SearchAsync(termo);

            return pages.Select(p => new SearchItemDto
            {
                Id = p.IdPage,
                Nome = p.Titulo,
                Imagem = p.CoverImage,
                Visivel = p.Visivel,
                Destaque = p.Destaque,
                Slug = p.Slug,
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
            bool? visivel = null)
        {
            List<Page> pages = await _repository.GetWithRelationBlocksAsync(visivel);

            return pages
                .Where(page => page.Blocks.Any(block => ReferencesEntity(block, entityType, entityId)))
                .OrderBy(page => page.Titulo)
                .Select(MapPageSummaryToDto)
                .ToList();
        }

        public async Task<PageDto> UpdateAsync(int id, CreatePageWithBlocksDto dto)
        {
            Page? page = await _repository.GetByIdAsync(id);

            if (page == null)
                throw new InvalidOperationException($"Página com id {id} não encontrada.");

            Page? slugExistente = await _repository.GetBySlugAsync(dto.Page.Slug);

            if (slugExistente != null && slugExistente.IdPage != id)
                throw new InvalidOperationException("Já existe uma página com esse slug.");

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
