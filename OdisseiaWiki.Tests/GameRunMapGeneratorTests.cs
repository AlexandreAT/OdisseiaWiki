using System.Text.Json;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.GameRuns.Map;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class GameRunMapGeneratorTests
{
    private const string Configuration = """
        {"map":{"schemaVersion":2,"branchEncounterCodes":["CACADOR","GUARDIAO"]},
         "encounters":{"CACADOR":{"mapName":"Rota do Caçador"},
                       "GUARDIAO":{"mapName":"Rota do Guardião"}}}
        """;

    [Fact]
    public void MapaEReproduzivelETodasAsConexoesDescem()
    {
        GameRunMapGenerator generator = new();
        GameRunMapDto first = generator.Create(123456, Configuration);
        GameRunMapDto repeated = generator.Create(123456, Configuration);
        Assert.Equal(JsonSerializer.Serialize(first), JsonSerializer.Serialize(repeated));
        Assert.Equal(2, first.SchemaVersion);
        Assert.Equal(4, first.Nodes.Count);
        Assert.All(first.Nodes.SelectMany(source => source.Connections.Select(id => (
            source, target: first.Nodes.Single(node => node.Id == id)))), edge =>
            Assert.True(edge.target.Layer > edge.source.Layer));
        Assert.Equal(new[] { -1, 1 }, first.Nodes.Where(node => node.Layer == 2)
            .OrderBy(node => node.Position).Select(node => node.Position));
        Assert.Equal(2, Enumerable.Range(1, 100)
            .Select(seed => generator.Create(seed, Configuration).Nodes
                .Single(node => node.Id == "rota-esquerda").Payload!.EncounterCode)
            .Distinct().Count());
    }

    [Fact]
    public void EscolhaFechaAlternativaENaoPermiteCaminhoHorizontal()
    {
        GameRunMapDto map = new GameRunMapGenerator().Create(10, Configuration);
        Assert.Throws<InvalidOperationException>(() => GameRunMapGenerator.Select(map, "rota-esquerda"));
        GameRunMapGenerator.Select(map, GameRunFirstMap.EncounterId);
        GameRunMapGenerator.Complete(map, GameRunFirstMap.EncounterId);
        Assert.All(map.Nodes.Where(node => node.Layer == 2), node => Assert.Equal("DISPONIVEL", node.State));
        GameRunMapGenerator.Select(map, "rota-esquerda");
        Assert.Equal("IGNORADO", map.Nodes.Single(node => node.Id == "rota-direita").State);
        Assert.Throws<InvalidOperationException>(() => GameRunMapGenerator.Select(map, "rota-direita"));

        GameRunMapDto invalid = new()
        {
            Nodes = [
                new() { Id = "inicio", Type = "INICIO", Layer = 0, Connections = ["a"] },
                new() { Id = "a", Layer = 0 },
            ],
        };
        Assert.Throws<InvalidOperationException>(() => GameRunMapGenerator.Validate(invalid));

        GameRunMapDto defeated = new GameRunMapGenerator().Create(10, Configuration);
        GameRunMapGenerator.Select(defeated, GameRunFirstMap.EncounterId);
        GameRunMapGenerator.Complete(defeated, GameRunFirstMap.EncounterId, unlockChildren: false);
        Assert.All(defeated.Nodes.Where(node => node.Layer == 2), node =>
            Assert.Equal("BLOQUEADO", node.State));
    }

    [Fact]
    public void BaseApareceAposVencerUmaDasRotasSemReabrirAOutra()
    {
        string withBase = Configuration
            .Replace("\"schemaVersion\":2", "\"schemaVersion\":3", StringComparison.Ordinal)
            .Replace("\"map\":", "\"base\":{\"restType\":\"SIMPLES\"},\"map\":", StringComparison.Ordinal);
        GameRunMapDto map = new GameRunMapGenerator().Create(10, withBase);
        GameRunMapNodeDto camp = map.Nodes.Single(node => node.Id == GameRunMapGenerator.BaseNodeId);

        Assert.Equal(3, map.SchemaVersion);
        Assert.Equal("BASE", camp.Type);
        Assert.Equal("BLOQUEADO", camp.State);
        Assert.True(camp.Revealed);
        Assert.All(map.Nodes, node => Assert.True(node.Revealed));
        Assert.All(map.Nodes.Where(node => node.Layer == 2), node =>
            Assert.Contains(camp.Id, node.Connections));
        Assert.Throws<InvalidOperationException>(() => GameRunMapGenerator.Select(map, camp.Id));

        GameRunMapGenerator.Select(map, GameRunFirstMap.EncounterId);
        GameRunMapGenerator.Complete(map, GameRunFirstMap.EncounterId);
        GameRunMapGenerator.Select(map, "rota-esquerda");
        GameRunMapGenerator.Complete(map, "rota-esquerda");

        Assert.Equal("DISPONIVEL", camp.State);
        Assert.Equal("IGNORADO", map.Nodes.Single(node => node.Id == "rota-direita").State);
        GameRunMapGenerator.Select(map, camp.Id);
        GameRunMapGenerator.Complete(map, camp.Id);
        Assert.Equal("CONCLUIDO", camp.State);
    }

    [Fact]
    public void ValidadorPermiteQuatroAlternativasNaMesmaCamada()
    {
        GameRunMapDto map = new()
        {
            Nodes =
            [
                new() { Id = "inicio", Type = "INICIO", Layer = 0,
                    Connections = ["a", "b", "c", "d"] },
                new() { Id = "a", Layer = 1, Position = -3 },
                new() { Id = "b", Layer = 1, Position = -1 },
                new() { Id = "c", Layer = 1, Position = 1 },
                new() { Id = "d", Layer = 1, Position = 3 },
            ],
        };

        GameRunMapGenerator.Validate(map);
        Assert.Equal(4, map.Nodes.Count(node => node.Layer == 1));
    }

    [Fact]
    public void AreasPublicadasGeramMapaCompletoEReproduzivel()
    {
        const string configuration = """
            {"map":{"schemaVersion":4},
             "encounters":{"A":{"mapName":"Primeiro"},"B":{"mapName":"Segundo"},
                           "C":{"mapName":"Chefe A"},"D":{"mapName":"Chefe B"}},
             "areas":[
               {"code":"F1","name":"Ruínas","image":"/ruinas.png","baseName":"Abrigo",
                "options":[{"type":"COMBATE","encounterCode":"A","weight":3},
                           {"type":"ELITE","encounterCode":"B","weight":1}]},
               {"code":"F2","name":"Fortaleza","image":"/fortaleza.png","baseName":"Base",
                "options":[{"type":"BOSS","encounterCode":"C","weight":1},
                           {"type":"BOSS","encounterCode":"D","weight":1}]}]}
            """;
        var generator = new GameRunMapGenerator();
        GameRunMapDto first = generator.Create(123, configuration);
        GameRunMapDto repeated = generator.Create(123, configuration);

        Assert.Equal(JsonSerializer.Serialize(first), JsonSerializer.Serialize(repeated));
        Assert.Equal(4, first.SchemaVersion);
        Assert.Equal(6, first.Nodes.Count);
        Assert.Equal("/ruinas.png", first.Nodes.Single(node => node.Id == "fase-1-rota-1").AreaImage);
        Assert.All(first.Nodes.Where(node => node.Fase == 2 && node.Type == "BOSS"), node =>
            Assert.Empty(node.Connections));
        GameRunMapGenerator.Select(first, "fase-1-rota-1");
        GameRunMapGenerator.Complete(first, "fase-1-rota-1");
        GameRunMapGenerator.Select(first, "fase-1-base");
        GameRunMapGenerator.Complete(first, "fase-1-base");
        Assert.All(first.Nodes.Where(node => node.Fase == 2), node => Assert.Equal("DISPONIVEL", node.State));
    }

    [Fact]
    public void FimConfiguradoPodeSerEncontroEBaseViraOpcaoDaArea()
    {
        const string configuration = """
            {"map":{"schemaVersion":4},
             "encounters":{"A":{"mapName":"Guardião","enemy":{"image":"/npc.png"}},
                           "B":{"mapName":"Patrulha","enemy":{"image":"/patrulha.png"}}},
             "areas":[
               {"code":"F1","name":"Floresta","image":"/floresta.png",
                "baseName":"Acampamento","baseImage":"/base.png","finalOption":"ROTA:0",
                "options":[{"type":"COMBATE","encounterCode":"A","weight":1},
                           {"type":"COMBATE","encounterCode":"B","weight":1}]},
               {"code":"F2","name":"Montanha","image":"/montanha.png","baseName":"Base",
                "options":[{"type":"BOSS","encounterCode":"A","weight":1}]}]}
            """;
        GameRunMapDto map = new GameRunMapGenerator().Create(456, configuration);

        GameRunMapNodeDto finale = Assert.Single(map.Nodes, node => node.Id == "fase-1-final");
        Assert.Equal("Guardião", finale.Name);
        Assert.Equal("/npc.png", finale.Image);
        Assert.Equal("/floresta.png", finale.AreaImage);
        Assert.Contains(map.Nodes, node => node.Fase == 1 && node.Type == "BASE" &&
            node.Image == "/base.png" && node.Connections.Contains(finale.Id));
        Assert.All(map.Nodes.Where(node => node.Fase == 2), node => Assert.Equal("BLOQUEADO", node.State));
    }

    [Fact]
    public void AreaFinalPermiteCombatesAntesDoChefeSemEncerrarARunAntecipadamente()
    {
        const string configuration = """
            {"map":{"schemaVersion":4},
             "encounters":{"A":{"mapName":"Patrulha"},"B":{"mapName":"Elite"},
                           "C":{"mapName":"Chefe"}},
             "areas":[{"code":"FINAL","name":"Fortaleza","baseName":"Base",
               "options":[{"type":"COMBATE","encounterCode":"A","weight":1},
                          {"type":"ELITE","encounterCode":"B","weight":1},
                          {"type":"BOSS","encounterCode":"C","weight":1}]}]}
            """;
        GameRunMapDto map = new GameRunMapGenerator().Create(456, configuration);

        GameRunMapNodeDto boss = Assert.Single(map.Nodes, node => node.Type == "BOSS");
        Assert.Equal("fase-1-final", boss.Id);
        Assert.Equal("BLOQUEADO", boss.State);
        GameRunMapNodeDto[] routes = map.Nodes.Where(node => node.Layer == 1).ToArray();
        Assert.Equal(2, routes.Length);
        Assert.All(routes, route => Assert.Contains(boss.Id, route.Connections));
        Assert.DoesNotContain(routes, route => route.Type == "BOSS");

        GameRunMapGenerator.Select(map, routes[0].Id);
        GameRunMapGenerator.Complete(map, routes[0].Id);
        Assert.Equal("DISPONIVEL", boss.State);
        GameRunMapGenerator.Select(map, boss.Id);
        Assert.Equal("SELECIONADO", boss.State);
    }

    [Fact]
    public void MapaExpandidoGeraDezoitoNosPorAreaEPermiteChefeAntesDoFim()
    {
        const string configuration = """
            {"map":{"schemaVersion":5},
             "encounters":{"A":{"mapName":"Patrulha"},"B":{"mapName":"Chefe"}},
             "areas":[{"code":"F1","name":"Floresta","baseName":"Base","finalOption":"ROTA:0",
               "options":[{"type":"COMBATE","encounterCode":"A","weight":1},
                          {"type":"BOSS","encounterCode":"B","weight":20,"unique":true}]}]}
            """;
        GameRunMapGenerator generator = new();
        GameRunMapDto map = generator.Create(123, configuration);

        Assert.Equal(JsonSerializer.Serialize(map), JsonSerializer.Serialize(generator.Create(123, configuration)));
        Assert.Equal(5, map.SchemaVersion);
        Assert.Equal(19, map.Nodes.Count);
        Assert.All(map.Nodes.Where(node => node.Type != "INICIO"), node => Assert.Equal("F1", node.AreaCode));
        Assert.Equal(new[] { 2, 3, 2, 3, 2, 3, 2, 1 }, map.Nodes.Where(node => node.Type != "INICIO")
            .GroupBy(node => node.Layer).OrderBy(group => group.Key).Select(group => group.Count()));
        Assert.Single(map.Nodes, node => node.Type == "BOSS");
        Assert.Equal("COMBATE", map.Nodes.Single(node => node.Layer == 8).Type);
        Assert.All(map.Nodes.Where(node => node.Layer < 8), node => Assert.NotEmpty(node.Connections));
    }

    [Fact]
    public void QuintaAreaTerminaNoEncontroEscolhidoEmVezDaBase()
    {
        const string configuration = """
            {"map":{"schemaVersion":5},
             "encounters":{"ELITE":{"mapName":"Maga de Fogo"},
                           "FINAL":{"mapName":"Semi Deus"}},
             "areas":[
               {"code":"F1","name":"Um","baseName":"Base","finalOption":"BASE",
                "options":[{"type":"ELITE","encounterCode":"ELITE","weight":1}]},
               {"code":"F2","name":"Dois","baseName":"Base","finalOption":"BASE",
                "options":[{"type":"ELITE","encounterCode":"ELITE","weight":1}]},
               {"code":"F3","name":"Três","baseName":"Base","finalOption":"BASE",
                "options":[{"type":"ELITE","encounterCode":"ELITE","weight":1}]},
               {"code":"F4","name":"Quatro","baseName":"Base","finalOption":"BASE",
                "options":[{"type":"ELITE","encounterCode":"ELITE","weight":1}]},
               {"code":"F5","name":"Caverna","baseName":"Base","nodeCount":18,
                "finalOption":"ROTA:1","options":[
                  {"type":"ELITE","encounterCode":"ELITE","weight":1},
                  {"type":"BOSS","encounterCode":"FINAL","weight":1,"unique":true}]}]}
            """;

        for (long seed = 1; seed <= 5; seed++)
        {
            GameRunMapDto map = new GameRunMapGenerator().Create(seed, configuration);
            GameRunMapNodeDto final = map.Nodes.Single(node => node.Fase == 5 &&
                node.Layer == map.Nodes.Where(areaNode => areaNode.Fase == 5).Max(areaNode => areaNode.Layer));

            Assert.Equal(91, map.Nodes.Count);
            Assert.Equal("BOSS", final.Type);
            Assert.Equal("Semi Deus", final.Name);
            Assert.Equal("FINAL", final.Payload?.EncounterCode);
            GameRunMapGenerator.Validate(map);
        }
    }

    [Theory]
    [InlineData(3)]
    [InlineData(9)]
    [InlineData(18)]
    [InlineData(21)]
    [InlineData(24)]
    public void MapaExpandidoRespeitaQuantidadeConfiguradaENaoDeixaRotasSemSaida(int nodeCount)
    {
        const string configurationTemplate = """
            {"map":{"schemaVersion":5},"encounters":{"A":{"mapName":"Encontro"}},
             "areas":[{"code":"F1","name":"Área","baseName":"Base","nodeCount":18,
               "finalOption":"BASE","options":[{"type":"COMBATE","encounterCode":"A","weight":1}]}]}
            """;
        string configuration = configurationTemplate.Replace("\"nodeCount\":18",
            $"\"nodeCount\":{nodeCount}", StringComparison.Ordinal);
        GameRunMapDto map = new GameRunMapGenerator().Create(123, configuration);

        Assert.Equal(nodeCount + 1, map.Nodes.Count);
        Assert.Single(map.Nodes, node => node.Type == "BASE");
        Assert.All(map.Nodes.Where(node => node.Type != "BASE"), node => Assert.NotEmpty(node.Connections));
        GameRunMapGenerator.Validate(map);
    }

    [Fact]
    public void MapaExpandidoPodeNaoTerBase()
    {
        const string configuration = """
            {"map":{"schemaVersion":5},"encounters":{"A":{"mapName":"Encontro"}},
             "areas":[{"code":"F1","name":"Arena","useBase":false,"nodeCount":18,
               "finalOption":"ALEATORIO","options":[{"type":"COMBATE","encounterCode":"A","weight":1}]}]}
            """;
        GameRunMapDto map = new GameRunMapGenerator().Create(123, configuration);

        Assert.Equal(19, map.Nodes.Count);
        Assert.DoesNotContain(map.Nodes, node => node.Type == "BASE");
        Assert.All(map.Nodes.Where(node => node.Type != "INICIO"), node => Assert.Equal("COMBATE", node.Type));
    }

    [Theory]
    [InlineData(2)]
    [InlineData(25)]
    public void MapaExpandidoRecusaQuantidadeForaDoIntervalo(int nodeCount)
    {
        string configuration = """
            {"map":{"schemaVersion":5},"encounters":{"A":{"mapName":"Encontro"}},
             "areas":[{"code":"F1","name":"Área","baseName":"Base","nodeCount":18,
               "finalOption":"BASE","options":[{"type":"COMBATE","encounterCode":"A","weight":1}]}]}
            """.Replace("\"nodeCount\":18", $"\"nodeCount\":{nodeCount}", StringComparison.Ordinal);

        Assert.Throws<InvalidOperationException>(() => new GameRunMapGenerator().Create(123, configuration));
    }

    [Fact]
    public void MapaVariavelConectaQuatroAreasESaltaParaOFimConfigurado()
    {
        const string configuration = """
            {"map":{"schemaVersion":5},"encounters":{"A":{"mapName":"Encontro"}},
             "areas":[
               {"code":"F1","name":"Um","baseName":"Base","nodeCount":21,"finalOption":"BASE",
                "options":[{"type":"ATALHO","label":"Atalho","weight":1}]},
               {"code":"F2","name":"Dois","baseName":"Base","nodeCount":24,"finalOption":"BASE",
                "options":[{"type":"COMBATE","encounterCode":"A","weight":1}]},
               {"code":"F3","name":"Três","baseName":"Base","nodeCount":3,"finalOption":"BASE",
                "options":[{"type":"COMBATE","encounterCode":"A","weight":1}]},
               {"code":"F4","name":"Quatro","baseName":"Base","nodeCount":24,"finalOption":"BASE",
                "options":[{"type":"COMBATE","encounterCode":"A","weight":1}]}]}
            """;
        GameRunMapDto map = new GameRunMapGenerator().Create(78, configuration);
        GameRunMapNodeDto shortcut = map.Nodes.First(node => node.Type == "ATALHO");
        GameRunMapNodeDto areaEnd = map.Nodes.Single(node => node.Fase == 1 && node.Type == "BASE");

        Assert.Equal(73, map.Nodes.Count);
        Assert.Contains(areaEnd.Id, shortcut.Connections);
        Assert.Equal(4, map.Nodes.Count(node => node.Type == "BASE"));
        GameRunMapGenerator.Validate(map);
    }

    [Fact]
    public void MapaExpandidoRespeitaOrdemSalvaDasFasesNormais()
    {
        const string configuration = """
            {"map":{"schemaVersion":5},"encounters":{"A":{"mapName":"Encontro"}},
             "areas":[
               {"code":"MONTANHA","name":"Montanha","baseName":"Base","finalOption":"BASE",
                "options":[{"type":"COMBATE","encounterCode":"A","weight":1}]},
               {"code":"SEGREDO","name":"Gruta","isSecret":true,"baseName":"Base",
                "finalOption":"BASE","options":[{"type":"COMBATE","encounterCode":"A","weight":1}]},
               {"code":"FLORESTA","name":"Floresta","baseName":"Base","finalOption":"BASE",
                "options":[{"type":"COMBATE","encounterCode":"A","weight":1}]}]}
            """;

        GameRunMapDto map = new GameRunMapGenerator().Create(91, configuration);

        Assert.Equal("Montanha", map.Nodes.First(node => node.Fase == 1 && node.Type != "INICIO").AreaName);
        Assert.Equal("Floresta", map.Nodes.First(node => node.Fase == 2).AreaName);
        Assert.DoesNotContain(map.Nodes, node => node.AreaName == "Gruta");
    }

    [Fact]
    public void SorteioExpandidoRepeteOpcoesComPesoMasNuncaRepeteUmaOpcaoUnica()
    {
        const string configuration = """
            {"map":{"schemaVersion":5},
             "encounters":{"A":{"mapName":"Lobo"},"B":{"mapName":"Tigre"}},
             "areas":[{"code":"F1","name":"Floresta","baseName":"Base","finalOption":"ROTA:0",
               "options":[{"type":"COMBATE","encounterCode":"A","weight":1},
                          {"type":"ELITE","encounterCode":"B","weight":100,"unique":true}]}]}
            """;
        GameRunMapDto map = new GameRunMapGenerator().Create(321, configuration);
        Assert.Single(map.Nodes, node => node.Payload?.EncounterCode == "B");
        Assert.True(map.Nodes.Count(node => node.Payload?.EncounterCode == "A") > 1);
    }

    [Fact]
    public void EventoCarregaDuracaoDeJogoNaRunSemDependerDoRelogioReal()
    {
        const string configuration = """
            {"map":{"schemaVersion":5},"encounters":{},
             "areas":[{"code":"F1","name":"Floresta","useBase":false,"finalOption":"ROTA:0",
               "options":[{"type":"EVENTO","label":"Travessia","gameMinutes":90,"weight":1}]}]}
            """;

        GameRunMapDto map = new GameRunMapGenerator().Create(44, configuration);

        Assert.All(map.Nodes.Where(node => node.Type == "EVENTO"),
            node => Assert.Equal(90, node.Payload?.GameMinutes));
    }

    [Fact]
    public void CacadaFixaInimigoNaSeedSemRevelarSeuRetratoNoMapa()
    {
        const string configuration = """
            {"map":{"schemaVersion":5},
             "encounters":{"LOBO":{"mapName":"Lobo","enemy":{"image":"/lobo.png"}},
                           "TIGRE":{"mapName":"Tigre","enemy":{"image":"/tigre.png"}}},
             "areas":[{"code":"F1","name":"Floresta","baseName":"Base","finalOption":"ROTA:0",
               "options":[{"type":"CACADA","label":"Caçada","image":"/cacada.png",
                           "encounterCodes":["LOBO","TIGRE"],"weight":1}]}]}
            """;
        GameRunMapGenerator generator = new();
        GameRunMapNodeDto hunt = generator.Create(99, configuration).Nodes.Single(node => node.Layer == 8);
        Assert.Equal("CACADA", hunt.Type);
        Assert.Equal("Caçada", hunt.Name);
        Assert.Equal("/cacada.png", hunt.Image);
        Assert.Contains(hunt.Payload?.EncounterCode, new[] { "LOBO", "TIGRE" });
        Assert.Equal(hunt.Payload?.EncounterCode, generator.Create(99, configuration).Nodes
            .Single(node => node.Layer == 8).Payload?.EncounterCode);
    }

    [Fact]
    public void AtalhoLiberaSomenteOFimDaArea()
    {
        GameRunMapDto map = new()
        {
            SchemaVersion = 5,
            Nodes =
            [
                new() { Id = "inicio", Type = "INICIO", Fase = 1, Layer = 0,
                    State = "CONCLUIDO", Connections = ["atalho"] },
                new() { Id = "atalho", Type = "ATALHO", Fase = 1, Layer = 1,
                    State = "DISPONIVEL", Connections = ["meio", "fim"] },
                new() { Id = "meio", Type = "COMBATE", Fase = 1, Layer = 2,
                    State = "BLOQUEADO", Connections = ["fim"] },
                new() { Id = "fim", Type = "EVENTO", Fase = 1, Layer = 3,
                    State = "BLOQUEADO" },
            ],
        };
        GameRunMapGenerator.Select(map, "atalho");
        GameRunMapGenerator.CompleteShortcut(map, "atalho");
        Assert.Equal("IGNORADO", map.Nodes.Single(node => node.Id == "meio").State);
        Assert.Equal("DISPONIVEL", map.Nodes.Single(node => node.Id == "fim").State);
        GameRunMapGenerator.Select(map, "fim");
    }

    [Fact]
    public void AreaSecretaUsaMapaSeparadoEDevolveAJornadaNoMesmoPonto()
    {
        const string configuration = """
            {"map":{"schemaVersion":5},"encounters":{"A":{"mapName":"Guardião"}},
             "areas":[{"code":"F1","name":"Floresta","baseName":"Base",
               "options":[{"type":"COMBATE","encounterCode":"A","weight":1}]},
               {"code":"SECRETO","name":"Gruta","isSecret":true,"image":"/gruta.png",
                "baseName":"Base","options":[{"type":"COMBATE","encounterCode":"A","weight":1}]}]}
            """;
        GameRunMapDto parent = new()
        {
            SchemaVersion = 5,
            MediumRestUsedMapKeys = ["MAPA_PRINCIPAL"],
            OpeningOpportunityPending = true,
            Nodes =
            [
                new() { Id = "inicio", Type = "INICIO", Fase = 1, Layer = 0,
                    State = "CONCLUIDO", Connections = ["portal"] },
                new() { Id = "portal", Type = "AREA_SECRETA", Fase = 1, Layer = 1,
                    State = "DISPONIVEL", Connections = ["proximo"] },
                new() { Id = "proximo", Type = "COMBATE", Fase = 1, Layer = 2,
                    State = "BLOQUEADO" },
            ],
        };
        GameRunMapGenerator.Select(parent, "portal");
        GameRunMapGenerator generator = new();
        GameRunMapDto secret = generator.CreateSecretArea(31, configuration, "SECRETO", "portal");
        GameRunMapDto active = GameRunMapGenerator.EnterSecret(parent, secret, "portal");
        Assert.Contains("MAPA_PRINCIPAL", active.MediumRestUsedMapKeys);
        Assert.True(active.OpeningOpportunityPending);
        active.MediumRestUsedMapKeys = [.. active.MediumRestUsedMapKeys, "SECRETA:portal"];
        Assert.Equal(19, active.Nodes.Count);
        Assert.All(active.Nodes.Where(node => node.Type != "INICIO"), node => Assert.Equal("Gruta", node.AreaName));
        Assert.DoesNotContain(active.Nodes, node => node.Id == "proximo");
        GameRunMapGenerator.Complete(active, active.Nodes.Single(node => node.Layer == 8).Id);

        GameRunMapDto returned = GameRunMapGenerator.ReturnFromSecret(active);
        Assert.Equal("CONCLUIDO", returned.Nodes.Single(node => node.Id == "portal").State);
        Assert.Equal("DISPONIVEL", returned.Nodes.Single(node => node.Id == "proximo").State);
        Assert.Contains(returned.HistoricalNodes, node => node.AreaName == "Gruta");
        Assert.Null(returned.ParentNodes);
        Assert.Equal(["MAPA_PRINCIPAL", "SECRETA:portal"], returned.MediumRestUsedMapKeys);
        Assert.True(returned.OpeningOpportunityPending);
    }

    [Fact]
    public void AreasSecretasEncadeadasRetornamUmNivelPorVezEPreservamFinalAlternativo()
    {
        const string configuration = """
            {"map":{"schemaVersion":5},"encounters":{"A":{"mapName":"Guardiã"}},
             "areas":[{"code":"F1","name":"Floresta","options":[{"type":"COMBATE","encounterCode":"A"}]},
               {"code":"S1","name":"Gruta","isSecret":true,"options":[{"type":"COMBATE","encounterCode":"A"}]},
               {"code":"S2","name":"Santuário","isSecret":true,"isSecretFinal":true,
                "options":[{"type":"COMBATE","encounterCode":"A"}]}]}
            """;
        var generator = new GameRunMapGenerator();
        GameRunMapDto main = new() { SchemaVersion = 5, Nodes =
        [
            new() { Id = "inicio", Type = "INICIO", State = "CONCLUIDO", Connections = ["portal-1"] },
            new() { Id = "portal-1", Type = "AREA_SECRETA", Layer = 1, State = "DISPONIVEL", Connections = ["fim"] },
            new() { Id = "fim", Type = "EVENTO", Layer = 2, State = "BLOQUEADO" },
        ] };
        GameRunMapGenerator.Select(main, "portal-1");
        GameRunMapDto first = GameRunMapGenerator.EnterSecret(main,
            generator.CreateSecretArea(22, configuration, "S1", "portal-1"), "portal-1");
        // The portal can be selected in any layer of a secret map, just like in the main map.
        GameRunMapDto nestedParent = new()
        {
            SchemaVersion = 5, Nodes =
            [
                new() { Id = "secret-inicio", Type = "INICIO", State = "CONCLUIDO", Connections = ["portal-2"] },
                new() { Id = "portal-2", Type = "AREA_SECRETA", Layer = 1, State = "DISPONIVEL" },
            ],
            ParentNodes = first.ParentNodes, ParentMap = first.ParentMap,
            SecretReturnNodeId = first.SecretReturnNodeId,
        };
        GameRunMapGenerator.Select(nestedParent, "portal-2");
        GameRunMapDto second = GameRunMapGenerator.EnterSecret(nestedParent,
            generator.CreateSecretArea(22, configuration, "S2", "portal-2"), "portal-2");
        Assert.True(second.IsSecretFinal);
        Assert.NotNull(second.ParentMap?.ParentMap);
        string serialized = System.Text.Json.JsonSerializer.Serialize(second);
        GameRunMapDto restored = System.Text.Json.JsonSerializer.Deserialize<GameRunMapDto>(serialized)!;
        GameRunMapDto returned = GameRunMapGenerator.ReturnFromSecret(restored);
        Assert.Equal("CONCLUIDO", returned.Nodes.Single(node => node.Id == "portal-2").State);
        Assert.Equal("portal-1", returned.SecretReturnNodeId);
        Assert.NotNull(returned.ParentMap);
        GameRunMapDto mainAgain = GameRunMapGenerator.ReturnFromSecret(returned);
        Assert.Equal("CONCLUIDO", mainAgain.Nodes.Single(node => node.Id == "portal-1").State);
        Assert.Null(mainAgain.ParentMap);
    }
}
