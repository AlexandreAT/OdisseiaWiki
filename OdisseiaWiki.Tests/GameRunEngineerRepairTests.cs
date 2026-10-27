using System.Text.Json;
using System.Text.Json.Nodes;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.GameRuns;
using OdisseiaWiki.GameRuns.Battle;
using OdisseiaWiki.GameRuns.Map;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class GameRunEngineerRepairTests
{
    internal static string Snapshot(string type = "traje", int missing = 125, bool equipped = true, bool serialized = false)
    {
        int protection = Math.Max(0, 400 - missing), shield = missing <= 400 ? 100 : 500 - missing;
        JsonObject attributes = new() { [type == "outro" ? "protecao" : "protecaoBase"] = 400,
            [type == "outro" ? "escudo" : "escudoBase"] = 100, [type == "outro" ? "armadura" : "armaduraBase"] = 7,
            ["__runDefenseRemaining"] = new JsonObject { ["protecao"] = protection, ["escudo"] = shield },
            ["__vistaExplodida"] = new JsonObject { ["equippedSlot"] = equipped ? "peito" : null } };
        JsonObject item = new() { ["id"] = "equip", ["nome"] = "Equipamento", ["tipo"] = type,
            ["atributos"] = serialized ? JsonValue.Create(attributes.ToJsonString()) : attributes };
        return new JsonObject { ["status"] = new JsonObject { ["defesas"] = new JsonObject {
            ["protecao"] = 10 + (equipped ? protection : 0), ["escudo"] = 4 + (equipped ? shield : 0), ["armadura"] = 7 } },
            ["inventario"] = type == "implante" ? new JsonArray() : new JsonArray(item),
            ["implantes"] = type == "implante" ? new JsonArray(item) : new JsonArray(),
            ["economy"] = new JsonObject { ["balance"] = 1000, ["stash"] = new JsonArray() } }.ToJsonString();
    }

    [Theory]
    [InlineData("traje", false)] [InlineData("outro", false)] [InlineData("implante", false)]
    [InlineData("traje", true)] [InlineData("implante", true)]
    public void ConsertaCopiaAteMaximosAtualizaSomenteBonusEquipadosECobraTresBlocosPara25Porcento(string type, bool serialized)
    {
        string original = Snapshot(type, serialized: serialized);
        string updated = GameRunNpcServices.RepairDefense(original, "equip", 7);
        var root = JsonNode.Parse(updated)!;
        Assert.Equal(979, root["economy"]!["balance"]!.GetValue<int>());
        Assert.Equal(410, root["status"]!["defesas"]!["protecao"]!.GetValue<int>());
        Assert.Equal(104, root["status"]!["defesas"]!["escudo"]!.GetValue<int>());
        Assert.Equal(7, root["status"]!["defesas"]!["armadura"]!.GetValue<int>());
        var item = root[type == "implante" ? "implantes" : "inventario"]![0]!;
        Assert.Equal(400, item["atributos"]!["__runDefenseRemaining"]!["protecao"]!.GetValue<int>());
        Assert.Equal(100, item["atributos"]!["__runDefenseRemaining"]!["escudo"]!.GetValue<int>());
        Assert.Equal(1000, JsonNode.Parse(original)!["economy"]!["balance"]!.GetValue<int>());
        Assert.Throws<InvalidOperationException>(() => GameRunNpcServices.RepairDefense(updated, "equip", 7));
        string unequipped = GameRunDefensiveEquipment.SetEquipped(updated, "equip", false);
        Assert.Equal(10, JsonNode.Parse(unequipped)!["status"]!["defesas"]!["protecao"]!.GetValue<int>());
    }

    [Theory]
    [InlineData(1, 1)] [InlineData(50, 1)] [InlineData(51, 2)] [InlineData(125, 3)] [InlineData(500, 10)]
    public void ArredondaBlocosComPrecisaoInteiraIncluindoEscudoGasto(int missing, int blocks)
    {
        var updated = JsonNode.Parse(GameRunNpcServices.RepairDefense(Snapshot(missing: missing), "equip", 9))!;
        Assert.Equal(1000 - blocks * 9, updated["economy"]!["balance"]!.GetValue<int>());
        Assert.Equal(410, updated["status"]!["defesas"]!["protecao"]!.GetValue<int>());
        Assert.Equal(104, updated["status"]!["defesas"]!["escudo"]!.GetValue<int>());
    }

    [Fact]
    public void EquipamentoGuardadoNaMochilaEConsertadoSemEquiparNemCreditarDefesas()
    {
        var root = JsonNode.Parse(GameRunNpcServices.RepairDefense(Snapshot(equipped: false), "equip", 0))!;
        Assert.Equal(1000, root["economy"]!["balance"]!.GetValue<int>());
        Assert.Equal(10, root["status"]!["defesas"]!["protecao"]!.GetValue<int>());
        Assert.Equal(4, root["status"]!["defesas"]!["escudo"]!.GetValue<int>());
        Assert.Equal(400, root["inventario"]![0]!["atributos"]!["__runDefenseRemaining"]!["protecao"]!.GetValue<int>());
    }

    [Theory]
    [InlineData(null)] [InlineData(-1)] [InlineData(1000000001)] [InlineData(1000000000)]
    public void PrecoInvalidoNaoConfiguradoOuSemSaldoRejeitaSemMudarOriginal(int? price)
    {
        string original = Snapshot();
        Assert.Throws<InvalidOperationException>(() => GameRunNpcServices.RepairDefense(original, "equip", price));
        Assert.Equal(1000, JsonNode.Parse(original)!["economy"]!["balance"]!.GetValue<int>());
        Assert.Throws<InvalidOperationException>(() => GameRunNpcServices.RepairDefense(original, "inexistente", 1));
    }

    [Fact]
    public void ConfiguracaoDeOficinaSemCatalogoAceitaPrecoZeroFixaPrecoNoMapaERejeitaNegativo()
    {
        var area = new GameModeAreaDto { Code = "F1", Name = "Oficinas", NodeCount = 3, UseBase = false, FinalOption = "ROTA:0",
            Options = [new() { Type = "NPC", NpcCode = "oficina", NpcType = "ENGENHEIRO", Label = "Oficina", RepairPricePer10Percent = 0 }] };
        Assert.Null(GameModeRouteValidation.Validate(area, [], [area]));
        var config = JsonSerializer.Serialize(new { map = new { schemaVersion = 5 }, encounters = new { }, areas = new[] { area } }, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        var map = new GameRunMapGenerator().Create(123, config);
        Assert.All(map.Nodes.Where(node => node.Type == "NPC"), node => Assert.Equal(0, node.Payload!.RepairPricePer10Percent));
        area.Options[0].RepairPricePer10Percent = -1;
        Assert.Contains("preço de conserto", GameModeRouteValidation.Validate(area, [], [area]));
    }
}
