/**
 * EXEMPLO PRÁTICO: Como usar ImageGalleryWithCrop em FormCity
 * 
 * Este arquivo mostra exatamente como substituir ImageGallery por ImageGalleryWithCrop
 * em um formulário existente (neste caso, FormCity).
 */

// ============================================================================
// PASSO 1: IMPORTS
// ============================================================================

// Remova esta linha:
// import { ImageGallery } from '../../../../../../components/Generic/ImageGallery/ImageGallery';

// Adicione estas duas linhas:
import { ImageGalleryWithCrop } from '../../../../../../components/Generic/ImageGallery/ImageGalleryWithCrop';
import type { CropPreset } from '../../../../../../components/Generic/ImageUploader/types';


// ============================================================================
// PASSO 2: DEFINIR O CROP PRESET (dentro do componente)
// ============================================================================

export const FormCity = ({ theme, neon, initialCity, onSaveSuccess, contentType }: FormCityProps) => {
  // ... resto do código ...

  // Adicione este preset logo após definir cityImageCropPreset para imagem principal:
  const galleryImageCropPreset: CropPreset = {
    mode: 'single',
    aspectRatio: 1,        // Quadrado 1:1
    shape: 'square',       // Forma quadrada
    displayShape: 'square',
    label: 'Imagem Galeria',
  };

  // ... resto do código ...


// ============================================================================
// PASSO 3: SUBSTITUIR O COMPONENTE NO RETURN
// ============================================================================

  return (
    <FormController onSubmit={onSubmit}>
      {/* ... resto do formulário ... */}

      {/* ANTES (ImageGallery simples): */}
      {/*
      <ImageGallery
        theme={theme}
        neon={neon}
        label="Galeria de Imagens (Opcional)"
        imageUrls={galeriaUrls}
        onAdd={handleGaleriaUpload}
        onRemove={handleRemoveGaleriaImage}
      />
      */}

      {/* DEPOIS (ImageGalleryWithCrop com crop): */}
      <ImageGalleryWithCrop
        theme={theme}
        neon={neon}
        label="Galeria de Imagens (Opcional)"
        imageUrls={galeriaUrls}
        onAdd={handleGaleriaUpload}
        onRemove={handleRemoveGaleriaImage}
        cropPreset={galleryImageCropPreset}
      />

      {/* ... resto do formulário ... */}
    </FormController>
  );
};


// ============================================================================
// RESUMO DAS MUDANÇAS
// ============================================================================

/*
ANTES:
------
1. Import: ImageGallery
2. Sem CropPreset para galeria
3. <ImageGallery {...props} />
4. Resultado: Upload de arquivo bruto, Sem crop, "Esticamento" de imagens

DEPOIS:
-------
1. Import: ImageGalleryWithCrop, CropPreset type
2. Defina: galleryImageCropPreset com shape/aspectRatio
3. <ImageGalleryWithCrop {...props} cropPreset={galleryImageCropPreset} />
4. Resultado: Upload com crop integrado, Sem distorção, Proporção respeitada

BENEFÍCIOS:
-----------
✅ Usuário pode recortar/ajustar imagens antes de enviar
✅ Galeria exibe com proporção correta (sem stretching)
✅ Interface consistente com outros uploaders
✅ Suporte para múltiplas formas (square, circle, rectangle)
*/


// ============================================================================
// VARIAÇÕES PARA OUTROS FORMULÁRIOS
// ============================================================================

/*
FORMRACE (Galeria com quadrados 1:1):
------
const galleryImageCropPreset: CropPreset = {
  mode: 'single',
  aspectRatio: 1,
  shape: 'square',
  displayShape: 'square',
  label: 'Imagem Raça',
};

<ImageGalleryWithCrop
  theme={theme}
  neon={neon}
  label="Galeria de Imagens (Opcional)"
  imageUrls={galeriaUrls}
  onAdd={handleGaleriaUpload}
  onRemove={handleRemoveGaleriaImage}
  cropPreset={galleryImageCropPreset}
/>


GALERIA COM AVATARES CIRCULARES:
--------
const avatarGalleryCrop: CropPreset = {
  mode: 'single',
  aspectRatio: 1,
  shape: 'circle',
  displayShape: 'circle',
  label: 'Avatar',
};

<ImageGalleryWithCrop
  theme={theme}
  neon={neon}
  label="Avatares"
  imageUrls={avatarUrls}
  onAdd={handleAvatarUpload}
  onRemove={handleRemoveAvatar}
  cropPreset={avatarGalleryCrop}
  maxImages={5}
/>


GALERIA COM PROPORÇÕES MISTAS:
-------
const mixedAspectRatios = [
  1,      // Imagem 1: quadrado
  16/9,   // Imagem 2: paisagem
  1,      // Imagem 3: quadrado
  4/3,    // Imagem 4: custom
];

<ImageGalleryWithCrop
  theme={theme}
  neon={neon}
  label="Galeria Mista"
  imageUrls={galeriaUrls}
  onAdd={handleGaleriaUpload}
  onRemove={handleRemoveGaleriaImage}
  cropPreset={{
    mode: 'single',
    aspectRatio: 1,
    shape: 'square',
    displayShape: 'square',
  }}
  aspectRatios={mixedAspectRatios}
/>
*/
