using Microsoft.EntityFrameworkCore;
using MySqlConnector;
using OdisseiaWiki.Data;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services;
using OdisseiaWiki.Services.Interfaces;
using OdisseiaWiki.Dtos;
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
public sealed class GameplayMariaDbIntegrationTests
{
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

    private static PersonagemRuntimeWriteAudit Audit(int idUser, Guid key, string fingerprint) => new(
        idUser,
        key,
        fingerprint,
        "FICHA_RECURSOS_ATUALIZAR",
        """{"schemaVersion":1,"titulo":"Teste","campos":["recursos"]}""");

    private static GameplayEngineService CreateGameplayService(OdisseiaContext context) => new(
        new GameplayEngineRepository(context),
        new GameplayRollEvaluator(new FixedDiceRoller()),
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

        public static async Task<TestDatabase> CreateAsync()
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
            await context.Database.MigrateAsync();
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
