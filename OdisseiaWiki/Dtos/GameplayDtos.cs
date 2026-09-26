using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using OdisseiaWiki.Enums;

namespace OdisseiaWiki.Dtos;

public sealed class GameplaySessionDto
{
    public long IdMesaSessao { get; init; }
    public int IdMesa { get; init; }
    public MesaSessaoStatus Status { get; init; }
    public int IdSistemaVersao { get; init; }
    public DateTime IniciadaEmUtc { get; init; }
    public DateTime? EncerradaEmUtc { get; init; }
    public long RevisaoEstado { get; init; }
    public long UltimaSequenciaEvento { get; init; }
    public int VersaoSchema { get; init; }
}

public sealed class GameplaySessionStartRequestDto
{
    [Required]
    public Guid ChaveIdempotencia { get; set; }
    [Range(0, long.MaxValue)]
    public long? RevisaoMesaEsperada { get; set; }
}

public sealed class GameplaySessionEndRequestDto
{
    [Required]
    public Guid ChaveIdempotencia { get; set; }
    [Range(0, long.MaxValue)]
    public long? RevisaoMesaEsperada { get; set; }
    [Range(0, long.MaxValue)]
    public long? RevisaoSessaoEsperada { get; set; }
    [MaxLength(250)]
    public string? Motivo { get; set; }
}

public sealed class GameplayDiceGroupRequestDto
{
    [Range(1, 100)]
    public int Quantidade { get; set; }
    [Range(2, 1000)]
    public int Faces { get; set; }
}

public sealed class GameplayRollRequestDto
{
    [Required]
    public Guid ChaveIdempotencia { get; set; }
    [Required, MaxLength(80)]
    public string CodigoAcao { get; set; } = string.Empty;
    public int? IdPersonagemJogador { get; set; }
    [MaxLength(80)]
    public string? CodigoAtributo { get; set; }
    [Required]
    public List<GameplayDiceGroupRequestDto> Grupos { get; set; } = new();
    public GameplayRollMode Modo { get; set; }
    public GameplayEventVisibility Visibilidade { get; set; } = GameplayEventVisibility.PublicaMesa;
    [Range(0, long.MaxValue)]
    public long? RevisaoSessaoEsperada { get; set; }
    [Range(0, long.MaxValue)]
    public long? RevisaoPersonagemEsperada { get; set; }
    public GameplayActionReferenceDto? ReferenciaAcao { get; set; }
    public GameplayActionParametersDto? ParametrosAcao { get; set; }
}

public sealed class GameplayFavoriteRollConfigurationDto
{
    [Required, MaxLength(80)]
    public string CodigoAcao { get; set; } = string.Empty;
    [MaxLength(80)]
    public string? CodigoAtributo { get; set; }
    [Required]
    public List<GameplayDiceGroupRequestDto> Grupos { get; set; } = new();
    public GameplayRollMode Modo { get; set; }
    public GameplayEventVisibility Visibilidade { get; set; } = GameplayEventVisibility.PublicaMesa;
    public GameplayActionReferenceDto? ReferenciaAcao { get; set; }
    public GameplayActionParametersDto? ParametrosAcao { get; set; }
}

public sealed class GameplayFavoriteRollUpsertDto
{
    [Required, MaxLength(40)]
    public string TipoOrigem { get; set; } = string.Empty;
    [Required, MaxLength(160)]
    public string IdOrigem { get; set; } = string.Empty;
    [Required, MaxLength(120)]
    public string Nome { get; set; } = string.Empty;
    [Required]
    public GameplayFavoriteRollConfigurationDto Configuracao { get; set; } = new();
}

public sealed class GameplayFavoriteRollDto
{
    public Guid IdFavorito { get; init; }
    public int IdPersonagemJogador { get; init; }
    public string TipoOrigem { get; init; } = string.Empty;
    public string IdOrigem { get; init; } = string.Empty;
    public string Nome { get; init; } = string.Empty;
    public GameplayFavoriteRollConfigurationDto Configuracao { get; init; } = new();
    public DateTime AtualizadoEmUtc { get; init; }
}

