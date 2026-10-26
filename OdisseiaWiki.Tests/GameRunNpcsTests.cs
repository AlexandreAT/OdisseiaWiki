using System.Text.Json;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.GameRuns;
using OdisseiaWiki.GameRuns.Inventory;
using OdisseiaWiki.GameRuns.Map;
using OdisseiaWiki.Models;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class GameRunNpcsTests
{
    [Fact]
    public void MercadoresDiferentesMantemCatalogosPrecosEBloqueiosIndependentes()
    {
        var area = new GameModeAreaDto { Code = "F1", Name = "Mercados", NodeCount = 3, UseBase = false, FinalOption = "ROTA:1",
            Options = [
                new() { Type = "NPC", NpcCode = "comum", NpcType = "MERCADOR", Label = "Mercador comum", NpcLocked = false,
                    Offers = [new() { ItemId = "seringa", Price = 10, Snapshot = new() { ["nome"] = "Seringa" } }] },
                new() { Type = "NPC", NpcCode = "raro", NpcType = "MERCADOR", Label = "Mercador raro", NpcLocked = true, Unique = true,
                    Offers = [new() { ItemId = "reliquia", Price = 1000, Snapshot = new() { ["nome"] = "Relíquia" } }] }
            ] };
        Assert.Null(GameModeRouteValidation.Validate(area, [], [area]));
        string config = JsonSerializer.Serialize(new { map = new { schemaVersion = 5 }, encounters = new { }, areas = new[] { area } },
            new JsonSerializerOptions(JsonSerializerDefaults.Web));
        var map = new GameRunMapGenerator().Create(321, config);
        var common = map.Nodes.First(node => node.Payload?.NpcCode == "comum");
        var rare = map.Nodes.Single(node => node.Payload?.NpcCode == "raro");
        Assert.False(GameRunNpcs.NeedsRescue(common));
        Assert.True(GameRunNpcs.NeedsRescue(rare));
        Assert.Equal("seringa", Assert.Single(common.Payload!.Offers!).ItemId);
        Assert.Equal(1000, Assert.Single(rare.Payload!.Offers!).Price);
        var memory = new GameCharacterMilestones();
        memory.RescuedNpcs.Add(new("JOGO", 1, "comum"));
        GameRunNpcs.ApplyMemory(map, memory, "JOGO", 1);
        Assert.True(GameRunNpcs.NeedsRescue(rare));
        memory.RescuedNpcs.Add(new("JOGO", 1, "raro"));
        GameRunNpcs.ApplyMemory(map, memory, "JOGO", 1);
        Assert.False(GameRunNpcs.NeedsRescue(rare));
        Assert.Equal("seringa", Assert.Single(common.Payload.Offers!).ItemId);
    }

    [Theory]
    [InlineData("MERCADOR")]
    [InlineData("MEDICO")]
    [InlineData("SABIO")]
    [InlineData("ENGENHEIRO")]
    public void NpcGeraMapaSemEncontroFicticioMantemPoolSeedEIdentidadeEstavel(string type)
    {
        var area = new GameModeAreaDto { Code = "F1", Name = "Floresta", NodeCount = 3, UseBase = false, FinalOption = "ROTA:0",
            Options = [new() { Type = "NPC", NpcCode = "aliado", NpcType = type, NpcLocked = true, Label = "Aliado",
                Upgrade = type == "ENGENHEIRO" ? new() { Damage = 7, Price = 10, MaxUpgrades = 2 } : null,
                Offers = type != "MEDICO" ? [new() { ItemId = "a", Stock = type == "SABIO" ? 1 : 2, Snapshot = new() { ["nome"] = "Item" } }] : [] }] };
        Assert.Null(GameModeRouteValidation.Validate(area, [], [area]));
        var options = new JsonSerializerOptions(JsonSerializerDefaults.Web);
        string config = JsonSerializer.Serialize(new { map = new { schemaVersion = 5 }, encounters = new { }, areas = new[] { area } }, options);
        var first = new GameRunMapGenerator().Create(123, config);
        Assert.Equal(JsonSerializer.Serialize(first), JsonSerializer.Serialize(new GameRunMapGenerator().Create(123, config)));
        Assert.All(first.Nodes.Where(node => node.Type == "NPC"), node => {
            Assert.Null(node.Payload!.EncounterCode);
            Assert.Equal("aliado", node.Payload.NpcCode);
            Assert.Equal(type, node.Payload.NpcType);
            Assert.False(node.Payload.NpcRescued);
            if (type != "MEDICO") Assert.Single(node.Payload.Offers!); else Assert.Null(node.Payload.Offers);
            if (type == "ENGENHEIRO") Assert.Equal(7, node.Payload.Upgrade!.Damage);
        });
        var memory = new GameCharacterMilestones(); memory.RescuedNpcs.Add(new("JOGO", 1, "aliado"));
        var original = first.Nodes.Select(node => (node.Id, node.Layer, node.Position, node.Seed, node.State)).ToArray();
        GameRunNpcs.ApplyMemory(first, memory, "OUTRO", 1);
        Assert.All(first.Nodes.Where(node => node.Type == "NPC"), node => Assert.False(node.Payload!.NpcRescued));
        GameRunNpcs.ApplyMemory(first, memory, "JOGO", 2);
        Assert.All(first.Nodes.Where(node => node.Type == "NPC"), node => Assert.False(node.Payload!.NpcRescued));
        GameRunNpcs.ApplyMemory(first, memory, "JOGO", 1);
        Assert.All(first.Nodes.Where(node => node.Type == "NPC"), node => Assert.True(node.Payload!.NpcRescued));
        Assert.Equal(original, first.Nodes.Select(node => (node.Id, node.Layer, node.Position, node.Seed, node.State)).ToArray());
    }

    [Fact]
    public void MedicoRespeitaLimitesReduzidosEBloqueioDeRecuperacaoSemRemoverCondicao()
    {
        var version = new SistemaVersao { Condicoes = [new() { Codigo = "FADIGA", Nome = "Fadiga", Tipo = "Fisico",
            CodigoRecursoGatilho = "MANA", OperadorGatilho = "<=", ValorGatilho = 0, RegraRemocao = "DESCANSO_NORMAL",
            ConfiguracaoPadraoJson = """{"efeitos":[{"operacao":"REDUZIR_LIMITE_PERCENTUAL","recurso":"ESTAMINA","valor":30,"momento":"ENQUANTO_ATIVA"},{"operacao":"BLOQUEAR_RECUPERACAO","recurso":"MANA","valor":1,"momento":"ENQUANTO_ATIVA"}]}""" }] };
        var result = GameRunRecovery.RestoreToLimits("""{"status":{"status":{"vida":10,"vidaMaxima":100,"mana":0,"manaMaxima":100,"estamina":1,"estaminaMaxima":100}},"inventario":[]}""", version);
        using var json = JsonDocument.Parse(result.Snapshot);
        var resources = json.RootElement.GetProperty("status").GetProperty("status");
        Assert.Equal(90, result.Life); Assert.Equal(0, result.Mana); Assert.Equal(69, result.Stamina);
        Assert.Equal(70, resources.GetProperty("estamina").GetInt32());
        Assert.Equal(0, resources.GetProperty("mana").GetInt32());
        Assert.True(json.RootElement.GetProperty("condicoesAtivas").GetProperty("FADIGA").GetBoolean());
    }
}
