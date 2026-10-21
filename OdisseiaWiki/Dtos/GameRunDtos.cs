using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace OdisseiaWiki.Dtos;

public sealed class GameRunCharacterOptionDto
{
    public int IdPersonagemJogador { get; init; }
    public string Nome { get; init; } = string.Empty;
    public string? Imagem { get; init; }
    public int IdRaca { get; init; }
    public int IdMesa { get; init; }
    public int? IdSistemaVersao { get; init; }
    public int? IdSistemaVersaoAtual { get; init; }
    public string? NumeroVersaoSistema { get; init; }
    public string? NumeroVersaoSistemaAtual { get; init; }
    public string? NomeMesa { get; init; }
    public string? NomeSistema { get; init; }
    public bool AtualizacaoDisponivel { get; init; }
    public string? NumeroVersaoModo { get; init; }
    public bool? LootConfigurado { get; init; }
    public bool? InfluenciasAtributosConfiguradas { get; init; }
}

public sealed class GameRunCreateRequestDto
{
    [Range(1, int.MaxValue)]
    public int IdPersonagemJogador { get; set; }
    public string? CodigoJogo { get; set; }

    [Required]
    public Guid ChaveIdempotencia { get; set; }
}

public sealed class GameRunAbandonRequestDto
{
    [Required, Range(0, long.MaxValue)]
    public long? RevisaoEsperada { get; set; }

    [Required]
    public Guid ChaveIdempotencia { get; set; }
}

public sealed class GameRunRestartRequestDto : GameRunMutationRequestDto
{
}

public sealed class GameRunUpgradeAttributeRequestDto : GameRunMutationRequestDto
{
    [Required, MaxLength(100)] public string Codigo { get; set; } = string.Empty;
}

public class GameRunMutationRequestDto
{
    [Required, Range(0, long.MaxValue)]
    public long? RevisaoEsperada { get; set; }

    [Required]
    public Guid ChaveIdempotencia { get; set; }
}

public sealed record GameRunTargetDto(string ActorId, string TargetId);

public sealed class GameRunBattleRequestDto : GameRunMutationRequestDto
{
    public IReadOnlyList<GameRunTargetDto> Alvos { get; set; } = [];
}

public sealed class GameRunWeaponOrderRequestDto : GameRunMutationRequestDto
{
    [Required]
    public IReadOnlyList<string>? OrdemArmas { get; set; }
}

public sealed class GameRunActionSelectionDto
{
    public string Tipo { get; set; } = string.Empty;
    public string IdInstancia { get; set; } = string.Empty;
    public string? Alcance { get; set; }
    public int QuantidadeAtaques { get; set; } = 1;
    public string? ModoDisparo { get; set; }
}

public sealed class GameRunLoadoutRequestDto : GameRunMutationRequestDto
{
    public IReadOnlyList<GameRunActionSelectionDto>? Acoes { get; set; }
}

public sealed class GameRunConsumeItemRequestDto : GameRunMutationRequestDto
{
    [Required]
    public string IdInstancia { get; set; } = string.Empty;
    public int Quantidade { get; set; } = 1;
}

public sealed class GameRunEquipDefenseRequestDto : GameRunMutationRequestDto
{
    public bool Equipado { get; set; }
}

public sealed class GameRunConditionOriginRequestDto : GameRunMutationRequestDto
{
    [Required, MaxLength(12)] public string Tipo { get; set; } = string.Empty;
    [Required, MaxLength(100)] public string IdInstancia { get; set; } = string.Empty;
    [Range(0, 100)] public int Indice { get; set; }
    [Required, MaxLength(80)] public string Codigo { get; set; } = string.Empty;
    [Required, MaxLength(30)] public string Gatilho { get; set; } = string.Empty;
    [MaxLength(80)] public string? CodigoResultado { get; set; }
    [MaxLength(12)] public string Alvo { get; set; } = "ALVO";
    [Range(-1000000, 1000000)] public int? Valor { get; set; }
    public Dictionary<int, int> ValoresEfeitos { get; set; } = [];
    [Range(1, 1000000)] public int? Duracao { get; set; }
    [MaxLength(10)] public string? UnidadeDuracao { get; set; }
    [Range(1, 20)] public int? ResultadoNaturalMinimo { get; set; }
    [Range(1, 20)] public int? ResultadoNaturalMaximo { get; set; }
    public IReadOnlyList<int> ResultadosNaturais { get; set; } = [];
    public GameplayResistanceTestDto? TesteResistencia { get; set; }
}

public sealed class GameplayResistanceTestDto
{
    [Range(1, 10)] public int Dados { get; set; }
    [Range(2, 1000)] public int Faces { get; set; }
    [Required, MaxLength(50)] public string Atributo { get; set; } = string.Empty;
    [Range(-1000000, 1000000)] public int Dificuldade { get; set; }
}

public sealed record GameRunConsumeItemResultDto(
    GameRunDto Run, string NomeItem, int QuantidadeRestante,
    int VidaRecuperada, int ManaRecuperada, int EstaminaRecuperada);

