import { useMemo, type ReactNode } from 'react';
import { FieldHelpContext, type HelpContext } from './FieldHelpContext';

export const FieldHelpProvider = ({ children, resolve, theme, neon }: HelpContext & { children: ReactNode }) => {
  const value = useMemo(() => ({ resolve, theme, neon }), [resolve, theme, neon]);
  return <FieldHelpContext.Provider value={value}>{children}</FieldHelpContext.Provider>;
};