public sealed class GameplayManualRecordRequestDto
{
    [Required]
    public Guid ChaveIdempotencia { get; set; }
    public int? IdPersonagemJogador { get; set; }
    [Required, MaxLength(40)]
    public string Categoria { get; set; } = string.Empty;
    [Required, MaxLength(120)]
    public string Rotulo { get; set; } = string.Empty;
    public double? ValorBruto { get; set; }
    public double? ResultadoFinal { get; set; }
    [MaxLength(100)]
    public string? ResultadoSemantico { get; set; }
    public double? ValorAssociado { get; set; }
    [MaxLength(300)]
    public string? Observacao { get; set; }
    public GameplayEventVisibility Visibilidade { get; set; } = GameplayEventVisibility.PublicaMesa;
    [Range(0, long.MaxValue)]
    public long? RevisaoSessaoEsperada { get; set; }
    [Range(0, long.MaxValue)]
    public long? RevisaoPersonagemEsperada { get; set; }
}

/// <summary>
/// Stable identifiers requested by a client for a future item, weapon or power
/// action. They are never trusted as rules; the engine resolves and snapshots
/// supported references on the server.
/// </summary>
public sealed class GameplayActionReferenceDto
{
    [MaxLength(40)]
    public string? Tipo { get; set; }
    [MaxLength(120)]
    public string? IdInstancia { get; set; }
    public int? IdItemSistema { get; set; }
    public int? IdPoderSistema { get; set; }
}

/// <summary>
/// Context selected by the player for an already configured action. These
/// values are only inputs: the server validates them against the item/power
/// snapshot and the published System version before rolling.
/// </summary>
public sealed class GameplayActionParametersDto
{
    [MaxLength(40)]
    public string? Operacao { get; set; }
    [MaxLength(40)]
    public string? Alcance { get; set; }
    [MaxLength(40)]
    public string? ModoDisparo { get; set; }
    [Range(1, 100)]
    public int? Quantidade { get; set; }
}

public sealed class GameplayDiceGroupResultDto
{
    public int Quantidade { get; init; }
    public int Faces { get; init; }
    public IReadOnlyList<int> Valores { get; init; } = Array.Empty<int>();
    public IReadOnlyList<int> IndicesMantidos { get; init; } = Array.Empty<int>();
    public IReadOnlyList<int> IndicesDescartados { get; init; } = Array.Empty<int>();
}

public sealed class GameplayModifierDto
{
    public string Codigo { get; init; } = string.Empty;
    public string Nome { get; init; } = string.Empty;
    public int Valor { get; init; }
    public string Origem { get; init; } = string.Empty;
}

public sealed class GameplayDifficultyDto
{
    public string Codigo { get; init; } = string.Empty;
    public string Nome { get; init; } = string.Empty;
    public int? Alvo { get; init; }
    public string? Comparador { get; init; }
}

public sealed class GameplayResultRangeDto
{
    public string Codigo { get; init; } = string.Empty;
    public string Nome { get; init; } = string.Empty;
    public int? Minimo { get; init; }
    public int? Maximo { get; init; }
    public bool? Critico { get; init; }
    public bool? FalhaCritica { get; init; }
    public bool ExigeNatural { get; init; }
}

public sealed class GameplayActionSnapshotDto
{
    public string Tipo { get; init; } = string.Empty;
    public int? IdPersonagemJogador { get; init; }
    public long? RevisaoPersonagem { get; init; }
    public string? IdInstancia { get; init; }
    public int? IdItemSistema { get; init; }
    public int? IdPoderSistema { get; init; }
    public int? IdSistemaVersao { get; init; }
    public string? Codigo { get; init; }
    public string? Nome { get; init; }
    public IReadOnlyDictionary<string, string> Valores { get; init; } =
        new Dictionary<string, string>();
}

