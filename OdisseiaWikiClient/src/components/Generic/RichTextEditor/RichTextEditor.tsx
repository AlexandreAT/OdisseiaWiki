import { useState, useEffect, memo, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { JSONContent } from '../../../models/Characters';
import { normalizeToJSONContent, createEmptyJSONContent } from '../../../utils/richTextHelpers';
import { RichTextToolbar } from './RichTextToolbar';
import RichTextModal from '../RichTextModal';
import { MdOutlineOpenInFull } from 'react-icons/md';
import { FirstLineIndent } from './FirstLineIndent';
import {
  ContentController,
  EditorContainer,
  EditorLabel,
  EditorLabelSpan,
  SpanError,
  EditorWrapper,
  ExpandButton,
} from './RichTextEditor.style';
import { FormLabelText } from '../FormLabelText';
import { revealFirstValidationError } from '../../../utils/formValidationFeedback';

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
  expandable?: boolean;
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
  expandable = false,
}: RichTextEditorProps) => {
  const [focus, setFocus] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedContent, setExpandedContent] = useState<JSONContent | string>(
    value || createEmptyJSONContent(),
  );
  const controllerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error) revealFirstValidationError(controllerRef.current);
  }, [error]);

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
      FirstLineIndent,
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

  const handleExpand = () => {
    setExpandedContent((editor?.getJSON() as JSONContent | undefined) || value || createEmptyJSONContent());
    setIsExpanded(true);
  };

  const handleExpandedSave = (content: JSONContent | string) => {
    const normalizedContent = normalizeToJSONContent(content);
    setExpandedContent(normalizedContent);
    onChange?.(normalizedContent);
  };

  return (
    <ContentController
      ref={controllerRef}
      width={width}
      height={height}
      fullWidth={fullWidth}
      data-validation-error={error || undefined}
    >
      <EditorContainer width={width} height={height}>
        {expandable && (
          <ExpandButton
            type="button"
            theme={theme}
            neon={neon}
            onClick={handleExpand}
            title={`Expandir ${label || 'editor de texto'}`}
            aria-label={`Expandir ${label || 'editor de texto'}`}
          >
            <MdOutlineOpenInFull />
            <span>Expandir</span>
          </ExpandButton>
        )}
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
          $expandable={expandable}
        >
          {editor && (
            <RichTextToolbar editor={editor} theme={theme} neon={neon} />
          )}

          <EditorLabel>
            <EditorLabelSpan active={focus || hasContent}>
              <FormLabelText label={label} required={required} />
            </EditorLabelSpan>
          </EditorLabel>
          
          <EditorContent editor={editor} />
        </EditorWrapper>
      </EditorContainer>
      
      {error && errorMessage && <SpanError>{errorMessage}</SpanError>}

      {expandable && (
        <RichTextModal
          isOpen={isExpanded}
          onClose={() => setIsExpanded(false)}
          onSave={handleExpandedSave}
          initialContent={expandedContent}
          title={label || 'Editar texto'}
          placeholder={placeholder}
          theme={theme}
          neon={neon}
        />
      )}
    </ContentController>
  );
};

export const RichTextEditor = memo(RichTextEditorComponent);
