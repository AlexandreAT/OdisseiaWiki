using System.Text.Json;
using Moq;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services;
using OdisseiaWiki.Services.Interfaces;
using Xunit;
using GlobalItem = global::Item;

namespace OdisseiaWiki.Tests;

public sealed class WikiReferenceVisibilityTests
{
    [Fact]
    public async Task PaginaPublicaMantemCardsOcultosSemEnviarIdsNemMetadados()
    {
        Page page = new()
        {
            IdPage = 77,
            Titulo = "Página pública",
            Slug = "pagina-publica",
            Blocks = new List<PageBlock>
            {
                new()
                {
                    Tipo = PageBlockType.Relation,
                    Conteudo = """
                        [
                          {"tipoEntidade":"Cidade","idEntidade":917238,"nome":"Segredo cidade"},
                          {"tipoEntidade":"Raca","idEntidade":917239,"nome":"Segredo raça"},
                          {"tipoEntidade":"Page","idEntidade":917240,"nome":"Segredo página"},
                          {"tipoEntidade":"Personagem","idEntidade":917241,"nome":"Segredo personagem"},
                          {"tipoEntidade":"Item","idEntidade":"visible-item","nome":"Nome antigo"}
                        ]
                        """,
                },
            },
        };
        Mock<IPageRepository> pages = new();
        pages.Setup(repository => repository.GetByIdAsync(77, null)).ReturnsAsync(page);
        pages.Setup(repository => repository.GetAllAsync(true, null)).ReturnsAsync(new List<Page> { page });
        Mock<IItemRepository> items = new();
        items.Setup(repository => repository.GetByIdAsync("visible-item", WikiEscopo.IdOficial))
            .ReturnsAsync(new GlobalItem { Iditem = "visible-item", Visivel = true });

        PageService service = new(
            pages.Object,
            Mock.Of<IAssetService>(),
            Mock.Of<ICidadeRepository>(),
            Mock.Of<IRacaRepository>(),
            items.Object,
            Mock.Of<IPersonagemRepository>());

        PageDto publicPage = (await service.GetByIdAsync(77, aplicarVisibilidadeDePersonagem: true))!;
        PageDto listedPage = Assert.Single(await service.GetAllAsync(true, ocultarReferenciasInvisiveis: true));
        foreach (PageDto result in new[] { publicPage, listedPage })
        {
            using JsonDocument document = JsonDocument.Parse(JsonSerializer.Serialize(result.Blocks[0].Conteudo));
            JsonElement references = document.RootElement;
            Assert.Equal(5, references.GetArrayLength());
            Assert.Equal(4, references.EnumerateArray().Count(reference =>
                reference.TryGetProperty("oculto", out JsonElement oculto) &&
                oculto.ValueKind == JsonValueKind.True));
            foreach (JsonElement reference in references.EnumerateArray().Take(4))
            {
                Assert.Equal("Oculto", reference.GetProperty("tipoEntidade").GetString());
                Assert.False(reference.TryGetProperty("nome", out _));
                Assert.False(reference.TryGetProperty("imagem", out _));
            }
            Assert.Equal("visible-item", references[4].GetProperty("idEntidade").GetString());
            Assert.False(references[4].TryGetProperty("nome", out _));
            string serialized = document.RootElement.GetRawText();
            Assert.DoesNotContain("Segredo", serialized);
            Assert.DoesNotContain("917238", serialized);
            Assert.DoesNotContain("917239", serialized);
            Assert.DoesNotContain("917240", serialized);
            Assert.DoesNotContain("917241", serialized);
        }
    }

    [Fact]
    public async Task ItemPublicoNaoExpoeIdsDeBaseOuPersonagemOficiaisOcultos()
    {
        Mock<IItemRepository> items = new();
        items.Setup(repository => repository.GetByIdAsync("base-oculta", WikiEscopo.IdOficial))
            .ReturnsAsync(new GlobalItem { Iditem = "base-oculta", Visivel = false });
        Mock<IPersonagemRepository> characters = new();
        characters.Setup(repository => repository.GetByIdAsync(45, WikiEscopo.IdOficial))
            .ReturnsAsync(new Personagen { Idpersonagem = 45, Visivel = false });

        ItemService service = new(
            items.Object,
            characters.Object,
            Mock.Of<IAssetService>(),
            Mock.Of<ISistemaRpgResolver>(),
            Mock.Of<ISistemaEntidadeVinculoService>());
        ItemDto result = await service.SanitizarReferenciasPublicasAsync(new ItemDto
        {
            Iditem = "item-publico",
            Nome = "Item público",
            IditemBase = "base-oculta",
            Idpersonagem = 45,
        });

        Assert.Null(result.IditemBase);
        Assert.Null(result.Idpersonagem);
    }

