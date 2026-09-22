using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Helpers;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Services;

public sealed class GameplayEngineService : IGameplayEngineService
{
    private const int MaxDiceGroups = 8;
    private const int MaxDicePerCommand = 100;
    private const int MaxManualAbsoluteValue = 1_000_000;

    private static readonly HashSet<string> ManualCategories = new(StringComparer.Ordinal)
    {
        "ITEM",
        "ARMA_FOGO",
        "ARMA_CORPO_A_CORPO",
        "DEFESA",
        "OUTRO",
    };

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    private readonly IGameplayEngineRepository _repository;
    private readonly GameplayRollEvaluator _rollEvaluator;
    private readonly IGameplayCursorCodec _cursorCodec;
    private readonly IGameplayCommandRateLimiter _rateLimiter;
    private readonly IMesaRealtimeNotifier _realtimeNotifier;

    static GameplayEngineService()
    {
        JsonOptions.Converters.Add(new JsonStringEnumConverter());
    }

    public GameplayEngineService(
        IGameplayEngineRepository repository,
        GameplayRollEvaluator rollEvaluator,
        IGameplayCursorCodec cursorCodec,
        IGameplayCommandRateLimiter rateLimiter,
        IMesaRealtimeNotifier realtimeNotifier)
    {
        _repository = repository;
        _rollEvaluator = rollEvaluator;
        _cursorCodec = cursorCodec;
        _rateLimiter = rateLimiter;
        _realtimeNotifier = realtimeNotifier;
    }

    public async Task<GameplayOperationResult<GameplaySessionDto?>> GetCurrentSessionAsync(
        int idMesa,
        int idUsuario,
        CancellationToken cancellationToken = default)
    {
        Mesa? mesa = await _repository.GetMesaAsync(idMesa, cancellationToken);
        if (mesa is null || mesa.PadraoSistema)
            return NotFound<GameplaySessionDto?>("MESA_NAO_ENCONTRADA", "Mesa não encontrada.");
        if (!await _repository.CanAccessTableAsync(idMesa, idUsuario, cancellationToken))
            return Forbidden<GameplaySessionDto?>("MESA_SEM_ACESSO", "Você não participa desta Mesa.");
        if (!mesa.IdMesaSessaoAtiva.HasValue)
            return GameplayOperationResult<GameplaySessionDto?>.Ok(null);

        MesaSessao? session = await _repository.GetSessionAsync(
            mesa.IdMesaSessaoAtiva.Value,
            cancellationToken);
        if (session is null || session.IdMesa != idMesa || session.Status != MesaSessaoStatus.Ativa)
        {
            return Conflict<GameplaySessionDto?>(
                "SESSAO_ATIVA_INCONSISTENTE",
                "O estado da sessão precisa ser recarregado.");
        }

        return GameplayOperationResult<GameplaySessionDto?>.Ok(MapSession(session));
    }

