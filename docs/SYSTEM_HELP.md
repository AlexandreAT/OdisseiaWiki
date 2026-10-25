# Ajuda contextual da configuração do Sistema

## Fonte dos textos

`OdisseiaWikiClient/src/content/systemHelp.pt-BR.json` é o catálogo de explicações em texto cru das sete abas do Sistema Odisseia. Não contém JSX nem executa regras. `wikiHelp.pt-BR.json` mantém a explicação do slug da Wiki no mesmo formato de apresentação.

Cada módulo possui uma explicação geral, seções e campos. As chaves dos campos seguem os dados configurados, por exemplo `sobrevivencia.fields.condicoes.codigoRecurso`. A interface expõe essa ligação como `data-field-help="odisseia.sobrevivencia.condicoes.codigoRecurso"`.

- `title`: título curto para a ajuda.
- `text`: explicação didática, com exemplos quando úteis; não é HTML.
- `aliases`: rótulos da interface que apontam para a mesma explicação dentro daquela aba.
- `common`: explicações reaproveitadas, como código, ordem e descrição.
- `schemaVersion` e `systemScope`: versão do formato e escopo do catálogo, não a publicação das regras do RPG.

### Formatação sci-fi sem HTML

Todos os popovers mantêm por padrão o título em `DO Futuristic`, leve, em maiúsculas e na cor de destaque, mesmo com neon desligado. O neon controla a iluminação, não remove a identidade visual. A borda e o ícone sem neon continuam em `--grey`.

O mesmo conteúdo pode definir `presentation: { accent, density, listStyle }`. O componente também aceita essa prop como substituição local. `density` pode ser `comfortable` ou `compact`; `listStyle` pode ser `bullets` ou `plain`. As cores semânticas disponíveis são `accent`, `positive`, `warning`, `gold`, `danger` e `muted`, sempre mapeadas para a paleta do site.

Use `items` para listas e `footer` para um texto de apoio final. Cada texto pode ter `highlights: [{ text, style, tone }]`: `style: "code"` cria o pequeno destaque contornado usado nos exemplos de slug; `emphasis` ou a ausência de estilo usa negrito na cor escolhida. As frases continuam em texto cru, pesquisáveis pela futura IA; não use HTML, CSS arbitrário ou código executável nos arquivos de explicações.

A ajuda de tags dos itens também usa `FieldHelp`, com apresentação compacta, lista sem marcadores, `Único` em verde e `Lendário` em dourado. Não deve voltar a manter outro popover independente.

`getSystemHelp(aba, chave)` faz a ligação. As tabelas usam chaves explícitas, como `influenciasAtributos.percentualPorValor`; campos centralizados podem usar `helpKey` ou o rótulo registrado. Ao renomear um campo, atualize seus aliases ou mantenha a chave explícita. Os testes conferem as ligações das seções.

## Padrão visual reutilizável

`components/Generic/FieldHelp` é o padrão extraído da ajuda do slug. O ícone fica no canto superior direito dos campos, com realce no hover; o popover abre por clique, Enter ou Espaço. Fecha por clique fora ou Escape, com animação de entrada e saída. Em seções, tabelas e checkboxes o mesmo controle aparece ao lado do título.

O popover é renderizado fora de contêineres que poderiam cortá-lo e acompanha a âncora no scroll e redimensionamento. Possui largura/altura limitadas pela viewport, scroll interno e respeito a movimento reduzido. A ajuda continua disponível em módulos somente de leitura. Com neon desligado, ícone e borda usam `--grey`.

InputText, Select, TextArea, CheckSelect, Search, CheckBox e StatusInput aceitam ajuda opcional:

```tsx
<InputText
  theme={theme}
  neon={neon}
  label="Recurso afetado"
  helpKey="condicoes.codigoRecurso"
/>
```

Na configuração do Sistema, o `FieldHelpProvider` resolve a chave na aba atual. Fora dela, passe `help={{ id, title, text }}` diretamente. Sem texto registrado nem prop de ajuda, não aparece ícone e a geometria original do campo é mantida. Não crie outro popover local para essa finalidade.

