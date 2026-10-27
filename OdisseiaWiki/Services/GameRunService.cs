using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.GameRuns;
using OdisseiaWiki.GameRuns.Battle;
using OdisseiaWiki.GameRuns.Map;
using OdisseiaWiki.GameRuns.Inventory;
using OdisseiaWiki.Services.Helpers;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Services;

public sealed class GameRunService : IGameRunService
{
    private static readonly JsonSerializerOptions SnapshotJsonOptions = CreateJsonOptions();

    private readonly IGameRunRepository _repository;
    private readonly IPersonagemJogadorRepository _personagemRepository;
    private readonly ISistemaRpgResolver _sistemaResolver;
    private readonly IGameRunSnapshotFactory _snapshotFactory;
    private readonly ISistemaRpgRepository? _systemRepository;
    private readonly GameRunItemValueResolver? _itemValues;

    public GameRunService(
        IGameRunRepository repository,
        IPersonagemJogadorRepository personagemRepository,
        ISistemaRpgResolver sistemaResolver,
        IGameRunSnapshotFactory snapshotFactory,
        ISistemaRpgRepository? systemRepository = null,
        GameRunItemValueResolver? itemValues = null)
    {
        _repository = repository;
        _personagemRepository = personagemRepository;
        _sistemaResolver = sistemaResolver;
        _snapshotFactory = snapshotFactory;
        _systemRepository = systemRepository;
        _itemValues = itemValues;
    }

    public async Task<IReadOnlyList<GameRunCharacterOptionDto>> GetCharactersAsync(
        int idUsuario, CancellationToken cancellationToken)
    {
        IReadOnlyList<PersonagemJogador> characters = await _repository.GetCharactersAsync(
            idUsuario, cancellationToken);
        int[] versionIds = characters.Where(item => item.IdSistemaVersao.HasValue)
            .Select(item => item.IdSistemaVersao!.Value).Distinct().ToArray();
        IReadOnlyList<GameModeVersion> modes = await _repository.GetPublishedModesAsync(
            versionIds, cancellationToken);
        var versions = new Dictionary<int, SistemaVersao>();
        if (_systemRepository is not null)
            foreach (int versionId in versionIds)
            {
                SistemaVersao? version = await _systemRepository.GetVersionAsync(
                    versionId, includeConfiguration: true);
                if (version is not null) versions[versionId] = version;
            }
        // A ficha acompanha a versão da própria Mesa, que pode não ser a publicação
        // global de ODISSEIA. Reutilize o mesmo resolver empregado ao atualizar a ficha.
        // A consulta por Mesa isolada nÃ£o cobre Mesas que seguem a publicaÃ§Ã£o padrÃ£o.
        // O contexto da ficha Ã© a fonte de verdade para atualizaÃ§Ã£o disponÃ­vel.
        var contexts = new Dictionary<int, SistemaRuntimeContextoDto>();
        foreach (PersonagemJogador character in characters)
            contexts[character.IdpersonagemJogador] = await _sistemaResolver.ResolverContextoAsync(
                new SistemaRuntimeConsultaDto { IdPersonagemJogador = character.IdpersonagemJogador });
        return characters.Select(item => new GameRunCharacterOptionDto
        {
            IdPersonagemJogador = item.IdpersonagemJogador,
            Nome = item.Nome,
            Imagem = item.Imagem,
            IdRaca = item.Idraca,
            IdMesa = item.Idmesa,
            IdSistemaVersao = item.IdSistemaVersao,
            IdSistemaVersaoAtual = contexts[item.IdpersonagemJogador].IdVersaoDisponivel ??
                contexts[item.IdpersonagemJogador].IdSistemaVersao,
            AtualizacaoDisponivel = contexts[item.IdpersonagemJogador].AtualizacaoDisponivel,
            NomeMesa = item.Mesa?.Nome,
            NomeSistema = contexts[item.IdpersonagemJogador].NomeSistema,
            NumeroVersaoSistema = item.IdSistemaVersao is int versionId &&
                versions.TryGetValue(versionId, out SistemaVersao? version) ? version.NumeroVersao : null,
            NumeroVersaoSistemaAtual = contexts[item.IdpersonagemJogador].NumeroVersaoDisponivel ??
                contexts[item.IdpersonagemJogador].NumeroVersao,
            NumeroVersaoModo = modes.FirstOrDefault(mode => mode.IdSistemaVersao == item.IdSistemaVersao &&
                (mode.IdMesa == item.Idmesa || mode.IdMesa == null))?.NumeroVersao,
            LootConfigurado = modes.Where(mode => mode.IdSistemaVersao == item.IdSistemaVersao &&
                (mode.IdMesa == item.Idmesa || mode.IdMesa == null)).Any(mode => HasLoot(mode.ConfiguracaoJson)),
            InfluenciasAtributosConfiguradas = item.IdSistemaVersao is int progressVersionId &&
                versions.TryGetValue(progressVersionId, out SistemaVersao? progressVersion) ?
                SistemaRpgConfiguration.LerRegras<SistemaRpgConfiguration.RegrasProgressao>(
                    progressVersion, SistemaModuloTipo.Progressao).InfluenciasAtributos.Count > 0 : null,
        }).ToArray();
    }

