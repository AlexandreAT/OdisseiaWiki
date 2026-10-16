using OdisseiaWiki.GameRuns.Battle;
using OdisseiaWiki.GameRuns;

namespace OdisseiaWiki.Dtos;

public sealed record GameBattlePreviewActorDto(
    string Id,
    string Nome,
    int Vida,
    int VidaMaxima,
    int Mana,
    int ManaMaxima,
    int Estamina,
    int EstaminaMaxima,
    GameBattleDefenses Defesas,
    string? Imagem = null);

public sealed record GameRunEncounterSetupDto(
    IReadOnlyList<GameBattlePreviewActorDto> Equipe,
    IReadOnlyList<GameBattlePreviewActorDto> Oponentes,
    string? FormulaIniciativa);

public sealed record GameBattlePreviewDto(
    int SchemaVersion,
    long IdGameRun,
    int IdSistemaVersao,
    int IdGameModeVersion,
    IReadOnlyList<string> ArmasUtilizadas,
    string AcaoReserva,
    GameBattlePreviewActorDto Personagem,
    GameBattlePreviewActorDto Oponente,
    GameBattleResult Resultado)
{
    public IReadOnlyList<GameBattlePreviewActorDto> Oponentes { get; init; } = [];
    public int XpConcedido { get; init; }
    public IReadOnlyList<int> NiveisAlcancados { get; init; } = [];
    public GameRunGrantedPoints PontosConcedidos { get; init; } = new();
}
