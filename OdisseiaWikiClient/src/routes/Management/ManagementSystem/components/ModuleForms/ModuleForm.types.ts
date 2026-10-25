import {
  SistemaModuloConfigMap,
  SistemaModuloKey,
} from '../../../../../models/SistemaRpg';
import { SistemaValidationErrors } from '../../systemValidation';

export interface RaceOption {
  id: number;
  nome: string;
}

export interface SystemReferenceOption { value: string; label: string; description?: string }
export interface SystemReferenceCatalog {
  attributes: SystemReferenceOption[];
  resources: SystemReferenceOption[];
  conditions: SystemReferenceOption[];
  testCodes: SystemReferenceOption[];
  weaponTypes: SystemReferenceOption[];
}

export interface ModuleFormProps<K extends SistemaModuloKey> {
  value: SistemaModuloConfigMap[K];
  onChange: (value: SistemaModuloConfigMap[K]) => void;
  errors: SistemaValidationErrors;
  readOnly: boolean;
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  raceOptions?: RaceOption[];
  systemCode?: string;
  references?: SystemReferenceCatalog;
  idSistemaVersao?: number;
  onUploadBusyChange?: (busy: boolean) => void;
}
