/**
 * EXEMPLO PRÁTICO: Como integrar ImageGalleryWithCrop em FormCity
 * 
 * Este arquivo mostra exatamente as mudanças necessárias para substituir
 * ImageGallery por ImageGalleryWithCrop em um formulário existente.
 * 
 * ❌ ANTES: ImageGallery simples (sem crop)
 * ✅ DEPOIS: ImageGalleryWithCrop (com crop modal + shape selection)
 */

// ============================================================================
// PASSO 1: IMPORTS
// ============================================================================

// REMOVER:
// import { ImageGallery } from '../../../../../../components/Generic/ImageGallery/ImageGallery';

// ADICIONAR:
import { ImageGalleryWithCrop } from '../../../../../../components/Generic/ImageGallery/ImageGalleryWithCrop';


// ============================================================================
// PASSO 2: STATE PARA SHAPES
// ============================================================================

// No componente FormCity, adicionar novo state após os states existentes:

export const FormCity = ({ theme, neon, initialCity, onSaveSuccess, contentType }: FormCityProps) => {
  const {
    // ... estados existentes da hook useFormCity
    galeriaUrls,
    // ...
  } = useFormCity(initialCity, contentType);

  // 🆕 NOVO: Rastrear as formas de cada imagem
  const [galeriaImageShapes, setGaleriaImageShapes] = React.useState<string[]>([]);

  // ... resto do componente


  // ============================================================================
  // PASSO 3: HANDLERS ATUALIZADOS
  // ============================================================================

  // ANTES (sem rastreamento de shapes):
  // const handleGaleriaUpload = (files: File[]) => {
  //   handleExistentGaleriaUpload(files);
  // };

  // DEPOIS (com rastreamento de shapes):
  const handleGaleriaUpload = (files: File[], shapes: string[]) => {
    // Processar files normalmente
    handleExistentGaleriaUpload(files);
    
    // 🆕 Rastrear as shapes adicionadas
    setGaleriaImageShapes(prev => [...prev, ...shapes]);
  };

  // ANTES (sem rastreamento de shapes):
  // const handleRemoveGaleriaImage = (index: number) => {
  //   handleExistentRemoveGaleriaImage(index);
  // };

  // DEPOIS (com rastreamento de shapes):
  const handleRemoveGaleriaImage = (index: number) => {
    // Remover imagem normalmente
    handleExistentRemoveGaleriaImage(index);
    
    // 🆕 Remover shape correspondente
    setGaleriaImageShapes(prev => prev.filter((_, i) => i !== index));
  };


  // ============================================================================
  // PASSO 4: NO RETURN - SUBSTITUIR COMPONENTE
  // ============================================================================

  return (
    <FormController onSubmit={onSubmit}>
      {/* ... resto do formulário ... */}

      <CheckboxSection>
        <CheckBox
          neon={neon}
          label="Cidade visível"
          checked={visivel}
          onChange={(checked) => setVisivel(checked)}
        />
      </CheckboxSection>

      {/* 
        ❌ REMOVER ISTO:
        
        <ImageGallery
          theme={theme}
          neon={neon}
          label="Galeria de Imagens (Opcional)"
          imageUrls={galeriaUrls}
          onAdd={handleGaleriaUpload}
          onRemove={handleRemoveGaleriaImage}
        />
      */}

      {/* 
        ✅ ADICIONAR ISTO:
      */}
      <ImageGalleryWithCrop
        theme={theme}
        neon={neon}
        label="Galeria de Imagens (Opcional)"
        imageUrls={galeriaUrls}
        onAdd={handleGaleriaUpload}
        onRemove={handleRemoveGaleriaImage}
        imageShapes={galeriaImageShapes}  // 🆕 Rastreamento de shapes
        maxImages={10}
      />

      {/* ... resto do formulário ... */}
    </FormController>
  );
};


// ============================================================================
// RESUMO DAS MUDANÇAS
// ============================================================================

/*
Arquivos a Modificar:
  1. ✅ src/routes/Management/.../FormCity/FormCity.tsx

Mudanças Necessárias:

1. IMPORT
   - Remove: ImageGallery
   + Adds: ImageGalleryWithCrop

2. STATE
   + Adds: const [galeriaImageShapes, setGaleriaImageShapes] = useState<string[]>([]);

3. HANDLER onAdd
   - Antes: handleGaleriaUpload(files: File[])
   + Depois: handleGaleriaUpload(files: File[], shapes: string[])
   + Adiciona: setGaleriaImageShapes(prev => [...prev, ...shapes])

4. HANDLER onRemove
   - Antes: handleRemoveGaleriaImage(index: number)
   + Depois: handleRemoveGaleriaImage(index: number)
   + Adiciona: setGaleriaImageShapes(prev => prev.filter((_, i) => i !== index))

5. COMPONENTE
   - Antes: <ImageGallery ... />
   + Depois: <ImageGalleryWithCrop imageShapes={galeriaImageShapes} />

LINHAS DE CÓDIGO: ~15-20 linhas de mudanças
TEMPO ESTIMADO: 2-3 minutos por formulário
*/