    private static bool HasLoot(string configurationJson)
    {
        try
        {
            using JsonDocument document = JsonDocument.Parse(configurationJson);
            return document.RootElement.TryGetProperty("encounters", out JsonElement encounters) &&
                encounters.ValueKind == JsonValueKind.Object &&
                encounters.EnumerateObject().Any(entry =>
                    entry.Value.ValueKind == JsonValueKind.Object &&
                    entry.Value.TryGetProperty("lootCount", out JsonElement count) &&
                    count.TryGetInt32(out int amount) && amount > 0);
        }
        catch (JsonException) { return false; }
    }

    public async Task<IReadOnlyList<GameAdventureDto>> GetCharacterGamesAsync(
        int idUsuario, int idPersonagemJogador, CancellationToken cancellationToken)
    {
        PersonagemJogador? character = await _repository.GetOwnedCharacterAsync(
            idUsuario, idPersonagemJogador, cancellationToken);
        if (character?.IdSistemaVersao is not int versionId) return [];
        IReadOnlyList<GameModeVersion> versions = await _repository.GetPublishedModesAsync(
            [versionId], cancellationToken);
        return versions.Where(mode => mode.IdMesa == null || mode.IdMesa == character.Idmesa)
            .GroupBy(mode => mode.Codigo).Select(group => group.First())
            .Select(mode => new GameAdventureDto(mode.Codigo, mode.IdMesa, mode.IdSistemaVersao,
                mode.Nome ?? "Odisseia", mode.Descricao, mode.Banner,
                mode.Status.ToString(), mode.NumeroVersao))
            .OrderBy(mode => mode.Nome).ToArray();
    }

    public async Task<GameRunDto?> GetActiveAsync(int idUsuario, CancellationToken cancellationToken)
    {
        GameRun? run = await _repository.GetActiveAsync(idUsuario, cancellationToken);
        return run is null ? null : Map(run, _itemValues is null ? null :
            await _itemValues.ResolveAsync(run.EstadoAtualJson, run.GameModeVersion, cancellationToken));
    }

    public async Task<GameRunDto?> GetByIdAsync(
        long idGameRun, int idUsuario, CancellationToken cancellationToken)
    {
        GameRun? run = await _repository.GetByIdAsync(idGameRun, idUsuario, cancellationToken);
        return run is null ? null : Map(run, _itemValues is null ? null :
            await _itemValues.ResolveAsync(run.EstadoAtualJson, run.GameModeVersion, cancellationToken));
    }

