using System.Data;
using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Data;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Services.Helpers;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Services;

/// <summary>
/// Estado autoritativo de combate. O relógio é uma sequência persistida de
/// turnos; nenhuma regra depende de timer ou memória do processo.
/// </summary>
public sealed partial class GameplayCombatService : IGameplayCombatService
{
    private static readonly JsonSerializerOptions JsonOptions = CreateJsonOptions();
    private readonly OdisseiaContext _context;
    private readonly IDiceRoller _diceRoller;
    private readonly IMesaRealtimeNotifier _realtime;

    public GameplayCombatService(
        OdisseiaContext context,
        IDiceRoller diceRoller,
        IMesaRealtimeNotifier realtime)
    {
        _context = context;
        _diceRoller = diceRoller;
        _realtime = realtime;
    }

    public async Task<GameplayOperationResult<GameplayCombatSnapshotDto?>> GetCurrentAsync(
        int idMesa,
        long idMesaSessao,
        int idUsuario,
        CancellationToken cancellationToken = default)
    {
        Mesa? mesa = await _context.Mesas.AsNoTracking().FirstOrDefaultAsync(item => item.Idmesa == idMesa, cancellationToken);
        if (mesa is null || mesa.PadraoSistema)
            return Fail<GameplayCombatSnapshotDto?>(GameplayOperationError.NaoEncontrado, "MESA_NAO_ENCONTRADA", "Mesa não encontrada.");
        if (!await CanAccessAsync(idMesa, idUsuario, cancellationToken))
            return Fail<GameplayCombatSnapshotDto?>(GameplayOperationError.Proibido, "MESA_SEM_ACESSO", "Você não participa desta Mesa.");
        MesaSessao? session = await _context.MesaSessoes.AsNoTracking().FirstOrDefaultAsync(
            item => item.IdMesaSessao == idMesaSessao && item.IdMesa == idMesa,
            cancellationToken);
        if (session is null)
            return Fail<GameplayCombatSnapshotDto?>(GameplayOperationError.NaoEncontrado, "SESSAO_NAO_ENCONTRADA", "Sessão não encontrada.");
        MesaCombate? combat = await LoadCombatAsync(idMesaSessao, tracking: false, cancellationToken);
        if (combat is null)
            return GameplayOperationResult<GameplayCombatSnapshotDto?>.Ok(null);
        SistemaVersao? version = await LoadVersionAsync(session.IdSistemaVersao, cancellationToken);
        if (version is null)
            return Fail<GameplayCombatSnapshotDto?>(GameplayOperationError.Conflito, "VERSAO_NAO_ENCONTRADA", "A versão usada pela sessão não está disponível.");
        return GameplayOperationResult<GameplayCombatSnapshotDto?>.Ok(MapCombat(combat, version, idUsuario, mesa.IdusuarioCriacao == idUsuario));
    }

    public async Task<GameplayOperationResult<GameplayStateCatalogDto>> GetCatalogAsync(
        int idMesa,
        long idMesaSessao,
        int idUsuario,
        CancellationToken cancellationToken = default)
    {
        if (!await CanAccessAsync(idMesa, idUsuario, cancellationToken))
            return Fail<GameplayStateCatalogDto>(GameplayOperationError.Proibido, "MESA_SEM_ACESSO", "Você não participa desta Mesa.");
        MesaSessao? session = await _context.MesaSessoes.AsNoTracking().FirstOrDefaultAsync(
            item => item.IdMesaSessao == idMesaSessao && item.IdMesa == idMesa,
            cancellationToken);
        if (session is null)
            return Fail<GameplayStateCatalogDto>(GameplayOperationError.NaoEncontrado, "SESSAO_NAO_ENCONTRADA", "Sessão não encontrada.");
        SistemaVersao? version = await LoadVersionAsync(session.IdSistemaVersao, cancellationToken);
        if (version is null)
            return Fail<GameplayStateCatalogDto>(GameplayOperationError.Conflito, "VERSAO_NAO_ENCONTRADA", "A versão usada pela sessão não está disponível.");
        return GameplayOperationResult<GameplayStateCatalogDto>.Ok(new GameplayStateCatalogDto
        {
            Condicoes = MapConditionCatalog(version),
            Descansos = MapRestCatalog(version),
        });
    }

    public Task<GameplayOperationResult<GameplayCombatCommandResponseDto>> StartAsync(
        int idMesa, long idMesaSessao, int idUsuario, GameplayCombatStartRequestDto request,
        CancellationToken cancellationToken = default)
        => ExecuteAsync(idMesa, idMesaSessao, idUsuario, request, "COMBATE_INICIAR", true, false,
            async (scope, token) =>
            {
                int[] ids = request.IdsPersonagens.Where(id => id > 0).Distinct().ToArray();
                if (ids.Length == 0)
                    return Invalid("PARTICIPANTES_OBRIGATORIOS", "Selecione ao menos um personagem para o combate.");
                List<PersonagemJogador> characters = await _context.PersonagemJogadores
                    .Where(item => item.Idmesa == idMesa && ids.Contains(item.IdpersonagemJogador))
                    .ToListAsync(token);
                if (characters.Count != ids.Length)
                    return Invalid("PARTICIPANTE_INVALIDO", "Um dos personagens selecionados não pertence a esta Mesa.");

                var combat = new MesaCombate
                {
                    IdMesaSessao = idMesaSessao,
                    Status = MesaCombateStatus.Preparacao,
                    IdUsuarioCriacao = idUsuario,
                    CriadoEmUtc = scope.Now,
                };
                foreach (PersonagemJogador character in characters.OrderBy(item => item.Nome))
                {
                    combat.Participantes.Add(new MesaCombateParticipante
                    {
                        Tipo = MesaCombateParticipanteTipo.PersonagemJogador,
                        Status = MesaCombateParticipanteStatus.AguardandoIniciativa,
                        IdPersonagemJogador = character.IdpersonagemJogador,
                        IdUsuarioControlador = character.Idusuario,
                        NomeSnapshot = character.Nome,
                        ImagemSnapshot = character.Imagem,
                        CriadoEmUtc = scope.Now,
                        PersonagemJogador = character,
                    });
                }
                _context.MesaCombates.Add(combat);
                scope.Combat = combat;
                foreach (MesaCombateParticipante participant in combat.Participantes)
                    SynchronizeParticipantRuleState(scope, participant, idUsuario);
                return Mutation("COMBATE_PREPARADO", "Combate preparado", $"{characters.Count} participantes aguardam iniciativa.");
            }, cancellationToken);

    public Task<GameplayOperationResult<GameplayCombatCommandResponseDto>> AddNpcAsync(
        int idMesa, long idMesaSessao, int idUsuario, GameplayCombatAddNpcRequestDto request,
        CancellationToken cancellationToken = default)
        => ExecuteAsync(idMesa, idMesaSessao, idUsuario, request, "COMBATE_ADICIONAR_NPC", true, true,
            (scope, _) =>
            {
                if (scope.Combat!.Status != MesaCombateStatus.Preparacao)
                    return Task.FromResult(Invalid("COMBATE_JA_INICIADO", "NPCs devem ser adicionados antes de confirmar a ordem."));
                string name = request.Nome.Trim();
                if (name.Length == 0)
                    return Task.FromResult(Invalid("NOME_NPC_OBRIGATORIO", "Informe o nome do NPC."));
                var participant = new MesaCombateParticipante
                {
                    IdMesaCombate = scope.Combat.IdMesaCombate,
                    Tipo = MesaCombateParticipanteTipo.Npc,
                    Status = MesaCombateParticipanteStatus.AguardandoIniciativa,
                    IdUsuarioControlador = idUsuario,
                    NomeSnapshot = name,
                    ImagemSnapshot = string.IsNullOrWhiteSpace(request.Imagem) ? null : request.Imagem.Trim(),
                    ModificadorIniciativa = request.ModificadorIniciativa,
                    CriadoEmUtc = scope.Now,
                };
                scope.Combat.Participantes.Add(participant);
                return Task.FromResult(Mutation("NPC_ADICIONADO", "NPC adicionado", $"{name} aguarda a iniciativa.", participant: participant));
            }, cancellationToken);

