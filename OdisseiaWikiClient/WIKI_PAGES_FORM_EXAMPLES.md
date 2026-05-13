# Wiki Pages Form - Exemplos de Uso

## 1. Criar Nova Página

Componente para renderização simples (criar página vazia):

```tsx
import { FormPage } from '../routes/Management/ManagementWiki/WikiForms/FormCriarConteúdo/FormPage/FormPage';
import { useSelector } from 'react-redux';

export const CreateWikiPageScreen = () => {
  const { theme } = useSelector((state: any) => state.themes);
  const neon = 'on'; // ou 'off'

  return (
    <div style={{ padding: '24px' }}>
      <h1>Criar Nova Página Wiki</h1>
      <FormPage
        theme={theme}
        neon={neon}
      />
    </div>
  );
};
```

## 2. Editar Página Existente

Com dados iniciais carregados:

```tsx
import { FormPage } from '../routes/Management/ManagementWiki/WikiForms/FormCriarConteúdo/FormPage/FormPage';
import { useEffect, useState } from 'react';
import { getPageById } from '../services/pageService';

export const EditWikiPageScreen = ({ pageId }: { pageId: number }) => {
  const { theme } = useSelector((state: any) => state.themes);
  const [pageData, setPageData] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPage = async () => {
      try {
        const result = await getPageById(pageId);
        if (result.sucesso && result.page) {
          setPageData(result.page);
          setBlocks(result.blocks || []);
        }
      } catch (err) {
        console.error('Erro ao carregar página:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [pageId]);

  if (loading) return <div>Carregando...</div>;

  return (
    <div style={{ padding: '24px' }}>
      <h1>Editar Página Wiki</h1>
      <FormPage
        theme={theme}
        neon="on"
        initialPage={pageData}
        initialBlocks={blocks}
        pageId={pageId}
      />
    </div>
  );
};
```

## 3. Integração com Hook

Usar apenas o hook sem o componente completo:

```tsx
import { useFormPage } from './routes/Management/ManagementWiki/WikiForms/FormCriarConteúdo/FormPage/useFormPage';
import { PageBlockType } from './models/Pages';

function CustomPageEditor() {
  const {
    titulo,
    setTitulo,
    slug,
    setSlug,
    blocks,
    addBlock,
    removeBlock,
    handleSubmit,
  } = useFormPage();

  return (
    <div>
      <input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Título..."
      />
      
      <input
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        placeholder="Slug..."
      />

      <button onClick={() => addBlock(PageBlockType.RICH_TEXT)}>
        Adicionar Texto
      </button>

      {blocks.map((block) => (
        <div key={block.tempId}>
          <p>Bloco: {block.tipo}</p>
          <button onClick={() => removeBlock(block.tempId!)}>Remover</button>
        </div>
      ))}

      <button onClick={handleSubmit}>Salvar</button>
    </div>
  );
}
```

## 4. Estruturas de Dados Esperadas

### Resposta da API ao obter página:

```json
{
  "sucesso": true,
  "page": {
    "idPage": 1,
    "titulo": "História do Mundo",
    "slug": "historia-do-mundo",
    "descricao": "Descrição da história...",
    "coverImage": "https://assets.example.com/cover.jpg",
    "visivel": true,
    "dataCriacao": "2024-01-15T10:30:00Z"
  },
  "blocks": [
    {
      "tipo": "rich_text",
      "conteudo": {
        "type": "doc",
        "content": [
          {
            "type": "paragraph",
            "content": [
              { "type": "text", "text": "Era uma vez..." }
            ]
          }
        ]
      },
      "ordem": 0
    },
    {
      "tipo": "image",
      "conteudo": {
        "url": "https://assets.example.com/image1.jpg",
        "legenda": "Uma imagem importante"
      },
      "ordem": 1
    },
    {
      "tipo": "infolore",
      "conteudo": {
        "idInfoLore": 5,
        "titulo": "A Lenda Antiga",
        "imagem": "https://assets.example.com/lore.jpg"
      },
      "ordem": 2
    }
  ]
}
```

