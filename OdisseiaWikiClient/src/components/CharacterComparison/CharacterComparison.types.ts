import { ConfiguracaoCriacaoSistema } from '../../models/SistemaRpg';

export type CharacterComparisonSource = 'Npc' | 'Jogador';

export type RadarAxisKey =
  | 'vida'
  | 'precisao'
  | 'sabedoria'
  | 'mana'
  | 'agilidade'
  | 'estamina'
  | 'forca'
  | 'resistencia';

export interface CharacterComparisonRuntime {
  idSistemaRpg?: number | null;
  idSistemaVersao?: number | null;
  codigoSistema: string;
  nomeSistema?: string | null;
  numeroVersao: string;
  usaFallbackLegado?: boolean;
  escalas?: Partial<Record<RadarAxisKey, number>>;
  criacao?: ConfiguracaoCriacaoSistema | null;
}

export interface CharacterComparisonStatus {
  vida: number;
  estamina: number;
  mana: number;
  resistencia: number;
  agilidade: number;
  sabedoria: number;
  precisao: number;
  forca: number;
  escudo: number;
  protecao: number;
  armadura: number;
  outras: number;
  nivel: number;
}

export interface CharacterComparisonData {
  id?: number;
  origem: CharacterComparisonSource;
  nome: string;
  imagem?: string;
  idMesa?: number | null;
  mesaNome?: string | null;
  quantidadeSkills: number;
  status: CharacterComparisonStatus;
  sistemaRuntime?: CharacterComparisonRuntime | null;
}

export interface CharacterComparisonModalProps {
  open: boolean;
  current?: CharacterComparisonData | null;
  source: CharacterComparisonSource;
  sourceId?: number;
  tableId?: number | null;
  onClose: () => void;
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

export interface RadarAxis {
  key: RadarAxisKey;
  label: string;
  fallbackMax: number;
}
