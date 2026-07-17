import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import { JSONContent } from '../../../../../models/Characters';
import { TextContent } from './ImageBlock.style';
import { FirstLineIndent } from '../../../../../components/Generic/RichTextEditor/FirstLineIndent';

interface ImageTextRendererProps {
  content: JSONContent | null | undefined;
}

export const ImageTextRenderer: React.FC<ImageTextRendererProps> = ({ content }) => {
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
    content: content || '',
    editable: false,
  });

  if (!editor || !content) {
    return null;
  }

  return (
    <TextContent>
      <EditorContent editor={editor} />
    </TextContent>
  );
};
