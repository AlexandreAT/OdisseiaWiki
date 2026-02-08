# RichTextEditor - Editor de Texto Rico com TipTap

Componente de editor de texto rico (WYSIWYG) para React, usando TipTap/ProseMirror. Permite formatação de texto estilo wiki com negrito, itálico, sublinhado, alinhamento, listas, títulos e muito mais.

## Características

- ✨ Editor WYSIWYG com formatação rica
- 📝 Toolbar responsiva com ícones intuitivos
- 🎨 Suporte a temas (dark/light) e modo neon
- 🔄 Compatibilidade com dados antigos (string → JSONContent)
- 💾 Salva como JSONContent (formato TipTap/ProseMirror)
- ⚡ Funciona como campo controlado do React
- 🎯 Visual consistente com outros componentes do sistema

## Extensões TipTap Disponíveis

- **StarterKit**: Funcionalidades básicas (parágrafos, quebras de linha, histórico)
- **Heading**: Títulos H1, H2, H3, H4
- **Bold, Italic, Strike**: Formatação de texto
- **Underline**: Sublinhado
- **TextAlign**: Alinhamento (esquerda, centro, direita, justificado)
- **BulletList, OrderedList**: Listas com marcadores e numeradas
- **TextStyle, Color, FontFamily**: Estilos avançados de texto

## Uso Básico

```tsx
import { RichTextEditor } from '../../components/Generic/RichTextEditor/RichTextEditor';
import { JSONContent } from '../../models/Characters';

function MyForm() {
  const [descricao, setDescricao] = useState<JSONContent | string>('');

  return (
    <RichTextEditor
      theme="dark"
      neon="on"
      label="Descrição"
      value={descricao}
      onChange={setDescricao}
      minHeight="150px"
      placeholder="Digite aqui..."
    />
  );
}
```

## Props

| Prop | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|--------|-----------|
| `theme` | `'dark' \| 'light'` | ✅ | - | Tema do componente |
| `neon` | `'on' \| 'off'` | ✅ | - | Ativa/desativa efeito neon |
| `label` | `string` | ✅ | - | Label do campo |
| `value` | `JSONContent \| string` | ❌ | - | Conteúdo atual (JSONContent ou string) |
| `onChange` | `(content: JSONContent) => void` | ❌ | - | Callback ao alterar conteúdo |
| `onFocus` | `() => void` | ❌ | - | Callback ao focar |
| `onBlur` | `() => void` | ❌ | - | Callback ao desfocar |
| `error` | `boolean` | ❌ | `false` | Indica se há erro |
| `errorMessage` | `string` | ❌ | - | Mensagem de erro |
| `required` | `boolean` | ❌ | `false` | Campo obrigatório |
| `typeStyle` | `'primary' \| 'secondary'` | ❌ | `'primary'` | Estilo do campo |
| `width` | `string` | ❌ | `'100%'` | Largura do campo |
| `height` | `string` | ❌ | - | Altura fixa do campo |
| `minHeight` | `string` | ❌ | `'150px'` | Altura mínima do campo |
| `fullWidth` | `boolean` | ❌ | `false` | Ocupa toda largura do grid |
| `placeholder` | `string` | ❌ | - | Texto placeholder |

## Utilizando com Formulários

### FormCity (Criar Cidade)
```tsx
<RichTextEditor
  theme={theme}
  neon={neon}
  label="Descrição"
  value={descricao}
  onChange={setDescricao}
  width="100%"
  minHeight="150px"
  placeholder="Descreva a cidade..."
/>
```

### FormCharacter (Criar Personagem)
```tsx
<RichTextEditor
  theme={theme}
  neon={neon}
  label="História"
  value={history}
  onChange={setHistory}
  minHeight="150px"
  placeholder="Escreva a história do personagem..."
/>
```

## Funções Auxiliares

O componente usa funções auxiliares para normalização de dados:

```tsx
import {
  normalizeToJSONContent,
  jsonContentToString,
  prepareForAPI
} from '../../../utils/richTextHelpers';

// Converte string → JSONContent
const jsonContent = normalizeToJSONContent('Texto simples');

// Converte JSONContent → string (para exibição)
const texto = jsonContentToString(jsonContent);

// Prepara para enviar à API
const dto = {
  Descricao: prepareForAPI(descricao)
};
```

## Toolbar

