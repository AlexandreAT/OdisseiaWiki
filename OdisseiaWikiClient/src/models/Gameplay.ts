import type { PersonagemJogador } from './PersonagemJogador';

export type GameplaySessionStatus = 'Ativa' | 'Encerrada';

export type GameplayVisibility =
  | 'PublicaMesa'
  | 'MestreEAutor'
  | 'SomenteMestre';

export type GameplayRollMode = 'Normal' | 'Vantagem' | 'Desvantagem';

export interface GameplaySession {
  idMesaSessao: number;
  idMesa: number;
  status: GameplaySessionStatus;
  idSistemaVersao?: number | null;
  iniciadaEmUtc: string;
  encerradaEmUtc?: string | null;
  revisaoEstado: number;
  ultimaSequenciaEvento: number;
  versaoSchema: number;
}

export interface GameplayDiceGroupRequest {
  quantidade: number;
  faces: number;
}

export interface GameplayDiceGroupResult extends GameplayDiceGroupRequest {
  valores: number[];
  indicesMantidos: number[];
  indicesDescartados: number[];
}

export interface GameplayRollResult {
  expressao: string;
  grupos: GameplayDiceGroupResult[];
  modificadores?: Array<{
    codigo?: string;
    nome?: string;
    valor: number;
  }>;
  valorNatural?: number | null;
  modificador: number;
  subtotal?: number;
  total: number;
  codigoResultado?: string | null;
  nomeResultado?: string | null;
  valorAssociado?: number | null;
  manual: boolean;
  modo: GameplayRollMode;
  dificuldade?: {
    codigo: string;
    nome: string;
    alvo?: number | null;
    comparador?: string | null;
  } | null;
  faixasResultado?: Array<{
    codigo: string;
    nome: string;
    minimo?: number | null;
    maximo?: number | null;
    critico?: boolean | null;
    falhaCritica?: boolean | null;
  }>;
  criticoNatural?: boolean | null;
  falhaCriticaNatural?: boolean | null;
  origemAcao?: {
    tipo: string;
    idPersonagemJogador?: number | null;
    revisaoPersonagem?: number | null;
    idInstancia?: string | null;
    idItemSistema?: number | null;
    idPoderSistema?: number | null;
    idSistemaVersao?: number | null;
    codigo?: string | null;
    nome?: string | null;
    valores?: Record<string, string>;
  } | null;
  avisos?: Array<{
    codigo: string;
    mensagem: string;
    fallback: boolean;
  }>;
}

export interface GameplayEvent {
  idMesaEvento: number;
  idEvento: number;
  idMesaSessao: number;
  sequencia: number;
  tipo: string;
  origem: 'Automatica' | 'Manual' | 'Administrativa';
  codigoRegra?: string | null;
  codigoAcao?: string | null;
  titulo?: string | null;
  descricao?: string | null;
  idUsuarioAtor?: number | null;
  idPersonagemJogador?: number | null;
  autorNome?: string | null;
  personagemNome?: string | null;
  visibilidade: GameplayVisibility;
  manual: boolean;
  resultadoSemantico?: string | null;
  valorAssociado?: number | null;
  categoria?: string | null;
  observacao?: string | null;
  ocorreuEmUtc: string;
  criadoEmUtc: string;
  rolagem?: GameplayRollResult | null;
  dados?: Record<string, unknown> | null;
  oculto: boolean;
}

export interface GameplayEventPage {
  itens: GameplayEvent[];
  proximoCursor?: string | null;
  haMais: boolean;
  ultimaSequenciaEvento: number;
}

export interface GameplayRollRequest {
  chaveIdempotencia: string;
  codigoAcao: string;
  idPersonagemJogador?: number;
  codigoAtributo?: string;
  grupos: GameplayDiceGroupRequest[];
  modo: GameplayRollMode;
  visibilidade: GameplayVisibility;
  revisaoSessaoEsperada?: number;
  revisaoPersonagemEsperada?: number;
  referenciaAcao?: {
    tipo?: string;
    idInstancia?: string;
    idItemSistema?: number;
    idPoderSistema?: number;
  };
}

export interface GameplayManualRecordRequest {
  chaveIdempotencia: string;
  idPersonagemJogador?: number;
  categoria: string;
  rotulo: string;
  valorBruto?: number;
  resultadoFinal?: number;
  resultadoSemantico?: string;
  valorAssociado?: number;
  observacao?: string;
  visibilidade: GameplayVisibility;
  revisaoSessaoEsperada?: number;
  revisaoPersonagemEsperada?: number;
}

export interface GameplayCommandResponse {
  idComando: number;
  replay: boolean;
  idMesaSessao: number;
  revisaoMesa: number;
  revisaoSessao: number;
  ultimaSequenciaEvento: number;
  sessao?: GameplaySession | null;
  evento?: GameplayEvent | null;
  rolagem?: GameplayRollResult | null;
  simulacao?: boolean;
  aviso?: string;
}

export interface GameplaySimulationResponse {
  simulacao: boolean;
  aviso: string;
  rolagem: GameplayRollResult;
}

export interface GameplayCharacterOption {
  personagem: PersonagemJogador;
  ownerName?: string;
}