public sealed class GameRunMapDto
{
    public int SchemaVersion { get; init; }
    public IReadOnlyList<GameRunMapNodeDto> Nodes { get; init; } = [];
    public IReadOnlyList<GameRunMapNodeDto>? ParentNodes { get; init; }
    public GameRunMapDto? ParentMap { get; init; }
    public string? SecretReturnNodeId { get; init; }
    public bool IsSecretFinal { get; init; }
    public IReadOnlyList<GameRunMapNodeDto> HistoricalNodes { get; init; } = [];
    public IReadOnlyList<string> MediumRestUsedMapKeys { get; set; } = [];
    public bool OpeningOpportunityPending { get; set; }
}

public sealed record GameRunMediumRestPreviewDto(
    bool Disponivel, string Nome, int VidaRecuperada, int ManaRecuperada,
    int EstaminaRecuperada, string? Motivo, bool AtaqueOportunidadePendente);

public sealed record GameRunMediumRestResolutionDto(
    GameRunDto Run, string Nome, int VidaRecuperada, int ManaRecuperada,
    int EstaminaRecuperada);

public sealed class GameRunMapNodeDto
{
    public string Id { get; init; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Image { get; init; }
    public string? AreaImage { get; init; }
    public string? AreaName { get; init; }
    public string? AreaCode { get; init; }
    public string? Description { get; init; }
    public int Fase { get; init; }
    public int Layer { get; init; }
    public int Position { get; init; }
    public long Seed { get; init; }
    public string Type { get; init; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public IReadOnlyList<string> Connections { get; init; } = [];
    public GameRunMapNodePayloadDto? Payload { get; set; }
    public bool Revealed { get; init; }
}

public sealed class GameRunMapNodePayloadDto
{
    public string? EncounterCode { get; init; }
    public string? SecretAreaCode { get; init; }
    public int GameMinutes { get; init; }
}

public sealed class GameRunSystemSnapshotDto
{
    public int? IdSistemaRpg { get; init; }
    public int IdSistemaVersao { get; init; }
    public string CodigoSistema { get; init; } = string.Empty;
    public string NumeroVersao { get; init; } = string.Empty;
    public string Origem { get; init; } = string.Empty;
    public IReadOnlyList<SistemaRuntimeProvenienciaDto> Proveniencias { get; init; }
        = Array.Empty<SistemaRuntimeProvenienciaDto>();
    public IReadOnlyList<SistemaRuntimeWarningDto> Warnings { get; init; }
        = Array.Empty<SistemaRuntimeWarningDto>();
    public IReadOnlyList<SistemaRuntimeFallbackDto> Fallbacks { get; init; }
        = Array.Empty<SistemaRuntimeFallbackDto>();
}

public sealed class GameRunCharacterSnapshotDto
{
    public System.Text.Json.JsonElement? Carga { get; init; }
    public System.Text.Json.JsonElement? LimitesCondicoes { get; init; }
    public System.Text.Json.JsonElement? CondicoesAtivas { get; init; }
    public OdisseiaWiki.GameRuns.GameRunLootState? Loot { get; init; }
    public int SchemaVersion { get; init; } = 1;
    public int IdPersonagemJogadorOrigem { get; init; }
    public string Nome { get; init; } = string.Empty;
    public string? Imagem { get; init; }
    public int IdRaca { get; init; }
    public int IdSistemaVersao { get; init; }
    public JsonElement Status { get; init; }
    public JsonElement? Inventario { get; init; }
    public JsonElement? Implantes { get; init; }
    public JsonElement? Skills { get; init; }
    public JsonElement? Magia { get; init; }
    public string? InfoSecundariasJson { get; init; }
    public IReadOnlyList<ProficienciaResumoDto> Proficiencias { get; init; }
        = Array.Empty<ProficienciaResumoDto>();
    public GameRunSystemSnapshotDto Sistema { get; init; } = new();
}

public sealed class GameRunDto
{
    public long IdGameRun { get; init; }
    public int IdPersonagemJogadorOrigem { get; init; }
    public int IdGameModeVersion { get; init; }
    public string NomeJogo { get; init; } = "Odisseia";
    public string NumeroVersaoModo { get; init; } = string.Empty;
    public int IdSistemaVersao { get; init; }
    public string Status { get; init; } = string.Empty;
    public long Seed { get; init; }
    public int Fase { get; init; }
    public string? NoAtualId { get; init; }
    public long Revisao { get; init; }
    public DateTime CriadaEmUtc { get; init; }
    public DateTime AtualizadaEmUtc { get; init; }
    public DateTime? EncerradaEmUtc { get; init; }
    public JsonElement ConfiguracaoModo { get; init; }
    public GameRunCharacterSnapshotDto SnapshotInicial { get; init; } = new();
    public GameRunCharacterSnapshotDto EstadoAtual { get; init; } = new();
    public IReadOnlyList<string> OrdemArmas { get; init; } = [];
    public IReadOnlyList<GameRunActionSelectionDto>? AcoesEquipadas { get; init; }
    public GameRunMapDto Mapa { get; init; } = new();
}

public sealed class GameRunOperationResult<T>
{
    public bool Sucesso { get; init; }
    public string Codigo { get; init; } = string.Empty;
    public string Mensagem { get; init; } = string.Empty;
    public T? Dados { get; init; }
    public bool Repetido { get; init; }

    public static GameRunOperationResult<T> Ok(T dados, bool repetido = false) =>
        new() { Sucesso = true, Dados = dados, Repetido = repetido };

    public static GameRunOperationResult<T> Fail(string codigo, string mensagem) =>
        new() { Codigo = codigo, Mensagem = mensagem };
}
