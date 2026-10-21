using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Services.Helpers;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class SistemaCondicaoRemocaoTests
{
    [Fact]
    public void ValoresDaOrigemSaoValidadosPelaOperacaoDaRegraPublicada()
    {
        var rule = new SistemaCondicao
        {
            Codigo = "CEGUEIRA", Nome = "Cegueira", Tipo = "Sensorial",
            ConfiguracaoPadraoJson = """{"efeitos":[{"operacao":"MODIFICAR_ATRIBUTO","recurso":"PRECISAO","valor":-5,"momento":"ENQUANTO_ATIVA"},{"operacao":"SOMAR","recurso":"VIDA","valor":10,"momento":"FIM_TURNO"}]}""",
        };
        IReadOnlyList<SistemaCondicaoEfeito> effects = SistemaCondicaoEfeitos.Read(rule);

        Assert.True(SistemaCondicaoEfeitos.ValidOverrides(effects,
            new Dictionary<int, int> { [0] = -8, [1] = 20 }));
        Assert.False(SistemaCondicaoEfeitos.ValidOverrides(effects,
            new Dictionary<int, int> { [1] = -20 }));
        Assert.False(SistemaCondicaoEfeitos.ValidOverrides(effects,
            new Dictionary<int, int> { [2] = 1 }));
    }

    [Theory]
    [InlineData("DESCANSO_SIMPLES", "SIMPLES", true)]
    [InlineData("DESCANSO_NORMAL", "SIMPLES", false)]
    [InlineData("DESCANSO_NORMAL", "NORMAL", true)]
    [InlineData("DESCANSO_NORMAL", "LONGO", true)]
    [InlineData("DESCANSO_LONGO", "NORMAL", false)]
    [InlineData("MANUAL", "LONGO", false)]
    public void DescansoSegueGatilhoPublicado(string removal, string rest, bool expected)
    {
        var rule = new SistemaCondicao { Codigo = "TESTE", Nome = "Teste", Tipo = "Fisico",
            RegraRemocao = removal };
        Assert.Equal(expected, SistemaCondicaoRemocao.AoDescansar(rule, rest));
    }

    [Fact]
    public void CondicaoNarrativaNaoViraRecuperacaoAutomatica()
    {
        var rule = new SistemaCondicao { Codigo = "SANGRAMENTO", Nome = "Sangramento",
            Tipo = "Fisico", RegraRemocao = "curar ferimento", UnidadeDuracao = SistemaUnidadeDuracao.Descanso };
        Assert.False(SistemaCondicaoRemocao.AoDescansar(rule, "LONGO"));
        Assert.False(SistemaCondicaoRemocao.AoCessarGatilho(rule));
    }

    [Fact]
    public void DuracaoSoExpiraQuandoConfiguradaComoRecuperacao()
    {
        var rule = new SistemaCondicao { Codigo = "TESTE", Nome = "Teste", Tipo = "Fisico",
            DuracaoPadrao = 2, RegraRemocao = "MANUAL" };
        Assert.False(SistemaCondicaoRemocao.AoTerminarDuracao(rule));
        rule.RegraRemocao = "DURACAO";
        Assert.True(SistemaCondicaoRemocao.AoTerminarDuracao(rule));
    }

    [Fact]
    public void RecuperacoesMarcadasEmConjuntoSaoIndependentes()
    {
        var rule = new SistemaCondicao { Codigo = "SANGRAMENTO", Nome = "Sangramento",
            Tipo = "Fisico", DuracaoPadrao = 3, RegraRemocao = "DURACAO;DESCANSO_NORMAL;CURA" };
        Assert.True(SistemaCondicaoRemocao.AoTerminarDuracao(rule));
        Assert.False(SistemaCondicaoRemocao.AoDescansar(rule, "SIMPLES"));
        Assert.True(SistemaCondicaoRemocao.AoDescansar(rule, "NORMAL"));
        Assert.True(SistemaCondicaoRemocao.AoCurar(rule));
        Assert.False(SistemaCondicaoRemocao.AoUsarMagiaDeRemocao(rule));
    }

    [Fact]
    public void DescansoNaoDependeDoNomeOuCodigoDaCondicao()
    {
        var custom = new SistemaCondicao { Codigo = "SOMBRA", Nome = "Sombra", Tipo = "Magico",
            RegraRemocao = "DESCANSO_NORMAL_OU_LONGO" };
        Assert.False(SistemaCondicaoRemocao.AoDescansar(custom, "SIMPLES"));
        Assert.True(SistemaCondicaoRemocao.AoDescansar(custom, "NORMAL"));
        Assert.True(SistemaCondicaoRemocao.AoDescansar(custom, "LONGO"));
    }
}
