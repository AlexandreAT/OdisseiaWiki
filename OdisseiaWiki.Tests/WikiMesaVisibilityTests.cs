using Moq;
using System.Text.Json;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Services;
using OdisseiaWiki.Services.Interfaces;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class WikiMesaVisibilityTests
{
    private const int MesaId = 42;
    private const int MestreId = 99;
    private const int EscopoMesaId = 77;

    [Fact]
    public async Task MestreNaoPodeLerPersonagemOficialOcultoPorId()
    {
        Mock<IPersonagemService> personagens = new();
        personagens
            .Setup(item => item.GetByIdAsync(12, EscopoMesaId))
            .ReturnsAsync((Personagen?)null);
        personagens
            .Setup(item => item.GetByIdAsync(12, WikiEscopo.IdOficial))
            .ReturnsAsync(new Personagen
            {
                Idpersonagem = 12,
                Nome = "NPC oculto",
                Visivel = false,
                IdWikiEscopo = WikiEscopo.IdOficial,
            });

        WikiMesaService service = CreateService(personagens: personagens.Object);

        WikiMesaOperacaoResultado<Personagen> result = await service.GetPersonagemAsync(
            MesaId, MestreId, admin: false, 12);

        Assert.False(result.Sucesso);
        Assert.Equal(WikiMesaOperacaoErro.NaoEncontrado, result.Erro);
    }

    [Fact]
    public async Task MestreRecebePersonagemOficialVisivelComCamposRestritosProjetados()
    {
        Mock<IPersonagemService> personagens = new();
        personagens.Setup(item => item.GetByIdAsync(12, EscopoMesaId)).ReturnsAsync((Personagen?)null);
        personagens.Setup(item => item.GetByIdAsync(12, WikiEscopo.IdOficial)).ReturnsAsync(new Personagen
        {
            Idpersonagem = 12,
            IdWikiEscopo = WikiEscopo.IdOficial,
            Nome = "NPC público",
            Visivel = true,
            StatusJson = "{}",
            PersonagemsVinculados = "[33]",
            Idpassiva = 44,
            Ultimate = "Poder secreto",
            Visibilidade = new PersonagemVisibilidadeDto
            {
                Nome = true,
                PersonagensRelacionados = false,
                Passivas = false,
                Ultimate = false
            }
        });

        WikiMesaService service = CreateService(personagens: personagens.Object);
        WikiMesaOperacaoResultado<Personagen> result = await service.GetPersonagemAsync(
            MesaId, MestreId, admin: false, 12);

        Assert.True(result.Sucesso);
        Assert.True(result.Dados!.VisibilidadeProjetada);
        Assert.Null(result.Dados.PersonagemsVinculados);
        Assert.Null(result.Dados.Idpassiva);
        Assert.Null(result.Dados.Ultimate);
    }

    [Fact]
    public async Task PersonagemVisivelNaoExpoeIdsDeRacaCidadeEPersonagemOficiaisOcultos()
    {
        Mock<IPersonagemService> personagens = new();
        personagens.Setup(item => item.GetByIdAsync(12, EscopoMesaId)).ReturnsAsync((Personagen?)null);
        personagens.Setup(item => item.GetByIdAsync(12, WikiEscopo.IdOficial)).ReturnsAsync(new Personagen
        {
            Idpersonagem = 12,
            IdWikiEscopo = WikiEscopo.IdOficial,
            Nome = "NPC público",
            Visivel = true,
            Idraca = 7,
            Idcidade = 55,
            StatusJson = "{}",
            PersonagemsVinculados = "[33]",
            Visibilidade = PersonagemVisibilidadeDefaults.Jogador()
        });
        personagens.Setup(item => item.GetByIdAsync(33, EscopoMesaId)).ReturnsAsync((Personagen?)null);
        personagens.Setup(item => item.GetByIdAsync(33, WikiEscopo.IdOficial)).ReturnsAsync(new Personagen
        {
            Idpersonagem = 33,
            IdWikiEscopo = WikiEscopo.IdOficial,
            Nome = "NPC secreto",
            Visivel = false
        });

        Mock<IRacaService> racas = new();
        racas.Setup(item => item.GetByIdAsync(7, MesaId, EscopoMesaId)).ReturnsAsync((RacaDto?)null);
        racas.Setup(item => item.GetByIdAsync(7, MesaId, WikiEscopo.IdOficial)).ReturnsAsync(new RacaDto
        {
            Idraca = 7,
            Nome = "Raça secreta",
            Visivel = false
        });

        Mock<ICidadeService> cidades = new();
        cidades.Setup(item => item.GetByIdAsync(55, EscopoMesaId)).ReturnsAsync((CidadeDto?)null);
        cidades.Setup(item => item.GetByIdAsync(55, WikiEscopo.IdOficial)).ReturnsAsync(new CidadeDto
        {
            Idcidade = 55,
            Nome = "Cidade secreta",
            Visivel = false
        });

        WikiMesaService service = CreateService(personagens: personagens.Object, racas: racas.Object, cidades: cidades.Object);
        WikiMesaOperacaoResultado<Personagen> result = await service.GetPersonagemAsync(
            MesaId, MestreId, admin: false, 12);

        Assert.True(result.Sucesso);
        Assert.Equal(0, result.Dados!.Idraca);
        Assert.Null(result.Dados.Idcidade);
        Assert.Equal("[]", result.Dados.PersonagemsVinculados);
    }

    [Fact]
    public async Task MestreNaoPodeUsarRacaOficialOcultaComoReferencia()
    {
        Mock<IRacaService> racas = new();
        racas
            .Setup(item => item.GetByIdAsync(7, MesaId, EscopoMesaId))
            .ReturnsAsync((RacaDto?)null);
        racas
            .Setup(item => item.GetByIdAsync(7, MesaId, WikiEscopo.IdOficial))
            .ReturnsAsync(new RacaDto
            {
                Idraca = 7,
                Nome = "Raça oculta",
                Visivel = false,
            });

        WikiMesaService service = CreateService(racas: racas.Object);

        WikiMesaOperacaoResultado<ResultPersonagem> result = await service.CriarPersonagemAsync(
            MesaId,
            MestreId,
            admin: false,
            new PersonagemDto { Idraca = 7 });

        Assert.False(result.Sucesso);
        Assert.Equal(WikiMesaOperacaoErro.Validacao, result.Erro);
    }

    [Fact]
    public async Task ListaDePaginasNaoExpoeReferenciaOficialOculta()
    {
        Mock<IPageService> paginas = new();
        paginas.Setup(item => item.GetAllAsync(null, EscopoMesaId, false)).ReturnsAsync(new List<PageDto>
        {
            new()
            {
                IdPage = 1,
                Titulo = "Página da Mesa",
                Slug = "pagina-da-mesa",
                Visivel = true,
                Blocks = new List<PageBlockDto>
                {
                    new()
                    {
                        Tipo = PageBlockType.Relation,
                        Conteudo = JsonSerializer.SerializeToElement(new[]
                        {
                            new { tipoEntidade = "cidade", idEntidade = "55", nome = "Cidade secreta" }
                        })
                    }
                }
            }
        });
        paginas.Setup(item => item.GetAllAsync(true, WikiEscopo.IdOficial, false)).ReturnsAsync(new List<PageDto>());

        Mock<ICidadeService> cidades = new();
        cidades.Setup(item => item.GetByIdAsync(55, EscopoMesaId)).ReturnsAsync((CidadeDto?)null);
        cidades.Setup(item => item.GetByIdAsync(55, WikiEscopo.IdOficial)).ReturnsAsync(new CidadeDto
        {
            Idcidade = 55,
            Nome = "Cidade secreta",
            Visivel = false
        });

        WikiMesaService service = CreateService(paginas: paginas.Object, cidades: cidades.Object);
        WikiMesaOperacaoResultado<List<PageDto>> result = await service.GetPaginasAsync(
            MesaId, MestreId, admin: false, somenteProprias: false, visivel: null);

        Assert.True(result.Sucesso);
        string conteudo = JsonSerializer.Serialize(result.Dados![0].Blocks[0].Conteudo);
        Assert.Contains("\"oculto\":true", conteudo);
        Assert.DoesNotContain("\"idEntidade\":\"55\"", conteudo);
        Assert.DoesNotContain("Cidade secreta", JsonSerializer.Serialize(result.Dados));
    }

    [Fact]
    public async Task ConsultaDePaginasReferenciandoIdOficialOcultoNaoRevelaRelacoes()
    {
        Mock<IPageService> paginas = new();
        Mock<ICidadeService> cidades = new();
        cidades.Setup(item => item.GetByIdAsync(55, EscopoMesaId)).ReturnsAsync((CidadeDto?)null);
        cidades.Setup(item => item.GetByIdAsync(55, WikiEscopo.IdOficial)).ReturnsAsync(new CidadeDto
        {
            Idcidade = 55,
            Nome = "Cidade secreta",
            Visivel = false
        });

        WikiMesaService service = CreateService(paginas: paginas.Object, cidades: cidades.Object);
        WikiMesaOperacaoResultado<List<PageDto>> result = await service.GetPaginasReferenciandoAsync(
            MesaId, MestreId, admin: false, "cidade", "55", visivel: null);

        Assert.True(result.Sucesso);
        Assert.Empty(result.Dados!);
        paginas.Verify(item => item.GetReferencingAsync(
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<bool?>(), It.IsAny<bool>(), It.IsAny<int?>()), Times.Never);
    }

    [Fact]
    public async Task MestreNaoPodeCriarRelacaoComPaginaOficialOculta()
    {
        Mock<IPageService> paginas = new();
        paginas.Setup(item => item.GetByIdAsync(88, false, EscopoMesaId)).ReturnsAsync((PageDto?)null);
        paginas.Setup(item => item.GetByIdAsync(88, false, WikiEscopo.IdOficial)).ReturnsAsync(new PageDto
        {
            IdPage = 88,
            Titulo = "Página secreta",
            Slug = "pagina-secreta",
            Visivel = false
        });

        WikiMesaService service = CreateService(paginas: paginas.Object);
        WikiMesaOperacaoResultado<ResultPage> result = await service.CriarPaginaAsync(
            MesaId, MestreId, admin: false, new CreatePageWithBlocksDto
            {
                Page = new PageDto { Titulo = "Nova página", Slug = "nova-pagina" },
                Blocks = new List<PageBlockDto>
                {
                    new()
                    {
                        Tipo = PageBlockType.Relation,
                        Conteudo = JsonSerializer.SerializeToElement(new[]
                        {
                            new { tipoEntidade = "page", idEntidade = "88" }
                        })
                    }
                }
            });

        Assert.False(result.Sucesso);
        Assert.Equal(WikiMesaOperacaoErro.Validacao, result.Erro);
        paginas.Verify(item => item.CreateAsync(
            It.IsAny<CreatePageWithBlocksDto>(), It.IsAny<int?>(), It.IsAny<int?>()), Times.Never);
    }

    [Fact]
    public async Task ItemVisivelNaoExpoeIdDeItemBaseOficialOculto()
    {
        Mock<IItemService> itens = new();
        itens.Setup(item => item.GetByIdAsync("visivel", EscopoMesaId)).ReturnsAsync((ItemDto?)null);
        itens.Setup(item => item.GetByIdAsync("visivel", WikiEscopo.IdOficial)).ReturnsAsync(new ItemDto
        {
            Iditem = "visivel",
            Nome = "Item público",
            Visivel = true,
            IditemBase = "secreto"
        });
        itens.Setup(item => item.GetByIdAsync("secreto", EscopoMesaId)).ReturnsAsync((ItemDto?)null);
        itens.Setup(item => item.GetByIdAsync("secreto", WikiEscopo.IdOficial)).ReturnsAsync(new ItemDto
        {
            Iditem = "secreto",
            Nome = "Item secreto",
            Visivel = false
        });

        WikiMesaService service = CreateService(itens: itens.Object);
        WikiMesaOperacaoResultado<ItemDto> result = await service.GetItemAsync(
            MesaId, MestreId, admin: false, "visivel");

        Assert.True(result.Sucesso);
        Assert.Null(result.Dados!.IditemBase);
    }

    private static WikiMesaService CreateService(
        IPersonagemService? personagens = null,
        IRacaService? racas = null,
        IPageService? paginas = null,
        ICidadeService? cidades = null,
        IItemService? itens = null)
    {
        Mock<IMesaService> mesas = new();
        mesas.Setup(item => item.GetByIdAsync(MesaId)).ReturnsAsync(new Mesa { Idmesa = MesaId });
        mesas.Setup(item => item.IsOwnerAsync(MesaId, MestreId)).ReturnsAsync(true);

        Mock<IWikiEscopoService> escopos = new();
        escopos.Setup(item => item.EnsureMesaAsync(MesaId, It.IsAny<CancellationToken>())).ReturnsAsync(
            new WikiEscopo { IdWikiEscopo = EscopoMesaId, Chave = "MESA:42" });

        Mock<ISistemaRpgResolver> sistemas = new();
        sistemas.Setup(item => item.ResolverAsync(MesaId)).ReturnsAsync(new SistemaResolvidoDto());

        return new WikiMesaService(
            mesas.Object,
            escopos.Object,
            sistemas.Object,
            paginas ?? Mock.Of<IPageService>(),
            cidades ?? Mock.Of<ICidadeService>(),
            racas ?? Mock.Of<IRacaService>(),
            personagens ?? Mock.Of<IPersonagemService>(),
            itens ?? Mock.Of<IItemService>(),
            Mock.Of<IWikiGraphService>());
    }
}
