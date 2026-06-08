import { PageBlock } from '../../../../../models/Pages';

export interface ImageBlockProps {
  block: PageBlock;
  blockIndex: number;
  theme?: 'dark' | 'light';
  neon?: 'on' | 'off';
}