    public async Task<GameplayOperationResult<GameplayCommandResponseDto>> StartSessionAsync(
        int idMesa,
        int idUsuario,
        GameplaySessionStartRequestDto request,
        CancellationToken cancellationToken = default)
    {
        if (request.ChaveIdempotencia == Guid.Empty)
            return Validation<GameplayCommandResponseDto>("CHAVE_INVALIDA", "Informe uma chave de idempotência válida.");

        string hash = HashPayload(new { request.RevisaoMesaEsperada });
        GameplayOperationResult<GameplayCommandResponseDto> result;
        try
        {
            result = await _repository.ExecuteInTransactionAsync(async token =>
            {
                Mesa? mesa = await _repository.LockMesaAsync(idMesa, token);
                if (mesa is null || mesa.PadraoSistema)
                    return NotFound<GameplayCommandResponseDto>("MESA_NAO_ENCONTRADA", "Mesa não encontrada.");
                if (mesa.IdusuarioCriacao != idUsuario)
                    return Forbidden<GameplayCommandResponseDto>("SOMENTE_MESTRE", "Somente o mestre pode iniciar a sessão.");

                GameplayOperationResult<GameplayCommandResponseDto>? replay = await TryReplayAsync(
                    mesa.Idmesa, idUsuario, request.ChaveIdempotencia, hash, token);
                if (replay is not null)
                    return replay;

                if (request.RevisaoMesaEsperada.HasValue &&
                    request.RevisaoMesaEsperada.Value != mesa.RevisaoRuntime)
                {
                    return Conflict<GameplayCommandResponseDto>(
                        "REVISAO_MESA_DESATUALIZADA",
                        "A Mesa foi alterada. Recarregue antes de iniciar.");
                }

                if (!_rateLimiter.TryAcquire(idMesa, idUsuario, GameplayCommandRateCategory.Lifecycle, out int startRetryAfter))
                    return RateLimited<GameplayCommandResponseDto>(startRetryAfter);

                if (mesa.IdMesaSessaoAtiva.HasValue)
                {
                    MesaSessao? active = await _repository.LockSessionAsync(
                        mesa.IdMesaSessaoAtiva.Value,
                        token);
                    if (active is null || active.Status != MesaSessaoStatus.Ativa)
                    {
                        return Conflict<GameplayCommandResponseDto>(
                            "SESSAO_ATIVA_INCONSISTENTE",
                            "O estado da sessão precisa ser recarregado.");
                    }

                    return await PersistNoOpCommandAsync(
                        mesa,
                        active,
                        idUsuario,
                        request.ChaveIdempotencia,
                        hash,
                        "SESSAO_INICIAR",
                        request.RevisaoMesaEsperada,
                        token);
                }

                if (!mesa.IdSistemaVersao.HasValue)
                {
                    return RuleFailure<GameplayCommandResponseDto>(
                        "MESA_SEM_VERSAO",
                        "Selecione uma versão publicada do Sistema antes de iniciar.");
                }

                SistemaVersao? version = await _repository.GetSystemVersionAsync(
                    mesa.IdSistemaVersao.Value,
                    token);
                if (version is null || version.Status == SistemaVersaoStatus.Rascunho)
                {
                    return RuleFailure<GameplayCommandResponseDto>(
                        "VERSAO_NAO_EXECUTAVEL",
                        "A versão do Sistema não pode executar uma sessão.");
                }

                DateTime now = DateTime.UtcNow;
                MesaSessao session = new()
                {
                    IdMesa = mesa.Idmesa,
                    IdSistemaVersao = version.IdSistemaVersao,
                    IdUsuarioCriacao = idUsuario,
                    Status = MesaSessaoStatus.Ativa,
                    IniciadaEmUtc = now,
                    RevisaoEstado = 1,
                    UltimaSequenciaEvento = 0,
                    VersaoSchema = 1,
                    ContextoAberturaJson = Serialize(new
                    {
                        schemaVersion = 1,
                        origem = "Mesa",
                        version.IdSistemaRpg,
                        version.IdSistemaVersao,
                    }),
                };
                _repository.AddSession(session);
                await _repository.SaveChangesAsync(token);

                mesa.IdMesaSessaoAtiva = session.IdMesaSessao;
                mesa.AoVivo = true;
                mesa.RevisaoRuntime++;
                mesa.DataAtualizacao = now;

                MesaComando command = NewCommand(
                    mesa.Idmesa,
                    session.IdMesaSessao,
                    idUsuario,
                    null,
                    request.ChaveIdempotencia,
                    hash,
                    "SESSAO_INICIAR",
                    request.RevisaoMesaEsperada,
                    null,
                    now);
                _repository.AddCommand(command);
                await _repository.SaveChangesAsync(token);

                session.UltimaSequenciaEvento = 1;
                MesaEvento gameplayEvent = NewEvent(
                    session,
                    command,
                    "SESSAO_INICIADA",
                    GameplayEventOrigin.Automatica,
                    GameplayEventVisibility.PublicaMesa,
                    idUsuario,
                    null,
                    version,
                    null,
                    "SESSAO_INICIAR",
                    Serialize(new
                    {
                        schemaVersion = 1,
                        titulo = "Sessão iniciada",
                        descricao = "A Mesa está em jogo.",
                        manual = false,
                    }),
                    now);
                _repository.AddEvent(gameplayEvent);
                await _repository.SaveChangesAsync(token);

                GameplayCommandResponseDto response = BuildResponse(
                    command,
                    mesa,
                    session,
                    MapEvent(gameplayEvent, idUsuario, true),
                    null,
                    false);
                command.RespostaJson = Serialize(response);
                await _repository.SaveChangesAsync(token);
                return GameplayOperationResult<GameplayCommandResponseDto>.Ok(response);
            }, cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return Conflict<GameplayCommandResponseDto>(
                "CONCORRENCIA_SESSAO",
                "A sessão foi alterada por outra pessoa. Recarregue a Mesa.");
        }
        catch (DbUpdateException)
        {
            return Conflict<GameplayCommandResponseDto>(
                "CONFLITO_SESSAO",
                "A sessão já foi iniciada ou alterada.");
        }

        if (result.Sucesso && result.Dados is { Replay: false, Evento: not null })
            await _realtimeNotifier.NotificarMesaAlteradaAsync(idMesa, cancellationToken);
        return result;
    }

    public async Task<GameplayOperationResult<GameplayCommandResponseDto>> EndSessionAsync(
        int idMesa,
        long idMesaSessao,
        int idUsuario,
        GameplaySessionEndRequestDto request,
        CancellationToken cancellationToken = default)
    {
        if (request.ChaveIdempotencia == Guid.Empty)
            return Validation<GameplayCommandResponseDto>("CHAVE_INVALIDA", "Informe uma chave de idempotência válida.");
        string? reason = NormalizeOptionalText(request.Motivo);
        string hash = HashPayload(new
        {
            idMesaSessao,
            request.RevisaoMesaEsperada,
            request.RevisaoSessaoEsperada,
            motivo = reason,
        });

        GameplayOperationResult<GameplayCommandResponseDto> result;
        try
        {
            result = await _repository.ExecuteInTransactionAsync(async token =>
            {
                Mesa? mesa = await _repository.LockMesaAsync(idMesa, token);
                if (mesa is null || mesa.PadraoSistema)
                    return NotFound<GameplayCommandResponseDto>("MESA_NAO_ENCONTRADA", "Mesa não encontrada.");
                if (mesa.IdusuarioCriacao != idUsuario)
                    return Forbidden<GameplayCommandResponseDto>("SOMENTE_MESTRE", "Somente o mestre pode encerrar a sessão.");

                GameplayOperationResult<GameplayCommandResponseDto>? replay = await TryReplayAsync(
                    mesa.Idmesa, idUsuario, request.ChaveIdempotencia, hash, token);
                if (replay is not null)
                    return replay;

                if (request.RevisaoMesaEsperada.HasValue &&
                    request.RevisaoMesaEsperada.Value != mesa.RevisaoRuntime)
                {
                    return Conflict<GameplayCommandResponseDto>(
                        "REVISAO_MESA_DESATUALIZADA",
                        "A Mesa foi alterada. Recarregue antes de encerrar.");
                }
                if (mesa.IdMesaSessaoAtiva != idMesaSessao)
                {
                    return Conflict<GameplayCommandResponseDto>(
                        "SESSAO_NAO_ATIVA",
                        "Esta sessão não está mais ativa.");
                }

                MesaSessao? session = await _repository.LockSessionAsync(idMesaSessao, token);
                if (session is null || session.IdMesa != idMesa || session.Status != MesaSessaoStatus.Ativa)
                    return Conflict<GameplayCommandResponseDto>("SESSAO_NAO_ATIVA", "Esta sessão não está mais ativa.");
                if (request.RevisaoSessaoEsperada.HasValue &&
                    request.RevisaoSessaoEsperada.Value != session.RevisaoEstado)
                {
                    return Conflict<GameplayCommandResponseDto>(
                        "REVISAO_SESSAO_DESATUALIZADA",
                        "A sessão foi alterada. Recarregue antes de encerrar.");
                }

                SistemaVersao? version = await _repository.GetSystemVersionAsync(session.IdSistemaVersao, token);
                if (version is null)
                    return Conflict<GameplayCommandResponseDto>("VERSAO_NAO_ENCONTRADA", "A versão da sessão não está disponível.");

                if (!_rateLimiter.TryAcquire(idMesa, idUsuario, GameplayCommandRateCategory.Lifecycle, out int endRetryAfter))
                    return RateLimited<GameplayCommandResponseDto>(endRetryAfter);

                DateTime now = DateTime.UtcNow;
                MesaComando command = NewCommand(
                    mesa.Idmesa,
                    session.IdMesaSessao,
                    idUsuario,
                    null,
                    request.ChaveIdempotencia,
                    hash,
                    "SESSAO_ENCERRAR",
                    request.RevisaoMesaEsperada,
                    request.RevisaoSessaoEsperada,
                    now);
                _repository.AddCommand(command);
                await _repository.SaveChangesAsync(token);

                session.Status = MesaSessaoStatus.Encerrada;
                session.EncerradaEmUtc = now;
                session.IdUsuarioEncerramento = idUsuario;
                session.MotivoEncerramento = reason;
                session.RevisaoEstado++;
                session.UltimaSequenciaEvento++;
                mesa.IdMesaSessaoAtiva = null;
                mesa.AoVivo = false;
                mesa.RevisaoRuntime++;
                mesa.DataAtualizacao = now;

                MesaEvento gameplayEvent = NewEvent(
                    session,
                    command,
                    "SESSAO_ENCERRADA",
                    GameplayEventOrigin.Automatica,
                    GameplayEventVisibility.PublicaMesa,
                    idUsuario,
                    null,
                    version,
                    null,
                    "SESSAO_ENCERRAR",
                    Serialize(new
                    {
                        schemaVersion = 1,
                        titulo = "Sessão encerrada",
                        descricao = reason ?? "A Mesa foi encerrada.",
                        manual = false,
                    }),
                    now);
                _repository.AddEvent(gameplayEvent);
                await _repository.SaveChangesAsync(token);

                GameplayCommandResponseDto response = BuildResponse(
                    command,
                    mesa,
                    session,
                    MapEvent(gameplayEvent, idUsuario, true),
                    null,
                    false);
                command.RespostaJson = Serialize(response);
                await _repository.SaveChangesAsync(token);
                return GameplayOperationResult<GameplayCommandResponseDto>.Ok(response);
            }, cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return Conflict<GameplayCommandResponseDto>(
                "CONCORRENCIA_SESSAO",
                "A sessão foi alterada por outra pessoa. Recarregue a Mesa.");
        }
        catch (DbUpdateException)
        {
            return Conflict<GameplayCommandResponseDto>("CONFLITO_SESSAO", "A sessão já foi alterada.");
        }

        if (result.Sucesso && result.Dados is { Replay: false, Evento: not null })
            await _realtimeNotifier.NotificarMesaAlteradaAsync(idMesa, cancellationToken);
        return result;
    }

    public Task<GameplayOperationResult<GameplayCommandResponseDto>> RollAsync(
        int idMesa,
        long idMesaSessao,
        int idUsuario,
        GameplayRollRequestDto request,
        CancellationToken cancellationToken = default)
        => PersistRollAsync(idMesa, idMesaSessao, idUsuario, request, cancellationToken);

    public async Task<GameplayOperationResult<GameplayCommandResponseDto>> RegisterManualAsync(
        int idMesa,
        long idMesaSessao,
        int idUsuario,
        GameplayManualRecordRequestDto request,
        CancellationToken cancellationToken = default)
    {
        GameplayOperationResult<GameplayManualNormalized> validation = NormalizeManual(request);
        if (!validation.Sucesso || validation.Dados is null)
        {
            return GameplayOperationResult<GameplayCommandResponseDto>.Falha(
                validation.Erro,
                validation.Codigo,
                validation.Mensagem ?? "Registro manual inválido.");
        }
        GameplayManualNormalized normalized = validation.Dados;
        string hash = HashPayload(normalized);

        GameplayOperationResult<GameplayCommandResponseDto> result;
        try
        {
            result = await _repository.ExecuteInTransactionAsync(async token =>
            {
                GameplayOperationResult<GameplayCommandContext> contextResult =
                    await LoadCommandContextAsync(
                        idMesa,
                        idMesaSessao,
                        idUsuario,
                        request.IdPersonagemJogador,
                        request.ChaveIdempotencia,
                        hash,
                        token);
                if (!contextResult.Sucesso || contextResult.Dados is null)
                    return ConvertFailure<GameplayCommandContext, GameplayCommandResponseDto>(contextResult);
                GameplayCommandContext context = contextResult.Dados;
                if (context.Replay is not null)
                    return GameplayOperationResult<GameplayCommandResponseDto>.Ok(context.Replay);

                if (context.Character is null && !context.IsMaster)
                {
                    return Forbidden<GameplayCommandResponseDto>(
                        "PERSONAGEM_OBRIGATORIO",
                        "Selecione o seu personagem para registrar este resultado.");
                }

                if (!_rateLimiter.TryAcquire(idMesa, idUsuario, GameplayCommandRateCategory.Manual, out int manualRetryAfter))
                    return RateLimited<GameplayCommandResponseDto>(manualRetryAfter);

                DateTime now = DateTime.UtcNow;
                MesaComando command = NewCommand(
                    idMesa,
                    idMesaSessao,
                    idUsuario,
                    context.Character?.IdpersonagemJogador,
                    request.ChaveIdempotencia,
                    hash,
                    "REGISTRO_MANUAL",
                    null,
                    null,
                    now);
                _repository.AddCommand(command);
                await _repository.SaveChangesAsync(token);

                GameplayRollResultDto roll = BuildManualRoll(normalized);
                context.Session.UltimaSequenciaEvento++;
                string payload = Serialize(new
                {
                    schemaVersion = 1,
                    codigoAcao = "REGISTRO_MANUAL",
                    normalized.Categoria,
                    rotulo = normalized.Label,
                    titulo = normalized.Label,
                    descricao = normalized.Observation,
                    valorBruto = normalized.RawValue,
                    resultadoFinal = normalized.FinalValue,
                    resultadoSemantico = normalized.SemanticResult,
                    valorAssociado = normalized.AssociatedValue,
                    observacao = normalized.Observation,
                    manual = true,
                    rolagem = roll,
                });
                MesaEvento gameplayEvent = NewEvent(
                    context.Session,
                    command,
                    "REGISTRO_MANUAL_CRIADO",
                    GameplayEventOrigin.Manual,
                    request.Visibilidade,
                    idUsuario,
                    context.Character,
                    context.Version,
                    context.Character?.IdSistemaVersao,
                    "REGISTRO_MANUAL",
                    payload,
                    now);
                _repository.AddEvent(gameplayEvent);
                await _repository.SaveChangesAsync(token);

                MesaRolagem persistedRoll = MapPersistedRoll(gameplayEvent.IdMesaEvento, roll);
                _repository.AddRoll(persistedRoll);
                await _repository.SaveChangesAsync(token);
                gameplayEvent.Rolagem = persistedRoll;

                GameplayEventDto eventDto = MapEvent(gameplayEvent, idUsuario, context.IsMaster);
                GameplayCommandResponseDto response = BuildResponse(
                    command,
                    context.Mesa,
                    context.Session,
                    eventDto,
                    eventDto.Oculto ? null : roll,
                    false);
                command.RespostaJson = Serialize(response);
                await _repository.SaveChangesAsync(token);
                return GameplayOperationResult<GameplayCommandResponseDto>.Ok(response);
            }, cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return Conflict<GameplayCommandResponseDto>("CONCORRENCIA_SESSAO", "A sessão mudou. Recarregue e tente novamente.");
        }
        catch (DbUpdateException)
        {
            return Conflict<GameplayCommandResponseDto>("CONFLITO_COMANDO", "O comando já foi processado ou a sessão mudou.");
        }

        if (result.Sucesso && result.Dados is { Replay: false, Evento: not null })
            await _realtimeNotifier.NotificarMesaAlteradaAsync(idMesa, cancellationToken);
        return result;
    }

    public async Task<GameplayOperationResult<GameplayEventPageDto>> GetEventsAsync(
        int idMesa,
        long idMesaSessao,
        int idUsuario,
        string? cursor,
        int limit,
        CancellationToken cancellationToken = default)
    {
        if (limit is < 1 or > 100)
            return Validation<GameplayEventPageDto>("LIMITE_INVALIDO", "O limite deve estar entre 1 e 100.");
        if (!_cursorCodec.TryDecode(cursor, out long afterSequence))
            return Validation<GameplayEventPageDto>("CURSOR_INVALIDO", "O cursor do histórico é inválido.");

        Mesa? mesa = await _repository.GetMesaAsync(idMesa, cancellationToken);
        if (mesa is null || mesa.PadraoSistema)
            return NotFound<GameplayEventPageDto>("MESA_NAO_ENCONTRADA", "Mesa não encontrada.");
        if (!await _repository.CanAccessTableAsync(idMesa, idUsuario, cancellationToken))
            return Forbidden<GameplayEventPageDto>("MESA_SEM_ACESSO", "Você não participa desta Mesa.");
        MesaSessao? session = await _repository.GetSessionAsync(idMesaSessao, cancellationToken);
        if (session is null || session.IdMesa != idMesa)
            return NotFound<GameplayEventPageDto>("SESSAO_NAO_ENCONTRADA", "Sessão não encontrada.");

        bool isMaster = mesa.IdusuarioCriacao == idUsuario;
        List<MesaEvento> visible = await _repository.GetVisibleEventsAsync(
            idMesaSessao,
            idUsuario,
            isMaster,
            afterSequence,
            limit + 1,
            cancellationToken);
        bool hasMore = visible.Count > limit;
        List<MesaEvento> page = visible.Take(limit).ToList();
        long examinedUntil = page.Count == 0 ? afterSequence : page[^1].Sequencia;
        return GameplayOperationResult<GameplayEventPageDto>.Ok(new GameplayEventPageDto
        {
            Itens = page.Select(item => MapEvent(item, idUsuario, isMaster)).ToList(),
            // Mesmo sem próxima página, o cliente precisa do watermark para buscar
            // eventos novos sem reler indefinidamente a página anterior.
            ProximoCursor = _cursorCodec.Encode(examinedUntil),
            HaMais = hasMore,
            UltimaSequenciaEvento = session.UltimaSequenciaEvento,
            CursorExaminadoAte = examinedUntil,
        });
    }

    public async Task<GameplayOperationResult<GameplaySimulationResponseDto>> SimulateAsync(
        int idPersonagemJogador,
        int idUsuario,
        GameplayRollRequestDto request,
        CancellationToken cancellationToken = default)
    {
        PersonagemJogador? character = await _repository.GetCharacterAsync(idPersonagemJogador, cancellationToken);
        if (character is null)
            return NotFound<GameplaySimulationResponseDto>("PERSONAGEM_NAO_ENCONTRADO", "Personagem não encontrado.");
        if (character.Idusuario != idUsuario || request.IdPersonagemJogador != idPersonagemJogador)
            return Forbidden<GameplaySimulationResponseDto>("PERSONAGEM_SEM_CONTROLE", "Você não controla este personagem.");
        if (!await _repository.CanAccessTableAsync(character.Idmesa, idUsuario, cancellationToken))
            return Forbidden<GameplaySimulationResponseDto>("MESA_SEM_ACESSO", "Você não participa desta Mesa.");
        Mesa? mesa = await _repository.GetMesaAsync(character.Idmesa, cancellationToken);
        if (mesa?.IdMesaSessaoAtiva is not null)
        {
            return RuleFailure<GameplaySimulationResponseDto>(
                "SESSAO_ATIVA",
                "Use a rolagem oficial enquanto a Mesa estiver em jogo.");
        }
        if (!mesa?.IdSistemaVersao.HasValue ?? true)
            return RuleFailure<GameplaySimulationResponseDto>("MESA_SEM_VERSAO", "A Mesa não possui uma versão executável.");
        SistemaVersao? version = await _repository.GetSystemVersionAsync(mesa!.IdSistemaVersao!.Value, cancellationToken);
        if (version is null)
            return RuleFailure<GameplaySimulationResponseDto>("VERSAO_NAO_ENCONTRADA", "A versão da Mesa não está disponível.");

        GameplayOperationResult<GameplayRollResultDto> evaluation = EvaluateRoll(request, character, version);
        if (!evaluation.Sucesso || evaluation.Dados is null)
            return ConvertFailure<GameplayRollResultDto, GameplaySimulationResponseDto>(evaluation);
        return GameplayOperationResult<GameplaySimulationResponseDto>.Ok(new GameplaySimulationResponseDto
        {
            Rolagem = evaluation.Dados,
        });
    }

    public async Task<GameplayOperationResult<GameplaySessionDto?>> SetLegacyLiveStatusAsync(
        int idMesa,
        int idUsuario,
        bool aoVivo,
        CancellationToken cancellationToken = default)
    {
        GameplayOperationResult<GameplaySessionDto?> current = await GetCurrentSessionAsync(
            idMesa,
            idUsuario,
            cancellationToken);
        if (!current.Sucesso)
            return current;

        if (aoVivo)
        {
            if (current.Dados is not null)
                return current;
            GameplayOperationResult<GameplayCommandResponseDto> started = await StartSessionAsync(
                idMesa,
                idUsuario,
                new GameplaySessionStartRequestDto { ChaveIdempotencia = Guid.NewGuid() },
                cancellationToken);
            return started.Sucesso
                ? GameplayOperationResult<GameplaySessionDto?>.Ok(started.Dados?.Sessao)
                : ConvertFailure<GameplayCommandResponseDto, GameplaySessionDto?>(started);
        }

        if (current.Dados is null)
        {
            // Mesas antigas podem estar marcadas ao vivo sem uma sessão vinculada.
            // Desligar esse estado legado não deve exigir uma versão executável.
            GameplayOperationResult<bool> cleanup;
            try
            {
                cleanup = await _repository.ExecuteInTransactionAsync(async token =>
                {
                    Mesa? mesa = await _repository.LockMesaAsync(idMesa, token);
                    if (mesa is null || mesa.PadraoSistema)
                        return NotFound<bool>("MESA_NAO_ENCONTRADA", "Mesa não encontrada.");
                    if (mesa.IdusuarioCriacao != idUsuario)
                        return Forbidden<bool>("SOMENTE_MESTRE", "Somente o mestre pode encerrar a Mesa ao vivo.");
                    if (mesa.IdMesaSessaoAtiva.HasValue)
                        return Conflict<bool>("SESSAO_ALTERADA", "A sessão mudou. Recarregue a Mesa.");
                    if (!mesa.AoVivo)
                        return GameplayOperationResult<bool>.Ok(false);

                    mesa.AoVivo = false;
                    mesa.RevisaoRuntime++;
                    mesa.DataAtualizacao = DateTime.UtcNow;
                    await _repository.SaveChangesAsync(token);
                    return GameplayOperationResult<bool>.Ok(true);
                }, cancellationToken);
            }
            catch (DbUpdateConcurrencyException)
            {
                return Conflict<GameplaySessionDto?>("CONCORRENCIA_SESSAO", "A Mesa mudou. Recarregue e tente novamente.");
            }
            if (!cleanup.Sucesso)
                return ConvertFailure<bool, GameplaySessionDto?>(cleanup);
            if (cleanup.Dados)
                await _realtimeNotifier.NotificarMesaAlteradaAsync(idMesa, cancellationToken);
            return GameplayOperationResult<GameplaySessionDto?>.Ok(null);
        }
        GameplayOperationResult<GameplayCommandResponseDto> ended = await EndSessionAsync(
            idMesa,
            current.Dados.IdMesaSessao,
            idUsuario,
            new GameplaySessionEndRequestDto { ChaveIdempotencia = Guid.NewGuid() },
            cancellationToken);
        return ended.Sucesso
            ? GameplayOperationResult<GameplaySessionDto?>.Ok(null)
            : ConvertFailure<GameplayCommandResponseDto, GameplaySessionDto?>(ended);
    }

    private async Task<GameplayOperationResult<GameplayCommandResponseDto>> PersistRollAsync(
        int idMesa,
        long idMesaSessao,
        int idUsuario,
        GameplayRollRequestDto request,
        CancellationToken cancellationToken)
    {
        if (request.ChaveIdempotencia == Guid.Empty)
            return Validation<GameplayCommandResponseDto>("CHAVE_INVALIDA", "Informe uma chave de idempotência válida.");
        if (!Enum.IsDefined(request.Modo) || !Enum.IsDefined(request.Visibilidade))
            return Validation<GameplayCommandResponseDto>("OPCAO_INVALIDA", "A opção de rolagem é inválida.");
        if (request.Grupos is null)
            return Validation<GameplayCommandResponseDto>("DADOS_INVALIDOS", "Informe os dados da rolagem.");

        var normalizedHashPayload = new
        {
            codigoAcao = NormalizeCode(request.CodigoAcao),
            request.IdPersonagemJogador,
            codigoAtributo = NormalizeOptionalCode(request.CodigoAtributo),
            grupos = request.Grupos.Select(group => new { group.Quantidade, group.Faces }).ToArray(),
            request.Modo,
            request.Visibilidade,
        };
        string hash = HashPayload(normalizedHashPayload);
        GameplayOperationResult<GameplayCommandResponseDto> result;
        try
        {
            result = await _repository.ExecuteInTransactionAsync(async token =>
            {
                GameplayOperationResult<GameplayCommandContext> contextResult =
                    await LoadCommandContextAsync(
                        idMesa,
                        idMesaSessao,
                        idUsuario,
                        request.IdPersonagemJogador,
                        request.ChaveIdempotencia,
                        hash,
                        token);
                if (!contextResult.Sucesso || contextResult.Dados is null)
                    return ConvertFailure<GameplayCommandContext, GameplayCommandResponseDto>(contextResult);
                GameplayCommandContext context = contextResult.Dados;
                if (context.Replay is not null)
                    return GameplayOperationResult<GameplayCommandResponseDto>.Ok(context.Replay);

                if (!_rateLimiter.TryAcquire(idMesa, idUsuario, GameplayCommandRateCategory.Roll, out int rollRetryAfter))
                    return RateLimited<GameplayCommandResponseDto>(rollRetryAfter);

                GameplayOperationResult<GameplayRollResultDto> evaluation = EvaluateRoll(
                    request,
                    context.Character,
                    context.Version);
                if (!evaluation.Sucesso || evaluation.Dados is null)
                    return ConvertFailure<GameplayRollResultDto, GameplayCommandResponseDto>(evaluation);
                GameplayRollResultDto roll = evaluation.Dados;

                DateTime now = DateTime.UtcNow;
                string actionCode = NormalizeCode(request.CodigoAcao);
                MesaComando command = NewCommand(
                    idMesa,
                    idMesaSessao,
                    idUsuario,
                    context.Character?.IdpersonagemJogador,
                    request.ChaveIdempotencia,
                    hash,
                    "ROLAGEM_REALIZAR",
                    null,
                    null,
                    now);
                _repository.AddCommand(command);
                await _repository.SaveChangesAsync(token);

                context.Session.UltimaSequenciaEvento++;
                string title = BuildActionTitle(actionCode, request.CodigoAtributo);
                string description = BuildRollDescription(roll);
                string payload = Serialize(new
                {
                    schemaVersion = 1,
                    codigoAcao = actionCode,
                    codigoAtributo = NormalizeOptionalCode(request.CodigoAtributo),
                    titulo = title,
                    descricao = description,
                    resultadoSemantico = roll.NomeResultado,
                    roll.ValorAssociado,
                    manual = false,
                    rolagem = roll,
                });
                MesaEvento gameplayEvent = NewEvent(
                    context.Session,
                    command,
                    "ROLAGEM_REALIZADA",
                    GameplayEventOrigin.Automatica,
                    request.Visibilidade,
                    idUsuario,
                    context.Character,
                    context.Version,
                    context.Character?.IdSistemaVersao,
                    actionCode,
                    payload,
                    now);
                _repository.AddEvent(gameplayEvent);
                await _repository.SaveChangesAsync(token);

                MesaRolagem persistedRoll = MapPersistedRoll(gameplayEvent.IdMesaEvento, roll);
                _repository.AddRoll(persistedRoll);
                await _repository.SaveChangesAsync(token);
                gameplayEvent.Rolagem = persistedRoll;

                GameplayEventDto eventDto = MapEvent(gameplayEvent, idUsuario, context.IsMaster);
                GameplayCommandResponseDto response = BuildResponse(
                    command,
                    context.Mesa,
                    context.Session,
                    eventDto,
                    eventDto.Oculto ? null : roll,
                    false);
                command.RespostaJson = Serialize(response);
                await _repository.SaveChangesAsync(token);
                return GameplayOperationResult<GameplayCommandResponseDto>.Ok(response);
            }, cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return Conflict<GameplayCommandResponseDto>("CONCORRENCIA_SESSAO", "A sessão mudou. Recarregue e tente novamente.");
        }
        catch (DbUpdateException)
        {
            return Conflict<GameplayCommandResponseDto>("CONFLITO_COMANDO", "O comando já foi processado ou a sessão mudou.");
        }

        if (result.Sucesso && result.Dados is { Replay: false, Evento: not null })
            await _realtimeNotifier.NotificarMesaAlteradaAsync(idMesa, cancellationToken);
        return result;
    }

    private async Task<GameplayOperationResult<GameplayCommandContext>> LoadCommandContextAsync(
        int idMesa,
        long idMesaSessao,
        int idUsuario,
        int? idCharacter,
        Guid idempotencyKey,
        string hash,
        CancellationToken cancellationToken)
    {
        Mesa? mesa = await _repository.LockMesaAsync(idMesa, cancellationToken);
        if (mesa is null || mesa.PadraoSistema)
            return NotFound<GameplayCommandContext>("MESA_NAO_ENCONTRADA", "Mesa não encontrada.");
        if (!await _repository.CanAccessTableAsync(idMesa, idUsuario, cancellationToken))
            return Forbidden<GameplayCommandContext>("MESA_SEM_ACESSO", "Você não participa desta Mesa.");

        GameplayOperationResult<GameplayCommandResponseDto>? replay = await TryReplayAsync(
            idMesa,
            idUsuario,
            idempotencyKey,
            hash,
            cancellationToken);
        if (replay is not null)
        {
            return replay.Sucesso && replay.Dados is not null
                ? GameplayOperationResult<GameplayCommandContext>.Ok(new GameplayCommandContext(
                    mesa,
                    new MesaSessao(),
                    new SistemaVersao(),
                    null,
                    mesa.IdusuarioCriacao == idUsuario,
                    replay.Dados))
                : ConvertFailure<GameplayCommandResponseDto, GameplayCommandContext>(replay);
        }

        if (mesa.IdMesaSessaoAtiva != idMesaSessao)
            return Conflict<GameplayCommandContext>("SESSAO_NAO_ATIVA", "Esta sessão não está mais ativa.");
        MesaSessao? session = await _repository.LockSessionAsync(idMesaSessao, cancellationToken);
        if (session is null || session.IdMesa != idMesa || session.Status != MesaSessaoStatus.Ativa)
            return Conflict<GameplayCommandContext>("SESSAO_NAO_ATIVA", "Esta sessão não está mais ativa.");
        SistemaVersao? version = await _repository.GetSystemVersionAsync(session.IdSistemaVersao, cancellationToken);
        if (version is null)
            return Conflict<GameplayCommandContext>("VERSAO_NAO_ENCONTRADA", "A versão da sessão não está disponível.");

        PersonagemJogador? character = null;
        if (idCharacter.HasValue)
        {
            character = await _repository.GetCharacterAsync(idCharacter.Value, cancellationToken);
            if (character is null || character.Idmesa != idMesa)
                return NotFound<GameplayCommandContext>("PERSONAGEM_NAO_ENCONTRADO", "Personagem não encontrado nesta Mesa.");
            if (character.Idusuario != idUsuario)
                return Forbidden<GameplayCommandContext>("PERSONAGEM_SEM_CONTROLE", "Você não controla este personagem.");
        }

        return GameplayOperationResult<GameplayCommandContext>.Ok(new GameplayCommandContext(
            mesa,
            session,
            version,
            character,
            mesa.IdusuarioCriacao == idUsuario,
            null));
    }

    private GameplayOperationResult<GameplayRollResultDto> EvaluateRoll(
        GameplayRollRequestDto request,
        PersonagemJogador? character,
        SistemaVersao version)
    {
        if (!Enum.IsDefined(request.Modo) || !Enum.IsDefined(request.Visibilidade) || request.Grupos is null)
            return Validation<GameplayRollResultDto>("OPCAO_INVALIDA", "A opção de rolagem é inválida.");
        string action = NormalizeCode(request.CodigoAcao);
        bool isOdisseia = string.Equals(
            version.SistemaRpg?.Codigo,
            SistemaRpgConfiguration.CodigoPadrao,
            StringComparison.OrdinalIgnoreCase);

        if (action == "TESTE_GENERICO")
        {
            GameplayOperationResult<IReadOnlyList<GameplayDiceGroupSpec>> groupsResult =
                ValidateGenericGroups(request.Grupos, request.Modo);
            if (!groupsResult.Sucesso || groupsResult.Dados is null)
                return ConvertFailure<IReadOnlyList<GameplayDiceGroupSpec>, GameplayRollResultDto>(groupsResult);
            IReadOnlyList<GameplayDiceGroupSpec> groups = groupsResult.Dados;
            string expression = BuildExpression(groups, request.Modo);
            GameplayRollResultDto raw = _rollEvaluator.Evaluate(new GameplayRollPlan(
                expression,
                groups,
                request.Modo,
                0));
            if (isOdisseia && groups.Count == 1 && groups[0] == new GameplayDiceGroupSpec(1, 6))
            {
                return GameplayOperationResult<GameplayRollResultDto>.Ok(WithOutcome(
                    raw,
                    raw.Total >= 4 ? "SUCESSO" : "FALHA",
                    raw.Total >= 4 ? "Sucesso" : "Falha",
                    null));
            }
            return GameplayOperationResult<GameplayRollResultDto>.Ok(raw);
        }

        if (!isOdisseia)
        {
            return RuleFailure<GameplayRollResultDto>(
                "REGRA_NAO_ESTRUTURADA",
                "Esta ação ainda não possui regra executável neste Sistema.");
        }

        if (action is "ATRIBUTO_PRINCIPAL" or "ATRIBUTO_SECUNDARIO")
        {
            if (character is null)
                return Validation<GameplayRollResultDto>("PERSONAGEM_OBRIGATORIO", "Selecione um personagem para o teste.");
            string? attributeCode = NormalizeOptionalCode(request.CodigoAtributo);
            if (attributeCode is null || !TryGetAttributeValue(
                    character.StatusJson,
                    action == "ATRIBUTO_PRINCIPAL" ? "principais" : "secundarios",
                    attributeCode,
                    out int attributeValue))
            {
                return RuleFailure<GameplayRollResultDto>("ATRIBUTO_NAO_ENCONTRADO", "O atributo não foi encontrado na ficha.");
            }
            if (attributeValue < 1)
                return RuleFailure<GameplayRollResultDto>("ATRIBUTO_ZERO", "Este atributo precisa ter ao menos 1 para um teste voluntário.");
            if (attributeValue > 1_000)
                return RuleFailure<GameplayRollResultDto>("ATRIBUTO_FORA_LIMITE", "O valor do atributo não pode ser usado neste teste.");

            GameplayRollResultDto raw = _rollEvaluator.Evaluate(new GameplayRollPlan(
                request.Modo == GameplayRollMode.Normal
                    ? $"1D6 + {attributeCode}"
                    : $"2D6 manter {(request.Modo == GameplayRollMode.Vantagem ? "maior" : "menor")} + {attributeCode}",
                new[] { new GameplayDiceGroupSpec(1, 6) },
                request.Modo,
                attributeValue,
                new GameplayModifierDto
                {
                    Codigo = attributeCode,
                    Nome = attributeCode,
                    Valor = attributeValue,
                    Origem = "PERSONAGEM",
                }));
            return GameplayOperationResult<GameplayRollResultDto>.Ok(WithOutcome(
                raw,
                raw.Total > 6 ? "SUCESSO" : "FALHA",
                raw.Total > 6 ? "Sucesso" : "Falha",
                null));
        }

        return EvaluateExperienceRoll(action, version);
    }

    private GameplayOperationResult<GameplayRollResultDto> EvaluateExperienceRoll(
        string action,
        SistemaVersao version)
    {
        string? sourceCode = action switch
        {
            "XP_COMBATE" => "COMBATE_NORMAL",
            "XP_MINIBOSS" => "MINI_BOSS",
            "XP_BOSS" => "BOSS",
            "XP_SESSAO" => "SESSAO_SEM_COMBATE",
            "XP_MVP" => "MVP_SESSAO",
            "XP_MISSAO_SECUNDARIA" => "MISSAO_SECUNDARIA",
            "XP_CONTRATO" => "MISSAO_CONTRATO",
            "XP_MISSAO_PRINCIPAL" => "MISSAO_PRINCIPAL",
            _ => null,
        };
        if (sourceCode is null)
            return RuleFailure<GameplayRollResultDto>("ACAO_DESCONHECIDA", "A ação informada não está disponível.");

        SistemaFonteExperiencia? source = version.FontesExperiencia.FirstOrDefault(item =>
            NormalizeCode(item.Codigo) == sourceCode);
        bool expectsAdvantage = action is "XP_MINIBOSS" or "XP_CONTRATO" or "XP_MISSAO_PRINCIPAL";
        int expectedMaximum = action switch
        {
            "XP_COMBATE" => 1,
            "XP_MINIBOSS" or "XP_CONTRATO" or "XP_MISSAO_SECUNDARIA" => 2,
            "XP_MISSAO_PRINCIPAL" => 6,
            _ => 4,
        };
        if (source is null || source.UsaVantagem != expectsAdvantage ||
            source.ValorMinimo != 1 || source.ValorMaximo != expectedMaximum)
        {
            return RuleFailure<GameplayRollResultDto>(
                "FONTE_XP_NAO_EXECUTAVEL",
                "A fonte de XP desta versão não possui a regra esperada para esta rolagem.");
        }

        GameplayRollPlan? plan = action switch
        {
            "XP_COMBATE" => new GameplayRollPlan("+1 XP", Array.Empty<GameplayDiceGroupSpec>(), GameplayRollMode.Normal, 1),
            "XP_MINIBOSS" or "XP_CONTRATO" => new GameplayRollPlan(
                "2D4 manter maior",
                new[] { new GameplayDiceGroupSpec(1, 4) },
                GameplayRollMode.Vantagem,
                0),
            "XP_BOSS" or "XP_SESSAO" or "XP_MVP" or "XP_MISSAO_SECUNDARIA" =>
                new GameplayRollPlan("1D4", new[] { new GameplayDiceGroupSpec(1, 4) }, GameplayRollMode.Normal, 0),
            "XP_MISSAO_PRINCIPAL" => new GameplayRollPlan(
                "2D6 manter maior",
                new[] { new GameplayDiceGroupSpec(1, 6) },
                GameplayRollMode.Vantagem,
                0),
            _ => null,
        };
        if (plan is null)
            return RuleFailure<GameplayRollResultDto>("ACAO_DESCONHECIDA", "A ação informada não está disponível.");

        GameplayRollResultDto raw = _rollEvaluator.Evaluate(plan);
        int xp = action switch
        {
            "XP_COMBATE" => 1,
            "XP_MINIBOSS" or "XP_CONTRATO" or "XP_MISSAO_SECUNDARIA" => raw.Subtotal % 2 == 0 ? 2 : 1,
            _ => raw.Subtotal,
        };
        return GameplayOperationResult<GameplayRollResultDto>.Ok(WithOutcome(
            raw,
            "XP_CALCULADO",
            "XP calculado",
            xp));
    }

    private static GameplayOperationResult<IReadOnlyList<GameplayDiceGroupSpec>> ValidateGenericGroups(
        IReadOnlyCollection<GameplayDiceGroupRequestDto> requestGroups,
        GameplayRollMode mode)
    {
        IReadOnlyCollection<GameplayDiceGroupRequestDto> groups = requestGroups.Count == 0
            ? new[] { new GameplayDiceGroupRequestDto { Quantidade = 1, Faces = 6 } }
            : requestGroups;
        if (groups.Count > MaxDiceGroups)
            return Validation<IReadOnlyList<GameplayDiceGroupSpec>>("DADOS_DEMAIS", "Use no máximo 8 grupos de dados.");
        if (groups.Any(group => group.Quantidade is < 1 or > MaxDicePerCommand || group.Faces is < 2 or > 1000))
            return Validation<IReadOnlyList<GameplayDiceGroupSpec>>("DADO_INVALIDO", "Cada dado deve ter quantidade e faces dentro dos limites permitidos.");
        int total;
        try
        {
            total = groups.Sum(group => group.Quantidade);
        }
        catch (OverflowException)
        {
            return Validation<IReadOnlyList<GameplayDiceGroupSpec>>("DADOS_DEMAIS", "A quantidade de dados excede o limite.");
        }
        if (total > MaxDicePerCommand)
            return Validation<IReadOnlyList<GameplayDiceGroupSpec>>("DADOS_DEMAIS", "Use no máximo 100 dados por rolagem.");
        if (mode != GameplayRollMode.Normal && total > MaxDicePerCommand / 2)
        {
            return Validation<IReadOnlyList<GameplayDiceGroupSpec>>(
                "DADOS_DEMAIS",
                "Use no máximo 50 dados com vantagem ou desvantagem.");
        }
        return GameplayOperationResult<IReadOnlyList<GameplayDiceGroupSpec>>.Ok(
            groups.Select(group => new GameplayDiceGroupSpec(group.Quantidade, group.Faces)).ToList());
    }

    private static GameplayOperationResult<GameplayManualNormalized> NormalizeManual(
        GameplayManualRecordRequestDto request)
    {
        if (request.ChaveIdempotencia == Guid.Empty)
            return Validation<GameplayManualNormalized>("CHAVE_INVALIDA", "Informe uma chave de idempotência válida.");
        if (!Enum.IsDefined(request.Visibilidade))
            return Validation<GameplayManualNormalized>("VISIBILIDADE_INVALIDA", "A visibilidade informada é inválida.");
        string category = NormalizeCode(request.Categoria);
        if (!ManualCategories.Contains(category))
            return Validation<GameplayManualNormalized>("CATEGORIA_INVALIDA", "A categoria do registro manual é inválida.");
        string label = request.Rotulo?.Trim() ?? string.Empty;
        if (label.Length is < 1 or > 120)
            return Validation<GameplayManualNormalized>("ROTULO_INVALIDO", "Informe um rótulo curto para o registro.");
        if (!TryNormalizeManualNumber(request.ValorBruto, out int? raw) ||
            !TryNormalizeManualNumber(request.ResultadoFinal, out int? final) ||
            !TryNormalizeManualNumber(request.ValorAssociado, out int? associated))
        {
            return Validation<GameplayManualNormalized>(
                "VALOR_MANUAL_INVALIDO",
                "Os valores manuais devem ser inteiros entre -1.000.000 e 1.000.000.");
        }
        if (!raw.HasValue && !final.HasValue && !associated.HasValue)
            return Validation<GameplayManualNormalized>("VALOR_MANUAL_AUSENTE", "Informe ao menos um valor para o registro manual.");

        return GameplayOperationResult<GameplayManualNormalized>.Ok(new GameplayManualNormalized(
            category,
            label,
            raw,
            final,
            associated,
            NormalizeOptionalText(request.ResultadoSemantico),
            NormalizeOptionalText(request.Observacao),
            request.IdPersonagemJogador,
            request.Visibilidade));
    }

    private static bool TryNormalizeManualNumber(double? source, out int? value)
    {
        value = null;
        if (!source.HasValue)
            return true;
        double number = source.Value;
        if (!double.IsFinite(number) || Math.Truncate(number) != number || Math.Abs(number) > MaxManualAbsoluteValue)
            return false;
        value = checked((int)number);
        return true;
    }

    private async Task<GameplayOperationResult<GameplayCommandResponseDto>?> TryReplayAsync(
        int idMesa,
        int idUsuario,
        Guid key,
        string hash,
        CancellationToken cancellationToken)
    {
        MesaComando? existing = await _repository.GetCommandAsync(
            idMesa,
            idUsuario,
            key.ToString("D"),
            cancellationToken);
        if (existing is null)
            return null;
        if (!CryptographicOperations.FixedTimeEquals(
                Encoding.ASCII.GetBytes(existing.HashPayload),
                Encoding.ASCII.GetBytes(hash)))
        {
            return Conflict<GameplayCommandResponseDto>(
                "CHAVE_REUTILIZADA",
                "Esta chave de idempotência já foi usada com outro comando.");
        }

        GameplayCommandResponseDto? stored;
        try
        {
            stored = JsonSerializer.Deserialize<GameplayCommandResponseDto>(existing.RespostaJson, JsonOptions);
        }
        catch (JsonException)
        {
            stored = null;
        }
        if (stored is null)
            return Conflict<GameplayCommandResponseDto>("RESPOSTA_INDISPONIVEL", "O comando anterior precisa ser recarregado.");
        return GameplayOperationResult<GameplayCommandResponseDto>.Ok(CloneAsReplay(stored));
    }

    private async Task<GameplayOperationResult<GameplayCommandResponseDto>> PersistNoOpCommandAsync(
        Mesa mesa,
        MesaSessao session,
        int idUsuario,
        Guid key,
        string hash,
        string type,
        long? expectedMesaRevision,
        CancellationToken cancellationToken)
    {
        MesaComando command = NewCommand(
            mesa.Idmesa,
            session.IdMesaSessao,
            idUsuario,
            null,
            key,
            hash,
            type,
            expectedMesaRevision,
            null,
            DateTime.UtcNow);
        _repository.AddCommand(command);
        await _repository.SaveChangesAsync(cancellationToken);
        GameplayCommandResponseDto response = BuildResponse(
            command,
            mesa,
            session,
            null,
            null,
            false);
        command.RespostaJson = Serialize(response);
        await _repository.SaveChangesAsync(cancellationToken);
        return GameplayOperationResult<GameplayCommandResponseDto>.Ok(response);
    }

    private static MesaComando NewCommand(
        int idMesa,
        long idSession,
        int idUser,
        int? idCharacter,
        Guid key,
        string hash,
        string type,
        long? expectedMesaRevision,
        long? expectedSessionRevision,
        DateTime now) => new()
    {
        IdMesa = idMesa,
        IdMesaSessao = idSession,
        IdUsuarioAtor = idUser,
        IdPersonagemJogador = idCharacter,
        ChaveIdempotencia = key.ToString("D"),
        HashPayload = hash,
        Tipo = type,
        RevisaoMesaEsperada = expectedMesaRevision,
        RevisaoSessaoEsperada = expectedSessionRevision,
        Status = MesaComandoStatus.Concluido,
        RespostaJson = "{}",
        CriadoEmUtc = now,
        ConcluidoEmUtc = now,
    };

    private static MesaEvento NewEvent(
        MesaSessao session,
        MesaComando command,
        string type,
        GameplayEventOrigin origin,
        GameplayEventVisibility visibility,
        int idUser,
        PersonagemJogador? character,
        SistemaVersao version,
        int? characterVersion,
        string ruleCode,
        string dataJson,
        DateTime now) => new()
    {
        IdMesaSessao = session.IdMesaSessao,
        IdMesaComando = command.IdMesaComando,
        Sequencia = session.UltimaSequenciaEvento,
        Tipo = type,
        Origem = origin,
        Visibilidade = visibility,
        IdUsuarioAtor = idUser,
        IdPersonagemJogador = character?.IdpersonagemJogador,
        IdSistemaRpg = version.IdSistemaRpg,
        IdSistemaVersaoEfetiva = version.IdSistemaVersao,
        IdSistemaVersaoPersonagem = characterVersion,
        CodigoRegra = ruleCode,
        SchemaVersion = 1,
        DadosJson = dataJson,
        OcorreuEmUtc = now,
    };

    private static GameplayCommandResponseDto BuildResponse(
        MesaComando command,
        Mesa mesa,
        MesaSessao session,
        GameplayEventDto? gameplayEvent,
        GameplayRollResultDto? roll,
        bool replay) => new()
    {
        IdComando = command.IdMesaComando,
        Replay = replay,
        IdMesaSessao = session.IdMesaSessao,
        RevisaoMesa = mesa.RevisaoRuntime,
        RevisaoSessao = session.RevisaoEstado,
        UltimaSequenciaEvento = session.UltimaSequenciaEvento,
        Sessao = MapSession(session),
        Evento = gameplayEvent,
        Rolagem = roll,
    };

    private static GameplayCommandResponseDto CloneAsReplay(GameplayCommandResponseDto source) => new()
    {
        IdComando = source.IdComando,
        Replay = true,
        IdMesaSessao = source.IdMesaSessao,
        RevisaoMesa = source.RevisaoMesa,
        RevisaoSessao = source.RevisaoSessao,
        UltimaSequenciaEvento = source.UltimaSequenciaEvento,
        Sessao = source.Sessao,
        Evento = source.Evento,
        Rolagem = source.Evento?.Oculto == true ? null : source.Rolagem,
    };

    private static GameplaySessionDto MapSession(MesaSessao source) => new()
    {
        IdMesaSessao = source.IdMesaSessao,
        IdMesa = source.IdMesa,
        Status = source.Status,
        IdSistemaVersao = source.IdSistemaVersao,
        IniciadaEmUtc = source.IniciadaEmUtc,
        EncerradaEmUtc = source.EncerradaEmUtc,
        RevisaoEstado = source.RevisaoEstado,
        UltimaSequenciaEvento = source.UltimaSequenciaEvento,
        VersaoSchema = source.VersaoSchema,
    };

    private static GameplayEventDto MapEvent(MesaEvento source, int idUser, bool isMaster)
    {
        bool reveal = source.Visibilidade == GameplayEventVisibility.PublicaMesa ||
            isMaster ||
            (source.Visibilidade == GameplayEventVisibility.MestreEAutor && source.IdUsuarioAtor == idUser);
        if (!reveal)
        {
            return new GameplayEventDto
            {
                IdMesaEvento = source.IdMesaEvento,
                IdMesaSessao = source.IdMesaSessao,
                Sequencia = source.Sequencia,
                Tipo = "RESULTADO_OCULTO",
                Origem = GameplayEventOrigin.Automatica,
                Visibilidade = source.Visibilidade,
                OcorreuEmUtc = source.OcorreuEmUtc,
                Oculto = true,
                Titulo = "Resultado oculto",
            };
        }

        JsonElement? data = ParseJson(source.DadosJson);
        GameplayRollResultDto? roll = source.Rolagem is null ? null : MapRoll(source.Rolagem);
        string? title = ReadString(data, "titulo");
        string? description = ReadString(data, "descricao");
        string? semantic = ReadString(data, "resultadoSemantico") ?? roll?.NomeResultado;
        int? associated = ReadInt(data, "valorAssociado") ?? roll?.ValorAssociado;
        return new GameplayEventDto
        {
            IdMesaEvento = source.IdMesaEvento,
            IdMesaSessao = source.IdMesaSessao,
            Sequencia = source.Sequencia,
            Tipo = source.Tipo,
            Origem = source.Origem,
            Visibilidade = source.Visibilidade,
            IdUsuarioAtor = source.IdUsuarioAtor,
            IdPersonagemJogador = source.IdPersonagemJogador,
            CodigoRegra = source.CodigoRegra,
            OcorreuEmUtc = source.OcorreuEmUtc,
            Oculto = false,
            Titulo = title,
            Descricao = description,
            Manual = source.Origem == GameplayEventOrigin.Manual,
            ResultadoSemantico = semantic,
            ValorAssociado = associated,
            Categoria = ReadString(data, "categoria"),
            Observacao = ReadString(data, "observacao"),
            Rolagem = roll,
        };
    }

    private static MesaRolagem MapPersistedRoll(long eventId, GameplayRollResultDto roll) => new()
    {
        IdMesaEvento = eventId,
        Expressao = roll.Expressao,
        GruposJson = Serialize(roll.Grupos),
        ModificadoresJson = Serialize(roll.Modificadores),
        ValorNatural = roll.ValorNatural,
        Subtotal = roll.Subtotal,
        Total = roll.Total,
        CodigoResultado = roll.CodigoResultado,
        NomeResultado = roll.NomeResultado,
        ValorAssociado = roll.ValorAssociado,
        Manual = roll.Manual,
    };

    private static GameplayRollResultDto MapRoll(MesaRolagem source) => new()
    {
        Expressao = source.Expressao,
        Grupos = DeserializeOrDefault<List<GameplayDiceGroupResultDto>>(source.GruposJson) ?? new(),
        Modificadores = DeserializeOrDefault<List<GameplayModifierDto>>(source.ModificadoresJson) ?? new(),
        ValorNatural = source.ValorNatural,
        Modificador = (DeserializeOrDefault<List<GameplayModifierDto>>(source.ModificadoresJson) ?? new())
            .Sum(item => item.Valor),
        Subtotal = source.Subtotal,
        Total = source.Total,
        CodigoResultado = source.CodigoResultado,
        NomeResultado = source.NomeResultado,
        ValorAssociado = source.ValorAssociado,
        Manual = source.Manual,
    };

    private static GameplayRollResultDto BuildManualRoll(GameplayManualNormalized source)
    {
        int subtotal = source.RawValue ?? source.FinalValue ?? 0;
        int total = source.FinalValue ?? subtotal;
        return new GameplayRollResultDto
        {
            Expressao = "Registro manual",
            Grupos = Array.Empty<GameplayDiceGroupResultDto>(),
            Modificadores = Array.Empty<GameplayModifierDto>(),
            ValorNatural = source.RawValue,
            Modificador = total - subtotal,
            Subtotal = subtotal,
            Total = total,
            CodigoResultado = source.SemanticResult is null ? null : "RESULTADO_MANUAL",
            NomeResultado = source.SemanticResult,
            ValorAssociado = source.AssociatedValue,
            Manual = true,
        };
    }

    private static GameplayRollResultDto WithOutcome(
        GameplayRollResultDto source,
        string? resultCode,
        string? resultName,
        int? associatedValue) => new()
    {
        Expressao = source.Expressao,
        Grupos = source.Grupos,
        Modificadores = source.Modificadores,
        ValorNatural = source.ValorNatural,
        Modificador = source.Modificador,
        Subtotal = source.Subtotal,
        Total = source.Total,
        CodigoResultado = resultCode,
        NomeResultado = resultName,
        ValorAssociado = associatedValue,
        Manual = source.Manual,
    };

    private static bool TryGetAttributeValue(
        string statusJson,
        string group,
        string attributeCode,
        out int value)
    {
        value = 0;
        try
        {
            JsonObject? root = JsonNode.Parse(statusJson) as JsonObject;
            JsonObject? attributes = FindProperty(root, "atributos") as JsonObject;
            JsonObject? selectedGroup = FindProperty(attributes, group) as JsonObject;
            JsonNode? node = FindProperty(selectedGroup, attributeCode);
            if (node is not JsonValue jsonValue)
                return false;
            if (jsonValue.TryGetValue(out int integer))
            {
                value = integer;
                return true;
            }
            if (jsonValue.TryGetValue(out double number) && double.IsFinite(number))
            {
                value = checked((int)Math.Round(number));
                return true;
            }
            return jsonValue.TryGetValue(out string? text) && int.TryParse(text, out value);
        }
        catch (Exception exception) when (exception is JsonException or OverflowException)
        {
            return false;
        }
    }

    private static JsonNode? FindProperty(JsonObject? source, string property)
        => source?.FirstOrDefault(item =>
            item.Key.Equals(property, StringComparison.OrdinalIgnoreCase)).Value;

    private static string BuildExpression(
        IReadOnlyList<GameplayDiceGroupSpec> groups,
        GameplayRollMode mode)
    {
        string baseExpression = string.Join(" + ", groups.Select(group => $"{group.Quantity}D{group.Faces}"));
        return mode == GameplayRollMode.Normal
            ? baseExpression
            : $"2x({baseExpression}) manter {(mode == GameplayRollMode.Vantagem ? "maior" : "menor")}";
    }

    private static string BuildActionTitle(string action, string? attributeCode) => action switch
    {
        "TESTE_GENERICO" => "Teste genérico",
        "ATRIBUTO_PRINCIPAL" or "ATRIBUTO_SECUNDARIO" =>
            $"Teste de {NormalizeOptionalCode(attributeCode) ?? "atributo"}",
        "XP_COMBATE" => "XP de combate",
        "XP_MINIBOSS" => "XP de miniboss",
        "XP_BOSS" => "XP de boss",
        "XP_SESSAO" => "XP de sessão",
        "XP_MVP" => "XP de MVP",
        "XP_MISSAO_SECUNDARIA" => "XP de missão secundária",
        "XP_CONTRATO" => "XP de contrato",
        "XP_MISSAO_PRINCIPAL" => "XP de missão principal",
        _ => action,
    };

    private static string BuildRollDescription(GameplayRollResultDto roll)
        => roll.NomeResultado is null
            ? $"{roll.Expressao} = {roll.Total}"
            : $"{roll.Expressao} = {roll.Total} · {roll.NomeResultado}";

    private static string HashPayload<T>(T payload)
        => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(Serialize(payload))));

    private static string Serialize<T>(T value)
        => JsonSerializer.Serialize(value, JsonOptions);

    private static T? DeserializeOrDefault<T>(string source)
    {
        try
        {
            return JsonSerializer.Deserialize<T>(source, JsonOptions);
        }
        catch (JsonException)
        {
            return default;
        }
    }

    private static JsonElement? ParseJson(string source)
    {
        try
        {
            using JsonDocument document = JsonDocument.Parse(source);
            return document.RootElement.Clone();
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static string? ReadString(JsonElement? source, string property)
    {
        if (!source.HasValue || source.Value.ValueKind != JsonValueKind.Object ||
            !source.Value.TryGetProperty(property, out JsonElement value) ||
            value.ValueKind != JsonValueKind.String)
            return null;
        return value.GetString();
    }

    private static int? ReadInt(JsonElement? source, string property)
    {
        if (!source.HasValue || source.Value.ValueKind != JsonValueKind.Object ||
            !source.Value.TryGetProperty(property, out JsonElement value) ||
            !value.TryGetInt32(out int result))
            return null;
        return result;
    }

    private static string NormalizeCode(string? source)
        => (source ?? string.Empty).Trim().ToUpperInvariant().Replace('-', '_').Replace(' ', '_');

    private static string? NormalizeOptionalCode(string? source)
    {
        string value = NormalizeCode(source);
        return value.Length == 0 ? null : value;
    }

    private static string? NormalizeOptionalText(string? source)
    {
        string? value = source?.Trim();
        return string.IsNullOrWhiteSpace(value) ? null : value;
    }

    private static GameplayOperationResult<T> Validation<T>(string code, string message)
        => GameplayOperationResult<T>.Falha(GameplayOperationError.Validacao, code, message);
    private static GameplayOperationResult<T> NotFound<T>(string code, string message)
        => GameplayOperationResult<T>.Falha(GameplayOperationError.NaoEncontrado, code, message);
    private static GameplayOperationResult<T> Forbidden<T>(string code, string message)
        => GameplayOperationResult<T>.Falha(GameplayOperationError.Proibido, code, message);
    private static GameplayOperationResult<T> Conflict<T>(string code, string message)
        => GameplayOperationResult<T>.Falha(GameplayOperationError.Conflito, code, message);
    private static GameplayOperationResult<T> RuleFailure<T>(string code, string message)
        => GameplayOperationResult<T>.Falha(GameplayOperationError.RegraNaoPermitida, code, message);
    private static GameplayOperationResult<T> RateLimited<T>(int retryAfterSeconds)
        => GameplayOperationResult<T>.Falha(
            GameplayOperationError.LimiteTaxa,
            "LIMITE_DE_ACOES",
            "Muitas ações nesta Mesa. Aguarde antes de tentar novamente.",
            retryAfterSeconds);

    private static GameplayOperationResult<TTarget> ConvertFailure<TSource, TTarget>(
        GameplayOperationResult<TSource> source)
        => GameplayOperationResult<TTarget>.Falha(
            source.Erro,
            source.Codigo,
            source.Mensagem ?? "Não foi possível concluir a ação.",
            source.RetryAfterSeconds);

    private sealed record GameplayCommandContext(
        Mesa Mesa,
        MesaSessao Session,
        SistemaVersao Version,
        PersonagemJogador? Character,
        bool IsMaster,
        GameplayCommandResponseDto? Replay);

    private sealed record GameplayManualNormalized(
        string Categoria,
        string Label,
        int? RawValue,
        int? FinalValue,
        int? AssociatedValue,
        string? SemanticResult,
        string? Observation,
        int? IdCharacter,
        GameplayEventVisibility Visibility);
}
