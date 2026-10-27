using System.Text.Json.Nodes;
using OdisseiaWiki.GameRuns.Battle;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed partial class GameRunEncounterServiceTests
{
    [Theory]
    [InlineData(false)] [InlineData(true)]
    public async Task BloqueiaTruquesDeEquipamentoAtomicoOuDiretoSemGravarParcialmente(bool batch)
    {
        var fixture = InventoryFixture(); fixture.Version.ItemEscopos = GameRunOutfitCompatibilityTests.Entities();
        var root = JsonNode.Parse(fixture.Run.EstadoAtualJson)!;
        root["inventario"] = new JsonArray(GameRunOutfitCompatibilityTests.Item("colete", "COLETE"),
            GameRunOutfitCompatibilityTests.Item("traje", "TRAJE", false));
        fixture.Run.EstadoAtualJson = root.ToJsonString();
        string before = fixture.Run.EstadoAtualJson, original = fixture.Run.SnapshotInicialJson;
        var result = batch ? await fixture.Service.UpdateLoadoutAsync(10, 5, new() {
            Acoes = [], DefesasEquipadas = ["colete", "traje"], RevisaoEsperada = 0, ChaveIdempotencia = Guid.NewGuid() }, default)
            : await fixture.Service.EquipDefenseAsync(10, 5, "traje", new() { Equipado = true, RevisaoEsperada = 0, ChaveIdempotencia = Guid.NewGuid() }, default);
        Assert.False(result.Sucesso); Assert.Contains("colete e traje", result.Mensagem);
        Assert.Equal(before, fixture.Run.EstadoAtualJson); Assert.Equal(original, fixture.Run.SnapshotInicialJson); Assert.Equal(0, fixture.Run.Revisao);
    }

    [Fact]
    public async Task PermiteColeteComOutrosESubstituicaoRetirandoColeteNoMesmoSalvar()
    {
        var fixture = InventoryFixture(); fixture.Version.ItemEscopos = GameRunOutfitCompatibilityTests.Entities();
        var root = JsonNode.Parse(fixture.Run.EstadoAtualJson)!;
        var glasses = GameRunOutfitCompatibilityTests.Item("outros", "OUTROS", false);
        glasses["atributos"]!["protecaoBase"] = 0;
        root["inventario"] = new JsonArray(GameRunOutfitCompatibilityTests.Item("colete", "COLETE"),
            glasses, GameRunOutfitCompatibilityTests.Item("traje", "TRAJE", false));
        fixture.Run.EstadoAtualJson = root.ToJsonString();
        var result = await fixture.Service.UpdateLoadoutAsync(10, 5, new() { Acoes = [], DefesasEquipadas = ["colete", "outros"],
            RevisaoEsperada = 0, ChaveIdempotencia = Guid.NewGuid() }, default);
        Assert.True(result.Sucesso, result.Mensagem); Assert.True(GameRunDefensiveEquipment.IsEquipped(fixture.Run.EstadoAtualJson, "outros"));
        result = await fixture.Service.UpdateLoadoutAsync(10, 5, new() { Acoes = [], DefesasEquipadas = ["traje"],
            RevisaoEsperada = 1, ChaveIdempotencia = Guid.NewGuid() }, default);
        Assert.True(result.Sucesso, result.Mensagem);
        Assert.False(GameRunDefensiveEquipment.IsEquipped(fixture.Run.EstadoAtualJson, "colete"));
        Assert.True(GameRunDefensiveEquipment.IsEquipped(fixture.Run.EstadoAtualJson, "traje"));
    }
}
