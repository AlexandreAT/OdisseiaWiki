import { PageBlock } from '../../../../../models/Pages';

export interface RichTextBlockProps {
  block: PageBlock;
  blockIndex?: number;
  theme?: 'dark' | 'light';
  neon?: 'on' | 'off';
}
