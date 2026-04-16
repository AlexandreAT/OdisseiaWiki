# Guia de Uso: ImageGalleryWithCrop

## O Problema Resolvido

Anteriormente, havia dois problemas no sistema de imagens:

1. **ImageUploader não respeitava o círculo**: Quando você usava um preset circular, o contenedor não aplicava `border-radius: 50%`, mostrando um quadrado ao invés de um círculo.

2. **ImageGallery sem crop**: A galeria apenas exibia imagens sem permitir recorte com diferentes opções de resolução/tamanho.

## Soluções Implementadas

### 1. ImageUploader Corrigido
O `ImageUploader` agora respeita o `shape` do `CropPreset` e aplica o `border-radius` correto:

```tsx
const characterAvatarCropPreset: CropPreset = {
  mode: 'single',
  aspectRatio: 1,
  shape: 'circle',        // ✅ Agora respeita isso!
  displayShape: 'circle',
  label: 'Avatar Circular',
};
```

### 2. ImageGalleryWithCrop - Novo Componente
Novo componente que combina galeria com upload com crop integrado.

## Como Usar em Formulários

### Exemplo 1: FormCity (Galeria com Quadrados 1:1)

**Antes (ImageGallery simples):**
```tsx
<ImageGallery
  theme={theme}
  neon={neon}
  label="Galeria de Imagens (Opcional)"
  imageUrls={galeriaUrls}
  onAdd={handleGaleriaUpload}
  onRemove={handleRemoveGaleriaImage}
/>
```

**Depois (com crop):**
```tsx
import { ImageGalleryWithCrop } from '../../../../../../components/Generic/ImageGallery/ImageGalleryWithCrop';

const galleryImageCropPreset: CropPreset = {
  mode: 'single',
  aspectRatio: 1,
  shape: 'square',
  displayShape: 'square',
  label: 'Quadrado (1:1)',
};

// No return do componente:
<ImageGalleryWithCrop
  theme={theme}
  neon={neon}
  label="Galeria de Imagens (Opcional)"
  imageUrls={galeriaUrls}
  onAdd={handleGaleriaUpload}
  onRemove={handleRemoveGaleriaImage}
  cropPreset={galleryImageCropPreset}
/>
```

### Exemplo 2: Galeria com Diferentes Proporções (Layout Responsivo)

Se você quer que cada imagem tenha uma proporção diferente:

```tsx
const imageAspectRatios = [1, 16/9, 1, 4/3, 1];  // Proporcionalidades de cada imagem

<ImageGalleryWithCrop
  theme={theme}
  neon={neon}
  label="Galeria"
  imageUrls={galeriaUrls}
  onAdd={handleGaleriaUpload}
  onRemove={handleRemoveGaleriaImage}
  cropPreset={{
    mode: 'single',
    aspectRatio: 1,
    shape: 'square',
    displayShape: 'square',
  }}
  aspectRatios={imageAspectRatios}
/>
```

### Exemplo 3: Galeria com Círculos (Avatar Gallery)

```tsx
const avatarGalleryCrop: CropPreset = {
  mode: 'single',
  aspectRatio: 1,
  shape: 'circle',
  displayShape: 'circle',
  label: 'Avatar Circular',
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
```

## Props do ImageGalleryWithCrop

```typescript
interface ImageGalleryWithCropProps {
  theme: 'dark' | 'light';           // Tema visual
  neon: 'on' | 'off';                // Efeito neon
  label?: string;                    // Título da galeria
  imageUrls: string[];               // Array de URLs das imagens
  onAdd: (files: File[]) => void;    // Callback quando adiciona imagem
  onRemove: (index: number) => void; // Callback quando remove imagem
  cropPreset?: CropPreset;           // Configuração de crop
  accept?: string;                   // Tipos de arquivo aceitos (default: 'image/*')
  maxImages?: number;                // Limite de imagens
  aspectRatios?: number[];           // Array de proporções por imagem (opcional)
}
```

