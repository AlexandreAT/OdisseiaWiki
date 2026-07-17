import { useCallback, useMemo } from 'react';
import { Page, PageBlockType } from '../../../models/Pages';
import { JSONContent } from '../../../models/Characters';
import { WikiContextualBlock, WikiSidebarSection } from '../types';

export const createHeadingId = (blockIndex: number, headingIndex: number) => (
  `wiki-heading-${blockIndex}-${headingIndex}`
);

interface Heading {
  level: 1 | 2;
  text: string;
}

const getNodeText = (node: JSONContent): string => {
  if (typeof node.text === 'string') return node.text;
  return node.content?.map(getNodeText).join('') ?? '';
};

const normalizeSidebarTitle = (title: string) => (
  title
    .replace(/:/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
);

const extractHeadingsFromRichText = (content: JSONContent | null | undefined): Heading[] => {
  const headings: Heading[] = [];

  const traverse = (node: JSONContent): void => {
    const legacyHeadingLevel = node.type?.match(/^heading([1-6])$/)?.[1];
    const rawLevel = node.type === 'heading' ? node.attrs?.level : legacyHeadingLevel;
    const level = Number(rawLevel);

    if ((level === 1 || level === 2) && (node.type === 'heading' || legacyHeadingLevel)) {
      const text = normalizeSidebarTitle(getNodeText(node));
      if (text) headings.push({ level, text });
    }

    node.content?.forEach(traverse);
  };

  if (content) traverse(content);
  return headings;
};

const getHeaderOffset = (): number => {
  const mainHeader = document.querySelector('header');
  const wikiHeader = document.querySelector('[data-wiki-header]');
  const visibleBottoms = [mainHeader, wikiHeader]
    .map((element) => element?.getBoundingClientRect().bottom ?? 0)
    .filter((bottom) => bottom > 0);

  return Math.max(0, ...visibleBottoms) + 16;
};

export const useSidebarNavigation = (page: Page | null) => {
  const sections: WikiSidebarSection[] = useMemo(() => {
    if (!page?.blocks?.length) return [];

    const sortedBlocks = [...page.blocks].sort(
      (left, right) => (left.ordem || 0) - (right.ordem || 0),
    );
    const textHeadings: WikiContextualBlock[] = [];

    sortedBlocks.forEach((block, blockIndex) => {
      if (block.tipo !== PageBlockType.RICH_TEXT) return;

      extractHeadingsFromRichText(block.conteudo).forEach((heading, headingIndex) => {
        const targetId = createHeadingId(blockIndex, headingIndex);
        textHeadings.push({
          id: targetId,
          targetId,
          title: heading.text,
          level: heading.level,
          type: PageBlockType.RICH_TEXT,
          blockIndex,
        });
      });
    });

    return textHeadings.length > 0
      ? [{ title: 'Textos', blocks: textHeadings, expanded: true }]
      : [];
  }, [page]);

  const scrollToTarget = useCallback((targetId: string) => {
    const element = document.getElementById(targetId);
    if (!element) return;

    const top = element.getBoundingClientRect().top + window.scrollY - getHeaderOffset();
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }, []);

  return { sections, scrollToTarget };
};
