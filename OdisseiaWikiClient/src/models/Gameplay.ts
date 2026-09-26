import type { PersonagemJogador } from './PersonagemJogador';

export type GameplaySessionStatus = 'Ativa' | 'Encerrada';

export type GameplayVisibility =
  | 'PublicaMesa'
  | 'MestreEAutor'
  | 'SomenteMestre';

export type GameplayRollMode = 'Normal' | 'Vantagem' | 'Desvantagem';

/**
 * Regra declarativa de uma ação da ficha. O código sempre aponta para uma
 * tabela de resultados da versão do Sistema usada pela Mesa; o cliente nunca
 * executa a fórmula nem escolhe as faixas de resultado.
 */
export interface GameplayTestSpec {
  codigoTeste: string;
  codigoAtributo?: string;
  grupoAtributo?: 'Principal' | 'Secundario' | string;
  modo?: GameplayRollMode;
  usaTotalParaFaixas?: boolean;
  operacoes?: Array<'ATACAR' | 'DEFENDER' | 'REVIDAR' | string>;
  alcances?: string[];
  modosDisparo?: string[];
}

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
    exigeNatural?: boolean;
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
  efeitosPropostos?: GameplayEffectProposal[];
  rolagensIndividuais?: GameplayRollResult[];
}

export interface GameplayEffectProposal {
  codigo: string;
  tipo: string;
  nome: string;
  alvo: 'AUTOR' | 'ALVO' | string;
  codigoRecurso?: string | null;
  operacao: 'SOMAR' | 'SUBTRAIR' | string;
  valor: number;
  exigeAlvo: boolean;
  podeAplicar: boolean;
  motivoIndisponivel?: string | null;
}

export interface GameplayActionCatalogItem {
  codigo: string;
  nome: string;
  tipo: 'GERAL' | 'ATRIBUTO' | 'XP' | string;
  codigoAtributo?: string | null;
  grupoAtributo?: string | null;
  expressao: string;
  modoPadrao: GameplayRollMode;
  executavel: boolean;
  motivoIndisponivel?: string | null;
}

export interface GameplayActionCatalog {
  idSistemaVersao: number;
  dadoTesteGeral: string;
  acoes: GameplayActionCatalogItem[];
}

export interface GameplayEffectApplyRequest {
  chaveIdempotencia: string;
  idEventoOrigem: number;
  codigoEfeito: string;
  idPersonagemAlvo?: number;
  revisaoSessaoEsperada?: number;
  revisaoPersonagemEsperada: number;
}

export interface GameplayEffectApplication {
  idEventoOrigem: number;
  codigoEfeito: string;
  idPersonagemAlvo: number;
  revisaoPersonagem: number;
  campo: string;
  valorAnterior: number;
  valorAplicado: number;
  valorAtual: number;
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
  parametrosAcao?: {
    operacao?: string;
    alcance?: string;
    modoDisparo?: string;
    quantidade?: number;
  };
}

export type GameplayFavoriteSourceType = 'ATRIBUTO' | 'ITEM' | 'SKILL' | 'MAGIA' | 'PROTESE';

export type GameplayFavoriteRollConfiguration = Omit<
  GameplayRollRequest,
  'chaveIdempotencia' | 'idPersonagemJogador' | 'revisaoSessaoEsperada' | 'revisaoPersonagemEsperada'
>;

export interface GameplayFavoriteRoll {
  idFavorito: string;
  idPersonagemJogador: number;
  tipoOrigem: GameplayFavoriteSourceType;
  idOrigem: string;
  nome: string;
  configuracao: GameplayFavoriteRollConfiguration;
  atualizadoEmUtc: string;
}

export interface GameplayFavoriteRollUpsert {
  tipoOrigem: GameplayFavoriteSourceType;
  idOrigem: string;
  nome: string;
  configuracao: GameplayFavoriteRollConfiguration;
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
  aplicacao?: GameplayEffectApplication | null;
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
