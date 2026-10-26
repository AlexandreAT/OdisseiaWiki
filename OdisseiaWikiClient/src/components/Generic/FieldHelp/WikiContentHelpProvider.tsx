import type { ReactNode } from 'react';
import { wikiContentHelpResolvers, type WikiContentHelpScope } from '../../../content/wikiContentHelp';
import { FieldHelpProvider } from './FieldHelpProvider';

export const WikiContentHelpProvider = ({ scope, children, theme, neon }: {
  scope: WikiContentHelpScope;
  children: ReactNode;
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}) => <FieldHelpProvider resolve={wikiContentHelpResolvers[scope]} theme={theme} neon={neon}>
  {children}
</FieldHelpProvider>;
