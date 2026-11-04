export interface GameRunStatisticsCounters {
  total: number;
  vencidas: number;
  perdidas: number;
  derrotas: number;
  abandonadas: number;
  emAndamento: number;
  encerradas: number;
}

export interface GameRunStatistics {
  geral: GameRunStatisticsCounters;
  personagens: { idPersonagemJogadorOrigem: number; nome: string; imagem: string | null;
    estatisticas: GameRunStatisticsCounters }[];
}

export interface GameRunVictoryStatistics {
  idGameRun: number; idPersonagemJogadorOrigem: number; nomePersonagem: string; imagemPersonagem: string | null;
  codigoJogo: string; nomeJogo: string; idGameModeVersion: number; numeroVersaoModo: string;
  idSistemaVersao: number; numeroVersaoSistema: string; seed: number;
  criadaEmUtc: string; encerradaEmUtc: string | null; duracaoSegundos: number | null;
  nivelFinal: number; fasesPercorridas: number; nosConcluidos: number; missoesConcluidas: number;
  combates: number; combatesVencidos: number; inimigosDerrotados: number; xpConquistado: number; itensObtidos: number;
  moedasEmCombates: number; saldoEventosMissoes: number; saldoFinal: number;
  inimigos: { nome: string; imagem: string | null; quantidade: number }[];
  itensProtegidos: { id: string; nome: string; imagem: string | null; quantidade: number }[];
}

export interface GameRunVictoryStatisticsPage {
  vitorias: GameRunVictoryStatistics[];
  proximoCursor: number | null;
}
