# ImageGalleryWithCrop - Guia Completo

## O que é?

**ImageGalleryWithCrop** é um componente React que oferece uma **galeria completa com crop integrado**, exatamente como os formulários de criação de cidades/raças/itens.

- ✅ Seleciona imagem
- ✅ Abre modal de crop
- ✅ Permite escolher forma (circle, square, rectangle)
- ✅ Usa html2canvas (zero distorção)
- ✅ Exibe respeitando 100% do formato sem background

## Como Funciona

### Fluxo Completo

1. **Usuário clica "Adicionar"** → Abre seletor de arquivo
2. **Usuário escolhe arquivo** → Abre shape selector (panel top-right)
3. **Usuário escolhe forma** → Circle / Square / Rectangle
4. **Modal de crop abre** → Com a forma selecionada
5. **Usuário pode zoom/arrastar** → Enquanto vê preview
6. **Usuário confirma** → html2canvas captura e salva
7. **Galeria exibe** → Com shape correto (0 background desnecessário)

### Componentes Internos

```tsx
// Imagem adicionada com shape armazenado
imageUrls: ['data:image/png;base64,...', 'data:image/png;base64,...']
imageShapes: ['circle', 'square', 'rectangle']

// A galeria exibe cada uma com seu shape respeitivo
```

## Como Usar em Formulários

### Exemplo 1: FormCity (Galeria Simples)

**Antes** (sem crop):
```tsx
<ImageGallery
  theme={theme}
  neon={neon}
  label="Galeria de Imagens"
  imageUrls={galeriaUrls}
  onAdd={handleGaleriaUpload}
  onRemove={handleRemoveGaleriaImage}
/>
```

**Depois** (com crop completo):
```tsx
import { ImageGalleryWithCrop } from '../../../../../../components/Generic/ImageGallery/ImageGalleryWithCrop';

// No componente:
const [imageShapes, setImageShapes] = useState<string[]>([]);

const handleGaleriaUpload = (files: File[], shapes: string[]) => {
  // Processar arquivos normalmente
  handleExistentGaleriaUpload(files);
  
  // Manter track das shapes
  setImageShapes([...imageShapes, ...shapes]);
};

const handleRemoveGaleriaImage = (index: number) => {
  // Remove imagem
  setGaleriaUrls(prev => prev.filter((_, i) => i !== index));
  
  // Remove shape correspondente
  setImageShapes(prev => prev.filter((_, i) => i !== index));
};

// No return:
<ImageGalleryWithCrop
  theme={theme}
  neon={neon}
  label="Galeria de Imagens (Opcional)"
  imageUrls={galeriaUrls}
  onAdd={handleGaleriaUpload}
  onRemove={handleRemoveGaleriaImage}
  imageShapes={imageShapes}
/>
```

### Exemplo 2: FormRace ou FormItem (Igual)

```tsx
import { ImageGalleryWithCrop } from '../../../../../../components/Generic/ImageGallery/ImageGalleryWithCrop';

const MyComponent = ({ theme, neon, ... }) => {
  const [galeriaUrls, setGaleriaUrls] = useState<string[]>([]);
  const [imageShapes, setImageShapes] = useState<string[]>([]);

  const handleGaleriaUpload = (files: File[], shapes: string[]) => {
    // Processar files...
    const fileUrls = files.map(f => URL.createObjectURL(f));
    setGaleriaUrls(prev => [...prev, ...fileUrls]);
    setImageShapes(prev => [...prev, ...shapes]);
  };

  const handleRemoveGaleriaImage = (index: number) => {
    setGaleriaUrls(prev => prev.filter((_, i) => i !== index));
    setImageShapes(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <ImageGalleryWithCrop
      theme={theme}
      neon={neon}
      label="Galeria de Imagens"
      imageUrls={galeriaUrls}
      onAdd={handleGaleriaUpload}
      onRemove={handleRemoveGaleriaImage}
      imageShapes={imageShapes}
      maxImages={10}
    />
  );
};
```

## Props Detalhadas

```typescript
interface ImageGalleryWithCropProps {
  // UI
  theme: 'dark' | 'light';        // Tema visual
  neon: 'on' | 'off';             // Efeito neon

  // Dados
  label?: string;                 // Título da galeria
  imageUrls: string[];            // URLs das imagens exibidas
  imageShapes?: string[];         // Shapes: 'square' | 'circle' | 'rectangle'

  // Callbacks
  onAdd: (files: File[], shapes: string[]) => void;  // Arquivo + shape
  onRemove: (index: number) => void;                  // Índice do item

  // Configurações
  accept?: string;                // Filtro de tipo (default: 'image/*')
  maxImages?: number;             // Limite de imagens
}
```

## Formas Disponíveis

### Square (1:1)
```
┌────────┐
│  IMG   │  Height: 150px
│  1:1   │  Width: ~150px
└────────┘
```
- Perfeito para ícones
- Sem background
- Controle total do círculo

### Circle (1:1)
```
  ⭕
 📷 150px
```
- Avatar perfeito
- Sem espaço branco nas pontas
- Border-radius: 50%

### Rectangle (16:9)
```
┌──────────────────┐
│      IMAGE       │  Height: 150px
│      16:9        │  Width: ~266px
└──────────────────┘
```
- Banners/capas
- Proporção paisagem
- Sem distorção

## Exemplo Completo: FormCity

