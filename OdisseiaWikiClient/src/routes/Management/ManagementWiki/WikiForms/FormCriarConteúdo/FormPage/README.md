# Wiki Pages Form - Documentação

## Visão Geral

O sistema de páginas da Wiki foi desenvolvido seguindo uma arquitetura modular e escalável, permitindo criar páginas dinâmicas compostas por blocos reutilizáveis. A estrutura funciona como um CMS para o universo do RPG.

## Estrutura de Dados

### Models (`src/models/Pages.ts`)

- **PageBlockType**: Enum com tipos de blocos suportados
  - `RICH_TEXT`: Texto formatado (JSON do TipTap)
  - `IMAGE`: Imagem única com legenda
  - `GALLERY`: Galeria de múltiplas imagens
  - `INFOLORE`: Referência a um InfoLore
  - `RELATION`: Relacionamento com entidades (Cidade, Raça, Item, Personagem)

- **PageDto**: Dados básicos da página
  - `idPage`: ID da página
  - `titulo`: Título obrigatório
  - `slug`: URL slug (gerado automaticamente)
  - `descricao`: Descrição opcional
  - `coverImage`: Imagem de capa opcional
  - `visivel`: Visibilidade da página
  - `dataCriacao`: Data de criação

- **PageBlockDto**: Blocos da página
  - `tipo`: Tipo do bloco (PageBlockType)
  - `conteudo`: Conteúdo dinâmico (estrutura varia por tipo)
  - `ordem`: Índice de ordenação

- **CreatePageWithBlocksDto**: DTO enviado ao backend
  ```typescript
  {
    page: PageDto,
    blocks: PageBlockDto[]
  }
  ```

## Tipos de Blocos

### 1. Rich Text Block
Armazena conteúdo formatado do editor TipTap/ProseMirror.

**Conteúdo:**
```typescript
JSONContent // Estrutura TipTap padrão
```

**Componente:** `RichTextBlockEditor`

### 2. Image Block
Imagem única com legenda opcional.

**Conteúdo:**
```typescript
{
  url: string;
  legenda?: string;
}
```

**Componente:** `ImageBlockEditor`

### 3. Gallery Block
Galeria de múltiplas imagens.

**Conteúdo:**
```typescript
{
  imagens: [
    { url: string; legenda?: string }
  ]
}
```

**Componente:** `GalleryBlockEditor`

### 4. InfoLore Block
Referência a um conteúdo de lore existente.

**Conteúdo:**
```typescript
{
  idInfoLore: number;
  titulo?: string;
  imagem?: string;
}
```

**Componente:** `InfoLoreBlockEditor`

### 5. Relation Block
Relacionamento com entidades do sistema.

**Conteúdo:**
```typescript
{
  idEntidade: number;
  tipoEntidade: 'Cidade' | 'Personagem' | 'Item' | 'Raca';
  nome?: string;
  imagem?: string;
}
```

**Componente:** `RelationBlockEditor`

## Serviço de API (`src/services/pageService.ts`)

```typescript
// Criar nova página
createPage(dto: CreatePageWithBlocksDto): Promise<ResultPage>

// Atualizar página existente
updatePage(id: number, dto: CreatePageWithBlocksDto): Promise<ResultPage>

// Listar páginas
getPages(visivel?: boolean): Promise<ResultPages>

// Obter página pelo slug
getPageBySlug(slug: string): Promise<ResultPageWithBlocks>

// Obter página por ID
getPageById(id: number): Promise<ResultPageWithBlocks>

// Deletar página
deletePage(id: number): Promise<boolean>
```

## Hook `useFormPage`

O hook gerencia toda a lógica do formulário de páginas.

### Estado

```typescript
// Dados da página
titulo: string
slug: string
descricao: string
coverImageUrl: string
coverImageFile: File | null
visivel: boolean

// Blocos
blocks: PageBlock[]

// Erros
tituloError: boolean
slugError: boolean
```

### Funções

```typescript
// Setters
setTitulo(value: string): void         // Auto-gera slug se vazio
setSlug(value: string): void
setDescricao(value: string): void
setCoverImageUrl(value: string): void
setCoverImageFile(file: File): void
setVisivel(checked: boolean): void

// Gerenciamento de blocos
addBlock(tipo: PageBlockType): void    // Adiciona novo bloco
removeBlock(tempId: string): void      // Remove bloco por ID
updateBlock(tempId: string, conteudo: any): void  // Atualiza conteúdo
moveBlockUp(tempId: string): void      // Move bloco para cima
moveBlockDown(tempId: string): void    // Move bloco para baixo

// Utilitários
generateSlug(text: string): string

// Submit
handleSubmit(e?: FormEvent): void      // Valida e envia para API
```

