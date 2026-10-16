using System.Text.Json.Nodes;
using OdisseiaWiki.Enums;
using OdisseiaWiki.GameRuns;
using OdisseiaWiki.GameRuns.Battle;
using OdisseiaWiki.Models;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class GameRunRewardsTests
{
    [Theory]
    [InlineData(1, 12)]
    [InlineData(2, 12)]
    [InlineData(3, 14)]
    [InlineData(4, 14)]
    public void MetadeSuperiorDobraTodosOsMenoresPesos(int die, int expectedTotal)
    {
        var encounter = new GameBattleEncounterConfig { LootCount = 2, Loot =
            [Entry("a", 1), Entry("b", 1), Entry("c", 10)] };
        string prepared = GameRunLoot.Prepare("{\"inventario\":[]}", "node", encounter, 4);
        var bounds = new List<int>();
        var result = GameRunLoot.Claim(prepared, maximum => { bounds.Add(maximum); return bounds.Count == 1 ? die - 1 : 0; });
        Assert.Equal(new[] { 4, expectedTotal, expectedTotal }, bounds);
        Assert.Equal(die, result.Loot.Roll);
        Assert.Equal(2, result.Loot.Rewards.Count);
        Assert.NotEqual(result.Loot.Rewards[0]["id"]!.ToString(), result.Loot.Rewards[1]["id"]!.ToString());
        Assert.Equal("a", result.Loot.Rewards[0]["idItemBase"]!.ToString());
        Assert.Null(encounter.Loot[0].Snapshot!["id"]);
        Assert.Null(GameRunLoot.Read(prepared)!.Roll);
    }

    [Fact]
    public void RepetirEntregaNaoSorteiaNemDuplicaItens()
    {
        string prepared = GameRunLoot.Prepare("{\"inventario\":[]}", "node",
            new() { LootCount = 1, Loot = [Entry("a", 1)] }, 6);
        var result = GameRunLoot.Claim(prepared, _ => 0);
        var repeated = GameRunLoot.Claim(result.Snapshot, _ => throw new Exception("Não deve sortear"));
        Assert.Equal(result.Snapshot, repeated.Snapshot);
        Assert.Single(JsonNode.Parse(result.Snapshot)!["inventario"]!.AsArray());
        Assert.Equal(1, JsonNode.Parse(result.Snapshot)!["status"]!["lootItensObtidos"]!.GetValue<int>());
        string nextPrepared = GameRunLoot.Prepare(result.Snapshot, "node-2",
            new() { LootCount = 2, Loot = [Entry("b", 1)] }, 6);
        var next = GameRunLoot.Claim(nextPrepared, _ => 0);
        Assert.Equal(3, JsonNode.Parse(next.Snapshot)!["status"]!["lootItensObtidos"]!.GetValue<int>());
    }

    [Fact]
    public void ProteseVaiParaImplantesEPreservaInventarioLegado()
    {
        var entry = Entry("p", 1);
        entry.Snapshot!["tipo"] = "implante";
        string prepared = GameRunLoot.Prepare("""{"inventario":"[{\"nome\":\"espada\"}]","implantes":"[]"}""",
            "node", new() { LootCount = 1, Loot = [entry] }, 6);
        var result = GameRunLoot.Claim(prepared, _ => 0);
        Assert.Single(JsonNode.Parse(result.Snapshot)!["implantes"]!.AsArray());
        Assert.Contains("espada", result.Snapshot);
    }

    [Fact]
    public void LootPreservaInventarioEncapsulado()
    {
        string prepared = GameRunLoot.Prepare("""{"inventario":{"itens":[{"nome":"espada"}],"ordem":2}}""",
            "node", new() { LootCount = 1, Loot = [Entry("a", 1)] }, 6);
        var result = GameRunLoot.Claim(prepared, _ => 0);
        JsonNode wrapper = JsonNode.Parse(result.Snapshot)!["inventario"]!;
        Assert.Equal(2, wrapper["ordem"]!.GetValue<int>());
        Assert.Equal(2, wrapper["itens"]!.AsArray().Count);
    }

    [Fact]
    public void SemLootPreservaSnapshotESemDadoNaoInventaRegra()
    {
        Assert.Equal("{}", GameRunLoot.Prepare("{}", "n", new(), 0));
        Assert.Throws<InvalidOperationException>(() => GameRunLoot.Prepare("{}", "n",
            new() { LootCount = 1, Loot = [Entry("a", 1)] }, 0));
    }

    [Fact]
    public void AtributoUsaPontoEspecificoEPreviaPublicadaSemCurar()
    {
        const string snapshot = """{"status":{"pontos":3,"pontosAtributo":1,"pontosSkill":2,"pontosIniciaisDisponiveisNaRun":false,"atributos":{"principais":{"sabedoria":2}},"status":{"mana":40,"manaMaxima":100}}}""";
        var version = Version();
        var options = GameRunAttributes.Options(snapshot, version);
        Assert.Equal(4, options.Pontos);
        Assert.Equal(130, options.Atributos.Single().Recursos.Single().Depois);
        var updated = JsonNode.Parse(GameRunAttributes.Upgrade(snapshot, version, "sabedoria"))!;
        Assert.Equal(130, updated["status"]!["status"]!["manaMaxima"]!.GetValue<int>());
        Assert.Equal(40, updated["status"]!["status"]!["mana"]!.GetValue<int>());
        Assert.Equal(0, updated["status"]!["pontosAtributo"]!.GetValue<int>());
        Assert.Equal(3, updated["status"]!["pontos"]!.GetValue<int>());
        Assert.Equal(2, updated["status"]!["pontosSkill"]!.GetValue<int>());
        Assert.Equal(3, updated["status"]!["atributos"]!["principais"]!["sabedoria"]!.GetValue<int>());
    }

    [Fact]
    public void RunNaoReutilizaPontosDeCriacaoQuandoFichaJaDistribuiuAtributos()
    {
        const string allocated = """{"status":{"pontos":10,"pontosAtributo":10,"atributos":{"principais":{"resistencia":2,"agilidade":1}}}}""";
        JsonNode prepared = JsonNode.Parse(GameRunAttributes.Prepare(allocated))!;
        Assert.Equal(0, prepared["status"]!["pontos"]!.GetValue<int>());
        Assert.Equal(0, prepared["status"]!["pontosAtributo"]!.GetValue<int>());
        Assert.False(prepared["status"]!["pontosIniciaisDisponiveisNaRun"]!.GetValue<bool>());

        const string racialOnly = """{"status":{"pontos":10,"pontosAtributo":10,"atributos":{"principais":{"resistencia":1,"agilidade":0}}}}""";
        JsonNode unallocated = JsonNode.Parse(GameRunAttributes.Prepare(racialOnly))!;
        Assert.Equal(20, unallocated["status"]!["pontos"]!.GetValue<int>() +
            unallocated["status"]!["pontosAtributo"]!.GetValue<int>());
        Assert.True(unallocated["status"]!["pontosIniciaisDisponiveisNaRun"]!.GetValue<bool>());
    }

    [Fact]
    public void RunLegadaSemMarcadorNaoExibeSaldoDeCriacaoComoPontoDeNivel()
    {
        var version = Version();
        const string snapshot = """{"status":{"nivel":1,"pontos":10,"pontosAtributo":10,"atributos":{"principais":{"sabedoria":2}}}}""";
        Assert.Equal(0, GameRunAttributes.Options(snapshot, version).Pontos);
        const string afterLevel = """{"status":{"nivel":2,"pontos":11,"pontosAtributo":10,"pontosConcedidosNaRun":1,"atributos":{"principais":{"sabedoria":2}}}}""";
        Assert.Equal(1, GameRunAttributes.Options(afterLevel, version).Pontos);
    }

    [Fact]
    public void ResistenciaAumentaVidaMaximaPelaRegraPublicadaSemCurar()
    {
        var version = Version();
        version.Atributos.First().CodigoAtributo = "RESISTENCIA";
        version.Atributos.First().Nome = "Resistência";
        version.Modulos.First().ConfiguracaoJson = """{"influenciasAtributos":[{"codigoAtributo":"RESISTENCIA","recurso":"vida","percentualPorValor":10}]}""";
        const string snapshot = """{"status":{"pontosAtributo":1,"pontosIniciaisDisponiveisNaRun":false,"atributos":{"principais":{"resistencia":2}},"status":{"vida":800,"vidaMaxima":1000}}}""";
        GameAttributeOption option = GameRunAttributes.Options(snapshot, version).Atributos.Single();
        Assert.Equal(1300, option.Recursos.Single().Depois);
        JsonNode upgraded = JsonNode.Parse(GameRunAttributes.Upgrade(snapshot, version, "resistencia"))!;
        Assert.Equal(1300, upgraded["status"]!["status"]!["vidaMaxima"]!.GetValue<int>());
        Assert.Equal(800, upgraded["status"]!["status"]!["vida"]!.GetValue<int>());
        Assert.Equal(3, upgraded["status"]!["atributos"]!["principais"]!["resistencia"]!.GetValue<int>());
    }

    [Fact]
    public void AtributoRespeitaLimitesEPontosSemInventarBonus()
    {
        var version = Version();
        version.Modulos.First().ConfiguracaoJson = "{}";
        const string atLimit = """{"status":{"pontos":1,"atributos":{"principais":{"sabedoria":3}},"status":{"mana":40,"manaMaxima":100}}}""";
        Assert.Empty(GameRunAttributes.Options(atLimit, version).Atributos.Single().Recursos);
        Assert.Throws<InvalidOperationException>(() => GameRunAttributes.Upgrade(atLimit, version, "sabedoria"));
        Assert.Throws<InvalidOperationException>(() => GameRunAttributes.Upgrade(atLimit.Replace("\"pontos\":1", "\"pontos\":0"), version, "sabedoria"));
        Assert.Throws<InvalidOperationException>(() => GameRunAttributes.Upgrade(atLimit, version, "nao_existe"));
        version.Modulos.First().Habilitado = false;
        Assert.Empty(GameRunAttributes.Options(atLimit, version).Atributos);
    }

    private static GameLootEntry Entry(string id, int weight) => new()
    {
        ItemId = id, Weight = weight,
        Snapshot = new JsonObject { ["nome"] = id, ["tipo"] = "arma", ["atributos"] = new JsonObject { ["dano"] = 20 } },
    };

    private static SistemaVersao Version() => new()
    {
        Modulos = [new() { TipoModulo = SistemaModuloTipo.Progressao, Habilitado = true,
            ConfiguracaoJson = """{"influenciasAtributos":[{"codigoAtributo":"SABEDORIA","recurso":"mana","percentualPorValor":10}]}""" }],
        Atributos = [new() { CodigoAtributo = "SABEDORIA", Nome = "Sabedoria", Grupo = SistemaAtributoGrupo.Principal,
            Ativo = true, ValorMaximoNatural = 3, ValorMaximoAbsoluto = 5 }],
    };
}
