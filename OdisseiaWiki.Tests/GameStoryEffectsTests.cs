using System.Text.Json;
using System.Text.Json.Nodes;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.GameRuns;
using OdisseiaWiki.GameRuns.Map;
using OdisseiaWiki.Models;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class GameStoryEffectsTests
{
    internal const string Snapshot = """{"nome":"Ada","status":{"status":{"vida":50,"vidaMaxima":100,"mana":20,"manaMaxima":50,"estamina":30,"estaminaMaxima":60},"xp":0},"inventario":[],"implantes":[],"economy":{"balance":100,"stash":[]}}""";
    internal static SistemaVersao Version() => new() { Condicoes = [new() { Codigo = "REGEN", Nome = "Regeneração", Tipo = "Fisico",
        UnidadeDuracao = SistemaUnidadeDuracao.Turno, DuracaoPadrao = 4,
        ConfiguracaoPadraoJson = """{"efeitos":[{"operacao":"SOMAR","recurso":"VIDA","valor":10,"momento":"INICIO_TURNO"}]}""" }] };

    [Fact]
    public void EfeitosConcedemCopiasXpMoedasRecursosECondicoesSemAlterarFontes()
    {
        var outcome = new GameStoryOutcomeDto { Currency = 30, Xp = 5, Life = 80, Mana = -5,
            Items = [new() { ItemId = "seringa", Quantity = 3, Snapshot = new() { ["nome"] = "Seringa", ["tipo"] = "consumiveis", ["valor"] = 25 } }],
            Conditions = [new() { Code = "REGEN", Duration = 2, DurationUnit = "Turno" }] };
        string source = outcome.Items[0].Snapshot!.ToJsonString();
        string updated = GameStoryEffects.Apply(Snapshot, "event-1", "Laboratório", "EVENTO", "Aceitar", "Recuperado!",
            new() { Currency = 20, Stamina = 7 }, outcome, Version());
        var state = JsonNode.Parse(updated)!;
        Assert.Equal(110, state["economy"]!["balance"]!.GetValue<int>());
        Assert.Equal(100, state["status"]!["status"]!["vida"]!.GetValue<int>());
        Assert.Equal(15, state["status"]!["status"]!["mana"]!.GetValue<int>());
        Assert.Equal(23, state["status"]!["status"]!["estamina"]!.GetValue<int>());
        Assert.Equal(5, state["status"]!["xpConquistadoRun"]!.GetValue<int>());
        var item = Assert.Single(state["inventario"]!.AsArray())!;
        Assert.Equal(3, item["quantidade"]!.GetValue<int>()); Assert.NotNull(item["id"]);
        Assert.Equal("seringa", item["idItemBase"]!.ToString());
        Assert.Contains("REGEN", state["status"]!["condicoesJogo"]!.ToJsonString());
        Assert.Equal(source, outcome.Items[0].Snapshot!.ToJsonString());
        Assert.Equal(10, Assert.Single(state["story"]!.AsArray())!["currency"]!.GetValue<int>());
        Assert.Throws<InvalidOperationException>(() => GameStoryEffects.Apply(updated, "event-1", "Lab", "EVENTO", "Outra", null, new(), outcome, Version()));
        Assert.Empty(JsonNode.Parse(Snapshot)!["inventario"]!.AsArray());
    }

    [Theory]
    [InlineData(101, 0, 0, 0)] [InlineData(0, 50, 0, 0)] [InlineData(0, 0, 21, 0)] [InlineData(0, 0, 0, 31)]
    public void CustoInsuficienteNaoPodeSerPagoComRecompensaDaPropriaEscolha(int currency, int life, int mana, int stamina)
    {
        var cost = new GameStoryCostDto { Currency = currency, Life = life, Mana = mana, Stamina = stamina };
        Assert.NotNull(GameStoryEffects.CannotPay(Snapshot, cost));
        Assert.Throws<InvalidOperationException>(() => GameStoryEffects.Apply(Snapshot, "event", "Lab", "EVENTO", "A", null,
            cost, new() { Currency = 1000, Life = 1000, Mana = 1000, Stamina = 1000 }, Version()));
        Assert.Equal(100, JsonNode.Parse(Snapshot)!["economy"]!["balance"]!.GetValue<int>());
    }

    [Fact]
    public void PercentualUsaMaximoAtualEDanoDiretoPodeZerarVida()
    {
        var updated = GameStoryEffects.Apply(Snapshot, "event", "Lab", "EVENTO", "A", null,
            new(), new() { Life = -100, Mana = 10, Stamina = -50, Percentage = true }, Version());
        var resources = JsonNode.Parse(updated)!["status"]!["status"]!;
        Assert.Equal(0, resources["vida"]!.GetValue<int>());
        Assert.Equal(25, resources["mana"]!.GetValue<int>());
        Assert.Equal(0, resources["estamina"]!.GetValue<int>());
    }

    [Fact]
    public void CustoPodeAtivarCondicaoAntesDaRecuperacaoDaEscolha()
    {
        var version = Version();
        version.Condicoes.Add(new() { Codigo = "EXAUSTAO", Nome = "Exaustão", Tipo = "Fisico",
            CodigoRecursoGatilho = "MANA", OperadorGatilho = "<=", ValorGatilho = 0, RegraRemocao = "DESCANSO_NORMAL",
            ConfiguracaoPadraoJson = "{\"efeitos\":[{\"operacao\":\"REDUZIR_LIMITE_PERCENTUAL\",\"recurso\":\"MANA\",\"valor\":20,\"momento\":\"ENQUANTO_ATIVA\"}]}" });
        string result = GameStoryEffects.Apply(Snapshot, "event", "Portal", "EVENTO", "Usar mana", null,
            new() { Mana = 20 }, new() { Mana = 100, Percentage = true }, version);
        var state = JsonNode.Parse(result)!;
        Assert.Equal(40, state["status"]!["status"]!["manaMaxima"]!.GetValue<int>());
        Assert.Equal(40, state["status"]!["status"]!["mana"]!.GetValue<int>());
        Assert.Equal(20, Assert.Single(state["story"]!.AsArray())!["mana"]!.GetValue<int>());
    }

    [Fact]
    public void RegistroMostraMoedaRealRecebidaMesmoNoLimiteSeguro()
    {
        var root = JsonNode.Parse(Snapshot)!; root["economy"]!["balance"] = 1_000_000_000;
        string result = GameStoryEffects.Apply(root.ToJsonString(), "event", "Arquivo", "EVENTO", "Abrir", null,
            new() { Currency = 10 }, new() { Currency = 100 }, Version());
        var state = JsonNode.Parse(result)!;
        Assert.Equal(1_000_000_000, state["economy"]!["balance"]!.GetValue<int>());
        Assert.Equal(0, Assert.Single(state["story"]!.AsArray())!["currency"]!.GetValue<int>());
    }

    [Fact]
    public void ResumoProtegidoFicaCongeladoSemDuplicarPropriedadeEntreJornadas()
    {
        var memory = new GameCharacterMilestones();
        memory.ProtectedItems.Add(new("JOGO", 1, "seguro", new() { ["nome"] = "Kit", ["quantidade"] = 3 }, 7));
        string frozen = GameProtectedDeposit.CaptureAtEnd(Snapshot, memory, "JOGO", 1, 7, "{}");
        memory.ProtectedItems.Clear();
        Assert.Equal(frozen, GameProtectedDeposit.CaptureAtEnd(frozen, memory, "JOGO", 1, 7, "{}"));
        Assert.Equal("Kit", JsonNode.Parse(frozen)!["protectedDepositAtEnd"]!["items"]![0]!["snapshot"]!["nome"]!.ToString());
        Assert.DoesNotContain("protectedDepositAtEnd", Snapshot);
        Assert.Empty(memory.ProtectedItems);
    }

    [Fact]
    public void ValidacaoExigeSaidaGratuitaERejeitaSurpresasRecursivas()
    {
        var route = new GameModeAreaOptionDto { Type = "EVENTO", Label = "Lab", Choices = [new() {
            Code = "pagar", Label = "Pagar", Cost = new() { Currency = 5 } }] };
        var area = new GameModeAreaDto { Name = "Floresta", Options = [route] };
        Assert.Contains("sem custo", GameModeRouteValidation.Validate(area, [], [area]));
        route.Choices.Add(new() { Code = "sair", Label = "Sair" });
        Assert.Null(GameModeRouteValidation.Validate(area, [], [area]));
        route.Choices[0].Outcome.Conditions.Add(new() { Code = "REGEN", DurationUnit = "MINUTOS" });
        Assert.NotNull(GameModeRouteValidation.Validate(area, [], [area]));
        route = new() { Type = "SURPRESA", Label = "Sinal", SurpriseOptions = [new() { Type = "SURPRESA", Label = "Loop" }] };
        area.Options = [route];
        Assert.Contains("sem incluir outro Encontro desconhecido", GameModeRouteValidation.Validate(area, [], [area]));
    }

    [Fact]
    public void SurpresaEscolheUmaVezMantemConexoesEComprometeAlternativasSemConcluirRota()
    {
        var json = new JsonSerializerOptions(JsonSerializerDefaults.Web);
        var mystery = new GameModeAreaOptionDto { Type = "SURPRESA", Label = "Sinal", SurpriseOptions = [
            new() { Type = "EVENTO", Label = "Santuário", Weight = 1 }, new() { Type = "EVENTO", Label = "Laboratório", Weight = 3 }] };
        GameRunMapDto Map() => new() { SchemaVersion = 5, Nodes = [
            new() { Id = "inicio", Type = "INICIO", State = "CONCLUIDO", Connections = ["mystery", "other"] },
            new() { Id = "mystery", Type = "SURPRESA", State = "DISPONIVEL", Layer = 1, Seed = 123, Connections = ["end"], Payload = new() { SurpriseOptions = mystery.SurpriseOptions } },
            new() { Id = "other", Type = "EVENTO", State = "DISPONIVEL", Layer = 1, Connections = ["end"] },
            new() { Id = "end", Type = "EVENTO", State = "BLOQUEADO", Layer = 2 }] };
        var map = Map(); string configuration = """{"encounters":{}}""";
        GameRunMapGenerator.RevealSurprise(map, map.Nodes[1], configuration);
        Assert.Equal("EVENTO", map.Nodes[1].Type); Assert.True(map.Nodes[1].Payload!.SurpriseRevealed);
        Assert.Equal("DISPONIVEL", map.Nodes[1].State); Assert.Equal("IGNORADO", map.Nodes[2].State);
        Assert.Equal("BLOQUEADO", map.Nodes[3].State); Assert.Equal(["end"], map.Nodes[1].Connections);
        var again = Map(); GameRunMapGenerator.RevealSurprise(again, again.Nodes[1], configuration);
        Assert.Equal(map.Nodes[1].Name, again.Nodes[1].Name);
        var persisted = JsonSerializer.Deserialize<GameRunMapDto>(JsonSerializer.Serialize(map, json), json)!;
        Assert.Throws<InvalidOperationException>(() => GameRunMapGenerator.RevealSurprise(persisted, persisted.Nodes[1], configuration));
    }

    [Theory]
    [InlineData("EVENTO", 1)] [InlineData("ATALHO", 2)]
    public void SurpresaSoMantemConexaoDeSaltoQuandoOResultadoRealForAtalho(string type, int connections)
    {
        var map = new GameRunMapDto { SchemaVersion = 5, Nodes = [
            new() { Id = "start", Type = "INICIO", State = "CONCLUIDO", Connections = ["mystery"] },
            new() { Id = "mystery", Type = "SURPRESA", State = "DISPONIVEL", Layer = 1, Connections = ["next", "end"],
                Payload = new() { SurpriseOptions = [new() { Type = type, Label = "Resultado" }] } },
            new() { Id = "next", Type = "EVENTO", Layer = 2, State = "BLOQUEADO", Connections = ["end"] },
            new() { Id = "end", Type = "EVENTO", Layer = 3, State = "BLOQUEADO" }] };
        GameRunMapGenerator.RevealSurprise(map, map.Nodes[1], "{\"encounters\":{}}");
        Assert.Equal(connections, map.Nodes[1].Connections.Count);
        if (type == "EVENTO")
        {
            GameRunMapGenerator.Select(map, "mystery"); GameRunMapGenerator.Complete(map, "mystery");
            Assert.Equal("BLOQUEADO", map.Nodes[3].State); Assert.Equal("DISPONIVEL", map.Nodes[2].State);
        }
    }

    [Fact]
    public void MapaNovoConsultaPublicacaoFixadaSemCopiarTodoCatalogoOcultoEmCadaNo()
    {
        const string configuration = """
            {"map":{"schemaVersion":5},"encounters":{},"areas":[{"code":"MAIN","name":"Principal","nodeCount":3,
             "useBase":false,"finalOption":"ROTA:0","options":[{"type":"SURPRESA","label":"Sinal","weight":1,
             "surpriseOptions":[{"type":"EVENTO","label":"Arquivo","weight":1,"choices":[{"code":"abrir","label":"Abrir"}]}]}]}]}
            """;
        var map = new GameRunMapGenerator().Create(100, configuration);
        Assert.All(map.Nodes.Where(node => node.Type == "SURPRESA"), node => {
            Assert.Empty(node.Payload!.SurpriseOptions); Assert.Equal(0, node.Payload.SurpriseOptionIndex); });
        var current = map.Nodes.First(node => node.State == "DISPONIVEL");
        GameRunMapGenerator.RevealSurprise(map, current, configuration);
        Assert.Equal("EVENTO", current.Type); Assert.Equal("Arquivo", current.Name);
        Assert.Equal("abrir", Assert.Single(current.Payload!.Choices).Code);
    }
}