    public async Task<GameRunOperationResult<GameRunDto>> CreateAsync(
        int idUsuario, GameRunCreateRequestDto request, CancellationToken cancellationToken)
    {
        if (request.IdPersonagemJogador <= 0 || request.ChaveIdempotencia == Guid.Empty)
            return GameRunOperationResult<GameRunDto>.Fail(
                "REQUISICAO_INVALIDA", "Informe um personagem e uma chave de idempotência válidos.");

        string hash = HashPayload($"CRIAR|{request.IdPersonagemJogador}|{request.CodigoJogo}");
        try
        {
            return await _repository.ExecuteWithUserLockAsync(idUsuario, async () =>
            {
                GameRunCommand? previous = await _repository.GetCommandAsync(
                    idUsuario, request.ChaveIdempotencia, cancellationToken);
                if (previous is not null)
                    return Replay(previous, "CRIAR", hash);

                if (await _repository.GetActiveAsync(idUsuario, cancellationToken) is not null)
                    return GameRunOperationResult<GameRunDto>.Fail(
                        "RUN_ATIVA_EXISTENTE", "Abandone ou conclua sua run ativa antes de iniciar outra.");

                var prepared = await PrepareNewRunAsync(
                    idUsuario, request.IdPersonagemJogador, null, cancellationToken, request.CodigoJogo);
                if (prepared.Error is not null) return prepared.Error;
                return await PersistNewRunAsync(prepared.Run!, null, idUsuario,
                    request.ChaveIdempotencia, "CRIAR", hash, null, cancellationToken);
            }, cancellationToken);
        }
        catch (KeyNotFoundException)
        {
            return GameRunOperationResult<GameRunDto>.Fail(
                "USUARIO_NAO_ENCONTRADO", "Usuário não encontrado.");
        }
    }

