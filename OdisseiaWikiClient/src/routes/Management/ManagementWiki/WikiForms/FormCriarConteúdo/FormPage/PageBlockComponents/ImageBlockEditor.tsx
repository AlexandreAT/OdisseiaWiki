import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { PageBlock, ImageBlockContent } from '../../../../../../../models/Pages';
import { ImageUploader } from '../../../../../../../components/Generic/ImageUploader/ImageUploader';
import { InputText } from '../../../../../../../components/Generic/InputText/InputText';
import { saveAsset } from '../../../../../../../services/assetsService';
import type { CropPreset } from '../../../../../../../components/Generic/ImageUploader/types';
import { Container, PreviewContainer, ImagePreview, PreviewLabel, AspectRatioSelector, AspectButton } from './ImageBlockEditor.style';

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
  const [aspectRatio, setAspectRatio] = useState<'square' | 'rectangle'>('rectangle');
  const [uploadingImage, setUploadingImage] = useState(false);

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

  const handleImageUpload = async (result: any) => {
    setUploadingImage(true);
    try {
      const assetResult = await saveAsset({
        imageFile: result.file,
        type: "pages/images",
        entityName: `image_${Date.now()}`,
      });
      
      setImagemUrl(assetResult.path);
      onUpdate({ url: assetResult.path, legenda });
      toast.success('Imagem salva com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar imagem');
      console.error(error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleLegendaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLegenda = e.target.value;
    setLegenda(newLegenda);
    onUpdate({ url: imagemUrl, legenda: newLegenda });
  };

  return (
    <Container>
      <AspectRatioSelector>
        <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
          Proporção:
        </label>
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
      />

      <InputText
        theme={theme}
        neon={neon}
        label="Legenda (opcional)"
        value={legenda}
        onChange={handleLegendaChange}
        width="100%"
      />

      {imagemUrl && (
        <PreviewContainer $isDark={theme === 'dark'}>
          <PreviewLabel>Preview:</PreviewLabel>
          <ImagePreview src={imagemUrl} alt={legenda || 'Imagem do bloco'} />
        </PreviewContainer>
      )}
    </Container>
  );
};
