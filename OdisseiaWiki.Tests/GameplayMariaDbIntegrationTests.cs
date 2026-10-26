using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using MySqlConnector;
using Moq;
using OdisseiaWiki.Data;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services;
using OdisseiaWiki.Services.Interfaces;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.GameRuns;
using OdisseiaWiki.GameRuns.Battle;
using Xunit;

namespace OdisseiaWiki.Tests;

/// <summary>
/// Integration coverage for MariaDB-only behavior. These tests deliberately
/// create and drop an isolated database and are opt-in so a normal local test
/// run can never point at the development database by accident.
///
/// Set RUN_GAMEPLAY_MARIADB_TESTS=1 and ODISSEIA_TEST_MYSQL_CONNECTION to an
/// administrative connection string for a disposable test server to execute.
/// </summary>
public sealed partial class GameplayMariaDbIntegrationTests
{
    [Fact]
    public async Task GameCharacterMemory_PersistsBetweenContextsIsOwnedAndCascadesOnCharacterDeletion()
    {
        if (!TestDatabase.Enabled) return;
        await using TestDatabase database = await TestDatabase.CreateAsync();
        Seed seed = await database.SeedAsync(includeCharacter: true);
        int characterId = seed.Character!.IdpersonagemJogador;
        await using (var context = database.CreateContext())
        {
            var state = new GameCharacterMilestones();
            state.Learn(1, "JOGO", "MAGA", new() { Enemy = new() { NpcId = 7, Name = "Maga", MaxVida = 100 }, DamageByResult = new() });
            await new GameRunRepository(context).AddCharacterMemoryAsync(new() {
                IdPersonagemJogador = characterId, EstadoJson = state.Serialize() }, default);
            await context.SaveChangesAsync();
        }
        await using (var context = database.CreateContext())
        {
            var repository = new GameRunRepository(context);
            var memory = await repository.GetCharacterMemoryAsync(seed.Player.Idusuario, characterId, default);
            Assert.NotNull(memory);
            Assert.Single(GameCharacterMilestones.Read(memory.EstadoJson).DefeatedEnemies);
            Assert.Null(await repository.GetCharacterMemoryAsync(seed.Owner.Idusuario, characterId, default));
            // Run history is intentionally not deleted with the source sheet; memory is.
            await new PersonagemJogadorRepository(context).DeleteAsync(characterId);
        }
        await using var verify = database.CreateContext();
        Assert.False(await verify.GameCharacterMemories.AnyAsync(item => item.IdPersonagemJogador == characterId));
    }

    [Fact]
    public async Task GameAdventure_MigrationScopesGamesAndPrefersMesaItemCopy()
    {
        if (!TestDatabase.Enabled) return;
        await using TestDatabase database = await TestDatabase.CreateAsync();
        Seed seed = await database.SeedAsync();
        await using OdisseiaContext context = database.CreateContext();
        var scope = new WikiEscopo
        {
            Tipo = WikiEscopoTipo.Mesa, Chave = $"MESA:{seed.Mesa.Idmesa}",
            IdMesa = seed.Mesa.Idmesa,
        };
        context.WikiEscopos.Add(scope);
        await context.SaveChangesAsync();
        context.Itens.AddRange(
            new Item { Iditem = "loot-global", Nome = "Original", Tipo = ItemTipo.Outro,
                IdWikiEscopo = WikiEscopo.IdOficial, Visivel = true },
            new Item { Iditem = "loot-mesa", Nome = "Copia", Tipo = ItemTipo.Outro,
                IdWikiEscopo = scope.IdWikiEscopo, IdOrigemGlobal = "loot-global", Visivel = true });
        context.GameModeVersions.AddRange(
            new GameModeVersion { Codigo = "GAME_GLOBAL", NumeroVersao = "0.4.0",
                IdSistemaVersao = seed.Mesa.IdSistemaVersao!.Value,
                Nome = "Global", ConfiguracaoJson = "{}", Status = GameModeVersionStatus.Publicado },
            new GameModeVersion { Codigo = "GAME_MESA", NumeroVersao = "0.4.0",
                IdMesa = seed.Mesa.Idmesa, IdUsuarioCriacao = seed.Owner.Idusuario,
                IdSistemaVersao = seed.Mesa.IdSistemaVersao!.Value,
                Nome = "Mesa", Banner = "/assets/banner.webp", ConfiguracaoJson = "{}",
                Status = GameModeVersionStatus.Publicado });
        await context.SaveChangesAsync();

        var repository = new GameModeManagementRepository(context);
        var management = new GameModeManagementService(repository, new GameRunRepository(context),
            Mock.Of<ISistemaRpgRepository>(), new GameplayActionResolver(), context);
        var loot = await repository.GetLootItemsAsync(seed.Mesa.Idmesa,
            seed.Mesa.IdSistemaVersao!.Value, CancellationToken.None);
        var modes = await new GameRunRepository(context).GetPublishedModesAsync(
            [seed.Mesa.IdSistemaVersao.Value], CancellationToken.None);

        Assert.Single(loot);
        Assert.Equal("loot-mesa", loot[0].Iditem);
        Assert.Contains(modes, mode => mode.IdMesa == seed.Mesa.Idmesa && mode.Nome == "Mesa");
        Assert.Contains(modes, mode => mode.IdMesa is null && mode.Nome == "Global");
        Assert.True(await management.CanManageAdventureAsync(seed.Mesa.Idmesa,
            seed.Owner.Idusuario, false, CancellationToken.None));
        Assert.False(await management.CanManageAdventureAsync(seed.Mesa.Idmesa,
            seed.Player.Idusuario, false, CancellationToken.None));
        Assert.Equal("GAME_MESA", Assert.Single(await management.ListAdventuresAsync(
            seed.Mesa.Idmesa, seed.Owner.Idusuario, false, CancellationToken.None)).Codigo);
    }