public sealed class GameplayExecutionNoticeDto
{
    public string Codigo { get; init; } = string.Empty;
    public string Mensagem { get; init; } = string.Empty;
    public bool Fallback { get; init; }
}

public sealed class GameplayEffectProposalDto
{
    public string Codigo { get; init; } = string.Empty;
    public string Tipo { get; init; } = string.Empty;
    public string Nome { get; init; } = string.Empty;
    public string Alvo { get; init; } = "AUTOR";
    public string? CodigoRecurso { get; init; }
    public string Operacao { get; init; } = "SOMAR";
    public int Valor { get; init; }
    public bool ExigeAlvo { get; init; }
    public bool PodeAplicar { get; init; } = true;
    public string? MotivoIndisponivel { get; init; }
}

public sealed class GameplayRollResultDto
{
    public string Expressao { get; init; } = string.Empty;
    public IReadOnlyList<GameplayDiceGroupResultDto> Grupos { get; init; } =
        Array.Empty<GameplayDiceGroupResultDto>();
    public IReadOnlyList<GameplayModifierDto> Modificadores { get; init; } =
        Array.Empty<GameplayModifierDto>();
    public int? ValorNatural { get; init; }
    public int Modificador { get; init; }
    public int Subtotal { get; init; }
    public int Total { get; init; }
    public string? CodigoResultado { get; init; }
    public string? NomeResultado { get; init; }
    public int? ValorAssociado { get; init; }
    public bool Manual { get; init; }
    public GameplayRollMode Modo { get; init; }
    public GameplayDifficultyDto? Dificuldade { get; init; }
    public IReadOnlyList<GameplayResultRangeDto> FaixasResultado { get; init; } =
        Array.Empty<GameplayResultRangeDto>();
    public bool? CriticoNatural { get; init; }
    public bool? FalhaCriticaNatural { get; init; }
    public GameplayActionSnapshotDto? OrigemAcao { get; init; }
    public IReadOnlyList<GameplayExecutionNoticeDto> Avisos { get; init; } =
        Array.Empty<GameplayExecutionNoticeDto>();
    public IReadOnlyList<GameplayEffectProposalDto> EfeitosPropostos { get; init; } =
        Array.Empty<GameplayEffectProposalDto>();
    public IReadOnlyList<GameplayRollResultDto> RolagensIndividuais { get; init; } =
        Array.Empty<GameplayRollResultDto>();
}

public sealed class GameplayActionCatalogItemDto
{
    public string Codigo { get; init; } = string.Empty;
    public string Nome { get; init; } = string.Empty;
    public string Tipo { get; init; } = string.Empty;
    public string? CodigoAtributo { get; init; }
    public string? GrupoAtributo { get; init; }
    public string Expressao { get; init; } = string.Empty;
    public GameplayRollMode ModoPadrao { get; init; }
    public bool Executavel { get; init; }
    public string? MotivoIndisponivel { get; init; }
}

public sealed class GameplayActionCatalogDto
{
    public int IdSistemaVersao { get; init; }
    public string DadoTesteGeral { get; init; } = string.Empty;
    public IReadOnlyList<GameplayActionCatalogItemDto> Acoes { get; init; } =
        Array.Empty<GameplayActionCatalogItemDto>();
}

public sealed class GameplayEffectApplyRequestDto
{
    [Required]
    public Guid ChaveIdempotencia { get; set; }
    [Range(1, long.MaxValue)]
    public long IdEventoOrigem { get; set; }
    [Required, MaxLength(100)]
    public string CodigoEfeito { get; set; } = string.Empty;
    public int? IdPersonagemAlvo { get; set; }
    [Range(0, long.MaxValue)]
    public long? RevisaoSessaoEsperada { get; set; }
    [Range(0, long.MaxValue)]
    public long? RevisaoPersonagemEsperada { get; set; }
}

