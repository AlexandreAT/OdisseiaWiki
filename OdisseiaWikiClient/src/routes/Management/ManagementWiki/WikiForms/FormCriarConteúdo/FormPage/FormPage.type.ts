import { PageDto, PageBlock } from '../../../../../../models/Pages';

export interface FormPageProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  initialPage?: PageDto;
  initialBlocks?: PageBlock[];
  pageId?: number;
  contentType?: string;
}

export interface FormPageErrors {
  titulo?: string;
  slug?: string;
}