    [Fact]
    public async Task MestrePodeCompararNpcOcultoDaPropriaMesaSemAcessarOcultoOficial()
    {
        Mock<IWikiMesaService> wikiMesa = new();
        Personagen ownHidden = new()
        {
            Idpersonagem = 81,
            IdWikiEscopo = 25,
            Nome = "Segredo da Mesa",
            Visivel = false,
            StatusJson = "{}",
        };
        wikiMesa.Setup(service => service.GetPersonagensAsync(7, 4, false, false, null))
            .ReturnsAsync(WikiMesaOperacaoResultado<List<Personagen>>.Ok(new List<Personagen> { ownHidden }));
        wikiMesa.Setup(service => service.PodeGerenciarAsync(7, 4, false))
            .ReturnsAsync(WikiMesaOperacaoResultado<bool>.Ok(true));
        wikiMesa.Setup(service => service.GetPersonagemAsync(7, 4, false, 81))
            .ReturnsAsync(WikiMesaOperacaoResultado<Personagen>.Ok(ownHidden));
        wikiMesa.Setup(service => service.GetPersonagemAsync(7, 4, false, 82))
            .ReturnsAsync(WikiMesaOperacaoResultado<Personagen>.Falha(
                WikiMesaOperacaoErro.NaoEncontrado, "Não encontrado"));
        Mock<ISistemaRpgResolver> runtime = new();
        runtime.Setup(service => service.ResolverContextoAsync(It.IsAny<SistemaRuntimeConsultaDto>()))
            .ReturnsAsync(new SistemaRuntimeContextoDto());

        PersonagemComparacaoService service = new(
            Mock.Of<IPersonagemRepository>(),
            Mock.Of<IPersonagemJogadorRepository>(),
            Mock.Of<IMesaService>(),
            runtime.Object,
            wikiMesa.Object);

        PersonagemComparacaoPesquisaResultadoDto search = await service.SearchAsync(
            PersonagemComparacaoOrigem.Npc, null, 7, "Segredo", 4, false);
        Assert.Single(search.Personagens);
        Assert.Equal("Segredo da Mesa", search.Personagens[0].Nome);

        PersonagemComparacaoPesquisaResultadoDto own = await service.GetAsync(
            PersonagemComparacaoOrigem.Npc, 81, 4, false, idMesa: 7);
        Assert.Single(own.Personagens);

        PersonagemComparacaoPesquisaResultadoDto officialHidden = await service.GetAsync(
            PersonagemComparacaoOrigem.Npc, 82, 4, false, idMesa: 7);
        Assert.Empty(officialHidden.Personagens);
    }

    [Fact]
    public async Task EscritaDePaginaAceitaOcultoDoProprioEscopoMasNaoOficialOcultoDeOutraMesa()
    {
        Mock<IPageRepository> pages = new();
        pages.Setup(repository => repository.CreateAsync(It.IsAny<Page>()))
            .ReturnsAsync((Page page) => page);
        Mock<ICidadeRepository> cities = new();
        cities.Setup(repository => repository.GetByIdAsync(11, WikiEscopo.IdOficial))
            .ReturnsAsync(new Cidade { Idcidade = 11, Nome = "Oficial oculto", Visivel = false });
        cities.Setup(repository => repository.GetByIdAsync(12, 25))
            .ReturnsAsync(new Cidade { Idcidade = 12, Nome = "Da Mesa oculto", Visivel = false });

        PageService service = new(
            pages.Object,
            Mock.Of<IAssetService>(),
            cities.Object,
            Mock.Of<IRacaRepository>(),
            Mock.Of<IItemRepository>(),
            Mock.Of<IPersonagemRepository>());

        CreatePageWithBlocksDto page(int cityId) => new()
        {
            Page = new PageDto { Titulo = "Teste", Slug = $"teste-{cityId}", Visivel = true },
            Blocks = new List<PageBlockDto>
            {
                new() { Tipo = PageBlockType.Relation,
                    Conteudo = new { tipoEntidade = "Cidade", idEntidade = cityId } },
            },
        };

        Assert.True((await service.CreateAsync(page(11))).Sucesso);
        Assert.True((await service.CreateAsync(page(12), idWikiEscopo: 25)).Sucesso);
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.CreateAsync(page(11), idWikiEscopo: 25));
    }
}
