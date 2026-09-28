using System.ComponentModel.DataAnnotations;
using OdisseiaWiki.Enums;

namespace OdisseiaWiki.Dtos;

public sealed class GameplayCombatSnapshotDto
{
    public long IdMesaCombate { get; init; }
    public long IdMesaSessao { get; init; }
    public MesaCombateStatus Status { get; init; }
    public int RodadaAtual { get; init; }
    public int IndiceTurnoAtual { get; init; }
    public long? IdParticipanteAtual { get; init; }
    public long Revisao { get; init; }
    public bool PodeGerenciar { get; init; }
    public string FormulaIniciativa { get; init; } = string.Empty;
    public IReadOnlyList<GameplayCombatParticipantDto> Participantes { get; init; } = Array.Empty<GameplayCombatParticipantDto>();
    public IReadOnlyList<GameplayActiveConditionDto> Condicoes { get; init; } = Array.Empty<GameplayActiveConditionDto>();
    public IReadOnlyList<GameplayCooldownDto> Cooldowns { get; init; } = Array.Empty<GameplayCooldownDto>();
    public IReadOnlyList<GameplayConditionCatalogItemDto> CatalogoCondicoes { get; init; } = Array.Empty<GameplayConditionCatalogItemDto>();
    public IReadOnlyList<GameplayRestCatalogItemDto> CatalogoDescansos { get; init; } = Array.Empty<GameplayRestCatalogItemDto>();
}

public sealed class GameplayStateCatalogDto
{
    public IReadOnlyList<GameplayConditionCatalogItemDto> Condicoes { get; init; } = Array.Empty<GameplayConditionCatalogItemDto>();
    public IReadOnlyList<GameplayRestCatalogItemDto> Descansos { get; init; } = Array.Empty<GameplayRestCatalogItemDto>();
}

public sealed class GameplayCombatParticipantDto
{
    public long IdParticipante { get; init; }
    public MesaCombateParticipanteTipo Tipo { get; init; }
    public MesaCombateParticipanteStatus Status { get; init; }
    public int? IdPersonagemJogador { get; init; }
    public int? IdUsuarioControlador { get; init; }
    public string Nome { get; init; } = string.Empty;
    public string? Imagem { get; init; }
    public int ModificadorIniciativa { get; init; }
    public int? Iniciativa { get; init; }
    public int? ValorNaturalIniciativa { get; init; }
    public int Ordem { get; init; }
    public bool PodeRolarIniciativa { get; init; }
    public bool PodeControlar { get; init; }
    public int SucessosSobrevivencia { get; init; }
    public int FalhasSobrevivencia { get; init; }
}

public sealed class GameplayActiveConditionDto
{
    public long IdCondicaoAtiva { get; init; }
    public long IdParticipante { get; init; }
    public string Codigo { get; init; } = string.Empty;
    public string Nome { get; init; } = string.Empty;
    public MesaCondicaoStatus Status { get; init; }
    public int Acumulos { get; init; }
    public decimal? Valor { get; init; }
    public int? Duracao { get; init; }
    public SistemaUnidadeDuracao UnidadeDuracao { get; init; }
    public int? TurnosRestantes { get; init; }
    public int? CooldownTurnos { get; init; }
    public string? RegraRemocao { get; init; }
}

public sealed class GameplayCooldownDto
{
    public long IdCooldown { get; init; }
    public long IdParticipante { get; init; }
    public string TipoOrigem { get; init; } = string.Empty;
    public string IdOrigem { get; init; } = string.Empty;
    public string Nome { get; init; } = string.Empty;
    public int TurnosRestantes { get; init; }
}

public sealed class GameplayConditionCatalogItemDto
{
    public int IdSistemaCondicao { get; init; }
    public string Codigo { get; init; } = string.Empty;
    public string Nome { get; init; } = string.Empty;
    public string? Descricao { get; init; }
    public string Tipo { get; init; } = string.Empty;
    public int? DuracaoPadrao { get; init; }
    public SistemaUnidadeDuracao UnidadeDuracao { get; init; }
    public bool Empilhavel { get; init; }
    public bool PermiteSobrescrever { get; init; }
    public decimal? ValorPadrao { get; init; }
    public string? CodigoRecurso { get; init; }
    public string? OperacaoEfeito { get; init; }
    public decimal? ValorEfeito { get; init; }
    public string? MomentoEfeito { get; init; }
    public int? CooldownTurnos { get; init; }
    public string? RegraRemocao { get; init; }
}

