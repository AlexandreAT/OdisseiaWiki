import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { PageBlock, ImageBlockContent } from '../../../../../../../models/Pages';
import { JSONContent } from '../../../../../../../models/Characters';
import { ImageUploader } from '../../../../../../../components/Generic/ImageUploader/ImageUploader';
import { InputText } from '../../../../../../../components/Generic/InputText/InputText';
import { RichTextEditor } from '../../../../../../../components/Generic/RichTextEditor/RichTextEditor';
import { saveAsset } from '../../../../../../../services/assetsService';
import type { CropPreset, CropResult } from '../../../../../../../components/Generic/ImageUploader/types';
import { normalizeImagePath } from '../../../../../../Wiki/utils/imagePathHelper';
import { detectImageShapeFromUrl } from '../../../../../../../utils/imageDisplayShape';
import {
  Container,
  AspectRatioSelector,
  AspectButton,
  PositionSelector,
  PositionButton,
  SectionLabel,
  RichTextSection,
} from './ImageBlockEditor.style';

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
  const [imagemUrl, setImagemUrl] = useState(content.url || '');
  const [legenda, setLegenda] = useState(content.legenda || '');
  const [texto, setTexto] = useState<JSONContent | undefined>(content.texto);
  const [posicaoTexto, setPosicaoTexto] = useState<'left' | 'right'>(content.posicaoTexto || 'right');
  const [aspectRatio, setAspectRatio] = useState<'square' | 'rectangle'>(content.proporcao || 'rectangle');

  React.useEffect(() => {
    if (content.proporcao || !content.url) return;

    let active = true;
    detectImageShapeFromUrl(normalizeImagePath(content.url)).then((shape) => {
      if (active) setAspectRatio(shape === 'rectangle' ? 'rectangle' : 'square');
    });

    return () => { active = false; };
  }, [content.proporcao, content.url]);

  const getCropPreset = (): CropPreset => {
    if (aspectRatio === 'square') {
      return {
        mode: 'single',
        aspectRatio: 1,
        shape: 'rectangle',
        displayShape: 'rectangle',
        label: 'Quadrado (1:1)',
      };
    }
    return {
      mode: 'single',
      aspectRatio: 16 / 9,
      shape: 'rectangle',
      displayShape: 'rectangle',
      label: 'Retângulo (16:9)',
    };
  };

  const handleImageUpload = async (result: CropResult) => {
    try {
      const assetResult = await saveAsset({
        imageFile: result.file,
        type: "pages/images",
        entityName: `image_${Date.now()}`,
      });
      
      setImagemUrl(assetResult.path);
      onUpdate({ url: assetResult.path, legenda, texto, posicaoTexto, proporcao: aspectRatio });
      toast.success('Imagem salva com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar imagem');
      console.error(error);
    }
  };

  const handleLegendaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLegenda = e.target.value;
    setLegenda(newLegenda);
    onUpdate({ url: imagemUrl, legenda: newLegenda, texto, posicaoTexto, proporcao: aspectRatio });
  };

  const handleTextoChange = useCallback((newTexto: JSONContent | string) => {
    const textoContent = newTexto as JSONContent;
    setTexto(textoContent);
    onUpdate({ url: imagemUrl, legenda, texto: textoContent, posicaoTexto, proporcao: aspectRatio });
  }, [imagemUrl, legenda, posicaoTexto, aspectRatio, onUpdate]);

  const handlePosicaoChange = (novaPosicao: 'left' | 'right') => {
    setPosicaoTexto(novaPosicao);
    onUpdate({ url: imagemUrl, legenda, texto, posicaoTexto: novaPosicao, proporcao: aspectRatio });
  };

  return (
    <Container>
      <AspectRatioSelector>
        <SectionLabel>Proporção:</SectionLabel>
        <div style={{ display: 'flex', gap: '8px' }}>
          <AspectButton
            $isActive={aspectRatio === 'square'}
            onClick={() => setAspectRatio('square')}
            type="button"
          >
            Quadrado (1:1)
          </AspectButton>
          <AspectButton
            $isActive={aspectRatio === 'rectangle'}
            onClick={() => setAspectRatio('rectangle')}
            type="button"
          >
            Retângulo (16:9)
          </AspectButton>
        </div>
      </AspectRatioSelector>

      <ImageUploader
        theme={theme}
        neon={neon}
        label="Imagem"
        initialImage={imagemUrl}
        onImageCropped={handleImageUpload}
        cropPreset={getCropPreset()}
        mobileSize="main"
      />

      <InputText
        theme={theme}
        neon={neon}
        label="Legenda (opcional)"
        value={legenda}
        onChange={handleLegendaChange}
        width="100%"
      />

      <RichTextSection>
        <SectionLabel>Texto lateral (opcional):</SectionLabel>
        <RichTextEditor
          theme={theme}
          neon={neon}
          label=""
          value={texto}
          onChange={handleTextoChange}
          minHeight="150px"
          placeholder="Escreva o texto que aparecerá ao lado da imagem..."
          expandable
        />
      </RichTextSection>

      <PositionSelector>
        <SectionLabel>Posição do texto:</SectionLabel>
        <div style={{ display: 'flex', gap: '8px' }}>
          <PositionButton
            $isActive={posicaoTexto === 'left'}
            onClick={() => handlePosicaoChange('left')}
            type="button"
          >
            Esquerda
          </PositionButton>
          <PositionButton
            $isActive={posicaoTexto === 'right'}
            onClick={() => handlePosicaoChange('right')}
            type="button"
          >
            Direita
          </PositionButton>
        </div>
      </PositionSelector>
    </Container>
  );
};