    public Task<GameplayOperationResult<GameplayCombatCommandResponseDto>> RollInitiativeAsync(
        int idMesa, long idMesaSessao, int idUsuario, GameplayCombatInitiativeRequestDto request,
        CancellationToken cancellationToken = default)
        => ExecuteAsync(idMesa, idMesaSessao, idUsuario, request, "COMBATE_ROLAR_INICIATIVA", false, true,
            (scope, _) =>
            {
                if (scope.Combat!.Status != MesaCombateStatus.Preparacao)
                    return Task.FromResult(Invalid("INICIATIVA_ENCERRADA", "A ordem deste combate já foi confirmada."));
                MesaCombateParticipante? participant = scope.Combat.Participantes.FirstOrDefault(item => item.IdMesaCombateParticipante == request.IdParticipante);
                if (participant is null || participant.Status == MesaCombateParticipanteStatus.Removido)
                    return Task.FromResult(Invalid("PARTICIPANTE_NAO_ENCONTRADO", "Participante não encontrado."));
                if (!scope.IsMaster && participant.IdUsuarioControlador != idUsuario)
                    return Task.FromResult(Forbidden("INICIATIVA_SEM_PERMISSAO", "Somente o controlador do participante ou o mestre pode rolar a iniciativa."));
                if (participant.Iniciativa.HasValue)
                    return Task.FromResult(Conflict("INICIATIVA_JA_ROLADA", "A iniciativa deste participante já foi registrada."));

                InitiativePlan? plan = BuildInitiativePlan(scope.Version, participant);
                if (plan is null)
                    return Task.FromResult(Invalid("FORMULA_INICIATIVA_INVALIDA", "A fórmula de iniciativa publicada não pode ser executada."));
                IReadOnlyList<int> values = _diceRoller.Roll(plan.Quantity, plan.Faces);
                int natural = values.Sum();
                int total = checked(natural + plan.Modifier);
                participant.ValorNaturalIniciativa = natural;
                participant.Iniciativa = total;
                participant.IniciativaRoladaEmUtc = scope.Now;
                if (participant.Status != MesaCombateParticipanteStatus.ABeiraDaMorte)
                    participant.Status = MesaCombateParticipanteStatus.Pronto;
                GameplayRollResultDto roll = InitiativeRoll(plan, values, natural, total, participant);
                return Task.FromResult(Mutation(
                    "INICIATIVA_ROLADA",
                    $"Iniciativa de {participant.NomeSnapshot}",
                    $"{natural} + {plan.Modifier} = {total}",
                    participant,
                    roll));
            }, cancellationToken);

    public Task<GameplayOperationResult<GameplayCombatCommandResponseDto>> ActivateAsync(
        int idMesa, long idMesaSessao, int idUsuario, GameplayCombatActivateRequestDto request,
        CancellationToken cancellationToken = default)
        => ExecuteAsync(idMesa, idMesaSessao, idUsuario, request, "COMBATE_ATIVAR", true, true,
            (scope, _) =>
            {
                MesaCombate combat = scope.Combat!;
                if (combat.Status != MesaCombateStatus.Preparacao)
                    return Task.FromResult(Invalid("COMBATE_JA_INICIADO", "Este combate já foi iniciado."));
                List<MesaCombateParticipante> active = combat.Participantes
                    .Where(item => item.Status != MesaCombateParticipanteStatus.Removido).ToList();
                if (active.Count == 0 || active.Any(item => !item.Iniciativa.HasValue))
                    return Task.FromResult(Invalid("INICIATIVAS_PENDENTES", "Todos os participantes precisam rolar iniciativa."));
                long[] order = request.OrdemParticipantes.Distinct().ToArray();
                if (order.Length != active.Count || order.Except(active.Select(item => item.IdMesaCombateParticipante)).Any())
                    return Task.FromResult(Invalid("ORDEM_INVALIDA", "Confirme uma ordem contendo todos os participantes."));
                for (int index = 0; index < order.Length; index++)
                {
                    MesaCombateParticipante participant = active.Single(item => item.IdMesaCombateParticipante == order[index]);
                    participant.Ordem = index;
                    if (participant.Status != MesaCombateParticipanteStatus.ABeiraDaMorte)
                        participant.Status = index == 0 ? MesaCombateParticipanteStatus.Ativo : MesaCombateParticipanteStatus.Pronto;
                }
                combat.Status = MesaCombateStatus.Ativo;
                combat.RodadaAtual = 1;
                combat.IndiceTurnoAtual = 0;
                combat.IdParticipanteAtual = order[0];
                combat.IniciadoEmUtc = scope.Now;
                return Task.FromResult(Mutation("COMBATE_ATIVADO", "Combate iniciado", $"Rodada 1 · turno de {active.Single(item => item.IdMesaCombateParticipante == order[0]).NomeSnapshot}."));
            }, cancellationToken);

    public Task<GameplayOperationResult<GameplayCombatCommandResponseDto>> AdvanceAsync(
        int idMesa, long idMesaSessao, int idUsuario, GameplayCombatAdvanceRequestDto request,
        CancellationToken cancellationToken = default)
        => ExecuteAsync(idMesa, idMesaSessao, idUsuario, request, "COMBATE_AVANCAR_TURNO", true, true,
            (scope, _) =>
            {
                MesaCombate combat = scope.Combat!;
                if (combat.Status != MesaCombateStatus.Ativo)
                    return Task.FromResult(Invalid("COMBATE_NAO_ATIVO", "Inicie o combate antes de avançar o turno."));
                foreach (MesaCombateParticipante participant in combat.Participantes)
                    SynchronizeParticipantRuleState(scope, participant, idUsuario);
                List<MesaCombateParticipante> eligible = combat.Participantes
                    .Where(item => item.Status != MesaCombateParticipanteStatus.Removido && item.Status != MesaCombateParticipanteStatus.Morto)
                    .OrderBy(item => item.Ordem).ToList();
                if (eligible.Count == 0)
                    return Task.FromResult(Invalid("SEM_PARTICIPANTES", "Não há participantes aptos para receber turno."));
                MesaCombateParticipante? outgoing = combat.IdParticipanteAtual.HasValue
                    ? combat.Participantes.FirstOrDefault(item => item.IdMesaCombateParticipante == combat.IdParticipanteAtual.Value)
                    : null;
                outgoing ??= eligible[Math.Clamp(combat.IndiceTurnoAtual, 0, eligible.Count - 1)];
                var applications = new List<GameplayEffectApplicationDto>();
                if (outgoing.Status is not (MesaCombateParticipanteStatus.Removido or MesaCombateParticipanteStatus.Morto))
                    applications.AddRange(ProcessTurnEffects(scope, outgoing, "FIM_TURNO"));
                outgoing.TurnosConcluidos++;
                if (outgoing.Status == MesaCombateParticipanteStatus.Ativo)
                    outgoing.Status = MesaCombateParticipanteStatus.Pronto;
                SynchronizeParticipantRuleState(scope, outgoing, idUsuario);
                eligible = combat.Participantes
                    .Where(item => item.Status != MesaCombateParticipanteStatus.Removido && item.Status != MesaCombateParticipanteStatus.Morto)
                    .OrderBy(item => item.Ordem).ToList();
                if (eligible.Count == 0)
                    return Task.FromResult(Invalid("SEM_PARTICIPANTES", "Nenhum participante pode receber o proximo turno."));
                int nextIndex = eligible.FindIndex(item => item.Ordem > outgoing.Ordem);
                if (nextIndex < 0)
                {
                    nextIndex = 0;
                    combat.RodadaAtual++;
                }
                MesaCombateParticipante incoming = eligible[nextIndex];
                combat.IndiceTurnoAtual = nextIndex;
                combat.IdParticipanteAtual = incoming.IdMesaCombateParticipante;
                if (incoming.Status is MesaCombateParticipanteStatus.Pronto or MesaCombateParticipanteStatus.Estabilizado)
                    incoming.Status = MesaCombateParticipanteStatus.Ativo;
                applications.AddRange(ProcessTurnEffects(scope, incoming, "INICIO_TURNO"));
                SynchronizeParticipantRuleState(scope, incoming, idUsuario);
                return Task.FromResult(Mutation(
                    "TURNO_AVANCADO",
                    $"Turno de {incoming.NomeSnapshot}",
                    $"Rodada {combat.RodadaAtual}.",
                    incoming,
                    applications: applications));
            }, cancellationToken);

    public Task<GameplayOperationResult<GameplayCombatCommandResponseDto>> EndAsync(
        int idMesa, long idMesaSessao, int idUsuario, GameplayCombatEndRequestDto request,
        CancellationToken cancellationToken = default)
        => ExecuteAsync(idMesa, idMesaSessao, idUsuario, request, "COMBATE_ENCERRAR", true, true,
            (scope, _) =>
            {
                MesaCombate combat = scope.Combat!;
                combat.Status = MesaCombateStatus.Encerrado;
                combat.EncerradoEmUtc = scope.Now;
                combat.IdUsuarioEncerramento = idUsuario;
                combat.IdParticipanteAtual = null;
                foreach (MesaCondicaoAtiva condition in combat.Condicoes.Where(item => item.Status == MesaCondicaoStatus.Ativa && item.UnidadeDuracao == SistemaUnidadeDuracao.Sessao))
                {
                    condition.Status = MesaCondicaoStatus.Expirada;
                    condition.RemovidaEmUtc = scope.Now;
                    condition.MotivoRemocao = "Combate encerrado";
                }
                return Task.FromResult(Mutation("COMBATE_ENCERRADO", "Combate encerrado", $"O combate terminou na rodada {combat.RodadaAtual}."));
            }, cancellationToken);

