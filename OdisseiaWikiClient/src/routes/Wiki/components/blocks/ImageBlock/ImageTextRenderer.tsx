import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import { JSONContent } from '../../../../../models/Characters';
import { TextContent } from './ImageBlock.style';
import { FirstLineIndent } from '../../../../../components/Generic/RichTextEditor/FirstLineIndent';
import { createHeadingId } from '../../../hooks/useSidebarNavigation';

interface ImageTextRendererProps {
  content: JSONContent | null | undefined;
  blockIndex: number;
}

export const ImageTextRenderer: React.FC<ImageTextRendererProps> = ({ content, blockIndex }) => {
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
    content: content || '',
    editable: false,
  });

  useEffect(() => {
    if (!editor || !content) return;

    const animationFrame = window.requestAnimationFrame(() => {
      containerRef.current
        ?.querySelectorAll<HTMLHeadingElement>('.ProseMirror h1, .ProseMirror h2')
        .forEach((heading, headingIndex) => {
          heading.id = createHeadingId(blockIndex, headingIndex);
        });
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [blockIndex, content, editor]);

  if (!editor || !content) {
    return null;
  }

  return (
    <TextContent ref={containerRef}>
      <EditorContent editor={editor} />
    </TextContent>
  );
};
