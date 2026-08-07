import { ImageDisplayShape } from '../../../utils/imageDisplayShape';

export interface GalleryModalItem {
  url: string;
  caption?: string;
  shape?: ImageDisplayShape;
}

export interface GalleryModalProps {
  title: string;
  images: GalleryModalItem[];
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  onClose: () => void;
  onSelect: (index: number) => void;
}