O espaçamento entre grades, textos e títulos pertence ao contêiner da seção. Não acrescente margens globais aos inputs para corrigir um título colado em um formulário específico.

Nos campos, o ícone fica sobreposto no canto: não adiciona padding lateral ao valor nem desloca a seta do select ou o ícone de pesquisa. Apenas o rótulo flutuante quebra antes da ajuda. Quando ocupar mais de uma linha, o campo ajusta o espaço vertical para não sobrepor o conteúdo digitado/selecionado; esse ajuste acompanha redimensionamento e foco. Sem ajuda, o campo mantém seu layout original.

## Legendas das opções nativas

`systemOptionHelp.pt-BR.json` guarda as explicações curtas das escolhas fixas: operações de condição, momentos, comparações, recuperação, duração, grupos de atributos, módulos e tipos dos campos/referências de itens. `describeSystemOptions(grupo, opcoes)` adiciona `description` somente às listas explicitamente nativas. Não use esse enriquecimento nas listas de atributos, personagens ou conteúdos criados pelo usuário.

`Select` e `CheckSelect` aceitam `description` opcional por opção e a exibem com o `title` nativo do navegador. As tabelas de configuração seguem o mesmo contrato. Não há tooltip personalizado nem outro ícone para essas opções. As legendas aparecem no hover; o navegador pode não exibi-las em telas de toque. A ajuda do campo continua disponível por clique.

Na configuração de condições, o efeito principal e os adicionais compartilham as mesmas operações, alvos e limites. **Alterar valor do atributo** seleciona os atributos do Sistema, aceita bônus positivos e penalidades negativas e mantém o efeito enquanto a condição estiver ativa. Trata-se de modificador temporário nos testes, não de redistribuição permanente de pontos ou aumento automático de recursos máximos.

## Uso futuro pela IA

A futura IA pode ler o JSON e indexar cada entrada pelo identificador `odisseia.<aba>.<chave>`, preservando o vínculo com o campo visível. Não precisa extrair textos de componentes nem duplicar uma segunda base explicativa.

Este catálogo explica a interface; os valores mecânicos continuam vindo da versão do Sistema e do contexto da Mesa/ficha. Uma resposta da IA deverá combinar a explicação com a configuração efetivamente publicada, sem assumir que exemplos numéricos são valores universais. Texto narrativo não deve ser interpretado como código executável. Funcionalidades assistidas ou ainda futuras são identificadas como tal nas explicações.

Esta entrega prepara a documentação e os vínculos, não implementa o chat, envio de dados a uma IA, busca semântica ou alteração automática de regras.

## Conferência rápida

1. Em Gerenciamento > Sistema, abra as sete abas e confira a ajuda dos títulos e campos técnicos.
2. Em Sobrevivência > Condições > Configurar, confira o espaço entre os grupos e abra Recurso observado, Recurso afetado, Valor do efeito e as formas de recuperação.
3. Em Progressão, confira a diferença entre XP, pontos e influência de atributo; em Combate, confira iniciativa e quantidade de ataques.
4. Na criação/edição de uma página da Wiki, abra a ajuda do slug. Sem neon, ícone e borda devem ficar cinza; com neon, devem seguir o realce azul.
5. No celular, confira o popover perto das laterais e do fim da tela, role o texto dentro dele e feche tocando fora. Confira também Escape e navegação por teclado no desktop.
6. Em Condições > Configurar > Efeito, escolha **Alterar valor do atributo**, selecione um atributo e use +2 ou −5. O momento deve ser **Enquanto estiver ativa**. Passe o mouse nas opções de efeito, duração e recuperação; listas dinâmicas de atributos não devem receber legendas automáticas.

Testes automatizados: `node --test tests/systemHelp.test.mjs`. O aceite visual continua necessário quando houver navegador conectado.
