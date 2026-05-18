import React, { useMemo } from 'react';
import { WikiContentProps } from './types';
import {
  WikiPageHeaderSection,
  PageCoverImage,
  PageTitle,
  PageDescription,
  PageMeta,
  WikiBlocksSection,
  WikiBlockWrapper,
} from './WikiContent.style';
import { WikiBlockRenderer } from '../blocks';

export const WikiContent: React.FC<WikiContentProps> = ({ page }) => {
  // Ordenar blocos por ordem
  const sortedBlocks = useMemo(() => {
    if (!page.blocks || page.blocks.length === 0) {
      return [];
    }
    return [...page.blocks].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  }, [page.blocks]);

  // Formatar data
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
      <WikiPageHeaderSection>
        {page.coverImage && <PageCoverImage src={page.coverImage} alt={page.titulo} />}
        <PageTitle>{page.titulo}</PageTitle>
        {page.descricao && <PageDescription>{page.descricao}</PageDescription>}
        {page.dataCriacao && (
          <PageMeta>
            <span>Criado em {formatDate(page.dataCriacao)}</span>
          </PageMeta>
        )}
      </WikiPageHeaderSection>

      <WikiBlocksSection>
        {sortedBlocks.length > 0 ? (
          sortedBlocks.map((block, index) => (
            <WikiBlockWrapper key={block.tempId || index} id={`wiki-block-${index}`}>
              <WikiBlockRenderer block={block} blockIndex={index} />
            </WikiBlockWrapper>
          ))
        ) : (
          <WikiBlockWrapper>
            <p style={{ margin: 0, opacity: 0.6 }}>Nenhum conteúdo disponível para esta página.</p>
          </WikiBlockWrapper>
        )}
      </WikiBlocksSection>
    </>
  );
};