public sealed class GameplayEffectApplicationDto
{
    public long IdEventoOrigem { get; init; }
    public string CodigoEfeito { get; init; } = string.Empty;
    public int IdPersonagemAlvo { get; init; }
    public long RevisaoPersonagem { get; init; }
    public string Campo { get; init; } = string.Empty;
    public int ValorAnterior { get; init; }
    public int ValorAplicado { get; init; }
    public int ValorAtual { get; init; }
}

public sealed class GameplayEventDto
{
    public long IdMesaEvento { get; init; }
    public long IdEvento => IdMesaEvento;
    public long IdMesaSessao { get; init; }
    public long Sequencia { get; init; }
    public string Tipo { get; init; } = string.Empty;
    public GameplayEventOrigin Origem { get; init; }
    public GameplayEventVisibility Visibilidade { get; init; }
    public int? IdUsuarioAtor { get; init; }
    public int? IdPersonagemJogador { get; init; }
    public string? CodigoRegra { get; init; }
    public string? CodigoAcao => CodigoRegra;
    public DateTime OcorreuEmUtc { get; init; }
    public DateTime CriadoEmUtc => OcorreuEmUtc;
    public JsonElement? Dados { get; init; }
    public bool Oculto { get; init; }
    public string? Titulo { get; init; }
    public string? Descricao { get; init; }
    public string? PersonagemNome { get; init; }
    public string? AutorNome { get; init; }
    public bool Manual { get; init; }
    public string? ResultadoSemantico { get; init; }
    public int? ValorAssociado { get; init; }
    public string? Categoria { get; init; }
    public string? Observacao { get; init; }
    public GameplayRollResultDto? Rolagem { get; init; }
}

public sealed class GameplayCommandResponseDto
{
    public long IdComando { get; init; }
    public bool Replay { get; init; }
    public long IdMesaSessao { get; init; }
    public long RevisaoMesa { get; init; }
    public long RevisaoSessao { get; init; }
    public long UltimaSequenciaEvento { get; init; }
    public GameplaySessionDto? Sessao { get; init; }
    public GameplayEventDto? Evento { get; init; }
    public GameplayRollResultDto? Rolagem { get; init; }
    public GameplayEffectApplicationDto? Aplicacao { get; init; }
}

public sealed class GameplayEventPageDto
{
    public IReadOnlyCollection<GameplayEventDto> Itens { get; init; } =
        Array.Empty<GameplayEventDto>();
    public string? ProximoCursor { get; init; }
    public bool HaMais { get; init; }
    public long UltimaSequenciaEvento { get; init; }
    public long CursorExaminadoAte { get; init; }
}

public sealed class GameplaySimulationResponseDto
{
    public bool Simulacao { get; init; } = true;
    public string Aviso { get; init; } = "Simulação - Mesa offline";
    public GameplayRollResultDto Rolagem { get; init; } = new();
}

public enum GameplayOperationError
{
    Nenhum,
    Validacao,
    NaoEncontrado,
    Proibido,
    Conflito,
    RegraNaoPermitida,
    LimiteTaxa,
}

public sealed class GameplayOperationResult<T>
{
    public bool Sucesso { get; init; }
    public GameplayOperationError Erro { get; init; }
    public string Codigo { get; init; } = string.Empty;
    public string? Mensagem { get; init; }
    public int? RetryAfterSeconds { get; init; }
    public T? Dados { get; init; }

    public static GameplayOperationResult<T> Ok(T dados) => new()
    {
        Sucesso = true,
        Dados = dados,
    };

    public static GameplayOperationResult<T> Falha(
        GameplayOperationError erro,
        string codigo,
        string mensagem,
        int? retryAfterSeconds = null) => new()
    {
        Erro = erro,
        Codigo = codigo,
        Mensagem = mensagem,
        RetryAfterSeconds = retryAfterSeconds,
    };
}
