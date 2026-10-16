using System.Text.Json;
using System.Text.Json.Nodes;
using OdisseiaWiki.GameRuns.Battle;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class GameRunDefensiveEquipmentTests
{
    [Fact]
    public void ReplaysAntigosMantemOCampoDeEscudoAnterior()
    {
        GameBattleDefenses? defenses = JsonSerializer.Deserialize<GameBattleDefenses>(
            """{"shieldCharges":1,"protection":30,"armor":5}""");
        Assert.NotNull(defenses);
        Assert.Equal(1, defenses.Shield);
        Assert.DoesNotContain("shieldCharges", JsonSerializer.Serialize(defenses));
    }

    [Fact]
    public void CopiaDefesasDeTrajeEquipadoMesmoComInventarioSerializado()
    {
        string inventory = """
            [{"id":"traje-1","tipo":"traje","atributos":{"escudoBase":"40",
              "protecaoBase":200,"armaduraBase":15,"__vistaExplodida":{"equippedSlot":"peito"}}}]
            """;
        string snapshot = JsonSerializer.Serialize(new
        {
            status = new { defesas = new { escudo = 0, protecao = 0, armadura = 0 } },
            inventario = inventory,
        });
        string next = GameRunDefensiveEquipment.AddInitialBonuses(snapshot);
        using JsonDocument state = JsonDocument.Parse(next);
        JsonElement defenses = state.RootElement.GetProperty("status").GetProperty("defesas");
        Assert.Equal(40, defenses.GetProperty("escudo").GetInt32());
        Assert.Equal(200, defenses.GetProperty("protecao").GetInt32());
        Assert.Equal(15, defenses.GetProperty("armadura").GetInt32());
    }

    [Fact]
    public void Outro_PodeEquiparEscudoProtecaoEArmaduraSemAlterarFichaOriginal()
    {
        const string original = """
            {"status":{"defesas":{"escudo":0,"protecao":0,"armadura":0}},
             "inventario":[{"id":"item-1","tipo":"outro","atributos":
               {"escudo":500,"protecao":200,"armadura":30}}]}
            """;
        string equipped = GameRunDefensiveEquipment.SetEquipped(original, "item-1", true);
        using JsonDocument state = JsonDocument.Parse(equipped);
        JsonElement defenses = state.RootElement.GetProperty("status").GetProperty("defesas");
        Assert.Equal(500, defenses.GetProperty("escudo").GetInt32());
        Assert.Equal(200, defenses.GetProperty("protecao").GetInt32());
        Assert.Equal(30, defenses.GetProperty("armadura").GetInt32());
        Assert.Contains("\"escudo\":0", original);

        string removed = GameRunDefensiveEquipment.SetEquipped(equipped, "item-1", false);
        using JsonDocument after = JsonDocument.Parse(removed);
        JsonElement final = after.RootElement.GetProperty("status").GetProperty("defesas");
        Assert.Equal(0, final.GetProperty("escudo").GetInt32());
        Assert.Equal(0, final.GetProperty("protecao").GetInt32());
        Assert.Equal(0, final.GetProperty("armadura").GetInt32());
    }

    [Fact]
    public void ProtecaoConsumida_NaoVoltaAoReequipar()
    {
        const string original = """
            {"status":{"defesas":{"escudo":0,"protecao":0,"armadura":0}},
             "inventario":[{"id":"traje-1","tipo":"traje","atributos":
               {"protecaoBase":200,"armaduraBase":30}}]}
            """;
        string equipped = GameRunDefensiveEquipment.SetEquipped(original, "traje-1", true);
        JsonObject state = JsonNode.Parse(equipped)!.AsObject();
        GameRunDefensiveEquipment.RecordSpentDefenses(state, 0, 80);
        state["status"]!["defesas"]!["protecao"] = 120;
        string removed = GameRunDefensiveEquipment.SetEquipped(state.ToJsonString(), "traje-1", false);
        string reequipped = GameRunDefensiveEquipment.SetEquipped(removed, "traje-1", true);
        using JsonDocument after = JsonDocument.Parse(reequipped);
        Assert.Equal(120, after.RootElement.GetProperty("status").GetProperty("defesas")
            .GetProperty("protecao").GetInt32());
    }

    [Fact]
    public void BaseRestauraProtecaoDosItensMasNaoEscudoENaoDuplicaNoReingresso()
    {
        const string snapshot = """
            {"status":{"defesas":{"escudo":0,"protecao":40,"armadura":5}},
             "inventario":[
               {"id":"a","tipo":"traje","atributos":{"escudoBase":100,"protecaoBase":80,"armaduraBase":5,
                 "__vistaExplodida":{"equippedSlot":"run-defense"},
                 "__runDefenseRemaining":{"escudo":0,"protecao":40}}},
               {"id":"b","tipo":"outro","atributos":{"protecao":30,
                 "__runDefenseRemaining":{"protecao":10}}}]}
            """;
        var first = GameRunDefensiveEquipment.RestoreProtectionAtBase(snapshot);
        Assert.Equal(60, first.Repaired);
        JsonNode updated = JsonNode.Parse(first.Snapshot)!;
        Assert.Equal(80, updated["status"]!["defesas"]!["protecao"]!.GetValue<int>());
        Assert.Equal(0, updated["status"]!["defesas"]!["escudo"]!.GetValue<int>());
        Assert.Equal(80, updated["inventario"]![0]!["atributos"]!["__runDefenseRemaining"]!["protecao"]!.GetValue<int>());
        Assert.Equal(30, updated["inventario"]![1]!["atributos"]!["__runDefenseRemaining"]!["protecao"]!.GetValue<int>());
        var repeated = GameRunDefensiveEquipment.RestoreProtectionAtBase(first.Snapshot);
        Assert.Equal(0, repeated.Repaired);
        Assert.Equal(first.Snapshot, repeated.Snapshot);
    }

    [Fact]
    public void ItemDefensivoRemovidoDaPilha_NaoDeixaBonusOrfao()
    {
        const string before = """
            {"status":{"defesas":{"escudo":20,"protecao":50,"armadura":10}},
             "inventario":[{"id":"a","tipo":"outro","atributos":{"escudo":20,
               "protecao":50,"armadura":10,"__vistaExplodida":{"equippedSlot":"run-defense"}}}]}
            """;
        const string after = """
            {"status":{"defesas":{"escudo":20,"protecao":50,"armadura":10}},"inventario":[]}
            """;
        string reconciled = GameRunDefensiveEquipment.RemoveMissingBonuses(before, after);
        using JsonDocument state = JsonDocument.Parse(reconciled);
        JsonElement defenses = state.RootElement.GetProperty("status").GetProperty("defesas");
        Assert.Equal(0, defenses.GetProperty("escudo").GetInt32());
        Assert.Equal(0, defenses.GetProperty("protecao").GetInt32());
        Assert.Equal(0, defenses.GetProperty("armadura").GetInt32());
    }
}
