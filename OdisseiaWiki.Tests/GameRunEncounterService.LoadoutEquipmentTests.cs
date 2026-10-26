using System.Text.Json.Nodes;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.GameRuns.Battle;
using OdisseiaWiki.Models;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed partial class GameRunEncounterServiceTests
{
    private static Fixture InventoryFixture()
    {
        var fixture = new Fixture();
        fixture.Version.SistemaRpg = new SistemaRpg { Codigo = "ODISSEIA" };
        fixture.Version.TiposDefesa = [
            new() { Codigo = "ESCUDO", Nome = "Escudo", OrdemAplicacao = 1, TipoComportamento = "BloqueiaUmDano" },
            new() { Codigo = "PROTECAO", Nome = "Proteção", OrdemAplicacao = 2, TipoComportamento = "AbsorveEDesgasta" }
        ];
        fixture.Run.LoadoutJson = GameRunActionLoadout.Serialize([]);
        var root = JsonNode.Parse(fixture.Run.EstadoAtualJson)!;
        root["inventario"] = JsonNode.Parse("""
        [
          {"id":"espada","nome":"Espada de teste","tipo":"arma","atributos":{"tipoArma":"espada","danoBase":18}},
          {"id":"colete","nome":"Colete de teste","tipo":"traje","atributos":{"protecaoBase":100,"escudoBase":50,
             "__runDefenseRemaining":{"protecao":25,"escudo":0}}},
          {"id":"quebrada","nome":"Lâmina sem dano","tipo":"arma","atributos":{}},
          {"id":"quebrada-2","nome":"Pistola incompleta","tipo":"arma","atributos":{}}
        ]
        """);
        fixture.Run.EstadoAtualJson = root.ToJsonString();
        return fixture;
    }

    [Fact]
    public async Task LoadoutSalvaAcaoETrajeJuntosSemRestaurarDefesaEComUmaUnicaRevisao()
    {
        var fixture = InventoryFixture();
        string original = fixture.Run.SnapshotInicialJson;
        var request = new GameRunLoadoutRequestDto { RevisaoEsperada = 0, ChaveIdempotencia = Guid.NewGuid(),
            Acoes = [new() { Tipo = "ITEM", IdInstancia = "espada" }], DefesasEquipadas = ["colete"] };
        var result = await fixture.Service.UpdateLoadoutAsync(10, 5, request, default);
        Assert.True(result.Sucesso, result.Mensagem);
        Assert.Single(result.Dados!.AcoesEquipadas!);
        Assert.Equal(25, result.Dados.EstadoAtual.Status.GetProperty("defesas").GetProperty("protecao").GetInt32());
        Assert.Equal(0, result.Dados.EstadoAtual.Status.GetProperty("defesas").GetProperty("escudo").GetInt32());
        Assert.True(GameRunDefensiveEquipment.IsEquipped(fixture.Run.EstadoAtualJson, "colete"));
        Assert.Equal(original, fixture.Run.SnapshotInicialJson);
        Assert.True((await fixture.Service.UpdateLoadoutAsync(10, 5, request, default)).Repetido);
        Assert.Equal(1, fixture.Run.Revisao);
        var removed = await fixture.Service.UpdateLoadoutAsync(10, 5, new() { RevisaoEsperada = 1, ChaveIdempotencia = Guid.NewGuid(),
            Acoes = request.Acoes, DefesasEquipadas = [] }, default);
        Assert.True(removed.Sucesso, removed.Mensagem);
        Assert.False(GameRunDefensiveEquipment.IsEquipped(fixture.Run.EstadoAtualJson, "colete"));
        Assert.Equal(0, removed.Dados!.EstadoAtual.Status.GetProperty("defesas").GetProperty("protecao").GetInt32());
    }

    [Fact]
    public async Task LoadoutInvalidoListaTodosOsNomesESemSalvarParcialmenteOTraje()
    {
        var fixture = InventoryFixture();
        string state = fixture.Run.EstadoAtualJson, loadout = fixture.Run.LoadoutJson!;
        var result = await fixture.Service.UpdateLoadoutAsync(10, 5, new() { RevisaoEsperada = 0, ChaveIdempotencia = Guid.NewGuid(),
            Acoes = [new() { Tipo = "ITEM", IdInstancia = "quebrada" }, new() { Tipo = "ITEM", IdInstancia = "espada" },
                new() { Tipo = "ITEM", IdInstancia = "quebrada-2" }], DefesasEquipadas = ["colete"] }, default);
        Assert.Equal("ACAO_INEXECUTAVEL", result.Codigo);
        Assert.Contains("Lâmina sem dano", result.Mensagem);
        Assert.Contains("Pistola incompleta", result.Mensagem);
        Assert.DoesNotContain("Espada de teste", result.Mensagem);
        Assert.Equal(state, fixture.Run.EstadoAtualJson); Assert.Equal(loadout, fixture.Run.LoadoutJson);
        Assert.Equal(0, fixture.Run.Revisao);
    }

    [Fact]
    public async Task LoadoutAntigoPreservaTrajeESolicitacaoInvalidaNaoAlteraInventario()
    {
        var fixture = InventoryFixture();
        fixture.Run.EstadoAtualJson = GameRunDefensiveEquipment.SetEquipped(fixture.Run.EstadoAtualJson, "colete", true);
        var result = await fixture.Service.UpdateLoadoutAsync(10, 5, new() { RevisaoEsperada = 0, ChaveIdempotencia = Guid.NewGuid(), Acoes = [] }, default);
        Assert.True(result.Sucesso, result.Mensagem);
        Assert.True(GameRunDefensiveEquipment.IsEquipped(fixture.Run.EstadoAtualJson, "colete"));
        string state = fixture.Run.EstadoAtualJson;
        var invalid = await fixture.Service.UpdateLoadoutAsync(10, 5, new() { RevisaoEsperada = 1, ChaveIdempotencia = Guid.NewGuid(),
            Acoes = [], DefesasEquipadas = ["espada"] }, default);
        Assert.False(invalid.Sucesso); Assert.Equal(state, fixture.Run.EstadoAtualJson); Assert.Equal(1, fixture.Run.Revisao);
    }

    [Fact]
    public async Task LoadoutDistingueErroGeralDoSistemaDeUmaArmaInexecutavel()
    {
        var fixture = InventoryFixture();
        fixture.Version.TiposDefesa.Clear();
        fixture.Run.EstadoAtualJson = GameRunDefensiveEquipment.SetEquipped(fixture.Run.EstadoAtualJson, "colete", true);
        string before = fixture.Run.EstadoAtualJson;
        var result = await fixture.Service.UpdateLoadoutAsync(10, 5, new() { RevisaoEsperada = 0, ChaveIdempotencia = Guid.NewGuid(),
            Acoes = [new() { Tipo = "ITEM", IdInstancia = "espada" }] }, default);
        Assert.False(result.Sucesso);
        Assert.Contains("Sistema", result.Mensagem);
        Assert.DoesNotContain("Espada de teste", result.Mensagem);
        Assert.Equal(before, fixture.Run.EstadoAtualJson);
    }

    [Theory]
    [InlineData("MAGIA", "magia", "Magia incompleta")]
    [InlineData("SKILL", "skills", "Skill incompleta")]
    [InlineData("PROTESE", "implantes", "Prótese incompleta")]
    public async Task LoadoutIdentificaNomeDasOutrasOrigensInexecutaveis(string type, string property, string name)
    {
        var fixture = InventoryFixture();
        fixture.Version.SkillConfig = new() { MaximoMagias = 5, MaximoSkills = 5 };
        var root = JsonNode.Parse(fixture.Run.EstadoAtualJson)!;
        root[property] = new JsonArray(new JsonObject { ["id"] = "origem", ["nome"] = name, ["atributos"] = new JsonObject() });
        fixture.Run.EstadoAtualJson = root.ToJsonString();
        var result = await fixture.Service.UpdateLoadoutAsync(10, 5, new() { RevisaoEsperada = 0, ChaveIdempotencia = Guid.NewGuid(),
            Acoes = [new() { Tipo = type, IdInstancia = "origem" }] }, default);
        Assert.Equal("ACAO_INEXECUTAVEL", result.Codigo);
        Assert.Contains(name, result.Mensagem);
    }
}