// ============================================================================
// WORKFLOW COMPLETO DO USUÁRIO
// ============================================================================

/*
1. Usuário clica "Adicionar" no botão da galeria
   └─ Abre seletor de arquivo

2. Usuário seleciona imagem
   └─ Arquivo é processado

3. NOVO: Panel aparece no canto superior direito
   └─ Opções: "Quadrado (1:1)", "Círculo (1:1)", "Retângulo (16:9)"

4. Usuário escolhe a forma desejada
   └─ O modal de crop abre com o preset selecionado
   └─ O frame de crop aparece com a forma certa (circle, square, rect)

5. Usuário faz zoom (slider) e arrasta a imagem
   └─ O preview mostra exatamente o que será cortado
   └─ Sem distorção, respeitando a forma

6. Usuário clica "Confirmar"
   └─ html2canvas captura a área visível do crop
   └─ Cria PNG perfeito

7. Imagem aparece na galeria
   └─ Com a forma correta (e.g., círculo sem fundo branco)
   └─ Altura fixa 150px, largura adapta

8. Usuário pode adicionar mais imagens
   └─ Cada uma com sua própria forma
   └─ Todas respeitadas sem distorção

9. Ao salvar formulário
   └─ galeriaUrls: ['data:image/png;...', 'data:image/png;...']
   └─ galeriaImageShapes: ['circle', 'square', 'rectangle']
*/


// ============================================================================
// EXEMPLO: FormCity COMPLETA COM INTEGRAÇÃO
// ============================================================================

/*
import React, { useRef, useEffect, useState } from 'react';
import { useFormCity } from './useFormCity';
import { InputText } from '../../InputText/InputText';
import { RichTextEditor } from '../../RichTextEditor/RichTextEditor';
import { CyberButton } from '../../HighlightButton/HighlightButton';
import { CheckBox } from '../../CheckBox/CheckBox';
import { ImageUploader } from '../../ImageUploader/ImageUploader';
import { ImageGalleryWithCrop } from '../../ImageGallery/ImageGalleryWithCrop';  // ← NOVO
import type { CropPreset } from '../../ImageUploader/types';

interface FormCityProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  initialCity?: any;
  onSaveSuccess?: () => void;
  contentType?: string;
}

export const FormCity = ({ theme, neon, initialCity, onSaveSuccess, contentType }: FormCityProps) => {
  const {
    cidadeId,
    nome,
    descricao,
    imagemUrl,
    galeriaUrls,
    tags,
    tagInput,
    visivel,
    nomeError,
    setNome,
    setDescricao,
    setTagInput,
    setVisivel,
    handleImagemUpload,
    handleGaleriaUpload: handleExistentGaleriaUpload,
    handleRemoveGaleriaImage: handleExistentRemoveGaleriaImage,
    // ... outros
  } = useFormCity(initialCity, contentType);

  // 🆕 NOVO STATE
  const [galeriaImageShapes, setGaleriaImageShapes] = useState<string[]>([]);

  const cityImageCropPreset: CropPreset = {
    mode: 'single',
    aspectRatio: 16 / 9,
    shape: 'rectangle',
    displayShape: 'rectangle',
    label: 'Retângulo (16:9)',
  };

  const handleCityImageUpload = (result: any) => {
    handleImagemUpload(result.file);
  };

  // 🆕 HANDLERS ATUALIZADOS
  const handleGaleriaUpload = (files: File[], shapes: string[]) => {
    handleExistentGaleriaUpload(files);
    setGaleriaImageShapes(prev => [...prev, ...shapes]);
  };

  const handleRemoveGaleriaImage = (index: number) => {
    handleExistentRemoveGaleriaImage(index);
    setGaleriaImageShapes(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <FormController>
      <FormHeader>
        <ImageUploader
          theme={theme}
          neon={neon}
          label="Imagem Principal"
          initialImage={imagemUrl}
          onImageCropped={handleCityImageUpload}
          cropPreset={cityImageCropPreset}
        />
      </FormHeader>

      <RichTextEditor label="Descrição" value={descricao} onChange={setDescricao} />

      <CheckBox label="Visível" checked={visivel} onChange={setVisivel} />

      {/* 🆕 NOVO COMPONENTE COM SHAPES */}
      <ImageGalleryWithCrop
        theme={theme}
        neon={neon}
        label="Galeria de Imagens (Opcional)"
        imageUrls={galeriaUrls}
        onAdd={handleGaleriaUpload}
        onRemove={handleRemoveGaleriaImage}
        imageShapes={galeriaImageShapes}
        maxImages={10}
      />

      <ButtonsContainer>
        <CyberButton type="submit">Salvar</CyberButton>
      </ButtonsContainer>
    </FormController>
  );
};
*/
