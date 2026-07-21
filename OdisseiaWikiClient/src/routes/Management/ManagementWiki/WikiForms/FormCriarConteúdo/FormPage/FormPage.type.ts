import { PageDto, PageBlock } from '../../../../../../models/Pages';

export interface FormPageProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  initialPage?: PageDto;
  initialBlocks?: PageBlock[];
  pageId?: number;
  contentType?: string;
  onSaveSuccess?: (options: { stayOnPage: boolean }) => void | Promise<void>;
}

export interface FormPageErrors {
  titulo?: string;
  slug?: string;
}
