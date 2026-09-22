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