### Payload enviado ao criar/atualizar:

```json
{
  "page": {
    "titulo": "História do Mundo",
    "slug": "historia-do-mundo",
    "descricao": "Descrição da história...",
    "coverImage": "https://assets.example.com/cover.jpg",
    "visivel": true
  },
  "blocks": [
    {
      "tipo": "rich_text",
      "conteudo": {
        "type": "doc",
        "content": [
          {
            "type": "paragraph",
            "content": [
              { "type": "text", "text": "Era uma vez..." }
            ]
          }
        ]
      },
      "ordem": 0
    },
    {
      "tipo": "image",
      "conteudo": {
        "url": "https://assets.example.com/image1.jpg",
        "legenda": "Uma imagem importante"
      },
      "ordem": 1
    }
  ]
}
```

## 5. Exemplos de Cada Tipo de Bloco

### Rich Text Block
```tsx
const block = {
  tipo: PageBlockType.RICH_TEXT,
  conteudo: {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Parágrafo Rich Text" }
        ]
      }
    ]
  },
  ordem: 0
};
```

### Image Block
```tsx
const block = {
  tipo: PageBlockType.IMAGE,
  conteudo: {
    url: "https://example.com/image.jpg",
    legenda: "Descrição da imagem"
  },
  ordem: 1
};
```

### Gallery Block
```tsx
const block = {
  tipo: PageBlockType.GALLERY,
  conteudo: {
    imagens: [
      { url: "https://example.com/img1.jpg", legenda: "Primeira" },
      { url: "https://example.com/img2.jpg", legenda: "Segunda" },
      { url: "https://example.com/img3.jpg" }
    ]
  },
  ordem: 2
};
```

### InfoLore Block
```tsx
const block = {
  tipo: PageBlockType.INFOLORE,
  conteudo: {
    idInfoLore: 42,
    titulo: "A Lenda do Herói",
    imagem: "https://example.com/lore.jpg"
  },
  ordem: 3
};
```

### Relation Block
```tsx
const block = {
  tipo: PageBlockType.RELATION,
  conteudo: {
    idEntidade: 15,
    tipoEntidade: "Cidade",
    nome: "Capitale da Mágica",
    imagem: "https://example.com/city.jpg"
  },
  ordem: 4
};
```

## 6. Rotas de Integração Sugeridas

```tsx
// Em seu arquivo de rotas
import { FormPage } from '...';

<Route path="/wiki/create" element={<CreateWikiPageScreen />} />
<Route path="/wiki/:id/edit" element={<EditWikiPageScreen />} />
```

## 7. Tratamento de Erros

O componente usa `react-hot-toast` para notificações:

```tsx
// Automático no handleSubmit
toast.success("Página salva com sucesso!");
toast.error("Título é obrigatório");
```

Se precisa capturar o resultado:

```tsx
const { handleSubmit } = useFormPage();

const handleSave = async () => {
  try {
    await handleSubmit();
    // Sucesso será tratado com toast
  } catch (err) {
    // Erro será capturado e exibido
  }
};
```

## 8. Customização de Temas

O componente respeita os temas existentes:

```tsx
<FormPage
  theme="dark"  // ou 'light'
  neon="on"     // ou 'off'
/>
```

Os temas aplicam cores e estilos automaticamente aos componentes internos.

## 9. Extendendo com Novos Blocos

Para adicionar um novo tipo de bloco (ex: Video):

1. Adicionar ao enum:
```typescript
export enum PageBlockType {
  VIDEO = 'video',
  // ...
}
```

2. Criar componente:
```tsx
// VideoBlockEditor.tsx
export const VideoBlockEditor = ({ block, onUpdate }) => {
  return (
    // Seu componente aqui
  );
};
```

3. Atualizar FormPage:
```tsx
case PageBlockType.VIDEO:
  return <VideoBlockEditor {...editorProps} />;
```

4. Adicionar label:
```typescript
const blockTypeLabels = {
  [PageBlockType.VIDEO]: 'Vídeo',
};
```
