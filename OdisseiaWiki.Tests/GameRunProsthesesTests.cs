using System.Text.Json;
using System.Text.Json.Nodes;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.GameRuns;
using OdisseiaWiki.GameRuns.Battle;
using OdisseiaWiki.GameRuns.Inventory;
using OdisseiaWiki.Models;
using OdisseiaWiki.Services;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed partial class GameRunEncounterServiceTests
{
    private static Fixture ProsthesisFixture(bool ranged = false, bool tested = true)
    {
        var fixture = InventoryFixture();
        fixture.Version.Atributos = [
            new() { CodigoAtributo = "RESISTENCIA", Nome = "Resistência", Grupo = SistemaAtributoGrupo.Principal },
            new() { CodigoAtributo = "PRECISAO", Nome = "Precisão", Grupo = SistemaAtributoGrupo.Principal }];
        fixture.Version.TiposDefesa.Add(new() { Codigo = "ARMADURA", Nome = "Armadura", OrdemAplicacao = 3,
            TipoComportamento = "AbsorcaoConstante" });
        var root = JsonNode.Parse(fixture.Run.EstadoAtualJson)!;
        root["status"]!["atributos"] = JsonNode.Parse("""{"principais":{"resistencia":2,"precisao":3}}""");
        var attributes = JsonNode.Parse("""
            {"bonus":{"vida":200,"mana":10,"estamina":10,"resistencia":1,"precisao":2},
             "protecaoBase":70,"escudoBase":20,"armaduraBase":5,"danoBase":30,"tipoArma":"espada",
             "gastoEstaminaPorAtaque":2,"limiteAtaquesPorTurno":2}
            """)!.AsObject();
        if (tested) attributes["teste"] = JsonNode.Parse("""
            {"codigoTeste":"ATAQUE_COMUM","codigoAtributo":"RESISTENCIA","grupoAtributo":"Principal","modo":"Normal","usaTotalParaFaixas":true}
            """);
        attributes["aplicaTeste"] = tested;
        if (ranged)
        {
            attributes["tipoArma"] = "rifle_assalto";
            attributes["danoPorAlcance"] = JsonNode.Parse("""{"curta":50,"media":40,"longa":25}""");
            attributes["controlaMunicao"] = true; attributes["capacidadeMunicao"] = 10;
            attributes["municaoAtual"] = 10; attributes["custoMunicaoTiro"] = 1;
        }
        root["implantes"] = new JsonObject { ["implantes"] = new JsonArray(new JsonObject {
            ["id"] = "braco", ["nome"] = "Braço integrado", ["tipo"] = "implante", ["atributos"] = attributes }) };
        fixture.Run.EstadoAtualJson = root.ToJsonString();
        return fixture;
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task ProteseComTesteEquipaAcaoEBonusUmaVezEUsaMesmoCombateDasArmas(bool ranged)
    {
        var fixture = ProsthesisFixture(ranged);
        string original = fixture.Run.SnapshotInicialJson;
        var request = new GameRunLoadoutRequestDto { RevisaoEsperada = 0, ChaveIdempotencia = Guid.NewGuid(),
            Acoes = [new() { Tipo = "PROTESE", IdInstancia = "braco", QuantidadeAtaques = 2,
                Alcance = ranged ? "MEDIA" : null }], DefesasEquipadas = [] };
        var saved = await fixture.Service.UpdateLoadoutAsync(10, 5, request, default);
        Assert.True(saved.Sucesso, saved.Mensagem);
        var resources = saved.Dados!.EstadoAtual.Status.GetProperty("status");
        Assert.Equal(230, resources.GetProperty("vidaMaxima").GetInt32());
        Assert.Equal(30, resources.GetProperty("vida").GetInt32());
        Assert.Equal(20, resources.GetProperty("manaMaxima").GetInt32());
        Assert.Equal(70, saved.Dados.EstadoAtual.Status.GetProperty("defesas").GetProperty("protecao").GetInt32());
        var setup = new GameBattlePreviewFactory(new GameplayActionResolver()).Build(saved.Dados, fixture.Version);
        var action = Assert.Single(setup.Input.FirstActor.Actions, action => !action.IsFallback);
        Assert.Equal(3, action.Roll.Modifier); Assert.Equal(2, action.AttacksPerTurn);
        Assert.Equal(ranged ? 40 : 30, action.DamageByResultCode["ACERTO"]);
        Assert.Equal(5, setup.Input.FirstActor.Attributes["PRECISAO"]);
        if (ranged) Assert.Equal(10, action.Magazine!.Capacity); else Assert.Null(action.Magazine);
        Assert.True((await fixture.Service.UpdateLoadoutAsync(10, 5, request, default)).Repetido);
        Assert.Equal(230, JsonNode.Parse(fixture.Run.EstadoAtualJson)!["status"]!["status"]!["vidaMaxima"]!.GetValue<int>());
        Assert.Equal(original, fixture.Run.SnapshotInicialJson);
    }

    [Fact]
    public async Task InstalacaoDiretaComoNoLootSincronizaAcaoEBonusERetirada()
    {
        var fixture = ProsthesisFixture();
        var request = new GameRunEquipDefenseRequestDto { RevisaoEsperada = 0, ChaveIdempotencia = Guid.NewGuid(), Equipado = true };
        var equipped = await fixture.Service.EquipDefenseAsync(10, 5, "braco", request, default);
        Assert.True(equipped.Sucesso, equipped.Mensagem);
        Assert.Equal("braco", Assert.Single(equipped.Dados!.AcoesEquipadas!).IdInstancia);
        Assert.True((await fixture.Service.EquipDefenseAsync(10, 5, "braco", request, default)).Repetido);
        var removed = await fixture.Service.EquipDefenseAsync(10, 5, "braco", new() { RevisaoEsperada = 1,
            ChaveIdempotencia = Guid.NewGuid(), Equipado = false }, default);
        Assert.True(removed.Sucesso, removed.Mensagem); Assert.Empty(removed.Dados!.AcoesEquipadas!);
        Assert.Equal(30, removed.Dados.EstadoAtual.Status.GetProperty("status").GetProperty("vidaMaxima").GetInt32());
    }

    [Fact]
    public void InimigoComProteseUsaBonusEAtaqueSemAlterarSnapshotDoTreino()
    {
        var fixture = ProsthesisFixture();
        var root = JsonNode.Parse(fixture.Run.EstadoAtualJson)!;
        var encounter = new GameBattleEncounterConfig { Enemy = new() { NpcId = 42, Name = "Androide", MaxVida = 30,
            MaxMana = 10, MaxEstamina = 10, StatusJson = root["status"]!.ToJsonString(), InventarioJson = "[]",
            ImplantesJson = root["implantes"]!.ToJsonString(), Actions = [new() { Tipo = "PROTESE", IdInstancia = "braco" }] },
            DamageByResult = fixture.Version.ResultadosDado.ToDictionary(row => row.CodigoResultado, _ => 5) };
        string original = encounter.Enemy.StatusJson;
        var factory = new GameBattlePreviewFactory(new GameplayActionResolver());
        using var config = JsonDocument.Parse(fixture.Run.GameModeVersion.ConfiguracaoJson);
        var run = new GameRunDto { IdSistemaVersao = 7, AcoesEquipadas = [], ConfiguracaoModo = config.RootElement.Clone(),
            EstadoAtual = JsonSerializer.Deserialize<GameRunCharacterSnapshotDto>(fixture.Run.EstadoAtualJson,
                new JsonSerializerOptions(JsonSerializerDefaults.Web))! };
        var first = factory.Build(run, fixture.Version, trainingEncounter: encounter).Input.SecondActor;
        var repeated = factory.Build(run, fixture.Version, trainingEncounter: encounter).Input.SecondActor;
        Assert.Equal(230, first.MaximumHitPoints); Assert.Equal(first.MaximumHitPoints, repeated.MaximumHitPoints);
        Assert.Equal(3, Assert.Single(first.Actions).Roll.Modifier);
        Assert.Equal(70, first.Defenses.Protection); Assert.Equal(20, first.Defenses.Shield);
        Assert.Equal(original, encounter.Enemy.StatusJson);
    }

    [Fact]
    public async Task ProteseCompradaNoEngenheiroInstalaComBonusDoCatalogo()
    {
        var source = ProsthesisFixture(tested: false);
        var fixture = Workshop("ENGENHEIRO");
        fixture.Run.LoadoutJson = GameRunActionLoadout.Serialize([]);
        fixture.Version.Atributos = source.Version.Atributos; fixture.Version.TiposDefesa = source.Version.TiposDefesa;
        var map = JsonNode.Parse(fixture.Run.MapaJson!)!;
        var npc = map["nodes"]!.AsArray().First(node => node?["id"]?.ToString() == "npc")!;
        npc["payload"]!["offers"]![0]!["snapshot"]!["atributos"] =
            JsonNode.Parse(source.Run.EstadoAtualJson)!["implantes"]!["implantes"]![0]!["atributos"]!.DeepClone();
        fixture.Run.MapaJson = map.ToJsonString();
        Assert.True((await fixture.Service.VisitNpcAsync(10, "npc", 5, Request(0), default)).Sucesso);
        var bought = await fixture.Service.BuyVendorItemAsync(10, 5, new() { RevisaoEsperada = 1,
            ChaveIdempotencia = Guid.NewGuid(), ItemId = "protese" }, default);
        Assert.True(bought.Sucesso, bought.Mensagem);
        string id = bought.Dados!.EstadoAtual.Implantes!.Value.EnumerateArray().Single().GetProperty("id").GetString()!;
        Assert.True((await fixture.Service.LeaveVendorAsync(10, 5, Request(2), default)).Sucesso);
        var equipped = await fixture.Service.EquipDefenseAsync(10, 5, id, new() { RevisaoEsperada = 3,
            ChaveIdempotencia = Guid.NewGuid(), Equipado = true }, default);
        Assert.True(equipped.Sucesso, equipped.Mensagem);
        Assert.Equal(230, equipped.Dados!.EstadoAtual.Status.GetProperty("status").GetProperty("vidaMaxima").GetInt32());
        Assert.Equal(90, equipped.Dados.EstadoAtual.Economy!.Balance);
        Assert.Empty(equipped.Dados.AcoesEquipadas!);
    }

    [Fact]
    public async Task ProtesePassivaNaoOcupaAcaoEVoltaAoOriginalAoRetirarSemCurar()
    {
        var fixture = ProsthesisFixture(tested: false);
        var saved = await fixture.Service.UpdateLoadoutAsync(10, 5, new() { RevisaoEsperada = 0, ChaveIdempotencia = Guid.NewGuid(),
            Acoes = [], DefesasEquipadas = ["braco"] }, default);
        Assert.True(saved.Sucesso, saved.Mensagem); Assert.Empty(saved.Dados!.AcoesEquipadas!);
        string snapshot = GameRunCarry.Reconcile(fixture.Run.EstadoAtualJson, fixture.Version);
        snapshot = GameRunCarry.Reconcile(snapshot, fixture.Version);
        Assert.Equal(230, JsonNode.Parse(snapshot)!["status"]!["status"]!["vidaMaxima"]!.GetValue<int>());
        var removed = await fixture.Service.UpdateLoadoutAsync(10, 5, new() { RevisaoEsperada = 1, ChaveIdempotencia = Guid.NewGuid(),
            Acoes = [], DefesasEquipadas = [] }, default);
        Assert.True(removed.Sucesso, removed.Mensagem);
        var status = removed.Dados!.EstadoAtual.Status;
        Assert.Equal(30, status.GetProperty("status").GetProperty("vidaMaxima").GetInt32());
        Assert.Equal(2, status.GetProperty("atributos").GetProperty("principais").GetProperty("resistencia").GetInt32());
        Assert.Equal(0, status.GetProperty("defesas").GetProperty("protecao").GetInt32());
        Assert.False(GameRunDefensiveEquipment.IsEquipped(fixture.Run.EstadoAtualJson, "braco"));
    }

    [Fact]
    public async Task ProteseSemTesteNaoPodeVirarAcaoERejeicaoNaoAplicaBonusParcial()
    {
        var fixture = ProsthesisFixture(tested: false);
        string before = fixture.Run.EstadoAtualJson;
        var saved = await fixture.Service.UpdateLoadoutAsync(10, 5, new() { RevisaoEsperada = 0, ChaveIdempotencia = Guid.NewGuid(),
            Acoes = [new() { Tipo = "PROTESE", IdInstancia = "braco" }], DefesasEquipadas = ["braco"] }, default);
        Assert.False(saved.Sucesso); Assert.Equal(before, fixture.Run.EstadoAtualJson);
        Assert.Equal(0, fixture.Run.Revisao);
    }

    [Fact]
    public void ProtecaoDaProteseGastaPersisteRetiradaEDepositoEBaseNaoRecuperaEscudo()
    {
        var fixture = ProsthesisFixture();
        string installed = GameRunDefensiveEquipment.SetEquipped(fixture.Run.EstadoAtualJson, "braco", true);
        installed = GameRunCarry.Reconcile(installed, fixture.Version);
        var root = JsonNode.Parse(installed)!.AsObject();
        root["inventario"] = new JsonArray();
        GameRunDefensiveEquipment.RecordSpentDefenses(root, 20, 50);
        root["status"]!["defesas"]!["escudo"] = 0; root["status"]!["defesas"]!["protecao"] = 20;
        string removed = GameRunDefensiveEquipment.SetEquipped(root.ToJsonString(), "braco", false);
        removed = GameRunCarry.Reconcile(removed, fixture.Version);
        string stored = GameRunCarry.Reconcile(GameRunEconomy.Transfer(removed, "braco", true), fixture.Version);
        string taken = GameRunEconomy.Transfer(stored, "braco", false);
        string reequipped = GameRunCarry.Reconcile(GameRunDefensiveEquipment.SetEquipped(taken, "braco", true), fixture.Version);
        Assert.Equal(20, JsonNode.Parse(reequipped)!["status"]!["defesas"]!["protecao"]!.GetValue<int>());
        Assert.Equal(0, JsonNode.Parse(reequipped)!["status"]!["defesas"]!["escudo"]!.GetValue<int>());
        var repaired = GameRunDefensiveEquipment.RestoreProtectionAtBase(reequipped);
        Assert.Equal(50, repaired.Repaired);
        Assert.Equal(0, JsonNode.Parse(repaired.Snapshot)!["status"]!["defesas"]!["escudo"]!.GetValue<int>());
    }

    [Fact]
    public void RetirarProtesePreservaBaseMesmoQuandoBonusAtingePisoOuTetoSeguro()
    {
        foreach (int bonus in new[] { -100, 1000000 })
        {
            var fixture = ProsthesisFixture(tested: false);
            var root = JsonNode.Parse(fixture.Run.EstadoAtualJson)!;
            root["implantes"]!["implantes"]![0]!["atributos"]!["bonus"]!["vida"] = bonus;
            string equipped = GameRunCarry.Reconcile(GameRunDefensiveEquipment.SetEquipped(root.ToJsonString(), "braco", true), fixture.Version);
            equipped = GameRunCarry.Reconcile(equipped, fixture.Version);
            string removed = GameRunCarry.Reconcile(GameRunDefensiveEquipment.SetEquipped(equipped, "braco", false), fixture.Version);
            Assert.Equal(30, JsonNode.Parse(removed)!["status"]!["status"]!["vidaMaxima"]!.GetValue<int>());
        }
    }

    [Fact]
    public void BonusVitalDaProteseRespeitaLimitesReduzidosAoInstalarERetirar()
    {
        var fixture = ProsthesisFixture();
        fixture.Version.Condicoes.Add(new() { Codigo = "DEPENDENCIA", Nome = "Dependência", Tipo = "Fisico",
            CodigoRecursoGatilho = "MANA", OperadorGatilho = "<=", ValorGatilho = 0,
            OperacaoEfeito = "REDUZIR_LIMITE_PERCENTUAL", CodigoRecurso = "VIDA", ValorEfeito = 50,
            MomentoEfeito = "ENQUANTO_ATIVA", RegraRemocao = "DESCANSO_NORMAL" });
        var root = JsonNode.Parse(fixture.Run.EstadoAtualJson)!;
        root["status"]!["status"]!["mana"] = 0;
        string reduced = GameRunCarry.Reconcile(root.ToJsonString(), fixture.Version);
        string installed = GameRunCarry.Reconcile(GameRunDefensiveEquipment.SetEquipped(reduced, "braco", true), fixture.Version);
        Assert.Equal(115, JsonNode.Parse(installed)!["status"]!["status"]!["vidaMaxima"]!.GetValue<int>());
        string removed = GameRunCarry.Reconcile(GameRunDefensiveEquipment.SetEquipped(installed, "braco", false), fixture.Version);
        Assert.Equal(15, JsonNode.Parse(removed)!["status"]!["status"]!["vidaMaxima"]!.GetValue<int>());
        Assert.Equal(15, JsonNode.Parse(removed)!["status"]!["status"]!["vida"]!.GetValue<int>());
    }

    [Fact]
    public async Task CondicaoDoAtaqueDaProteseEVitalReduzidoPeloSistemaSaoExecutaveis()
    {
        var fixture = ProsthesisFixture();
        fixture.Version.Condicoes.Add(new() { Codigo = "LESADO", Nome = "Lesão", Tipo = "Fisico", OperacaoEfeito = "SUBTRAIR",
            CodigoRecurso = "VIDA", ValorEfeito = 5, MomentoEfeito = "INICIO_TURNO", RegraRemocao = "DURACAO" });
        var root = JsonNode.Parse(fixture.Run.EstadoAtualJson)!;
        root["implantes"]!["implantes"]![0]!["atributos"]!["condicoes"] = JsonNode.Parse("""[{"codigo":"LESADO","gatilho":"ACERTO","duracao":3,"unidadeDuracao":"Turno"}]""");
        fixture.Run.EstadoAtualJson = root.ToJsonString();
        var saved = await fixture.Service.UpdateLoadoutAsync(10, 5, new() { RevisaoEsperada = 0, ChaveIdempotencia = Guid.NewGuid(),
            Acoes = [new() { Tipo = "PROTESE", IdInstancia = "braco" }], DefesasEquipadas = [] }, default);
        Assert.True(saved.Sucesso, saved.Mensagem);
        var action = Assert.Single(new GameBattlePreviewFactory(new GameplayActionResolver()).Build(saved.Dados!, fixture.Version)
            .Input.FirstActor.Actions, action => !action.IsFallback);
        Assert.Equal("LESADO", Assert.Single(action.Conditions).Rule.Code);
    }
}
