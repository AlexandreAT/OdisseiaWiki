import React, { useEffect, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import { RichTextBlockProps } from './types';
import { RichTextBlockContainer, ErrorMessage, DivController } from './RichTextBlock.style';
import { createHeadingId } from '../../../hooks/useSidebarNavigation';
import { FirstLineIndent } from '../../../../../components/Generic/RichTextEditor/FirstLineIndent';

export const RichTextBlock: React.FC<RichTextBlockProps> = ({
  block,
  blockIndex = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      FirstLineIndent,
    ],
    content: block.conteudo ?? '',
    editable: false,
  });

  useEffect(() => {
    if (!editor || !block.conteudo) return;

    const animationFrame = window.requestAnimationFrame(() => {
      containerRef.current
        ?.querySelectorAll<HTMLHeadingElement>('.ProseMirror h1, .ProseMirror h2')
        .forEach((heading, headingIndex) => {
          heading.id = createHeadingId(blockIndex, headingIndex);
        });
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [block.conteudo, blockIndex, editor]);

  if (!block.conteudo) return null;

  if (!editor) {
    return (
      <ErrorMessage>
        <p>Erro ao carregar o bloco de texto</p>
      </ErrorMessage>
    );
  }

  return (
    <DivController>
      <RichTextBlockContainer ref={containerRef}>
        <EditorContent editor={editor} />
      </RichTextBlockContainer>
    </DivController>
  );
};
