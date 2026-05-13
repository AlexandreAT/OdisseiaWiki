# Checklist de Implementação - Wiki Pages Form

## Arquivos Criados

- ✅ `src/models/Pages.ts` - Tipagens e enums
- ✅ `src/services/pageService.ts` - Service de API
- ✅ `src/routes/Management/ManagementWiki/WikiForms/FormCriarConteúdo/FormPage/useFormPage.ts` - Hook de lógica
- ✅ `src/routes/Management/ManagementWiki/WikiForms/FormCriarConteúdo/FormPage/FormPage.tsx` - Componente principal
- ✅ `src/routes/Management/ManagementWiki/WikiForms/FormCriarConteúdo/FormPage/FormPage.style.ts` - Estilos
- ✅ `src/routes/Management/ManagementWiki/WikiForms/FormCriarConteúdo/FormPage/FormPage.type.ts` - Tipos do componente

## Componentes de Blocos Criados

- ✅ `RichTextBlockEditor.tsx` - Editor de texto rico
- ✅ `ImageBlockEditor.tsx` - Editor de imagem única
- ✅ `GalleryBlockEditor.tsx` - Editor de galeria
- ✅ `InfoLoreBlockEditor.tsx` - Seletor de InfoLore
- ✅ `RelationBlockEditor.tsx` - Seletor de entidades relacionadas

## TO-DO: Próximas Etapas na Integração

### 1. Integração em Rota de Criação
```
[ ] Criar rota /wiki/create
[ ] Renderizar FormPage sem initialPage
[ ] Configurar navegação de sucesso
```

### 2. Integração em Rota de Edição
```
[ ] Criar rota /wiki/:id/edit
[ ] Carregar dados da página
[ ] Carregar blocos relacionados
[ ] Renderizar FormPage com initialPage e blocks
```

### 3. Listagem de Páginas (Opcional)
```
[ ] Criar página de listagem (se não existir)
[ ] Integrar getPages() do service
[ ] Links para edit/delete
```

### 4. Renderização de Páginas Públicas (Opcional)
```
[ ] Criar componente PageRenderer
[ ] Renderizar blocos dinamicamente
[ ] Estilos visuais finais
```

### 5. Backend - Endpoints Necessários
Certifique-se de que o backend possui:

```
[ ] POST /api/pages
    - Recebe: CreatePageWithBlocksDto
    - Retorna: ResultPage com page.idPage

[ ] PUT /api/pages/{id}
    - Recebe: CreatePageWithBlocksDto
    - Retorna: ResultPage

[ ] GET /api/pages
    - Query params: ?visivel=true
    - Retorna: ResultPages

[ ] GET /api/pages/{slug}
    - Retorna: ResultPageWithBlocks

[ ] GET /api/pages/id/{id}
    - Retorna: ResultPageWithBlocks

[ ] DELETE /api/pages/{id}
    - Retorna: 200/204
```

### 6. Backend - Serialização de Conteúdo
```
[ ] Helper para serializar JSONContent
[ ] Helper para serializar ImageBlockContent
[ ] Helper para serializar GalleryBlockContent
[ ] Helper para serializar InfoLoreBlockContent
[ ] Helper para serializar RelatedEntityBlockContent
```

### 7. Testes (Recomendado)
```
[ ] Testes unitários para useFormPage
[ ] Testes de validação
[ ] Testes de adição/remoção de blocos
[ ] Testes de integração com API
[ ] Testes de diferentes tipos de blocos
```

### 8. Documentação
```
[ ] Documentar endpoints no backend
[ ] Criar guia de uso para editors
[ ] Documentar estrutura de dados esperada
```

## Verificações Finais

### Frontend Checklist
- ✅ TypeScript compila sem erros
- ✅ Componentes renderizam corretamente
- ✅ Validações funcionam
- ✅ Toast notifications aparecem
- ✅ Imagens fazem upload
- ✅ Blocos são adicionados/removidos
- ✅ Blocos podem ser reordenados
- ✅ Temas dark/light funcionam
- ✅ Neon on/off funciona

### Backend Checklist
- [ ] Endpoints retornam status correto
- [ ] Conteúdos são serializados/desserializados
- [ ] Validações de campos obrigatórios
- [ ] Tratamento de erros
- [ ] CORS configurado
- [ ] Autenticação funcionando
- [ ] Assets salvos corretamente

## Configurações Necessárias

### Environment Variables
Se necessário, adicionar em `.env`:
```
VITE_API_URL=http://localhost:5000/api
VITE_UPLOAD_ENDPOINT=/assets
```

### Imports Necessários
O FormPage precisa que estes componentes estejam disponíveis:
- ✅ CyberButton
- ✅ InputText
- ✅ TextArea
- ✅ CheckBox
- ✅ RichTextEditor
- ✅ Search
- ✅ Select

### Dependências
Verificar se estão instaladas:
```
[ ] react-icons
[ ] styled-components
[ ] react-hot-toast
[ ] axios (para api)
```

## Melhorias Futuras (Não Críticas)

- [ ] Validação de slug único
- [ ] Preview em tempo real
- [ ] Salvamento automático (draft)
- [ ] Keywords/SEO metadata
- [ ] Comments/notas na página
- [ ] Versionamento de páginas
- [ ] Histórico de alterações
- [ ] Duplicação de páginas
- [ ] Templates de páginas
- [ ] Reordenação drag & drop
- [ ] Blocos aninhados
- [ ] Bloco de sumário dinâmico
- [ ] Suporte a aliases de slug

## Debugging

Se encontrar problemas:

1. **Erro de tipos TypeScript**
   - Verificar imports em `src/models/Pages.ts`
   - Verificar que PageBlockType é enum

2. **Componentes não renderizam**
   - Verificar imports dos componentes Generic
   - Verificar que styled-components está instalado

3. **API retorna erro**
   - Verificar payload em console.log
   - Validar estrutura CreatePageWithBlocksDto
   - Verificar endpoints no backend

4. **Blocos não salvam conteúdo**
   - Verificar que updateBlock é chamado corretamente
   - Validar estrutura de conteudo por tipo
   - Confirmar serialização no backend

## Support & Questions

Para dúvidas sobre a implementação:
- Consultar README.md em FormPage/
- Consultar WIKI_PAGES_FORM_EXAMPLES.md
- Verificar infoLoreService.ts como referência de padrões
- Verificar FormCharacter.tsx como referência de estrutura
