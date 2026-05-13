import React, { useState } from 'react';
import { PageBlock, GalleryBlockContent, ImageBlockContent } from '../../../../../../../models/Pages';
import { InputText } from '../../../../../../../components/Generic/InputText/InputText';
import {
  Container,
  GalleryContainer,
  GalleryGrid,
  ImageItem,
  ImageThumb,
  DeleteButton,
  ActionButton,
  GalleryLabel,
} from './GalleryBlockEditor.style';

interface GalleryBlockEditorProps {
  block: PageBlock;
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  onUpdate: (content: GalleryBlockContent) => void;
}

export const GalleryBlockEditor: React.FC<GalleryBlockEditorProps> = ({
  block,
  theme,
  neon,
  onUpdate,
}) => {
  const content = (block.conteudo as GalleryBlockContent) || { imagens: [] };
  const [imagens, setImagens] = useState<ImageBlockContent[]>(content.imagens || []);
  const [newUrl, setNewUrl] = useState('');
  const [newLegenda, setNewLegenda] = useState('');

  const handleAddImage = () => {
    if (!newUrl.trim()) return;

    const novaImagem: ImageBlockContent = {
      url: newUrl,
      legenda: newLegenda,
    };

    const novasImagens = [...imagens, novaImagem];
    setImagens(novasImagens);
    onUpdate({ imagens: novasImagens });

    setNewUrl('');
    setNewLegenda('');
  };

  const handleRemoveImage = (index: number) => {
    const novasImagens = imagens.filter((_, i) => i !== index);
    setImagens(novasImagens);
    onUpdate({ imagens: novasImagens });
  };

  return (
    <GalleryContainer $isDark={theme === 'dark'}>
      <Container>
        <InputText
          theme={theme}
          neon={neon}
          label="URL da Imagem"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          width="100%"
        />

        <InputText
          theme={theme}
          neon={neon}
          label="Legenda (opcional)"
          value={newLegenda}
          onChange={(e) => setNewLegenda(e.target.value)}
          width="100%"
        />

        <ActionButton onClick={handleAddImage}>
          Adicionar Imagem
        </ActionButton>
      </Container>

      {imagens.length > 0 && (
        <>
          <GalleryLabel>
            Imagens adicionadas ({imagens.length}):
          </GalleryLabel>
          <GalleryGrid>
            {imagens.map((img, idx) => (
              <ImageItem key={idx} $isDark={theme === 'dark'}>
                <ImageThumb src={img.url} alt={img.legenda || `Imagem ${idx + 1}`} />
                <DeleteButton onClick={() => handleRemoveImage(idx)}>
                  ✕
                </DeleteButton>
              </ImageItem>
            ))}
          </GalleryGrid>
        </>
      )}
    </GalleryContainer>
  );
};
