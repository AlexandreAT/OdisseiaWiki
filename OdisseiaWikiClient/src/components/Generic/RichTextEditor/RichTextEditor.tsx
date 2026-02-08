import { useState, useEffect, memo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { JSONContent } from '../../../models/Characters';
import { normalizeToJSONContent, createEmptyJSONContent } from '../../../utils/richTextHelpers';
import { RichTextToolbar } from './RichTextToolbar';
import {
  ContentController,
  EditorContainer,
  EditorLabel,
  EditorLabelSpan,
  SpanError,
  EditorWrapper,
} from './RichTextEditor.style';

interface RichTextEditorProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  label: string;
  value?: JSONContent | string;
  onChange?: (content: JSONContent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  error?: boolean;
  errorMessage?: string;
  required?: boolean;
  typeStyle?: 'primary' | 'secondary';
  width?: string;
  height?: string;
  minHeight?: string;
  fullWidth?: boolean;
  placeholder?: string;
}

const RichTextEditorComponent = ({
  theme,
  neon,
  label,
  value,
  onChange,
  onFocus,
  onBlur,
  error,
  errorMessage,
  required,
  typeStyle = 'primary',
  width,
  height,
  minHeight = '150px',
  fullWidth = false,
  placeholder,
}: RichTextEditorProps) => {
  const [focus, setFocus] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Inicializa o editor TipTap
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: createEmptyJSONContent(),
    onUpdate: ({ editor }) => {
      if (onChange && isInitialized) {
        const json = editor.getJSON() as JSONContent;
        onChange(json);
      }
    },
    onFocus: () => {
      setFocus(true);
      onFocus?.();
    },
    onBlur: () => {
      setFocus(false);
      onBlur?.();
    },
    editorProps: {
      attributes: {
        class: 'rich-text-editor-content',
        'data-placeholder': placeholder || '',
      },
    },
  });

  // Atualiza o conteúdo quando o value muda (inicialização ou edição externa)
  useEffect(() => {
    if (!editor) return;

    const currentContent = editor.getJSON();
    let normalizedValue: JSONContent;

    if (!value) {
      normalizedValue = createEmptyJSONContent();
    } else {
      normalizedValue = normalizeToJSONContent(value);
    }

    // Compara se o conteúdo mudou para evitar loops
    const isSame = JSON.stringify(currentContent) === JSON.stringify(normalizedValue);
    
    if (!isSame) {
      editor.commands.setContent(normalizedValue);
    }

    if (!isInitialized) {
      setIsInitialized(true);
    }
  }, [editor, value, isInitialized]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  const hasContent = editor?.getText().trim().length > 0;

  return (
    <ContentController width={width} height={height} fullWidth={fullWidth}>
      <EditorContainer width={width} height={height}>
        <EditorWrapper
          theme={theme}
          neon={neon}
          error={error}
          required={required}
          typeStyle={typeStyle}
          width={width}
          height={height}
          minHeight={minHeight}
          focus={focus}
        >
          {editor && (
            <RichTextToolbar editor={editor} theme={theme} neon={neon} />
          )}
          
          <EditorContent editor={editor} />
        </EditorWrapper>

        <EditorLabel>
          <EditorLabelSpan active={focus || hasContent}>
            {label}
          </EditorLabelSpan>
        </EditorLabel>
      </EditorContainer>
      
      {error && errorMessage && <SpanError>{errorMessage}</SpanError>}
    </ContentController>
  );
};

export const RichTextEditor = memo(RichTextEditorComponent);
