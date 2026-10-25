export type FieldHelpTone = 'accent' | 'positive' | 'warning' | 'gold' | 'danger' | 'muted';

export interface FieldHelpHighlight {
  text: string;
  tone?: FieldHelpTone;
  style?: 'code' | 'emphasis';
}

export interface FieldHelpParagraph {
  text: string;
  highlights?: FieldHelpHighlight[];
}

export interface FieldHelpPresentation {
  accent?: FieldHelpTone;
  density?: 'comfortable' | 'compact';
  listStyle?: 'bullets' | 'plain';
}

export interface FieldHelpContent extends FieldHelpParagraph {
  id: string;
  title: string;
  options?: { label: string; text: string }[];
  items?: FieldHelpParagraph[];
  footer?: FieldHelpParagraph;
  presentation?: FieldHelpPresentation;
}

export interface FieldHelpProps {
  label: string;
  help?: FieldHelpContent;
  helpKey?: string;
  theme?: 'dark' | 'light';
  neon?: 'on' | 'off';
  inline?: boolean;
  presentation?: FieldHelpPresentation;
}