    public Task<GameplayOperationResult<GameplayCombatCommandResponseDto>> ApplyConditionAsync(
        int idMesa, long idMesaSessao, int idUsuario, GameplayConditionApplyRequestDto request,
        CancellationToken cancellationToken = default)
        => ExecuteAsync(idMesa, idMesaSessao, idUsuario, request, "CONDICAO_APLICAR", true, true,
            (scope, _) =>
            {
                MesaCombateParticipante? participant = scope.Combat!.Participantes.FirstOrDefault(item => item.IdMesaCombateParticipante == request.IdParticipante);
                SistemaCondicao? rule = scope.Version.Condicoes.FirstOrDefault(item => item.IdSistemaCondicao == request.IdSistemaCondicao);
                if (participant is null || rule is null)
                    return Task.FromResult(Invalid("CONDICAO_OU_ALVO_INVALIDO", "A condição ou o participante não pertence a esta versão do combate."));
                if (scope.Combat.Cooldowns.Any(item =>
                        item.IdParticipante == participant.IdMesaCombateParticipante &&
                        item.Status == MesaCooldownStatus.Ativo &&
                        item.TipoOrigem == "CONDICAO" &&
                        Normalize(item.IdOrigem) == Normalize(rule.Codigo)))
                {
                    return Task.FromResult(Conflict("CONDICAO_EM_COOLDOWN", "Esta condição ainda está em cooldown para o participante."));
                }
                int? duration = request.Duracao ?? rule.DuracaoPadrao;
                if (duration < 0)
                    return Task.FromResult(Invalid("DURACAO_INVALIDA", "A duração da condição não pode ser negativa."));
                decimal? value = request.Valor ?? rule.ValorPadrao ?? rule.ValorEfeito;
                MesaCondicaoAtiva? current = scope.Combat.Condicoes.FirstOrDefault(item =>
                    item.IdParticipante == participant.IdMesaCombateParticipante &&
                    item.Status == MesaCondicaoStatus.Ativa && item.CodigoSnapshot == rule.Codigo);
                if (current is not null)
                {
                    if (rule.Empilhavel)
                    {
                        current.Acumulos++;
                        current.Valor = value ?? current.Valor;
                        if (rule.PermiteSobrescrever)
                        {
                            current.Duracao = duration;
                            current.TurnosRestantes = rule.UnidadeDuracao == SistemaUnidadeDuracao.Turno ? duration : null;
                        }
                    }
                    else if (rule.PermiteSobrescrever)
                    {
                        current.Valor = value;
                        current.Duracao = duration;
                        current.TurnosRestantes = rule.UnidadeDuracao == SistemaUnidadeDuracao.Turno ? duration : null;
                        current.RegraSnapshotJson = SerializeConditionRule(rule);
                    }
                    else
                    {
                        return Task.FromResult(Conflict("CONDICAO_JA_ATIVA", "Esta condição já está ativa e não permite acúmulo ou substituição."));
                    }
                }
                else
                {
                    current = new MesaCondicaoAtiva
                    {
                        IdMesaCombate = scope.Combat.IdMesaCombate,
                        IdParticipante = participant.IdMesaCombateParticipante,
                        IdSistemaCondicao = rule.IdSistemaCondicao,
                        CodigoSnapshot = rule.Codigo,
                        NomeSnapshot = rule.Nome,
                        Valor = value,
                        Duracao = duration,
                        UnidadeDuracao = rule.UnidadeDuracao,
                        TurnosRestantes = rule.UnidadeDuracao == SistemaUnidadeDuracao.Turno ? duration : null,
                        CooldownTurnos = rule.CooldownTurnos,
                        RodadaAplicacao = scope.Combat.RodadaAtual,
                        TurnoAplicacao = scope.Combat.IndiceTurnoAtual,
                        RegraSnapshotJson = SerializeConditionRule(rule),
                        IdUsuarioAplicacao = idUsuario,
                        AplicadaEmUtc = scope.Now,
                        Combate = scope.Combat,
                        Participante = participant,
                    };
                    scope.Combat.Condicoes.Add(current);
                }
                GameplayEffectApplicationDto? application = Normalize(rule.MomentoEfeito) == "AO_APLICAR"
                    ? ApplyConditionResourceEffect(scope, participant, current, rule, false)
                    : null;
                ApplyResourceLimitEffects(scope, participant);
                return Task.FromResult(Mutation(
                    "CONDICAO_APLICADA",
                    rule.Nome,
                    $"Condição aplicada em {participant.NomeSnapshot}.",
                    participant,
                    characterId: participant.IdPersonagemJogador,
                    application: application));
            }, cancellationToken);

    public Task<GameplayOperationResult<GameplayCombatCommandResponseDto>> RemoveConditionAsync(
        int idMesa, long idMesaSessao, int idUsuario, GameplayConditionRemoveRequestDto request,
        CancellationToken cancellationToken = default)
        => ExecuteAsync(idMesa, idMesaSessao, idUsuario, request, "CONDICAO_REMOVER", false, true,
            (scope, _) =>
            {
                MesaCondicaoAtiva? condition = scope.Combat!.Condicoes.FirstOrDefault(item => item.IdMesaCondicaoAtiva == request.IdCondicaoAtiva);
                if (condition is null || condition.Status != MesaCondicaoStatus.Ativa)
                    return Task.FromResult(Invalid("CONDICAO_NAO_ATIVA", "A condição não está mais ativa."));
                MesaCombateParticipante participant = scope.Combat.Participantes.Single(item => item.IdMesaCombateParticipante == condition.IdParticipante);
                if (!scope.IsMaster && participant.IdUsuarioControlador != idUsuario)
                    return Task.FromResult(Forbidden("CONDICAO_SEM_PERMISSAO", "Somente o controlador do personagem ou o mestre pode remover esta condição."));
                condition.Status = MesaCondicaoStatus.Removida;
                condition.RemovidaEmUtc = scope.Now;
                condition.MotivoRemocao = string.IsNullOrWhiteSpace(request.Motivo) ? "Remoção manual" : request.Motivo.Trim();
                StartConditionCooldown(scope, condition);
                ApplyResourceLimitEffects(scope, participant);
                return Task.FromResult(Mutation("CONDICAO_REMOVIDA", condition.NomeSnapshot, $"Condição removida de {participant.NomeSnapshot}.", participant));
            }, cancellationToken);

    public Task<GameplayOperationResult<GameplayCombatCommandResponseDto>> ApplyRestAsync(
        int idMesa, long idMesaSessao, int idUsuario, GameplayRestApplyRequestDto request,
        CancellationToken cancellationToken = default)
        => ExecuteAsync(idMesa, idMesaSessao, idUsuario, request, "DESCANSO_APLICAR", false, false,
            async (scope, token) =>
            {
                PersonagemJogador? character = await _context.PersonagemJogadores.FirstOrDefaultAsync(
                    item => item.IdpersonagemJogador == request.IdPersonagemJogador && item.Idmesa == idMesa,
                    token);
                if (character is null)
                    return Invalid("PERSONAGEM_NAO_ENCONTRADO", "Personagem não encontrado nesta Mesa.");
                if (!scope.IsMaster && character.Idusuario != idUsuario)
                    return Forbidden("DESCANSO_SEM_PERMISSAO", "Somente o dono do personagem ou o mestre pode aplicar o descanso.");
                if (character.RevisaoRuntime != request.RevisaoPersonagemEsperada)
                    return Conflict("REVISAO_PERSONAGEM_DESATUALIZADA", "A ficha mudou. Recarregue antes de aplicar o descanso.");
                SistemaDescansoConfig? rest = scope.Version.Descansos.FirstOrDefault(item => item.IdSistemaDescansoConfig == request.IdSistemaDescansoConfig);
                if (rest is null)
                    return Invalid("DESCANSO_NAO_PUBLICADO", "Este descanso não pertence à versão publicada da sessão.");
                if (rest.ExigeGuarda && !request.GuardaConfirmada)
                    return Invalid("GUARDA_NAO_CONFIRMADA", "Confirme a guarda exigida pela regra deste descanso.");
                if (rest.TipoRecuperacao == SistemaRecuperacaoTipo.Formula)
                    return Invalid("DESCANSO_ASSISTIDO", "A recuperação deste descanso usa uma fórmula narrativa e precisa ser aplicada manualmente pelo mestre.");
                var applications = new List<GameplayEffectApplicationDto>();
                MesaCombateParticipante? participant = null;
                if (scope.Combat is not null)
                {
                    participant = scope.Combat.Participantes.FirstOrDefault(item =>
                        item.IdPersonagemJogador == character.IdpersonagemJogador);
                    if (participant is not null)
                    {
                        bool normalOrLong = Normalize(rest.Tipo) is "NORMAL" or "LONGO";
                        foreach (MesaCondicaoAtiva condition in scope.Combat.Condicoes.Where(item =>
                                     item.IdParticipante == participant.IdMesaCombateParticipante &&
                                     item.Status == MesaCondicaoStatus.Ativa &&
                                     ((item.UnidadeDuracao == SistemaUnidadeDuracao.Descanso &&
                                       Normalize(item.CodigoSnapshot) != "FADIGA") ||
                                      (normalOrLong && Normalize(item.CodigoSnapshot) == "FADIGA"))).ToList())
                        {
                            condition.Status = MesaCondicaoStatus.Expirada;
                            condition.RemovidaEmUtc = scope.Now;
                            condition.MotivoRemocao = $"{rest.Nome} concluído";
                            StartConditionCooldown(scope, condition);
                        }
                        ApplyResourceLimitEffects(scope, participant);
                    }
                }
                foreach ((string code, decimal value) in new[]
                {
                    ("VIDA", rest.RecuperacaoVida), ("MANA", rest.RecuperacaoMana), ("ESTAMINA", rest.RecuperacaoEstamina),
                })
                {
                    if (value <= 0) continue;
                    if (scope.Combat is not null && participant is not null &&
                        GameplayConditionRuntime.BlocksRecovery(scope.Combat, participant, scope.Version, code))
                        continue;
                    GameplayEffectApplicationDto? application = RecoverResource(character, code, value, rest.TipoRecuperacao);
                    if (application is not null && application.ValorAplicado != 0) applications.Add(application);
                }
                if (applications.Count > 0)
                {
                    character.RevisaoRuntime++;
                    scope.ChangedCharacterIds.Add(character.IdpersonagemJogador);
                }
                if (participant is not null)
                    SynchronizeParticipantRuleState(scope, participant, idUsuario);
                GameplayEffectApplicationDto? summary = applications.FirstOrDefault();
                return Mutation(
                    "DESCANSO_APLICADO",
                    rest.Nome,
                    $"Recuperação confirmada para {character.Nome}.",
                    characterId: character.IdpersonagemJogador,
                    application: summary,
                    applications: applications);
            }, cancellationToken);