## Diferenças Entre ImageGallery e ImageGalleryWithCrop

| Recurso | ImageGallery | ImageGalleryWithCrop |
|---------|--------------|---------------------|
| Exibição simples de imagens | ✅ | ✅ |
| Upload de imagens | ✅ (arquivo bruto) | ✅ (com crop) |
| Diferentes proporções | ❌ | ✅ |
| Crop integrado | ❌ | ✅ |
| Circle/Square/Rectangle | ❌ | ✅ |
| Tamanho fixo com proporção dinâmica | ✅ | ✅ |

## Workflow de Uso

1. **Usuário clica em "Adicionar"** → ImageUploader aparece
2. **Usuário seleciona arquivo** → Modal de crop abre
3. **Usuário posiciona/faz zoom** → Preview em tempo real
4. **Usuário confirma** → Imagem é capturada e adicionada à galeria
5. **Galeria exibe com proporção correta** → Sem stretching/distorção

## Tipos de Crop Disponíveis

```tsx
// Quadrado (1:1) - Perfeito para ícones, avatares pequenos
const squareCrop: CropPreset = {
  mode: 'single',
  aspectRatio: 1,
  shape: 'square',
  displayShape: 'square',
  label: 'Quadrado (1:1)',
};

// Círculo (1:1) - Perfeito para avatares de personagens
const circleCrop: CropPreset = {
  mode: 'single',
  aspectRatio: 1,
  shape: 'circle',
  displayShape: 'circle',
  label: 'Avatar Circular',
};

// Retângulo (16:9) - Perfeito para banners/capas
const rectangleCrop: CropPreset = {
  mode: 'single',
  aspectRatio: 16 / 9,
  shape: 'rectangle',
  displayShape: 'rectangle',
  label: 'Retângulo (16:9)',
};

// Custom - Qualquer proporção
const customCrop: CropPreset = {
  mode: 'single',
  aspectRatio: 4 / 3,
  shape: 'square',
  displayShape: 'square',
  label: 'Custom (4:3)',
};
```

## Migrando Formulários Existentes

### Passo 1: Import
```tsx
// Remova:
// import { ImageGallery } from '...';

// Adicione:
import { ImageGalleryWithCrop } from '../../../../../../components/Generic/ImageGallery/ImageGalleryWithCrop';
import type { CropPreset } from '../../../../../../components/Generic/ImageUploader/types';
```

### Passo 2: Defina o CropPreset
```tsx
const myCropPreset: CropPreset = {
  mode: 'single',
  aspectRatio: 1,
  shape: 'square',
  displayShape: 'square',
  label: 'Minha Imagem',
};
```

### Passo 3: Substitua o Componente
```tsx
// De:
<ImageGallery {...props} />

// Para:
<ImageGalleryWithCrop {...props} cropPreset={myCropPreset} />
```

## Status Atual

✅ **Implementado:**
- ImageUploader com border-radius circular correto
- ImageGalleryWithCrop com crop integrado
- Suporte para múltiplas proporções
- Todas as variantes (square, circle, rectangle)

✅ **Próximas formas a atualizar:**
- FormCity - gallery com quadrados
- FormRace - gallery com quadrados
- FormItem - gallery com quadrados
- UserCharacters gallery (se aplicável)

## Troubleshooting

### "A imagem está quadrada ao invés de circular"
- Verifique se o `shape` do preset é `'circle'`
- Confirme que está usando `ImageUploader` (não ImageGallery antigo)

### "A imagem é exibida distorcida na galeria"
- Use `ImageGalleryWithCrop` ao invés de `ImageGallery`
- Verifique se o cropPreset tem a proporção correta

### "Upload não está funcionando"
- Confirme que `onAdd` callback está implementado
- Verifique se o arquivo é uma imagem válida
- Valide o tamanho máximo (16 MB)
