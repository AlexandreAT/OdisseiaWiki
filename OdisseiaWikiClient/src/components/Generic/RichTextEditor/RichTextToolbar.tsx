import { Editor } from '@tiptap/react';
import {
  ToolbarContainer,
  ToolbarButton,
  ToolbarDivider,
  ToolbarGroup,
} from './RichTextEditor.style';

interface RichTextToolbarProps {
  editor: Editor;
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

export const RichTextToolbar = ({ editor, theme, neon }: RichTextToolbarProps) => {
  if (!editor) return null;

  return (
    <ToolbarContainer theme={theme} neon={neon}>
      {/* Formatação de texto */}
      <ToolbarGroup>
        <ToolbarButton
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleBold().run();
          }}
          active={editor.isActive('bold')}
          title="Negrito (Ctrl+B)"
          theme={theme}
          neon={neon}
          type="button"
        >
          <strong>B</strong>
        </ToolbarButton>
        
        <ToolbarButton
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleItalic().run();
          }}
          active={editor.isActive('italic')}
          title="Itálico (Ctrl+I)"
          theme={theme}
          neon={neon}
          type="button"
        >
          <em>I</em>
        </ToolbarButton>
        
        <ToolbarButton
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleUnderline().run();
          }}
          active={editor.isActive('underline')}
          title="Sublinhado (Ctrl+U)"
          theme={theme}
          neon={neon}
          type="button"
        >
          <u>U</u>
        </ToolbarButton>
        
        <ToolbarButton
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleStrike().run();
          }}
          active={editor.isActive('strike')}
          title="Tachado"
          theme={theme}
          neon={neon}
          type="button"
        >
          <s>S</s>
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarDivider theme={theme} />

      {/* Títulos */}
      <ToolbarGroup>
        <ToolbarButton
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleHeading({ level: 1 }).run();
          }}
          active={editor.isActive('heading', { level: 1 })}
          title="Título 1"
          theme={theme}
          neon={neon}
          type="button"
        >
          H1
        </ToolbarButton>
        
        <ToolbarButton
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleHeading({ level: 2 }).run();
          }}
          active={editor.isActive('heading', { level: 2 })}
          title="Título 2"
          theme={theme}
          neon={neon}
          type="button"
        >
          H2
        </ToolbarButton>
        
        <ToolbarButton
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleHeading({ level: 3 }).run();
          }}
          active={editor.isActive('heading', { level: 3 })}
          title="Título 3"
          theme={theme}
          neon={neon}
          type="button"
        >
          H3
        </ToolbarButton>
        
        <ToolbarButton
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().setParagraph().run();
          }}
          active={editor.isActive('paragraph')}
          title="Parágrafo"
          theme={theme}
          neon={neon}
          type="button"
        >
          P
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarDivider theme={theme} />

      {/* Alinhamento */}
      <ToolbarGroup>
        <ToolbarButton
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().setTextAlign('left').run();
          }}
          active={editor.isActive({ textAlign: 'left' })}
          title="Alinhar à esquerda"
          theme={theme}
          neon={neon}
          type="button"
        >
          ←
        </ToolbarButton>
        
        <ToolbarButton
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().setTextAlign('center').run();
          }}
          active={editor.isActive({ textAlign: 'center' })}
          title="Centralizar"
          theme={theme}
          neon={neon}
          type="button"
        >
          ↔
        </ToolbarButton>
        
        <ToolbarButton
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().setTextAlign('right').run();
          }}
          active={editor.isActive({ textAlign: 'right' })}
          title="Alinhar à direita"
          theme={theme}
          neon={neon}
          type="button"
        >
          →
        </ToolbarButton>
        
        <ToolbarButton
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().setTextAlign('justify').run();
          }}
          active={editor.isActive({ textAlign: 'justify' })}
          title="Justificar"
          theme={theme}
          neon={neon}
          type="button"
        >
          ⇔
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarDivider theme={theme} />

      {/* Listas */}
      <ToolbarGroup>
        <ToolbarButton
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleBulletList().run();
          }}
          active={editor.isActive('bulletList')}
          title="Lista com marcadores"
          theme={theme}
          neon={neon}
          type="button"
        >
          • ≡
        </ToolbarButton>
        
        <ToolbarButton
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleOrderedList().run();
          }}
          active={editor.isActive('orderedList')}
          title="Lista numerada"
          theme={theme}
          neon={neon}
          type="button"
        >
          1. ≡
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarDivider theme={theme} />

      {/* Ações */}
      <ToolbarGroup>
        <ToolbarButton
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().undo().run();
          }}
          disabled={!editor.can().undo()}
          title="Desfazer (Ctrl+Z)"
          theme={theme}
          neon={neon}
          type="button"
        >
          ↶
        </ToolbarButton>
        
        <ToolbarButton
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().redo().run();
          }}
          disabled={!editor.can().redo()}
          title="Refazer (Ctrl+Y)"
          theme={theme}
          neon={neon}
          type="button"
        >
          ↷
        </ToolbarButton>
      </ToolbarGroup>
    </ToolbarContainer>
  );
};
