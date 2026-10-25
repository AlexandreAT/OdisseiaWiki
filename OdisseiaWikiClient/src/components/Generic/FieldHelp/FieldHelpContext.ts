import { createContext, useContext } from 'react';
import type { FieldHelpContent } from './FieldHelp.types';

export interface HelpContext {
  resolve: (key: string) => FieldHelpContent | undefined;
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

export const FieldHelpContext = createContext<HelpContext | null>(null);
export const useFieldHelpContext = () => useContext(FieldHelpContext);