    [Fact]
    public async Task GameRun_FinalRouteServiceEndsOnceAndCannotBeUsedByAnotherOwner()
    {
        if (!TestDatabase.Enabled) return;
        await using TestDatabase database = await TestDatabase.CreateAsync();
        Seed seed = await database.SeedAsync(includeCharacter: true);
        string snapshot = JsonSerializer.Serialize(new
        {
            schemaVersion = 1, idSistemaVersao = seed.Mesa.IdSistemaVersao!.Value,
            nome = "Ada", status = new { status = new { vida = 30, vidaMaxima = 30,
                mana = 10, manaMaxima = 10, estamina = 10, estaminaMaxima = 10 } },
            inventario = Array.Empty<object>(), sistema = new { idSistemaVersao = seed.Mesa.IdSistemaVersao.Value },
        });
        string mapJson = JsonSerializer.Serialize(new GameRunMapDto
        {
            SchemaVersion = 5,
            Nodes =
            [
                new() { Id = "inicio", Type = "INICIO", State = "CONCLUIDO", Connections = ["fim"] },
                new() { Id = "fim", Type = "EVENTO", Name = "Final", Layer = 1,
                    State = "DISPONIVEL", Connections = [] },
            ],
        }, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        long runId;
        await using (OdisseiaContext context = database.CreateContext())
        {
            var mode = new GameModeVersion
            {
                Codigo = "ROGUELIKE_MVP", NumeroVersao = "test-final",
                IdSistemaVersao = seed.Mesa.IdSistemaVersao.Value,
                Status = GameModeVersionStatus.Publicado, ConfiguracaoJson = "{\"schemaVersion\":1}",
            };
            context.GameModeVersions.Add(mode);
            await context.SaveChangesAsync();
            var run = new GameRun
            {
                IdUsuario = seed.Player.Idusuario,
                IdPersonagemJogadorOrigem = seed.Character!.IdpersonagemJogador,
                IdSistemaVersao = seed.Mesa.IdSistemaVersao.Value,
                IdGameModeVersion = mode.IdGameModeVersion,
                Status = GameRunStatus.Ativa, SnapshotInicialJson = snapshot,
                EstadoAtualJson = snapshot, MapaJson = mapJson,
            };
            context.GameRuns.Add(run);
            await context.SaveChangesAsync();
            runId = run.IdGameRun;
        }

        async Task<GameRunOperationResult<GameRunBaseResolutionDto>> Finish(int userId, Guid key)
        {
            await using OdisseiaContext context = database.CreateContext();
            var service = new GameRunEncounterService(new GameRunRepository(context),
                new Mock<ISistemaRpgRepository>().Object,
                new GameBattlePreviewFactory(new GameplayActionResolver()),
                new Mock<IAutoBattleSimulator>().Object);
            return await service.EnterBaseAsync(runId, "fim", userId, new GameRunMutationRequestDto
            {
                RevisaoEsperada = 0, ChaveIdempotencia = key,
            }, CancellationToken.None);
        }

        Guid key = Guid.NewGuid();
        var results = await Task.WhenAll(
            Finish(seed.Player.Idusuario, key), Finish(seed.Player.Idusuario, key));
        Assert.Single(results, result => result.Sucesso && !result.Repetido);
        Assert.Single(results, result => result.Sucesso && result.Repetido);
        Assert.Equal("RUN_ENCERRADA", (await Finish(seed.Player.Idusuario, Guid.NewGuid())).Codigo);
        Assert.Equal("RUN_NAO_ENCONTRADA", (await Finish(seed.Owner.Idusuario, Guid.NewGuid())).Codigo);

        await using OdisseiaContext verify = database.CreateContext();
        GameRun saved = await verify.GameRuns.SingleAsync(item => item.IdGameRun == runId);
        Assert.Equal(GameRunStatus.Vitoria, saved.Status);
        Assert.Equal(1, saved.Revisao);
        Assert.Equal(1, await verify.GameRunCommands.CountAsync(item => item.IdGameRun == runId));
        using JsonDocument initial = JsonDocument.Parse(saved.SnapshotInicialJson);
        Assert.Equal(30, initial.RootElement.GetProperty("status")
            .GetProperty("status").GetProperty("vida").GetInt32());
        Assert.Empty(initial.RootElement.GetProperty("inventario").EnumerateArray());
    }

    [Fact]
    public async Task GameRun_LoadoutServiceIsAtomicIdempotentAndOwnerScoped()
    {
        if (!TestDatabase.Enabled) return;
        await using TestDatabase database = await TestDatabase.CreateAsync();
        Seed seed = await database.SeedAsync(includeCharacter: true);
        string snapshot = JsonSerializer.Serialize(new
        {
            schemaVersion = 1, idSistemaVersao = seed.Mesa.IdSistemaVersao!.Value,
            nome = "Ada", status = new { status = new
            {
                vida = 30, vidaMaxima = 30, mana = 10, manaMaxima = 10,
                estamina = 10, estaminaMaxima = 10,
            } },
            inventario = Array.Empty<object>(), implantes = Array.Empty<object>(),
            skills = Array.Empty<object>(), magia = Array.Empty<object>(),
            sistema = new { idSistemaVersao = seed.Mesa.IdSistemaVersao.Value },
        });
        const string modeConfig = """
            {"schemaVersion":1,"previewUseTotalForRanges":true,
             "previewEnemy":{"name":"Sentinela","maxVida":30,"defesa":0},
             "previewFallbackAction":{"name":"Ataque de treino","baseDamage":5},
             "previewDamageByResult":{"FALHA_CRITICA":0,"ERRO":0,"ACERTO":5,
                "ACERTO_PRECISO":8,"CRITICO":10},
             "previewPlayerDamageByResult":{"FALHA_CRITICA":{"multiplier":0,"bonus":0},
                "ERRO":{"multiplier":0,"bonus":0},"ACERTO":{"multiplier":1,"bonus":0},
                "ACERTO_PRECISO":{"multiplier":1,"bonus":0},"CRITICO":{"multiplier":2,"bonus":0}}}
            """;
        long runId;
        await using (OdisseiaContext context = database.CreateContext())
        {
            var mode = new GameModeVersion
            {
                Codigo = "ROGUELIKE_MVP", NumeroVersao = "test-loadout",
                IdSistemaVersao = seed.Mesa.IdSistemaVersao!.Value,
                Status = GameModeVersionStatus.Publicado, ConfiguracaoJson = modeConfig,
            };
            context.GameModeVersions.Add(mode);
            await context.SaveChangesAsync();
            var run = new GameRun
            {
                IdUsuario = seed.Player.Idusuario,
                IdPersonagemJogadorOrigem = seed.Character!.IdpersonagemJogador,
                IdSistemaVersao = seed.Mesa.IdSistemaVersao.Value,
                IdGameModeVersion = mode.IdGameModeVersion,
                Status = GameRunStatus.Ativa,
                SnapshotInicialJson = snapshot, EstadoAtualJson = snapshot,
                LoadoutJson = GameRunActionLoadout.Serialize([]),
            };
            context.GameRuns.Add(run);
            await context.SaveChangesAsync();
            runId = run.IdGameRun;
        }

        async Task<GameRunOperationResult<GameRunDto>> Save(int userId, Guid key, long revision)
        {
            await using OdisseiaContext context = database.CreateContext();
            var version = new SistemaVersao
            {
                IdSistemaVersao = seed.Mesa.IdSistemaVersao!.Value,
                ResultadosDado =
                [
                    Outcome("FALHA_CRITICA", 1, 1), Outcome("ERRO", 2, 10),
                    Outcome("ACERTO", 11, 17), Outcome("ACERTO_PRECISO", 18, 19),
                    Outcome("CRITICO", 20, 20),
                ],
            };
            var systems = new Mock<ISistemaRpgRepository>();
            systems.Setup(item => item.GetVersionAsync(version.IdSistemaVersao, true, false))
                .ReturnsAsync(version);
            var service = new GameRunEncounterService(new GameRunRepository(context), systems.Object,
                new GameBattlePreviewFactory(new GameplayActionResolver()),
                new Mock<IAutoBattleSimulator>().Object);
            return await service.UpdateLoadoutAsync(runId, userId, new GameRunLoadoutRequestDto
            {
                RevisaoEsperada = revision, ChaveIdempotencia = key, Acoes = [],
            }, CancellationToken.None);
        }

        static SistemaResultadoDado Outcome(string code, int min, int max) => new()
        {
            CodigoTeste = "ATAQUE_COMUM", NomeTeste = "Ataque comum", Dado = "D20",
            QuantidadeDados = 1, ResultadoMinimo = min, ResultadoMaximo = max,
            CodigoResultado = code, NomeResultado = code,
        };

        Guid replayKey = Guid.NewGuid();
        var repeated = await Task.WhenAll(
            Save(seed.Player.Idusuario, replayKey, 0), Save(seed.Player.Idusuario, replayKey, 0));
        Assert.Single(repeated, result => result.Sucesso && !result.Repetido);
        Assert.Single(repeated, result => result.Sucesso && result.Repetido);

        var competing = await Task.WhenAll(
            Save(seed.Player.Idusuario, Guid.NewGuid(), 1),
            Save(seed.Player.Idusuario, Guid.NewGuid(), 1));
        Assert.Single(competing, result => result.Sucesso);
        Assert.Single(competing, result => !result.Sucesso && result.Codigo == "REVISAO_DESATUALIZADA");
        Assert.Equal("RUN_NAO_ENCONTRADA",
            (await Save(seed.Owner.Idusuario, Guid.NewGuid(), 2)).Codigo);

        await using OdisseiaContext verify = database.CreateContext();
        GameRun saved = await verify.GameRuns.SingleAsync(item => item.IdGameRun == runId);
        Assert.Equal(2, saved.Revisao);
        Assert.Equal(2, await verify.GameRunCommands.CountAsync(item => item.IdGameRun == runId));
        using JsonDocument initial = JsonDocument.Parse(saved.SnapshotInicialJson);
        Assert.Equal(0, initial.RootElement.GetProperty("inventario").GetArrayLength());
    }

    [Fact]
    public async Task GameRun_MigrationsPreserveExistingCharacterAndMesa()
    {
        if (!TestDatabase.Enabled) return;
        await using TestDatabase database = await TestDatabase.CreateAsync(
            "20260929215219_AddWikiMesaScopesAndMesaNpcInstances");
        Seed seed = await database.SeedAsync(includeCharacter: true, activeSession: false);

        await using (OdisseiaContext context = database.CreateContext())
        {
            await context.Database.MigrateAsync();
        }

        await using OdisseiaContext verify = database.CreateContext();
        Assert.Equal(seed.Player.Idusuario,
            (await verify.PersonagemJogadores.SingleAsync(item =>
                item.IdpersonagemJogador == seed.Character!.IdpersonagemJogador)).Idusuario);
        Assert.Equal(seed.Mesa.Idmesa,
            (await verify.Mesas.SingleAsync(item => item.Idmesa == seed.Mesa.Idmesa)).Idmesa);
        Assert.Empty(await verify.GameRuns.ToListAsync());
        Assert.Empty(await verify.GameModeVersions.ToListAsync());
    }

    [Fact]
    public async Task GameRun_LootClaimIsAtomicIdempotentAndOwnerScoped()
    {
        if (!TestDatabase.Enabled) return;
        await using TestDatabase database = await TestDatabase.CreateAsync();
        Seed seed = await database.SeedAsync(includeCharacter: true);
        const string snapshot = "{\"inventario\":[],\"status\":{\"status\":{\"vida\":10,\"vidaMaxima\":10}}}";
        long runId;
        await using (OdisseiaContext context = database.CreateContext())
        {
            var mode = new GameModeVersion
            {
                Codigo = "ROGUELIKE_MVP", NumeroVersao = "test-loot",
                IdSistemaVersao = seed.Mesa.IdSistemaVersao!.Value,
                Status = GameModeVersionStatus.Publicado,
                ConfiguracaoJson = "{\"schemaVersion\":5}",
            };
            context.GameModeVersions.Add(mode);
            await context.SaveChangesAsync();
            var loot = new GameBattleEncounterConfig
            {
                LootCount = 1,
                Loot = [new GameLootEntry
                {
                    ItemId = "TEST_ITEM", Weight = 1,
                    Snapshot = new JsonObject { ["nome"] = "Espada de teste", ["tipo"] = "arma" },
                }],
            };
            context.GameRuns.Add(new GameRun
            {
                IdUsuario = seed.Player.Idusuario,
                IdPersonagemJogadorOrigem = seed.Character!.IdpersonagemJogador,
                IdSistemaVersao = seed.Mesa.IdSistemaVersao.Value,
                IdGameModeVersion = mode.IdGameModeVersion,
                Status = GameRunStatus.Vitoria,
                SnapshotInicialJson = snapshot,
                EstadoAtualJson = GameRunLoot.Prepare(snapshot, "final", loot, 6),
            });
            await context.SaveChangesAsync();
            runId = await context.GameRuns.Select(item => item.IdGameRun).SingleAsync();
        }

        async Task<GameRunOperationResult<GameRunDto>> Claim(int userId, Guid key)
        {
            await using OdisseiaContext context = database.CreateContext();
            SistemaVersao version = await context.SistemaVersoes.AsNoTracking()
                .SingleAsync(item => item.IdSistemaVersao == seed.Mesa.IdSistemaVersao);
            var systems = new Mock<ISistemaRpgRepository>();
            systems.Setup(item => item.GetVersionAsync(version.IdSistemaVersao, true, false))
                .ReturnsAsync(version);
            var service = new GameRunEncounterService(new GameRunRepository(context), systems.Object,
                new GameBattlePreviewFactory(new GameplayActionResolver()),
                new Mock<IAutoBattleSimulator>().Object);
            return await service.ClaimLootAsync(runId, userId, new GameRunMutationRequestDto
            {
                RevisaoEsperada = 0,
                ChaveIdempotencia = key,
            }, CancellationToken.None);
        }

        Guid commandKey = Guid.NewGuid();
        var results = await Task.WhenAll(
            Claim(seed.Player.Idusuario, commandKey), Claim(seed.Player.Idusuario, commandKey));
        Assert.Single(results, result => result.Sucesso && !result.Repetido);
        Assert.Single(results, result => result.Sucesso && result.Repetido);
        Assert.Equal("RUN_NAO_ENCONTRADA", (await Claim(seed.Owner.Idusuario, commandKey)).Codigo);

        await using OdisseiaContext verify = database.CreateContext();
        GameRun saved = await verify.GameRuns.SingleAsync(item => item.IdGameRun == runId);
        Assert.Equal(1, saved.Revisao);
        Assert.Equal(1, await verify.GameRunCommands.CountAsync(item => item.IdGameRun == runId));
        GameRunLootState delivered = Assert.IsType<GameRunLootState>(GameRunLoot.Read(saved.EstadoAtualJson));
        Assert.Single(delivered.Rewards);
        using JsonDocument state = JsonDocument.Parse(saved.EstadoAtualJson);
        Assert.Equal(1, state.RootElement.GetProperty("inventario").GetArrayLength());
        using JsonDocument initial = JsonDocument.Parse(saved.SnapshotInicialJson);
        Assert.Equal(0, initial.RootElement.GetProperty("inventario").GetArrayLength());
        Assert.Equal(10, initial.RootElement.GetProperty("status")
            .GetProperty("status").GetProperty("vida").GetInt32());
    }

    [Fact]
    public async Task GameRun_MigrationPersistsAtomicCommandsAndSerializesConcurrentMutations()
    {
        if (!TestDatabase.Enabled) return;
        await using TestDatabase database = await TestDatabase.CreateAsync();
        Seed seed = await database.SeedAsync(includeCharacter: true);
        long runId;
        await using (OdisseiaContext context = database.CreateContext())
        {
            var mode = new GameModeVersion
            {
                Codigo = "ROGUELIKE_MVP", NumeroVersao = "test-1",
                IdSistemaVersao = seed.Mesa.IdSistemaVersao
                    ?? throw new InvalidOperationException("Mesa de teste sem Sistema."),
                Status = GameModeVersionStatus.Publicado,
                ConfiguracaoJson = "{\"schemaVersion\":5}",
            };
            context.GameModeVersions.Add(mode);
            await context.SaveChangesAsync();
            var run = new GameRun
            {
                IdUsuario = seed.Player.Idusuario,
                IdPersonagemJogadorOrigem = seed.Character!.IdpersonagemJogador,
                IdSistemaVersao = seed.Mesa.IdSistemaVersao
                    ?? throw new InvalidOperationException("Mesa de teste sem Sistema."),
                IdGameModeVersion = mode.IdGameModeVersion,
                SnapshotInicialJson = "{}", EstadoAtualJson = "{}",
            };
            context.GameRuns.Add(run);
            await context.SaveChangesAsync();
            runId = run.IdGameRun;
        }

        async Task<(bool Applied, bool Repeated)> Mutate(Guid key, long expectedRevision)
        {
            await using OdisseiaContext context = database.CreateContext();
            var repository = new GameRunRepository(context);
            return await repository.ExecuteWithUserLockAsync(seed.Player.Idusuario, async () =>
            {
                if (await repository.GetCommandAsync(seed.Player.Idusuario, key, CancellationToken.None) is not null)
                    return (true, true);
                GameRun run = (await repository.GetByIdAsync(runId, seed.Player.Idusuario, CancellationToken.None))!;
                if (run.Revisao != expectedRevision) return (false, false);
                run.Revisao++;
                run.LoadoutJson = $"{{\"revision\":{run.Revisao}}}";
                await repository.AddCommandAsync(new GameRunCommand
                {
                    IdGameRun = runId,
                    IdUsuario = seed.Player.Idusuario,
                    ChaveIdempotencia = key.ToString("D"),
                    HashPayload = new string('a', 64),
                    Tipo = "TEST_LOADOUT",
                    RevisaoEsperada = expectedRevision,
                    RespostaJson = "{}",
                }, CancellationToken.None);
                await repository.SaveChangesAsync(CancellationToken.None);
                return (true, false);
            }, CancellationToken.None);
        }

        Guid replayKey = Guid.NewGuid();
        var sameKey = await Task.WhenAll(Mutate(replayKey, 0), Mutate(replayKey, 0));
        Assert.Single(sameKey, result => result.Applied && !result.Repeated);
        Assert.Single(sameKey, result => result.Applied && result.Repeated);

        var differentKeys = await Task.WhenAll(Mutate(Guid.NewGuid(), 1), Mutate(Guid.NewGuid(), 1));
        Assert.Single(differentKeys, result => result.Applied);
        Assert.Single(differentKeys, result => !result.Applied);

        await using OdisseiaContext verify = database.CreateContext();
        var saved = await verify.GameRuns.SingleAsync(run => run.IdGameRun == runId);
        Assert.Equal(2, saved.Revisao);
        Assert.NotNull(saved.LoadoutJson);
        using (JsonDocument loadout = JsonDocument.Parse(saved.LoadoutJson))
        {
            Assert.Equal(2, loadout.RootElement.GetProperty("revision").GetInt64());
        }
        Assert.Equal(2, await verify.GameRunCommands.CountAsync(command => command.IdGameRun == runId));
        Assert.Null(await new GameRunRepository(verify).GetByIdAsync(
            runId, seed.Owner.Idusuario, CancellationToken.None));
    }

    [Fact]
    public async Task HistoryQuery_ReadsPrivateRowsSoTheServiceCanAdvanceItsCursor()
    {
        if (!TestDatabase.Enabled) return;
        await using TestDatabase database = await TestDatabase.CreateAsync();
        Seed seed = await database.SeedAsync();

        await using OdisseiaContext context = database.CreateContext();
        var repository = new GameplayEngineRepository(context);
        List<MesaEvento> events = await repository.GetEventsAfterSequenceAsync(
            seed.Session!.IdMesaSessao,
            0,
            100);

        Assert.Equal(new long[] { 1, 2, 3 }, events.Select(item => item.Sequencia));
        Assert.Contains(events, item => item.Visibilidade == GameplayEventVisibility.MestreEAutor);
    }

    [Fact]
    public async Task RuntimeWrite_RepeatKeyIsIdempotent_AndConcurrentRevisionCannotOverwrite()
    {
        if (!TestDatabase.Enabled) return;
        await using TestDatabase database = await TestDatabase.CreateAsync();
        Seed seed = await database.SeedAsync(includeCharacter: true);
        Guid replayKey = Guid.NewGuid();
        PersonagemRuntimeWriteAudit replayAudit = Audit(seed.Player.Idusuario, replayKey, "REPLAY");

        PersonagemJogador firstSnapshot;
        await using (OdisseiaContext read = database.CreateContext())
        {
            firstSnapshot = await read.PersonagemJogadores.AsNoTracking()
                .SingleAsync(item => item.IdpersonagemJogador == seed.Character!.IdpersonagemJogador);
        }
        firstSnapshot.StatusJson = """{"status":{"vida":9,"vidaMaxima":10}}""";

        await using (OdisseiaContext firstContext = database.CreateContext())
        {
            var firstRepository = new PersonagemJogadorRepository(firstContext);
            PersonagemJogador saved = await firstRepository.UpdateWithRuntimeAuditAsync(
                firstSnapshot,
                0,
                replayAudit);
            Assert.Equal(1, saved.RevisaoRuntime);
        }

        await using (OdisseiaContext replayContext = database.CreateContext())
        {
            var replayRepository = new PersonagemJogadorRepository(replayContext);
            PersonagemJogador replay = await replayRepository.UpdateWithRuntimeAuditAsync(
                firstSnapshot,
                0,
                replayAudit);
            Assert.Equal(1, replay.RevisaoRuntime);
        }

        PersonagemJogador staleSnapshot;
        await using (OdisseiaContext staleRead = database.CreateContext())
        {
            staleSnapshot = await staleRead.PersonagemJogadores.AsNoTracking()
                .SingleAsync(item => item.IdpersonagemJogador == seed.Character!.IdpersonagemJogador);
        }
        staleSnapshot.StatusJson = """{"status":{"vida":8,"vidaMaxima":10}}""";

        Task<bool> firstConcurrentWrite = TryRuntimeWriteAsync(
            database,
            staleSnapshot,
            1,
            Audit(seed.Player.Idusuario, Guid.NewGuid(), "WINNER"));
        Task<bool> secondConcurrentWrite = TryRuntimeWriteAsync(
            database,
            staleSnapshot,
            1,
            Audit(seed.Player.Idusuario, Guid.NewGuid(), "STALE"));

        bool[] concurrentWrites = await Task.WhenAll(firstConcurrentWrite, secondConcurrentWrite);
        Assert.Single(concurrentWrites, succeeded => succeeded);
        Assert.Single(concurrentWrites, succeeded => !succeeded);

        await using OdisseiaContext verification = database.CreateContext();
        PersonagemJogador current = await verification.PersonagemJogadores.SingleAsync(
            item => item.IdpersonagemJogador == seed.Character!.IdpersonagemJogador);
        Assert.Equal(2, current.RevisaoRuntime);
        Assert.Equal(2, await verification.MesaComandos.CountAsync());
        Assert.Equal(2, await verification.MesaEventos.CountAsync(item => item.Tipo == "FICHA_ATUALIZADA"));
    }

    private static async Task<bool> TryRuntimeWriteAsync(
        TestDatabase database,
        PersonagemJogador snapshot,
        long expectedRevision,
        PersonagemRuntimeWriteAudit audit)
    {
        await using OdisseiaContext context = database.CreateContext();
        var repository = new PersonagemJogadorRepository(context);
        try
        {
            await repository.UpdateWithRuntimeAuditAsync(snapshot, expectedRevision, audit);
            return true;
        }
        catch (DbUpdateConcurrencyException)
        {
            return false;
        }
    }

    [Fact]
    public async Task TwoAuthorizedUsersInOneTable_CanExecuteAndReadTheSameSessionLedger()
    {
        if (!TestDatabase.Enabled) return;
        await using TestDatabase database = await TestDatabase.CreateAsync();
        Seed seed = await database.SeedAsync();

        await using OdisseiaContext ownerContext = database.CreateContext();
        await using OdisseiaContext playerContext = database.CreateContext();
        var ownerRepository = new GameplayEngineRepository(ownerContext);
        var playerRepository = new GameplayEngineRepository(playerContext);

        Assert.True(await ownerRepository.CanAccessTableAsync(seed.Mesa.Idmesa, seed.Owner.Idusuario));
        Assert.True(await playerRepository.CanAccessTableAsync(seed.Mesa.Idmesa, seed.Player.Idusuario));

        GameplayEngineService playerService = CreateGameplayService(playerContext);
        GameplayOperationResult<GameplayCommandResponseDto> roll = await playerService.RollAsync(
            seed.Mesa.Idmesa,
            seed.Session!.IdMesaSessao,
            seed.Player.Idusuario,
            new GameplayRollRequestDto
            {
                ChaveIdempotencia = Guid.NewGuid(),
                CodigoAcao = "TESTE_GENERICO",
                Grupos = new List<GameplayDiceGroupRequestDto>
                {
                    new() { Quantidade = 1, Faces = 6 },
                },
                Modo = GameplayRollMode.Normal,
                Visibilidade = GameplayEventVisibility.PublicaMesa,
            });

        Assert.True(roll.Sucesso);
        Assert.Equal(seed.Session!.UltimaSequenciaEvento + 1, roll.Dados!.UltimaSequenciaEvento);
        GameplayEngineService ownerService = CreateGameplayService(ownerContext);
        GameplayOperationResult<GameplayEventPageDto> ownerHistory = await ownerService.GetEventsAsync(
            seed.Mesa.Idmesa,
            seed.Session.IdMesaSessao,
            seed.Owner.Idusuario,
            null,
            100);
        Assert.True(ownerHistory.Sucesso);
        Assert.Contains(ownerHistory.Dados!.Itens, item =>
            item.IdMesaEvento == roll.Dados!.Evento!.IdMesaEvento &&
            item.IdUsuarioAtor == seed.Player.Idusuario);
    }

    [Fact]
    public async Task SessionLifecycle_ConcurrentStartAndEndLeavesOneConsistentSession()
    {
        if (!TestDatabase.Enabled) return;
        await using TestDatabase database = await TestDatabase.CreateAsync();
        Seed seed = await database.SeedAsync(activeSession: false);

        await using OdisseiaContext startAContext = database.CreateContext();
        await using OdisseiaContext startBContext = database.CreateContext();
        GameplayEngineService startA = CreateGameplayService(startAContext);
        GameplayEngineService startB = CreateGameplayService(startBContext);

        Task<GameplayOperationResult<GameplayCommandResponseDto>> firstStart = startA.StartSessionAsync(
            seed.Mesa.Idmesa,
            seed.Owner.Idusuario,
            new GameplaySessionStartRequestDto { ChaveIdempotencia = Guid.NewGuid() });
        Task<GameplayOperationResult<GameplayCommandResponseDto>> secondStart = startB.StartSessionAsync(
            seed.Mesa.Idmesa,
            seed.Owner.Idusuario,
            new GameplaySessionStartRequestDto { ChaveIdempotencia = Guid.NewGuid() });
        GameplayOperationResult<GameplayCommandResponseDto>[] starts = await Task.WhenAll(firstStart, secondStart);

        Assert.All(starts, result => Assert.True(result.Sucesso));
        long sessionId = starts.Select(result => result.Dados!.IdMesaSessao).Distinct().Single();

        await using OdisseiaContext endAContext = database.CreateContext();
        await using OdisseiaContext endBContext = database.CreateContext();
        GameplayEngineService endA = CreateGameplayService(endAContext);
        GameplayEngineService endB = CreateGameplayService(endBContext);
        Task<GameplayOperationResult<GameplayCommandResponseDto>> firstEnd = endA.EndSessionAsync(
            seed.Mesa.Idmesa,
            sessionId,
            seed.Owner.Idusuario,
            new GameplaySessionEndRequestDto { ChaveIdempotencia = Guid.NewGuid() });
        Task<GameplayOperationResult<GameplayCommandResponseDto>> secondEnd = endB.EndSessionAsync(
            seed.Mesa.Idmesa,
            sessionId,
            seed.Owner.Idusuario,
            new GameplaySessionEndRequestDto { ChaveIdempotencia = Guid.NewGuid() });
        GameplayOperationResult<GameplayCommandResponseDto>[] ends = await Task.WhenAll(firstEnd, secondEnd);

        Assert.Single(ends, result => result.Sucesso);
        Assert.Single(ends, result => !result.Sucesso && result.Codigo == "SESSAO_NAO_ATIVA");

        await using OdisseiaContext verification = database.CreateContext();
        Mesa mesa = await verification.Mesas.SingleAsync(item => item.Idmesa == seed.Mesa.Idmesa);
        MesaSessao session = await verification.MesaSessoes.SingleAsync(item => item.IdMesaSessao == sessionId);
        Assert.False(mesa.AoVivo);
        Assert.Null(mesa.IdMesaSessaoAtiva);
        Assert.Equal(MesaSessaoStatus.Encerrada, session.Status);
        Assert.Equal(1, await verification.MesaSessoes.CountAsync(item => item.IdMesa == seed.Mesa.Idmesa));
    }

    [Fact]
    public async Task EffectApplication_IsAtomicAndCannotBeConsumedTwiceWithAnotherCommandKey()
    {
        if (!TestDatabase.Enabled) return;
        await using TestDatabase database = await TestDatabase.CreateAsync();
        Seed seed = await database.SeedAsync(includeCharacter: true);
        long sourceEventId;

        await using (OdisseiaContext setup = database.CreateContext())
        {
            MesaSessao session = await setup.MesaSessoes.SingleAsync(item =>
                item.IdMesaSessao == seed.Session!.IdMesaSessao);
            PersonagemJogador character = await setup.PersonagemJogadores.SingleAsync(item =>
                item.IdpersonagemJogador == seed.Character!.IdpersonagemJogador);
            character.StatusJson = """{"xp":2,"status":{"vida":10,"vidaMaxima":10}}""";
            session.UltimaSequenciaEvento = 4;
            var sourceEvent = new MesaEvento
            {
                IdMesaSessao = session.IdMesaSessao,
                Sequencia = 4,
                Tipo = "ROLAGEM_REALIZADA",
                Origem = GameplayEventOrigin.Automatica,
                Visibilidade = GameplayEventVisibility.PublicaMesa,
                IdUsuarioAtor = seed.Player.Idusuario,
                IdPersonagemJogador = character.IdpersonagemJogador,
                IdSistemaVersaoEfetiva = session.IdSistemaVersao,
                CodigoRegra = "XP_TESTE",
                DadosJson = """{"rolagem":{"expressao":"1D4","grupos":[],"modificadores":[],"subtotal":3,"total":3,"manual":false,"modo":"Normal","avisos":[],"efeitosPropostos":[{"codigo":"APLICAR_XP","tipo":"XP","nome":"Aplicar 3 XP","alvo":"AUTOR","codigoRecurso":"XP","operacao":"SOMAR","valor":3,"exigeAlvo":false,"podeAplicar":true}],"rolagensIndividuais":[]}}""",
                OcorreuEmUtc = DateTime.UtcNow,
            };
            setup.MesaEventos.Add(sourceEvent);
            await setup.SaveChangesAsync();
            sourceEventId = sourceEvent.IdMesaEvento;
        }

        await using (OdisseiaContext firstContext = database.CreateContext())
        {
            GameplayEngineService service = CreateGameplayService(firstContext);
            GameplayOperationResult<GameplayCommandResponseDto> applied = await service.ApplyEffectAsync(
                seed.Mesa.Idmesa,
                seed.Session!.IdMesaSessao,
                seed.Player.Idusuario,
                new GameplayEffectApplyRequestDto
                {
                    ChaveIdempotencia = Guid.NewGuid(),
                    IdEventoOrigem = sourceEventId,
                    CodigoEfeito = "APLICAR_XP",
                    RevisaoSessaoEsperada = 1,
                    RevisaoPersonagemEsperada = 0,
                });
            Assert.True(applied.Sucesso);
            Assert.Equal(3, applied.Dados!.Aplicacao!.ValorAplicado);
        }

        await using (OdisseiaContext duplicateContext = database.CreateContext())
        {
            GameplayEngineService service = CreateGameplayService(duplicateContext);
            GameplayOperationResult<GameplayCommandResponseDto> duplicate = await service.ApplyEffectAsync(
                seed.Mesa.Idmesa,
                seed.Session!.IdMesaSessao,
                seed.Player.Idusuario,
                new GameplayEffectApplyRequestDto
                {
                    ChaveIdempotencia = Guid.NewGuid(),
                    IdEventoOrigem = sourceEventId,
                    CodigoEfeito = "APLICAR_XP",
                    RevisaoSessaoEsperada = 2,
                    RevisaoPersonagemEsperada = 1,
                });
            Assert.False(duplicate.Sucesso);
            Assert.Equal("EFEITO_JA_APLICADO", duplicate.Codigo);
        }

        await using OdisseiaContext verification = database.CreateContext();
        PersonagemJogador savedCharacter = await verification.PersonagemJogadores.SingleAsync(item =>
            item.IdpersonagemJogador == seed.Character!.IdpersonagemJogador);
        using JsonDocument status = JsonDocument.Parse(savedCharacter.StatusJson);
        Assert.Equal(5, status.RootElement.GetProperty("xp").GetInt32());
        Assert.Equal(1, savedCharacter.RevisaoRuntime);
        Assert.Equal(1, await verification.MesaEventos.CountAsync(item =>
            item.IdMesaSessao == seed.Session!.IdMesaSessao && item.Tipo == "EFEITO_APLICADO"));
    }

    private static PersonagemRuntimeWriteAudit Audit(int idUser, Guid key, string fingerprint) => new(
        idUser,
        key,
        fingerprint,
        "FICHA_RECURSOS_ATUALIZAR",
        """{"schemaVersion":1,"titulo":"Teste","campos":["recursos"]}""");

    private static GameplayEngineService CreateGameplayService(OdisseiaContext context) => new(
        new GameplayEngineRepository(context),
        new GameplayRollEvaluator(new FixedDiceRoller()),
        new GameplayActionResolver(),
        new NumericCursorCodec(),
        new AllowAllRateLimiter(),
        new NullMesaRealtimeNotifier());

    private sealed class TestDatabase : IAsyncDisposable
    {
        private readonly string _adminConnection;
        private readonly string _databaseName;
        private readonly string _connection;

        private TestDatabase(string adminConnection, string databaseName)
        {
            _adminConnection = adminConnection;
            _databaseName = databaseName;
            var builder = new MySqlConnectionStringBuilder(adminConnection)
            {
                Database = databaseName,
            };
            _connection = builder.ConnectionString;
        }

        public static bool Enabled => string.Equals(
            Environment.GetEnvironmentVariable("RUN_GAMEPLAY_MARIADB_TESTS"),
            "1",
            StringComparison.Ordinal);

        public static async Task<TestDatabase> CreateAsync(string? targetMigration = null)
        {
            string? adminConnection = Environment.GetEnvironmentVariable("ODISSEIA_TEST_MYSQL_CONNECTION");
            if (string.IsNullOrWhiteSpace(adminConnection))
            {
                throw new InvalidOperationException(
                    "ODISSEIA_TEST_MYSQL_CONNECTION is required when RUN_GAMEPLAY_MARIADB_TESTS=1.");
            }

            string databaseName = $"odisseia_gameplay_test_{Guid.NewGuid():N}";
            var database = new TestDatabase(adminConnection, databaseName);
            await using var connection = new MySqlConnection(adminConnection);
            await connection.OpenAsync();
            await using MySqlCommand command = connection.CreateCommand();
            command.CommandText = $"CREATE DATABASE `{databaseName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;";
            await command.ExecuteNonQueryAsync();
            await using OdisseiaContext context = database.CreateContext();
            if (targetMigration is null)
                await context.Database.MigrateAsync();
            else
                await context.GetService<IMigrator>().MigrateAsync(targetMigration);
            return database;
        }

        public OdisseiaContext CreateContext()
        {
            var options = new DbContextOptionsBuilder<OdisseiaContext>()
                .UseMySql(_connection, ServerVersion.AutoDetect(_connection))
                .Options;
            return new OdisseiaContext(options);
        }

        public async Task<Seed> SeedAsync(bool includeCharacter = false, bool activeSession = true)
        {
            await using OdisseiaContext context = CreateContext();
            string ownerToken = Guid.NewGuid().ToString("N")[..20];
            string playerToken = Guid.NewGuid().ToString("N")[..20];
            var owner = new Usuario
            {
                Nome = "Mestre",
                Nickname = $"mestre_{ownerToken}",
                Email = $"m_{ownerToken}@e.test",
                Senha = "hash",
                DataRegistro = DateTime.UtcNow,
            };
            var player = new Usuario
            {
                Nome = "Jogador",
                Nickname = $"jogador_{playerToken}",
                Email = $"j_{playerToken}@e.test",
                Senha = "hash",
                DataRegistro = DateTime.UtcNow,
            };
            var system = new SistemaRpg { Codigo = "ODISSEIA", Nome = "Sistema de teste" };
            context.Usuarios.AddRange(owner, player);
            context.SistemasRpg.Add(system);
            await context.SaveChangesAsync();

            var version = new SistemaVersao
            {
                IdSistemaRpg = system.IdSistemaRpg,
                NumeroVersao = "1.0",
                Status = SistemaVersaoStatus.Publicado,
                DataPublicacao = DateTime.UtcNow,
            };
            context.SistemaVersoes.Add(version);
            await context.SaveChangesAsync();

            var mesa = new Mesa
            {
                Nome = "Mesa de integracao",
                IdusuarioCriacao = owner.Idusuario,
                IdSistemaVersao = version.IdSistemaVersao,
                LimiteJogadores = 4,
                AoVivo = activeSession,
                RevisaoRuntime = 1,
            };
            context.Mesas.Add(mesa);
            await context.SaveChangesAsync();
            context.Mesausuarios.Add(new Mesausuario
            {
                Idmesa = mesa.Idmesa,
                Idusuario = player.Idusuario,
            });

            MesaSessao? session = null;
            if (activeSession)
            {
                session = new MesaSessao
                {
                    IdMesa = mesa.Idmesa,
                    IdSistemaVersao = version.IdSistemaVersao,
                    IdUsuarioCriacao = owner.Idusuario,
                    Status = MesaSessaoStatus.Ativa,
                    RevisaoEstado = 1,
                    UltimaSequenciaEvento = 3,
                    ContextoAberturaJson = "{}",
                };
                context.MesaSessoes.Add(session);
                await context.SaveChangesAsync();
                mesa.IdMesaSessaoAtiva = session.IdMesaSessao;

                var events = new[]
                {
                    Event(session, 1, GameplayEventVisibility.MestreEAutor, player.Idusuario),
                    Event(session, 2, GameplayEventVisibility.SomenteMestre, owner.Idusuario),
                    Event(session, 3, GameplayEventVisibility.PublicaMesa, player.Idusuario),
                };
                context.MesaEventos.AddRange(events);
            }

            PersonagemJogador? character = null;
            if (includeCharacter)
            {
                var race = new Raca { Nome = "Raca de teste" };
                context.Racas.Add(race);
                await context.SaveChangesAsync();
                character = new PersonagemJogador
                {
                    Nome = "Personagem de teste",
                    Idraca = race.Idraca,
                    Idmesa = mesa.Idmesa,
                    Idusuario = player.Idusuario,
                    StatusJson = """{"status":{"vida":10,"vidaMaxima":10}}""",
                    RevisaoRuntime = 0,
                    DataCriacao = DateTime.UtcNow,
                };
                context.PersonagemJogadores.Add(character);
            }

            await context.SaveChangesAsync();
            return new Seed(owner, player, mesa, session, character);
        }

        public async ValueTask DisposeAsync()
        {
            await using var connection = new MySqlConnection(_adminConnection);
            await connection.OpenAsync();
            await using MySqlCommand command = connection.CreateCommand();
            command.CommandText = $"DROP DATABASE IF EXISTS `{_databaseName}`;";
            await command.ExecuteNonQueryAsync();
        }
    }

    private sealed record Seed(
        Usuario Owner,
        Usuario Player,
        Mesa Mesa,
        MesaSessao? Session,
        PersonagemJogador? Character);

    private static MesaEvento Event(
        MesaSessao session,
        long sequence,
        GameplayEventVisibility visibility,
        int actorId) => new()
    {
        IdMesaSessao = session.IdMesaSessao,
        Sequencia = sequence,
        Tipo = "TESTE",
        Origem = GameplayEventOrigin.Automatica,
        Visibilidade = visibility,
        IdUsuarioAtor = actorId,
        IdSistemaVersaoEfetiva = session.IdSistemaVersao,
        CodigoRegra = "TESTE",
        DadosJson = "{}",
        OcorreuEmUtc = DateTime.UtcNow,
    };

    private sealed class FixedDiceRoller : IDiceRoller
    {
        public IReadOnlyList<int> Roll(int quantity, int faces)
            => Enumerable.Repeat(1, quantity).ToArray();
    }

    private sealed class NumericCursorCodec : IGameplayCursorCodec
    {
        public string Encode(long sequence) => sequence.ToString(System.Globalization.CultureInfo.InvariantCulture);

        public bool TryDecode(string? cursor, out long sequence)
        {
            if (string.IsNullOrWhiteSpace(cursor))
            {
                sequence = 0;
                return true;
            }

            return long.TryParse(
                cursor,
                System.Globalization.NumberStyles.None,
                System.Globalization.CultureInfo.InvariantCulture,
                out sequence);
        }
    }

    private sealed class AllowAllRateLimiter : IGameplayCommandRateLimiter
    {
        public bool TryAcquire(
            int idMesa,
            int idUsuario,
            GameplayCommandRateCategory category,
            out int retryAfterSeconds)
        {
            retryAfterSeconds = 0;
            return true;
        }
    }
}