    public Task<GameplayOperationResult<GameplayCombatCommandResponseDto>> RollSurvivalAsync(
        int idMesa, long idMesaSessao, int idUsuario, GameplaySurvivalRollRequestDto request,
        CancellationToken cancellationToken = default)
        => ExecuteAsync(idMesa, idMesaSessao, idUsuario, request, "SOBREVIVENCIA_ROLAR", false, true,
            (scope, _) =>
            {
                MesaCombateParticipante? participant = scope.Combat!.Participantes.FirstOrDefault(item => item.IdMesaCombateParticipante == request.IdParticipante);
                if (participant is null)
                    return Task.FromResult(Invalid("PARTICIPANTE_NAO_ENCONTRADO", "Participante não encontrado."));
                if (!scope.IsMaster && participant.IdUsuarioControlador != idUsuario)
                    return Task.FromResult(Forbidden("SOBREVIVENCIA_SEM_PERMISSAO", "Somente o controlador do personagem ou o mestre pode resolver a sobrevivência."));
                SistemaMorteConfig? death = scope.Version.Morte;
                if (death is null)
                    return Task.FromResult(Invalid("MORTE_NAO_CONFIGURADA", "A versão da sessão não possui regra de morte publicada."));
                if (participant.Status != MesaCombateParticipanteStatus.ABeiraDaMorte)
                    return Task.FromResult(Invalid("SOBREVIVENCIA_INDISPONIVEL", "Este participante não está à beira da morte."));
                if (request.EstabilizacaoManual)
                {
                    if (!death.PermiteEstabilizacaoManual || !scope.IsMaster)
                        return Task.FromResult(Forbidden("ESTABILIZACAO_NAO_PERMITIDA", "A estabilização manual exige permissão da regra e confirmação do mestre."));
                    participant.Status = MesaCombateParticipanteStatus.Estabilizado;
                    return Task.FromResult(Mutation("PERSONAGEM_ESTABILIZADO", "Estabilização", $"{participant.NomeSnapshot} foi estabilizado pelo mestre.", participant));
                }
                int? faces = SistemaRpgConfiguration.ObterFacesDado(death.DadoSobrevivencia);
                if (!faces.HasValue)
                    return Task.FromResult(Invalid("DADO_SOBREVIVENCIA_INVALIDO", "O dado de sobrevivência publicado é inválido."));
                int natural = _diceRoller.Roll(1, faces.Value)[0];
                bool success = natural >= death.ResultadoMinimoSucesso;
                if (success) participant.SucessosSobrevivencia++;
                else participant.FalhasSobrevivencia++;
                int failureLimit = Math.Max(1, death.QuantidadeTestesCombate - death.SucessosNecessarios + 1);
                if (participant.SucessosSobrevivencia >= death.SucessosNecessarios)
                    participant.Status = MesaCombateParticipanteStatus.Estabilizado;
                else if (participant.FalhasSobrevivencia >= failureLimit)
                    participant.Status = MesaCombateParticipanteStatus.Morto;
                else
                    participant.Status = MesaCombateParticipanteStatus.ABeiraDaMorte;
                GameplayRollResultDto roll = SurvivalRoll(death, natural, success, participant);
                return Task.FromResult(Mutation(
                    "SOBREVIVENCIA_ROLADA", "Teste de sobrevivência",
                    success ? $"{participant.NomeSnapshot} obteve um sucesso." : $"{participant.NomeSnapshot} sofreu uma falha.",
                    participant, roll));
            }, cancellationToken);