A toolbar aparece automaticamente ao focar o editor e oferece:

### Formatação de Texto
- **B** - Negrito (Ctrl+B)
- **I** - Itálico (Ctrl+I)
- **U** - Sublinhado (Ctrl+U)
- **S** - Tachado

### Títulos
- **H1, H2, H3, H4** - Títulos
- **P** - Parágrafo normal

### Alinhamento
- **←** - Esquerda
- **↔** - Centro
- **→** - Direita
- **⇔** - Justificado

### Listas
- **• ≡** - Lista com marcadores
- **1. ≡** - Lista numerada

### Ações
- **↶** - Desfazer (Ctrl+Z)
- **↷** - Refazer (Ctrl+Y)

## Compatibilidade de Dados

O editor é **totalmente compatível** com dados antigos:

- ✅ Dados antigos em **string** → Converte automaticamente para JSONContent
- ✅ Dados novos em **JSONContent** → Usa diretamente
- ✅ Backend recebe **JSONContent** serializado como string
- ✅ Frontend normaliza **qualquer formato** para o editor

```tsx
// Dados antigos (string)
const descricaoAntiga = "Texto simples sem formatação";

// Dados novos (JSONContent)
const descricaoNova = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Texto formatado' }]
    }
  ]
};

// Ambos funcionam!
<RichTextEditor value={descricaoAntiga} onChange={...} />
<RichTextEditor value={descricaoNova} onChange={...} />
```

## Estilos Customizados

O editor usa styled-components e segue o padrão visual do sistema:

- Bordas e sombras reativas ao tema
- Efeito neon quando ativado
- Label flutuante animada
- Transições suaves
- Scrollbar customizada
- Highlight de elementos (títulos, links, listas)

## Exemplo Completo

```tsx
import React, { useState } from 'react';
import { RichTextEditor } from './components/Generic/RichTextEditor/RichTextEditor';
import { JSONContent } from './models/Characters';
import { prepareForAPI } from './utils/richTextHelpers';

function CityForm({ theme, neon }) {
  const [descricao, setDescricao] = useState<JSONContent | string>('');
  const [error, setError] = useState(false);

  const handleSubmit = async () => {
    const dto = {
      Nome: 'Cidade Exemplo',
      Descricao: prepareForAPI(descricao),
      // ... outros campos
    };
    
    await api.post('/cidades', dto);
  };

  return (
    <form onSubmit={handleSubmit}>
      <RichTextEditor
        theme={theme}
        neon={neon}
        label="Descrição da Cidade *"
        value={descricao}
        onChange={setDescricao}
        error={error}
        errorMessage="Campo obrigatório"
        required
        minHeight="200px"
        placeholder="Descreva a cidade, sua história, cultura..."
      />
      
      <button type="submit">Salvar</button>
    </form>
  );
}
```

## Modelo JSONContent

O formato `JSONContent` segue o padrão TipTap/ProseMirror:

```typescript
interface JSONContent {
  type?: string;
  attrs?: Record<string, any>;
  content?: JSONContent[];
  marks?: {
    type: string;
    attrs?: Record<string, any>;
    [key: string]: any;
  }[];
  text?: string;
  [key: string]: any;
}
```

Exemplo de JSONContent com formatação:
```json
{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 1 },
      "content": [{ "type": "text", "text": "Título Principal" }]
    },
    {
      "type": "paragraph",
      "content": [
        { "type": "text", "text": "Texto " },
        { 
          "type": "text", 
          "text": "negrito",
          "marks": [{ "type": "bold" }]
        }
      ]
    }
  ]
}
```

## Notas Importantes

1. **Performance**: O editor evita re-renderizações desnecessárias comparando o JSON do conteúdo
2. **Cleanup**: Destrói a instância do editor ao desmontar o componente
3. **Inicialização**: Aguarda a primeira inicialização antes de emitir eventos onChange
4. **Validação**: Use as funções auxiliares para garantir compatibilidade de tipos
5. **API**: O backend deve aceitar JSONContent serializado como string

## Extensões Futuras

Possíveis melhorias:
- [ ] Seletor de cores para texto
- [ ] Inserção de imagens
- [ ] Inserção de links
- [ ] Tabelas
- [ ] Blocos de código com highlighting
- [ ] Mentions (@usuário)
- [ ] Emojis picker
- [ ] Export para Markdown/HTML
