# Suporte a Texto Rico Estruturado

## Visão Geral

O frontend foi atualizado para suportar conteúdo rico formatado (Rich Text) usando o formato JSON estruturado compatível com editores modernos como TipTap e ProseMirror. Esta mudança afeta os seguintes campos:

- **Personagem**: `Historia`
- **PersonagemJogador**: `historia`
- **Cidade**: `Descricao`
- **Item**: `descricao`

## Mudanças nos Modelos TypeScript

### Tipo JSONContent

Foi criado um novo tipo `JSONContent` que representa a estrutura do documento de texto rico:

```typescript
export type JSONContent = {
  type?: string;
  attrs?: Record<string, any>;
  content?: JSONContent[];
  marks?: Array<{
    type: string;
    attrs?: Record<string, any>;
    [key: string]: any;
  }>;
  text?: string;
  [key: string]: any;
};
```

### Modelos Atualizados

Os seguintes modelos foram atualizados:

```typescript
// Characters.ts
export interface Personagem {
  Historia?: JSONContent;
  // ... outros campos
}

// PersonagemJogador.ts
export interface PersonagemJogador {
  historia?: JSONContent | string; // string para compatibilidade temporária
  // ... outros campos
}

// Cities.ts
export interface Cidade {
  Descricao?: JSONContent;
  // ... outros campos
}

// Itens.ts
export interface Item {
  descricao?: JSONContent | string; // string para compatibilidade temporária
  // ... outros campos
}
```

## Helpers Utilitários

Foi criado o arquivo `utils/richTextHelpers.ts` com funções auxiliares:

### Funções Principais

#### `stringToJSONContent(text: string): JSONContent`
Converte uma string simples em formato JSONContent.

```typescript
const jsonContent = stringToJSONContent("Texto simples");
```

#### `jsonContentToString(content: JSONContent | string): string`
Converte JSONContent de volta para string simples (para exibição ou fallback).

```typescript
const text = jsonContentToString(jsonContent);
```

#### `normalizeToJSONContent(value: any): JSONContent`
Normaliza qualquer valor para JSONContent. Se for string, converte. Se já for JSONContent, retorna.

```typescript
const normalized = normalizeToJSONContent(historia);
```

#### `prepareForAPI(value: any): JSONContent | undefined`
Prepara o conteúdo para envio à API. Garante que o valor está no formato correto.

```typescript
const payload = {
  historia: prepareForAPI(history),
  // ... outros campos
};
```

## Como Usar

### Nos Hooks (useForm)

Os hooks já foram atualizados para usar os helpers:

```typescript
// Estado agora aceita JSONContent ou string
const [history, setHistory] = useState<JSONContent | string>('');

// Ao carregar dados existentes
setHistory(normalizeToJSONContent(personagem.historia));

// Ao enviar para API
const payload = {
  historia: prepareForAPI(history),
  // ...
};
```

### Nos Formulários

Atualmente, os campos de texto rico ainda usam `TextArea` comum. Para adicionar suporte completo a formatação, você pode:

1. **Opção Temporária (Atual)**: Continuar usando TextArea com string
   - O backend aceita strings e as converte automaticamente
   - Funciona, mas sem formatação rica

2. **Opção Recomendada (Futura)**: Integrar editor TipTap
   ```typescript
   import { useEditor, EditorContent } from '@tiptap/react';
   import StarterKit from '@tiptap/starter-kit';

   const editor = useEditor({
     extensions: [StarterKit],
     content: normalizeToJSONContent(history),
     onUpdate: ({ editor }) => {
       setHistory(editor.getJSON());
     },
   });

   return <EditorContent editor={editor} />;
   ```

### Componente de Exibição

Para exibir conteúdo rico em modo leitura:

```typescript
import { RichTextDisplay } from '../components/Generic/RichTextDisplay/RichTextDisplay';

<RichTextDisplay 
  content={personagem.Historia} 
  className="historia-display"
/>
```

## Fluxo de Dados

### Criação/Edição
1. Usuário digita no formulário (TextArea ou Editor TipTap)
2. Estado local armazena como `JSONContent | string`
3. Ao submeter: `prepareForAPI()` converte para JSONContent
4. Backend recebe JSONContent e armazena como JSON no banco

### Leitura/Exibição
1. Backend retorna campo como objeto JSON deserializado
2. Frontend recebe como `JSONContent`
3. Pode usar diretamente no editor ou converter para string
4. Para exibição: usar `RichTextDisplay` ou TipTap readonly

## Compatibilidade

### Dados Antigos
- Strings simples no banco são automaticamente convertidas para JSONContent pelo backend
- O frontend normaliza automaticamente com `normalizeToJSONContent()`

### Migração Gradual
- Campos aceitam `JSONContent | string` temporariamente
- Permite migração gradual sem quebrar funcionalidade existente
- Após implementar editores TipTap, remover suporte a string

## Próximos Passos

1. **Instalar TipTap** (se ainda não estiver instalado):
   ```bash
   npm install @tiptap/react @tiptap/starter-kit
   ```

2. **Criar componente de Editor Reutilizável**:
   - `components/Generic/RichTextEditor/RichTextEditor.tsx`
   - Configurar extensões (heading, bold, italic, link, etc.)
   - Aplicar tema dark/light e neon

3. **Substituir TextArea nos formulários**:
   - FormUserCharacter (história)
   - FormCity (descrição)
   - FormItem (descrição)

4. **Criar visualizadores customizados** se necessário:
   - Renderizar JSONContent com estilos específicos do projeto
   - Suportar temas e modo neon

## Exemplo Completo

```typescript
// Hook
import { prepareForAPI, normalizeToJSONContent } from '../utils/richTextHelpers';

const [history, setHistory] = useState<JSONContent | string>('');

// Carregar
useEffect(() => {
  if (personagem) {
    setHistory(normalizeToJSONContent(personagem.historia));
  }
}, [personagem]);

// Salvar
const handleSubmit = async () => {
  const payload = {
    nome: userName,
    historia: prepareForAPI(history),
    // ...
  };
  
  await createPersonagem(payload);
};

// Render (temporário)
<TextArea
  value={jsonContentToString(history)}
  onChange={(e) => setHistory(e.target.value)}
/>

// Render (ideal)
<RichTextEditor
  content={history}
  onChange={setHistory}
  theme={theme}
  neon={neon}
/>
```

## Notas Importantes

- ⚠️ Sempre use `prepareForAPI()` antes de enviar para o backend
- ✅ Use `normalizeToJSONContent()` ao carregar dados da API
- 📝 TextArea atual é temporário - migrar para TipTap quando possível
- 🔄 Backend aceita strings e JSONContent (compatibilidade garantida)
- 🎨 JSONContent preserva estrutura semântica para estilização consistente