public sealed class GameplayRestCatalogItemDto
{
    public int IdSistemaDescansoConfig { get; init; }
    public string Tipo { get; init; } = string.Empty;
    public string Nome { get; init; } = string.Empty;
    public int? DuracaoMinimaMinutos { get; init; }
    public decimal RecuperacaoVida { get; init; }
    public decimal RecuperacaoMana { get; init; }
    public decimal RecuperacaoEstamina { get; init; }
    public SistemaRecuperacaoTipo TipoRecuperacao { get; init; }
    public bool ExigeGuarda { get; init; }
    public bool PermiteAtividades { get; init; }
}

public sealed class GameplayCombatCommandResponseDto
{
    public bool Replay { get; init; }
    public long IdMesaSessao { get; init; }
    public long RevisaoSessao { get; init; }
    public long? IdEvento { get; init; }
    public GameplayCombatSnapshotDto? Combate { get; init; }
    public GameplayRollResultDto? Rolagem { get; init; }
    public GameplayEffectApplicationDto? Aplicacao { get; init; }
    public IReadOnlyList<GameplayEffectApplicationDto> Aplicacoes { get; init; } =
        Array.Empty<GameplayEffectApplicationDto>();
}

public abstract class GameplayCombatCommandRequestDto
{
    [Required] public Guid ChaveIdempotencia { get; set; }
    [Range(0, long.MaxValue)] public long? RevisaoSessaoEsperada { get; set; }
    [Range(0, long.MaxValue)] public long? RevisaoCombateEsperada { get; set; }
}

public sealed class GameplayCombatStartRequestDto : GameplayCombatCommandRequestDto
{
    [Required, MinLength(1)] public List<int> IdsPersonagens { get; set; } = new();
}

public sealed class GameplayCombatAddNpcRequestDto : GameplayCombatCommandRequestDto
{
    [Required, MaxLength(150)] public string Nome { get; set; } = string.Empty;
    [MaxLength(500)] public string? Imagem { get; set; }
    [Range(-1000, 1000)] public int ModificadorIniciativa { get; set; }
}

public sealed class GameplayCombatInitiativeRequestDto : GameplayCombatCommandRequestDto
{
    [Range(1, long.MaxValue)] public long IdParticipante { get; set; }
}

public sealed class GameplayCombatActivateRequestDto : GameplayCombatCommandRequestDto
{
    [Required, MinLength(1)] public List<long> OrdemParticipantes { get; set; } = new();
}

public sealed class GameplayCombatAdvanceRequestDto : GameplayCombatCommandRequestDto;
public sealed class GameplayCombatEndRequestDto : GameplayCombatCommandRequestDto;

public sealed class GameplayConditionApplyRequestDto : GameplayCombatCommandRequestDto
{
    [Range(1, long.MaxValue)] public long IdParticipante { get; set; }
    [Range(1, int.MaxValue)] public int IdSistemaCondicao { get; set; }
    public int? Duracao { get; set; }
    public decimal? Valor { get; set; }
}

public sealed class GameplayConditionRemoveRequestDto : GameplayCombatCommandRequestDto
{
    [Range(1, long.MaxValue)] public long IdCondicaoAtiva { get; set; }
    [MaxLength(500)] public string? Motivo { get; set; }
}

public sealed class GameplayRestApplyRequestDto : GameplayCombatCommandRequestDto
{
    [Range(1, int.MaxValue)] public int IdPersonagemJogador { get; set; }
    [Range(1, int.MaxValue)] public int IdSistemaDescansoConfig { get; set; }
    [Range(0, long.MaxValue)] public long RevisaoPersonagemEsperada { get; set; }
    public bool GuardaConfirmada { get; set; }
}

public sealed class GameplaySurvivalRollRequestDto : GameplayCombatCommandRequestDto
{
    [Range(1, long.MaxValue)] public long IdParticipante { get; set; }
    public bool EstabilizacaoManual { get; set; }
}
