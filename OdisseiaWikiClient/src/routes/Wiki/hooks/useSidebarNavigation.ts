import { useMemo } from 'react';
import { Page, PageBlockType } from '../../../models/Pages';
import { WikiSidebarSection, WikiContextualBlock } from '../types';
import { JSONContent } from '../../../models/Characters';

export const useSidebarNavigation = (page: Page | null) => {
  const sections: WikiSidebarSection[] = useMemo(() => {
    if (!page || !page.blocks || page.blocks.length === 0) {
      return [];
    }

    const textBlocks: WikiContextualBlock[] = [];
    const infoLoreBlocks: WikiContextualBlock[] = [];

    page.blocks.forEach((block, blockIndex) => {
      const blockId = block.tempId || `block-${blockIndex}`;

      if (block.tipo === PageBlockType.RICH_TEXT) {
        // Extract headings from rich text content for the sidebar labels
        const headings = extractHeadingsFromRichText(block.conteudo);

        if (headings.length > 0) {
          headings.forEach((heading, headingIndex) => {
            textBlocks.push({
              id: `heading-${blockIndex}-${headingIndex}`,
              title: heading.text,
              type: PageBlockType.RICH_TEXT,
              blockIndex,
            });
          });
        } else {
          textBlocks.push({
            id: blockId,
            title: `Seção de Texto ${blockIndex + 1}`,
            type: PageBlockType.RICH_TEXT,
            blockIndex,
          });
        }
      } else if (block.tipo === PageBlockType.INFOLORE) {
        infoLoreBlocks.push({
          id: blockId,
          title: block.conteudo?.titulo || `InfoLore ${blockIndex + 1}`,
          type: PageBlockType.INFOLORE,
          blockIndex,
        });
      }
    });

    const navigation: WikiSidebarSection[] = [];

    if (textBlocks.length > 0) {
      navigation.push({
        title: 'Textos',
        blocks: textBlocks,
        expanded: true,
      });
    }

    if (infoLoreBlocks.length > 0) {
      navigation.push({
        title: 'Informações',
        blocks: infoLoreBlocks,
        expanded: true,
      });
    }

    return navigation;
  }, [page]);

  const scrollToBlock = (blockIndex: number) => {
    const element = document.getElementById(`wiki-block-${blockIndex}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Offset for the fixed header (167px when expanded, 100px when collapsed)
      window.scrollBy({ top: -200, behavior: 'smooth' });
    }
  };

  return { sections, scrollToBlock };
};

// Helper to extract headings from JSONContent — used only for sidebar text labels
interface Heading {
  level: number;
  text: string;
}

const extractHeadingsFromRichText = (content: JSONContent | any): Heading[] => {
  const headings: Heading[] = [];

  if (!content || !content.content || !Array.isArray(content.content)) {
    return headings;
  }

  const traverse = (node: any): void => {
    if (!node) return;

    if (node.type && node.type.match(/^heading/)) {
      const level = parseInt(node.type.replace('heading', '')) || 1;
      let text = '';

      if (node.content && Array.isArray(node.content)) {
        text = node.content
          .map((n: any) => n.text || '')
          .join('')
          .trim();
      }

      if (text) {
        headings.push({ level, text });
      }
    }

    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(traverse);
    }
  };

  content.content.forEach(traverse);
  return headings;
};