    private async Task<GameplayOperationResult<GameplayCombatCommandResponseDto>> ExecuteAsync<TRequest>(
        int idMesa,
        long idMesaSessao,
        int idUsuario,
        TRequest request,
        string commandType,
        bool masterOnly,
        bool requireCombat,
        Func<CommandScope, CancellationToken, Task<GameplayOperationResult<CombatMutation>>> mutate,
        CancellationToken cancellationToken)
        where TRequest : GameplayCombatCommandRequestDto
    {
        if (request.ChaveIdempotencia == Guid.Empty)
            return Fail<GameplayCombatCommandResponseDto>(GameplayOperationError.Validacao, "CHAVE_OBRIGATORIA", "A chave da ação é obrigatória.");
        string hash = HashPayload(request);
        bool notify = false;
        var changedCharacterIds = new HashSet<int>();
        GameplayOperationResult<GameplayCombatCommandResponseDto> result;
        try
        {
            var strategy = _context.Database.CreateExecutionStrategy();
            result = await strategy.ExecuteAsync(async () =>
            {
                _context.ChangeTracker.Clear();
                await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
                try
                {
                    Mesa? mesa = await _context.Mesas
                        .FromSqlInterpolated($"SELECT * FROM `mesas` WHERE `IDMesa` = {idMesa} FOR UPDATE")
                        .SingleOrDefaultAsync(cancellationToken);
                    if (mesa is null || mesa.PadraoSistema)
                        return Fail<GameplayCombatCommandResponseDto>(GameplayOperationError.NaoEncontrado, "MESA_NAO_ENCONTRADA", "Mesa não encontrada.");
                    if (!await CanAccessAsync(idMesa, idUsuario, cancellationToken))
                        return Fail<GameplayCombatCommandResponseDto>(GameplayOperationError.Proibido, "MESA_SEM_ACESSO", "Você não participa desta Mesa.");
                    bool isMaster = mesa.IdusuarioCriacao == idUsuario;
                    if (masterOnly && !isMaster)
                        return Fail<GameplayCombatCommandResponseDto>(GameplayOperationError.Proibido, "ACAO_EXIGE_MESTRE", "Esta ação só pode ser executada pelo mestre.");
                    string key = request.ChaveIdempotencia.ToString("D");
                    MesaComando? previous = await _context.MesaComandos.AsNoTracking().FirstOrDefaultAsync(item =>
                        item.IdMesa == idMesa && item.IdUsuarioAtor == idUsuario && item.ChaveIdempotencia == key,
                        cancellationToken);
                    if (previous is not null)
                    {
                        if (!CryptographicOperations.FixedTimeEquals(Convert.FromHexString(previous.HashPayload), Convert.FromHexString(hash)))
                            return Fail<GameplayCombatCommandResponseDto>(GameplayOperationError.Conflito, "CHAVE_REUTILIZADA", "Esta chave já foi usada por outra ação.");
                        GameplayCombatCommandResponseDto? replay = JsonSerializer.Deserialize<GameplayCombatCommandResponseDto>(previous.RespostaJson, JsonOptions);
                        if (replay is null)
                            return Fail<GameplayCombatCommandResponseDto>(GameplayOperationError.Conflito, "RESPOSTA_IDEMPOTENTE_INVALIDA", "Não foi possível recuperar a ação anterior.");
                        await transaction.CommitAsync(cancellationToken);
                        return GameplayOperationResult<GameplayCombatCommandResponseDto>.Ok(CopyReplay(replay));
                    }
                    if (mesa.IdMesaSessaoAtiva != idMesaSessao)
                        return Fail<GameplayCombatCommandResponseDto>(GameplayOperationError.Conflito, "SESSAO_NAO_ATIVA", "Esta sessão não está mais ativa.");
                    MesaSessao? session = await _context.MesaSessoes
                        .FromSqlInterpolated($"SELECT * FROM `mesasessoes` WHERE `IDMesaSessao` = {idMesaSessao} FOR UPDATE")
                        .SingleOrDefaultAsync(cancellationToken);
                    if (session is null || session.Status != MesaSessaoStatus.Ativa || session.IdMesa != idMesa)
                        return Fail<GameplayCombatCommandResponseDto>(GameplayOperationError.Conflito, "SESSAO_NAO_ATIVA", "Esta sessão não está mais ativa.");
                    if (request.RevisaoSessaoEsperada.HasValue && request.RevisaoSessaoEsperada != session.RevisaoEstado)
                        return Fail<GameplayCombatCommandResponseDto>(GameplayOperationError.Conflito, "REVISAO_SESSAO_DESATUALIZADA", "A sessão mudou. Recarregue antes de continuar.");
                    MesaCombate? combat = await LoadCombatForUpdateAsync(idMesaSessao, cancellationToken);
                    if (requireCombat && combat is null)
                        return Fail<GameplayCombatCommandResponseDto>(GameplayOperationError.Conflito, "COMBATE_NAO_INICIADO", "Prepare o combate antes de continuar.");
                    if (!requireCombat && commandType == "COMBATE_INICIAR" && combat is not null)
                        return Fail<GameplayCombatCommandResponseDto>(GameplayOperationError.Conflito, "COMBATE_JA_EXISTE", "Já existe um combate aberto nesta sessão.");
                    if (request.RevisaoCombateEsperada.HasValue && combat is not null && request.RevisaoCombateEsperada != combat.Revisao)
                        return Fail<GameplayCombatCommandResponseDto>(GameplayOperationError.Conflito, "REVISAO_COMBATE_DESATUALIZADA", "O combate mudou. Recarregue antes de continuar.");
                    SistemaVersao? version = await LoadVersionAsync(session.IdSistemaVersao, cancellationToken);
                    if (version is null)
                        return Fail<GameplayCombatCommandResponseDto>(GameplayOperationError.Conflito, "VERSAO_NAO_ENCONTRADA", "A versão da sessão não está disponível.");

                    DateTime now = DateTime.UtcNow;
                    var scope = new CommandScope(mesa, session, combat, version, isMaster, now);
                    GameplayOperationResult<CombatMutation> mutationResult = await mutate(scope, cancellationToken);
                    if (!mutationResult.Sucesso || mutationResult.Dados is null)
                        return ConvertFailure<CombatMutation, GameplayCombatCommandResponseDto>(mutationResult);
                    CombatMutation mutation = mutationResult.Dados;
                    combat = scope.Combat;
                    if (combat is not null) combat.Revisao++;
                    session.RevisaoEstado++;
                    session.UltimaSequenciaEvento++;
                    var command = new MesaComando
                    {
                        IdMesa = idMesa,
                        IdMesaSessao = idMesaSessao,
                        ChaveIdempotencia = key,
                        HashPayload = hash,
                        IdUsuarioAtor = idUsuario,
                        IdPersonagemJogador = mutation.CharacterId ?? mutation.Participant?.IdPersonagemJogador,
                        Tipo = commandType,
                        RevisaoSessaoEsperada = request.RevisaoSessaoEsperada,
                        Status = MesaComandoStatus.Concluido,
                        RespostaJson = "{}",
                        CriadoEmUtc = now,
                        ConcluidoEmUtc = now,
                    };
                    _context.MesaComandos.Add(command);
                    await _context.SaveChangesAsync(cancellationToken);
                    var eventData = new
                    {
                        schemaVersion = 1,
                        titulo = mutation.Title,
                        descricao = mutation.Description,
                        manual = false,
                        idMesaCombate = combat?.IdMesaCombate,
                        rodada = combat?.RodadaAtual,
                        turno = combat?.IndiceTurnoAtual,
                        rolagem = mutation.Roll,
                        aplicacao = mutation.Application,
                        aplicacoes = mutation.Applications,
                        participante = mutation.Participant is null ? null : new
                        {
                            idParticipante = mutation.Participant.IdMesaCombateParticipante,
                            idPersonagemJogador = mutation.Participant.IdPersonagemJogador,
                            status = mutation.Participant.Status.ToString(),
                            sucessosSobrevivencia = mutation.Participant.SucessosSobrevivencia,
                            falhasSobrevivencia = mutation.Participant.FalhasSobrevivencia,
                        },
                    };
                    var gameplayEvent = new MesaEvento
                    {
                        IdMesaSessao = idMesaSessao,
                        IdMesaComando = command.IdMesaComando,
                        Sequencia = session.UltimaSequenciaEvento,
                        Tipo = mutation.EventType,
                        Origem = GameplayEventOrigin.Automatica,
                        Visibilidade = GameplayEventVisibility.PublicaMesa,
                        IdUsuarioAtor = idUsuario,
                        IdPersonagemJogador = mutation.CharacterId ?? mutation.Participant?.IdPersonagemJogador,
                        IdParticipanteCombate = mutation.Participant?.IdMesaCombateParticipante,
                        IdSistemaRpg = version.IdSistemaRpg,
                        IdSistemaVersaoEfetiva = version.IdSistemaVersao,
                        IdSistemaVersaoPersonagem = mutation.Participant?.PersonagemJogador?.IdSistemaVersao,
                        CodigoRegra = mutation.EventType,
                        DadosJson = JsonSerializer.Serialize(eventData, JsonOptions),
                        OcorreuEmUtc = now,
                    };
                    _context.MesaEventos.Add(gameplayEvent);
                    await _context.SaveChangesAsync(cancellationToken);
                    if (mutation.Roll is not null)
                    {
                        _context.MesaRolagens.Add(ToRollEntity(gameplayEvent.IdMesaEvento, mutation.Roll));
                        await _context.SaveChangesAsync(cancellationToken);
                    }
                    GameplayCombatSnapshotDto? snapshot = combat is null ? null : MapCombat(combat, version, idUsuario, isMaster);
                    var response = new GameplayCombatCommandResponseDto
                    {
                        IdMesaSessao = idMesaSessao,
                        RevisaoSessao = session.RevisaoEstado,
                        IdEvento = gameplayEvent.IdMesaEvento,
                        Combate = snapshot,
                        Rolagem = mutation.Roll,
                        Aplicacao = mutation.Application,
                        Aplicacoes = mutation.Applications,
                    };
                    command.RespostaJson = JsonSerializer.Serialize(response, JsonOptions);
                    await _context.SaveChangesAsync(cancellationToken);
                    await transaction.CommitAsync(cancellationToken);
                    notify = true;
                    if (mutation.CharacterId.HasValue)
                        changedCharacterIds.Add(mutation.CharacterId.Value);
                    changedCharacterIds.UnionWith(scope.ChangedCharacterIds);
                    return GameplayOperationResult<GameplayCombatCommandResponseDto>.Ok(response);
                }
                catch
                {
                    await transaction.RollbackAsync(cancellationToken);
                    throw;
                }
            });
        }
        catch (DbUpdateConcurrencyException)
        {
            return Fail<GameplayCombatCommandResponseDto>(GameplayOperationError.Conflito, "CONCORRENCIA_COMBATE", "O combate mudou. Recarregue e tente novamente.");
        }
        catch (DbUpdateException)
        {
            return Fail<GameplayCombatCommandResponseDto>(GameplayOperationError.Conflito, "CONFLITO_COMANDO", "A ação já foi processada ou o estado mudou.");
        }
        if (notify)
        {
            await _realtime.NotificarMesaAlteradaAsync(idMesa, cancellationToken);
            foreach (int changedCharacterId in changedCharacterIds)
                await _realtime.NotificarPersonagemAlteradoAsync(idMesa, changedCharacterId, cancellationToken);
        }
        return result;
    }

    private async Task<MesaCombate?> LoadCombatAsync(long idMesaSessao, bool tracking, CancellationToken token)
    {
        IQueryable<MesaCombate> query = _context.MesaCombates
            .Include(item => item.Participantes).ThenInclude(item => item.PersonagemJogador)
            .Include(item => item.Condicoes)
            .Include(item => item.Cooldowns)
            .Where(item => item.IdMesaSessao == idMesaSessao && item.Status != MesaCombateStatus.Encerrado);
        if (!tracking) query = query.AsNoTracking();
        return await query.SingleOrDefaultAsync(token);
    }

    private async Task<MesaCombate?> LoadCombatForUpdateAsync(long idMesaSessao, CancellationToken token)
    {
        MesaCombate? combat = await _context.MesaCombates
            .FromSqlInterpolated($"SELECT * FROM `mesacombates` WHERE `IDMesaSessao` = {idMesaSessao} AND `Status` <> 'Encerrado' FOR UPDATE")
            .SingleOrDefaultAsync(token);
        if (combat is null) return null;
        await _context.Entry(combat).Collection(item => item.Participantes).Query()
            .Include(item => item.PersonagemJogador).LoadAsync(token);
        await _context.Entry(combat).Collection(item => item.Condicoes).LoadAsync(token);
        await _context.Entry(combat).Collection(item => item.Cooldowns).LoadAsync(token);
        return combat;
    }

