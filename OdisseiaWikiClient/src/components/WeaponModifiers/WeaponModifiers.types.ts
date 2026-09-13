import type { ModificadoresArma, ModoModificadoresArma } from '../../models/Itens';

export interface WeaponModifiersProps {
  value?: ModificadoresArma;
  onChange: (value: ModificadoresArma) => void;
  mode?: ModoModificadoresArma | 'todas';
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}
