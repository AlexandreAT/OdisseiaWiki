import { PageBlock } from '../../../../../models/Pages';

export interface WikiBlockRendererProps {
  block: PageBlock;
  blockIndex: number;
  theme?: 'dark' | 'light';
  neon?: 'on' | 'off';
}

export interface BlockProps {
  block: PageBlock;
  blockIndex: number;
  theme?: 'dark' | 'light';
  neon?: 'on' | 'off';
}
