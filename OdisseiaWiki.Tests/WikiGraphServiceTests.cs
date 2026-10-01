using System.Text.Json;
using Moq;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Repositories;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class WikiGraphServiceTests
{
    [Fact]
    public async Task GetAsync_MontaTodasAsRelacoesValidasEDeduplicaArestas()
    {
        WikiGraphSnapshot snapshot = new()
        {
            Cities = new[]
            {
                new WikiGraphCityRecord(1, "Loryzon", "cidade.png", true)
            },
            Pages = new[]
            {
                new WikiGraphPageRecord(10, "Insurgencia", "insurgencia", "pagina-10.png", true),
                new WikiGraphPageRecord(11, "Guerra", "guerra", "pagina-11.png", true)
            },
            Characters = new[]
            {
                new WikiGraphCharacterRecord(
                    20,
                    "Zagreus",
                    "zagreus.png",
                    true,
                    30,
                    1,
                    "[21, \"21\", 20, 999]"),
                new WikiGraphCharacterRecord(21, "Gunther", "gunther.png", true, 0, null, null)
            },
            Races = new[]
            {
                new WikiGraphRaceRecord(30, "Elfo", "elfo.png", true)
            },
            PageRelations = new[]
            {
                new WikiGraphPageRelationRecord(
                    10,
                    """
                    [
                      { "tipoEntidade": "Page", "idEntidade": 11 },
                      { "tipoEntidade": "Cidade", "idEntidade": "1" },
                      { "tipoEntidade": "Personagem", "idEntidade": 20 },
                      { "tipoEntidade": "Raca", "idEntidade": 30 },
                      { "tipoEntidade": "Raca", "idEntidade": 30 },
                      { "tipoEntidade": "Item", "idEntidade": 50 },
                      { "tipoEntidade": "Page", "idEntidade": 10 },
                      { "tipoEntidade": "Cidade", "idEntidade": 999 }
                    ]
                    """),
                new WikiGraphPageRelationRecord(
                    11,
                    """{ "tipoEntidade": "Page", "idEntidade": 10 }""")
            }
        };

        (WikiGraphService service, Mock<IWikiGraphRepository> repository) = CreateService(snapshot);

        WikiGraphDto result = await service.GetAsync(includeHiddenMetadata: false);

        Assert.Equal(6, result.Stats.TotalNodes);
        Assert.Equal(7, result.Stats.TotalEdges);
        Assert.Equal(
            new HashSet<string>(StringComparer.Ordinal)
            {
                "Elfo|Zagreus",
                "Loryzon|Zagreus",
                "Gunther|Zagreus",
                "Guerra|Insurgencia",
                "Insurgencia|Loryzon",
                "Insurgencia|Zagreus",
                "Elfo|Insurgencia"
            },
            ReadVisibleEdges(result));
        repository.Verify(item => item.GetSnapshotAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetAsync_EmEmpateSelecionaCidadeVisivelESuprimeArestasDoNoInvisivel()
    {
        WikiGraphSnapshot snapshot = new()
        {
            Cities = new[]
            {
                new WikiGraphCityRecord(1, "Cidade central", null, true)
            },
            Pages = new[]
            {
                new WikiGraphPageRecord(2, "Pagina central", "pagina-central", null, true),
                new WikiGraphPageRecord(3, "Pagina secreta", "pagina-secreta", null, false)
            },
            Characters = new[]
            {
                new WikiGraphCharacterRecord(4, "Personagem", null, true, 5, 1, null)
            },
            Races = new[]
            {
                new WikiGraphRaceRecord(5, "Raca A", null, true),
                new WikiGraphRaceRecord(6, "Raca B", null, true)
            },
            PageRelations = new[]
            {
                new WikiGraphPageRelationRecord(2, """{ "tipoEntidade": "Raca", "idEntidade": 6 }"""),
                new WikiGraphPageRelationRecord(
                    3,
                    """
                    [
                      { "tipoEntidade": "Page", "idEntidade": 2 },
                      { "tipoEntidade": "Raca", "idEntidade": 5 },
                      { "tipoEntidade": "Raca", "idEntidade": 6 },
                      { "tipoEntidade": "Cidade", "idEntidade": 1 }
                    ]
                    """)
            }
        };

        (WikiGraphService service, _) = CreateService(snapshot);

        WikiGraphDto result = await service.GetAsync(includeHiddenMetadata: false);

        WikiGraphNodeDto central = Assert.Single(result.Nodes, node => node.GraphId == result.CentralNodeId);
        Assert.False(central.Hidden);
        Assert.Equal("city", central.EntityType);
        Assert.Equal("Cidade central", central.Title);

        Assert.DoesNotContain(result.Nodes, node => node.Hidden);
    }

    [Fact]
    public async Task GetAsync_RepresentaNoInvisivelConectadoSemExporMetadados()
    {
        WikiGraphSnapshot snapshot = new()
        {
            Cities = new[]
            {
                new WikiGraphCityRecord(73, "SEGREDO-CIDADE-73", "SEGREDO-IMAGEM-73.png", false)
            },
            Characters = new[]
            {
                new WikiGraphCharacterRecord(20, "Personagem publico", null, true, 80, 73, null)
            },
            Races = new[]
            {
                new WikiGraphRaceRecord(80, "Raca publica", null, true)
            }
        };

        (WikiGraphService service, _) = CreateService(snapshot);

        WikiGraphDto result = await service.GetAsync(includeHiddenMetadata: false);

        WikiGraphNodeDto hidden = Assert.Single(result.Nodes, node => node.Hidden);
        Assert.Null(hidden.EntityType);
        Assert.Null(hidden.Title);
        Assert.Null(hidden.Image);
        Assert.Null(hidden.Route);
        Assert.Contains(result.Edges, edge => edge.Source == hidden.GraphId || edge.Target == hidden.GraphId);

        string json = JsonSerializer.Serialize(hidden);
        using JsonDocument document = JsonDocument.Parse(json);
        HashSet<string> serializedProperties = document.RootElement
            .EnumerateObject()
            .Select(property => property.Name)
            .ToHashSet(StringComparer.Ordinal);

        Assert.Equal(
            new HashSet<string>(StringComparer.Ordinal) { "graphId", "hidden" },
            serializedProperties);
        Assert.NotEqual("73", hidden.GraphId);
        Assert.DoesNotContain("SEGREDO", json, StringComparison.Ordinal);
    }

    [Fact]
    public async Task GetAsync_NaoRevelaPersonagemOcultoSemConexaoPublica()
    {
        WikiGraphSnapshot snapshot = new()
        {
            Characters = new[]
            {
                new WikiGraphCharacterRecord(91, "PERSONAGEM-OCULTO", "segredo.png", false, 0, null, null)
            }
        };

        (WikiGraphService service, _) = CreateService(snapshot);

        WikiGraphDto result = await service.GetAsync(includeHiddenMetadata: false);

        Assert.Empty(result.Nodes);
        Assert.Empty(result.Edges);
        Assert.DoesNotContain("PERSONAGEM-OCULTO", JsonSerializer.Serialize(result), StringComparison.Ordinal);
    }

    [Fact]
    public async Task GetAsync_SemCidadeOuPaginaVisivelNaoDefineNoCentral()
    {
        WikiGraphSnapshot snapshot = new()
        {
            Cities = new[]
            {
                new WikiGraphCityRecord(1, "Cidade oculta", null, false)
            },
            Pages = new[]
            {
                new WikiGraphPageRecord(2, "Pagina oculta", "pagina-oculta", null, false)
            },
            Characters = new[]
            {
                new WikiGraphCharacterRecord(3, "Personagem publico", null, true, 4, 1, null)
            },
            Races = new[]
            {
                new WikiGraphRaceRecord(4, "Raca publica", null, true)
            }
        };

        (WikiGraphService service, _) = CreateService(snapshot);

        WikiGraphDto result = await service.GetAsync(includeHiddenMetadata: false);

        Assert.Null(result.CentralNodeId);
        Assert.Equal(3, result.Stats.TotalNodes);
        Assert.Equal(2, result.Edges.Count);
    }

    [Fact]
    public async Task GetAsync_ConsolidaEntidadesDuplicadasERemapeiaSuasConexoes()
    {
        WikiGraphSnapshot snapshot = new()
        {
            Cities = new[]
            {
                new WikiGraphCityRecord(1, "Lóryzon", null, true),
                new WikiGraphCityRecord(2, "loryzon", null, true)
            },
            Pages = new[]
            {
                new WikiGraphPageRecord(10, "A Guerra", "A Guerra", null, true),
                new WikiGraphPageRecord(11, "A guerra duplicada", "a guerra", null, true)
            },
            Characters = new[]
            {
                new WikiGraphCharacterRecord(20, " ZÁGREUS ", null, true, 30, 1, "[21]"),
                new WikiGraphCharacterRecord(21, "zágreus", null, true, 31, 2, "[20]")
            },
            Races = new[]
            {
                new WikiGraphRaceRecord(30, "Élfo", null, true),
                new WikiGraphRaceRecord(31, "elfo", null, true)
            },
            PageRelations = new[]
            {
                new WikiGraphPageRelationRecord(
                    10,
                    """
                    [
                      { "tipoEntidade": "Personagem", "idEntidade": 20 },
                      { "tipoEntidade": "Page", "idEntidade": 11 }
                    ]
                    """),
                new WikiGraphPageRelationRecord(
                    11,
                    """
                    [
                      { "tipoEntidade": "Personagem", "idEntidade": 21 },
                      { "tipoEntidade": "Page", "idEntidade": 10 }
                    ]
                    """)
            }
        };

        (WikiGraphService service, _) = CreateService(snapshot);

        WikiGraphDto result = await service.GetAsync(includeHiddenMetadata: false);

        Assert.Equal(4, result.Stats.TotalNodes);
        Assert.Equal(3, result.Stats.TotalEdges);
        Assert.Single(result.Nodes, node => node.EntityType == "city");
        Assert.Single(result.Nodes, node => node.EntityType == "page");
        Assert.Single(result.Nodes, node => node.EntityType == "character");
        Assert.Single(result.Nodes, node => node.EntityType == "race");
        Assert.Contains(result.Nodes, node => node.Route == "/cidade/1");
        Assert.Contains(result.Nodes, node => node.Route == "/wiki/A%20Guerra");
        Assert.Contains(result.Nodes, node => node.Route == "/personagem/20");
        Assert.Contains(result.Nodes, node => node.Route == "/raca/30");
    }

    [Fact]
    public async Task GetAsync_RemoveSomentePersonagensSemConexoes()
    {
        WikiGraphSnapshot snapshot = new()
        {
            Cities = new[]
            {
                new WikiGraphCityRecord(1, "Cidade órfã", null, true)
            },
            Pages = new[]
            {
                new WikiGraphPageRecord(2, "Página órfã", "pagina-orfa", null, true)
            },
            Characters = new[]
            {
                new WikiGraphCharacterRecord(4, "Personagem órfão", null, true, 999, null, null),
                new WikiGraphCharacterRecord(5, "Personagem conectado", null, true, 3, null, null)
            },
            Races = new[]
            {
                new WikiGraphRaceRecord(3, "Raça conectada", null, true),
                new WikiGraphRaceRecord(6, "Raça órfã", null, true)
            }
        };

        (WikiGraphService service, _) = CreateService(snapshot);

        WikiGraphDto result = await service.GetAsync(includeHiddenMetadata: false);

        Assert.Equal(5, result.Stats.TotalNodes);
        Assert.Single(result.Edges);
        Assert.DoesNotContain(result.Nodes, node => node.Title == "Personagem órfão");
        Assert.Contains(result.Nodes, node => node.Title == "Personagem conectado");
        Assert.Contains(result.Nodes, node => node.Title == "Cidade órfã");
        Assert.Contains(result.Nodes, node => node.Title == "Página órfã");
        Assert.Contains(result.Nodes, node => node.Title == "Raça órfã");
    }

    [Fact]
    public async Task GetAsync_AdminRecebeMetadadosReaisDoNoInvisivel()
    {
        WikiGraphSnapshot snapshot = new()
        {
            Cities = new[]
            {
                new WikiGraphCityRecord(73, "Cidade secreta", "cidade-secreta.png", false)
            },
            Characters = new[]
            {
                new WikiGraphCharacterRecord(20, "Personagem público", null, true, 80, 73, null)
            },
            Races = new[]
            {
                new WikiGraphRaceRecord(80, "Raça pública", null, true)
            }
        };

        (WikiGraphService service, _) = CreateService(snapshot);

        WikiGraphDto result = await service.GetAsync(includeHiddenMetadata: true);

        WikiGraphNodeDto hidden = Assert.Single(result.Nodes, node => node.Hidden);
        Assert.Equal("city", hidden.EntityType);
        Assert.Equal("Cidade secreta", hidden.Title);
        Assert.Equal("cidade-secreta.png", hidden.Image);
        Assert.Equal("/cidade/73", hidden.Route);
        Assert.Contains(result.Edges, edge => edge.Source == hidden.GraphId || edge.Target == hidden.GraphId);
    }

    [Fact]
    public async Task GetAsync_OcultaMetadadosELigacoesDoPersonagemConformeVisibilidadeGranular()
    {
        WikiGraphSnapshot snapshot = new()
        {
            Cities = new[]
            {
                new WikiGraphCityRecord(1, "Cidade privada", "cidade.png", true)
            },
            Pages = new[]
            {
                new WikiGraphPageRecord(2, "Página pública", "pagina-publica", null, true)
            },
            Characters = new[]
            {
                new WikiGraphCharacterRecord(
                    3,
                    "NOME-PRIVADO",
                    "IMAGEM-PRIVADA.png",
                    true,
                    4,
                    1,
                    "[5]",
                    NomeVisivel: false,
                    ImagemVisivel: false,
                    RacaVisivel: false,
                    CidadeVisivel: false,
                    PersonagensRelacionadosVisivel: true),
                new WikiGraphCharacterRecord(5, "Outro personagem", null, true, 0, null, null)
            },
            Races = new[]
            {
                new WikiGraphRaceRecord(4, "Raça privada", null, true)
            },
            PageRelations = new[]
            {
                new WikiGraphPageRelationRecord(
                    2,
                    """{ "tipoEntidade": "Personagem", "idEntidade": 3 }""")
            }
        };

        (WikiGraphService service, _) = CreateService(snapshot);

        WikiGraphDto result = await service.GetAsync(includeHiddenMetadata: false);

        WikiGraphNodeDto personagem = Assert.Single(result.Nodes, node => node.Route == "/personagem/3");
        Assert.False(personagem.Hidden);
        Assert.Equal("Conteúdo sem título", personagem.Title);
        Assert.Null(personagem.Image);

        string json = JsonSerializer.Serialize(result);
        Assert.DoesNotContain("NOME-PRIVADO", json, StringComparison.Ordinal);
        Assert.DoesNotContain("IMAGEM-PRIVADA", json, StringComparison.Ordinal);

        Assert.Single(result.Edges, edge =>
            edge.Source == personagem.GraphId || edge.Target == personagem.GraphId);
        Assert.DoesNotContain(result.Nodes, node => node.Route == "/personagem/5");
    }

    [Fact]
    public async Task GetComContextoAsync_RestringeGrafoAoCatalogoEfetivoDaMesa()
    {
        WikiGraphSnapshot snapshot = new()
        {
            Cities = new[]
            {
                new WikiGraphCityRecord(1, "Oficial compatÃ­vel", null, true, 1, 10),
                new WikiGraphCityRecord(2, "PrÃ³pria da Mesa", null, true, 25, 999),
                new WikiGraphCityRecord(3, "Oficial de outro sistema", null, true, 1, 11),
                new WikiGraphCityRecord(4, "De outra Mesa", null, true, 26, 10),
            },
        };
        Mock<IWikiGraphRepository> repository = new(MockBehavior.Strict);
        repository
            .Setup(item => item.GetSnapshotAsync(
                It.Is<IReadOnlyCollection<int>>(scopes => scopes.Contains(1) && scopes.Contains(25)),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);
        WikiGraphService service = new(repository.Object);

        WikiGraphDto graph = await service.GetComContextoAsync(
            includeHiddenMetadata: false,
            idWikiEscopos: new[] { 1, 25 },
            mesaRoutePrefix: "/mesa/7/wiki",
            idWikiEscopoMesa: 25,
            idSistemaRpg: 10,
            idSistemaVersao: 3);

        Assert.Equal(2, graph.Nodes.Count);
        Assert.Contains(graph.Nodes, node => node.Title == "Oficial compatÃ­vel" && node.Route == "/mesa/7/wiki/cidade/1");
        Assert.Contains(graph.Nodes, node => node.Title == "PrÃ³pria da Mesa" && node.Route == "/mesa/7/wiki/cidade/2");
        Assert.DoesNotContain(graph.Nodes, node => node.Title is "Oficial de outro sistema" or "De outra Mesa");
    }

    [Fact]
    public async Task GetComContextoAsync_ComEscopoExclusivoDaMesaNaoIncluiEntidadesOficiais()
    {
        WikiGraphSnapshot snapshot = new()
        {
            Cities = new[]
            {
                new WikiGraphCityRecord(1, "Oficial", null, true, 1, 10),
                new WikiGraphCityRecord(2, "Da Mesa", null, true, 25, 10),
            },
        };
        Mock<IWikiGraphRepository> repository = new(MockBehavior.Strict);
        repository
            .Setup(item => item.GetSnapshotAsync(
                It.Is<IReadOnlyCollection<int>>(scopes => scopes.Count == 1 && scopes.Contains(25)),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);
        WikiGraphService service = new(repository.Object);

        WikiGraphDto graph = await service.GetComContextoAsync(
            includeHiddenMetadata: false,
            idWikiEscopos: new[] { 25 },
            mesaRoutePrefix: "/mesa/7/wiki",
            idWikiEscopoMesa: 25,
            idSistemaRpg: 10,
            idSistemaVersao: 3);

        WikiGraphNodeDto node = Assert.Single(graph.Nodes);
        Assert.Equal("Da Mesa", node.Title);
        Assert.Equal("/mesa/7/wiki/cidade/2", node.Route);
    }

    [Fact]
    public async Task MestreVeOcultoProprioMasRecebeOcultoOficialApenasComoPlaceholder()
    {
        WikiGraphSnapshot snapshot = new()
        {
            Cities = new[]
            {
                new WikiGraphCityRecord(1, "Segredo oficial", null, false, 1, 10),
                new WikiGraphCityRecord(2, "Segredo da Mesa", null, false, 25, 10),
            },
            Characters = new[]
            {
                new WikiGraphCharacterRecord(9, "Pessoa da Mesa", null, true, 0, 1, null,
                    IdWikiEscopo: 25, IdSistemaRpg: 10),
            },
        };
        Mock<IWikiGraphRepository> repository = new(MockBehavior.Strict);
        repository.Setup(item => item.GetSnapshotAsync(
                It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);
        WikiGraphService service = new(repository.Object);

        WikiGraphDto graph = await service.GetComContextoAsync(
            includeHiddenMetadata: false,
            idWikiEscopos: new[] { 1, 25 },
            mesaRoutePrefix: "/mesa/7/wiki",
            idWikiEscopoMesa: 25,
            idSistemaRpg: 10,
            permitirOcultosDaMesa: true);

        Assert.Contains(graph.Nodes, node => node.Hidden && node.Title == "Segredo da Mesa" &&
            node.Route == "/mesa/7/wiki/cidade/2");
        Assert.Contains(graph.Nodes, node => node.Hidden && node.Title is null &&
            node.Route is null && node.EntityType is null);
        Assert.DoesNotContain("Segredo oficial", System.Text.Json.JsonSerializer.Serialize(graph));
    }

    private static (WikiGraphService Service, Mock<IWikiGraphRepository> Repository) CreateService(
        WikiGraphSnapshot snapshot)
    {
        Mock<IWikiGraphRepository> repository = new(MockBehavior.Strict);
        repository
            .Setup(item => item.GetSnapshotAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);

        return (new WikiGraphService(repository.Object), repository);
    }

    private static HashSet<string> ReadVisibleEdges(WikiGraphDto graph)
    {
        Dictionary<string, string> titleByGraphId = graph.Nodes
            .Where(node => !node.Hidden && node.Title is not null)
            .ToDictionary(node => node.GraphId, node => node.Title!);

        return graph.Edges
            .Select(edge => new[] { titleByGraphId[edge.Source], titleByGraphId[edge.Target] })
            .Select(titles => string.Join('|', titles.OrderBy(title => title, StringComparer.Ordinal)))
            .ToHashSet(StringComparer.Ordinal);
    }
}
