using System.Text.Json.Nodes;
using OdisseiaWiki.Enums;
using OdisseiaWiki.GameRuns;
using OdisseiaWiki.GameRuns.Inventory;
using OdisseiaWiki.Models;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class GameRunAttributeInfluencesTests
{
    private static SistemaVersao Version() => new() {
        Modulos = [new() { TipoModulo = SistemaModuloTipo.Progressao, Habilitado = true, ConfiguracaoJson = "{}" }],
        Atributos = [new() { CodigoAtributo = "RESISTENCIA", Nome = "Resistência", Grupo = SistemaAtributoGrupo.Principal,
            Ativo = true, ValorMaximoNatural = 3 }, new() { CodigoAtributo = "AGILIDADE", Nome = "Agilidade",
            Grupo = SistemaAtributoGrupo.Secundario, Ativo = true, ValorMaximoNatural = 5 }],
        Condicoes = [new() { Codigo = "AJUSTE", Nome = "Ajuste temporário", Empilhavel = true, Tipo = "Fisico", DuracaoPadrao = 4,
            ConfiguracaoPadraoJson = """{"imagem":"/condicao.png","efeitos":[{"operacao":"MODIFICAR_ATRIBUTO","recurso":"RESISTENCIA","valor":-2,"momento":"ENQUANTO_ATIVA"},{"operacao":"MODIFICAR_ATRIBUTO","recurso":"AGILIDADE","valor":4,"momento":"ENQUANTO_ATIVA"}]}""" }],
    };
    private static JsonObject Root(SistemaVersao version) {
        var root = JsonNode.Parse("""{"status":{"pontosAtributo":1,"pontosIniciaisDisponiveisNaRun":false,"status":{"vida":100,"vidaMaxima":100},"atributos":{"principais":{"resistencia":2},"secundarios":{"agilidade":1}}},"implantes":[{"id":"braco","nome":"Braço","itemBase":{"imagem":"/braco.png"},"atributos":{"bonus":{"resistencia":3,"agilidade":2,"vida":100},"__vistaExplodida":{"equippedSlot":"braco"}}},{"id":"guardado","nome":"Guardado","atributos":{"bonus":{"resistencia":100}}}]}""")!.AsObject();
        GameRunProstheses.Reconcile(root, version); return root;
    }
    private static JsonObject Condition() => JsonNode.Parse("""{"rule":{"code":"AJUSTE","name":"Nome antigo","effects":[]},"value":0,"remainingTurns":4} """)!.AsObject();
    private static GameAttributeOption Resistance(GameAttributeOptions options) => options.Atributos.Single(item => item.Codigo == "resistencia");

    [Fact]
    public void PreservaNaturalEListaApenasBonusAplicadosComTodosOsAtributosDaOrigem()
    {
        var version = Version(); var root = Root(version); string before = root.ToJsonString();
        var option = Resistance(GameRunAttributes.Options(before, version));
        Assert.Equal(2, option.Valor); Assert.Equal(3, option.Modificador);
        var source = Assert.Single(option.Influencias);
        Assert.Equal("Braço", source.Nome); Assert.Equal("/braco.png", source.Imagem); Assert.Equal("PROTESE", source.Tipo);
        Assert.Equal(2, source.Efeitos.Count); Assert.DoesNotContain(source.Efeitos, effect => effect.Codigo == "VIDA");
        Assert.Equal(2, source.Efeitos.Single(effect => effect.Grupo == "secundarios").Valor);
        Assert.Equal(before, root.ToJsonString()); Assert.Equal(option.Modificador, Resistance(GameRunAttributes.Options(before, version)).Modificador);
    }

    [Fact]
    public void ItemLegadoSemMetadadosLegiveisNaoBloqueiaConsultaDeAtributos()
    {
        var version = Version(); var root = Root(version);
        root["implantes"]!.AsArray().Add(new JsonObject { ["id"] = "antigo", ["atributos"] = "{" });
        root["implantes"]!.AsArray().Add(new JsonObject { ["id"] = "outro", ["atributos"] = new JsonObject {
            ["__vistaExplodida"] = "legado", ["bonus"] = new JsonObject { ["resistencia"] = 99 } } });
        string before = root.ToJsonString();
        var options = GameRunAttributes.Options(before, version);
        Assert.Equal(1, options.Pontos);
        Assert.Equal(3, Resistance(options).Modificador);
        Assert.Equal("Braço", Assert.Single(Resistance(options).Influencias).Nome);
        Assert.Equal(before, root.ToJsonString());
    }

    [Fact]
    public void CondicaoSomaComProteseSemAlterarNaturalEDiferenciaOutrosAtributos()
    {
        var version = Version(); var root = Root(version);
        root["status"]!["condicoesJogo"] = new JsonArray(Condition());
        var options = GameRunAttributes.Options(root.ToJsonString(), version); var option = Resistance(options);
        Assert.Equal(2, option.Valor); Assert.Equal(1, option.Modificador); Assert.Equal(2, option.Influencias.Count);
        var condition = option.Influencias.Single(item => item.Tipo == "CONDICAO");
        Assert.Equal("Ajuste temporário", condition.Nome); Assert.Equal("/condicao.png", condition.Imagem);
        Assert.Equal(-2, condition.Efeitos.Single(item => item.Codigo == "RESISTENCIA").Valor);
        Assert.Equal(6, options.Atributos.Single(item => item.Grupo == "secundarios").Modificador);
        var upgraded = GameRunAttributes.Upgrade(root.ToJsonString(), version, "resistencia");
        Assert.Equal(3, Resistance(GameRunAttributes.Options(upgraded, version)).Valor);
        Assert.Equal(1, Resistance(GameRunAttributes.Options(upgraded, version)).Modificador);
        Assert.Throws<InvalidOperationException>(() => GameRunAttributes.Upgrade(upgraded, version, "resistencia"));
    }

    [Fact]
    public void PilhasOverridesEFlagAutomaticaNaoDuplicamEUsamMesmaRegraDoCombate()
    {
        var version = Version(); var root = Root(version); var first = Condition(); var second = Condition();
        first["effectValues"] = JsonNode.Parse("""{"0":-3,"1":-1}"""); second["overrideValue"] = 2;
        root["status"]!["condicoesJogo"] = new JsonArray(first, second);
        root["condicoesAtivas"] = JsonNode.Parse("""{"AJUSTE":true}""");
        var option = Resistance(GameRunAttributes.Options(root.ToJsonString(), version));
        Assert.Equal(2, option.Modificador); Assert.Equal(3, option.Influencias.Count);
        root["status"]!["condicoesJogo"] = new JsonArray();
        Assert.Equal(1, Resistance(GameRunAttributes.Options(root.ToJsonString(), version)).Modificador);
        Assert.Equal(2, Resistance(GameRunAttributes.Options(root.ToJsonString(), version)).Influencias.Count);
    }

    [Fact]
    public void TrajeEConsumivelPreservamNomeEImagemDaOrigemMesmoDepoisDoConsumo()
    {
        foreach (string trigger in new[] { "AO_USAR", "AO_EQUIPAR" }) {
            var version = Version(); var root = Root(version);
            root["inventario"] = JsonNode.Parse("""[{"id":"item","nome":"Colete ou poção","imagem":"/origem.png","atributos":{"condicoes":[{"codigo":"AJUSTE","gatilho":"AO_USAR","alvo":"USUARIO"}]}}]""");
            root["inventario"]![0]!["atributos"]!["condicoes"]![0]!["gatilho"] = trigger;
            string before = root.ToJsonString(); root["inventario"] = new JsonArray();
            string after = GameRunCarry.ApplyConsumedItemConditions(before, root.ToJsonString(), "item", version, trigger:trigger);
            var source = Resistance(GameRunAttributes.Options(after, version)).Influencias.Single(item => item.Tipo == "ITEM");
            Assert.Equal("Colete ou poção", source.Nome); Assert.Equal("/origem.png", source.Imagem); Assert.Equal("Ajuste temporário", source.Condicao);
            Assert.Empty(JsonNode.Parse(after)!["inventario"]!.AsArray());
        }
    }

    [Fact]
    public void FimDaDuracaoERetiradaDaProteseRemovemInfluenciasSemGastarPontos()
    {
        var version = Version(); var root = Root(version); var condition = Condition();
        condition["remainingMinutes"] = 1; root["status"]!["condicoesJogo"] = new JsonArray(condition);
        string after = GameRunCarry.AdvanceGameTime(root.ToJsonString(), 1, version);
        Assert.Single(Resistance(GameRunAttributes.Options(after, version)).Influencias);
        root = JsonNode.Parse(after)!.AsObject(); root["implantes"]![0]!["atributos"]!["__vistaExplodida"]!.AsObject().Remove("equippedSlot");
        GameRunProstheses.Reconcile(root, version);
        var option = Resistance(GameRunAttributes.Options(root.ToJsonString(), version));
        Assert.Equal(2, option.Valor); Assert.Equal(0, option.Modificador); Assert.Empty(option.Influencias);
        Assert.Equal(1, GameRunAttributes.Options(root.ToJsonString(), version).Pontos);
    }

    [Fact]
    public void BonusDeRolagemNaoViraPontoDeAtributoEConfiguracaoAtualNaoReescreveEstado()
    {
        var version = Version(); var root = Root(version);
        version.Condicoes.First().ConfiguracaoPadraoJson = """{"efeitos":[{"operacao":"MODIFICAR_ROLAGEM","recurso":"TODOS","valor":5,"momento":"ENQUANTO_ATIVA"}]}""";
        root["status"]!["condicoesJogo"] = new JsonArray(Condition());
        Assert.Single(Resistance(GameRunAttributes.Options(root.ToJsonString(), version)).Influencias);
        root.Remove("__runProsthesisApplied"); root.Remove("__runProsthesisBonuses");
        Assert.Empty(Resistance(GameRunAttributes.Options(root.ToJsonString(), version)).Influencias);
    }

    [Fact]
    public void LimiteSeguroExplicaDiferencaEntreBonusPedidoERealmenteAplicado()
    {
        var version = Version(); var root = Root(version);
        root["implantes"]![0]!["atributos"]!["bonus"]!["resistencia"] = 1000000;
        GameRunProstheses.Reconcile(root, version);
        var option = Resistance(GameRunAttributes.Options(root.ToJsonString(), version));
        Assert.Equal(2, option.Valor); Assert.Equal(999998, option.Modificador);
        Assert.Contains(option.Influencias, item => item.Nome == "Limite do atributo");
        Assert.Equal(option.Modificador, option.Influencias.SelectMany(item => item.Efeitos).Where(item => item.Codigo == "RESISTENCIA").Sum(item => item.Valor));
    }
}
