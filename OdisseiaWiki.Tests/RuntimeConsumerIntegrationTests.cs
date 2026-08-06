using System.Text.Json;
using Moq;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services;
using OdisseiaWiki.Services.Interfaces;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class RuntimeConsumerIntegrationTests
{
    [Fact]
    public async Task CriacaoDePersonagemJogador_AplicaDefaultsSemApagarCamposDesconhecidos()
    {
        Mock<IPersonagemJogadorRepository> personagens = new();
        Mock<IMesaRepository> mesas = MesaValida();
        Mock<IMesaService> mesaService = new();
        Mock<IAssetService> assets = new();
        Mock<ISistemaRpgResolver> resolver = new();
        PersonagemJogador? persistido = null;

        personagens.Setup(item => item.CreateAsync(It.IsAny<PersonagemJogador>()))
            .Callback<PersonagemJogador>(item => persistido = item)
            .ReturnsAsync((PersonagemJogador item) => item);
        resolver.Setup(item => item.ResolverContextoAsync(It.IsAny<SistemaRuntimeConsultaDto>()))
            .ReturnsAsync(ContextoRuntime());

        PersonagemJogadorService service = new(
            personagens.Object,
            mesas.Object,
            mesaService.Object,
            assets.Object,
            resolver.Object);
        PersonagemJogadorDto dto = new()
        {
            Nome = "Teste",
            Idusuario = 3,
            Idmesa = 7,
            Idraca = 4,
            StatusJson = JsonSerializer.Deserialize<object>("""
                {
                  "status": { "vida": 0, "vidaMaxima": 0, "campoHistorico": 17 },
                  "atributos": { "principais": { "legado": 9 } },
                  "nivel": 0,
                  "xp": 42,
                  "extensaoCustomizada": { "ativa": true }
                }
                """),
        };

        ResultPersonagemJogador result = await service.CreateAsync(dto);

        Assert.True(result.Sucesso);
        Assert.NotNull(persistido);
        using JsonDocument document = JsonDocument.Parse(persistido!.StatusJson!);
        JsonElement root = document.RootElement;
        Assert.True(root.GetProperty("extensaoCustomizada").GetProperty("ativa").GetBoolean());
        Assert.Equal(17, root.GetProperty("status").GetProperty("campoHistorico").GetInt32());
        Assert.Equal(1200, root.GetProperty("status").GetProperty("vida").GetInt32());
        Assert.Equal(1200, root.GetProperty("status").GetProperty("vidaMaxima").GetInt32());
        Assert.Equal(75, root.GetProperty("status").GetProperty("estaminaMaxima").GetInt32());
        Assert.Equal(40, root.GetProperty("status").GetProperty("capacidadeCarga").GetInt32());
        Assert.Equal(9, root.GetProperty("atributos").GetProperty("principais").GetProperty("legado").GetInt32());
        Assert.Equal(1, root.GetProperty("atributos").GetProperty("principais").GetProperty("forca").GetInt32());
        Assert.Equal(42, root.GetProperty("xp").GetInt32());
        Assert.Equal(2, persistido.IdSistemaVersao);
    }

    [Fact]
    public async Task AtualizacaoManualDoSistemaDaFicha_AlteraSomenteAVersaoFixada()
    {
        Mock<IPersonagemJogadorRepository> personagens = new();
        Mock<IMesaRepository> mesas = MesaValida();
        Mock<IMesaService> mesaService = new();
        Mock<IAssetService> assets = new();
        Mock<ISistemaRpgResolver> resolver = new();
        PersonagemJogador personagem = new()
        {
            IdpersonagemJogador = 8,
            Idusuario = 3,
            Idmesa = 7,
            Idraca = 4,
            Nome = "Veterano",
            IdSistemaVersao = 2,
            StatusJson = "{\"nivel\":5}",
        };
        personagens.Setup(item => item.GetByIdAsync(8)).ReturnsAsync(personagem);
        personagens.Setup(item => item.UpdateAsync(personagem)).ReturnsAsync(personagem);
        resolver.Setup(item => item.ResolverContextoAsync(It.IsAny<SistemaRuntimeConsultaDto>()))
            .ReturnsAsync(new SistemaRuntimeContextoDto
            {
                IdSistemaRpg = 1,
                IdSistemaVersao = 3,
                CodigoSistema = "ODISSEIA",
                NumeroVersao = "1.4",
                UsaFallbackLegado = true,
                Fallbacks =
                [
                    new SistemaRuntimeFallbackDto
                    {
                        Caminho = "configuracaoRacial",
                        Motivo = "Compatibilidade racial pontual.",
                    },
                ],
            });

        PersonagemJogadorService service = new(
            personagens.Object,
            mesas.Object,
            mesaService.Object,
            assets.Object,
            resolver.Object);

        ResultPersonagemJogador result = await service.AtualizarSistemaAsync(8);

        Assert.True(result.Sucesso);
        Assert.Equal(3, personagem.IdSistemaVersao);
        Assert.Equal("{\"nivel\":5}", personagem.StatusJson);
        personagens.Verify(item => item.UpdateAsync(personagem), Times.Once);
    }

    [Fact]
    public async Task LeituraDeFicha_PreservaEstadoEExplicitaDivergenciasComoWarning()
    {
        Mock<IPersonagemJogadorRepository> personagens = new();
        Mock<IMesaRepository> mesas = MesaValida();
        Mock<IMesaService> mesaService = new();
        Mock<IAssetService> assets = new();
        Mock<ISistemaRpgResolver> resolver = new();
        const string estadoSalvo = """
            {"status":{"vida":999,"vidaMaxima":1500,"estamina":60,"estaminaMaxima":60,"mana":50,"manaMaxima":50,"capacidadeCarga":40},"nivel":25,"xp":123}
            """;
        PersonagemJogador personagem = new()
        {
            IdpersonagemJogador = 8,
            Idusuario = 3,
            Idmesa = 7,
            Idraca = 4,
            Nome = "Veterano",
            StatusJson = estadoSalvo,
            Skills = "[{},{},{},{},{}]",
            Magia = "[]",
        };
        personagens.Setup(item => item.GetByIdWithDetailsAsync(8)).ReturnsAsync(personagem);
        personagens.Setup(item => item.GetProficienciasByPersonagemIdsAsync(It.IsAny<IEnumerable<int>>()))
            .ReturnsAsync(new Dictionary<int, List<Proficiencia>>());
        resolver.Setup(item => item.ResolverContextoAsync(It.IsAny<SistemaRuntimeConsultaDto>()))
            .ReturnsAsync(ContextoRuntime());

        PersonagemJogadorService service = new(
            personagens.Object,
            mesas.Object,
            mesaService.Object,
            assets.Object,
            resolver.Object);

        PersonagemJogadorDto? result = await service.GetByIdAsync(8);

        Assert.NotNull(result);
        Assert.Equal(estadoSalvo, personagem.StatusJson);
        Assert.Contains(result!.SistemaRuntime!.Warnings, warning => warning.Caminho == "statusJson.nivel");
        Assert.Contains(result.SistemaRuntime.Warnings, warning => warning.Caminho == "skills");
        Assert.Contains(result.SistemaRuntime.Proveniencias, item =>
            item.Caminho == "statusJson.status.vidaMaxima" &&
            item.Origem == SistemaValorProveniencia.ValorExplicitoEntidade);
    }

    private static Mock<IMesaRepository> MesaValida()
    {
        Mock<IMesaRepository> mesas = new();
        mesas.Setup(item => item.GetByIdAsync(7)).ReturnsAsync(new Mesa { Idmesa = 7 });
        mesas.Setup(item => item.UsuarioPodeUsarMesaAsync(7, 3)).ReturnsAsync(true);
        return mesas;
    }

    private static SistemaRuntimeContextoDto ContextoRuntime() => new()
    {
        IdSistemaRpg = 1,
        IdSistemaVersao = 2,
        CodigoSistema = "ODISSEIA",
        NumeroVersao = "1.0",
        Origem = SistemaRuntimeOrigem.Mesa,
        Criacao = new SistemaCriacaoConfigDto
        {
            NivelInicial = 1,
            Atributos =
            [
                new SistemaAtributoConfigDto
                {
                    Codigo = "forca",
                    Nome = "Força",
                    Grupo = SistemaAtributoGrupo.Principal,
                    ValorComum = 1,
                    Ativo = true,
                },
            ],
        },
        Progressao = new SistemaProgressaoConfigDto { NivelMaximo = 20 },
        Poderes = new SistemaPoderesConfigDto
        {
            LimiteMagias = 15,
            SkillConfig = new SistemaSkillConfigDto { MaximoSkills = 4 },
        },
        ConfiguracaoRacial = new SistemaRacaConfigDto
        {
            IdRaca = 4,
            VidaBase = 1200,
            EstaminaBase = 75,
            ManaBase = 50,
            CapacidadeCargaBase = 40,
        },
        Combate = new SistemaCombateConfigDto
        {
            TiposDefesa =
            [
                new SistemaTipoDefesaDto { Codigo = "armadura", Nome = "Armadura" },
            ],
        },
    };
}
