import React from 'react';
import { PageBlock } from '../../../../../../../models/Pages';
import { RichTextEditor } from '../../../../../../../components/Generic/RichTextEditor/RichTextEditor';
import { JSONContent } from '../../../../../../../models/Characters';
import { Container } from './RichTextBlockEditor.style';

interface RichTextBlockEditorProps {
  block: PageBlock;
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  onUpdate: (content: any) => void;
}

export const RichTextBlockEditor: React.FC<RichTextBlockEditorProps> = ({
  block,
  theme,
  neon,
  onUpdate,
}) => {
  const content = block.conteudo as JSONContent | string;

  return (
    <Container>
      <RichTextEditor
        theme={theme}
        neon={neon}
        label="Conteúdo do Bloco de Texto"
        value={content}
        onChange={onUpdate}
        minHeight="200px"
        placeholder="Escreva o conteúdo do bloco..."
      />
    </Container>
  );
};
