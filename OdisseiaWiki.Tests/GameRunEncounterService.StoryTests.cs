using System.Text.Json;
using System.Text.Json.Nodes;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.GameRuns;
using OdisseiaWiki.GameRuns.Map;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed partial class GameRunEncounterServiceTests
{
    private static void StoryMap(Fixture fixture, GameModeAreaOptionDto option)
    {
        var state = JsonNode.Parse(GameStoryEffectsTests.Snapshot)!;
        state["idSistemaVersao"] = 7;
        state["sistema"] = new JsonObject { ["idSistemaVersao"] = 7 };
        fixture.Run.EstadoAtualJson = state.ToJsonString();
        fixture.Run.MapaJson = JsonSerializer.Serialize(new GameRunMapDto { SchemaVersion = 5, Nodes = [
            new() { Id = "inicio", Type = "INICIO", State = "CONCLUIDO", Connections = ["story"] },
            new() { Id = "story", Type = option.Type, Name = option.Label ?? "História", Fase = 1, Layer = 1,
                State = "DISPONIVEL", Connections = ["end"], Payload = new() { Choices = option.Choices, Mission = option.Mission, SurpriseOptions = option.SurpriseOptions } },
            new() { Id = "end", Name = "Fim", Type = "EVENTO", Fase = 1, Layer = 2, State = "BLOQUEADO" }] }, new JsonSerializerOptions(JsonSerializerDefaults.Web));
    }

    [Fact]
    public async Task EventoAbreEscolhaPersisteUmaVezENaoPermitePularPeloEndpointLegado()
    {
        var fixture = new Fixture(); string initial = fixture.Run.SnapshotInicialJson;
        StoryMap(fixture, new() { Type = "EVENTO", Label = "Laboratório", Choices = [
            new() { Code = "pagar", Label = "Recuperar", Cost = new() { Currency = 20 }, Outcome = new() { Currency = 30, Xp = 5, Life = 10 } },
            new() { Code = "sair", Label = "Sair" }] });
        var oldState = fixture.Run.EstadoAtualJson;
        Assert.Equal("ESCOLHA_OBRIGATORIA", (await fixture.Service.EnterBaseAsync(10, "story", 5, Request(0), default)).Codigo);
        Assert.Equal("RUN_NAO_ENCONTRADA", (await fixture.Service.BeginStoryAsync(10, "story", 99, Request(0), default)).Codigo);
        Assert.True((await fixture.Service.BeginStoryAsync(10, "story", 5, Request(0), default)).Sucesso);
        Assert.Equal("story", fixture.Run.NoAtualId); Assert.Equal(oldState, fixture.Run.EstadoAtualJson);
        var request = new GameStoryRequestDto { ChoiceCode = "pagar", RevisaoEsperada = 1, ChaveIdempotencia = Guid.NewGuid() };
        var chosen = await fixture.Service.ChooseStoryAsync(10, "story", 5, request, default);
        Assert.True(chosen.Sucesso, chosen.Mensagem);
        Assert.Null(fixture.Run.NoAtualId); Assert.Equal(110, chosen.Dados!.EstadoAtual.Economy!.Balance);
        Assert.Equal(5, JsonNode.Parse(fixture.Run.EstadoAtualJson)!["status"]!["xpConquistadoRun"]!.GetValue<int>());
        Assert.Single(chosen.Dados.EstadoAtual.Story);
        Assert.True((await fixture.Service.ChooseStoryAsync(10, "story", 5, request, default)).Repetido);
        Assert.Equal(2, fixture.Run.Revisao); Assert.Equal(initial, fixture.Run.SnapshotInicialJson);
        request.ChoiceCode = "sair";
        Assert.Equal("CHAVE_IDEMPOTENCIA_REUTILIZADA", (await fixture.Service.ChooseStoryAsync(10, "story", 5, request, default)).Codigo);
        Assert.Equal("DISPONIVEL", GameRunFirstMap.Read(fixture.Run.MapaJson, new(JsonSerializerDefaults.Web)).Nodes[2].State);
    }

    [Theory]
    [InlineData("inexistente")] [InlineData("sem-saldo")] [InlineData("condicao-invalida")]
    public async Task EscolhaRecusadaMantemSaldoRecursosNoSelecionadoERevisao(string reason)
    {
        var fixture = new Fixture();
        StoryMap(fixture, new() { Type = "EVENTO", Label = "Lab", Choices = [new() { Code = "opcao", Label = "Escolher",
            Cost = new() { Currency = reason == "sem-saldo" ? 101 : 1 }, Outcome = new() { Currency = 10,
                Conditions = reason == "condicao-invalida" ? [new() { Code = "NAO_EXISTE" }] : [] } }] });
        Assert.True((await fixture.Service.BeginStoryAsync(10, "story", 5, Request(0), default)).Sucesso);
        string before = fixture.Run.EstadoAtualJson, map = fixture.Run.MapaJson!;
        var result = await fixture.Service.ChooseStoryAsync(10, "story", 5, new() {
            RevisaoEsperada = 1, ChaveIdempotencia = Guid.NewGuid(), ChoiceCode = reason == "inexistente" ? "outra" : "opcao" }, default);
        Assert.Equal("ESCOLHA_INVALIDA", result.Codigo);
        Assert.Equal(before, fixture.Run.EstadoAtualJson); Assert.Equal(map, fixture.Run.MapaJson);
        Assert.Equal("story", fixture.Run.NoAtualId); Assert.Equal(1, fixture.Run.Revisao);
    }

    [Fact]
    public async Task ConsequenciaLetalEncerraComDerrotaSemAnunciarVitoria()
    {
        var fixture = new Fixture();
        StoryMap(fixture, new() { Type = "EVENTO", Label = "Perigo", Choices = [new() { Code = "risco", Label = "Arriscar", Outcome = new() { Life = -100 } }] });
        await fixture.Service.BeginStoryAsync(10, "story", 5, Request(0), default);
        var result = await fixture.Service.ChooseStoryAsync(10, "story", 5, new() { RevisaoEsperada = 1,
            ChaveIdempotencia = Guid.NewGuid(), ChoiceCode = "risco" }, default);
        Assert.True(result.Sucesso, result.Mensagem); Assert.Equal("Derrota", result.Dados!.Status);
        Assert.NotNull(fixture.Run.EncerradaEmUtc);
        Assert.Equal("BLOQUEADO", result.Dados.Mapa.Nodes.Single(node => node.Id == "end").State);
    }

    private static GameStoryMissionDto PrepareMission(Fixture fixture, string finalType = "EVENTO")
    {
        var reward = new GameStoryMissionDto { AreaCode = "OBJETIVO", Cost = new() { Currency = 10 }, Reward = new() {
            Currency = 25, Xp = 7, Items = [new() { ItemId = "med", Quantity = 2, Snapshot = new() { ["nome"] = "Kit", ["tipo"] = "consumiveis" } }] } };
        StoryMap(fixture, new() { Type = "MISSAO", Label = "Resgate", Mission = reward });
        var config = JsonNode.Parse(Fixture.BaseConfiguration)!;
        config["map"]!["schemaVersion"] = 5;
        var last = new GameModeAreaOptionDto { Type = finalType, Label = "Fim do objetivo", EncounterCode = "CACADOR",
            NpcType = "MEDICO", NpcCode = "curandeiro", Offers = [new() { ItemId = "med", Stock = 1, Snapshot = new() { ["nome"] = "Kit", ["tipo"] = "consumiveis" } }] };
        config["areas"] = JsonSerializer.SerializeToNode(new[] {
            new GameModeAreaDto { Code = "PRINCIPAL", Name = "Principal", NodeCount = 3, Options = [new() { Type = "EVENTO", Label = "Caminho" }] },
            new GameModeAreaDto { Code = "OBJETIVO", Name = "Objetivo", IsSecret = true, NodeCount = 3, UseBase = false, FinalOption = "ROTA:1",
                Options = [new() { Type = "EVENTO", Label = "Caminho", Weight = 100 }, last] } }, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        fixture.Run.GameModeVersion.ConfiguracaoJson = config.ToJsonString();
        return reward;
    }

    [Theory]
    [InlineData("EVENTO")] [InlineData("DESCANSO")] [InlineData("NPC")] [InlineData("VENDEDOR")] [InlineData("COMBATE")]
    public async Task MissaoRetornaERecompensaUmaVezQualquerQueSejaOTipoDoUltimoNo(string finalType)
    {
        var fixture = new Fixture(); string initial = fixture.Run.SnapshotInicialJson;
        PrepareMission(fixture, finalType);
        Assert.True((await fixture.Service.BeginStoryAsync(10, "story", 5, Request(0), default)).Sucesso);
        var accepted = await fixture.Service.ChooseStoryAsync(10, "story", 5, new() {
            RevisaoEsperada = 1, ChaveIdempotencia = Guid.NewGuid(), ChoiceCode = "ACCEPT" }, default);
        Assert.True(accepted.Sucesso, accepted.Mensagem);
        Assert.NotNull(accepted.Dados!.Mapa.ParentMap); Assert.Equal(90, accepted.Dados.EstadoAtual.Economy!.Balance);
        var middle = accepted.Dados.Mapa.Nodes.First(node => node.State == "DISPONIVEL");
        var progressed = await fixture.Service.EnterBaseAsync(10, middle.Id, 5, Request(2), default);
        Assert.True(progressed.Sucesso, progressed.Mensagem);
        var currentMap = GameRunFirstMap.Read(fixture.Run.MapaJson, new(JsonSerializerDefaults.Web));
        var final = currentMap.Nodes.Single(node => node.State == "DISPONIVEL");
        if (finalType == "NPC") Assert.True((await fixture.Service.VisitNpcAsync(10, final.Id, 5, Request(3), default)).Sucesso);
        else if (finalType == "VENDEDOR")
        {
            Assert.True((await fixture.Service.EnterVendorAsync(10, final.Id, 5, Request(3), default)).Sucesso);
            Assert.True((await fixture.Service.LeaveVendorAsync(10, 5, Request(4), default)).Sucesso);
        }
        else if (finalType == "COMBATE")
        {
            var selected = await fixture.Service.SelectAsync(10, final.Id, 5, Request(3), default);
            Assert.True(selected.Sucesso, selected.Mensagem);
            var resolved = await fixture.Service.ResolveAsync(10, 5, Request(4), default);
            Assert.True(resolved.Sucesso, resolved.Mensagem);
        }
        else Assert.True((await fixture.Service.EnterBaseAsync(10, final.Id, 5, Request(3), default)).Sucesso);
        var returned = GameRunFirstMap.Read(fixture.Run.MapaJson, new(JsonSerializerDefaults.Web));
        Assert.Null(returned.ParentMap); Assert.Equal("DISPONIVEL", returned.Nodes.Single(node => node.Id == "end").State);
        Assert.True(returned.Nodes.Single(node => node.Id == "story").Payload!.MissionCompleted);
        var state = JsonNode.Parse(fixture.Run.EstadoAtualJson)!;
        Assert.Equal(115, state["economy"]!["balance"]!.GetValue<int>());
        Assert.Equal(2, Assert.Single(state["inventario"]!.AsArray())!["quantidade"]!.GetValue<int>());
        Assert.Equal(2, state["story"]!.AsArray().Count);
        Assert.Equal(GameRunStatus.Ativa, fixture.Run.Status); Assert.Equal(initial, fixture.Run.SnapshotInicialJson);
    }

    [Fact]
    public async Task MissaoRecusadaNaoCobraNaoConcedeEPermiteSeguir()
    {
        var fixture = new Fixture(); PrepareMission(fixture);
        await fixture.Service.BeginStoryAsync(10, "story", 5, Request(0), default);
        var result = await fixture.Service.ChooseStoryAsync(10, "story", 5, new() {
            RevisaoEsperada = 1, ChaveIdempotencia = Guid.NewGuid(), ChoiceCode = "DECLINE" }, default);
        Assert.True(result.Sucesso, result.Mensagem); Assert.Null(result.Dados!.Mapa.ParentMap);
        Assert.Equal(100, result.Dados.EstadoAtual.Economy!.Balance);
        Assert.Empty(result.Dados.EstadoAtual.Inventario!.Value.EnumerateArray());
        Assert.Equal("MISSAO_RECUSADA", Assert.Single(result.Dados.EstadoAtual.Story).Type);
    }
}
