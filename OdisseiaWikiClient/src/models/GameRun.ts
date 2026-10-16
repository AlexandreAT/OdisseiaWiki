import type { PersonagemStatus, ProficienciaResumo } from './PersonagemJogador';
import type {
  SistemaRuntimeFallback,
  SistemaRuntimeProveniencia,
  SistemaRuntimeWarning,
} from './SistemaRpg';
import type { GameBattlePreview } from './GameBattlePreview';

export interface GameCharacterOption {
  idPersonagemJogador: number;
  nome: string;
  imagem: string | null;
  idRaca: number;
  idSistemaVersao: number | null;
  idSistemaVersaoAtual?: number | null;
  numeroVersaoSistema?: string | null;
  numeroVersaoSistemaAtual?: string | null;
  nomeMesa?: string | null;
  nomeSistema?: string | null;
  atualizacaoDisponivel?: boolean;
  numeroVersaoModo?: string | null;
  lootConfigurado?: boolean | null;
  influenciasAtributosConfiguradas?: boolean | null;
}

export interface GameRunCharacterSnapshot {
  carga?: { pesoAtual: number; capacidade: number; penalidadePercentual: number; sobrecarregado: boolean } | null;
  loot?: GameRunLoot | null;
  schemaVersion: 1;
  idPersonagemJogadorOrigem: number;
  nome: string;
  imagem: string | null;
  idRaca: number;
  idSistemaVersao: number;
  status: PersonagemStatus;
  inventario: unknown;
  implantes: unknown;
  skills: unknown;
  magia: unknown;
  infoSecundariasJson: string | null;
  proficiencias: ProficienciaResumo[];
  sistema: GameRunSystemSnapshot;
}

export interface GameRunLoot {
  nodeId: string;
  faces: number;
  count: number;
  roll: number | null;
  rewards: import('./Itens').Item[];
}
export interface GameAttributeOptions {
  pontos: number;
  atributos: { codigo: string; nome: string; grupo: string; valor: number; limite: number;
    descricao?: string | null; recursos: { recurso: string; antes: number; depois: number; percentual: number }[] }[];
}

export interface GameRunSystemSnapshot {
  idSistemaRpg: number | null;
  idSistemaVersao: number;
  codigoSistema: string;
  numeroVersao: string;
  origem: string;
  proveniencias: SistemaRuntimeProveniencia[];
  warnings: SistemaRuntimeWarning[];
  fallbacks: SistemaRuntimeFallback[];
}

export interface GameRunDto {
  idGameRun: number;
  idPersonagemJogadorOrigem: number;
  idGameModeVersion: number;
  numeroVersaoModo: string;
  idSistemaVersao: number;
  revisao: number;
  status: 'Ativa' | 'Abandonada' | 'Derrota' | 'Vitoria';
  seed: number;
  fase: number;
  noAtualId: string | null;
  criadaEmUtc: string;
  atualizadaEmUtc: string;
  encerradaEmUtc: string | null;
  configuracaoModo: GameRunModeConfig;
  snapshotInicial: GameRunCharacterSnapshot;
  estadoAtual: GameRunCharacterSnapshot;
  ordemArmas: string[];
  acoesEquipadas: GameRunActionSelection[] | null;
  mapa: GameRunMap;
}

export interface GameRunMap {
  schemaVersion: number;
  nodes: GameRunMapNode[];
  parentNodes?: GameRunMapNode[] | null;
  parentMap?: GameRunMap | null;
  secretReturnNodeId?: string | null;
  historicalNodes?: GameRunMapNode[];
  mediumRestUsedMapKeys?: string[];
  openingOpportunityPending?: boolean;
}

export interface GameRunMediumRestPreview {
  disponivel: boolean;
  nome: string;
  vidaRecuperada: number;
  manaRecuperada: number;
  estaminaRecuperada: number;
  motivo: string | null;
  ataqueOportunidadePendente: boolean;
}

export interface GameRunMediumRestResolution {
  run: GameRunDto;
  nome: string;
  vidaRecuperada: number;
  manaRecuperada: number;
  estaminaRecuperada: number;
}

export interface GameRunMapNode {
  id: string;
  name: string;
  image?: string | null;
  areaImage?: string | null;
  areaName?: string | null;
  description?: string | null;
  fase: number;
  layer: number;
  position: number;
  seed: number;
  type: string;
  state: 'DISPONIVEL' | 'SELECIONADO' | 'CONCLUIDO' | 'BLOQUEADO' | 'IGNORADO';
  connections: string[];
  payload: { encounterCode: string | null; secretAreaCode?: string | null } | null;
  revealed: boolean;
}

export interface GameRunModeConfig {
  schemaVersion: number;
  repairProtectionAtBase?: boolean;
  areas?: { image?: string | null; isSecret?: boolean }[];
  encounters?: Record<string, {
    mapName: string;
    lootCount?: number;
    enemy: { name: string; maxVida: number; defesa: number };
    damageByResult: Record<string, number>;
  }>;
}

export interface GameRunBattleRecord {
  noId: string;
  ordem: number;
  criadaEmUtc: string;
  battle: GameBattlePreview;
}

export interface GameRunBaseResolution {
  run: GameRunDto;
  noId: string;
  descanso: string;
  vidaRecuperada: number;
  manaRecuperada: number;
  estaminaRecuperada: number;
  protecaoReparada?: number;
  tipo?: 'BASE' | 'DESCANSO' | 'EVENTO' | 'ATALHO' | 'AREA_SECRETA';
}

export interface GameRunMutationRequest {
  revisaoEsperada: number;
  chaveIdempotencia: string;
}

export interface GameRunEncounterSetup {
  equipe: import('./GameBattlePreview').GameBattlePreviewActor[];
  oponentes: import('./GameBattlePreview').GameBattlePreviewActor[];
  formulaIniciativa: string | null;
}

export interface GameRunBattleRequest extends GameRunMutationRequest {
  alvos?: { actorId: string; targetId: string }[];
}

export interface GameRunWeaponOrderRequest extends GameRunMutationRequest {
  ordemArmas: string[];
}

export interface GameRunActionSelection {
  tipo: 'ITEM' | 'PROTESE' | 'SKILL' | 'MAGIA' | 'DESCANSO';
  idInstancia: string;
  alcance?: 'CURTA' | 'MEDIA' | 'LONGA' | null;
  quantidadeAtaques?: number;
  modoDisparo?: 'TIRO' | 'RAJADA' | null;
}

export interface GameRunLoadoutRequest extends GameRunMutationRequest {
  acoes: GameRunActionSelection[];
}

export interface GameRunConsumeItemRequest extends GameRunMutationRequest {
  idInstancia: string;
  quantidade?: number;
}

export interface GameRunConsumeItemResult {
  run: GameRunDto;
  nomeItem: string;
  quantidadeRestante: number;
  vidaRecuperada: number;
  manaRecuperada: number;
  estaminaRecuperada: number;
}

export interface CreateGameRunRequest {
  idPersonagemJogador: number;
  chaveIdempotencia: string;
}

export interface AbandonGameRunRequest {
  revisaoEsperada: number;
  chaveIdempotencia: string;
}
