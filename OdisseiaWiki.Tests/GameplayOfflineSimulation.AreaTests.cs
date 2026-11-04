using System.Text.Json;
using System.Text.Json.Nodes;
using Moq;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed partial class GameplayOfflineSimulationTests
{
    [Theory]
    [InlineData(1, 10)]
    [InlineData(2, 20)]
    [InlineData(11, 200)]
    [InlineData(18, 300)]
    [InlineData(20, 500)]
    public async Task PropostaDeAreaUsaPercentuaisDoSistemaInclusiveEmErros(int die, int expected)
    {
        var fixture = AreaFixture();
        string original = fixture.Character.InventarioJson!;
        fixture.Dice.Setup(dice => dice.Roll(1, 20)).Returns([die]);
        var result = await fixture.Service.SimulateAsync(7, 12, AreaRequest());
        Assert.True(result.Sucesso, result.Mensagem);
        var damage = Assert.Single(result.Dados!.Rolagem.EfeitosPropostos, effect => effect.Tipo == "DANO");
        Assert.Equal(expected, damage.Valor);
        Assert.Contains("em área", damage.Nome);
        Assert.Equal(10, Assert.Single(result.Dados.Rolagem.EfeitosPropostos, effect => effect.Codigo == "CONSUMIR_MUNICAO").Valor);
        Assert.Equal(original, fixture.Character.InventarioJson);
        fixture.AssertReadOnly();
    }

    [Fact]
    public async Task PropostaDeAreaMultiplosAtaquesSomaPercentuaisSemMultiplicarPelosAcertos()
    {
        var fixture = AreaFixture();
        fixture.Dice.SetupSequence(dice => dice.Roll(1, 20)).Returns([11]).Returns([2]).Returns([20]);
        var result = await fixture.Service.SimulateAsync(7, 12, AreaRequest(3));
        Assert.True(result.Sucesso, result.Mensagem);
        Assert.Equal(720, Assert.Single(result.Dados!.Rolagem.EfeitosPropostos, effect => effect.Tipo == "DANO").Valor);
        Assert.Equal(30, Assert.Single(result.Dados.Rolagem.EfeitosPropostos, effect => effect.Codigo == "CONSUMIR_MUNICAO").Valor);
        fixture.AssertReadOnly();
    }

    [Fact]
    public async Task PercentualZeroNaoCriaPropostaDeDanoMasAindaConsomeMunicao()
    {
        var fixture = AreaFixture();
        var module = Assert.Single(fixture.Version.Modulos);
        var config = JsonNode.Parse(module.ConfiguracaoJson!)!;
        config["danoAreaPorResultado"]![1]!["percentual"] = 0;
        module.ConfiguracaoJson = config.ToJsonString();
        fixture.Dice.Setup(dice => dice.Roll(1, 20)).Returns([2]);
        var result = await fixture.Service.SimulateAsync(7, 12, AreaRequest());
        Assert.True(result.Sucesso, result.Mensagem);
        Assert.DoesNotContain(result.Dados!.Rolagem.EfeitosPropostos, effect => effect.Tipo == "DANO");
        Assert.Contains(result.Dados.Rolagem.EfeitosPropostos, effect => effect.Codigo == "CONSUMIR_MUNICAO");
        fixture.AssertReadOnly();
    }

    [Fact]
    public async Task RolagemDaFichaTambemRespeitaLimiteDeRajadasPublicadoNoSistema()
    {
        var fixture = AreaFixture();
        var module = Assert.Single(fixture.Version.Modulos);
        var config = JsonNode.Parse(module.ConfiguracaoJson!)!;
        config["limitesAcoesPorArma"] = JsonNode.Parse("""[{"tipoArma":"arma_de_fogo","maximoRajadas":2}]""");
        module.ConfiguracaoJson = config.ToJsonString();
        var result = await fixture.Service.SimulateAsync(7, 12, AreaRequest(3));
        Assert.False(result.Sucesso);
        Assert.Equal("QUANTIDADE_ACIMA_SISTEMA", result.Codigo);
        fixture.Dice.VerifyNoOtherCalls();
        fixture.AssertReadOnly();
    }

    private static GameplayRollRequestDto AreaRequest(int count = 1) => new() {
        CodigoAcao = "ACAO_FICHA", IdPersonagemJogador = 7, ChaveIdempotencia = Guid.NewGuid(),
        ReferenciaAcao = new() { Tipo = "ITEM", IdInstancia = "mortar" },
        ParametrosAcao = new() { Operacao = "ATACAR", Alcance = "CURTA", ModoDisparo = "RAJADA", Quantidade = count },
    };

    private static Fixture AreaFixture()
    {
        var fixture = new Fixture();
        fixture.Character.InventarioJson = """
            [{"id":"mortar","nome":"Morteiro","tipo":"arma","atributos":{
              "tipoArma":"arma_pesada_area","cadencia":0,"modoDisparo":"RAJADA","capacidadeMunicao":60,
              "controlaMunicao":true,"municaoAtual":60,"custoMunicaoRajada":10,
              "danoPorAlcance":{"emArea":200},"teste":{"codigoTeste":"ATAQUE_COMUM","usaTotalParaFaixas":false}}}]
            """;
        var results = new (string Code, int Min, int Max, int Percent)[] { ("FALHA_CRITICA", 1, 1, 5), ("ERRO", 2, 10, 10),
            ("ACERTO", 11, 17, 100), ("ACERTO_PRECISO", 18, 19, 150), ("CRITICO", 20, 20, 250) };
        fixture.Version.ResultadosDado = results.Select((row, index) => new SistemaResultadoDado {
            CodigoTeste = "ATAQUE_COMUM", NomeTeste = "Ataque", Dado = "D20", QuantidadeDados = 1,
            CodigoResultado = row.Code, NomeResultado = row.Code, ResultadoMinimo = row.Min, ResultadoMaximo = row.Max, Ordem = index,
        }).ToList();
        fixture.Version.Modulos.Add(new SistemaModulo { TipoModulo = SistemaModuloTipo.Combate,
            ConfiguracaoJson = JsonSerializer.Serialize(new { danoAreaPorResultado = results.Select(row => new {
                codigoResultado = row.Code, percentual = row.Percent }) }) });
        return fixture;
    }
}
