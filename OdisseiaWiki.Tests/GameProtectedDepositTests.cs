using System.Text.Json.Nodes;
using OdisseiaWiki.GameRuns;
using OdisseiaWiki.GameRuns.Battle;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class GameProtectedDepositTests
{
    private const string Configuration = """{"protectedDepositSlots":2,"protectedDepositCost":25}""";
    private const string Snapshot = """{"economy":{"balance":100,"stash":[{"id":"a","tipo":"traje","quantidade":3,"valor":100,"atributos":{"protecaoBase":300,"__runDefenseRemaining":{"protecao":25,"escudo":0}}}]},"inventario":[],"implantes":[]}""";

    [Fact]
    public void ProtegerMoveInstanciaInteiraEPreservaEstadoSemDuplicarOuAlterarSnapshotDeOrigem()
    {
        var memory = new GameCharacterMilestones();
        string protectedSnapshot = GameProtectedDeposit.Change(Snapshot, memory, "JOGO", 1, 7, Configuration, "a", "PROTECT");
        var item = Assert.Single(memory.ProtectedItems);
        Assert.Equal(3, item.Snapshot["quantidade"]!.GetValue<int>());
        Assert.Equal(25, item.Snapshot["atributos"]!["__runDefenseRemaining"]!["protecao"]!.GetValue<int>());
        Assert.Equal(0, item.Snapshot["atributos"]!["__runDefenseRemaining"]!["escudo"]!.GetValue<int>());
        Assert.Empty(JsonNode.Parse(protectedSnapshot)!["economy"]!["stash"]!.AsArray());
        Assert.Equal(75, JsonNode.Parse(protectedSnapshot)!["economy"]!["balance"]!.GetValue<int>());
        Assert.Throws<InvalidOperationException>(() => GameProtectedDeposit.Change(protectedSnapshot, memory, "JOGO", 1, 7, Configuration, "a", "PROTECT"));
        Assert.Equal(100, JsonNode.Parse(Snapshot)!["economy"]!["balance"]!.GetValue<int>());
    }

    [Theory]
    [InlineData("TAKE", "inventario")]
    [InlineData("RELEASE", "stash")]
    public void RetirarOuLiberarRemoveMemoriaSemRepararEFuncionaMesmoSeNovasProtecoesForamDesabilitadas(string action, string destination)
    {
        var memory = new GameCharacterMilestones();
        string empty = GameProtectedDeposit.Change(Snapshot, memory, "JOGO", 1, 7, Configuration, "a", "PROTECT");
        var persisted = GameCharacterMilestones.Read(memory.Serialize());
        string persistentId = Assert.Single(persisted.ProtectedItems).ItemId;
        string nextRun = """{"economy":{"balance":0,"stash":[]},"inventario":[],"implantes":[]}""";
        string taken = GameProtectedDeposit.Change(nextRun, persisted, "JOGO", 1, 7, "{}", persistentId, action);
        var root = JsonNode.Parse(taken)!;
        var item = Assert.Single((destination == "stash" ? root["economy"]![destination] : root[destination])!.AsArray())!;
        Assert.Equal(persistentId, item["id"]!.ToString());
        Assert.Equal(25, item["atributos"]!["__runDefenseRemaining"]!["protecao"]!.GetValue<int>());
        Assert.Empty(persisted.ProtectedItems);
        if (action == "TAKE")
        {
            root["status"] = new JsonObject { ["defesas"] = new JsonObject() };
            var equipped = JsonNode.Parse(GameRunDefensiveEquipment.SetEquipped(root.ToJsonString(), persistentId, true))!;
            Assert.Equal(25, equipped["status"]!["defesas"]!["protecao"]!.GetValue<int>());
            Assert.Equal(0, equipped["status"]!["defesas"]!["escudo"]!.GetValue<int>());
        }
        Assert.Throws<InvalidOperationException>(() => GameProtectedDeposit.Change(taken, persisted, "JOGO", 1, 7, Configuration, persistentId, action));
        Assert.Empty(JsonNode.Parse(empty)!["economy"]!["stash"]!.AsArray());
    }

    [Theory]
    [InlineData("OUTRO", 1, 7)]
    [InlineData("JOGO", 2, 7)]
    [InlineData("JOGO", 1, 8)]
    public void OutraAventuraFamiliaOuVersaoNaoPodeRetirarItem(string game, int system, int version)
    {
        var memory = new GameCharacterMilestones();
        string empty = GameProtectedDeposit.Change(Snapshot, memory, "JOGO", 1, 7, Configuration, "a", "PROTECT");
        string originalMemory = memory.Serialize();
        string persistentId = Assert.Single(memory.ProtectedItems).ItemId;
        Assert.Throws<InvalidOperationException>(() => GameProtectedDeposit.Change(empty, memory, game, system, version, Configuration, persistentId, "TAKE"));
        Assert.Equal(originalMemory, memory.Serialize());
        var view = GameProtectedDeposit.View(memory, game, system, version, Configuration);
        if (game == "JOGO" && system == 1) Assert.False(Assert.Single(view.Items).Compatible);
        else Assert.Empty(view.Items);
    }

    [Theory]
    [InlineData("{}")]
    [InlineData("{\"protectedDepositSlots\":2,\"protectedDepositCost\":101}")]
    public void SemVagasOuMoedasNaoRemoveItemNemAlteraMemoria(string configuration)
    {
        var memory = new GameCharacterMilestones();
        Assert.Throws<InvalidOperationException>(() => GameProtectedDeposit.Change(Snapshot, memory, "JOGO", 1, 7, configuration, "a", "PROTECT"));
        Assert.Empty(memory.ProtectedItems);
    }

    [Fact]
    public void LotacaoContaPilhasEIdentidadeDuplicadaNuncaSobrescreveItem()
    {
        var memory = new GameCharacterMilestones();
        string empty = GameProtectedDeposit.Change(Snapshot, memory, "JOGO", 1, 7, Configuration, "a", "PROTECT");
        Assert.Throws<InvalidOperationException>(() => GameProtectedDeposit.Change(Snapshot.Replace("\"a\"", "\"b\""), memory,
            "JOGO", 1, 7, """{"protectedDepositSlots":1}""", "b", "PROTECT"));
        var root = JsonNode.Parse(empty)!;
        string id = Assert.Single(memory.ProtectedItems).ItemId;
        root["inventario"] = new JsonArray(new JsonObject { ["id"] = id, ["nome"] = "duplicado" });
        Assert.Throws<InvalidOperationException>(() => GameProtectedDeposit.Change(root.ToJsonString(), memory, "JOGO", 1, 7, Configuration, id, "TAKE"));
        Assert.Single(memory.ProtectedItems);
    }

    [Fact]
    public void ItemProtegidoPodeCoexistirComCopiaDaFichaOriginalNaNovaRun()
    {
        var memory = new GameCharacterMilestones();
        GameProtectedDeposit.Change(Snapshot, memory, "JOGO", 1, 7, Configuration, "a", "PROTECT");
        string storedId = Assert.Single(memory.ProtectedItems).ItemId;
        Assert.NotEqual("a", storedId);
        string taken = GameProtectedDeposit.Change(Snapshot, memory, "JOGO", 1, 7, Configuration, storedId, "TAKE");
        Assert.Equal("a", JsonNode.Parse(taken)!["economy"]!["stash"]![0]!["id"]!.ToString());
        Assert.Equal(storedId, JsonNode.Parse(taken)!["inventario"]![0]!["id"]!.ToString());
        Assert.Empty(memory.ProtectedItems);
    }
}
