namespace OdisseiaWiki.Dtos;

public sealed record GameRunBattleResolutionDto(
    GameRunDto Run, GameBattlePreviewDto Battle, string NoId, int Ordem, DateTime CriadaEmUtc);

public sealed record GameRunBattleRecordDto(
    string NoId, int Ordem, DateTime CriadaEmUtc, GameBattlePreviewDto Battle);

public sealed record GameRunBaseResolutionDto(
    GameRunDto Run, string NoId, string Descanso,
    int VidaRecuperada, int ManaRecuperada, int EstaminaRecuperada)
{
    public string Tipo { get; init; } = "BASE";
    public int ProtecaoReparada { get; init; }
}
