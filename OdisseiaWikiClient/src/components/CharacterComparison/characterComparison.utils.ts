import { PersonagemStatus } from '../../models/Characters';
import { SistemaRuntimeContexto } from '../../models/SistemaRpg';
import {
  CharacterComparisonData,
  CharacterComparisonRuntime,
  CharacterComparisonSource,
  RadarAxis,
  RadarAxisKey,
} from './CharacterComparison.types';

export const RADAR_AXES: RadarAxis[] = [
  { key: 'vida', label: 'Vida', fallbackMax: 5000 },
  { key: 'precisao', label: 'Precisão', fallbackMax: 6 },
  { key: 'sabedoria', label: 'Sabedoria', fallbackMax: 6 },
  { key: 'mana', label: 'Mana', fallbackMax: 500 },
  { key: 'agilidade', label: 'Agilidade', fallbackMax: 6 },
  { key: 'estamina', label: 'Estamina', fallbackMax: 500 },
  { key: 'forca', label: 'Força', fallbackMax: 6 },
  { key: 'resistencia', label: 'Resistência', fallbackMax: 6 },
];

interface CreateComparisonDataArgs {
  id?: number;
  origem: CharacterComparisonSource;
  nome?: string;
  imagem?: string;
  idMesa?: number | null;
  mesaNome?: string | null;
  status: PersonagemStatus;
  quantidadeSkills?: number;
  sistemaRuntime?: SistemaRuntimeContexto | CharacterComparisonRuntime | null;
}

export const createCharacterComparisonData = ({
  id,
  origem,
  nome,
  imagem,
  idMesa,
  mesaNome,
  status,
  quantidadeSkills = 0,
  sistemaRuntime,
}: CreateComparisonDataArgs): CharacterComparisonData => ({
  id,
  origem,
  nome: nome?.trim() || 'Personagem sem nome',
  imagem,
  idMesa,
  mesaNome,
  quantidadeSkills,
  sistemaRuntime,
  status: {
    vida: positiveOrFallback(status.status?.vidaMaxima, status.status?.vida),
    estamina: positiveOrFallback(status.status?.estaminaMaxima, status.status?.estamina),
    mana: positiveOrFallback(status.status?.manaMaxima, status.status?.mana),
    resistencia: numberOrZero(status.atributos?.principais?.resistencia),
    agilidade: numberOrZero(status.atributos?.principais?.agilidade),
    sabedoria: numberOrZero(status.atributos?.principais?.sabedoria),
    precisao: numberOrZero(status.atributos?.principais?.precisao),
    forca: numberOrZero(status.atributos?.principais?.forca),
    escudo: numberOrZero(status.defesas?.escudo),
    protecao: numberOrZero(status.defesas?.protecao),
    armadura: numberOrZero(status.defesas?.armadura),
    outras: numberOrZero(status.defesas?.outras),
    nivel: Math.max(1, numberOrZero(status.nivel) || 1),
  },
});

export const getCharacterSystemLabel = (character: CharacterComparisonData) => (
  character.sistemaRuntime?.nomeSistema
  || character.sistemaRuntime?.codigoSistema
  || 'Sistema não informado'
);

export const hasDifferentRuntime = (
  current: CharacterComparisonData,
  candidate: CharacterComparisonData,
) => (current.sistemaRuntime?.idSistemaRpg ?? current.sistemaRuntime?.codigoSistema)
    !== (candidate.sistemaRuntime?.idSistemaRpg ?? candidate.sistemaRuntime?.codigoSistema)
  || (current.sistemaRuntime?.idSistemaVersao ?? current.sistemaRuntime?.numeroVersao)
    !== (candidate.sistemaRuntime?.idSistemaVersao ?? candidate.sistemaRuntime?.numeroVersao);

export const getRadarScales = (
  current: CharacterComparisonData,
  candidate?: CharacterComparisonData | null,
): Record<RadarAxisKey, number> => RADAR_AXES.reduce((scales, axis) => {
  const currentScale = getRuntimeScale(current.sistemaRuntime, axis) || axis.fallbackMax;
  const candidateScale = candidate
    ? getRuntimeScale(candidate.sistemaRuntime, axis) || axis.fallbackMax
    : currentScale;
  scales[axis.key] = Math.max(currentScale, candidateScale);
  return scales;
}, {} as Record<RadarAxisKey, number>);

export const formatComparisonDelta = (value: number, other?: number) => {
  if (other == null) return null;
  const difference = value - other;
  if (difference === 0) return { label: '=', kind: 'equal' as const };
  return {
    label: `${difference > 0 ? '+' : '−'}${formatNumber(Math.abs(difference))}`,
    kind: difference > 0 ? 'positive' as const : 'negative' as const,
  };
};

export const formatNumber = (value: number) => new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 2,
}).format(value);

const getRuntimeScale = (runtime: CharacterComparisonRuntime | null | undefined, axis: RadarAxis) => {
  const summarizedScale = numberOrZero(runtime?.escalas?.[axis.key]);
  if (summarizedScale > 0) return summarizedScale;

  const code = normalizeCode(axis.key);
  if (['vida', 'mana', 'estamina'].includes(code)) {
    const resource = runtime?.criacao?.recursos?.find((entry) => normalizeCode(entry.codigo) === code);
    // Valor padrão é o valor inicial do recurso, não o teto visual da escala.
    // Quando o Sistema não define um máximo explícito, o chamador usa o fallback centralizado.
    return positiveOrFallback(resource?.valorMaximo, 0);
  }

  const attribute = runtime?.criacao?.atributos?.find((entry) => normalizeCode(entry.codigo) === code);
  return positiveOrFallback(attribute?.valorMaximoAbsoluto, attribute?.valorMaximoNatural);
};

const normalizeCode = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9]/g, '')
  .toLowerCase();

const numberOrZero = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const positiveOrFallback = (preferred: unknown, fallback: unknown) => {
  const preferredNumber = numberOrZero(preferred);
  return preferredNumber > 0 ? preferredNumber : numberOrZero(fallback);
};