## Componente `FormPage`

O componente principal que renderiza o formulário completo.

### Props

```typescript
interface FormPageProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  initialPage?: PageDto;        // Para edição
  initialBlocks?: PageBlock[];  // Para edição
  pageId?: number;              // ID da página para atualização
}
```

### Uso

**Criar nova página:**
```tsx
import { FormPage } from './routes/Management/ManagementWiki/WikiForms/FormCriarConteúdo/FormPage/FormPage';

<FormPage theme="dark" neon="on" />
```

**Editar página existente:**
```tsx
<FormPage
  theme="dark"
  neon="on"
  initialPage={pageData}
  initialBlocks={blockData}
  pageId={pageData.idPage}
/>
```

## Arquitetura de Componentes

```
FormPage/
├── FormPage.tsx                    # Componente principal
├── FormPage.type.ts                # Interfaces do componente
├── FormPage.style.ts               # Estilos (styled-components)
├── useFormPage.ts                  # Hook de lógica
└── PageBlockComponents/
    ├── RichTextBlockEditor.tsx
    ├── ImageBlockEditor.tsx
    ├── GalleryBlockEditor.tsx
    ├── InfoLoreBlockEditor.tsx
    ├── RelationBlockEditor.tsx
    └── index.ts
```

## Fluxo de Dados

1. **Frontend monta o componente** com dados iniciais (se edição)
2. **Hook inicializa estado** com dados da página e blocos
3. **Usuário interage** com o formulário
4. **Blocos dinamicamente renderizados** baseado em tipo
5. **Ao submeter**, valida:
   - Título obrigatório
   - Slug obrigatório
   - Pelo menos um bloco
6. **Upload de assets** se necessário (cover image)
7. **Serialização de conteúdo** preparado automaticamente
8. **Envio ao backend** com estrutura CreatePageWithBlocksDto
9. **Feedback ao usuário** (toast success/error)

## Padrões Utilizados

### 1. IDs Temporários para Blocos
Cada bloco tem um `tempId` único no frontend para evitar problemas de renderização:
```typescript
const tempId = `block_${Date.now()}_${random}`;
```

### 2. Auto-geração de Slug
O slug é auto-gerado a partir do título e pode ser editado:
```typescript
generateSlug("Título da Página") // "titulo-da-pagina"
```

### 3. Recarga de Mudanças de Tipo
Quando o tipo do bloco muda, componentes específicos se renderizam dinamicamente.

### 4. Validação Clara
Mensagens de erro aparecem apenas quando necessário, com feedback visual claro.

### 5. Reusabilidade de Componentes Existentes
- `RichTextEditor` para edição de texto
- `InputText` para campos simples
- `CheckBox` para visibilidade
- `TextArea` para descrições

## Adição de Novos Tipos de Blocos

Para adicionar um novo tipo de bloco:

1. **Adicionar tipo em `PageBlockType` enum** (`src/models/Pages.ts`)
2. **Criar interface de conteúdo** para o novo tipo
3. **Criar componente editor** em `PageBlockComponents/`
4. **Exportar do index** de PageBlockComponents
5. **Adicionar render case** em FormPage.tsx
6. **Atualizar blockTypeLabels** com etiqueta visual
7. **Backend precisa deserializar** o novo tipo

## Integração com Backend

O backend deve:

1. Receber `CreatePageWithBlocksDto`
2. Serializar conteúdos dos blocos em JSON
3. Salvar página e blocos
4. Ao retornar, desserializar conteúdos

O frontend naturalmente trabalha com objetos JS/JSON, não com strings serializadas.

## Tratamento de Erros

Erros são tratados com:
- Toast notifications (react-hot-toast)
- Validação de campo com `Error` styled component
- Disabled states em botões quando apropriado
- Logs no console para debug

## Performance

- Componentes otimizados com `useCallback`
- Memoização de arrays/computações quando necessário
- Renderização dinâmica baseada em tipo de bloco
- IDs únicos evitam re-renders desnecessários

## Próximas Melhorias Sugeridas

- [ ] Drag & drop reordenação de blocos
- [ ] Preview em tempo real
- [ ] Salvamento automático (draft)
- [ ] Histórico de versões
- [ ] Colaboração em tempo real
- [ ] Mais tipos de blocos (vídeo, iframe, timeline, etc)
- [ ] Reutilização global de blocos
- [ ] Temas personalizados por página
