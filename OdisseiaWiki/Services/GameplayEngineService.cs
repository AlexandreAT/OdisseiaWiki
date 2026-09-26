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
    private const int HistoryScanBatchSize = 101;
    private const int MaxHistoryRowsPerRequest = 2_000;
    private const int MaxFavoriteRollsPerCharacter = 40;

    private static readonly HashSet<string> FavoriteSourceTypes = new(StringComparer.Ordinal)
    {
        "ATRIBUTO",
        "ITEM",
        "SKILL",
        "MAGIA",
        "PROTESE",
    };

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
    private readonly GameplayActionResolver _actionResolver;
    private readonly IGameplayCursorCodec _cursorCodec;
    private readonly IGameplayCommandRateLimiter _rateLimiter;
    private readonly IMesaRealtimeNotifier _realtimeNotifier;

    static GameplayEngineService()
    {
        JsonOptions.Converters.Add(new JsonStringEnumConverter());
    }

    private GameplayOperationResult<GameplayRollResultDto> EvaluateResolvedAction(
        GameplayResolvedAction resolved)
    {
        int executions = ReadSnapshotInt(resolved.Snapshot, "quantidadeSolicitada") ?? 1;
        if (executions > 1)
            return EvaluateMultipleResolvedActions(resolved, executions);

        GameplayRollResultDto raw;
        try
        {
            raw = _rollEvaluator.Evaluate(new GameplayRollPlan(
                BuildExpression(resolved.Groups, resolved.Mode),
                resolved.Groups,
                resolved.Mode,
                resolved.Modifier,
                ModifierDetails: resolved.Modifiers));
        }
        catch (ArgumentOutOfRangeException)
        {
            return RuleFailure<GameplayRollResultDto>(
                "TESTE_FORA_LIMITE",
                "A configuração do teste excede os limites de dados permitidos.");
        }
        catch (OverflowException)
        {
            return RuleFailure<GameplayRollResultDto>(
                "RESULTADO_FORA_LIMITE",
                "Os valores deste teste excedem o limite permitido.");
        }

        int? associatedValue = ResolveAssociatedValue(resolved, raw);
        GameplayResolvedResultRange? outcome = null;
        bool unclassified = false;
        if (resolved.Ranges.Count > 0)
        {
            int natural = raw.ValorNatural ?? 0;
            int metric = resolved.UseTotalForRanges ? raw.Total : natural;
            GameplayResolvedResultRange? naturalOutcome = resolved.Ranges
                .Where(range => range.RequiresNatural)
                .FirstOrDefault(range => natural >= range.Minimum && natural <= range.Maximum);
            List<GameplayResolvedResultRange> regularRanges = resolved.Ranges
                .Where(range => !range.RequiresNatural)
                .OrderBy(range => range.Minimum)
                .ToList();
            outcome = naturalOutcome
                ?? regularRanges.FirstOrDefault(range => metric >= range.Minimum && metric <= range.Maximum);
            if (outcome is null && resolved.UseTotalForRanges && raw.Modificador != 0)
            {
                outcome = regularRanges
                    .Where(range => range.Maximum < metric)
                    .OrderByDescending(range => range.Maximum)
                    .FirstOrDefault()
                    ?? regularRanges
                        .Where(range => range.Minimum > metric)
                        .OrderBy(range => range.Minimum)
                        .FirstOrDefault();
            }
            unclassified = outcome is null;
        }

        string? resultCode = outcome?.Code;
        string? resultName = outcome?.Name;
        if (resolved.Snapshot.Tipo == "FONTE_XP")
        {
            resultCode = "XP_CALCULADO";
            resultName = "XP calculado";
        }
        GameplayRollResultDto withOutcome = WithOutcome(raw, resultCode, resultName, associatedValue);
        IReadOnlyList<GameplayResultRangeDto> ranges = resolved.Ranges.Select(range => new GameplayResultRangeDto
        {
            Codigo = range.Code,
            Nome = range.Name,
            Minimo = range.Minimum == int.MinValue ? null : range.Minimum,
            Maximo = range.Maximum == int.MaxValue ? null : range.Maximum,
            ExigeNatural = range.RequiresNatural,
            Critico = range.Critical,
            FalhaCritica = range.CriticalFailure,
        }).ToList();
        IReadOnlyList<GameplayExecutionNoticeDto> notices = unclassified
            ? resolved.Notices.Concat(new[]
            {
                new GameplayExecutionNoticeDto
                {
                    Codigo = "TABELA_RESULTADO_INCOMPLETA",
                    Mensagem = "O resultado ficou fora das faixas publicadas e foi mantido sem classificação.",
                    Fallback = false,
                },
            }).ToArray()
            : resolved.Notices;
        GameplayRollResultDto contracted = WithRollContract(
            withOutcome,
            resolved.Mode,
            new GameplayDifficultyDto
            {
                Codigo = resolved.Snapshot.Codigo ?? "TESTE",
                Nome = resolved.Name,
                Alvo = ReadSnapshotInt(resolved.Snapshot, "alvo"),
                Comparador = resolved.Snapshot.Valores.GetValueOrDefault("comparador")
                    ?? (resolved.UseTotalForRanges ? "total" : "natural"),
            },
            ranges,
            resolved.Snapshot,
            notices,
            outcome is { Critical: true, RequiresNatural: true },
            outcome is { CriticalFailure: true, RequiresNatural: true });
        return GameplayOperationResult<GameplayRollResultDto>.Ok(
            WithEffectProposals(contracted, outcome?.EffectJson));
    }

    private GameplayOperationResult<GameplayRollResultDto> EvaluateMultipleResolvedActions(
        GameplayResolvedAction resolved,
        int executions)
    {
        if (executions is < 2 or > MaxDicePerCommand)
            return RuleFailure<GameplayRollResultDto>("QUANTIDADE_INVALIDA", "A quantidade de ações está fora dos limites permitidos.");
        var singleValues = new Dictionary<string, string>(resolved.Snapshot.Valores, StringComparer.Ordinal)
        {
            ["quantidadeSolicitada"] = "1",
        };
        GameplayActionSnapshotDto singleSnapshot = new()
        {
            Tipo = resolved.Snapshot.Tipo,
            IdPersonagemJogador = resolved.Snapshot.IdPersonagemJogador,
            RevisaoPersonagem = resolved.Snapshot.RevisaoPersonagem,
            IdInstancia = resolved.Snapshot.IdInstancia,
            IdItemSistema = resolved.Snapshot.IdItemSistema,
            IdPoderSistema = resolved.Snapshot.IdPoderSistema,
            IdSistemaVersao = resolved.Snapshot.IdSistemaVersao,
            Codigo = resolved.Snapshot.Codigo,
            Nome = resolved.Snapshot.Nome,
            Valores = singleValues,
        };
        var rolls = new List<GameplayRollResultDto>(executions);
        for (int index = 0; index < executions; index++)
        {
            GameplayOperationResult<GameplayRollResultDto> result = EvaluateResolvedAction(
                resolved with { Snapshot = singleSnapshot });
            if (!result.Sucesso || result.Dados is null) return result;
            rolls.Add(result.Dados);
        }

        int hits = rolls.Count(IsSuccessfulRoll);
        var aggregateValues = new Dictionary<string, string>(resolved.Snapshot.Valores, StringComparer.Ordinal)
        {
            ["acertosResolvidos"] = hits.ToString(System.Globalization.CultureInfo.InvariantCulture),
            ["falhasResolvidas"] = (executions - hits).ToString(System.Globalization.CultureInfo.InvariantCulture),
        };
        GameplayActionSnapshotDto aggregateSnapshot = new()
        {
            Tipo = resolved.Snapshot.Tipo,
            IdPersonagemJogador = resolved.Snapshot.IdPersonagemJogador,
            RevisaoPersonagem = resolved.Snapshot.RevisaoPersonagem,
            IdInstancia = resolved.Snapshot.IdInstancia,
            IdItemSistema = resolved.Snapshot.IdItemSistema,
            IdPoderSistema = resolved.Snapshot.IdPoderSistema,
            IdSistemaVersao = resolved.Snapshot.IdSistemaVersao,
            Codigo = resolved.Snapshot.Codigo,
            Nome = resolved.Snapshot.Nome,
            Valores = aggregateValues,
        };
        GameplayRollResultDto aggregate = new()
        {
            Expressao = $"{executions}x ({BuildExpression(resolved.Groups, resolved.Mode)})",
            Grupos = rolls.SelectMany(roll => roll.Grupos).ToArray(),
            Modificadores = resolved.Modifiers,
            ValorNatural = null,
            Modificador = rolls.Sum(roll => roll.Modificador),
            Subtotal = rolls.Sum(roll => roll.Subtotal),
            Total = rolls.Sum(roll => roll.Total),
            CodigoResultado = "ACOES_MULTIPLAS_RESOLVIDAS",
            NomeResultado = $"{hits} de {executions} acertos",
            Manual = false,
            Modo = resolved.Mode,
            Dificuldade = rolls[0].Dificuldade,
            FaixasResultado = rolls[0].FaixasResultado,
            CriticoNatural = rolls.Any(roll => roll.CriticoNatural == true),
            FalhaCriticaNatural = rolls.Any(roll => roll.FalhaCriticaNatural == true),
            OrigemAcao = aggregateSnapshot,
            Avisos = resolved.Notices,
            RolagensIndividuais = rolls,
        };
        return GameplayOperationResult<GameplayRollResultDto>.Ok(WithEffectProposals(aggregate, null));
    }

    private static bool IsSuccessfulRoll(GameplayRollResultDto roll)
    {
        string code = NormalizeCode(roll.CodigoResultado);
        if (code.Length == 0 || code.Contains("FALHA", StringComparison.Ordinal) ||
            code.Contains("ERRO", StringComparison.Ordinal)) return false;
        return true;
    }

    private static int? ResolveAssociatedValue(
        GameplayResolvedAction resolved,
        GameplayRollResultDto roll)
    {
        int? value = resolved.FixedAssociatedValue;
        if (!value.HasValue && resolved.Snapshot.Tipo == "FONTE_XP")
        {
            value = NormalizeCode(resolved.ValueTransform) switch
            {
                "PARIDADE_1_2" => Math.Abs(roll.Subtotal) % 2 == 0 ? 2 : 1,
                _ => roll.Subtotal,
            };
        }
        if (!value.HasValue) return null;
        if (resolved.AssociatedMinimum.HasValue)
            value = Math.Max(value.Value, resolved.AssociatedMinimum.Value);
        if (resolved.AssociatedMaximum.HasValue)
            value = Math.Min(value.Value, resolved.AssociatedMaximum.Value);
        return value;
    }

    public GameplayEngineService(
        IGameplayEngineRepository repository,
        GameplayRollEvaluator rollEvaluator,
        GameplayActionResolver actionResolver,
        IGameplayCursorCodec cursorCodec,
        IGameplayCommandRateLimiter rateLimiter,
        IMesaRealtimeNotifier realtimeNotifier)
    {
        _repository = repository;
        _rollEvaluator = rollEvaluator;
        _actionResolver = actionResolver;
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

    public async Task<GameplayOperationResult<GameplayCommandResponseDto>> ApplyEffectAsync(
        int idMesa,
        long idMesaSessao,
        int idUsuario,
        GameplayEffectApplyRequestDto request,
        CancellationToken cancellationToken = default)
    {
        if (request.ChaveIdempotencia == Guid.Empty || request.IdEventoOrigem <= 0 ||
            string.IsNullOrWhiteSpace(request.CodigoEfeito) || !request.RevisaoPersonagemEsperada.HasValue)
        {
            return Validation<GameplayCommandResponseDto>(
                "EFEITO_INVALIDO",
                "Recarregue a ficha e tente aplicar o efeito novamente.");
        }
        string effectCode = NormalizeCode(request.CodigoEfeito);
        string hash = HashPayload(new
        {
            request.IdEventoOrigem,
            codigoEfeito = effectCode,
            request.IdPersonagemAlvo,
            request.RevisaoSessaoEsperada,
            request.RevisaoPersonagemEsperada,
        });
        GameplayOperationResult<GameplayCommandResponseDto> result;
        int? changedCharacterId = null;
        try
        {
            result = await _repository.ExecuteInTransactionAsync(async token =>
            {
                Mesa? mesa = await _repository.LockMesaAsync(idMesa, token);
                if (mesa is null || mesa.PadraoSistema)
                    return NotFound<GameplayCommandResponseDto>("MESA_NAO_ENCONTRADA", "Mesa não encontrada.");
                if (!await _repository.CanAccessTableAsync(idMesa, idUsuario, token))
                    return Forbidden<GameplayCommandResponseDto>("MESA_SEM_ACESSO", "Você não participa desta Mesa.");
                GameplayOperationResult<GameplayCommandResponseDto>? replay = await TryReplayAsync(
                    idMesa,
                    idUsuario,
                    request.ChaveIdempotencia,
                    hash,
                    token);
                if (replay is not null) return replay;
                if (mesa.IdMesaSessaoAtiva != idMesaSessao)
                    return Conflict<GameplayCommandResponseDto>("SESSAO_NAO_ATIVA", "Esta sessão não está mais ativa.");
                MesaSessao? session = await _repository.LockSessionAsync(idMesaSessao, token);
                if (session is null || session.IdMesa != idMesa || session.Status != MesaSessaoStatus.Ativa)
                    return Conflict<GameplayCommandResponseDto>("SESSAO_NAO_ATIVA", "Esta sessão não está mais ativa.");
                if (request.RevisaoSessaoEsperada.HasValue && request.RevisaoSessaoEsperada != session.RevisaoEstado)
                    return Conflict<GameplayCommandResponseDto>("REVISAO_SESSAO_DESATUALIZADA", "A sessão mudou. Recarregue antes de continuar.");

                MesaEvento? sourceEvent = await _repository.GetEventAsync(request.IdEventoOrigem, token);
                if (sourceEvent is null || sourceEvent.IdMesaSessao != idMesaSessao || sourceEvent.Tipo != "ROLAGEM_REALIZADA")
                    return NotFound<GameplayCommandResponseDto>("ROLAGEM_NAO_ENCONTRADA", "A rolagem de origem não foi encontrada nesta sessão.");
                bool isMaster = mesa.IdusuarioCriacao == idUsuario;
                if (!isMaster && sourceEvent.IdUsuarioAtor != idUsuario)
                    return Forbidden<GameplayCommandResponseDto>("EFEITO_SEM_PERMISSAO", "Somente o autor da rolagem ou o mestre pode aplicar este efeito.");
                GameplayRollResultDto? sourceRoll = ReadRollFromEvent(ParseJson(sourceEvent.DadosJson));
                GameplayEffectProposalDto? proposal = sourceRoll?.EfeitosPropostos.FirstOrDefault(item =>
                    NormalizeCode(item.Codigo) == effectCode);
                if (proposal is null || !proposal.PodeAplicar)
                    return RuleFailure<GameplayCommandResponseDto>("EFEITO_NAO_DISPONIVEL", "Este efeito não está disponível para aplicação.");

                int? targetId = NormalizeCode(proposal.Alvo) == "AUTOR"
                    ? sourceEvent.IdPersonagemJogador
                    : request.IdPersonagemAlvo;
                if (!targetId.HasValue)
                    return Validation<GameplayCommandResponseDto>("ALVO_OBRIGATORIO", "Selecione o personagem que receberá o efeito.");
                if (!isMaster && targetId != sourceEvent.IdPersonagemJogador)
                    return Forbidden<GameplayCommandResponseDto>("ALTERACAO_ALVO_EXIGE_MESTRE", "Somente o mestre pode alterar outro personagem.");

                PersonagemJogador? target = await _repository.GetCharacterForUpdateAsync(targetId.Value, token);
                if (target is null || target.Idmesa != idMesa)
                    return NotFound<GameplayCommandResponseDto>("ALVO_NAO_ENCONTRADO", "O personagem alvo não foi encontrado nesta Mesa.");
                if (target.RevisaoRuntime != request.RevisaoPersonagemEsperada.Value)
                    return Conflict<GameplayCommandResponseDto>("REVISAO_PERSONAGEM_DESATUALIZADA", "A ficha mudou. Recarregue antes de aplicar o efeito.");
                if (await _repository.HasEffectApplicationAsync(
                        idMesaSessao,
                        request.IdEventoOrigem,
                        effectCode,
                        target.IdpersonagemJogador,
                        token))
                {
                    return Conflict<GameplayCommandResponseDto>("EFEITO_JA_APLICADO", "Este efeito já foi aplicado neste personagem.");
                }

                SistemaVersao? version = await _repository.GetSystemVersionAsync(session.IdSistemaVersao, token);
                if (version is null)
                    return Conflict<GameplayCommandResponseDto>("VERSAO_NAO_ENCONTRADA", "A versão da sessão não está disponível.");
                GameplayOperationResult<GameplayEffectMutation> mutationResult = ApplyEffectToCharacter(
                    target,
                    proposal,
                    version);
                if (!mutationResult.Sucesso || mutationResult.Dados is null)
                    return ConvertFailure<GameplayEffectMutation, GameplayCommandResponseDto>(mutationResult);
                GameplayEffectMutation mutation = mutationResult.Dados;

                DateTime now = DateTime.UtcNow;
                MesaComando command = NewCommand(
                    idMesa,
                    idMesaSessao,
                    idUsuario,
                    target.IdpersonagemJogador,
                    request.ChaveIdempotencia,
                    hash,
                    "EFEITO_APLICAR",
                    null,
                    request.RevisaoSessaoEsperada,
                    now,
                    request.RevisaoPersonagemEsperada);
                command.RevisoesAlvosJson = Serialize(new Dictionary<string, long>
                {
                    [$"personagem:{target.IdpersonagemJogador}"] = request.RevisaoPersonagemEsperada.Value,
                });
                _repository.AddCommand(command);
                await _repository.SaveChangesAsync(token);

                long previousRevision = target.RevisaoRuntime;
                target.RevisaoRuntime = checked(target.RevisaoRuntime + 1);
                session.UltimaSequenciaEvento++;
                session.RevisaoEstado++;
                GameplayEffectApplicationDto application = new()
                {
                    IdEventoOrigem = request.IdEventoOrigem,
                    CodigoEfeito = effectCode,
                    IdPersonagemAlvo = target.IdpersonagemJogador,
                    RevisaoPersonagem = target.RevisaoRuntime,
                    Campo = mutation.Field,
                    ValorAnterior = mutation.PreviousValue,
                    ValorAplicado = mutation.AppliedDelta,
                    ValorAtual = mutation.CurrentValue,
                };
                string payload = Serialize(new
                {
                    schemaVersion = 1,
                    request.IdEventoOrigem,
                    codigoEfeito = effectCode,
                    idPersonagemAlvo = target.IdpersonagemJogador,
                    titulo = proposal.Nome,
                    descricao = $"{mutation.Field}: {mutation.PreviousValue} → {mutation.CurrentValue}",
                    manual = false,
                    revisaoAnterior = previousRevision,
                    revisaoNova = target.RevisaoRuntime,
                    aplicacao = application,
                });
                MesaEvento effectEvent = NewEvent(
                    session,
                    command,
                    "EFEITO_APLICADO",
                    GameplayEventOrigin.Automatica,
                    sourceEvent.Visibilidade,
                    idUsuario,
                    target,
                    version,
                    target.IdSistemaVersao,
                    effectCode,
                    payload,
                    now);
                _repository.AddEvent(effectEvent);
                await _repository.SaveChangesAsync(token);
                _repository.AddEffectApplication(new MesaEfeitoAplicado
                {
                    IdMesaSessao = session.IdMesaSessao,
                    IdEventoOrigem = sourceEvent.IdMesaEvento,
                    IdEventoAplicacao = effectEvent.IdMesaEvento,
                    IdPersonagemAlvo = target.IdpersonagemJogador,
                    ChaveEfeito = effectCode,
                    HashPlano = HashPayload(new
                    {
                        proposal.Codigo,
                        proposal.Tipo,
                        proposal.Alvo,
                        proposal.CodigoRecurso,
                        proposal.Operacao,
                        proposal.Valor,
                        target.IdpersonagemJogador,
                    }),
                    AplicadoEmUtc = now,
                });
                await _repository.SaveChangesAsync(token);
                GameplayCommandResponseDto response = BuildResponse(
                    command,
                    mesa,
                    session,
                    MapEvent(effectEvent, idUsuario, isMaster),
                    null,
                    false,
                    application);
                command.RespostaJson = Serialize(response);
                await _repository.SaveChangesAsync(token);
                changedCharacterId = target.IdpersonagemJogador;
                return GameplayOperationResult<GameplayCommandResponseDto>.Ok(response);
            }, cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return Conflict<GameplayCommandResponseDto>("CONCORRENCIA_PERSONAGEM", "A ficha mudou. Recarregue e tente novamente.");
        }
        catch (DbUpdateException)
        {
            return Conflict<GameplayCommandResponseDto>("CONFLITO_COMANDO", "O efeito já foi processado ou a sessão mudou.");
        }

        if (result.Sucesso && result.Dados is { Replay: false, Evento: not null })
        {
            await _realtimeNotifier.NotificarMesaAlteradaAsync(idMesa, cancellationToken);
            if (changedCharacterId.HasValue)
                await _realtimeNotifier.NotificarPersonagemAlteradoAsync(idMesa, changedCharacterId.Value, cancellationToken);
        }
        return result;
    }

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
                        request.RevisaoSessaoEsperada,
                        request.RevisaoPersonagemEsperada,
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
                    now,
                    request.RevisaoPersonagemEsperada);
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
        var page = new List<MesaEvento>(limit);
        long examinedUntil = afterSequence;
        int scanned = 0;
        bool hasMore = false;

        // A cursor represents the last ledger row inspected, not the last row
        // revealed. Otherwise a page containing only private events from other
        // players is fetched forever by every non-authorized client.
        while (page.Count < limit && scanned < MaxHistoryRowsPerRequest)
        {
            int take = Math.Min(HistoryScanBatchSize, MaxHistoryRowsPerRequest - scanned);
            List<MesaEvento> batch = await _repository.GetEventsAfterSequenceAsync(
                idMesaSessao,
                examinedUntil,
                take,
                cancellationToken);
            if (batch.Count == 0)
                break;

            for (int index = 0; index < batch.Count; index++)
            {
                MesaEvento item = batch[index];
                examinedUntil = item.Sequencia;
                scanned++;
                if (CanReadEvent(item, idUsuario, isMaster))
                    page.Add(item);

                if (page.Count == limit)
                {
                    // If the page ended at the final row of a short batch, the
                    // ledger is exhausted. Do not make the client request one
                    // artificial empty page.
                    hasMore = index < batch.Count - 1 || batch.Count == take;
                    break;
                }
            }

            // A full batch may have more rows. A partially consumed batch also
            // has at least one remaining row for the next request.
            if (page.Count == limit)
                break;

            if (batch.Count < take)
                break;
        }

        if (scanned >= MaxHistoryRowsPerRequest)
            hasMore = true;

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

    public async Task<GameplayOperationResult<GameplayActionCatalogDto>> GetActionCatalogAsync(
        int idPersonagemJogador,
        int idUsuario,
        CancellationToken cancellationToken = default)
    {
        PersonagemJogador? character = await _repository.GetCharacterAsync(idPersonagemJogador, cancellationToken);
        if (character is null)
            return NotFound<GameplayActionCatalogDto>("PERSONAGEM_NAO_ENCONTRADO", "Personagem não encontrado.");
        if (character.Idusuario != idUsuario)
            return Forbidden<GameplayActionCatalogDto>("PERSONAGEM_SEM_CONTROLE", "Você não controla este personagem.");
        if (!await _repository.CanAccessTableAsync(character.Idmesa, idUsuario, cancellationToken))
            return Forbidden<GameplayActionCatalogDto>("MESA_SEM_ACESSO", "Você não participa desta Mesa.");
        Mesa? mesa = await _repository.GetMesaAsync(character.Idmesa, cancellationToken);
        int? versionId = mesa?.IdMesaSessaoAtiva.HasValue == true
            ? (await _repository.GetSessionAsync(mesa.IdMesaSessaoAtiva.Value, cancellationToken))?.IdSistemaVersao
            : mesa?.IdSistemaVersao;
        if (!versionId.HasValue)
            return RuleFailure<GameplayActionCatalogDto>("MESA_SEM_VERSAO", "A Mesa não possui uma versão executável.");
        SistemaVersao? version = await _repository.GetSystemVersionAsync(versionId.Value, cancellationToken);
        return version is null
            ? RuleFailure<GameplayActionCatalogDto>("VERSAO_NAO_ENCONTRADA", "A versão da Mesa não está disponível.")
            : GameplayOperationResult<GameplayActionCatalogDto>.Ok(_actionResolver.BuildCatalog(version));
    }

    public async Task<GameplayOperationResult<IReadOnlyCollection<GameplayFavoriteRollDto>>> GetFavoriteRollsAsync(
        int idPersonagemJogador,
        int idUsuario,
        CancellationToken cancellationToken = default)
    {
        PersonagemJogador? character = await _repository.GetCharacterAsync(idPersonagemJogador, cancellationToken);
        GameplayOperationResult<PersonagemJogador> access = await ValidateFavoriteCharacterAccessAsync(
            character,
            idUsuario,
            cancellationToken);
        if (!access.Sucesso || access.Dados is null)
            return ConvertFailure<PersonagemJogador, IReadOnlyCollection<GameplayFavoriteRollDto>>(access);

        IReadOnlyCollection<GameplayFavoriteRollDto> favorites = ReadFavoriteRolls(access.Dados)
            .OrderByDescending(item => item.AtualizadoEmUtc)
            .ToArray();
        return GameplayOperationResult<IReadOnlyCollection<GameplayFavoriteRollDto>>.Ok(favorites);
    }

    public async Task<GameplayOperationResult<GameplayFavoriteRollDto>> UpsertFavoriteRollAsync(
        int idPersonagemJogador,
        int idUsuario,
        GameplayFavoriteRollUpsertDto request,
        CancellationToken cancellationToken = default)
    {
        string sourceType = NormalizeCode(request.TipoOrigem);
        string sourceId = request.IdOrigem.Trim();
        string name = request.Nome.Trim();
        if (!FavoriteSourceTypes.Contains(sourceType))
            return Validation<GameplayFavoriteRollDto>("TIPO_FAVORITO_INVALIDO", "Este tipo de rolagem não pode ser favoritado.");
        if (sourceId.Length == 0 || name.Length == 0)
            return Validation<GameplayFavoriteRollDto>("FAVORITO_INCOMPLETO", "Informe a origem e o nome da rolagem favorita.");
        if (!Enum.IsDefined(request.Configuracao.Modo) || !Enum.IsDefined(request.Configuracao.Visibilidade))
            return Validation<GameplayFavoriteRollDto>("OPCAO_INVALIDA", "A configuração da rolagem é inválida.");

        PersonagemJogador? character = await _repository.GetCharacterForUpdateAsync(idPersonagemJogador, cancellationToken);
        GameplayOperationResult<PersonagemJogador> access = await ValidateFavoriteCharacterAccessAsync(
            character,
            idUsuario,
            cancellationToken);
        if (!access.Sucesso || access.Dados is null)
            return ConvertFailure<PersonagemJogador, GameplayFavoriteRollDto>(access);

        List<GameplayFavoriteRollDto> favorites = ReadFavoriteRolls(access.Dados).ToList();
        GameplayFavoriteRollDto? current = favorites.FirstOrDefault(item =>
            string.Equals(item.TipoOrigem, sourceType, StringComparison.Ordinal) &&
            string.Equals(item.IdOrigem, sourceId, StringComparison.Ordinal));
        if (current is null && favorites.Count >= MaxFavoriteRollsPerCharacter)
            return RuleFailure<GameplayFavoriteRollDto>("LIMITE_FAVORITOS", $"Cada personagem pode ter até {MaxFavoriteRollsPerCharacter} rolagens favoritas.");

        GameplayFavoriteRollDto saved = new()
        {
            IdFavorito = current?.IdFavorito ?? Guid.NewGuid(),
            IdPersonagemJogador = idPersonagemJogador,
            TipoOrigem = sourceType,
            IdOrigem = sourceId,
            Nome = name,
            Configuracao = CopyFavoriteConfiguration(request.Configuracao),
            AtualizadoEmUtc = DateTime.UtcNow,
        };
        favorites.RemoveAll(item => item.IdFavorito == saved.IdFavorito ||
            (string.Equals(item.TipoOrigem, sourceType, StringComparison.Ordinal) &&
             string.Equals(item.IdOrigem, sourceId, StringComparison.Ordinal)));
        favorites.Add(saved);
        access.Dados.RolagensFavoritasJson = Serialize(favorites);
        await _repository.SaveChangesAsync(cancellationToken);
        return GameplayOperationResult<GameplayFavoriteRollDto>.Ok(saved);
    }

    public async Task<GameplayOperationResult<bool>> DeleteFavoriteRollAsync(
        int idPersonagemJogador,
        Guid idFavorito,
        int idUsuario,
        CancellationToken cancellationToken = default)
    {
        PersonagemJogador? character = await _repository.GetCharacterForUpdateAsync(idPersonagemJogador, cancellationToken);
        GameplayOperationResult<PersonagemJogador> access = await ValidateFavoriteCharacterAccessAsync(
            character,
            idUsuario,
            cancellationToken);
        if (!access.Sucesso || access.Dados is null)
            return ConvertFailure<PersonagemJogador, bool>(access);

        List<GameplayFavoriteRollDto> favorites = ReadFavoriteRolls(access.Dados).ToList();
        int removed = favorites.RemoveAll(item => item.IdFavorito == idFavorito);
        if (removed == 0)
            return NotFound<bool>("FAVORITO_NAO_ENCONTRADO", "A rolagem favorita não foi encontrada.");
        access.Dados.RolagensFavoritasJson = favorites.Count == 0 ? null : Serialize(favorites);
        await _repository.SaveChangesAsync(cancellationToken);
        return GameplayOperationResult<bool>.Ok(true);
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
            request.RevisaoSessaoEsperada,
            request.RevisaoPersonagemEsperada,
            request.ReferenciaAcao,
            request.ParametrosAcao,
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
                        request.RevisaoSessaoEsperada,
                        request.RevisaoPersonagemEsperada,
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
                string actionCode = roll.OrigemAcao?.Valores.TryGetValue("codigoAcao", out string? resolvedActionCode) == true
                    ? NormalizeCode(resolvedActionCode)
                    : NormalizeCode(request.CodigoAcao);
                MesaComando command = NewCommand(
                    idMesa,
                    idMesaSessao,
                    idUsuario,
                    context.Character?.IdpersonagemJogador,
                    request.ChaveIdempotencia,
                    hash,
                    "ROLAGEM_REALIZAR",
                    null,
                    request.RevisaoSessaoEsperada,
                    now,
                    request.RevisaoPersonagemEsperada);
                _repository.AddCommand(command);
                await _repository.SaveChangesAsync(token);

                context.Session.UltimaSequenciaEvento++;
                string title = roll.OrigemAcao is { Tipo: not "" } origin
                    ? origin.Nome ?? BuildActionTitle(actionCode, request.CodigoAtributo)
                    : BuildActionTitle(actionCode, request.CodigoAtributo);
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
        long? expectedSessionRevision,
        long? expectedCharacterRevision,
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
        if (expectedSessionRevision.HasValue && expectedSessionRevision.Value != session.RevisaoEstado)
        {
            return Conflict<GameplayCommandContext>(
                "REVISAO_SESSAO_DESATUALIZADA",
                "A sessao mudou. Recarregue antes de continuar.");
        }
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

        if (character is not null && expectedCharacterRevision.HasValue &&
            expectedCharacterRevision.Value != character.RevisaoRuntime)
        {
            return Conflict<GameplayCommandContext>(
                "REVISAO_PERSONAGEM_DESATUALIZADA",
                "A ficha mudou. Recarregue antes de continuar.");
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
        GameplayOperationResult<GameplayResolvedAction> resolvedActionResult = HasActionReference(request.ReferenciaAcao)
            ? character is null
                ? Validation<GameplayResolvedAction>("PERSONAGEM_OBRIGATORIO", "Selecione o personagem que executará a ação.")
                : _actionResolver.Resolve(request, character, version)
            : _actionResolver.ResolveSystemAction(request, character, version);
        if (!resolvedActionResult.Sucesso || resolvedActionResult.Dados is null)
            return ConvertFailure<GameplayResolvedAction, GameplayRollResultDto>(resolvedActionResult);
        return EvaluateResolvedAction(resolvedActionResult.Dados);

#pragma warning disable CS0162 // Mantido temporariamente para compatibilidade de leitura de comandos antigos.
        if (HasActionReference(request.ReferenciaAcao))
            return EvaluateReferencedAction(request, character, version);
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
                GameplayRollResultDto resolved = WithOutcome(
                    raw,
                    raw.Total >= 4 ? "SUCESSO" : "FALHA",
                    raw.Total >= 4 ? "Sucesso" : "Falha",
                    null);
                return GameplayOperationResult<GameplayRollResultDto>.Ok(WithRollContract(
                    resolved,
                    request.Modo,
                    new GameplayDifficultyDto
                    {
                        Codigo = "TESTE_GENERICO_D6",
                        Nome = "Teste generico D6",
                        Alvo = 4,
                        Comparador = ">=",
                    },
                    OutcomeRanges(4),
                    new GameplayActionSnapshotDto
                    {
                        Tipo = "ROLAGEM_GENERICA",
                        IdSistemaVersao = version.IdSistemaVersao,
                        Codigo = action,
                        Nome = "Teste generico",
                    },
                    FallbackNotice("A regra estruturada desta acao ainda usa a tabela padrao do Odisseia.")));
            }
            return GameplayOperationResult<GameplayRollResultDto>.Ok(WithRollContract(
                raw,
                request.Modo,
                null,
                Array.Empty<GameplayResultRangeDto>(),
                new GameplayActionSnapshotDto
                {
                    Tipo = "ROLAGEM_GENERICA",
                    IdSistemaVersao = version.IdSistemaVersao,
                    Codigo = action,
                    Nome = "Rolagem generica",
                },
                FallbackNotice("Nenhuma dificuldade foi configurada para esta rolagem generica.")));
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
            GameplayRollResultDto resolved = WithOutcome(
                raw,
                raw.Total > 6 ? "SUCESSO" : "FALHA",
                raw.Total > 6 ? "Sucesso" : "Falha",
                null);
            return GameplayOperationResult<GameplayRollResultDto>.Ok(WithRollContract(
                resolved,
                request.Modo,
                new GameplayDifficultyDto
                {
                    Codigo = "TESTE_ATRIBUTO",
                    Nome = "Teste de atributo",
                    Alvo = 7,
                    Comparador = ">",
                },
                OutcomeRanges(7),
                AttributeSnapshot(character, version, attributeCode, attributeValue),
                FallbackNotice("A dificuldade deste teste usa a regra padrao do Odisseia.")));
        }

        return EvaluateExperienceRoll(action, version);
#pragma warning restore CS0162
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
        GameplayRollResultDto resolved = WithOutcome(
            raw,
            "XP_CALCULADO",
            "XP calculado",
            xp);
        return GameplayOperationResult<GameplayRollResultDto>.Ok(WithRollContract(
            resolved,
            plan.Mode,
            null,
            new[]
            {
                new GameplayResultRangeDto
                {
                    Codigo = "XP",
                    Nome = "XP calculado",
                    Minimo = source.ValorMinimo,
                    Maximo = source.ValorMaximo,
                },
            },
            new GameplayActionSnapshotDto
            {
                Tipo = "FONTE_XP",
                IdSistemaVersao = version.IdSistemaVersao,
                IdInstancia = source.IdSistemaFonteExperiencia.ToString(System.Globalization.CultureInfo.InvariantCulture),
                Codigo = source.Codigo,
                Nome = source.Nome,
                Valores = new Dictionary<string, string>
                {
                    ["valorMinimo"] = source.ValorMinimo?.ToString(System.Globalization.CultureInfo.InvariantCulture) ?? string.Empty,
                    ["valorMaximo"] = source.ValorMaximo?.ToString(System.Globalization.CultureInfo.InvariantCulture) ?? string.Empty,
                    ["usaVantagem"] = source.UsaVantagem.ToString(),
                },
            },
            FallbackNotice("A fonte de XP foi resolvida pela tabela publicada da versao da Mesa.")));
    }

    private GameplayOperationResult<GameplayRollResultDto> EvaluateReferencedAction(
        GameplayRollRequestDto request,
        PersonagemJogador? character,
        SistemaVersao version)
    {
        if (character is null)
        {
            return Validation<GameplayRollResultDto>(
                "PERSONAGEM_OBRIGATORIO",
                "Selecione o personagem que executará a ação.");
        }

        GameplayOperationResult<GameplayResolvedAction> resolvedResult = _actionResolver.Resolve(
            request,
            character,
            version);
        if (!resolvedResult.Sucesso || resolvedResult.Dados is null)
            return ConvertFailure<GameplayResolvedAction, GameplayRollResultDto>(resolvedResult);
        GameplayResolvedAction resolved = resolvedResult.Dados;

        GameplayRollResultDto raw;
        try
        {
            raw = _rollEvaluator.Evaluate(new GameplayRollPlan(
                BuildExpression(resolved.Groups, resolved.Mode),
                resolved.Groups,
                resolved.Mode,
                resolved.Modifier,
                ModifierDetails: resolved.Modifiers));
        }
        catch (ArgumentOutOfRangeException)
        {
            return RuleFailure<GameplayRollResultDto>(
                "TESTE_FORA_LIMITE",
                "A configuração do teste excede os limites de dados permitidos.");
        }
        catch (OverflowException)
        {
            return RuleFailure<GameplayRollResultDto>(
                "RESULTADO_FORA_LIMITE",
                "Os valores deste teste excedem o limite permitido.");
        }

        int natural = raw.ValorNatural ?? 0;
        int metric = resolved.UseTotalForRanges ? raw.Total : natural;
        // Natural-only outcomes (for example natural 1/20) must win over an
        // intermediate total range. Otherwise a modifier could hide a
        // published critical success or failure.
        GameplayResolvedResultRange? naturalOutcome = resolved.Ranges
            .Where(range => range.RequiresNatural)
            .FirstOrDefault(range => natural >= range.Minimum && natural <= range.Maximum);
        List<GameplayResolvedResultRange> regularRanges = resolved.Ranges
            .Where(range => !range.RequiresNatural)
            .OrderBy(range => range.Minimum)
            .ToList();
        GameplayResolvedResultRange? outcome = naturalOutcome
            ?? regularRanges.FirstOrDefault(range => metric >= range.Minimum && metric <= range.Maximum);
        if (outcome is null && resolved.UseTotalForRanges && raw.Modificador != 0)
        {
            // Faixas especiais continuam dependendo do valor natural. Quando
            // um modificador leva o total para uma dessas faixas ou para fora
            // do limite do dado, preservamos a faixa comum configurada mais
            // próxima sem promover o resultado a preciso/crítico.
            outcome = regularRanges
                .Where(range => range.Maximum < metric)
                .OrderByDescending(range => range.Maximum)
                .FirstOrDefault()
                ?? regularRanges
                    .Where(range => range.Minimum > metric)
                    .OrderBy(range => range.Minimum)
                    .FirstOrDefault();
        }
        bool unclassified = outcome is null;
        outcome ??= new GameplayResolvedResultRange(
            "RESULTADO_NAO_CLASSIFICADO",
            "Resultado sem classificação",
            metric,
            metric,
            false,
            false,
            false);

        GameplayRollResultDto withOutcome = WithOutcome(
            raw,
            outcome.Code,
            outcome.Name,
            null);
        IReadOnlyList<GameplayResultRangeDto> ranges = resolved.Ranges.Select(range => new GameplayResultRangeDto
        {
            Codigo = range.Code,
            Nome = range.Name,
            Minimo = range.Minimum,
            Maximo = range.Maximum,
            ExigeNatural = range.RequiresNatural,
            Critico = range.Critical,
            FalhaCritica = range.CriticalFailure,
        }).ToList();
        return GameplayOperationResult<GameplayRollResultDto>.Ok(WithRollContract(
            withOutcome,
            resolved.Mode,
            new GameplayDifficultyDto
            {
                Codigo = resolved.Snapshot.Codigo ?? "TESTE",
                Nome = resolved.Name,
                Comparador = resolved.UseTotalForRanges ? "total" : "natural",
            },
            ranges,
            resolved.Snapshot,
            unclassified
                ? resolved.Notices.Concat(new[]
                {
                    new GameplayExecutionNoticeDto
                    {
                        Codigo = "TABELA_RESULTADO_INCOMPLETA",
                        Mensagem = "O total ficou fora das faixas publicadas; a rolagem foi mantida sem classificar sucesso ou falha.",
                        Fallback = false,
                    },
                }).ToList()
                : resolved.Notices,
            outcome.Critical && outcome.RequiresNatural,
            outcome.CriticalFailure && outcome.RequiresNatural));
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

    private static GameplayOperationResult<GameplayEffectMutation> ApplyEffectToCharacter(
        PersonagemJogador character,
        GameplayEffectProposalDto proposal,
        SistemaVersao version)
    {
        if (proposal.Valor is <= 0 or > MaxManualAbsoluteValue)
            return RuleFailure<GameplayEffectMutation>("VALOR_EFEITO_INVALIDO", "O valor configurado para o efeito é inválido.");
        JsonObject root;
        try
        {
            root = JsonNode.Parse(character.StatusJson) as JsonObject ?? new JsonObject();
        }
        catch (JsonException)
        {
            return RuleFailure<GameplayEffectMutation>("STATUS_INVALIDO", "A ficha possui dados de status inválidos.");
        }

        string type = NormalizeCode(proposal.Tipo);
        string operation = NormalizeCode(proposal.Operacao);
        string field;
        JsonObject container;
        int minimum = 0;
        int? maximum = null;
        if (type == "XP")
        {
            field = FindJsonProperty(root, "xp") ?? "xp";
            container = root;
        }
        else
        {
            string resourceCode = NormalizeCode(proposal.CodigoRecurso);
            SistemaRecursoConfig? resource = version.Recursos.FirstOrDefault(item =>
                item.Ativo && NormalizeCode(item.Codigo) == resourceCode);
            if (resource is null)
                return RuleFailure<GameplayEffectMutation>("RECURSO_NAO_PUBLICADO", "O recurso deste efeito não existe na versão publicada do Sistema.");
            container = GetOrCreateJsonObject(root, "status");
            string preferredField = resource.Codigo.Trim().ToLowerInvariant();
            field = FindJsonProperty(container, preferredField) ?? preferredField;
            minimum = resource.PermiteValorNegativo
                ? decimal.ToInt32(decimal.Max(resource.ValorMinimo, int.MinValue))
                : Math.Max(0, decimal.ToInt32(decimal.Max(resource.ValorMinimo, 0)));
            if (resource.ValorMaximo.HasValue)
                maximum = decimal.ToInt32(decimal.Min(resource.ValorMaximo.Value, int.MaxValue));
            string? sheetMaximumField = FindJsonProperty(container, $"{preferredField}Maxima")
                ?? FindJsonProperty(container, $"{preferredField}Maximo");
            if (sheetMaximumField is not null && TryReadJsonInt(container[sheetMaximumField], out int sheetMaximum))
                maximum = sheetMaximum;
        }

        int previous = TryReadJsonInt(container[field], out int stored) ? stored : 0;
        int signedDelta = operation switch
        {
            "SOMAR" => proposal.Valor,
            "SUBTRAIR" => -proposal.Valor,
            _ => 0,
        };
        if (signedDelta == 0)
            return RuleFailure<GameplayEffectMutation>("OPERACAO_EFEITO_INVALIDA", "A operação configurada para o efeito é inválida.");
        int current;
        try
        {
            current = checked(previous + signedDelta);
        }
        catch (OverflowException)
        {
            return RuleFailure<GameplayEffectMutation>("VALOR_EFEITO_FORA_LIMITE", "O efeito excede os limites aceitos pela ficha.");
        }
        current = Math.Max(minimum, current);
        if (maximum.HasValue) current = Math.Min(maximum.Value, current);
        container[field] = current;
        character.StatusJson = root.ToJsonString();
        return GameplayOperationResult<GameplayEffectMutation>.Ok(new GameplayEffectMutation(
            field,
            previous,
            current - previous,
            current));
    }

    private static JsonObject GetOrCreateJsonObject(JsonObject root, string property)
    {
        string? existing = FindJsonProperty(root, property);
        if (existing is not null && root[existing] is JsonObject current) return current;
        var created = new JsonObject();
        root[property] = created;
        return created;
    }

    private static string? FindJsonProperty(JsonObject source, string property)
        => source.FirstOrDefault(pair => pair.Key.Equals(property, StringComparison.OrdinalIgnoreCase)).Key;

    private static bool TryReadJsonInt(JsonNode? node, out int value)
    {
        value = 0;
        if (node is not JsonValue jsonValue) return false;
        if (jsonValue.TryGetValue(out int integer))
        {
            value = integer;
            return true;
        }
        return jsonValue.TryGetValue(out double number) && double.IsFinite(number) &&
            Math.Truncate(number) == number && number is >= int.MinValue and <= int.MaxValue &&
            (value = (int)number) == number;
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
        DateTime now,
        long? expectedCharacterRevision = null) => new()
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
        RevisaoPersonagemEsperada = expectedCharacterRevision,
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
        bool replay,
        GameplayEffectApplicationDto? application = null) => new()
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
        Aplicacao = application,
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
        Aplicacao = source.Aplicacao,
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
        GameplayRollResultDto? roll = ReadRollFromEvent(data) ??
            (source.Rolagem is null ? null : MapRoll(source.Rolagem));
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

    private static bool CanReadEvent(MesaEvento source, int idUser, bool isMaster)
    {
        bool canReadByVisibility = source.Visibilidade == GameplayEventVisibility.PublicaMesa ||
            isMaster ||
            source.IdUsuarioAtor == idUser;
        if (!canReadByVisibility)
            return false;

        return !source.IdPersonagemJogador.HasValue ||
            isMaster ||
            source.IdUsuarioAtor == idUser ||
            source.PersonagemJogador?.Visivel == true;
    }

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

    private static GameplayRollResultDto? ReadRollFromEvent(JsonElement? data)
    {
        if (!data.HasValue || data.Value.ValueKind != JsonValueKind.Object ||
            !data.Value.TryGetProperty("rolagem", out JsonElement roll))
        {
            return null;
        }

        try
        {
            return JsonSerializer.Deserialize<GameplayRollResultDto>(roll.GetRawText(), JsonOptions);
        }
        catch (JsonException)
        {
            return null;
        }
    }

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
            Modo = GameplayRollMode.Normal,
            OrigemAcao = new GameplayActionSnapshotDto
            {
                Tipo = "REGISTRO_MANUAL",
                Codigo = source.Categoria,
                Nome = source.Label,
            },
            Avisos = new[]
            {
                new GameplayExecutionNoticeDto
                {
                    Codigo = "VALOR_MANUAL",
                    Mensagem = "Valor informado manualmente; nenhuma regra foi executada.",
                    Fallback = false,
                },
            },
        };
    }

    private static GameplayRollResultDto WithEffectProposals(
        GameplayRollResultDto source,
        string? configuredEffectJson)
    {
        var effects = new List<GameplayEffectProposalDto>();
        GameplayActionSnapshotDto? origin = source.OrigemAcao;
        if (origin?.Tipo == "FONTE_XP" && source.ValorAssociado is > 0)
        {
            effects.Add(new GameplayEffectProposalDto
            {
                Codigo = "APLICAR_XP",
                Tipo = "XP",
                Nome = $"Aplicar {source.ValorAssociado.Value} XP",
                Alvo = "AUTOR",
                CodigoRecurso = "XP",
                Operacao = "SOMAR",
                Valor = source.ValorAssociado.Value,
            });
        }

        if (origin is not null)
        {
            int uses = Math.Max(1, ReadSnapshotInt(origin, "quantidadeSolicitada") ?? 1);
            AddSnapshotCost(effects, origin, "estaminaPorUsoProposta", "ESTAMINA", "Gastar estamina", uses);
            AddSnapshotCost(effects, origin, "custoEstaminaProposto", "ESTAMINA", "Gastar estamina");
            AddSnapshotCost(effects, origin, "custoManaProposto", "MANA", "Gastar mana");
            AddSnapshotCost(effects, origin, "custoVidaProposto", "VIDA", "Gastar vida");

            bool failed = NormalizeCode(source.CodigoResultado).Contains("FALHA", StringComparison.Ordinal) ||
                NormalizeCode(source.CodigoResultado).Contains("ERRO", StringComparison.Ordinal);
            if (!failed)
            {
                int? damage = ReadSnapshotInt(origin, "danoPorAcertoProposto")
                    ?? ReadSnapshotInt(origin, "danoProposto");
                if (damage is > 0)
                {
                    int hits = Math.Max(1, ReadSnapshotInt(origin, "acertosResolvidos") ?? 1);
                    bool validDamage = TryMultiplyEffectValue(damage.Value, hits, out int totalDamage);
                    effects.Add(new GameplayEffectProposalDto
                    {
                        Codigo = "APLICAR_DANO",
                        Tipo = "DANO",
                        Nome = validDamage ? $"Aplicar {totalDamage} de dano" : "Dano fora do limite",
                        Alvo = "ALVO",
                        CodigoRecurso = "VIDA",
                        Operacao = "SUBTRAIR",
                        Valor = totalDamage,
                        ExigeAlvo = true,
                        PodeAplicar = validDamage,
                        MotivoIndisponivel = validDamage ? null : "O dano calculado excede o limite seguro da ficha.",
                    });
                }
            }
        }

        effects.AddRange(ReadConfiguredEffects(configuredEffectJson));
        IReadOnlyList<GameplayEffectProposalDto> distinct = effects
            .GroupBy(effect => effect.Codigo, StringComparer.Ordinal)
            .Select(group => group.First())
            .ToArray();
        return CopyRoll(source, distinct);
    }

    private static void AddSnapshotCost(
        ICollection<GameplayEffectProposalDto> effects,
        GameplayActionSnapshotDto origin,
        string snapshotKey,
        string resourceCode,
        string label,
        int multiplier = 1)
    {
        int? value = ReadSnapshotInt(origin, snapshotKey);
        if (value is not > 0) return;
        bool validCost = TryMultiplyEffectValue(value.Value, Math.Max(1, multiplier), out int total);
        effects.Add(new GameplayEffectProposalDto
        {
            Codigo = $"APLICAR_CUSTO_{resourceCode}",
            Tipo = "RECURSO",
            Nome = validCost ? $"{label}: {total}" : $"{label}: valor fora do limite",
            Alvo = "AUTOR",
            CodigoRecurso = resourceCode,
            Operacao = "SUBTRAIR",
            Valor = total,
            PodeAplicar = validCost,
            MotivoIndisponivel = validCost ? null : "O custo calculado excede o limite seguro da ficha.",
        });
    }

    private static bool TryMultiplyEffectValue(int value, int multiplier, out int total)
    {
        long calculated = (long)value * multiplier;
        if (calculated is <= 0 or > MaxManualAbsoluteValue)
        {
            total = 0;
            return false;
        }
        total = (int)calculated;
        return true;
    }

    private static int? ReadSnapshotInt(GameplayActionSnapshotDto source, string key)
        => source.Valores.TryGetValue(key, out string? raw) && int.TryParse(raw, out int value)
            ? value
            : null;

    private static IReadOnlyList<GameplayEffectProposalDto> ReadConfiguredEffects(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return Array.Empty<GameplayEffectProposalDto>();
        try
        {
            JsonNode? root = JsonNode.Parse(json);
            JsonArray? entries = root as JsonArray ?? (root as JsonObject)?["efeitos"] as JsonArray;
            if (entries is null) return Array.Empty<GameplayEffectProposalDto>();
            var effects = new List<GameplayEffectProposalDto>();
            foreach (JsonObject entry in entries.OfType<JsonObject>())
            {
                string code = NormalizeCode(entry["codigo"]?.GetValue<string>());
                string type = NormalizeCode(entry["tipo"]?.GetValue<string>());
                int? value = entry["valor"]?.GetValue<int>();
                if (code.Length == 0 || type.Length == 0 || value is null or <= 0) continue;
                string target = NormalizeCode(entry["alvo"]?.GetValue<string>());
                string? resourceCode = NormalizeOptionalCode(entry["codigoRecurso"]?.GetValue<string>());
                bool canApply = type == "XP" || resourceCode is not null;
                effects.Add(new GameplayEffectProposalDto
                {
                    Codigo = code,
                    Tipo = type,
                    Nome = entry["nome"]?.GetValue<string>() ?? code,
                    Alvo = target.Length == 0 ? "AUTOR" : target,
                    CodigoRecurso = resourceCode,
                    Operacao = NormalizeOptionalCode(entry["operacao"]?.GetValue<string>()) ?? "SOMAR",
                    Valor = value.Value,
                    ExigeAlvo = entry["exigeAlvo"]?.GetValue<bool>() ?? target == "ALVO",
                    PodeAplicar = canApply,
                    MotivoIndisponivel = canApply
                        ? null
                        : "Este efeito continua assistido porque ainda não altera um recurso publicado.",
                });
            }
            return effects;
        }
        catch (Exception exception) when (exception is JsonException or InvalidOperationException)
        {
            return Array.Empty<GameplayEffectProposalDto>();
        }
    }

    private static GameplayRollResultDto CopyRoll(
        GameplayRollResultDto source,
        IReadOnlyList<GameplayEffectProposalDto>? effects = null) => new()
    {
        Expressao = source.Expressao,
        Grupos = source.Grupos,
        Modificadores = source.Modificadores,
        ValorNatural = source.ValorNatural,
        Modificador = source.Modificador,
        Subtotal = source.Subtotal,
        Total = source.Total,
        CodigoResultado = source.CodigoResultado,
        NomeResultado = source.NomeResultado,
        ValorAssociado = source.ValorAssociado,
        Manual = source.Manual,
        Modo = source.Modo,
        Dificuldade = source.Dificuldade,
        FaixasResultado = source.FaixasResultado,
        CriticoNatural = source.CriticoNatural,
        FalhaCriticaNatural = source.FalhaCriticaNatural,
        OrigemAcao = source.OrigemAcao,
        Avisos = source.Avisos,
        EfeitosPropostos = effects ?? source.EfeitosPropostos,
        RolagensIndividuais = source.RolagensIndividuais,
    };

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
        EfeitosPropostos = source.EfeitosPropostos,
        RolagensIndividuais = source.RolagensIndividuais,
    };

    private static GameplayRollResultDto WithRollContract(
        GameplayRollResultDto source,
        GameplayRollMode mode,
        GameplayDifficultyDto? difficulty,
        IReadOnlyList<GameplayResultRangeDto> ranges,
        GameplayActionSnapshotDto origin,
        IReadOnlyList<GameplayExecutionNoticeDto> notices,
        bool? criticalNatural = null,
        bool? criticalFailureNatural = null) => new()
    {
        Expressao = source.Expressao,
        Grupos = source.Grupos,
        Modificadores = source.Modificadores,
        ValorNatural = source.ValorNatural,
        Modificador = source.Modificador,
        Subtotal = source.Subtotal,
        Total = source.Total,
        CodigoResultado = source.CodigoResultado,
        NomeResultado = source.NomeResultado,
        ValorAssociado = source.ValorAssociado,
        Manual = source.Manual,
        Modo = mode,
        Dificuldade = difficulty,
        FaixasResultado = ranges,
        CriticoNatural = criticalNatural,
        FalhaCriticaNatural = criticalFailureNatural,
        OrigemAcao = origin,
        Avisos = notices,
        EfeitosPropostos = source.EfeitosPropostos,
        RolagensIndividuais = source.RolagensIndividuais,
    };

    private static IReadOnlyList<GameplayResultRangeDto> OutcomeRanges(int successMinimum) => new[]
    {
        new GameplayResultRangeDto
        {
            Codigo = "FALHA",
            Nome = "Falha",
            Maximo = successMinimum - 1,
            Critico = null,
            FalhaCritica = null,
        },
        new GameplayResultRangeDto
        {
            Codigo = "SUCESSO",
            Nome = "Sucesso",
            Minimo = successMinimum,
            Critico = null,
            FalhaCritica = null,
        },
    };

    private static GameplayActionSnapshotDto AttributeSnapshot(
        PersonagemJogador character,
        SistemaVersao version,
        string attributeCode,
        int attributeValue) => new()
    {
        Tipo = "ATRIBUTO",
        IdPersonagemJogador = character.IdpersonagemJogador,
        RevisaoPersonagem = character.RevisaoRuntime,
        IdSistemaVersao = version.IdSistemaVersao,
        Codigo = attributeCode,
        Nome = attributeCode,
        Valores = new Dictionary<string, string>
        {
            ["valor"] = attributeValue.ToString(System.Globalization.CultureInfo.InvariantCulture),
        },
    };

    private static IReadOnlyList<GameplayExecutionNoticeDto> FallbackNotice(string message) => new[]
    {
        new GameplayExecutionNoticeDto
        {
            Codigo = "REGRA_FALLBACK_ODISSEIA",
            Mensagem = message,
            Fallback = true,
        },
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

    private async Task<GameplayOperationResult<PersonagemJogador>> ValidateFavoriteCharacterAccessAsync(
        PersonagemJogador? character,
        int idUsuario,
        CancellationToken cancellationToken)
    {
        if (character is null)
            return NotFound<PersonagemJogador>("PERSONAGEM_NAO_ENCONTRADO", "Personagem não encontrado.");
        if (character.Idusuario != idUsuario)
            return Forbidden<PersonagemJogador>("PERSONAGEM_SEM_CONTROLE", "Você não controla este personagem.");
        if (!await _repository.CanAccessTableAsync(character.Idmesa, idUsuario, cancellationToken))
            return Forbidden<PersonagemJogador>("MESA_SEM_ACESSO", "Você não participa desta Mesa.");
        return GameplayOperationResult<PersonagemJogador>.Ok(character);
    }

    private static IReadOnlyCollection<GameplayFavoriteRollDto> ReadFavoriteRolls(PersonagemJogador character)
    {
        if (string.IsNullOrWhiteSpace(character.RolagensFavoritasJson))
            return Array.Empty<GameplayFavoriteRollDto>();
        return DeserializeOrDefault<List<GameplayFavoriteRollDto>>(character.RolagensFavoritasJson)
            ?.Where(item => item.IdFavorito != Guid.Empty && item.IdPersonagemJogador == character.IdpersonagemJogador)
            .Take(MaxFavoriteRollsPerCharacter)
            .ToArray() ?? Array.Empty<GameplayFavoriteRollDto>();
    }

    private static GameplayFavoriteRollConfigurationDto CopyFavoriteConfiguration(
        GameplayFavoriteRollConfigurationDto source) => new()
    {
        CodigoAcao = source.CodigoAcao.Trim(),
        CodigoAtributo = NormalizeOptionalCode(source.CodigoAtributo),
        Grupos = source.Grupos.Take(MaxDiceGroups).Select(group => new GameplayDiceGroupRequestDto
        {
            Quantidade = group.Quantidade,
            Faces = group.Faces,
        }).ToList(),
        Modo = source.Modo,
        Visibilidade = source.Visibilidade,
        ReferenciaAcao = source.ReferenciaAcao is null ? null : new GameplayActionReferenceDto
        {
            Tipo = NormalizeOptionalCode(source.ReferenciaAcao.Tipo),
            IdInstancia = NormalizeOptionalText(source.ReferenciaAcao.IdInstancia),
            IdItemSistema = source.ReferenciaAcao.IdItemSistema,
            IdPoderSistema = source.ReferenciaAcao.IdPoderSistema,
        },
        ParametrosAcao = source.ParametrosAcao is null ? null : new GameplayActionParametersDto
        {
            Operacao = NormalizeOptionalCode(source.ParametrosAcao.Operacao),
            Alcance = NormalizeOptionalCode(source.ParametrosAcao.Alcance),
            ModoDisparo = NormalizeOptionalCode(source.ParametrosAcao.ModoDisparo),
            Quantidade = source.ParametrosAcao.Quantidade,
        },
    };

    private static bool HasActionReference(GameplayActionReferenceDto? source) => source is not null &&
        (!string.IsNullOrWhiteSpace(source.Tipo) ||
         !string.IsNullOrWhiteSpace(source.IdInstancia) ||
         source.IdItemSistema.HasValue ||
         source.IdPoderSistema.HasValue);

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

    private sealed record GameplayEffectMutation(
        string Field,
        int PreviousValue,
        int AppliedDelta,
        int CurrentValue);

}
