import { Page } from '../../../../models/Pages';

export interface WikiSidebarProps {
  page: Page | null;
}

export interface SectionItemProps {
  $isActive?: boolean;
}
