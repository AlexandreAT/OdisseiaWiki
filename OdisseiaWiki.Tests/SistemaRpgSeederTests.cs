using System.Text.Json;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class SistemaRpgSeederTests
{
    [Fact]
    public async Task SeedAsync_PreservaLimitesDePoderesEAtributosDoLivro()
    {
        (SistemaRpg sistema, SistemaVersao versao) = await ExecutarSeedAsync();

        Assert.Equal("Odisseia — Insurgência", sistema.Nome);
        Assert.Equal(11, versao.Atributos.Count);
        Assert.Contains(versao.Atributos, atributo => atributo.CodigoAtributo == "AMEACA");
        Assert.All(versao.Atributos, atributo =>
        {
            Assert.Equal(5, atributo.ValorMaximoNatural);
            Assert.Equal(6, atributo.ValorMaximoAbsoluto);
        });

        Assert.NotNull(versao.SkillConfig);
        Assert.Equal(4, versao.SkillConfig.MaximoSkills);
        Assert.Equal(4, versao.SkillConfig.NivelMaximoSkill);
        Assert.Equal(1, versao.SkillConfig.MaximoUltimates);
        Assert.Equal(7, versao.SkillConfig.NivelDesbloqueioUltimate);
        Assert.Equal(15, versao.SkillConfig.MaximoMagias);

        Assert.Equal(9, versao.TiposMagia.Count);
        Assert.Equal(
            ["AGUA", "AR", "ESCURIDAO", "ESPACIAL", "FOGO", "INVOCACAO", "LUZ", "TERRA", "TRANSFIGURACAO"],
            versao.TiposMagia.Select(tipo => tipo.Codigo).OrderBy(codigo => codigo).ToArray());

        SistemaModulo poderes = versao.Modulos.Single(modulo => modulo.TipoModulo == SistemaModuloTipo.Poderes);
        using JsonDocument configuracao = JsonDocument.Parse(poderes.ConfiguracaoJson!);
        Assert.Equal(15, configuracao.RootElement.GetProperty("limiteMagias").GetInt32());

        SistemaRacaConfig humanos = versao.Racas.Single(raca => raca.CodigoRaca == "HUMANOS");
        Assert.Equal(3, humanos.Passivas.Count);
        Assert.All(humanos.Passivas, passiva => Assert.Equal(10, passiva.NivelDesbloqueio));
        Assert.Empty(versao.Racas.Single(raca => raca.CodigoRaca == "CYBORGUE").Passivas);
    }

    [Fact]
    public async Task SeedAsync_ConfiguraProgressaoSemDuplicarPontosPorNivel()
    {
        (_, SistemaVersao versao) = await ExecutarSeedAsync();

        SistemaModulo progressao = versao.Modulos.Single(modulo => modulo.TipoModulo == SistemaModuloTipo.Progressao);
        using JsonDocument configuracao = JsonDocument.Parse(progressao.ConfiguracaoJson!);
        Assert.True(configuracao.RootElement.GetProperty("permiteXpExcedente").GetBoolean());

        SistemaNivel nivel2 = versao.Niveis.Single(nivel => nivel.Nivel == 2);
        Assert.Equal(1, nivel2.PontosNivel);
        Assert.Equal(0, nivel2.PontosAtributo);
        Assert.Equal(0, nivel2.PontosSkill);
        Assert.Equal(0, nivel2.PontosUltimate);
        Assert.True(nivel2.PermiteNovaMagia);
        Assert.True(nivel2.PermiteNovaSkill);

        Assert.Equal(10, versao.Niveis.Single(nivel => nivel.Nivel == 6).XpParaProximoNivel);
        Assert.Equal(20, versao.Niveis.Single(nivel => nivel.Nivel == 7).XpParaProximoNivel);
        Assert.Equal(25, versao.Niveis.Single(nivel => nivel.Nivel == 10).XpParaProximoNivel);
        Assert.Equal(30, versao.Niveis.Single(nivel => nivel.Nivel == 13).XpParaProximoNivel);
        Assert.Equal(40, versao.Niveis.Single(nivel => nivel.Nivel == 16).XpParaProximoNivel);
        Assert.Equal(0, versao.Niveis.Single(nivel => nivel.Nivel == 20).XpParaProximoNivel);

        Assert.Equal("ULTIMATE", versao.MarcosNivel.Single(marco => marco.Nivel == 7).Codigo);
        Assert.Equal("PASSIVA_RACIAL", versao.MarcosNivel.Single(marco => marco.Nivel == 10).Codigo);
        Assert.Equal("PROFICIENCIA", versao.MarcosNivel.Single(marco => marco.Nivel == 13).Codigo);
        Assert.Equal("MAESTRIA_TATICA", versao.MarcosNivel.Single(marco => marco.Nivel == 16).Codigo);
        Assert.Equal("MAESTRIA_ARMAS", versao.MarcosNivel.Single(marco => marco.Nivel == 20).Codigo);

        Assert.Equal(8, versao.FontesExperiencia.Count);
        Assert.Contains(versao.FontesExperiencia, fonte => fonte.Codigo == "COMBATE_NORMAL" && fonte.ValorMinimo == 1 && fonte.ValorMaximo == 1);
        Assert.Contains(versao.FontesExperiencia, fonte => fonte.Codigo == "MINI_BOSS" && fonte.UsaVantagem && fonte.ValorMaximo == 2);
        Assert.Contains(versao.FontesExperiencia, fonte => fonte.Codigo == "MISSAO_PRINCIPAL" && fonte.UsaVantagem && fonte.ValorMaximo == 6);
    }

    [Fact]
    public async Task SeedAsync_ConfiguraExploracaoCombateESobrevivenciaComValoresDoLivro()
    {
        (_, SistemaVersao versao) = await ExecutarSeedAsync();

        Assert.NotNull(versao.Movimento);
        Assert.Equal(2, versao.Movimento.MetrosPorQuadrado);
        Assert.Equal(1, versao.Movimento.MovimentoGratuito);
        Assert.Equal(5, versao.Movimento.CustoEstaminaPorQuadrado);
        Assert.Equal(10, versao.Movimento.MaximoQuadradosTurno);

        Assert.NotNull(versao.PontosAcao);
        Assert.Equal(10, versao.PontosAcao.PontosPorTurno);
        Assert.Equal(10, versao.PontosAcao.SegundosPorPonto);
        Assert.Equal(2, versao.Acoes.Single(acao => acao.Codigo == "INVESTIGAR").CustoPontosAcao);
        Assert.Equal(1, versao.Acoes.Single(acao => acao.Codigo == "USAR_ITEM").CustoPontosAcao);

        Assert.Equal(9, versao.TiposDano.Count);
        Assert.Contains(versao.TiposDano, dano => dano.Codigo == "QUEDA" && dano.IgnoraArmadura && dano.IgnoraProtecao && dano.IgnoraEscudo);
        Assert.Contains(versao.ResultadosDado, resultado => resultado.CodigoTeste == "TESTE_GERAL" && resultado.ResultadoMinimo == 1 && resultado.ResultadoMaximo == 3 && resultado.CodigoResultado == "FALHA");
        Assert.Contains(versao.ResultadosDado, resultado => resultado.CodigoTeste == "TESTE_GERAL" && resultado.ResultadoMinimo == 4 && resultado.ResultadoMaximo == 6 && resultado.CodigoResultado == "SUCESSO");

        Assert.Contains(versao.Condicoes, condicao => condicao.Codigo == "DEPENDENCIA_DE_MANA" && condicao.DuracaoPadrao == 2);
        Assert.Contains(versao.Condicoes, condicao => condicao.Codigo == "CALOR_EXTREMO_FRIO_EXTREMO");
        Assert.Equal(14, versao.Condicoes.Count);

        Assert.NotNull(versao.Morte);
        Assert.Equal(5, versao.Morte.QuantidadeTestesCombate);
        Assert.Equal(3, versao.Morte.QuantidadeTestesForaCombate);
        Assert.Equal(3, versao.Morte.SucessosNecessarios);
        Assert.Equal(20, versao.Morte.LimiteVidaDesmembramento);
        Assert.Equal(2, versao.Morte.MultiplicadorDanoDesmembramento);
        Assert.Equal(50, versao.Morte.LimiteVidaInstaKill);
        Assert.Equal(5, versao.Morte.MultiplicadorDanoInstaKill);
    }

    private static async Task<(SistemaRpg Sistema, SistemaVersao Versao)> ExecutarSeedAsync()
    {
        Mock<ISistemaRpgRepository> repository = new();
        SistemaRpg? sistemaCriado = null;
        repository.Setup(repositorio => repositorio.GetByCodeAsync("ODISSEIA", true))
            .ReturnsAsync((SistemaRpg?)null);
        repository.Setup(repositorio => repositorio.GetRacesAsync()).ReturnsAsync([]);
        repository.Setup(repositorio => repositorio.GetPassivasAsync()).ReturnsAsync([]);
        repository.Setup(repositorio => repositorio.GetMesasWithoutVersionAsync()).ReturnsAsync([]);
        repository.Setup(repositorio => repositorio.AddSystemAsync(It.IsAny<SistemaRpg>()))
            .Callback<SistemaRpg>(sistema => sistemaCriado = sistema)
            .Returns(Task.CompletedTask);
        repository.Setup(repositorio => repositorio.SaveChangesAsync()).Returns(Task.CompletedTask);
        repository.Setup(repositorio => repositorio.ExecuteInTransactionAsync(It.IsAny<Func<Task>>()))
            .Returns<Func<Task>>(operacao => operacao());

        SistemaRpgSeeder seeder = new(repository.Object, NullLogger<SistemaRpgSeeder>.Instance);
        await seeder.SeedAsync();

        SistemaRpg sistema = Assert.IsType<SistemaRpg>(sistemaCriado);
        return (sistema, Assert.Single(sistema.Versoes));
    }
}
