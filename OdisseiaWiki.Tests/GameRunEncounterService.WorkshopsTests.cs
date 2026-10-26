using System.Text.Json;
using System.Text.Json.Nodes;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.GameRuns;
using OdisseiaWiki.GameRuns.Battle;
using OdisseiaWiki.GameRuns.Map;
using OdisseiaWiki.Models;
using OdisseiaWiki.Services;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed partial class GameRunEncounterServiceTests
{
    private static GameModeVendorOfferDto SageSpell(bool support = false) => new()
    {
        ItemId = "magia-criada", Price = 10, Stock = 1, Weight = 3, MinLevel = 1,
        Snapshot = new() { ["nome"] = "Pulso", ["tipo"] = support ? "suporte" : "ataque",
            ["atributos"] = support ? new JsonObject { ["recuperacaoVida"] = 25, ["custoMana"] = 3 }
            : new JsonObject { ["dano"] = 35, ["custoMana"] = 3, ["limiteAtaquesPorTurno"] = 3,
                ["teste"] = new JsonObject { ["codigoTeste"] = "ATAQUE_COMUM" } } }
    };

    private static Fixture Workshop(string type, bool support = false)
    {
        var fixture = new Fixture(); UseMemory(fixture); UseNpc(fixture, type, false);
        fixture.Version.SkillConfig = new() { MaximoMagias = 3, UsaCooldown = true };
        fixture.Version.SistemaRpg = new() { Codigo = "ODISSEIA" };
        var map = GameRunFirstMap.Read(fixture.Run.MapaJson, new(JsonSerializerDefaults.Web));
        var npc = map.Nodes.Single(node => node.Id == "npc");
        npc.Payload = new() { NpcCode = "npc-a", NpcType = type, Upgrade = new() { Damage = 7, Price = 10, MaxUpgrades = 2 },
            Offers = type == "SABIO" ? [SageSpell(support)] : [new() { ItemId = "protese", Price = 10, Stock = 2,
                Snapshot = new() { ["nome"] = "Braço", ["tipo"] = "implante", ["atributos"] = new JsonObject() } }] };
        fixture.Run.MapaJson = JsonSerializer.Serialize(map, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        var state = JsonNode.Parse(fixture.Run.EstadoAtualJson)!.AsObject();
        state["economy"] = new JsonObject { ["balance"] = 100, ["stash"] = new JsonArray() };
        state["inventario"] = JsonNode.Parse("""[{"id":"espada","nome":"Espada","tipo":"arma","atributos":{"tipoArma":"espada","danoBase":20,"modificadores":{"dano":2}}}]""");
        fixture.Run.EstadoAtualJson = state.ToJsonString();
        return fixture;
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task SabioEnsinaCopiaExecutavelSemDuplicarDebitoNemEquipar(bool support)
    {
        var fixture = Workshop("SABIO", support);
        Assert.True((await fixture.Service.VisitNpcAsync(10, "npc", 5, Request(0), default)).Sucesso);
        var request = new GameRunVendorPurchaseRequestDto { RevisaoEsperada = 1, ChaveIdempotencia = Guid.NewGuid(), ItemId = "magia-criada" };
        var response = await fixture.Service.BuyVendorItemAsync(10, 5, request, default);
        Assert.True(response.Sucesso, response.Mensagem);
        Assert.True((await fixture.Service.BuyVendorItemAsync(10, 5, request, default)).Repetido);
        Assert.Equal(90, response.Dados!.EstadoAtual.Economy!.Balance);
        var spell = Assert.Single(response.Dados.EstadoAtual.Magia!.Value.EnumerateArray());
        Assert.Equal("magia-criada", spell.GetProperty("idMagiaBase").GetString());
        Assert.Null(response.Dados.AcoesEquipadas);
        Assert.DoesNotContain("Pulso", fixture.Run.SnapshotInicialJson);
        var run = new GameRunDto { IdSistemaVersao = 7, EstadoAtual = response.Dados.EstadoAtual,
            ConfiguracaoModo = response.Dados.ConfiguracaoModo, AcoesEquipadas = [new() { Tipo = "MAGIA",
                IdInstancia = spell.GetProperty("id").GetString()!, QuantidadeAtaques = support ? 1 : 3 }] };
        var action = Assert.Single(new GameBattlePreviewFactory(new GameplayActionResolver()).Build(run, fixture.Version).Input.FirstActor.Actions, action => !action.IsFallback);
        Assert.Equal(3, action.ManaCost);
        Assert.Equal(support ? 1 : 3, action.AttacksPerTurn);
        Assert.True((await fixture.Service.LeaveVendorAsync(10, 5, Request(2), default)).Sucesso);
    }

    [Theory]
    [InlineData("saldo")]
    [InlineData("nivel")]
    [InlineData("limite")]
    [InlineData("destino")]
    [InlineData("revisao")]
    [InlineData("proprietario")]
    public async Task SabioRejeitaCompraSemAlterarEstado(string reason)
    {
        var fixture = Workshop("SABIO");
        if (reason == "limite") fixture.Version.SkillConfig!.MaximoMagias = 0;
        var state = JsonNode.Parse(fixture.Run.EstadoAtualJson)!;
        if (reason == "saldo") state["economy"]!["balance"] = 0;
        fixture.Run.EstadoAtualJson = state.ToJsonString();
        if (reason == "nivel")
        {
            var map = JsonNode.Parse(fixture.Run.MapaJson!)!;
            map["nodes"]![1]!["payload"]!["offers"]![0]!["minLevel"] = 2;
            fixture.Run.MapaJson = map.ToJsonString();
        }
        Assert.True((await fixture.Service.VisitNpcAsync(10, "npc", 5, Request(0), default)).Sucesso);
        string before = fixture.Run.EstadoAtualJson, mapBefore = fixture.Run.MapaJson!;
        var response = await fixture.Service.BuyVendorItemAsync(10, reason == "proprietario" ? 99 : 5, new() {
            RevisaoEsperada = reason == "revisao" ? 0 : 1, ChaveIdempotencia = Guid.NewGuid(),
            ItemId = "magia-criada", ToStash = reason == "destino" }, default);
        Assert.False(response.Sucesso);
        Assert.Equal(before, fixture.Run.EstadoAtualJson); Assert.Equal(mapBefore, fixture.Run.MapaJson);
        Assert.Equal(1, fixture.Run.Revisao);
    }

    [Fact]
    public async Task EngenheiroMelhoraModificadorComLimiteIdempotenciaECompraProteseSemDeposito()
    {
        var fixture = Workshop("ENGENHEIRO");
        Assert.True((await fixture.Service.VisitNpcAsync(10, "npc", 5, Request(0), default)).Sucesso);
        var request = new GameRunVendorPurchaseRequestDto { RevisaoEsperada = 1, ChaveIdempotencia = Guid.NewGuid(), ItemId = "espada" };
        var response = await fixture.Service.UpgradeWeaponAsync(10, 5, request, default);
        Assert.True(response.Sucesso, response.Mensagem);
        Assert.True((await fixture.Service.UpgradeWeaponAsync(10, 5, request, default)).Repetido);
        var item = Assert.Single(response.Dados!.EstadoAtual.Inventario!.Value.EnumerateArray());
        Assert.Equal(20, item.GetProperty("atributos").GetProperty("danoBase").GetInt32());
        Assert.Equal(9, item.GetProperty("atributos").GetProperty("modificadores").GetProperty("dano").GetInt32());
        Assert.Equal(1, item.GetProperty("__runEngineerUpgrades").GetInt32());
        Assert.False(GameRunEconomy.CanAccessStash(response.Dados.Mapa, "npc"));
        Assert.True((await fixture.Service.UpgradeWeaponAsync(10, 5, new() { RevisaoEsperada = 2, ChaveIdempotencia = Guid.NewGuid(), ItemId = "espada" }, default)).Sucesso);
        string before = fixture.Run.EstadoAtualJson;
        Assert.False((await fixture.Service.UpgradeWeaponAsync(10, 5, new() { RevisaoEsperada = 3, ChaveIdempotencia = Guid.NewGuid(), ItemId = "espada" }, default)).Sucesso);
        Assert.Equal(before, fixture.Run.EstadoAtualJson);
        var bought = await fixture.Service.BuyVendorItemAsync(10, 5, new() { RevisaoEsperada = 3, ChaveIdempotencia = Guid.NewGuid(), ItemId = "protese" }, default);
        Assert.True(bought.Sucesso, bought.Mensagem);
        Assert.Single(bought.Dados!.EstadoAtual.Implantes!.Value.EnumerateArray());
        Assert.Equal(70, bought.Dados.EstadoAtual.Economy!.Balance);
        Assert.True((await fixture.Service.LeaveVendorAsync(10, 5, Request(4), default)).Sucesso);
    }

    [Fact]
    public void ServicosValidamMagiaCondicaoCooldownEArmaNaoElegivel()
    {
        var fixture = Workshop("SABIO");
        var spell = SageSpell();
        spell.Snapshot!["atributos"]!["teste"]!["codigoTeste"] = "INEXISTENTE";
        Assert.Throws<InvalidOperationException>(() => GameRunNpcServices.ValidateSpell(spell, fixture.Version));
        spell = SageSpell();
        spell.Snapshot!["atributos"]!["condicoes"] = JsonNode.Parse("""[{"codigo":"INEXISTENTE"}]""");
        Assert.Throws<InvalidOperationException>(() => GameRunNpcServices.ValidateSpell(spell, fixture.Version));
        spell = SageSpell(); spell.Snapshot!["atributos"]!["cooldownTurnos"] = 2;
        fixture.Version.SkillConfig!.UsaCooldown = false;
        Assert.Throws<InvalidOperationException>(() => GameRunNpcServices.ValidateSpell(spell, fixture.Version));
        Assert.False(GameRunNpcServices.CanUpgrade(JsonNode.Parse("""{"tipo":"traje","atributos":{"danoBase":10}}""")!.AsObject()));
        Assert.True(GameRunNpcServices.CanUpgrade(JsonNode.Parse("""{"tipo":"arma","atributos":{"danoPorAlcance":{"curta":10}}}""")!.AsObject()));
    }

    [Theory]
    [InlineData(SistemaAtributoGrupo.Principal, false)]
    [InlineData(SistemaAtributoGrupo.Principal, true)]
    [InlineData(SistemaAtributoGrupo.Secundario, false)]
    [InlineData(SistemaAtributoGrupo.Secundario, true)]
    public void CatalogoValidaTesteComAtributoDoSistemaSemExigirFichaDeJogador(SistemaAtributoGrupo group, bool conditionOnly)
    {
        var fixture = Workshop("SABIO");
        fixture.Version.Atributos.Add(new() { CodigoAtributo = "SABEDORIA", Nome = "Sabedoria", Grupo = group, Ativo = true });
        fixture.Version.Condicoes.Add(new() { Codigo = "MARCA", Nome = "Marca", Tipo = "Fisico",
            OperacaoEfeito = "SUBTRAIR", CodigoRecurso = "VIDA", ValorEfeito = 3, MomentoEfeito = "INICIO_TURNO", RegraRemocao = "DURACAO" });
        var offer = SageSpell();
        var attributes = offer.Snapshot!["atributos"]!;
        attributes["teste"]!["codigoAtributo"] = "sabedoria";
        attributes["teste"]!["grupoAtributo"] = group.ToString();
        attributes["teste"]!["modo"] = "Normal";
        if (conditionOnly)
        {
            attributes["dano"] = 0;
            attributes["condicoes"] = JsonNode.Parse("""[{"codigo":"MARCA","gatilho":"ACERTO","duracao":3,"unidadeDuracao":"Turno"}]""");
        }
        string before = offer.Snapshot.ToJsonString();
        GameRunNpcServices.ValidateSpell(offer, fixture.Version);
        Assert.Equal(before, offer.Snapshot.ToJsonString());
        var root = JsonNode.Parse(fixture.Run.EstadoAtualJson)!;
        root["status"]!["atributos"] = new JsonObject {
            [group == SistemaAtributoGrupo.Secundario ? "secundarios" : "principais"] = new JsonObject { ["sabedoria"] = 4 } };
        string learned = GameRunNpcServices.Learn(root.ToJsonString(), offer, fixture.Version);
        var jsonOptions = new JsonSerializerOptions(JsonSerializerDefaults.Web);
        var state = JsonSerializer.Deserialize<GameRunCharacterSnapshotDto>(learned, jsonOptions)!;
        string id = state.Magia!.Value.EnumerateArray().Last().GetProperty("id").GetString()!;
        using var config = JsonDocument.Parse(fixture.Run.GameModeVersion.ConfiguracaoJson);
        var run = new GameRunDto { IdSistemaVersao = 7, EstadoAtual = state, ConfiguracaoModo = config.RootElement.Clone(),
            AcoesEquipadas = [new() { Tipo = "MAGIA", IdInstancia = id }] };
        var action = Assert.Single(new GameBattlePreviewFactory(new GameplayActionResolver()).Build(run, fixture.Version)
            .Input.FirstActor.Actions, action => !action.IsFallback);
        Assert.Equal(4, action.Roll.Modifier);
        if (conditionOnly) Assert.Single(action.Conditions);
    }

    [Theory]
    [InlineData("atributo-ausente")]
    [InlineData("atributo-inativo")]
    [InlineData("dado-d6")]
    public void CatalogoRejeitaReferenciaInvalidaComMotivoEspecifico(string reason)
    {
        var fixture = Workshop("SABIO");
        var offer = SageSpell();
        if (reason == "dado-d6")
            foreach (var row in fixture.Version.ResultadosDado) row.Dado = "D6";
        else
        {
            offer.Snapshot!["atributos"]!["teste"]!["codigoAtributo"] = "SABEDORIA";
            if (reason == "atributo-inativo") fixture.Version.Atributos.Add(new() {
                CodigoAtributo = "SABEDORIA", Nome = "Sabedoria", Grupo = SistemaAtributoGrupo.Principal, Ativo = false });
        }
        var error = Assert.Throws<InvalidOperationException>(() => GameRunNpcServices.ValidateSpell(offer, fixture.Version));
        Assert.Contains(reason == "dado-d6" ? "1D20" : "atributo escolhido", error.Message);
    }

    [Fact]
    public void CatalogoAceitaCondicaoSemDanoNemRecuperacaoDiretaAoUsar()
    {
        var fixture = Workshop("SABIO");
        fixture.Version.Condicoes.Add(new() { Codigo = "REGENERACAO", Nome = "Regeneração", Tipo = "Fisico",
            OperacaoEfeito = "SOMAR", CodigoRecurso = "VIDA", ValorEfeito = 3, MomentoEfeito = "INICIO_TURNO", RegraRemocao = "DURACAO" });
        var offer = SageSpell();
        var attributes = offer.Snapshot!["atributos"]!.AsObject();
        attributes["dano"] = 0; attributes.Remove("teste");
        attributes["condicoes"] = JsonNode.Parse("""[{"codigo":"REGENERACAO","gatilho":"AO_USAR","alvo":"USUARIO","duracao":4,"unidadeDuracao":"Turno"}]""");
        GameRunNpcServices.ValidateSpell(offer, fixture.Version);
    }

    [Theory]
    [InlineData("ACERTO", false)]
    [InlineData("AO_USAR", true)]
    public void MagiaDoCatalogoReutilizaValidacaoDeCondicoesESeusValores(string trigger, bool support)
    {
        var fixture = Workshop("SABIO");
        fixture.Version.Condicoes.Add(new() { Codigo = "MARCA", Nome = "Marca", Tipo = "Fisico",
            OperacaoEfeito = "SUBTRAIR", CodigoRecurso = "VIDA", ValorEfeito = 3, MomentoEfeito = "INICIO_TURNO", RegraRemocao = "DURACAO" });
        var offer = SageSpell(support);
        offer.Snapshot!["atributos"]!["condicoes"] = new JsonArray(new JsonObject { ["codigo"] = "MARCA", ["gatilho"] = trigger,
            ["alvo"] = "TODOS_INIMIGOS", ["duracao"] = 3, ["unidadeDuracao"] = "Turno", ["valor"] = 5 });
        GameRunNpcServices.ValidateSpell(offer, fixture.Version);
        offer.Snapshot["atributos"]!["condicoes"]![0]!["duracao"] = -1;
        Assert.Throws<InvalidOperationException>(() => GameRunNpcServices.ValidateSpell(offer, fixture.Version));
    }

    [Theory]
    [InlineData("magias")]
    [InlineData("magia")]
    [InlineData("poderes")]
    public void AprenderPreservaEnvelopeLegadoEContinuaExecutavelNoCombate(string envelope)
    {
        var fixture = Workshop("SABIO");
        var root = JsonNode.Parse(fixture.Run.EstadoAtualJson)!;
        root["magia"] = new JsonObject { [envelope] = new JsonArray(new JsonObject { ["id"] = "antiga", ["nome"] = "Antiga" }) };
        string learned = GameRunNpcServices.Learn(root.ToJsonString(), SageSpell(), fixture.Version);
        var result = JsonNode.Parse(learned)!;
        Assert.Equal(2, result["magia"]![envelope]!.AsArray().Count);
        Assert.Equal("antiga", result["magia"]![envelope]![0]!["id"]!.ToString());
        using var config = JsonDocument.Parse(fixture.Run.GameModeVersion.ConfiguracaoJson);
        var run = new GameRunDto { IdSistemaVersao = 7, EstadoAtual = JsonSerializer.Deserialize<GameRunCharacterSnapshotDto>(learned,
            new JsonSerializerOptions(JsonSerializerDefaults.Web))!, ConfiguracaoModo = config.RootElement.Clone(),
            AcoesEquipadas = [new() { Tipo = "MAGIA", IdInstancia = result["magia"]![envelope]![1]!["id"]!.ToString() }] };
        Assert.Contains(new GameBattlePreviewFactory(new GameplayActionResolver()).Build(run, fixture.Version).Input.FirstActor.Actions,
            action => action.Name == "Pulso" && !action.IsFallback);
    }
}
