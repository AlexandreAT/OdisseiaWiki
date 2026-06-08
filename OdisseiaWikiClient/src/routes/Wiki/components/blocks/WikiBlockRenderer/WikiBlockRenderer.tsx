import React, { lazy, Suspense } from 'react';
import { PageBlockType } from '../../../../../models/Pages';
import { WikiBlockRendererProps } from './types';
import {
  BlockRendererContainer,
  UnknownBlockMessage,
} from './WikiBlockRenderer.style';

// Lazy load block components for better performance
const RichTextBlock = lazy(() =>
  import('../RichTextBlock').then(m => ({ default: m.RichTextBlock }))
);
const ImageBlock = lazy(() =>
  import('../ImageBlock').then(m => ({ default: m.ImageBlock }))
);
const GalleryBlock = lazy(() =>
  import('../GalleryBlock').then(m => ({ default: m.GalleryBlock }))
);
const InfoLoreBlock = lazy(() =>
  import('../InfoLoreBlock').then(m => ({ default: m.InfoLoreBlock }))
);
const RelationBlock = lazy(() =>
  import('../RelationBlock').then(m => ({ default: m.RelationBlock }))
);

const BlockFallback = () => <div style={{ padding: '16px' }}>Carregando bloco...</div>;

export const WikiBlockRenderer: React.FC<WikiBlockRendererProps> = ({
  block,
  blockIndex,
  theme,
  neon,
}) => {
  if (!block) {
    return null;
  }

  const renderBlock = () => {
    switch (block.tipo) {
      case PageBlockType.RICH_TEXT:
        return (
          <Suspense fallback={<BlockFallback />}>
            <RichTextBlock block={block} blockIndex={blockIndex} theme={theme} neon={neon} />
          </Suspense>
        );

      case PageBlockType.IMAGE:
        return (
          <Suspense fallback={<BlockFallback />}>
            <ImageBlock block={block} blockIndex={blockIndex} theme={theme} neon={neon} />
          </Suspense>
        );

      case PageBlockType.GALLERY:
        return (
          <Suspense fallback={<BlockFallback />}>
            <GalleryBlock block={block} blockIndex={blockIndex} theme={theme} neon={neon} />
          </Suspense>
        );

      case PageBlockType.INFOLORE:
        return (
          <Suspense fallback={<BlockFallback />}>
            <InfoLoreBlock block={block} blockIndex={blockIndex} theme={theme} neon={neon} />
          </Suspense>
        );

      case PageBlockType.RELATION:
        return (
          <Suspense fallback={<BlockFallback />}>
            <RelationBlock block={block} blockIndex={blockIndex} theme={theme} neon={neon} />
          </Suspense>
        );

      default:
        return (
          <UnknownBlockMessage>
            <p>Tipo de bloco desconhecido: {(block.tipo as string) || 'Indefinido'}</p>
          </UnknownBlockMessage>
        );
    }
  };

  return <BlockRendererContainer>{renderBlock()}</BlockRendererContainer>;
};