    private Task<SistemaVersao?> LoadVersionAsync(int idSistemaVersao, CancellationToken token)
        => _context.SistemaVersoes.AsNoTracking()
            .Include(item => item.SistemaRpg)
            .Include(item => item.Modulos)
            .Include(item => item.Condicoes)
            .Include(item => item.Descansos)
            .Include(item => item.Morte)
            .Include(item => item.Recursos)
            .FirstOrDefaultAsync(item => item.IdSistemaVersao == idSistemaVersao, token);

    private Task<bool> CanAccessAsync(int idMesa, int idUsuario, CancellationToken token)
        => _context.Mesas.AnyAsync(mesa => mesa.Idmesa == idMesa && !mesa.PadraoSistema &&
            (mesa.IdusuarioCriacao == idUsuario || _context.Mesausuarios.Any(link => link.Idmesa == idMesa && link.Idusuario == idUsuario)), token);

    private GameplayCombatSnapshotDto MapCombat(MesaCombate combat, SistemaVersao version, int userId, bool isMaster)
    {
        string formula = SistemaRpgConfiguration.LerRegras<SistemaRpgConfiguration.RegrasCombate>(version, SistemaModuloTipo.Combate).FormulaIniciativa ?? string.Empty;
        return new GameplayCombatSnapshotDto
        {
            IdMesaCombate = combat.IdMesaCombate,
            IdMesaSessao = combat.IdMesaSessao,
            Status = combat.Status,
            RodadaAtual = combat.RodadaAtual,
            IndiceTurnoAtual = combat.IndiceTurnoAtual,
            IdParticipanteAtual = combat.IdParticipanteAtual,
            Revisao = combat.Revisao,
            PodeGerenciar = isMaster,
            FormulaIniciativa = formula,
            Participantes = combat.Participantes.OrderBy(item => item.Ordem).ThenByDescending(item => item.Iniciativa).Select(item => new GameplayCombatParticipantDto
            {
                IdParticipante = item.IdMesaCombateParticipante,
                Tipo = item.Tipo,
                Status = item.Status,
                IdPersonagemJogador = item.IdPersonagemJogador,
                IdUsuarioControlador = item.IdUsuarioControlador,
                Nome = item.NomeSnapshot,
                Imagem = item.ImagemSnapshot,
                ModificadorIniciativa = item.ModificadorIniciativa,
                Iniciativa = item.Iniciativa,
                ValorNaturalIniciativa = item.ValorNaturalIniciativa,
                Ordem = item.Ordem,
                PodeRolarIniciativa = combat.Status == MesaCombateStatus.Preparacao && !item.Iniciativa.HasValue && (isMaster || item.IdUsuarioControlador == userId),
                PodeControlar = isMaster || item.IdUsuarioControlador == userId,
                SucessosSobrevivencia = item.SucessosSobrevivencia,
                FalhasSobrevivencia = item.FalhasSobrevivencia,
            }).ToArray(),
            Condicoes = combat.Condicoes.Where(item => item.Status == MesaCondicaoStatus.Ativa).Select(item =>
            {
                string? removal = null;
                try { removal = JsonNode.Parse(item.RegraSnapshotJson)?["regraRemocao"]?.GetValue<string>(); } catch (JsonException) { }
                return new GameplayActiveConditionDto
                {
                    IdCondicaoAtiva = item.IdMesaCondicaoAtiva,
                    IdParticipante = item.IdParticipante,
                    Codigo = item.CodigoSnapshot,
                    Nome = item.NomeSnapshot,
                    Status = item.Status,
                    Acumulos = item.Acumulos,
                    Valor = item.Valor,
                    Duracao = item.Duracao,
                    UnidadeDuracao = item.UnidadeDuracao,
                    TurnosRestantes = item.TurnosRestantes,
                    CooldownTurnos = item.CooldownTurnos,
                    RegraRemocao = removal,
                };
            }).ToArray(),
            Cooldowns = combat.Cooldowns.Where(item => item.Status == MesaCooldownStatus.Ativo).Select(item => new GameplayCooldownDto
            {
                IdCooldown = item.IdMesaCooldownAtivo,
                IdParticipante = item.IdParticipante,
                TipoOrigem = item.TipoOrigem,
                IdOrigem = item.IdOrigem,
                Nome = item.NomeSnapshot,
                TurnosRestantes = item.TurnosRestantes,
            }).ToArray(),
            CatalogoCondicoes = MapConditionCatalog(version),
            CatalogoDescansos = MapRestCatalog(version),
        };
    }

    private static IReadOnlyList<GameplayConditionCatalogItemDto> MapConditionCatalog(SistemaVersao version)
        => version.Condicoes.OrderBy(item => item.Ordem).Select(item => new GameplayConditionCatalogItemDto
        {
            IdSistemaCondicao = item.IdSistemaCondicao,
            Codigo = item.Codigo,
            Nome = item.Nome,
            Descricao = item.Descricao,
            Tipo = item.Tipo,
            DuracaoPadrao = item.DuracaoPadrao,
            UnidadeDuracao = item.UnidadeDuracao,
            Empilhavel = item.Empilhavel,
            PermiteSobrescrever = item.PermiteSobrescrever,
            ValorPadrao = item.ValorPadrao,
            CodigoRecurso = item.CodigoRecurso,
            OperacaoEfeito = item.OperacaoEfeito,
            ValorEfeito = item.ValorEfeito,
            MomentoEfeito = item.MomentoEfeito,
            CooldownTurnos = item.CooldownTurnos,
            RegraRemocao = item.RegraRemocao,
        }).ToArray();

    private static IReadOnlyList<GameplayRestCatalogItemDto> MapRestCatalog(SistemaVersao version)
        => version.Descansos.OrderBy(item => item.Ordem).Select(item => new GameplayRestCatalogItemDto
        {
            IdSistemaDescansoConfig = item.IdSistemaDescansoConfig,
            Tipo = item.Tipo,
            Nome = item.Nome,
            DuracaoMinimaMinutos = item.DuracaoMinimaMinutos,
            RecuperacaoVida = item.RecuperacaoVida,
            RecuperacaoMana = item.RecuperacaoMana,
            RecuperacaoEstamina = item.RecuperacaoEstamina,
            TipoRecuperacao = item.TipoRecuperacao,
            ExigeGuarda = item.ExigeGuarda,
            PermiteAtividades = item.PermiteAtividades,
        }).ToArray();

    private static void SynchronizeParticipantRuleState(
        CommandScope scope,
        MesaCombateParticipante participant,
        int idUsuario)
    {
        PersonagemJogador? character = participant.PersonagemJogador;
        if (character is null || scope.Combat is null) return;
        GameplayConditionSynchronizationResult result = GameplayConditionRuntime.SynchronizeState(
            character,
            scope.Combat,
            participant,
            scope.Version,
            idUsuario,
            scope.Now);
        if (!result.CharacterStateChanged) return;
        character.RevisaoRuntime++;
        scope.ChangedCharacterIds.Add(character.IdpersonagemJogador);
    }

    private static void StartConditionCooldown(CommandScope scope, MesaCondicaoAtiva condition)
    {
        if (scope.Combat is null || condition.CooldownTurnos is not > 0) return;
        MesaCooldownAtivo? current = scope.Combat.Cooldowns.FirstOrDefault(item =>
            item.IdParticipante == condition.IdParticipante &&
            item.TipoOrigem == "CONDICAO" &&
            item.IdOrigem == condition.CodigoSnapshot &&
            item.Status == MesaCooldownStatus.Ativo);
        if (current is not null)
        {
            current.TurnosRestantes = Math.Max(current.TurnosRestantes, condition.CooldownTurnos.Value);
            return;
        }
        scope.Combat.Cooldowns.Add(new MesaCooldownAtivo
        {
            IdMesaCombate = scope.Combat.IdMesaCombate,
            IdParticipante = condition.IdParticipante,
            TipoOrigem = "CONDICAO",
            IdOrigem = condition.CodigoSnapshot,
            NomeSnapshot = condition.NomeSnapshot,
            TurnosRestantes = condition.CooldownTurnos.Value,
            RodadaInicio = scope.Combat.RodadaAtual,
            TurnoInicio = scope.Combat.IndiceTurnoAtual,
            CriadoEmUtc = scope.Now,
        });
    }

    private static bool TryReadResource(PersonagemJogador character, string code, out int value)
    {
        JsonObject root = ParseObject(character.StatusJson);
        JsonObject? status = root[FindKey(root, "status") ?? string.Empty] as JsonObject;
        string? field = status is null ? null : FindKey(status, Normalize(code).ToLowerInvariant());
        value = field is null ? 0 : ReadInt(status![field]);
        return field is not null;
    }

