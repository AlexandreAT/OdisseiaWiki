import { PageBlock } from '../../../../../models/Pages';

export interface GalleryBlockProps {
  block: PageBlock;
  blockIndex: number;
  theme?: 'dark' | 'light';
  neon?: 'on' | 'off';
}
