import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import { RichTextBlockProps } from './types';
import { RichTextBlockContainer, ErrorMessage, DivController } from './RichTextBlock.style';

export const RichTextBlock: React.FC<RichTextBlockProps> = ({ block }) => {
  if (!block.conteudo) {
    return null;
  }

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: block.conteudo,
    editable: false,
  });

  if (!editor) {
    return (
      <ErrorMessage>
        <p>Erro ao carregar o bloco de texto</p>
      </ErrorMessage>
    );
  }

  return (
    <DivController>
      <RichTextBlockContainer>
        <EditorContent editor={editor} />
      </RichTextBlockContainer>
    </DivController>
  );
};
