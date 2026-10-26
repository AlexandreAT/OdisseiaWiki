using System.Text.Json;
using System.Text.Json.Nodes;
using Moq;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.GameRuns;
using OdisseiaWiki.GameRuns.Map;
using OdisseiaWiki.Models;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed partial class GameRunEncounterServiceTests
{
    private static GameCharacterMemory UseMemory(Fixture fixture, GameCharacterMemory? memory = null)
    {
        fixture.Run.IdPersonagemJogadorOrigem = 8;
        fixture.Run.GameModeVersion.Codigo = "JOGO";
        fixture.Version.IdSistemaRpg = 1;
        memory ??= new() { IdPersonagemJogador = 8, EstadoJson = new GameCharacterMilestones().Serialize() };
        fixture.Repository.Setup(repo => repo.GetOwnedCharacterAsync(5, 8, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PersonagemJogador { IdpersonagemJogador = 8, Idusuario = 5 });
        fixture.Repository.Setup(repo => repo.GetCharacterMemoryAsync(5, 8, It.IsAny<CancellationToken>())).ReturnsAsync(memory);
        return memory;
    }

    private static void UseNpc(Fixture fixture, string type, bool locked, string code = "npc-a")
    {
        fixture.Run.NoAtualId = null;
        fixture.Run.MapaJson = JsonSerializer.Serialize(new GameRunMapDto { SchemaVersion = 5, Nodes = [
            new() { Id = "inicio", Type = "INICIO", State = "CONCLUIDO", Connections = ["npc"] },
            new() { Id = "npc", Name = "Aliado", Type = "NPC", Fase = 1, Layer = 1, State = "DISPONIVEL", Connections = ["fim"],
                Payload = new() { NpcCode = code, NpcType = type, NpcLocked = locked,
                    Offers = type == "MERCADOR" ? [new() { ItemId = "seringa", Stock = 2, Price = 0,
                        Snapshot = new() { ["tipo"] = "consumiveis", ["nome"] = "Seringa" } }] : null } },
            new() { Id = "fim", Type = "BASE", Fase = 1, Layer = 2, State = "BLOQUEADO" }
        ] }, new JsonSerializerOptions(JsonSerializerDefaults.Web));
    }

    [Theory]
    [InlineData("MEDICO")]
    [InlineData("MERCADOR")]
    public async Task ResgateSomenteLibertaPersisteNaoDuplicaENaoConcedeServicoNaPrimeiraVisita(string type)
    {
        Fixture fixture = new(); var memory = UseMemory(fixture); UseNpc(fixture, type, true);
        string original = fixture.Run.EstadoAtualJson;
        var request = Request(0);
        var rescued = await fixture.Service.VisitNpcAsync(10, "npc", 5, request, default);
        Assert.True(rescued.Sucesso, rescued.Mensagem);
        Assert.Equal("NPC_RESGATE", rescued.Dados!.Tipo);
        Assert.Equal(original, fixture.Run.EstadoAtualJson);
        Assert.Single(GameCharacterMilestones.Read(memory.EstadoJson).RescuedNpcs);
        Assert.True((await fixture.Service.VisitNpcAsync(10, "npc", 5, request, default)).Repetido);
        Assert.Equal(1, fixture.Run.Revisao);
        var map = rescued.Dados.Run.Mapa;
        Assert.True(map.Nodes.Single(node => node.Id == "npc").Payload!.NpcRescued);
        Assert.False(GameRunEconomy.CanAccessStash(map, null));
        Assert.Equal("CONCLUIDO", map.Nodes.Single(node => node.Id == "npc").State);
        Assert.Equal("DISPONIVEL", map.Nodes.Single(node => node.Id == "fim").State);
        var next = new Fixture(); UseMemory(next, memory); UseNpc(next, type, true);
        var revisited = await next.Service.VisitNpcAsync(10, "npc", 5, Request(0), default);
        Assert.True(revisited.Sucesso, revisited.Mensagem);
        Assert.Equal($"NPC_{type}", revisited.Dados!.Tipo);
        Assert.Single(GameCharacterMilestones.Read(memory.EstadoJson).RescuedNpcs);
        if (type == "MERCADOR")
        {
            Assert.Equal("npc", revisited.Dados.Run.NoAtualId);
            Assert.True(GameRunEconomy.CanAccessStash(revisited.Dados.Run.Mapa, "npc"));
            var bought = await next.Service.BuyVendorItemAsync(10, 5,
                new() { ItemId = "seringa", RevisaoEsperada = 1, ChaveIdempotencia = Guid.NewGuid() }, default);
            Assert.True(bought.Sucesso, bought.Mensagem);
            Assert.True((await next.Service.LeaveVendorAsync(10, 5, Request(2), default)).Sucesso);
        }
    }

    [Fact]
    public async Task MedicoCuraAteLimitesAtuaisSemRepararDefesasOuConsumirEAlertaIdempotente()
    {
        Fixture fixture = new(); var memory = UseMemory(fixture); UseNpc(fixture, "MEDICO", false);
        var root = JsonNode.Parse(fixture.Run.EstadoAtualJson)!;
        root["status"]!["status"]!["vida"] = 12;
        root["status"]!["status"]!["mana"] = 2;
        root["status"]!["status"]!["estamina"] = 3;
        root["status"]!["defesas"]!["escudo"] = 0;
        root["status"]!["defesas"]!["protecao"] = 9;
        fixture.Run.EstadoAtualJson = root.ToJsonString();
        var result = await fixture.Service.VisitNpcAsync(10, "npc", 5, Request(0), default);
        Assert.True(result.Sucesso, result.Mensagem);
        Assert.Equal(18, result.Dados!.VidaRecuperada); Assert.Equal(8, result.Dados.ManaRecuperada); Assert.Equal(7, result.Dados.EstaminaRecuperada);
        var saved = JsonNode.Parse(fixture.Run.EstadoAtualJson)!;
        Assert.Equal(0, saved["status"]!["defesas"]!["escudo"]!.GetValue<int>());
        Assert.Equal(9, saved["status"]!["defesas"]!["protecao"]!.GetValue<int>());
        Assert.Empty(GameCharacterMilestones.Read(memory.EstadoJson).RescuedNpcs);
    }

    [Fact]
    public async Task NpcNaoPodeSerAcessadoPorOutroUsuarioRevisaoAntigaOuAtravesDeEndpointDeVendedor()
    {
        Fixture fixture = new(); UseMemory(fixture); UseNpc(fixture, "MERCADOR", true);
        Assert.Equal("RUN_NAO_ENCONTRADA", (await fixture.Service.VisitNpcAsync(10, "npc", 99, Request(0), default)).Codigo);
        Assert.Equal("REVISAO_DESATUALIZADA", (await fixture.Service.VisitNpcAsync(10, "npc", 5, Request(1), default)).Codigo);
        Assert.False((await fixture.Service.EnterVendorAsync(10, "npc", 5, Request(0), default)).Sucesso);
        Assert.Equal(0, fixture.Run.Revisao);
        Assert.False((await fixture.Service.BuyVendorItemAsync(10, 5, new() { ItemId = "seringa", RevisaoEsperada = 0,
            ChaveIdempotencia = Guid.NewGuid() }, default)).Sucesso);
    }

    [Fact]
    public async Task ProtecaoExigeBaseDonoRevisaoEComandoIdempotenteComMovimentoReal()
    {
        Fixture fixture = new(); var memory = UseMemory(fixture); UseVendorMap(fixture);
        await fixture.Service.EnterVendorAsync(10, "vendedor", 5, Request(0), default);
        var config = JsonNode.Parse(fixture.Run.GameModeVersion.ConfiguracaoJson)!;
        config["protectedDepositSlots"] = 2; config["protectedDepositCost"] = 10;
        fixture.Run.GameModeVersion.ConfiguracaoJson = config.ToJsonString();
        var root = JsonNode.Parse(fixture.Run.EstadoAtualJson)!;
        root["economy"]!["stash"] = JsonNode.Parse("""[{"id":"a","tipo":"consumiveis","quantidade":3}]""");
        fixture.Run.EstadoAtualJson = root.ToJsonString();
        var request = new GameRunProtectedItemRequestDto { ItemId = "a", Action = "PROTECT", RevisaoEsperada = 1, ChaveIdempotencia = Guid.NewGuid() };
        Assert.Equal("RUN_NAO_ENCONTRADA", (await fixture.Service.ChangeProtectedItemAsync(10, 99, request, default)).Codigo);
        var result = await fixture.Service.ChangeProtectedItemAsync(10, 5, request, default);
        Assert.True(result.Sucesso, result.Mensagem);
        Assert.Empty(result.Dados!.EstadoAtual.Economy!.Stash);
        Assert.Equal(90, result.Dados.EstadoAtual.Economy.Balance);
        Assert.Single(GameCharacterMilestones.Read(memory.EstadoJson).ProtectedItems);
        Assert.True((await fixture.Service.ChangeProtectedItemAsync(10, 5, request, default)).Repetido);
        Assert.Equal(2, fixture.Run.Revisao);
        var view = await fixture.Service.GetProtectedDepositAsync(10, 5, default);
        var stored = Assert.Single(view!.Items);
        Assert.True(stored.Compatible);
        var taken = await fixture.Service.ChangeProtectedItemAsync(10, 5, new() { ItemId = stored.ItemId, Action = "TAKE",
            RevisaoEsperada = 2, ChaveIdempotencia = Guid.NewGuid() }, default);
        Assert.True(taken.Sucesso, taken.Mensagem);
        Assert.Empty(GameCharacterMilestones.Read(memory.EstadoJson).ProtectedItems);
        Assert.Equal(stored.ItemId, Assert.Single(taken.Dados!.EstadoAtual.Inventario!.Value.EnumerateArray()).GetProperty("id").GetString());
        Assert.Empty(JsonNode.Parse(fixture.Run.SnapshotInicialJson)!["inventario"]!.AsArray());
    }
}
