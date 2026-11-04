namespace OdisseiaWiki.Dtos;

/// <summary>Total includes the active run; losses include defeat and abandonment.</summary>
public sealed record GameRunStatisticsCountersDto(long Total, long Vencidas, long Derrotas, long Abandonadas, long EmAndamento)
{
    public long Perdidas => Derrotas + Abandonadas;
    public long Encerradas => Vencidas + Perdidas;
}

public sealed record GameRunCharacterStatisticsDto(int IdPersonagemJogadorOrigem, string Nome, string? Imagem,
    GameRunStatisticsCountersDto Estatisticas);
public sealed record GameRunStatisticsDto(GameRunStatisticsCountersDto Geral,
    IReadOnlyList<GameRunCharacterStatisticsDto> Personagens);

public sealed record GameRunVictoryEnemyDto(string Nome, string? Imagem, long Quantidade);
public sealed record GameRunVictoryProtectedItemDto(string Id, string Nome, string? Imagem, long Quantidade);
public sealed record GameRunVictoryStatisticsDto(
    long IdGameRun, int IdPersonagemJogadorOrigem, string NomePersonagem, string? ImagemPersonagem,
    string CodigoJogo, string NomeJogo, int IdGameModeVersion, string NumeroVersaoModo,
    int IdSistemaVersao, string NumeroVersaoSistema, long Seed, DateTime CriadaEmUtc, DateTime? EncerradaEmUtc,
    long? DuracaoSegundos, int NivelFinal, int FasesPercorridas, int NosConcluidos, int MissoesConcluidas,
    int Combates, int CombatesVencidos, long InimigosDerrotados, long XpConquistado, long ItensObtidos,
    long MoedasEmCombates, long SaldoEventosMissoes, long SaldoFinal,
    IReadOnlyList<GameRunVictoryEnemyDto> Inimigos,
    IReadOnlyList<GameRunVictoryProtectedItemDto> ItensProtegidos);

public sealed record GameRunVictoryStatisticsPageDto(IReadOnlyList<GameRunVictoryStatisticsDto> Vitorias,
    long? ProximoCursor);
