import React, { useState } from 'react';
import { PageBlock, ImageBlockContent } from '../../../../../../../models/Pages';
import { InputText } from '../../../../../../../components/Generic/InputText/InputText';
import { Container, PreviewContainer, ImagePreview, PreviewLabel } from './ImageBlockEditor.style';

interface ImageBlockEditorProps {
  block: PageBlock;
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  onUpdate: (content: ImageBlockContent) => void;
}

export const ImageBlockEditor: React.FC<ImageBlockEditorProps> = ({
  block,
  theme,
  neon,
  onUpdate,
}) => {
  const content = (block.conteudo as ImageBlockContent) || { url: '', legenda: '' };
  const [url, setUrl] = useState(content.url || '');
  const [legenda, setLegenda] = useState(content.legenda || '');

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    onUpdate({ ...content, url: newUrl });
  };

  const handleLegendaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLegenda = e.target.value;
    setLegenda(newLegenda);
    onUpdate({ ...content, legenda: newLegenda });
  };

  return (
    <Container>
      <InputText
        theme={theme}
        neon={neon}
        label="URL da Imagem"
        value={url}
        onChange={handleUrlChange}
        width="100%"
      />

      <InputText
        theme={theme}
        neon={neon}
        label="Legenda (opcional)"
        value={legenda}
        onChange={handleLegendaChange}
        width="100%"
      />

      {url && (
        <PreviewContainer $isDark={theme === 'dark'}>
          <PreviewLabel>Preview:</PreviewLabel>
          <ImagePreview src={url} alt={legenda || 'Imagem do bloco'} />
        </PreviewContainer>
      )}
    </Container>
  );
};
