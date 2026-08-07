import type { Item } from '../../models/Itens';
import type { SistemaRuntimeContexto } from '../../models/SistemaRpg';

export interface ItemComparisonMetric {
  key: string;
  label: string;
  value?: number;
  maximum: number;
  referenceMaximum?: number;
  referenceDescription?: string;
  higherIsBetter: boolean;
  showPlus?: boolean;
  accent?: 'pink' | 'purple' | 'green';
}

export interface ItemComparisonDetail {
  key: string;
  label: string;
  value?: string;
  numericValue?: number;
  higherIsBetter?: boolean;
}

export interface ItemComparisonModel {
  item: Item;
  typeLabel: string;
  subtypeLabel?: string;
  metrics: ItemComparisonMetric[];
  details: ItemComparisonDetail[];
  effect?: string;
  special?: string;
}

export interface ItemComparisonModalProps {
  open: boolean;
  item: Item | null;
  onClose: () => void;
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  runtimeContext?: SistemaRuntimeContexto | null;
  availableItems?: Item[];
}

export interface ItemComparisonRuntimeResult {
  context: SistemaRuntimeContexto | null;
  error: string | null;
}