    private IReadOnlyList<GameplayEffectApplicationDto> ProcessTurnEffects(
        CommandScope scope,
        MesaCombateParticipante participant,
        string moment)
    {
        var applications = new List<GameplayEffectApplicationDto>();
        foreach (MesaCondicaoAtiva condition in scope.Combat!.Condicoes.Where(item =>
                     item.IdParticipante == participant.IdMesaCombateParticipante && item.Status == MesaCondicaoStatus.Ativa).ToList())
        {
            SistemaCondicao? rule = scope.Version.Condicoes.FirstOrDefault(item => item.IdSistemaCondicao == condition.IdSistemaCondicao);
            if (rule is not null && Normalize(rule.MomentoEfeito) == moment)
            {
                GameplayEffectApplicationDto? application = ApplyConditionResourceEffect(scope, participant, condition, rule);
                if (application is not null) applications.Add(application);
            }
            if (moment == "FIM_TURNO" && condition.UnidadeDuracao == SistemaUnidadeDuracao.Turno && condition.TurnosRestantes.HasValue)
            {
                condition.TurnosRestantes--;
                if (condition.TurnosRestantes <= 0)
                {
                    condition.Status = MesaCondicaoStatus.Expirada;
                    condition.RemovidaEmUtc = scope.Now;
                    condition.MotivoRemocao = "Duração encerrada";
                    StartConditionCooldown(scope, condition);
                }
            }
        }
        if (moment == "FIM_TURNO")
        {
            foreach (MesaCooldownAtivo cooldown in scope.Combat.Cooldowns.Where(item =>
                         item.IdParticipante == participant.IdMesaCombateParticipante && item.Status == MesaCooldownStatus.Ativo).ToList())
            {
                cooldown.TurnosRestantes--;
                if (cooldown.TurnosRestantes <= 0)
                {
                    cooldown.Status = MesaCooldownStatus.Encerrado;
                    cooldown.EncerradoEmUtc = scope.Now;
                }
            }
        }
        ApplyResourceLimitEffects(scope, participant);
        return applications;
    }

    private static GameplayEffectApplicationDto? ApplyConditionResourceEffect(
        CommandScope scope,
        MesaCombateParticipante participant,
        MesaCondicaoAtiva condition,
        SistemaCondicao rule,
        bool multiplyStacks = true)
    {
        PersonagemJogador? character = participant.PersonagemJogador;
        decimal? configuredValue = condition.Valor ?? rule.ValorEfeito;
        if (character is null || string.IsNullOrWhiteSpace(rule.CodigoRecurso) || !configuredValue.HasValue) return null;
        int multiplier = multiplyStacks ? Math.Max(1, condition.Acumulos) : 1;
        int value = decimal.ToInt32(decimal.Truncate(configuredValue.Value * multiplier));
        if (value == 0 || !TryReadResource(character, rule.CodigoRecurso, out int previous)) return null;
        MutateResource(character, rule.CodigoRecurso, rule.OperacaoEfeito, value, scope.Version);
        if (!TryReadResource(character, rule.CodigoRecurso, out int current)) return null;
        character.RevisaoRuntime++;
        scope.ChangedCharacterIds.Add(character.IdpersonagemJogador);
        return new GameplayEffectApplicationDto
        {
            CodigoEfeito = $"CONDICAO_{Normalize(condition.CodigoSnapshot)}",
            IdPersonagemAlvo = character.IdpersonagemJogador,
            RevisaoPersonagem = character.RevisaoRuntime,
            Campo = Normalize(rule.CodigoRecurso).ToLowerInvariant(),
            Tipo = "CONDICAO",
            ValorAnterior = previous,
            ValorAplicado = current - previous,
            ValorAtual = current,
        };
    }

    private static void ApplyResourceLimitEffects(CommandScope scope, MesaCombateParticipante participant)
    {
        if (scope.Combat is null || participant.PersonagemJogador is not { } character) return;
        if (!GameplayConditionRuntime.ApplyActiveResourceLimits(character, scope.Combat, participant, scope.Version)) return;
        character.RevisaoRuntime++;
        scope.ChangedCharacterIds.Add(character.IdpersonagemJogador);
    }

    private static GameplayEffectApplicationDto? RecoverResource(
        PersonagemJogador character,
        string resource,
        decimal configured,
        SistemaRecuperacaoTipo type)
    {
        JsonObject root = ParseObject(character.StatusJson);
        JsonObject status = GetOrCreate(root, "status");
        string field = FindKey(status, resource.ToLowerInvariant()) ?? resource.ToLowerInvariant();
        int previous = ReadInt(status[field]);
        string maximumField = FindKey(status, $"{field}Maxima") ?? FindKey(status, $"{field}Maximo") ?? string.Empty;
        int maximum = maximumField.Length > 0 ? ReadInt(status[maximumField]) : int.MaxValue;
        int delta = type == SistemaRecuperacaoTipo.Percentual
            ? decimal.ToInt32(decimal.Floor(maximum * configured / 100m))
            : decimal.ToInt32(decimal.Truncate(configured));
        int current = Math.Min(maximum, checked(previous + Math.Max(0, delta)));
        status[field] = current;
        character.StatusJson = root.ToJsonString();
        return new GameplayEffectApplicationDto
        {
            CodigoEfeito = $"DESCANSO_{resource}",
            IdPersonagemAlvo = character.IdpersonagemJogador,
            RevisaoPersonagem = character.RevisaoRuntime + 1,
            Campo = field,
            Tipo = "DESCANSO",
            ValorAnterior = previous,
            ValorAplicado = current - previous,
            ValorAtual = current,
        };
    }

    private static void MutateResource(PersonagemJogador character, string resourceCode, string? operation, int value, SistemaVersao version)
    {
        JsonObject root = ParseObject(character.StatusJson);
        JsonObject status = GetOrCreate(root, "status");
        string preferred = Normalize(resourceCode).ToLowerInvariant();
        string field = FindKey(status, preferred) ?? preferred;
        int previous = ReadInt(status[field]);
        int current = Normalize(operation) switch
        {
            "SOMAR" => checked(previous + value),
            "DEFINIR" => value,
            _ => checked(previous - value),
        };
        SistemaRecursoConfig? resource = version.Recursos.FirstOrDefault(item => Normalize(item.Codigo) == Normalize(resourceCode));
        int minimum = resource?.PermiteValorNegativo == true ? decimal.ToInt32(resource.ValorMinimo) : 0;
        string maxField = FindKey(status, $"{preferred}Maxima") ?? FindKey(status, $"{preferred}Maximo") ?? string.Empty;
        int? maximum = maxField.Length > 0 ? ReadInt(status[maxField]) : resource?.ValorMaximo is decimal max ? decimal.ToInt32(max) : null;
        current = Math.Max(minimum, current);
        if (maximum.HasValue) current = Math.Min(maximum.Value, current);
        status[field] = current;
        character.StatusJson = root.ToJsonString();
    }

    private static InitiativePlan? BuildInitiativePlan(SistemaVersao version, MesaCombateParticipante participant)
    {
        string formula = SistemaRpgConfiguration.LerRegras<SistemaRpgConfiguration.RegrasCombate>(version, SistemaModuloTipo.Combate).FormulaIniciativa ?? string.Empty;
        Match dice = DiceExpressionRegex().Match(formula);
        if (!dice.Success || !int.TryParse(dice.Groups["faces"].Value, out int faces) || faces is < 2 or > 1000)
            return null;
        int quantity = int.TryParse(dice.Groups["quantity"].Value, out int parsed) ? parsed : 1;
        if (quantity is < 1 or > 100) return null;
        int modifier = participant.ModificadorIniciativa;
        if (participant.PersonagemJogador is not null)
        {
            foreach (string identifier in IdentifierRegex().Matches(formula).Select(match => match.Value))
            {
                string code = Normalize(identifier);
                if (code is "D" or "MODIFICADORES") continue;
                if (TryReadAttribute(participant.PersonagemJogador.StatusJson, code, out int value))
                    modifier = checked(modifier + value);
            }
        }
        foreach (Match number in SignedConstantRegex().Matches(DiceExpressionRegex().Replace(formula, string.Empty)))
            if (int.TryParse(number.Value.Replace(" ", string.Empty), out int constant)) modifier = checked(modifier + constant);
        return new InitiativePlan(formula, quantity, faces, modifier);
    }

    private static bool TryReadAttribute(string statusJson, string code, out int value)
    {
        value = 0;
        try
        {
            JsonObject root = ParseObject(statusJson);
            JsonObject? attributes = root[FindKey(root, "atributos") ?? string.Empty] as JsonObject;
            foreach (string group in new[] { "principais", "secundarios" })
            {
                JsonObject? entries = attributes?[FindKey(attributes, group) ?? string.Empty] as JsonObject;
                if (entries is null) continue;
                foreach ((string key, JsonNode? node) in entries)
                {
                    if (Normalize(key) == code)
                    {
                        value = ReadInt(node);
                        return true;
                    }
                }
            }
        }
        catch (JsonException) { }
        return false;
    }

