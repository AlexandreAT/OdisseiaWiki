import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { normalizeImagePath } from '../../utils/imagePathHelper';

import { WikiContentProps } from './types';

import {
  WikiPageHeaderSection,
  PageDescription,
  PageMeta,
  WikiBlocksSection,
  WikiBlockWrapper,
  ContentHeader,
} from './WikiContent.style';

import { WikiBlockRenderer } from '../blocks';

import TitleGlitch from '../../../../components/Generic/TitleGlitch/TitleGlitch';

export const WikiContent: React.FC<WikiContentProps> = ({
  page,
  headerExpanded = true,
}) => {
  const { theme } = useSelector((state: any) => state.themesReducer);
  const neon = useSelector((state: any) => state.themesReducer?.neon);

  React.useEffect(() => {
  const normalizedCover = normalizeImagePath(
    page.coverImage
  );

  document.documentElement.style.setProperty(
    '--wiki-background-image',
    normalizedCover
      ? `url("${normalizedCover}")`
      : 'none'
  );

  return () => {
    document.documentElement.style.setProperty(
      '--wiki-background-image',
      'none'
    );
  };
}, [page.coverImage]);

  const sortedBlocks = useMemo(() => {
    if (!page.blocks || page.blocks.length === 0) {
      return [];
    }

    return [...page.blocks].sort(
      (a, b) => (a.ordem || 0) - (b.ordem || 0)
    );
  }, [page.blocks]);

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);

      return date.toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <WikiPageHeaderSection
        $coverImage={normalizeImagePath(page.coverImage)}
        $headerExpanded={headerExpanded}
      >
        <ContentHeader>
          <TitleGlitch
            theme={theme}
            neon={neon}
            text={page.titulo}
            fontSize="4rem"
          />

          {page.descricao && (
            <PageDescription>{page.descricao}</PageDescription>
          )}

          {page.dataCriacao && (
            <PageMeta>
              <span>
                Criado em {formatDate(page.dataCriacao)}
              </span>
            </PageMeta>
          )}
        </ContentHeader>
      </WikiPageHeaderSection>

      <WikiBlocksSection>
        {sortedBlocks.length > 0 ? (
          sortedBlocks.map((block, index) => (
            <WikiBlockWrapper
              key={block.tempId || index}
              id={`wiki-block-${index}`}
            >
              <WikiBlockRenderer
                block={block}
                blockIndex={index}
              />
            </WikiBlockWrapper>
          ))
        ) : (
          <WikiBlockWrapper>
            <p
              style={{
                margin: 0,
                opacity: 0.6,
              }}
            >
              Nenhum conteúdo disponível para esta página.
            </p>
          </WikiBlockWrapper>
        )}
      </WikiBlocksSection>
    </>
  );
};