```tsx
import React, { useState, useRef, useEffect } from 'react';
import { useFormCity } from './useFormCity';
import { ImageUploader } from '../../../../../../components/Generic/ImageUploader/ImageUploader';
import { ImageGalleryWithCrop } from '../../../../../../components/Generic/ImageGallery/ImageGalleryWithCrop';
import type { CropPreset } from '../../../../../../components/Generic/ImageUploader/types';

interface FormCityProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

export const FormCity = ({ theme, neon }: FormCityProps) => {
  const {
    nome,
    setNome,
    descricao,
    setDescricao,
    imagemUrl,
    galeriaUrls,
    handleImagemUpload,
    handleGaleriaUpload: handleExistentGaleriaUpload,
    handleRemoveGaleriaImage: handleExistentRemoveGaleriaImage,
    // ... outros
  } = useFormCity();

  // Track das formas das imagens
  const [galeriaImageShapes, setGaleriaImageShapes] = useState<string[]>([]);

  // Preset para imagem principal (retângulo 16:9)
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

  // Handlers para a galeria com crop
  const handleGaleriaUploadWithCrop = (files: File[], shapes: string[]) => {
    // Chamar o handler existente
    handleExistentGaleriaUpload(files);
    
    // Armazenar as shapes
    setGaleriaImageShapes(prev => [...prev, ...shapes]);
  };

  const handleRemoveGaleriaImageWithShapes = (index: number) => {
    // Remover da galeria
    handleExistentRemoveGaleriaImage(index);
    
    // Remover a shape correspondente
    setGaleriaImageShapes(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div>
      {/* Imagem Principal */}
      <ImageUploader
        theme={theme}
        neon={neon}
        label="Imagem Principal"
        initialImage={imagemUrl}
        onImageCropped={handleCityImageUpload}
        cropPreset={cityImageCropPreset}
      />

      {/* Galeria com Crop Completo */}
      <ImageGalleryWithCrop
        theme={theme}
        neon={neon}
        label="Galeria de Imagens (Opcional)"
        imageUrls={galeriaUrls}
        onAdd={handleGaleriaUploadWithCrop}
        onRemove={handleRemoveGaleriaImageWithShapes}
        imageShapes={galeriaImageShapes}
        maxImages={10}
      />
    </div>
  );
};
```

## Workflow de Dados

### Ao Adicionar Imagem
```
User selects file
     ↓
ShapeSelector appears (fixed top-right)
     ↓
User clicks shape (e.g., "Circle")
     ↓
ImageCropperModal opens with circle preset
     ↓
User confirms crop
     ↓
html2canvas captures at scale: 1
     ↓
onAdd callback with [File, 'circle']
     ↓
State updated: galeriaUrls, imageShapes
```

### Ao Remover Imagem
```
User clicks X button
     ↓
onRemove callback with index
     ↓
Remove from galeriaUrls array
     ↓
Remove from imageShapes array
     ↓
Gallery re-renders
```

## Integração com Formulários Existentes

### No useFormCity/useFormRace
```tsx
// Adicionar state para shapes
const [galeriaImageShapes, setGaleriaImageShapes] = useState<string[]>([]);

// Retornar junto com outros estados
return {
  galeriaUrls,
  galeriaImageShapes,    // ← Novo!
  handleGaleriaUpload,
  handleRemoveGaleriaImage,
  // ...
};
```

### No componente de formulário
```tsx
// Usar ImageGalleryWithCrop ao invés de ImageGallery
<ImageGalleryWithCrop
  theme={theme}
  neon={neon}
  label="Galeria"
  imageUrls={galeriaUrls}
  onAdd={handleGaleriaUpload}
  onRemove={handleRemoveGaleriaImage}
  imageShapes={galeriaImageShapes}    // ← Passar shapes
/>
```

## Diferenças Entre ImageGallery e ImageGalleryWithCrop

| Função | Gallery | GalleryWithCrop |
|--------|---------|-----------------|
| Exibir imagens | ✅ | ✅ |
| Upload | ✅ (arquivo bruto) | ✅ (crop modal) |
| Crop integrado | ❌ | ✅ |
| Shape selection | ❌ | ✅ |
| html2canvas | ❌ | ✅ |
| Zero distorção | ↔️ (contain) | ✅ (crop + contain) |
| Circle sem fundo | ❌ | ✅ |
| Altura fixa | ✅ | ✅ |

## Design Consideration: Uma Galeria, Múltiplas Formas?

**Pergunta**: Deve a galeria ter um crop PADRÃO ou permitir múltiplas formas?

**Resposta**: ImageGalleryWithCrop suporta **múltiplas formas por imagem**:
- Primeira imagem: círculo
- Segunda imagem: quadrado
- Terceira imagem: retângulo

Cada uma é salva com sua shape correspondente no array `imageShapes`.

## Troubleshooting

### "A imagem aparece distorcida"
- ✖️ Erro: Usando ImageGallery antigo
- ✅ Solução: Usar ImageGalleryWithCrop

### "O círculo tem fundo branco"
- ✖️ Erro: ImageGallery.style.ts ainda renderizando aspecto ratio quadrado
- ✅ Solução: Verificar que está usando div com borderRadius correto

### "Shape não persiste após remover/adicionar"
- ✖️ Erro: Não sincronizando imageShapes[] com galeriaUrls[]
- ✅ Solução: Sempre fazer push/remove em pares (file + shape)

## Próximos Passos

**Análise**: Todos as forms que usam ImageGallery devem ser atualizadas:
1. [ ] FormCity.tsx
2. [ ] FormRace.tsx
3. [ ] FormItem.tsx (se existir)
4. [ ] Character Gallery (se houver)

**Implementação**:
1. Importar ImageGalleryWithCrop
2. Adicionar state para imageShapes
3. Substituir componente
4. Testar com cada forma
