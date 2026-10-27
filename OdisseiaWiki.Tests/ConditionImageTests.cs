using OdisseiaWiki.Models;
using OdisseiaWiki.Services.Helpers;
using Xunit;

namespace OdisseiaWiki.Tests;

public class ConditionImageTests
{
    [Theory]
    [InlineData(null, null)]
    [InlineData("{}", null)]
    [InlineData("{\"imagem\":\"/assets/condicao.png\",\"efeitos\":[]}", "/assets/condicao.png")]
    [InlineData("{\"imagem\":\"https://example.com/condicao.png\"}", "https://example.com/condicao.png")]
    [InlineData("{\"imagem\":\"assets_dynamic/condicao.png\"}", "/assets_dynamic/condicao.png")]
    [InlineData("{\"imagem\":\"assets/condicao.png\"}", "/assets/condicao.png")]
    [InlineData("{\"imagem\":\"javascript:alert(1)\"}", null)]
    [InlineData("{\"imagem\":\"//untrusted/image.png\"}", null)]
    [InlineData("invalid", null)]
    public void ImagemOpcionalNaoInterfereNosEfeitosEAceitaSomenteCaminhosDeImagem(string? json, string? expected)
    {
        var rule = new SistemaCondicao { ConfiguracaoPadraoJson = json, OperacaoEfeito = "SOMAR",
            CodigoRecurso = "VIDA", ValorEfeito = 100, MomentoEfeito = "INICIO_TURNO" };
        Assert.Equal(expected, SistemaCondicaoEfeitos.Image(rule));
        Assert.Equal(100, Assert.Single(SistemaCondicaoEfeitos.Read(rule)).Valor);
        Assert.Equal(json, rule.ConfiguracaoPadraoJson);
    }
}
