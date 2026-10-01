import type { GameplayEffectApplication, GameplayRollResult } from './Gameplay';

export type GameplayCombatStatus = 'Preparacao' | 'Ativo' | 'Encerrado';
export type GameplayCombatParticipantStatus =
  | 'AguardandoIniciativa' | 'Pronto' | 'Ativo' | 'ABeiraDaMorte'
  | 'Estabilizado' | 'Morto' | 'Removido';

export interface GameplayCombatParticipant {
  idParticipante: number;
  tipo: 'PersonagemJogador' | 'Npc';
  status: GameplayCombatParticipantStatus;
  idPersonagemJogador?: number | null;
  idPersonagemOrigem?: number | null;
  idVarianteOrigem?: string | null;
  idUsuarioControlador?: number | null;
  nome: string;
  imagem?: string | null;
  modificadorIniciativa: number;
  iniciativa?: number | null;
  valorNaturalIniciativa?: number | null;
  ordem: number;
  podeRolarIniciativa: boolean;
  podeControlar: boolean;
  sucessosSobrevivencia: number;
  falhasSobrevivencia: number;
}

export interface GameplayActiveCondition {
  idCondicaoAtiva: number;
  idParticipante: number;
  codigo: string;
  nome: string;
  status: 'Ativa' | 'Removida' | 'Expirada';
  acumulos: number;
  valor?: number | null;
  duracao?: number | null;
  unidadeDuracao: 'Turno' | 'Minuto' | 'Hora' | 'Descanso' | 'Sessao' | 'Permanente';
  turnosRestantes?: number | null;
  cooldownTurnos?: number | null;
  regraRemocao?: string | null;
}

export interface GameplayConditionCatalogItem {
  idSistemaCondicao: number;
  codigo: string;
  nome: string;
  descricao?: string | null;
  tipo: string;
  duracaoPadrao?: number | null;
  unidadeDuracao: GameplayActiveCondition['unidadeDuracao'];
  empilhavel: boolean;
  permiteSobrescrever: boolean;
  valorPadrao?: number | null;
  codigoRecurso?: string | null;
  operacaoEfeito?: string | null;
  valorEfeito?: number | null;
  momentoEfeito?: string | null;
  cooldownTurnos?: number | null;
  regraRemocao?: string | null;
}

export interface GameplayRestCatalogItem {
  idSistemaDescansoConfig: number;
  tipo: string;
  nome: string;
  duracaoMinimaMinutos?: number | null;
  recuperacaoVida: number;
  recuperacaoMana: number;
  recuperacaoEstamina: number;
  tipoRecuperacao: 'ValorFixo' | 'Percentual' | 'Formula';
  exigeGuarda: boolean;
  permiteAtividades: boolean;
}

export interface GameplayCombatSnapshot {
  idMesaCombate: number;
  idMesaSessao: number;
  status: GameplayCombatStatus;
  rodadaAtual: number;
  indiceTurnoAtual: number;
  idParticipanteAtual?: number | null;
  revisao: number;
  podeGerenciar: boolean;
  formulaIniciativa: string;
  participantes: GameplayCombatParticipant[];
  condicoes: GameplayActiveCondition[];
  cooldowns: Array<{
    idCooldown: number;
    idParticipante: number;
    tipoOrigem: string;
    idOrigem: string;
    nome: string;
    turnosRestantes: number;
  }>;
  catalogoCondicoes: GameplayConditionCatalogItem[];
  catalogoDescansos: GameplayRestCatalogItem[];
}

export interface GameplayStateCatalog {
  condicoes: GameplayConditionCatalogItem[];
  descansos: GameplayRestCatalogItem[];
}

export interface GameplayCombatCommandResponse {
  replay: boolean;
  idMesaSessao: number;
  revisaoSessao: number;
  idEvento?: number | null;
  combate?: GameplayCombatSnapshot | null;
  rolagem?: GameplayRollResult | null;
  aplicacao?: GameplayEffectApplication | null;
  aplicacoes: GameplayEffectApplication[];
}

export interface GameplayCombatCommandBase {
  chaveIdempotencia: string;
  revisaoSessaoEsperada?: number;
  revisaoCombateEsperada?: number;
}