    public async Task<GameRunOperationResult<GameRunDto>> AbandonAsync(
        long idGameRun, int idUsuario, GameRunAbandonRequestDto request, CancellationToken cancellationToken)
    {
        if (idGameRun <= 0 || request.ChaveIdempotencia == Guid.Empty ||
            request.RevisaoEsperada is null or < 0)
        {
            return GameRunOperationResult<GameRunDto>.Fail(
                "REQUISICAO_INVALIDA", "Informe a revisão e uma chave de idempotência válidas.");
        }

        string hash = HashPayload($"ABANDONAR|{idGameRun}|{request.RevisaoEsperada.Value}");
        try
        {
            return await _repository.ExecuteWithUserLockAsync(idUsuario, async () =>
            {
                GameRunCommand? previous = await _repository.GetCommandAsync(
                    idUsuario, request.ChaveIdempotencia, cancellationToken);
                if (previous is not null)
                    return Replay(previous, "ABANDONAR", hash);

                GameRun? run = await _repository.GetByIdAsync(idGameRun, idUsuario, cancellationToken);
                if (run is null)
                    return GameRunOperationResult<GameRunDto>.Fail(
                        "RUN_NAO_ENCONTRADA", "Run não encontrada.");
                if (run.Status != GameRunStatus.Ativa)
                    return GameRunOperationResult<GameRunDto>.Fail(
                        "RUN_ENCERRADA", "Esta run já foi encerrada.");
                if (run.Revisao != request.RevisaoEsperada.Value)
                    return GameRunOperationResult<GameRunDto>.Fail(
                        "REVISAO_DESATUALIZADA", "A run mudou. Recarregue antes de tentar novamente.");

                DateTime now = DateTime.UtcNow;
                run.Status = GameRunStatus.Abandonada;
                run.Revisao++;
                run.AtualizadaEmUtc = now;
                run.EncerradaEmUtc = now;
                await _repository.SaveChangesAsync(cancellationToken);

                GameRunDto response = Map(run);
                await _repository.AddCommandAsync(new GameRunCommand
                {
                    IdGameRun = run.IdGameRun,
                    IdUsuario = idUsuario,
                    ChaveIdempotencia = request.ChaveIdempotencia.ToString("D"),
                    HashPayload = hash,
                    Tipo = "ABANDONAR",
                    RevisaoEsperada = request.RevisaoEsperada,
                    RespostaJson = JsonSerializer.Serialize(response, SnapshotJsonOptions),
                    CriadoEmUtc = now,
                    ConcluidoEmUtc = now,
                }, cancellationToken);
                await _repository.SaveChangesAsync(cancellationToken);
                return GameRunOperationResult<GameRunDto>.Ok(response);
            }, cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return GameRunOperationResult<GameRunDto>.Fail(
                "REVISAO_DESATUALIZADA", "A run mudou. Recarregue antes de tentar novamente.");
        }
        catch (KeyNotFoundException)
        {
            return GameRunOperationResult<GameRunDto>.Fail(
                "USUARIO_NAO_ENCONTRADO", "Usuário não encontrado.");
        }
    }

    public async Task<GameRunOperationResult<GameRunDto>> RestartAsync(
        long idGameRun, int idUsuario, GameRunRestartRequestDto request, CancellationToken cancellationToken)
    {
        if (idGameRun <= 0 || request.ChaveIdempotencia == Guid.Empty ||
            request.RevisaoEsperada is null or < 0)
        {
            return GameRunOperationResult<GameRunDto>.Fail(
                "REQUISICAO_INVALIDA", "Informe a revisão e uma chave de idempotência válidas.");
        }

        string hash = HashPayload($"REINICIAR|{idGameRun}|{request.RevisaoEsperada.Value}");
        try
        {
            return await _repository.ExecuteWithUserLockAsync(idUsuario, async () =>
            {
                GameRunCommand? previous = await _repository.GetCommandAsync(
                    idUsuario, request.ChaveIdempotencia, cancellationToken);
                if (previous is not null)
                    return Replay(previous, "REINICIAR", hash);

                GameRun? current = await _repository.GetByIdAsync(idGameRun, idUsuario, cancellationToken);
                if (current is null)
                    return GameRunOperationResult<GameRunDto>.Fail(
                        "RUN_NAO_ENCONTRADA", "Run não encontrada.");
                if (current.Revisao != request.RevisaoEsperada.Value)
                    return GameRunOperationResult<GameRunDto>.Fail(
                        "REVISAO_DESATUALIZADA", "A run mudou. Recarregue antes de tentar novamente.");
                GameRun? active = await _repository.GetActiveAsync(idUsuario, cancellationToken);
                if (active is not null && active.IdGameRun != idGameRun)
                    return GameRunOperationResult<GameRunDto>.Fail(
                        "RUN_ATIVA_EXISTENTE", "Outra run está ativa. Abra essa jornada para reiniciá-la.");

                var prepared = await PrepareNewRunAsync(
                    idUsuario, current.IdPersonagemJogadorOrigem, current.Seed,
                    cancellationToken, current.GameModeVersion.Codigo);
                if (prepared.Error is not null) return prepared.Error;
                return await PersistNewRunAsync(prepared.Run!,
                    current.Status == GameRunStatus.Ativa ? current : null, idUsuario,
                    request.ChaveIdempotencia, "REINICIAR", hash,
                    request.RevisaoEsperada, cancellationToken);
            }, cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return GameRunOperationResult<GameRunDto>.Fail(
                "REVISAO_DESATUALIZADA", "A run mudou. Recarregue antes de tentar novamente.");
        }
        catch (KeyNotFoundException)
        {
            return GameRunOperationResult<GameRunDto>.Fail(
                "USUARIO_NAO_ENCONTRADO", "Usuário não encontrado.");
        }
    }

    private async Task<(GameRun? Run, GameRunOperationResult<GameRunDto>? Error)> PrepareNewRunAsync(
        int idUsuario, int idPersonagemJogador, long? previousSeed, CancellationToken cancellationToken,
        string? gameCode = null)
    {
        if (string.IsNullOrWhiteSpace(gameCode)) gameCode = null;
        PersonagemJogador? character = await _repository.GetOwnedCharacterAsync(
            idUsuario, idPersonagemJogador, cancellationToken);
        if (character is null)
            return (null, GameRunOperationResult<GameRunDto>.Fail(
                "PERSONAGEM_NAO_ENCONTRADO", "Personagem pessoal não encontrado."));

        SistemaRuntimeContextoDto system = await _sistemaResolver.ResolverContextoAsync(
            new SistemaRuntimeConsultaDto
            {
                IdPersonagemJogador = character.IdpersonagemJogador,
                IdRaca = character.Idraca,
            });
        if (system.IdSistemaVersao is not int idSistemaVersao ||
            system.StatusVersao is null or SistemaVersaoStatus.Rascunho)
        {
            return (null, GameRunOperationResult<GameRunDto>.Fail(
                "SISTEMA_INDISPONIVEL",
                "A ficha não possui uma versão publicada ou arquivada do Sistema disponível."));
        }

        Dictionary<int, List<Proficiencia>> proficiencies =
            await _personagemRepository.GetProficienciasByPersonagemIdsAsync(
                new[] { character.IdpersonagemJogador });
        GameRunCharacterSnapshotDto snapshot;
        try
        {
            snapshot = _snapshotFactory.Create(character, system,
                proficiencies.GetValueOrDefault(character.IdpersonagemJogador)
                    ?? new List<Proficiencia>());
        }
        catch (JsonException)
        {
            return (null, GameRunOperationResult<GameRunDto>.Fail(
                "FICHA_JSON_INVALIDO",
                "A ficha possui dados inválidos de status, inventário, skills ou magia."));
        }

        IReadOnlyList<GameModeVersion> published = await _repository.GetPublishedModesAsync(
            [idSistemaVersao], cancellationToken) ?? [];
        GameModeVersion[] available = published
            .Where(candidate => candidate.IdMesa == null || candidate.IdMesa == character.Idmesa)
            .GroupBy(candidate => candidate.Codigo).Select(group => group.First()).ToArray();
        if (available.Length == 0 && gameCode is null)
        {
            GameModeVersion? fallback = await _repository.GetOrCreateModeVersionAsync(
                idSistemaVersao, cancellationToken);
            if (fallback is not null) available = [fallback];
        }
        if (gameCode is null && available.Length > 1)
            return (null, GameRunOperationResult<GameRunDto>.Fail("JOGO_OBRIGATORIO",
                "Escolha qual jogo desta mesa deseja iniciar."));
        GameModeVersion? mode = gameCode is null ? available.FirstOrDefault() :
            available.FirstOrDefault(candidate => candidate.Codigo == gameCode);
        if (mode is null)
            return (null, GameRunOperationResult<GameRunDto>.Fail(
                "MODO_INDISPONIVEL",
                "Esta versão do Sistema ainda não tem um modo roguelike compatível."));

        int mapSchema;
        try
        {
            using JsonDocument configuration = JsonDocument.Parse(mode.ConfiguracaoJson);
            mapSchema = configuration.RootElement.GetProperty("map")
                .GetProperty("schemaVersion").GetInt32();
        }
        catch (Exception error) when (error is JsonException or KeyNotFoundException or InvalidOperationException or FormatException)
        {
            return (null, GameRunOperationResult<GameRunDto>.Fail(
                "MODO_INDISPONIVEL", "O modo publicado não possui um mapa válido."));
        }
        if (mapSchema != 5)
            return (null, GameRunOperationResult<GameRunDto>.Fail(
                "MAPA_DESATUALIZADO",
                "O modo publicado ainda usa o mapa antigo. Publique uma nova versão em Gerenciamento > Jogo para iniciar uma run com o tamanho de mapa configurado."));

        DateTime now = DateTime.UtcNow;
        string snapshotJson = GameRunAttributes.Prepare(JsonSerializer.Serialize(snapshot, SnapshotJsonOptions));
        try { GameRunOutfitCompatibility.Validate(snapshotJson, system.Itens); }
        catch (OutfitCompatibilityException error)
        {
            return (null, GameRunOperationResult<GameRunDto>.Fail("TRAJES_INCOMPATIVEIS", error.Message));
        }
        if (_systemRepository is not null)
        {
            SistemaVersao? pinnedSystem = await _systemRepository.GetVersionAsync(
                idSistemaVersao, includeConfiguration: true);
            if (pinnedSystem is not null)
                snapshotJson = GameRunCarry.Reconcile(snapshotJson, pinnedSystem);
        }
        snapshotJson = GameRunDefensiveEquipment.AddInitialBonuses(snapshotJson);
        using (JsonDocument publishedMode = JsonDocument.Parse(mode.ConfiguracaoJson))
        {
            int startingCurrency = publishedMode.RootElement.TryGetProperty("startingCurrency", out JsonElement configuredCurrency) &&
                configuredCurrency.TryGetInt32(out int value) ? Math.Clamp(value, 0, 1000000000) : 0;
            JsonObject runSnapshot = JsonNode.Parse(snapshotJson)!.AsObject();
            runSnapshot["economy"] = new JsonObject
            {
                ["balance"] = startingCurrency,
                ["stash"] = new JsonArray(),
            };
            snapshotJson = runSnapshot.ToJsonString(SnapshotJsonOptions);
        }
        if (_itemValues is not null)
            snapshotJson = await _itemValues.ResolveAsync(snapshotJson, mode, cancellationToken);
        int seed;
        do { seed = RandomNumberGenerator.GetInt32(1, int.MaxValue); }
        while (seed == previousSeed);
        GameRun run = new()
        {
            IdUsuario = idUsuario,
            IdPersonagemJogadorOrigem = character.IdpersonagemJogador,
            IdGameModeVersion = mode.IdGameModeVersion,
            GameModeVersion = mode,
            IdSistemaVersao = idSistemaVersao,
            Status = GameRunStatus.Ativa,
            Seed = seed,
            Fase = 1,
            Revisao = 0,
            SnapshotInicialJson = snapshotJson,
            EstadoAtualJson = snapshotJson,
            LoadoutJson = GameRunActionLoadout.Serialize([]),
            CriadaEmUtc = now,
            AtualizadaEmUtc = now,
        };
        try
        {
            run.MapaJson = JsonSerializer.Serialize(
                new GameRunMapGenerator().Create(run.Seed, mode.ConfiguracaoJson), SnapshotJsonOptions);
            var memory = await _repository.GetCharacterMemoryAsync(idUsuario, idPersonagemJogador, cancellationToken);
            var map = GameRunFirstMap.Read(run.MapaJson, SnapshotJsonOptions);
            GameRunNpcs.ApplyMemory(map, GameCharacterMilestones.Read(memory?.EstadoJson),
                mode.Codigo, snapshot.Sistema.IdSistemaRpg ?? 0);
            run.MapaJson = JsonSerializer.Serialize(map, SnapshotJsonOptions);
        }
        catch (Exception error) when (error is JsonException or InvalidOperationException or ArgumentException or KeyNotFoundException)
        {
            string message = error is KeyNotFoundException
                ? "O mapa publicado referencia uma configuração que não existe mais. O responsável pelo jogo precisa revisar as rotas e publicar a correção."
                : error.Message;
            return (null, GameRunOperationResult<GameRunDto>.Fail("MAPA_INDISPONIVEL", message));
        }
        return (run, null);
    }

    private async Task<GameRunOperationResult<GameRunDto>> PersistNewRunAsync(
        GameRun newRun, GameRun? previousRun, int idUsuario, Guid key,
        string commandType, string hash, long? expectedRevision, CancellationToken cancellationToken)
    {
        if (previousRun is not null)
        {
            previousRun.Status = GameRunStatus.Abandonada;
            previousRun.Revisao++;
            previousRun.AtualizadaEmUtc = newRun.CriadaEmUtc;
            previousRun.EncerradaEmUtc = newRun.CriadaEmUtc;
            await _repository.SaveChangesAsync(cancellationToken);
        }

        await _repository.AddRunAsync(newRun, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);
        GameRunDto response = Map(newRun);
        await _repository.AddCommandAsync(new GameRunCommand
        {
            IdGameRun = newRun.IdGameRun,
            IdUsuario = idUsuario,
            ChaveIdempotencia = key.ToString("D"),
            HashPayload = hash,
            Tipo = commandType,
            RevisaoEsperada = expectedRevision,
            RespostaJson = JsonSerializer.Serialize(response, SnapshotJsonOptions),
            CriadoEmUtc = newRun.CriadaEmUtc,
            ConcluidoEmUtc = newRun.CriadaEmUtc,
        }, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);
        return GameRunOperationResult<GameRunDto>.Ok(response);
    }

    private static GameRunOperationResult<GameRunDto> Replay(
        GameRunCommand command, string type, string hash)
    {
        if (command.Tipo != type || !string.Equals(command.HashPayload, hash, StringComparison.Ordinal))
            return GameRunOperationResult<GameRunDto>.Fail(
                "CHAVE_IDEMPOTENCIA_REUTILIZADA",
                "Esta chave de idempotência já foi usada em outro comando.");

        GameRunDto response = JsonSerializer.Deserialize<GameRunDto>(
            command.RespostaJson, SnapshotJsonOptions)
            ?? throw new JsonException("A resposta do comando da run está vazia.");
        return GameRunOperationResult<GameRunDto>.Ok(response, repetido: true);
    }

    internal static GameRunDto Map(GameRun run, string? currentSnapshot = null)
    {
        GameRunCharacterSnapshotDto initial = JsonSerializer.Deserialize<GameRunCharacterSnapshotDto>(
            run.SnapshotInicialJson, SnapshotJsonOptions)
            ?? throw new JsonException("O snapshot inicial da run está vazio.");
        GameRunCharacterSnapshotDto current = JsonSerializer.Deserialize<GameRunCharacterSnapshotDto>(
            currentSnapshot ?? run.EstadoAtualJson, SnapshotJsonOptions)
            ?? throw new JsonException("O estado da run está vazio.");

        using JsonDocument modeDocument = JsonDocument.Parse(run.GameModeVersion.ConfiguracaoJson);
        return new GameRunDto
        {
            IdGameRun = run.IdGameRun,
            IdPersonagemJogadorOrigem = run.IdPersonagemJogadorOrigem,
            IdGameModeVersion = run.IdGameModeVersion,
            NomeJogo = run.GameModeVersion.Nome ?? "Odisseia",
            NumeroVersaoModo = run.GameModeVersion.NumeroVersao,
            IdSistemaVersao = run.IdSistemaVersao,
            Status = run.Status.ToString(),
            Seed = run.Seed,
            Fase = run.Fase,
            NoAtualId = run.NoAtualId,
            Revisao = run.Revisao,
            CriadaEmUtc = run.CriadaEmUtc,
            AtualizadaEmUtc = run.AtualizadaEmUtc,
            EncerradaEmUtc = run.EncerradaEmUtc,
            ConfiguracaoModo = modeDocument.RootElement.Clone(),
            SnapshotInicial = initial,
            EstadoAtual = current,
            OrdemArmas = GameRunWeaponOrder.Read(run.LoadoutJson, current.Inventario),
            AcoesEquipadas = GameRunActionLoadout.Read(run.LoadoutJson),
            Mapa = GameRunFirstMap.Read(run.MapaJson, SnapshotJsonOptions),
        };
    }

    private static string HashPayload(string canonicalPayload) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(canonicalPayload)));

    private static JsonSerializerOptions CreateJsonOptions()
    {
        JsonSerializerOptions options = new(JsonSerializerDefaults.Web);
        options.Converters.Add(new JsonStringEnumConverter());
        return options;
    }
}
