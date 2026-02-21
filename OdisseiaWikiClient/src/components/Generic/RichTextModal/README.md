# RichTextModal Component

Modal full-screen reutilizável para edição de conteúdo rico (rich text) usando TipTap/ProseMirror.

## Características

- 🎨 Modal full-screen com overlay
- ✏️ Editor de rich text integrado (TipTap)
- 💾 Botões de ação: Salvar, Limpar, Cancelar
- 🔔 Confirmação ao cancelar com mudanças não salvas
- 🎯 Suporte a JSONContent (formato TipTap)
- 🔄 Compatível com strings e objetos JSONContent

## Uso

```tsx
import RichTextModal from './components/Generic/RichTextModal';
import { JSONContent } from './models/Characters';

const MyComponent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<JSONContent | string>('');

  const handleSave = (newContent: JSONContent | string) => {
    setContent(newContent);
    console.log('Conteúdo salvo:', newContent);
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Editar Texto
      </button>

      <RichTextModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSave={handleSave}
        initialContent={content}
        title="Editar Descrição"
        placeholder="Digite aqui..."
      />
    </>
  );
};
```

## Props

| Prop | Tipo | Obrigatório | Default | Descrição |
|------|------|-------------|---------|-----------|
| `isOpen` | `boolean` | ✅ | - | Controla visibilidade do modal |
| `onClose` | `() => void` | ✅ | - | Callback ao fechar o modal |
| `onSave` | `(content: JSONContent \| string) => void` | ✅ | - | Callback ao salvar conteúdo |
| `initialContent` | `JSONContent \| string` | ❌ | `''` | Conteúdo inicial do editor |
| `title` | `string` | ❌ | `'Editar Texto'` | Título do modal |
| `placeholder` | `string` | ❌ | `'Digite aqui...'` | Placeholder do editor |

## Integração com DataTable

O RichTextModal é perfeito para uso com tabelas que precisam editar campos de rich text:

```tsx
const columns = [
  {
    key: "descricao",
    label: "Descrição",
    width: 300,
    customRender: (value: any, row: Item, onChange: (v: any) => void) => {
      const [modalOpen, setModalOpen] = useState(false);
      const preview = getTextPreview(value, 40);

      return (
        <>
          <div onClick={() => setModalOpen(true)}>
            {preview || 'Clique para adicionar...'}
          </div>
          
          <RichTextModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            onSave={(content) => {
              onChange(content);
              setModalOpen(false);
            }}
            initialContent={value}
            title="Editar Descrição"
          />
        </>
      );
    }
  }
];
```

## Recursos do Editor

O modal inclui um editor TipTap completo com:

- ✍️ Negrito, Itálico, Sublinhado
- 📝 Títulos (H1, H2, H3)
- 📋 Listas ordenadas e não ordenadas
- ↔️ Alinhamento de texto (esquerda, centro, direita)
- 🔗 Links
- 📊 Citações (blockquotes)
- 💻 Blocos de código
- ↩️ Desfazer/Refazer

## Comportamento

### Salvar
- Chama `onSave` com o conteúdo atual
- Fecha o modal automaticamente
- Reseta o estado de "alterações pendentes"

### Limpar
- Remove todo o conteúdo do editor
- Mantém o modal aberto
- Marca como "alterações pendentes"

### Cancelar
- Se houver alterações não salvas, exibe confirmação
- Fecha o modal sem salvar
- Restaura o conteúdo inicial

### Clicar no Overlay
- Comportamento idêntico ao botão Cancelar
- Pede confirmação se houver alterações

## Estilização

O componente se adapta ao tema da aplicação através do ThemeProvider:
- Cores automáticas baseadas no tema (dark/light)
- Animações suaves de entrada/saída
- Scrollbar customizada
- Border effects baseados em neon on/off

## Acessibilidade

- ✅ ESC fecha o modal (nativo do navegador)
- ✅ Foco automático no editor ao abrir
- ✅ Overlay clicável para fechar
- ✅ Botão de fechar (×) no header

## Dependências

- `@tiptap/react` - Editor de rich text
- `styled-components` - Estilização
- `models/Characters` - Tipo JSONContent

## Exemplos de Uso Real

### Descrição de Item em Tabela
Veja `FormCharacter.tsx` e `tableColumnsConfig.tsx` para exemplos completos de integração com DataTable.

### Preview + Modal
```tsx
const ItemDescriptionCell = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const preview = getTextPreview(value, 50);

  return (
    <div>
      <PreviewBox onClick={() => setIsOpen(true)}>
        {preview || 'Sem descrição'}
      </PreviewBox>
      
      <RichTextModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSave={onChange}
        initialContent={value}
        title="Editar Descrição do Item"
      />
    </div>
  );
};
```

## Utilitários Relacionados

Use com os helpers de `richTextHelpers.ts`:

```tsx
import { 
  getTextPreview,      // Extrai preview curto
  jsonContentToString, // Converte para string
  normalizeToJSONContent // Normaliza input
} from 'utils/richTextHelpers';

// Preview na tabela
const preview = getTextPreview(description, 50);

// String simples do conteúdo
const plainText = jsonContentToString(description);

// Normalizar antes de salvar
const normalized = normalizeToJSONContent(userInput);
```
