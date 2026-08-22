using Moq;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services;
using OdisseiaWiki.Services.Interfaces;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class PersonagemComparacaoServiceTests
{
    [Fact]
    public async Task SearchAsync_JogadorSemAutenticacaoNaoExpoePersonagensDaMesa()
    {
        TestContext context = CreateContext();
        context.Players.Setup(repository => repository.GetTableIdAsync(10)).ReturnsAsync(3);

        PersonagemComparacaoPesquisaResultadoDto result = await context.Service.SearchAsync(
            PersonagemComparacaoOrigem.Jogador,
            10,
            null,
            "ana",
            null,
            administrador: false);

        Assert.False(result.AcessoPermitido);
        Assert.Empty(result.Personagens);
        context.Npcs.Verify(repository => repository.SearchVisibleForComparisonAsync(
            It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<int>()), Times.Never);
        context.Players.Verify(repository => repository.SearchTableForComparisonAsync(
            It.IsAny<int>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task SearchAsync_JogadorSemAcessoNaoConsultaOutraMesa()
    {
        TestContext context = CreateContext();
        context.Players.Setup(repository => repository.GetTableIdAsync(10)).ReturnsAsync(8);
        context.Tables.Setup(service => service.CanUseAsync(8, 22)).ReturnsAsync(false);

        PersonagemComparacaoPesquisaResultadoDto result = await context.Service.SearchAsync(
            PersonagemComparacaoOrigem.Jogador,
            10,
            8,
            "ana",
            22,
            administrador: false);

        Assert.False(result.AcessoPermitido);
        Assert.Empty(result.Personagens);
        context.Npcs.Verify(repository => repository.SearchVisibleForComparisonAsync(
            It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<int>()), Times.Never);
        context.Players.Verify(repository => repository.SearchTableForComparisonAsync(
            It.IsAny<int>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task SearchAsync_JogadorPesquisaApenasNaMesaPersistidaEIncluiNpcsVisiveis()
    {
        TestContext context = CreateContext();
        context.Players.Setup(repository => repository.GetTableIdAsync(10)).ReturnsAsync(7);
        context.Tables.Setup(service => service.CanUseAsync(7, 22)).ReturnsAsync(true);
        context.Npcs.Setup(repository => repository.SearchVisibleForComparisonAsync("teste", null, 12))
            .ReturnsAsync(new List<PersonagemComparacaoRegistro> { Npc(2, "NPC Teste") });
        context.Players.Setup(repository => repository.SearchTableForComparisonAsync(7, "teste", 10, 12))
            .ReturnsAsync(new List<PersonagemComparacaoRegistro> { Player(11, 7, "Jogador Teste") });
        SetupRuntime(context);

        PersonagemComparacaoPesquisaResultadoDto result = await context.Service.SearchAsync(
            PersonagemComparacaoOrigem.Jogador,
            10,
            999,
            "teste",
            22,
            administrador: false);

        Assert.True(result.AcessoPermitido);
        Assert.Equal(2, result.Personagens.Count);
        Assert.Contains(result.Personagens, character => character.Origem == PersonagemComparacaoOrigem.Npc);
        Assert.Contains(result.Personagens, character => character.Origem == PersonagemComparacaoOrigem.Jogador);
        context.Players.Verify(repository => repository.SearchTableForComparisonAsync(7, "teste", 10, 12), Times.Once);
    }

    [Fact]
    public async Task SearchAsync_NpcNaoConsultaPersonagensDeJogador()
    {
        TestContext context = CreateContext();
        context.Npcs.Setup(repository => repository.SearchVisibleForComparisonAsync("npc", 5, 12))
            .ReturnsAsync(new List<PersonagemComparacaoRegistro>());

        PersonagemComparacaoPesquisaResultadoDto result = await context.Service.SearchAsync(
            PersonagemComparacaoOrigem.Npc,
            5,
            null,
            "npc",
            null,
            administrador: false);

        Assert.True(result.AcessoPermitido);
        context.Players.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetAsync_NpcPublicoExigeVisibilidadeEnquantoAdministradorPodeGerenciar()
    {
        TestContext context = CreateContext();
        context.Npcs.Setup(repository => repository.GetForComparisonAsync(5, true))
            .ReturnsAsync((PersonagemComparacaoRegistro?)null);
        context.Npcs.Setup(repository => repository.GetForComparisonAsync(5, false))
            .ReturnsAsync(Npc(5, "NPC oculto"));
        SetupRuntime(context);

        PersonagemComparacaoPesquisaResultadoDto publicResult = await context.Service.GetAsync(
            PersonagemComparacaoOrigem.Npc,
            5,
            null,
            administrador: false);
        PersonagemComparacaoPesquisaResultadoDto adminResult = await context.Service.GetAsync(
            PersonagemComparacaoOrigem.Npc,
            5,
            1,
            administrador: true);

        Assert.Empty(publicResult.Personagens);
        Assert.Single(adminResult.Personagens);
        context.Npcs.Verify(repository => repository.GetForComparisonAsync(5, true), Times.Once);
        context.Npcs.Verify(repository => repository.GetForComparisonAsync(5, false), Times.Once);
    }

    [Fact]
    public async Task GetAsync_ConverteSomenteOsDadosMecanicosNecessarios()
    {
        TestContext context = CreateContext();
        PersonagemComparacaoRegistro record = Npc(8, "Mecânico");
        record.StatusJson = """
            {"status":{"vida":900,"vidaMaxima":1200,"estaminaMaxima":80,"manaMaxima":45},
             "atributos":{"principais":{"resistencia":3,"agilidade":4,"sabedoria":2,"precisao":5,"forca":1}},
             "nivel":6,"defesas":{"escudo":20,"protecao":30,"armadura":10,"outras":2}}
            """;
        record.SkillsJson = "[{\"nome\":\"A\"},{\"nome\":\"\"},{\"nome\":\"B\"}]";
        record.ConfiguracaoVisibilidade = PersonagemVisibilidadeDefaults.CreateEntity(
            idPersonagem: 8,
            idPersonagemJogador: null,
            dto: PersonagemVisibilidadeDefaults.Jogador());
        context.Npcs.Setup(repository => repository.GetForComparisonAsync(8, true)).ReturnsAsync(record);
        SetupRuntime(context);

        PersonagemComparacaoPesquisaResultadoDto result = await context.Service.GetAsync(
            PersonagemComparacaoOrigem.Npc,
            8,
            null,
            administrador: false);

        PersonagemComparacaoDto character = Assert.Single(result.Personagens);
        Assert.Equal(1200, character.Status.Vida);
        Assert.Equal(5, character.Status.Precisao);
        Assert.Equal(30, character.Status.Protecao);
        Assert.Equal(6, character.Status.Nivel);
        Assert.Equal(2, character.QuantidadeSkills);
        Assert.Equal("Odisseia", character.SistemaRuntime?.NomeSistema);
        Assert.Empty(character.SistemaRuntime?.Escalas ?? []);
    }

    [Fact]
    public async Task GetAsync_ResumeSomenteAsEscalasDoRadarDoSistemaEfetivo()
    {
        TestContext context = CreateContext();
        context.Npcs.Setup(repository => repository.GetForComparisonAsync(9, true))
            .ReturnsAsync(Npc(9, "Escalas"));
        context.Resolver.Setup(resolver => resolver.ResolverContextoAsync(It.IsAny<SistemaRuntimeConsultaDto>()))
            .ReturnsAsync(new SistemaRuntimeContextoDto
            {
                IdSistemaRpg = 3,
                IdSistemaVersao = 4,
                CodigoSistema = "TESTE",
                NumeroVersao = "2.0",
                Criacao = new SistemaCriacaoConfigDto
                {
                    Recursos =
                    [
                        new SistemaRecursoConfigDto { Codigo = "vida", ValorMaximo = 4200 },
                        new SistemaRecursoConfigDto { Codigo = "mana", ValorPadrao = 70 },
                    ],
                    Atributos =
                    [
                        new SistemaAtributoConfigDto
                        {
                            Codigo = "precisão",
                            ValorMaximoNatural = 5,
                            ValorMaximoAbsoluto = 7,
                        },
                        new SistemaAtributoConfigDto { Codigo = "carisma", ValorMaximoNatural = 20 },
                    ],
                },
            });

        PersonagemComparacaoPesquisaResultadoDto result = await context.Service.GetAsync(
            PersonagemComparacaoOrigem.Npc,
            9,
            null,
            administrador: false);

        PersonagemComparacaoSistemaDto runtime = Assert.Single(result.Personagens).SistemaRuntime!;
        Assert.Equal(4200, runtime.Escalas["vida"]);
        Assert.Equal(7, runtime.Escalas["precisao"]);
        Assert.DoesNotContain("mana", runtime.Escalas.Keys);
        Assert.DoesNotContain("carisma", runtime.Escalas.Keys);
    }

    private static TestContext CreateContext()
    {
        Mock<IPersonagemRepository> npcs = new();
        Mock<IPersonagemJogadorRepository> players = new();
        Mock<IMesaService> tables = new();
        Mock<ISistemaRpgResolver> resolver = new();
        npcs.Setup(repository => repository.SearchVisibleForComparisonAsync(
                It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<int>()))
            .ReturnsAsync(new List<PersonagemComparacaoRegistro>());

        return new TestContext(
            new PersonagemComparacaoService(npcs.Object, players.Object, tables.Object, resolver.Object),
            npcs,
            players,
            tables,
            resolver);
    }

    private static void SetupRuntime(TestContext context)
    {
        context.Resolver.Setup(resolver => resolver.ResolverContextoAsync(It.IsAny<SistemaRuntimeConsultaDto>()))
            .ReturnsAsync(new SistemaRuntimeContextoDto
            {
                IdSistemaRpg = 1,
                IdSistemaVersao = 2,
                NomeSistema = "Odisseia",
                NumeroVersao = "1.0",
            });
    }

    private static PersonagemComparacaoRegistro Npc(int id, string name) => new()
    {
        Id = id,
        Nome = name,
        IdRaca = 1,
        StatusJson = "{}",
        SkillsJson = "[]",
    };

    private static PersonagemComparacaoRegistro Player(int id, int tableId, string name) => new()
    {
        Id = id,
        Jogador = true,
        Nome = name,
        IdRaca = 1,
        IdMesa = tableId,
        MesaNome = "Mesa",
        StatusJson = "{}",
        SkillsJson = "[]",
    };

    private sealed record TestContext(
        PersonagemComparacaoService Service,
        Mock<IPersonagemRepository> Npcs,
        Mock<IPersonagemJogadorRepository> Players,
        Mock<IMesaService> Tables,
        Mock<ISistemaRpgResolver> Resolver);
}