    private static GameplayRollResultDto InitiativeRoll(
        InitiativePlan plan,
        IReadOnlyList<int> values,
        int natural,
        int total,
        MesaCombateParticipante participant) => new()
    {
        Expressao = plan.Expression,
        Grupos = new[] { new GameplayDiceGroupResultDto
        {
            Quantidade = plan.Quantity,
            Faces = plan.Faces,
            Valores = values,
            IndicesMantidos = Enumerable.Range(0, values.Count).ToArray(),
        } },
        ValorNatural = natural,
        Modificador = plan.Modifier,
        Subtotal = natural,
        Total = total,
        CodigoResultado = "INICIATIVA",
        NomeResultado = "Iniciativa",
        Modo = GameplayRollMode.Normal,
        OrigemAcao = new GameplayActionSnapshotDto
        {
            Tipo = "INICIATIVA",
            IdPersonagemJogador = participant.IdPersonagemJogador,
            IdInstancia = participant.IdMesaCombateParticipante.ToString(CultureInfo.InvariantCulture),
            Nome = participant.NomeSnapshot,
            Valores = new Dictionary<string, string> { ["formula"] = plan.Expression },
        },
    };

    private static GameplayRollResultDto SurvivalRoll(SistemaMorteConfig config, int natural, bool success, MesaCombateParticipante participant) => new()
    {
        Expressao = config.DadoSobrevivencia,
        Grupos = new[] { new GameplayDiceGroupResultDto { Quantidade = 1, Faces = SistemaRpgConfiguration.ObterFacesDado(config.DadoSobrevivencia)!.Value, Valores = new[] { natural }, IndicesMantidos = new[] { 0 } } },
        ValorNatural = natural,
        Subtotal = natural,
        Total = natural,
        CodigoResultado = success ? "SUCESSO_SOBREVIVENCIA" : "FALHA_SOBREVIVENCIA",
        NomeResultado = success ? "Sucesso" : "Falha",
        Modo = GameplayRollMode.Normal,
        OrigemAcao = new GameplayActionSnapshotDto
        {
            Tipo = "SOBREVIVENCIA",
            IdPersonagemJogador = participant.IdPersonagemJogador,
            IdInstancia = participant.IdMesaCombateParticipante.ToString(CultureInfo.InvariantCulture),
            Nome = participant.NomeSnapshot,
            Valores = new Dictionary<string, string>
            {
                ["resultadoMinimo"] = config.ResultadoMinimoSucesso.ToString(CultureInfo.InvariantCulture),
                ["sucessos"] = participant.SucessosSobrevivencia.ToString(CultureInfo.InvariantCulture),
                ["falhas"] = participant.FalhasSobrevivencia.ToString(CultureInfo.InvariantCulture),
            },
        },
    };

    private static MesaRolagem ToRollEntity(long eventId, GameplayRollResultDto roll) => new()
    {
        IdMesaEvento = eventId,
        Expressao = roll.Expressao,
        GruposJson = JsonSerializer.Serialize(roll.Grupos, JsonOptions),
        ModificadoresJson = JsonSerializer.Serialize(roll.Modificadores, JsonOptions),
        ValorNatural = roll.ValorNatural,
        Subtotal = roll.Subtotal,
        Total = roll.Total,
        CodigoResultado = roll.CodigoResultado,
        NomeResultado = roll.NomeResultado,
        ValorAssociado = roll.ValorAssociado,
        Manual = false,
    };

    private static string SerializeConditionRule(SistemaCondicao rule) => JsonSerializer.Serialize(new
    {
        rule.CodigoRecurso,
        rule.OperacaoEfeito,
        rule.ValorEfeito,
        rule.MomentoEfeito,
        rule.CodigoRecursoGatilho,
        rule.OperadorGatilho,
        rule.ValorGatilho,
        rule.CooldownTurnos,
        rule.RegraRemocao,
        rule.ConfiguracaoPadraoJson,
    }, JsonOptions);

    private static JsonObject ParseObject(string? json) => JsonNode.Parse(string.IsNullOrWhiteSpace(json) ? "{}" : json) as JsonObject ?? new JsonObject();
    private static JsonObject GetOrCreate(JsonObject root, string property)
    {
        string? key = FindKey(root, property);
        if (key is not null && root[key] is JsonObject current) return current;
        var created = new JsonObject();
        root[property] = created;
        return created;
    }
    private static string? FindKey(JsonObject source, string property) => source.FirstOrDefault(pair => pair.Key.Equals(property, StringComparison.OrdinalIgnoreCase)).Key;
    private static int ReadInt(JsonNode? node)
    {
        if (node is not JsonValue value) return 0;
        if (value.TryGetValue(out int result)) return result;
        if (value.TryGetValue(out decimal number)) return decimal.ToInt32(decimal.Truncate(number));
        return value.TryGetValue(out string? text) && int.TryParse(text, out int parsed) ? parsed : 0;
    }
    private static string Normalize(string? value) => (value ?? string.Empty).Trim().ToUpperInvariant().Replace('-', '_').Replace(' ', '_');
    private static string HashPayload<T>(T payload) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(payload, JsonOptions))));
    private static JsonSerializerOptions CreateJsonOptions()
    {
        var options = new JsonSerializerOptions(JsonSerializerDefaults.Web);
        options.Converters.Add(new JsonStringEnumConverter());
        return options;
    }

    private static GameplayCombatCommandResponseDto CopyReplay(GameplayCombatCommandResponseDto source) => new()
    {
        Replay = true,
        IdMesaSessao = source.IdMesaSessao,
        RevisaoSessao = source.RevisaoSessao,
        IdEvento = source.IdEvento,
        Combate = source.Combate,
        Rolagem = source.Rolagem,
        Aplicacao = source.Aplicacao,
        Aplicacoes = source.Aplicacoes,
    };

    private static GameplayOperationResult<CombatMutation> Mutation(
        string eventType, string title, string description,
        MesaCombateParticipante? participant = null,
        GameplayRollResultDto? roll = null,
        int? characterId = null,
        GameplayEffectApplicationDto? application = null,
        IReadOnlyList<GameplayEffectApplicationDto>? applications = null)
        => GameplayOperationResult<CombatMutation>.Ok(new CombatMutation(
            eventType,
            title,
            description,
            participant,
            roll,
            characterId,
            application,
            applications ?? (application is null ? Array.Empty<GameplayEffectApplicationDto>() : new[] { application })));
    private static GameplayOperationResult<CombatMutation> Invalid(string code, string message) => Fail<CombatMutation>(GameplayOperationError.RegraNaoPermitida, code, message);
    private static GameplayOperationResult<CombatMutation> Forbidden(string code, string message) => Fail<CombatMutation>(GameplayOperationError.Proibido, code, message);
    private static GameplayOperationResult<CombatMutation> Conflict(string code, string message) => Fail<CombatMutation>(GameplayOperationError.Conflito, code, message);
    private static GameplayOperationResult<T> Fail<T>(GameplayOperationError error, string code, string message) => GameplayOperationResult<T>.Falha(error, code, message);
    private static GameplayOperationResult<TTarget> ConvertFailure<TSource, TTarget>(GameplayOperationResult<TSource> source)
        => GameplayOperationResult<TTarget>.Falha(source.Erro, source.Codigo, source.Mensagem ?? "A ação não pôde ser concluída.");

    [GeneratedRegex(@"(?<quantity>\d*)\s*[dD]\s*(?<faces>\d+)", RegexOptions.CultureInvariant)]
    private static partial Regex DiceExpressionRegex();
    [GeneratedRegex(@"[\p{L}_]+", RegexOptions.CultureInvariant)]
    private static partial Regex IdentifierRegex();
    [GeneratedRegex(@"[+-]\s*\d+", RegexOptions.CultureInvariant)]
    private static partial Regex SignedConstantRegex();

    private sealed record InitiativePlan(string Expression, int Quantity, int Faces, int Modifier);
    private sealed record CombatMutation(
        string EventType,
        string Title,
        string Description,
        MesaCombateParticipante? Participant,
        GameplayRollResultDto? Roll,
        int? CharacterId,
        GameplayEffectApplicationDto? Application,
        IReadOnlyList<GameplayEffectApplicationDto> Applications);
    private sealed class CommandScope
    {
        public CommandScope(Mesa mesa, MesaSessao session, MesaCombate? combat, SistemaVersao version, bool isMaster, DateTime now)
        {
            Mesa = mesa; Session = session; Combat = combat; Version = version; IsMaster = isMaster; Now = now;
        }
        public Mesa Mesa { get; }
        public MesaSessao Session { get; }
        public MesaCombate? Combat { get; set; }
        public SistemaVersao Version { get; }
        public bool IsMaster { get; }
        public DateTime Now { get; }
        public HashSet<int> ChangedCharacterIds { get; } = new();
    }
}
