using Moq;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services;
using OdisseiaWiki.Services.Interfaces;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class GameRunServiceTests
{
    [Fact]
    public async Task NovaRunHerdaPrecoAusenteDaFichaELeituraLegadaNaoGravaNemAlteraFicha()
    {
        var catalogue = new Mock<IGameModeManagementRepository>();
        catalogue.Setup(repo => repo.GetLootItemsAsync(It.IsAny<int?>(), 42, It.IsAny<CancellationToken>()))
            .ReturnsAsync([new Item { Iditem = "espada", Valor = 650 }]);
        Fixture fixture = new(new GameRunItemValueResolver(catalogue.Object));
        fixture.Character.InventarioJson = """[{"id":"a","idItemBase":"espada","nome":"Espada"}]""";
        string sheet = fixture.Character.InventarioJson;
        var created = await fixture.Service.CreateAsync(fixture.UserId, new()
            { IdPersonagemJogador = fixture.Character.IdpersonagemJogador, ChaveIdempotencia = Guid.NewGuid() }, default);
        Assert.True(created.Sucesso, created.Mensagem);
        Assert.Equal(650, created.Dados!.EstadoAtual.Inventario!.Value[0].GetProperty("valor").GetDecimal());
        fixture.Run!.EstadoAtualJson = fixture.Run.EstadoAtualJson.Replace("\"valor\":650", "\"valor\":null", StringComparison.Ordinal);
        string stored = fixture.Run.EstadoAtualJson;
        var loaded = await fixture.Service.GetByIdAsync(fixture.Run.IdGameRun, fixture.UserId, default);
        Assert.Equal(650, loaded!.EstadoAtual.Inventario!.Value[0].GetProperty("valor").GetDecimal());
        Assert.Equal(stored, fixture.Run.EstadoAtualJson);
        Assert.Equal(sheet, fixture.Character.InventarioJson);
    }

    [Fact]
    public async Task InicioComReferenciaRemovidaExplicaRotaSemCriarRunNemLancarErroInterno()
    {
        Fixture fixture = new();
        var mode = System.Text.Json.Nodes.JsonNode.Parse(fixture.Mode.ConfiguracaoJson)!;
        mode["encounters"]!.AsObject().Remove("CACADOR");
        fixture.Mode.ConfiguracaoJson = mode.ToJsonString();
        var result = await fixture.Service.CreateAsync(fixture.UserId, new()
        {
            IdPersonagemJogador = fixture.Character.IdpersonagemJogador,
            ChaveIdempotencia = Guid.NewGuid(),
        }, default);
        Assert.False(result.Sucesso);
        Assert.Equal("MAPA_INDISPONIVEL", result.Codigo);
        Assert.Contains("rota", result.Mensagem);
        Assert.Contains("Encontro da rota", result.Mensagem);
        Assert.Null(fixture.Run);
    }

    [Fact]
    public async Task NovaRunRecebeMoedaDoModoEReinicioLimpaSaldoEStashAnterior()
    {
        Fixture fixture = new();
        var mode = System.Text.Json.Nodes.JsonNode.Parse(fixture.Mode.ConfiguracaoJson)!;
        mode["startingCurrency"] = 120;
        fixture.Mode.ConfiguracaoJson = mode.ToJsonString();
        var created = await fixture.Service.CreateAsync(fixture.UserId, new GameRunCreateRequestDto
        {
            IdPersonagemJogador = fixture.Character.IdpersonagemJogador,
            ChaveIdempotencia = Guid.NewGuid(),
        }, default);
        Assert.True(created.Sucesso, created.Mensagem);
        Assert.Equal(120, created.Dados!.EstadoAtual.Economy!.Balance);
        Assert.Empty(created.Dados.EstadoAtual.Economy.Stash);
        fixture.Run!.EstadoAtualJson = OdisseiaWiki.GameRuns.GameRunEconomy.Buy(fixture.Run.EstadoAtualJson,
            System.Text.Json.Nodes.JsonNode.Parse("""{"nome":"Poção","tipo":"consumiveis"}""")!.AsObject(), "pocao", 20, true);

        var restarted = await fixture.Service.RestartAsync(fixture.Run.IdGameRun, fixture.UserId,
            new() { RevisaoEsperada = 0, ChaveIdempotencia = Guid.NewGuid() }, default);
        Assert.True(restarted.Sucesso, restarted.Mensagem);
        Assert.Equal(120, restarted.Dados!.EstadoAtual.Economy!.Balance);
        Assert.Empty(restarted.Dados.EstadoAtual.Economy.Stash);
    }

    [Fact]
    public async Task EscolhaDeJogoRespeitaMesaEReinicioMantemJogo()
    {
        Fixture fixture = new();
        fixture.Character.IdSistemaVersao = 42;
        var mesaGame = new GameModeVersion
        {
            IdGameModeVersion = 21, IdSistemaVersao = 42, IdMesa = 5,
            Codigo = "GAME_MESA", Nome = "Caçada", NumeroVersao = "0.4.0",
            Status = GameModeVersionStatus.Publicado,
            ConfiguracaoJson = fixture.Mode.ConfiguracaoJson,
        };
        var otherGame = new GameModeVersion
        {
            IdGameModeVersion = 22, IdSistemaVersao = 42, IdMesa = 99,
            Codigo = "GAME_OUTRA_MESA", Nome = "Privado", NumeroVersao = "0.4.0",
            Status = GameModeVersionStatus.Publicado,
            ConfiguracaoJson = fixture.Mode.ConfiguracaoJson,
        };
        fixture.Repository.Setup(item => item.GetPublishedModesAsync(
                It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([fixture.Mode, mesaGame, otherGame]);

        var games = await fixture.Service.GetCharacterGamesAsync(
            fixture.UserId, fixture.Character.IdpersonagemJogador, CancellationToken.None);
        Assert.Equal(2, games.Count);
        Assert.DoesNotContain(games, game => game.Codigo == otherGame.Codigo);

        var missingChoice = await fixture.Service.CreateAsync(fixture.UserId, new GameRunCreateRequestDto
        {
            IdPersonagemJogador = fixture.Character.IdpersonagemJogador,
            ChaveIdempotencia = Guid.NewGuid(),
        }, CancellationToken.None);
        Assert.Equal("JOGO_OBRIGATORIO", missingChoice.Codigo);

        var forbiddenChoice = await fixture.Service.CreateAsync(fixture.UserId, new GameRunCreateRequestDto
        {
            IdPersonagemJogador = fixture.Character.IdpersonagemJogador,
            CodigoJogo = otherGame.Codigo,
            ChaveIdempotencia = Guid.NewGuid(),
        }, CancellationToken.None);
        Assert.False(forbiddenChoice.Sucesso);

        var created = await fixture.Service.CreateAsync(fixture.UserId, new GameRunCreateRequestDto
        {
            IdPersonagemJogador = fixture.Character.IdpersonagemJogador,
            CodigoJogo = mesaGame.Codigo,
            ChaveIdempotencia = Guid.NewGuid(),
        }, CancellationToken.None);
        Assert.True(created.Sucesso, created.Mensagem);
        Assert.Equal(mesaGame.IdGameModeVersion, created.Dados!.IdGameModeVersion);

        var restarted = await fixture.Service.RestartAsync(fixture.Run!.IdGameRun, fixture.UserId,
            new GameRunRestartRequestDto { RevisaoEsperada = 0, ChaveIdempotencia = Guid.NewGuid() },
            CancellationToken.None);
        Assert.True(restarted.Sucesso, restarted.Mensagem);
        Assert.Equal(mesaGame.IdGameModeVersion, restarted.Dados!.IdGameModeVersion);
    }

    [Fact]
    public async Task ListaPersonagensExplicitaVersaoFixadaELootDisponivelNoModoDaFicha()
    {
        Fixture fixture = new();
        fixture.Character.IdSistemaVersao = 42;
        var systems = new Mock<ISistemaRpgRepository>();
        systems.Setup(item => item.GetByCodeAsync("ODISSEIA", false))
            .ReturnsAsync(new SistemaRpg { IdVersaoPublicada = 99, Codigo = "ODISSEIA", Nome = "Odisseia" });
        systems.Setup(item => item.GetVersionAsync(42, true, false))
            .ReturnsAsync(new SistemaVersao { IdSistemaVersao = 42, NumeroVersao = "1.1",
                Modulos = [new() { TipoModulo = SistemaModuloTipo.Progressao, Habilitado = true,
                    ConfiguracaoJson = "{}" }] });
        fixture.SystemResolver.Setup(item => item.ResolverContextoAsync(
                It.Is<SistemaRuntimeConsultaDto>(query =>
                    query.IdPersonagemJogador == fixture.Character.IdpersonagemJogador)))
            .ReturnsAsync(new SistemaRuntimeContextoDto
            {
                Origem = SistemaRuntimeOrigem.VersaoFixadaPersonagemJogador,
                IdSistemaVersao = 42,
                NomeSistema = "Odisseia",
                NumeroVersao = "1.1",
                AtualizacaoDisponivel = true,
                IdVersaoDisponivel = 43,
                NumeroVersaoDisponivel = "1.2",
            });
        fixture.Repository.Setup(item => item.GetCharactersAsync(fixture.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([fixture.Character]);
        fixture.Repository.Setup(item => item.GetPublishedModesAsync(
                It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([fixture.Mode]);
        GameRunService service = new(fixture.Repository.Object, fixture.CharacterRepository.Object,
            fixture.SystemResolver.Object, new GameRunSnapshotFactory(), systems.Object);

        GameRunCharacterOptionDto option = Assert.Single(await service.GetCharactersAsync(
            fixture.UserId, CancellationToken.None));

        Assert.Equal(42, option.IdSistemaVersao);
        Assert.Equal(43, option.IdSistemaVersaoAtual);
        Assert.Equal("1.1", option.NumeroVersaoSistema);
        Assert.Equal("1.2", option.NumeroVersaoSistemaAtual);
        Assert.True(option.AtualizacaoDisponivel);
        Assert.Equal("Odisseia", option.NomeSistema);
        Assert.Equal("0.4.1", option.NumeroVersaoModo);
        Assert.False(option.LootConfigurado);
        Assert.False(option.InfluenciasAtributosConfiguradas);

        fixture.Mode.ConfiguracaoJson = fixture.Mode.ConfiguracaoJson.Replace(
            "\"CACADOR\":{\"mapName\"", "\"CACADOR\":{\"lootCount\":1,\"mapName\"",
            StringComparison.Ordinal);
        Assert.True(Assert.Single(await service.GetCharactersAsync(
            fixture.UserId, CancellationToken.None)).LootConfigurado);
    }

    [Fact]
    public async Task CreateAsync_CopiaFichaERepeticaoNaoCriaOutraRun()
    {
        Fixture fixture = new();
        Guid key = Guid.NewGuid();
        GameRunCreateRequestDto request = new()
        {
            IdPersonagemJogador = fixture.Character.IdpersonagemJogador,
            ChaveIdempotencia = key,
        };

        GameRunOperationResult<GameRunDto> created = await fixture.Service.CreateAsync(
            fixture.UserId, request, CancellationToken.None);
        Assert.True(created.Sucesso, created.Mensagem);
        Assert.False(created.Repetido);
        Assert.Equal(123, created.Dados!.IdGameRun);
        Assert.Equal(100, created.Dados.EstadoAtual.Status
            .GetProperty("status").GetProperty("vida").GetInt32());
        Assert.Equal(5, created.Dados.Mapa.SchemaVersion);
        Assert.Equal(19, created.Dados.Mapa.Nodes.Count);
        Assert.Equal(18, created.Dados.Mapa.Nodes.Count(node => node.Type != "INICIO"));
        Assert.Equal(17, created.Dados.Mapa.Nodes.Count(node => node.Type == "COMBATE"));
        Assert.Equal("BLOQUEADO", created.Dados.Mapa.Nodes.Single(node => node.Type == "BASE").State);

        fixture.Character.StatusJson = """{"status":{"vida":1},"nivel":9}""";
        GameRunOperationResult<GameRunDto> repeated = await fixture.Service.CreateAsync(
            fixture.UserId, request, CancellationToken.None);

        Assert.True(repeated.Sucesso, repeated.Mensagem);
        Assert.True(repeated.Repetido);
        Assert.Equal(100, repeated.Dados!.SnapshotInicial.Status
            .GetProperty("status").GetProperty("vida").GetInt32());
        fixture.Repository.Verify(item => item.AddRunAsync(
            It.IsAny<GameRun>(), It.IsAny<CancellationToken>()), Times.Once);
        fixture.Repository.Verify(item => item.AddCommandAsync(
            It.IsAny<GameRunCommand>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_NaoIniciaMapaAntigoMesmoQueSejaOUltimoModoPublicado()
    {
        Fixture fixture = new();
        fixture.Mode.ConfiguracaoJson = """{"map":{"schemaVersion":4}}""";

        GameRunOperationResult<GameRunDto> result = await fixture.Service.CreateAsync(
            fixture.UserId, new GameRunCreateRequestDto
            {
                IdPersonagemJogador = fixture.Character.IdpersonagemJogador,
                ChaveIdempotencia = Guid.NewGuid(),
            }, CancellationToken.None);

        Assert.Equal("MAPA_DESATUALIZADO", result.Codigo);
        Assert.Null(fixture.Run);
        fixture.Repository.Verify(item => item.AddRunAsync(
            It.IsAny<GameRun>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_ImpedeNovaRunAtivaEReusoDaChaveParaOutraFicha()
    {
        Fixture fixture = new();
        Guid key = Guid.NewGuid();
        await fixture.Service.CreateAsync(fixture.UserId, new GameRunCreateRequestDto
        {
            IdPersonagemJogador = fixture.Character.IdpersonagemJogador,
            ChaveIdempotencia = key,
        }, CancellationToken.None);

        GameRunOperationResult<GameRunDto> reusedKey = await fixture.Service.CreateAsync(
            fixture.UserId, new GameRunCreateRequestDto
            {
                IdPersonagemJogador = fixture.Character.IdpersonagemJogador + 1,
                ChaveIdempotencia = key,
            }, CancellationToken.None);
        GameRunOperationResult<GameRunDto> secondRun = await fixture.Service.CreateAsync(
            fixture.UserId, new GameRunCreateRequestDto
            {
                IdPersonagemJogador = fixture.Character.IdpersonagemJogador,
                ChaveIdempotencia = Guid.NewGuid(),
            }, CancellationToken.None);

        Assert.Equal("CHAVE_IDEMPOTENCIA_REUTILIZADA", reusedKey.Codigo);
        Assert.Equal("RUN_ATIVA_EXISTENTE", secondRun.Codigo);
        fixture.Repository.Verify(item => item.AddRunAsync(
            It.IsAny<GameRun>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_NaoAceitaPersonagemForaDaPropriedade()
    {
        Fixture fixture = new() { CharacterAvailable = false };
        GameRunOperationResult<GameRunDto> result = await fixture.Service.CreateAsync(
            fixture.UserId, new GameRunCreateRequestDto
            {
                IdPersonagemJogador = fixture.Character.IdpersonagemJogador,
                ChaveIdempotencia = Guid.NewGuid(),
            }, CancellationToken.None);

        Assert.Equal("PERSONAGEM_NAO_ENCONTRADO", result.Codigo);
        fixture.SystemResolver.VerifyNoOtherCalls();
        fixture.Repository.Verify(item => item.AddRunAsync(
            It.IsAny<GameRun>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task AbandonAsync_ExigeRevisaoERepeteRespostaSemNovaMutacao()
    {
        Fixture fixture = new();
        await fixture.Service.CreateAsync(fixture.UserId, new GameRunCreateRequestDto
        {
            IdPersonagemJogador = fixture.Character.IdpersonagemJogador,
            ChaveIdempotencia = Guid.NewGuid(),
        }, CancellationToken.None);

        GameRunOperationResult<GameRunDto> stale = await fixture.Service.AbandonAsync(
            123, fixture.UserId, new GameRunAbandonRequestDto
            {
                RevisaoEsperada = 1,
                ChaveIdempotencia = Guid.NewGuid(),
            }, CancellationToken.None);
        Assert.Equal("REVISAO_DESATUALIZADA", stale.Codigo);

        Guid key = Guid.NewGuid();
        GameRunAbandonRequestDto request = new()
        {
            RevisaoEsperada = 0,
            ChaveIdempotencia = key,
        };
        GameRunOperationResult<GameRunDto> abandoned = await fixture.Service.AbandonAsync(
            123, fixture.UserId, request, CancellationToken.None);
        GameRunOperationResult<GameRunDto> repeated = await fixture.Service.AbandonAsync(
            123, fixture.UserId, request, CancellationToken.None);

        Assert.True(abandoned.Sucesso, abandoned.Mensagem);
        Assert.Equal("Abandonada", abandoned.Dados!.Status);
        Assert.Equal(1, abandoned.Dados.Revisao);
        Assert.True(repeated.Repetido);
        Assert.Equal(abandoned.Dados.EncerradaEmUtc, repeated.Dados!.EncerradaEmUtc);
        Assert.Equal(1, fixture.Run!.Revisao);
    }

    [Fact]
    public async Task RestartAsync_CriaRunNovaComOutraSeedESemRepetirNaMesmaChave()
    {
        Fixture fixture = new();
        GameRunOperationResult<GameRunDto> first = await fixture.Service.CreateAsync(
            fixture.UserId, new GameRunCreateRequestDto
            {
                IdPersonagemJogador = fixture.Character.IdpersonagemJogador,
                ChaveIdempotencia = Guid.NewGuid(),
            }, CancellationToken.None);
        GameRun original = fixture.Run!;
        fixture.Character.StatusJson = """{"status":{"vida":75,"mana":20,"estamina":30},"nivel":1}""";
        GameRunRestartRequestDto request = new()
        {
            RevisaoEsperada = 0,
            ChaveIdempotencia = Guid.NewGuid(),
        };

        GameRunOperationResult<GameRunDto> restarted = await fixture.Service.RestartAsync(
            original.IdGameRun, fixture.UserId, request, CancellationToken.None);
        GameRunOperationResult<GameRunDto> repeated = await fixture.Service.RestartAsync(
            original.IdGameRun, fixture.UserId, request, CancellationToken.None);

        Assert.True(restarted.Sucesso, restarted.Mensagem);
        Assert.Equal(124, restarted.Dados!.IdGameRun);
        Assert.NotEqual(first.Dados!.Seed, restarted.Dados.Seed);
        Assert.Equal(0, restarted.Dados.Revisao);
        Assert.Equal(1, restarted.Dados.Fase);
        Assert.Equal(75, restarted.Dados.EstadoAtual.Status
            .GetProperty("status").GetProperty("vida").GetInt32());
        Assert.Equal(GameRunStatus.Abandonada, original.Status);
        Assert.Equal(1, original.Revisao);
        Assert.True(repeated.Repetido);
        Assert.Equal(restarted.Dados.IdGameRun, repeated.Dados!.IdGameRun);
        fixture.Repository.Verify(item => item.AddRunAsync(
            It.IsAny<GameRun>(), It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    [Fact]
    public async Task RestartAsync_NaoEncerraRunSeFichaNaoPuderSerCopiada()
    {
        Fixture fixture = new();
        await fixture.Service.CreateAsync(fixture.UserId, new GameRunCreateRequestDto
        {
            IdPersonagemJogador = fixture.Character.IdpersonagemJogador,
            ChaveIdempotencia = Guid.NewGuid(),
        }, CancellationToken.None);
        fixture.CharacterAvailable = false;

        GameRunOperationResult<GameRunDto> result = await fixture.Service.RestartAsync(
            fixture.Run!.IdGameRun, fixture.UserId, new GameRunRestartRequestDto
            {
                RevisaoEsperada = 0,
                ChaveIdempotencia = Guid.NewGuid(),
            }, CancellationToken.None);

        Assert.Equal("PERSONAGEM_NAO_ENCONTRADO", result.Codigo);
        Assert.Equal(GameRunStatus.Ativa, fixture.Run!.Status);
        fixture.Repository.Verify(item => item.AddRunAsync(
            It.IsAny<GameRun>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RestartAsync_NaoEncerraRunSeModoPublicadoAindaTiverMapaAntigo()
    {
        Fixture fixture = new();
        await fixture.Service.CreateAsync(fixture.UserId, new GameRunCreateRequestDto
        {
            IdPersonagemJogador = fixture.Character.IdpersonagemJogador,
            ChaveIdempotencia = Guid.NewGuid(),
        }, CancellationToken.None);
        fixture.Mode.ConfiguracaoJson = """{"map":{"schemaVersion":4}}""";

        GameRunOperationResult<GameRunDto> result = await fixture.Service.RestartAsync(
            fixture.Run!.IdGameRun, fixture.UserId, new GameRunRestartRequestDto
            {
                RevisaoEsperada = 0,
                ChaveIdempotencia = Guid.NewGuid(),
            }, CancellationToken.None);

        Assert.Equal("MAPA_DESATUALIZADO", result.Codigo);
        Assert.Equal(GameRunStatus.Ativa, fixture.Run!.Status);
        fixture.Repository.Verify(item => item.AddRunAsync(
            It.IsAny<GameRun>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RestartAsync_PermiteNovaTentativaAposDerrotaSemAlterarRunAntiga()
    {
        Fixture fixture = new();
        await fixture.Service.CreateAsync(fixture.UserId, new GameRunCreateRequestDto
        {
            IdPersonagemJogador = fixture.Character.IdpersonagemJogador,
            ChaveIdempotencia = Guid.NewGuid(),
        }, CancellationToken.None);
        GameRun original = fixture.Run!;
        original.Status = GameRunStatus.Derrota;
        original.Revisao = 4;

        GameRunOperationResult<GameRunDto> stale = await fixture.Service.RestartAsync(
            original.IdGameRun, fixture.UserId, new GameRunRestartRequestDto
            {
                RevisaoEsperada = 3,
                ChaveIdempotencia = Guid.NewGuid(),
            }, CancellationToken.None);
        GameRunOperationResult<GameRunDto> restarted = await fixture.Service.RestartAsync(
            original.IdGameRun, fixture.UserId, new GameRunRestartRequestDto
            {
                RevisaoEsperada = 4,
                ChaveIdempotencia = Guid.NewGuid(),
            }, CancellationToken.None);

        Assert.Equal("REVISAO_DESATUALIZADA", stale.Codigo);
        Assert.True(restarted.Sucesso, restarted.Mensagem);
        Assert.Equal("Ativa", restarted.Dados!.Status);
        Assert.Equal(GameRunStatus.Derrota, original.Status);
        Assert.Equal(4, original.Revisao);
    }

    [Fact]
    public void SnapshotFactory_PreservaCamposMecanicosERejeitaStatusInvalido()
    {
        GameRunSnapshotFactory factory = new();
        PersonagemJogador character = new()
        {
            IdpersonagemJogador = 8,
            Nome = "Ada",
            Idraca = 3,
            StatusJson = """{"atributos":{"principais":{"forca":4}},"status":{"vida":100}}""",
            InventarioJson = """[{"id":"arma-1"}]""",
            Skills = """[{"nome":"Furia"}]""",
            Magia = """[]""",
        };
        SistemaRuntimeContextoDto system = new()
        {
            IdSistemaVersao = 42,
            CodigoSistema = "ODISSEIA",
            NumeroVersao = "1.0",
        };

        GameRunCharacterSnapshotDto snapshot = factory.Create(
            character, system, Array.Empty<Proficiencia>());
        Assert.Equal(4, snapshot.Status.GetProperty("atributos")
            .GetProperty("principais").GetProperty("forca").GetInt32());
        Assert.Equal("arma-1", snapshot.Inventario!.Value[0].GetProperty("id").GetString());
        Assert.Equal(42, snapshot.IdSistemaVersao);

        character.StatusJson = "[]";
        Assert.Throws<System.Text.Json.JsonException>(() =>
            factory.Create(character, system, Array.Empty<Proficiencia>()));
    }

    private sealed class Fixture
    {
        public int UserId { get; } = 15;
        public bool CharacterAvailable { get; set; } = true;
        public PersonagemJogador Character { get; } = new()
        {
            IdpersonagemJogador = 8,
            Idusuario = 15,
            Idmesa = 5,
            Nome = "Ada",
            Idraca = 3,
            StatusJson = """{"status":{"vida":100,"mana":20,"estamina":30},"nivel":1}""",
            InventarioJson = "[]",
            Skills = "[]",
            Magia = "[]",
        };
        public GameRun? Run { get; private set; }
        public Mock<IGameRunRepository> Repository { get; } = new();
        public GameModeVersion Mode { get; }
        public Mock<IPersonagemJogadorRepository> CharacterRepository { get; } = new();
        public Mock<ISistemaRpgResolver> SystemResolver { get; } = new();
        public GameRunService Service { get; }

        private GameRunCommand? _lastCommand;
        private long _nextRunId = 123;

        public Fixture(GameRunItemValueResolver? itemValues = null)
        {
            Mode = new GameModeVersion
            {
                IdGameModeVersion = 7,
                IdSistemaVersao = 42,
                Codigo = "ROGUELIKE_MVP",
                NumeroVersao = "0.4.1",
                ConfiguracaoJson = """
                    {"map":{"schemaVersion":5},
                     "base":{"restType":"SIMPLES"},
                     "areas":[{"code":"F1","name":"Area","baseName":"Base","finalOption":"BASE",
                               "options":[{"type":"COMBATE","encounterCode":"CACADOR","weight":1},
                                          {"type":"COMBATE","encounterCode":"GUARDIAO","weight":1}]}],
                     "encounters":{"CACADOR":{"mapName":"Caçador"},
                                   "GUARDIAO":{"mapName":"Guardião"}}}
                    """,
            };
            Repository.Setup(item => item.ExecuteWithUserLockAsync(
                    It.IsAny<int>(),
                    It.IsAny<Func<Task<GameRunOperationResult<GameRunDto>>>>(),
                    It.IsAny<CancellationToken>()))
                .Returns((int _, Func<Task<GameRunOperationResult<GameRunDto>>> action,
                    CancellationToken _) => action());
            Repository.Setup(item => item.GetCommandAsync(
                    It.IsAny<int>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
                .Returns((int _, Guid key, CancellationToken _) => Task.FromResult(
                    _lastCommand?.ChaveIdempotencia == key.ToString("D") ? _lastCommand : null));
            Repository.Setup(item => item.GetActiveAsync(
                    It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .Returns((int _, CancellationToken _) => Task.FromResult(
                    Run?.Status == GameRunStatus.Ativa ? Run : null));
            Repository.Setup(item => item.GetByIdAsync(
                    It.IsAny<long>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .Returns((long id, int _, CancellationToken _) => Task.FromResult(
                    Run?.IdGameRun == id ? Run : null));
            Repository.Setup(item => item.GetOwnedCharacterAsync(
                    It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .Returns((int user, int id, CancellationToken _) => Task.FromResult(
                    CharacterAvailable && user == Character.Idusuario &&
                    id == Character.IdpersonagemJogador ? Character : null));
            Repository.Setup(item => item.GetOrCreateModeVersionAsync(
                    It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(Mode);
            Repository.Setup(item => item.GetPublishedModesAsync(
                    It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => new[] { Mode });
            Repository.Setup(item => item.AddRunAsync(
                    It.IsAny<GameRun>(), It.IsAny<CancellationToken>()))
                .Returns((GameRun run, CancellationToken _) =>
                {
                    run.IdGameRun = _nextRunId++;
                    Run = run;
                    return Task.CompletedTask;
                });
            Repository.Setup(item => item.AddCommandAsync(
                    It.IsAny<GameRunCommand>(), It.IsAny<CancellationToken>()))
                .Returns((GameRunCommand command, CancellationToken _) =>
                {
                    _lastCommand = command;
                    return Task.CompletedTask;
                });
            Repository.Setup(item => item.SaveChangesAsync(It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            CharacterRepository.Setup(item => item.GetProficienciasByPersonagemIdsAsync(
                    It.IsAny<IEnumerable<int>>()))
                .ReturnsAsync(new Dictionary<int, List<Proficiencia>>());
            SystemResolver.Setup(item => item.ResolverContextoAsync(
                    It.IsAny<SistemaRuntimeConsultaDto>()))
                .ReturnsAsync(new SistemaRuntimeContextoDto
                {
                    IdSistemaRpg = 1,
                    IdSistemaVersao = 42,
                    StatusVersao = SistemaVersaoStatus.Publicado,
                    CodigoSistema = "ODISSEIA",
                    NumeroVersao = "1.0",
                });

            Service = new GameRunService(
                Repository.Object, CharacterRepository.Object,
                SystemResolver.Object, new GameRunSnapshotFactory(), itemValues: itemValues);
        }
    }
}
