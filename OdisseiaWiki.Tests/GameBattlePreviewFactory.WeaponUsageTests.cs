using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed partial class GameBattlePreviewFactoryTests
{
    [Theory]
    [InlineData(0, 5)]
    [InlineData(1, 1)]
    [InlineData(2, 2)]
    public void CadenciaLimitaRajadasSemAlterarConsumoDeDezBalas(int cadence, int count)
    {
        var original = Run($$$"""
            [{"id":"gun","nome":"Rajadeira","tipo":"arma","atributos":{
              "tipoArma":"rifle_assalto","danoBase":5,"cadencia":{{{cadence}}},"modoDisparo":"RAJADA",
              "capacidadeMunicao":60,"custoMunicaoRajada":10,"controlaMunicao":true}}]
            """);
        var run = new GameRunDto { IdSistemaVersao = 7, ConfiguracaoModo = original.ConfiguracaoModo, EstadoAtual = original.EstadoAtual,
            AcoesEquipadas = [new() { Tipo = "ITEM", IdInstancia = "gun", QuantidadeAtaques = count }] };
        var action = _factory.Build(run, Version()).Input.FirstActor.Actions[0];
        Assert.Equal(count, action.AttacksPerTurn);
        Assert.Equal(10, action.Magazine!.AmmoPerUse);
        if (cadence > 0)
        {
            run.AcoesEquipadas[0].QuantidadeAtaques++;
            Assert.Contains($"limite de {cadence}", Assert.Throws<InvalidOperationException>(() =>
                _factory.CanExecuteSelectedAction(run, Version(), run.AcoesEquipadas[0])).Message);
            Assert.Equal(cadence, _factory.Build(run, Version()).Input.FirstActor.Actions[0].AttacksPerTurn);
        }
    }

    [Fact]
    public void SomenteDanoEmAreaExecutaComPercentuaisDaVersaoDoSistema()
    {
        var original = Run("""
            [{"id":"mortar","nome":"Morteiro","tipo":"arma","atributos":{
              "tipoArma":"arma_pesada_area","danoPorAlcance":{"emArea":200},"cadencia":2,
              "modoDisparo":"TIRO","capacidadeMunicao":5,"custoMunicaoTiro":1}}]
            """);
        var run = new GameRunDto { IdSistemaVersao = 7, ConfiguracaoModo = original.ConfiguracaoModo, EstadoAtual = original.EstadoAtual,
            AcoesEquipadas = [new() { Tipo = "ITEM", IdInstancia = "mortar", QuantidadeAtaques = 2 }] };
        var version = Version();
        version.Modulos.Add(new SistemaModulo { TipoModulo = SistemaModuloTipo.Combate, ConfiguracaoJson = """
            {"danoAreaPorResultado":[{"codigoResultado":"FALHA_CRITICA","percentual":5},
              {"codigoResultado":"ERRO","percentual":10},{"codigoResultado":"ACERTO","percentual":100},
              {"codigoResultado":"ACERTO_PRECISO","percentual":150},{"codigoResultado":"CRITICO","percentual":250}]}
            """ });
        var action = _factory.Build(run, version).Input.FirstActor.Actions[0];
        Assert.True(action.TargetsAllEnemies);
        Assert.Equal(10, action.DamageByResultCode["FALHA_CRITICA"]);
        Assert.Equal(20, action.DamageByResultCode["ERRO"]);
        Assert.Equal(200, action.DamageByResultCode["ACERTO"]);
        Assert.Equal(300, action.DamageByResultCode["ACERTO_PRECISO"]);
        Assert.Equal(500, action.DamageByResultCode["CRITICO"]);
        Assert.Equal(1, action.Magazine!.AmmoPerUse);
        var otherVersion = _factory.Build(run, Version()).Input.FirstActor.Actions[0];
        Assert.Equal(0, otherVersion.DamageByResultCode["ERRO"]);
        Assert.Equal(200, otherVersion.DamageByResultCode["CRITICO"]);
    }
}
