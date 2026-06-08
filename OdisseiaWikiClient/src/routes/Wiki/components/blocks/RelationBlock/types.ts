import { PageBlock } from '../../../../../models/Pages';

export interface RelationBlockProps {
  block: PageBlock;
  blockIndex: number;
  theme?: 'dark' | 'light';
  neon?: 'on' | 'off';
}
