<!-- Documento de referencia fornecido pelo autor do projeto.
     Os comportamentos descritos sao hipoteses de produto/levantamento e devem ser
     validados nas fontes oficiais antes da implementacao. -->

# Levantamento completo das funcionalidades do Roll20 VTT
### Estudo de referência para o desenvolvimento de um VTT próprio
**Data da pesquisa: 30 de outubro de 2026**

Fiz o levantamento com base na documentação oficial do Roll20, incluindo funcionalidades introduzidas ou atualizadas em 2026.

O objetivo aqui não é simplesmente listar botões. É identificar **quais funcionalidades existem, como funcionam, como se relacionam e o que seria necessário implementar para reproduzi-las em outro VTT**.

Vou dividir o estudo em três partes:

1. **Inventário funcional:** tudo que o Roll20 oferece dentro da mesa de jogo.
2. **Análise técnica:** como essas funcionalidades se relacionam e quais problemas precisam ser resolvidos ao implementá-las.
3. **Planejamento de desenvolvimento:** o que considero essencial, secundário e avançado para o seu VTT.

### Escopo da pesquisa

**Incluído:**
- Interface e ferramentas da mesa.
- Mapas, grid, camadas, tokens e movimentação.
- Iluminação, visibilidade e exploração.
- Fichas, Journal, anotações e bibliotecas.
- Dados, macros, comandos e automações.
- Chat, música, cartas, iniciativa e efeitos.
- Permissões, interações e configurações durante a partida.

**Excluído:**
- Marketplace e compra de conteúdo.
- Planos comerciais, exceto quando afetam uma funcionalidade.
- Cadastro, login e gerenciamento de contas.
- Comunidade, fóruns e organização externa de campanhas.

> **Importante:** o Roll20 passou por uma modernização chamada *Jumpgate*, que se tornou a base dos novos jogos em novembro de 2025. Algumas documentações antigas descrevem a interface anterior. Neste levantamento, considero a versão modernizada e identifico os recursos mais recentes ou ainda em beta. [Roll20 Help Center](https://help.roll20.net/hc/en-us/articles/25289127045143-VTT-Quality-of-Life-Feature-Improvements?utm_source=chatgpt.com)

---

# PARTE 1 — INVENTÁRIO FUNCIONAL

## 1. Estrutura geral da interface

A interface do Roll20 é organizada em regiões que possuem responsabilidades diferentes.

| Região | O que contém | Finalidade |
|---|---|---|
| **Barra superior** | Páginas, controles de visualização e zoom | Navegar e administrar as cenas |
| **Barra esquerda** | Seleção, desenho, medição, dados, iluminação e outras ferramentas | Interagir diretamente com o mapa |
| **Centro** | Canvas, mapas, tokens, grid e efeitos | Área principal da partida |
| **Barra direita** | Chat, Art Library, Journal, Compendium, Jukebox, Collections e Settings | Consultar informações e acessar recursos |
| **Parte inferior** | Participantes, avatares, controles de comunicação e barra de macros | Ações rápidas e presença dos jogadores |
| **Elementos flutuantes** | Fichas, anotações, configurações, menus de token e iniciativa | Operar recursos sem abandonar o mapa |

A barra direita pode ser ocultada, e diversos recursos abrem janelas independentes. Isso permite, por exemplo, manter uma ficha de personagem aberta enquanto o mapa continua visível. [Roll20 Help Center](https://help.roll20.net/hc/en-us/articles/360039675073-The-Sidebar?utm_source=chatgpt.com)

### 1.1. Elementos flutuantes e contextuais

O Roll20 não depende somente das barras laterais.

Ele utiliza:

- **Menu de contexto:** aparece ao clicar com o botão direito em um objeto.
- **Menu radial de token:** aparece ao selecionar um token e oferece controles rápidos.
- **Tooltips:** pequenas informações exibidas ao passar o cursor.
- **Popovers:** menus menores ligados a botões e ferramentas.
- **Modais:** janelas para editar tokens, configurar recursos ou consultar informações.
- **Janelas destacáveis:** fichas e documentos que podem ser abertos separadamente.
- **Barra de macros:** comandos persistentes na parte inferior da tela.
- **Barra de ações do token:** comandos específicos do personagem selecionado.
- **Turn Tracker:** painel flutuante para administrar a iniciativa.
- **Menus de ferramentas:** configurações que aparecem conforme a ferramenta selecionada.
- **Notificações temporárias:** avisos de ações, como um jogador levantando a mão.

**Para seu VTT:** vale tratar esses elementos como um sistema de interface reutilizável. Não é interessante implementar um modal completamente diferente para cada funcionalidade.

---

## 2. Mapas e gerenciamento de cenas

No Roll20, cada página funciona como uma cena independente.

Uma página pode representar uma masmorra, uma cidade, uma região do mundo, um encontro de combate ou até uma mesa para cartas.

### 2.1. Gerenciamento de páginas

| Funcionalidade | Comportamento |
|---|---|
| Criar página | Adiciona uma cena vazia |
| Criar página com mapa | Adiciona uma cena utilizando uma imagem de fundo |
| Renomear página | Altera a identificação da cena |
| Duplicar página | Copia a cena, suas configurações e conteúdos selecionados |
| Excluir página | Remove a cena |
| Arquivar página | Retira a cena da navegação principal sem apagá-la |
| Restaurar página | Recupera uma página arquivada |
| Reordenar páginas | Permite mudar sua ordem arrastando |
| Criar pastas | Organiza páginas por região, capítulo ou finalidade |
| Criar subpastas | Permite organização hierárquica |
| Mover páginas entre pastas | Reorganiza cenas sem recriá-las |
| Pesquisar páginas | Localiza cenas pelo nome |
| Alternar página | O mestre pode navegar entre cenas sem mover os jogadores |
| Mover jogadores | Transfere jogadores para outra página |
| Dividir o grupo | Mantém jogadores diferentes em cenas diferentes |
| Reunir o grupo | Envia os jogadores para uma página comum |
| Copiar tokens entre páginas | Permite transferir objetos para outra cena |
| Definir grupo de personagens | Permite posicionar os tokens do grupo em conjunto |

**Detalhe importante:** o mestre pode estar preparando uma página enquanto os jogadores continuam em outra. Portanto, **a página que o mestre está visualizando não precisa ser a mesma página exibida para os jogadores**.

O Roll20 usa marcadores de grupo, chamados *Party Ribbons*, para controlar onde os jogadores estão. [Roll20 Help Center](https://help.roll20.net/hc/en-us/articles/360039675413-Page-Menu-Folders?utm_source=chatgpt.com)

### 2.2. Configurações individuais de cada mapa

Cada página possui configurações próprias.

| Categoria | Configurações |
|---|---|
| Dimensões | Largura e altura do canvas |
| Tamanho das células | Dimensão de cada quadrado ou hexágono |
| Escala | Quanto cada célula representa no universo do jogo |
| Unidades | Pés, metros, quilômetros, milhas ou valores personalizados |
| Cor de fundo | Cor interna do mapa |
| Área externa | Cor ou imagem fora dos limites do mapa |
| Grid | Ativar ou desativar |
| Tipo de grid | Quadrada, hexagonal horizontal ou vertical |
| Grids adicionais | Isométrica e dimétrica em ferramentas atualizadas |
| Visual do grid | Cor e opacidade das linhas |
| Alinhamento | Ajuste fino da posição da grade |
| Snap | Encaixe automático dos objetos na grade |
| Medição diagonal | Diferentes regras para calcular distâncias |
| Iluminação | Configurações de luz específicas da página |
| Neblina | Controle das áreas ocultas do mapa |
| Música | Trilha associada à entrada dos jogadores na página |

O sistema permite diferentes regras de distância, incluindo métodos usados em D&D e Pathfinder, distância euclidiana e Manhattan.

Também existe uma opção de escala por categorias de alcance, como *Melee*, *Close* e *Far*, em vez de distâncias numéricas exatas. [Roll20 Help Center](https://help.roll20.net/hc/en-us/articles/360039675373-Page-Settings?utm_source=chatgpt.com)

### 2.3. Importação e alinhamento de mapas

Funcionalidades identificadas:

- Importar imagens do computador.
- Arrastar imagens para o canvas.
- Utilizar imagens estáticas e determinados formatos animados.
- Redimensionar mapas.
- Reposicionar e rotacionar imagens.
- Ajustar uma imagem ao tamanho da página.
- Bloquear o mapa para evitar movimentos acidentais.
- Corrigir alinhamento entre o grid desenhado na imagem e o grid do VTT.
- Alterar o deslocamento horizontal e vertical da grade.
- Ajustar escala e dimensões da cena.
- Usar imagens como fundo externo da página.

**Recurso de 2026 — alinhamento assistido:** o Roll20 apresentou em beta uma ferramenta que permite selecionar um ponto de referência, ajustar a escala e corrigir manualmente o alinhamento. Ela também contempla grades hexagonais, isométricas e dimétricas. [Roll20 Blog](https://blog.roll20.net/posts/align-to-grid-new/?utm_source=chatgpt.com)

### 2.4. Importação UVTT

O Roll20 também passou a aceitar arquivos:

- `.uvtt`
- `.dd2vtt`
- `.df2vtt`

Esses arquivos podem conter mais informações que uma imagem normal.

Ao importar, o VTT consegue criar automaticamente:

1. A imagem do mapa.
2. A escala do grid.
3. As paredes.
4. As portas e janelas.
5. As fontes de iluminação.

O mestre pode editar esses elementos depois da importação. O upload é permitido para todos, mas utilizar efetivamente a iluminação dinâmica exige o recurso correspondente. [Roll20 Help Center](https://help.roll20.net/hc/en-us/articles/41643201127831-Universal-Virtual-Tabletop-UVTT-Support?utm_source=chatgpt.com)

**Minha avaliação:** importação UVTT seria uma funcionalidade excelente para seu projeto no futuro. Ela evita que um mestre precise reconstruir manualmente todas as paredes e fontes de luz de um mapa criado em outro programa.

---

## 3. Sistema de camadas — Layers

O Roll20 organiza os objetos em camadas.

Isso é importante porque cada camada possui uma finalidade e regras de visualização distintas.

| Camada | Finalidade | Visível aos jogadores? |
|---|---|---|
| **Map & Background** | Mapas, cenários e decorações fixas | Sim |
| **Objects & Tokens** | Personagens, inimigos e objetos interativos | Sim, conforme permissões e visibilidade |
| **GM Info Overlay** | Anotações, inimigos ocultos e informações secretas | Não |
| **Foreground** | Telhados, árvores e objetos que aparecem sobre os tokens | Sim, conforme configurações |
| **Dynamic Lighting** | Paredes e barreiras utilizadas nos cálculos de visão | Não como camada comum |

O mestre consegue alternar entre as camadas, mover objetos de uma para outra e ajustar a transparência de determinadas camadas. A camada *Foreground* e a de iluminação dinâmica dependem de recursos de assinatura no Roll20. [Roll20 Help Center](https://help.roll20.net/hc/en-us/articles/360039675053-Layers?utm_source=chatgpt.com)

### Funcionalidades associadas às camadas

- Selecionar a camada ativa.
- Criar objetos diretamente em uma camada.
- Mover objetos entre camadas.
- Ocultar elementos do mestre.
- Controlar quais objetos podem ser selecionados.
- Ordenar objetos à frente ou atrás de outros.
- Bloquear determinados objetos.
- Manipular várias imagens em uma única camada.
- Alterar a opacidade da camada do mestre.
- Interagir com objetos sobrepostos.

### Exemplo prático

Imagine uma casa vista de cima:

- O chão pertence à camada **Map**.
- Os personagens pertencem à camada **Tokens**.
- O telhado pertence à camada **Foreground**.
- As paredes que impedem enxergar o interior pertencem à camada **Lighting**.
- Um inimigo ainda não revelado pode estar na camada **GM**.

**Para seu VTT:** a camada não deve ser apenas uma propriedade visual. Ela também determina comportamento, permissões e quais objetos participam de cada sistema.

---

## 4. Ferramentas de interação com o canvas

Esta é a parte da interface que os usuários utilizam continuamente durante a partida.

### 4.1. Navegação

| Ferramenta | Funcionalidades |
|---|---|
| Seleção | Selecionar e manipular objetos |
| Multisseleção | Selecionar vários tokens ou imagens |
| Seleção por área | Arrastar um retângulo para selecionar objetos |
| Filtros de seleção | Selecionar apenas tokens, desenhos, textos ou objetos especiais |
| Pan | Arrastar a visualização do mapa |
| Zoom | Aproximar e afastar |
| Zoom no cursor | Aproximar mantendo o ponto do cursor como referência |
| Centralizar | Voltar ao centro do mapa |
| Ajustar à tela | Exibir o mapa inteiro |
| Ping | Marcar rapidamente uma posição |
| Foco forçado | O mestre pode direcionar a câmera dos jogadores para um ponto |
| Ponteiro compartilhado | Mostrar a posição do cursor de um participante |
| Pré-visualização | Ampliar um objeto selecionado |
| Mostrar imagem a todos | O mestre pode exibir uma imagem ampliada para o grupo |

Os pings e ponteiros utilizam identificação visual dos participantes. O Roll20 também permite mostrar uma imagem ampliada para todos os jogadores que estão na mesma página. [Roll20 Help Center](https://help.roll20.net/hc/en-us/articles/360039734913-Tabletop-Overview?utm_source=chatgpt.com)

### 4.2. Manipulação dos objetos

- Arrastar e soltar.
- Copiar e colar.
- Duplicar.
- Excluir.
- Desfazer e refazer.
- Agrupar e desagrupar.
- Rotacionar.
- Espelhar horizontalmente ou verticalmente.
- Redimensionar.
- Preservar proporção ao redimensionar.
- Enviar para frente ou para trás.
- Bloquear posição.
- Ativar ou ignorar o encaixe na grid.
- Movimentar usando as setas do teclado.
- Movimentar em incrementos menores.
- Alterar dimensões numericamente.
- Organizar objetos dentro das camadas.

O menu de contexto também disponibiliza ações diferentes dependendo de onde o usuário clicou: no mapa vazio, em um token ou em uma seleção de vários objetos. [Roll20 Help Center](https://help.roll20.net/hc/en-us/articles/35999226799127-Right-Click-Menu?utm_source=chatgpt.com)

### 4.3. Ferramentas de desenho

O Roll20 possui recursos básicos de desenho sobre o canvas.

| Ferramenta | Uso |
|---|---|
| Desenho livre | Traçar linhas manualmente |
| Pincel | Desenhar com uma espessura definida |
| Linha | Criar traços retos |
| Retângulo | Desenhar áreas quadradas ou retangulares |
| Elipse/círculo | Desenhar áreas circulares |
| Polígono | Criar formas com vários pontos |
| Texto | Inserir informações diretamente no mapa |
| Cor da linha | Personalizar os contornos |
| Cor do preenchimento | Preencher figuras |
| Espessura | Controlar a largura das linhas |
| Alinhamento ao grid | Fazer traços seguindo a grade |
| Apagar | Remover desenhos e textos |

É possível utilizar essas ferramentas tanto para preparar mapas quanto para fazer anotações durante a sessão. [Roll20 Help Center](https://help.roll20.net/hc/articles/360039674893?utm_source=chatgpt.com)

### 4.4. Ferramenta de medição

A régua é mais sofisticada do que uma linha com a distância escrita.

Ela oferece:

- Medição entre dois pontos.
- Medição por múltiplos pontos intermediários.
- Medição seguindo as regras da grid.
- Medição sem snap.
- Medição a partir do centro ou da borda das células.
- Medição usando unidades do mapa.
- Regras diferentes para diagonais.
- Medição de linhas.
- Medição de quadrados e retângulos.
- Medição circular.
- Medição em cones.
- Configuração do ângulo do cone.
- Exibição ou ocultação da medição para outros participantes.
- Manutenção temporária da medição na tela.
- Recuperação da última medição.
- Medição automática do deslocamento dos tokens.

**Exemplo:** um jogador consegue verificar se um ataque com alcance de 12 metros atinge três inimigos posicionados em determinada região.

A ferramenta também pode representar áreas de efeito, como a explosão de uma granada ou o cone de uma habilidade. [Roll20 Help Center](https://help.roll20.net/hc/en-us/articles/360039674913-Measure-Tool?utm_source=chatgpt.com)

---

## 5. Tokens — personagens, criaturas e objetos

**Esta é uma das partes mais importantes para seu VTT.**

No Roll20, um token não precisa representar um personagem. Ele pode representar uma criatura, uma porta, uma arma, um objeto de cenário, uma armadilha ou qualquer outro elemento visual.

Além disso, o token pode existir independentemente de uma ficha ou estar vinculado a ela.

### 5.1. Manipulação básica

| Funcionalidade | O que faz |
|---|---|
| Criar token | Transforma uma imagem posicionada na camada apropriada em um token |
| Selecionar | Permite interagir com o token |
| Multisselecionar | Seleciona vários tokens simultaneamente |
| Mover | Arrasta o token pelo mapa |
| Snap to Grid | Encaixa o token nas células |
| Movimento livre | Ignora temporariamente o snap |
| Rotacionar | Altera a orientação do token |
| Redimensionar | Modifica largura e altura |
| Definir dimensões | Permite indicar tamanhos específicos |
| Copiar e colar | Duplica o token |
| Agrupar | Faz vários objetos funcionarem como um grupo |
| Espelhar | Inverte horizontal ou verticalmente |
| Alterar camada | Move o token entre as camadas disponíveis |
| Alterar profundidade | Coloca o token à frente ou atrás de outros |
| Bloquear | Impede movimentações acidentais |
| Excluir | Remove o token |
| Ampliar imagem | Mostra uma versão maior da arte |
| Aplicar tonalidade | Altera a aparência usando um filtro de cor |
| Numerar tokens | Diferencia automaticamente cópias semelhantes |

### 5.2. Propriedades de um token

Cada token possui configurações próprias:

- Nome.
- Imagem.
- Posição X e Y.
- Largura e altura.
- Rotação.
- Camada.
- Personagem representado.
- Jogadores autorizados a controlá-lo.
- Barras de atributos.
- Marcadores de estado.
- Auras.
- Tooltip.
- Anotações particulares do mestre.
- Configurações de visão.
- Configurações de iluminação.
- Aparência e opções de exibição.

### 5.3. Barras e menu radial

Ao selecionar um token, surgem pequenos controles ao redor dele.

O Roll20 permite configurar **três barras por padrão, com opção de utilizar quatro**.

Cada barra pode ter:

- Valor atual.
- Valor máximo.
- Cor.
- Estilo visual.
- Posição em relação ao token.
- Permissão de visualização.
- Permissão de edição.
- Associação a um atributo da ficha.

É possível alterar um valor diretamente pelo menu radial.

**Exemplo:**

O token tem 30 pontos de vida. O jogador digita `-7` no controle da barra e o valor passa para 23.

Isso é diferente de digitar `7`, que definiria o valor diretamente.

As barras também podem aparecer permanentemente ou apenas ao passar o cursor sobre o token. [Roll20 Help Center](https://help.roll20.net/hc/en-us/articles/360039674573-Token-Features?utm_source=chatgpt.com)

### 5.4. Marcadores de estado

São os pequenos símbolos exibidos sobre os tokens.

Eles podem representar:

- Envenenamento.
- Sangramento.
- Atordoamento.
- Invisibilidade.
- Concentração.
- Efeitos mágicos.
- Condições definidas pelo mestre.

Funcionalidades:

- Adicionar marcadores.
- Remover marcadores.
- Combinar vários marcadores.
- Definir marcadores personalizados.
- Associar números de 0 a 9.
- Alterar onde os marcadores são exibidos.
- Diferenciar inimigos visualmente semelhantes.

Por exemplo, três soldados idênticos podem ser diferenciados utilizando marcadores numerados.

### 5.5. Auras

Cada token pode possuir até duas auras.

Configurações:

- Raio.
- Cor.
- Transparência.
- Formato circular.
- Formato quadrado.
- Formato hexagonal.
- Apenas contorno.
- Visibilidade para jogadores.

**Aplicações:** alcance de uma habilidade, área de proteção, presença ameaçadora ou região de influência de um personagem.

### 5.6. Permissões dos tokens

O Roll20 distingue quem consegue **ver** um token de quem consegue **controlá-lo**.

O mestre pode:

- Controlar qualquer token.
- Atribuir um token a um jogador.
- Atribuir o mesmo token a vários jogadores.
- Permitir que todos o controlem.
- Retirar a permissão de movimentação.
- Ocultar um token dos jogadores.
- Permitir ou restringir a edição de suas barras.

Isso é essencial para jogos com acompanhantes, criaturas invocadas e veículos.

### 5.7. Tokens vinculados às fichas

Um token pode representar um personagem cadastrado no Journal.

O vínculo permite:

- Abrir a ficha pelo token.
- Utilizar o nome e os dados do personagem.
- Herdar permissões.
- Relacionar barras com atributos.
- Sincronizar alterações de valores.
- Associar ações e macros.
- Definir o token padrão daquele personagem.
- Reutilizar suas configurações em outros mapas.

**Uma particularidade importante:** o Roll20 diferencia valores vinculados e não vinculados.

Imagine cinco zumbis criados a partir da mesma ficha:

- Se todos compartilharem um atributo vinculado de pontos de vida, mudar esse atributo em um poderá afetar os demais.
- Se cada token tiver seus próprios pontos de vida, eles podem sofrer dano independentemente.

**Para seu VTT:** recomendo separar `Character` de `TokenInstance` desde o início. Isso evitará vários problemas futuros.

---

## 6. Tokens com múltiplas imagens — Multi-Sided Tokens

Essa funcionalidade merece uma categoria específica, porque é exatamente o tipo de recurso que você citou.

No Roll20, a implementação é baseada em **Rollable Tables**.

### Como funciona

O mestre cria uma tabela com vários itens e associa uma imagem a cada um.

Depois, cria um token baseado nessa tabela.

O token passa a possuir múltiplas faces.

### Funcionalidades

| Funcionalidade | Comportamento |
|---|---|
| Adicionar imagens | Define as possíveis aparências |
| Nomear faces | Identifica cada opção da tabela |
| Escolher face | Troca manualmente a imagem do token |
| Face aleatória | Seleciona uma imagem aleatoriamente |
| Vincular personagem | Permite usar esse token para representar uma ficha |
| Definir como padrão | Faz o personagem utilizar o token multiface |
| Reutilizar | Permite criar outros tokens da mesma tabela |
| Manter atributos | Permite trocar a aparência sem recriar os dados associados |

**Exemplo:** um personagem pode ter uma imagem normal, outra ferida, outra transformada e outra usando armadura.

### Uma limitação do Roll20

As imagens disponíveis são copiadas para o token quando ele é criado.

Se o mestre adicionar novas imagens à tabela original, os tokens já existentes não são atualizados automaticamente.

Além disso, a opção de escolher uma face aleatória **não respeita os pesos definidos na tabela**.

Essa distinção aparece na documentação oficial. [Roll20 Help Center](https://help.roll20.net/hc/en-us/articles/360039178754-Collections?utm_source=chatgpt.com)

### O que eu faria diferente no seu VTT

Criaria um sistema nativo de aparências:

```text
Token
 ├─ Aparência atual
 ├─ Aparências disponíveis
 │   ├─ Normal
 │   ├─ Ferido
 │   ├─ Transformado
 │   └─ Invisível
 ├─ Atributos
 ├─ Estados
 └─ Personagem vinculado
```

Com duas opções de gerenciamento:

**Imagens locais:** alterar as imagens de um token específico.

**Imagens compartilhadas:** alterar a biblioteca de aparências de um personagem e permitir que seus tokens recebam as mudanças.

Isso seria mais intuitivo do que depender de tabelas de rolagem para trocar imagens.

---

## 7. Dados e rolagens

O Roll20 possui um sistema relativamente complexo de rolagens.

Não se limita a lançar um d20 e exibir um número.

### 7.1. Rolagens básicas

- d4.
- d6.
- d8.
- d10.
- d12.
- d20.
- d100.
- Quantidades personalizadas de dados.
- Dados com número personalizado de faces.
- Modificadores positivos e negativos.
- Combinações de dados diferentes.
- Operações matemáticas.
- Rolagens pelo menu visual.
- Rolagens pelo chat.
- Rolagens pelas fichas.
- Rolagens por macros.

Exemplo:

`/roll 2d6+5`

Isso lança dois dados de seis faces e adiciona cinco ao resultado.

### 7.2. Mecânicas avançadas

| Mecânica | Descrição |
|---|---|
| Inline Roll | Insere uma rolagem dentro de uma mensagem |
| Keep Highest | Mantém os maiores resultados |
| Keep Lowest | Mantém os menores resultados |
| Drop Highest | Descarta os maiores |
| Drop Lowest | Descarta os menores |
| Exploding Dice | Resultados específicos provocam novas rolagens |
| Compounding Explosion | Acumula explosões no valor de um mesmo dado |
| Penetrating Explosion | Aplica modificadores às explosões adicionais |
| Reroll | Rola novamente valores que atendam a uma condição |
| Success Counting | Conta quantos dados atingiram um valor-alvo |
| Critical Success | Identifica sucessos críticos |
| Critical Failure | Identifica falhas críticas |
| Dice Sorting | Organiza os resultados |
| Roll Groups | Agrupa conjuntos de rolagens |
| Fate/Fudge Dice | Suporta dados usados em sistemas específicos |
| Roll Queries | Solicita parâmetros ao usuário antes da rolagem |
| Roll Templates | Exibe o resultado em um formato visual estruturado |

Por exemplo, a expressão `4d6kh3` permite rolar quatro dados de seis faces e manter os três maiores.

Esses mecanismos fazem do sistema de dados uma espécie de pequena linguagem de expressões. [Roll20 Help Center](https://help.roll20.net/hc/en-us/articles/360037773133-Dice-Reference?utm_source=chatgpt.com)

### 7.3. Rolagens secretas

O Roll20 oferece diferentes níveis de visibilidade.

| Comando | Jogador que rolou | Mestre | Outros jogadores |
|---|---|---|---|
| `/roll` | Vê o resultado | Vê | Veem |
| `/gmroll` | Vê o resultado | Vê | Não veem |
| `/sr` | Recebe confirmação, mas não o resultado | Vê | Não veem |
| `/ssr` | Não recebe resultado nem confirmação | Vê | Não veem |

Isso permite testes de percepção, furtividade e armadilhas sem revelar informações indevidas.

### 7.4. Dados 3D

Também existem:

- Representações tridimensionais dos dados.
- Animações de lançamento.
- Cores associadas aos participantes.
- Exibição compartilhada dos lançamentos.
- Opção de desativar animações.
- Rolagem automática ou interação manual, conforme as configurações.

**Para seu VTT:** eu separaria totalmente o mecanismo matemático de rolagem da animação dos dados.

Uma rolagem precisa funcionar mesmo quando os dados 3D estiverem desativados.

---

## 8. Macros, ações e comandos

Macros são comandos reutilizáveis que executam ações repetitivas.

No Roll20, elas fazem parte do sistema de comunicação e interagem diretamente com dados, fichas e tokens.

### 8.1. Funcionalidades das macros

- Criar macro.
- Nomear macro.
- Editar conteúdo.
- Excluir macro.
- Compartilhar com determinados jogadores.
- Executar pelo chat.
- Executar por botão.
- Adicionar à barra rápida.
- Alterar a ordem dos botões.
- Personalizar aparência dos botões.
- Acessar macros vinculadas a personagens.
- Criar ações específicas de tokens.
- Executar comandos de múltiplas linhas.
- Referenciar atributos.
- Referenciar tokens selecionados.
- Solicitar seleção de alvo.
- Solicitar parâmetros ao usuário.
- Combinar várias rolagens.
- Produzir mensagens formatadas.
- Atualizar a iniciativa.
- Invocar outras macros ou habilidades, conforme as regras de referência do sistema.

### 8.2. Variáveis e referências

Alguns exemplos:

| Sintaxe | Finalidade |
|---|---|
| `@{selected\|...}` | Consulta informações do token selecionado |
| `@{target\|...}` | Solicita ou identifica um alvo |
| `?{Modificador\|0}` | Abre uma pergunta para receber um valor |
| `#nome-da-macro` | Executa uma macro |
| `%{personagem\|habilidade}` | Executa uma habilidade do personagem |
| `&{tracker}` | Integra uma rolagem à iniciativa |

### 8.3. Barra de macros

O Roll20 tem uma barra inferior onde podem ficar ações frequentemente utilizadas.

Exemplo:

`[ Ataque ] [ Dano ] [ Esquiva ] [ Percepção ] [ Iniciativa ]`

Também existem as **Token Actions**, que ficam disponíveis conforme o personagem ou token selecionado.

Assim, ao selecionar um mago, o usuário encontra as habilidades daquele mago, sem precisar procurar em uma lista global.

### 8.4. Macros e habilidades não são exatamente iguais

A diferença principal é a associação:

- **Macro geral:** pertence ao jogo e pode ser disponibilizada a determinados usuários.
- **Ability/Token Action:** pertence a um personagem e pode ser acessada pelo contexto daquele personagem.

Ambas usam mecanismos semelhantes de execução. [Roll20 Help Center](https://help.roll20.net/hc/en-us/articles/360037256794-Macros-Token-Actions?utm_source=chatgpt.com)

### Para seu VTT

Este é um dos sistemas em que eu teria mais cuidado com a arquitetura.

Não recomendo começar permitindo JavaScript arbitrário escrito pelos usuários.

Uma primeira versão poderia oferecer uma linguagem própria e limitada:

```text
roll 1d20 + @character.agility
message "Teste de agilidade"
target selected
```

Posteriormente, você poderia introduzir condições, cálculos, alterações de atributos e eventos.

Isso seria mais seguro e mais fácil de manter.

---

## 9. Journal — fichas, documentos e anotações

O Journal é a central de informações do Roll20.

Ele possui dois tipos principais de conteúdo:

**Characters:** personagens e criaturas que podem possuir fichas e atributos.

**Handouts:** documentos, descrições, imagens e anotações.

### 9.1. Organização do Journal

- Criar pastas.
- Criar subpastas.
- Adicionar personagens.
- Adicionar documentos.
- Renomear itens.
- Mover itens entre pastas.
- Reordenar.
- Pesquisar por nome.
- Utilizar tags.
- Duplicar entradas.
- Arquivar entradas.
- Restaurar entradas.
- Excluir entradas.
- Ocultar entradas dos jogadores.
- Compartilhar entradas com jogadores específicos.
- Definir quem pode visualizar.
- Definir quem pode editar.

### 9.2. Personagens e fichas

Uma entrada de personagem pode conter:

- Nome.
- Retrato.
- Biografia.
- Anotações públicas.
- Anotações privadas do mestre.
- Ficha de personagem.
- Atributos.
- Valores atuais e máximos.
- Habilidades.
- Macros próprias.
- Botões de rolagem.
- Token padrão.
- Permissões de controle.
- Permissões de visualização.
- Permissões de edição.

A ficha pode calcular automaticamente modificadores, realizar rolagens e utilizar os valores armazenados nos atributos.

### 9.3. Handouts

São documentos que podem representar praticamente qualquer informação.

Exemplos:

- Carta encontrada em uma masmorra.
- Diário de um personagem.
- Descrição de uma cidade.
- Missão.
- Regra personalizada.
- Imagem.
- Mapa antigo.
- Lista de informações.
- Anotação compartilhada.

Recursos:

- Editor de texto formatado.
- Inclusão de imagens.
- Links.
- Tabelas.
- Notas visíveis aos jogadores.
- Notas particulares do mestre.
- Permissões individuais.
- Compartilhamento em tempo real.
- Abertura em janelas flutuantes.
- Abertura em janelas externas.
- Exibição forçada pelo mestre.

### 9.4. Mostrar aos jogadores

Existe uma funcionalidade particularmente útil:

**Show to Players**.

O mestre pode abrir um documento na interface dos jogadores sem que eles precisem procurar por ele.

Isso é excelente para apresentar cartas, ilustrações, símbolos e documentos narrativos.

### 9.5. Links entre documentos

O Journal permite criar referências entre documentos e personagens.

Um documento pode conter um link para outro, respeitando as permissões do usuário.

Também existem links que funcionam como botões para executar comandos.

Por exemplo, um documento de magia pode conter um botão para realizar sua rolagem.

Isso transforma o Journal em algo próximo de uma wiki interativa. [Roll20 Help Center](https://help.roll20.net/hc/en-us/articles/360039675133-Journal?utm_source=chatgpt.com)

### Minha recomendação

**Não trate Journal e ficha como duas coisas completamente separadas.**

Ambos podem utilizar uma estrutura comum de documentos e entidades.

Mas as fichas precisam de propriedades adicionais:

- Atributos estruturados.
- Relações com tokens.
- Ações.
- Regras.
- Cálculos.

Já os documentos narrativos precisam priorizar a edição e a apresentação de conteúdo.

---

## 10. Art Library — biblioteca de imagens

A biblioteca visual é responsável por armazenar e encontrar os recursos utilizados no mapa.

Funcionalidades:

- Enviar imagens.
- Visualizar imagens enviadas.
- Pesquisar imagens por nome.
- Pesquisar por tags.
- Organizar em pastas.
- Arrastar imagens para o mapa.
- Utilizar imagens em tokens.
- Utilizar imagens em fichas.
- Utilizar imagens em documentos.
- Utilizar imagens como elementos decorativos.
- Filtrar por categorias, como tokens, mapas e retratos.
- Utilizar busca com operadores para combinar ou excluir termos.

O Roll20 também disponibiliza fontes de imagens externas e imagens previamente integradas à sua biblioteca, mas isso está fora do foco comercial deste levantamento. [Roll20 Help Center](https://help.roll20.net/hc/en-us/articles/360039675113-Art-Library?utm_source=chatgpt.com)

**Para seu VTT:** a biblioteca de assets deve ser independente das páginas.

Uma imagem enviada uma única vez deve poder ser reutilizada em múltiplos mapas, tokens e documentos.

---

## 11. Compendium — regras e conteúdo estruturado

O Compendium funciona como uma biblioteca consultável de regras e informações sobre sistemas de RPG.

Ele é diferente do Journal:

- **Journal:** conteúdo organizado dentro da partida.
- **Compendium:** informações estruturadas de um sistema de regras.

### Funcionalidades

- Pesquisar regras.
- Navegar por categorias.
- Consultar monstros.
- Consultar magias.
- Consultar itens.
- Consultar equipamentos.
- Filtrar resultados por atributos.
- Ordenar resultados.
- Visualizar informações resumidas.
- Abrir detalhes.
- Arrastar informações para fichas.
- Preencher campos de ficha automaticamente, quando há integração.
- Arrastar criaturas para criar entradas de personagem.
- Criar documentos a partir de entradas consultadas.

A integração depende do sistema de RPG e de como sua ficha foi desenvolvida. [Roll20 Help Center](https://help.roll20.net/hc/en-us/articles/360039178694-Compendium?utm_source=chatgpt.com)

### Para seu VTT

Se o VTT for destinado especificamente ao seu sistema Odisseia, um Compendium próprio pode ter muito valor.

Ele poderia reunir armas, habilidades, condições, criaturas e regras.

Entretanto, **não é necessário desenvolver o Compendium antes do Journal**.

---

## 12. Chat de texto

O chat do Roll20 é mais que um sistema de mensagens.

Ele funciona como interface para dados, macros, ações de personagens e automações.

### 12.1. Funcionalidades de comunicação

- Enviar mensagens.
- Falar como jogador.
- Falar como personagem.
- Exibir retratos dos participantes.
- Mostrar horários das mensagens.
- Enviar mensagens privadas.
- Enviar mensagens ao mestre.
- Escrever ações narrativas.
- Enviar descrições.
- Executar comandos.
- Realizar rolagens.
- Mostrar resultados detalhados.
- Utilizar rolagens dentro de mensagens.
- Exibir resultados em modelos visuais.
- Executar comandos de múltiplas linhas.
- Ocultar mensagens do chat, com controle do mestre.
- Consultar o histórico disponível.

### 12.2. Comandos relevantes

| Comando | Uso |
|---|---|
| `/roll` | Rolar dados |
| `/gmroll` | Rolar para o jogador e o mestre |
| `/sr` | Rolar secretamente para o mestre |
| `/ssr` | Rolar sem revelar sequer a ocorrência |
| `/w` | Enviar mensagem privada |
| `/w gm` | Enviar mensagem ao mestre |
| `/me` | Descrever uma ação |
| `/em` | Enviar uma ação narrativa formatada |
| `/desc` | Exibir uma descrição |
| `/as` | Falar como determinado personagem |
| `/ooc` | Falar fora do personagem |
| `/talktomyself` | Manter mensagens locais, sem compartilhá-las |
| `/raisehand` | Sinalizar que o participante quer chamar atenção |

É possível combinar mensagens e comandos em uma mesma operação. [Roll20 Help Center](https://help.roll20.net/hc/en-us/articles/360039675093-Text-Chat?utm_source=chatgpt.com)

### 12.3. Chamadas de atenção

O comando de levantar a mão mostra um aviso temporário aos participantes.

Não é essencial para um MVP, mas demonstra que o chat pode ser utilizado também para pequenas interações da interface.

### Para seu VTT

Recomendo criar um **sistema de eventos de chat**, não simplesmente uma tabela contendo texto.

Uma mensagem pode representar:

```text
ChatEvent
 ├─ type: message | roll | system | command | whisper
 ├─ senderId
 ├─ characterId?
 ├─ visibility
 ├─ content
 ├─ payload
 └─ timestamp
```

Dessa forma, você consegue adicionar novos tipos de mensagens sem precisar refazer todo o chat.

---

## 13. Música e efeitos sonoros — Jukebox

O Roll20 possui um sistema integrado para reprodução musical durante as sessões.

### 13.1. Biblioteca de áudio

- Importar arquivos.
- Armazenar músicas.
- Armazenar efeitos sonoros.
- Pesquisar faixas.
- Adicionar tags.
- Pré-escutar faixas.
- Renomear arquivos.
- Excluir arquivos.
- Criar playlists.
- Organizar faixas.
- Utilizar fontes de áudio integradas.

O recurso aceita arquivos como MP3, OGG e FLAC.

### 13.2. Reprodução

| Funcionalidade | O que faz |
|---|---|
| Play | Inicia uma música |
| Pause/Stop | Interrompe a reprodução |
| Loop | Repete a faixa |
| Volume individual | Controla o volume de cada áudio |
| Volume principal | Controla o volume geral |
| Playlist sequencial | Reproduz faixas em ordem |
| Playlist aleatória | Reproduz em ordem aleatória |
| Reprodução simultânea | Permite tocar múltiplos áudios juntos |
| Sincronização | Faz a reprodução acontecer na sessão dos participantes |
| Música vinculada à página | Inicia uma trilha quando o grupo principal é movido para determinada cena |

O último recurso tem uma particularidade: a música vinculada à página é disparada pela movimentação do grupo principal, não necessariamente quando jogadores individuais são enviados a páginas diferentes. [Roll20 Help Center](https://help.roll20.net/hc/en-us/articles/360039178714-Jukebox?utm_source=chatgpt.com)

### Exemplo prático

O mestre utiliza:

- Uma música ambiente de floresta.
- Um áudio contínuo de chuva.
- Um efeito sonoro de trovão.

Os três podem fazer parte da experiência sonora da mesma cena.

### Para seu VTT

Eu separaria o áudio em três categorias:

**Música:** trilhas de fundo.

**Ambiente:** chuva, vento, máquinas, multidões.

**Efeitos:** explosões, tiros, passos e eventos pontuais.

O Roll20 permite alcançar esse resultado combinando áudios, mas uma interface separada por categorias facilitaria bastante a utilização.

---

## 14. Turn Tracker — iniciativa e turnos

O Turn Tracker administra a ordem das ações durante combates ou outras situações por turnos.

### Funcionalidades

- Abrir o painel de iniciativa.
- Adicionar token à iniciativa.
- Adicionar o mesmo token mais de uma vez.
- Remover um participante.
- Definir valores manualmente.
- Atualizar valores.
- Arrastar resultados de dados para o painel.
- Associar rolagens diretamente à iniciativa.
- Reordenar participantes manualmente.
- Ordenar por valor.
- Ordenar alfabeticamente.
- Utilizar ordenação por naipes.
- Inserir novas rolagens na posição correta.
- Avançar para o próximo turno.
- Retornar ao turno anterior.
- Criar entradas personalizadas.
- Usar entradas para representar efeitos ou contadores.
- Ocultar participantes que pertencem à camada do mestre.
- Exibir a ordem aos jogadores.
- Limpar a iniciativa.

O Roll20 mantém esse sistema relativamente flexível, sem impor automaticamente um conjunto único de regras de combate. [Roll20 Help Center](https://help.roll20.net/hc/en-us/articles/360039178634-Turn-Tracker?utm_source=chatgpt.com)

### Para seu VTT

Eu implementaria inicialmente uma iniciativa independente de sistema:

```text
TurnTracker
 ├─ sceneId
 ├─ entries[]
 │   ├─ tokenId?
 │   ├─ label
 │   ├─ initiative
 │   ├─ visibility
 │   └─ metadata
 ├─ currentTurn
 └─ round
```

Depois, você pode criar recursos de combate específicos do Odisseia sem comprometer o funcionamento básico.

---

## 15. Collections — tabelas e baralhos

Além das macros, a aba Collections possui dois sistemas bastante úteis.

### 15.1. Rollable Tables

São tabelas de resultados aleatórios.

Exemplo:

| Resultado | Peso |
|---|---:|
| Poção comum | 50 |
| Espada | 30 |
| Item raro | 15 |
| Artefato lendário | 5 |

Funcionalidades:

- Criar tabela.
- Nomear tabela.
- Adicionar resultados.
- Editar resultados.
- Excluir resultados.
- Associar imagens.
- Definir pesos.
- Utilizar percentuais.
- Permitir ou impedir rolagens pelos jogadores.
- Executar a tabela manualmente.
- Executar pelo chat.
- Executar por macro.
- Transformar uma tabela com imagens em um token multiface.

Aplicações:

- Loot.
- Encontros aleatórios.
- Eventos.
- Falhas críticas.
- Condições.
- Sorteios.
- Mudanças de aparência.

### 15.2. Baralhos de cartas

O sistema de cartas é mais completo do que parece.

Ele permite:

- Criar baralhos personalizados.
- Adicionar cartas.
- Definir imagem da frente.
- Definir imagem do verso.
- Utilizar versos diferentes.
- Importar várias imagens.
- Embaralhar.
- Comprar cartas.
- Distribuir cartas aos participantes.
- Manter cartas nas mãos dos jogadores.
- Colocar cartas no mapa.
- Virar cartas.
- Descartar cartas.
- Recuperar cartas descartadas.
- Recolher cartas para o baralho.
- Trocar cartas entre jogadores.
- Configurar regras de compra e descarte.
- Configurar visibilidade.
- Trabalhar com baralhos infinitos.

Também existe um baralho de segurança da sessão, com cartões de comunicação para indicar conforto ou desconforto com determinados conteúdos narrativos. [Roll20 Help Center](https://help.roll20.net/hc/en-us/articles/360039178754-Collections?utm_source=chatgpt.com)

**Minha avaliação:** tabelas aleatórias são mais úteis para um VTT genérico do que um sistema completo de cartas. Eu implementaria as tabelas primeiro.

---

## 16. Neblina de guerra — Fog of War

Aqui precisamos separar dois sistemas diferentes.

### 16.1. Hide/Reveal Mask — visibilidade manual

É o sistema mais simples.

O mestre controla quais regiões do mapa estão visíveis aos jogadores.

Funcionalidades:

- Ocultar o mapa.
- Revelar uma região.
- Ocultar novamente uma região.
- Revelar usando retângulos.
- Revelar utilizando formas poligonais.
- Controlar a opacidade de visualização para o mestre.
- Manter áreas escondidas independentemente dos tokens.
- Combinar a máscara com outros recursos de visibilidade.

**Exemplo:** o mestre revela uma sala quando os personagens abrem a porta.

A ferramenta é disponibilizada gratuitamente pelo Roll20. [Roll20 Help Center](https://help.roll20.net/hc/en-us/articles/360051768534-Hide-Reveal-Mask-Free?utm_source=chatgpt.com)

### 16.2. Dynamic Lighting — iluminação e visão dinâmica

Esse é um sistema mais avançado.

Ele calcula quais partes do mapa os jogadores podem enxergar considerando:

- Posição dos tokens.
- Paredes.
- Obstáculos.
- Fontes de luz.
- Alcance de visão.
- Direção da visão.
- Regiões escuras.
- Portas e janelas.

**A diferença fundamental:** a máscara manual é administrada pelo mestre; a iluminação dinâmica reage à posição e às características dos tokens.

---

## 17. Iluminação dinâmica — levantamento detalhado

É uma das funcionalidades tecnicamente mais complexas do Roll20.

Vou dividir em elementos individuais.

### 17.1. Configurações da página

| Funcionalidade | Descrição |
|---|---|
| Ativar iluminação dinâmica | Habilita o sistema na cena |
| Daylight Mode | Ilumina o mapa inteiro |
| Intensidade da luz ambiente | Ajusta o brilho geral |
| Explorer Mode | Mantém registro das regiões já exploradas |
| Resetar exploração | Limpa o histórico de regiões exploradas |
| Editar regiões exploradas | Permite ajustes manuais |
| Restringir movimento | Impede atravessar barreiras configuradas |
| Atualizar durante movimento | Recalcula a iluminação enquanto o token se move |
| Atualizar ao soltar | Recalcula quando o movimento termina |
| Opacidade da escuridão para o mestre | Facilita enxergar o mapa enquanto prepara a sessão |
| Aparência da escuridão | Permite diferentes efeitos visuais de áreas escuras |
| Diagnóstico | Apresenta informações sobre fontes de luz e tokens com visão |

O *Explorer Mode* permite mostrar regiões previamente visitadas em uma aparência diferente das regiões atualmente visíveis. [Roll20 Help Center](https://help.roll20.net/hc/en-us/articles/360052521913-Page-Settings-For-Dynamic-Lighting?utm_source=chatgpt.com)

### 17.2. Configurações de visão de cada token

- Ativar visão.
- Desativar visão.
- Definir alcance de visão noturna.
- Ajustar tonalidade da visão noturna.
- Configurar efeitos de escurecimento.
- Utilizar modos alternativos de visão noturna.
- Limitar o campo de visão.
- Definir o ângulo do campo de visão.
- Associar o campo de visão à orientação do token.
- Visualizar áreas iluminadas por outras fontes.
- Atualizar a visão conforme o token se movimenta.

Um personagem pode enxergar somente à sua frente, enquanto outro pode possuir uma visão mais ampla.

### 17.3. Emissão de luz pelos tokens

Um token também pode iluminar o ambiente.

Configurações:

- Emitir luz.
- Não emitir luz.
- Alcance de luz forte.
- Alcance de luz fraca.
- Cor da iluminação.
- Direção da iluminação.
- Ângulo do cone de luz.
- Transição entre níveis de luminosidade.

**Exemplo:** um personagem segurando uma lanterna ilumina apenas um cone à sua frente.

### 17.4. Fontes de luz independentes

Também é possível posicionar luzes sem associá-las a personagens.

Exemplos:

- Tochas.
- Fogueiras.
- Lâmpadas.
- Cristais.
- Iluminação de máquinas.
- Luzes de emergência.

O Roll20 possui uma ferramenta específica para adicionar rapidamente uma fonte de luz ao mapa. [Roll20 Help Center](https://help.roll20.net/hc/en-us/articles/360051754954-Token-Settings-for-Dynamic-Lighting?utm_source=chatgpt.com)

### 17.5. Paredes e barreiras

| Tipo | Impede visão? | Impede movimento? |
|---|---|---|
| Parede convencional | Sim | Pode impedir, conforme configuração |
| Barreira transparente | Não | Sim, quando a restrição está habilitada |
| Barreira de visão unilateral | Impede a visão em uma direção | Depende da configuração de movimento |
| Porta | Depende do estado | Depende do estado |
| Janela | Depende do estado e de cortinas | Depende do estado |

A iluminação dinâmica possui uma camada dedicada onde o mestre desenha paredes e barreiras.

### 17.6. Portas e janelas

Os recursos incluem:

- Posicionar portas.
- Posicionar janelas.
- Abrir portas.
- Fechar portas.
- Trancar portas.
- Definir portas secretas.
- Alterar estados.
- Controlar passagem de luz.
- Controlar bloqueio de movimento.
- Configurar cortinas em janelas.
- Editar elementos depois de posicioná-los.

Uma janela com cortinas, por exemplo, pode permitir um comportamento diferente de uma janela totalmente aberta. [Roll20 Help Center](https://help.roll20.net/hc/en-us/articles/360051768974-Creating-Light-Windows-and-Barriers?utm_source=chatgpt.com)

### 17.7. Visão individual por jogador

Esse é um aspecto fundamental.

**Dois jogadores posicionados em locais diferentes podem enxergar regiões diferentes do mesmo mapa.**

O mestre pode enxergar ambos os personagens, mas cada participante deve receber somente as informações que lhe são permitidas.

Isso significa que o sistema não pode depender de uma única máscara de visibilidade aplicada igualmente para todos.

### Minha recomendação técnica

Dividir o mecanismo em quatro partes:

```text
LightingSystem
 ├─ LightSources
 ├─ VisionSources
 ├─ OcclusionGeometry
 └─ VisibilityState
```

**LightSources:** fontes de luz.

**VisionSources:** tokens com capacidade de enxergar.

**OcclusionGeometry:** paredes, portas e barreiras.

**VisibilityState:** resultado do cálculo para cada participante.

Eu não começaria desenvolvendo esse sistema antes de ter movimentação de tokens, grid e sincronização multiplayer funcionando corretamente.

---

## 18. Foreground — elementos acima dos tokens

O Roll20 possui uma camada de primeiro plano.

Ela permite colocar objetos acima dos personagens.

Exemplos:

- Copas de árvores.
- Telhados.
- Pontes.
- Estruturas elevadas.
- Elementos decorativos suspensos.

### Funcionalidades

- Posicionar imagens sobre os tokens.
- Ajustar sua ordem de renderização.
- Controlar transparência.
- Ocultar temporariamente elementos do primeiro plano.
- Fazer objetos perderem opacidade quando determinados tokens entram em contato com eles.
- Configurar comportamentos de interação.

**Exemplo:** o jogador entra em uma casa e o telhado fica transparente, permitindo enxergar o interior.

É um recurso disponível para assinantes Plus ou superiores. [Roll20 Help Center](https://help.roll20.net/hc/en-us/articles/30738192036887-Foreground-Layer?utm_source=chatgpt.com)

---

## 19. Reactions — interações automáticas com objetos

Este é um dos recursos mais interessantes para estudar.

O Roll20 permite configurar reações disparadas quando objetos se sobrepõem.

### 19.1. Conditional Fade

Um objeto altera sua transparência quando um token interage com sua área.

Exemplos:

- Telhado desaparece.
- Vegetação fica translúcida.
- Objeto revela algo escondido.
- Elemento visual surge após a aproximação de um personagem.

### 19.2. Send to Chat

Um objeto pode enviar mensagens ou executar comandos quando ocorre a interação.

Exemplos:

- Um personagem pisa em uma armadilha.
- Uma mensagem de descrição aparece.
- O sistema realiza uma rolagem.
- Uma macro é executada.
- Um efeito visual é disparado.
- Um evento personalizado é ativado por uma extensão.

### 19.3. Controle das reações

As configurações incluem:

- Ativar reação.
- Desativar reação.
- Definir o comportamento.
- Configurar opacidade.
- Definir mensagem ou comando.
- Disparar quando ocorre sobreposição.
- Executar apenas uma vez.
- Rearmar manualmente.
- Rearmar automaticamente.

As reações podem ser configuradas em objetos de diferentes camadas, não apenas no Foreground. [Roll20 Help Center](https://help.roll20.net/hc/en-us/articles/32901366352919-Reactions?utm_source=chatgpt.com)

### Para seu VTT

Eu desenvolveria isso como um sistema genérico de gatilhos:

```text
Trigger
 ├─ Event: OnTokenEnter
 ├─ Target: Area
 ├─ Conditions
 ├─ Actions
 │   ├─ ShowMessage
 │   ├─ RollDice
 │   ├─ ChangeImage
 │   ├─ ChangeVisibility
 │   └─ PlaySound
 └─ ResetMode
```

Isso abriria possibilidades interessantes para armadilhas, portas automáticas, sistemas de segurança e eventos narrativos.

---

## 20. Map Pins — pontos de interesse

O Roll20 permite adicionar marcadores interativos diretamente ao mapa.

Esse recurso foi expandido e está disponível também para usuários gratuitos no mecanismo atual do VTT.

### Funcionalidades

- Criar marcador.
- Posicionar no mapa.
- Nomear.
- Alterar tamanho.
- Alterar cor.
- Ocultar dos jogadores.
- Revelar aos jogadores.
- Exibir tooltip.
- Adicionar imagens ao tooltip.
- Adicionar descrição.
- Adicionar notas privadas do mestre.
- Associar marcador a um documento.
- Associar marcador a uma seção de um documento.
- Abrir o documento pelo marcador.
- Navegar do documento até o marcador.
- Alterar aparência.
- Personalizar símbolos e imagens em modalidades superiores.

**Exemplo:** um mapa da cidade possui marcadores de tavernas, lojas, NPCs e missões.

Ao clicar em um marcador, o jogador consegue consultar as informações que o mestre liberou. [Roll20 Help Center](https://help.roll20.net/hc/en-us/articles/36271267343639-Map-Pins?utm_source=chatgpt.com)

**Minha avaliação:** é uma funcionalidade relativamente acessível para desenvolver e com excelente utilidade para exploração de mapas.

---

## 21. Efeitos visuais — FX

O Roll20 possui uma ferramenta para adicionar efeitos visuais às cenas.

Exemplos:

- Explosões.
- Rajadas.
- Projéteis.
- Fogo.
- Gelo.
- Fumaça.
- Energia.
- Sangue.
- Efeitos mágicos.
- Feixes de luz.

### Funcionalidades

- Selecionar efeito.
- Selecionar variação visual.
- Definir origem.
- Definir destino.
- Disparar no mapa.
- Executar efeitos por comandos, conforme acesso.
- Criar efeitos personalizados com configurações mais avançadas.

A biblioteca de efeitos predefinidos pode ser utilizada gratuitamente; recursos de personalização e determinadas formas de execução por comandos possuem restrições de assinatura. [Roll20 Help Center](https://help.roll20.net/hc/en-us/articles/360037258714-Effects-FX-Tool?utm_source=chatgpt.com)

---

## 22. Comunicação por voz e vídeo

Dentro do VTT, o Roll20 também oferece comunicação integrada.

### Funcionalidades

- Microfone.
- Câmera.
- Selecionar dispositivo de entrada.
- Selecionar dispositivo de saída.
- Ativar ou desativar microfone.
- Ativar ou desativar vídeo.
- Exibir participantes.
- Controlar preferências de recebimento e transmissão.
- Utilizar avatares quando apropriado.

A comunicação é separada dos recursos do mapa e utiliza tecnologias de comunicação em tempo real. [Roll20 Help Center](https://help.roll20.net/hc/en-us/articles/360041544734-Integrated-Voice-and-Video?utm_source=chatgpt.com)

**Minha avaliação:** não priorizaria voz e vídeo nativos.

Seu VTT pode funcionar muito bem com o grupo conversando pelo Discord. Desenvolver comunicação audiovisual adicionaria uma complexidade considerável sem necessariamente melhorar o diferencial principal do projeto.

---

## 23. Configurações individuais dos participantes

O VTT possui opções que afetam a experiência de cada usuário.

### Configurações relevantes

- Nome de exibição.
- Cor associada ao participante.
- Aparência da interface.
- Preferências de exibição de tokens.
- Cor das barras.
- Posição dos marcadores.
- Exibir ou ocultar elementos visuais.
- Exibir barras somente ao passar o cursor.
- Ativar animações.
- Ativar dados 3D.
- Controlar volume principal.
- Selecionar dispositivos de comunicação.
- Ativar ou desativar avatares no chat.
- Exibir horários das mensagens.
- Ativar sons de notificação.
- Configurar atalhos.
- Configurar abertura de fichas em janelas externas.
- Ajustar determinadas opções de desempenho gráfico.
- Ajustar preferências de navegação.

Essas preferências não precisam necessariamente modificar a sessão para os outros participantes. [Roll20 Help Center](https://help.roll20.net/hc/articles/360039675153?utm_source=chatgpt.com)

---

## 24. Player View — visualizar como um jogador

O Roll20 possui um recurso específico para o mestre conferir o que determinado jogador está enxergando.

Isso é mais completo do que simplesmente esconder a camada do mestre.

### Funcionalidades

- Escolher um jogador.
- Abrir a visualização correspondente.
- Conferir tokens controláveis.
- Conferir o mapa exibido.
- Conferir iluminação e visibilidade.
- Conferir documentos acessíveis.
- Conferir informações do chat às quais há acesso.
- Testar movimentações e interações.
- Testar ações e macros.
- Verificar permissões antes da sessão.

**Exemplo:** o mestre configura uma masmorra e verifica se um jogador consegue enxergar apenas o interior de uma sala, sem visualizar o inimigo escondido no corredor.

Essa visualização específica foi introduzida em 2026 e ajuda a evitar erros de permissão. [Roll20 Help Center](https://help.roll20.net/hc/en-us/articles/41973886368151-Player-View?utm_source=chatgpt.com)

**Para seu VTT:** eu consideraria essa ferramenta bastante valiosa, mas apenas depois de implementar corretamente as permissões.

---

## 25. Atalhos de teclado e produtividade

O Roll20 possui atalhos para acelerar as ações mais frequentes.

Exemplos:

| Ação | Atalho |
|---|---|
| Selecionar | `Ctrl + S` |
| Desenhar | `Ctrl + F` |
| Adicionar à iniciativa | `Ctrl + U` |
| Copiar | `Ctrl + C` |
| Colar | `Ctrl + V` |
| Desfazer | `Ctrl + Z` |
| Selecionar todos da camada | `Ctrl + A` |
| Mover token pelas células | Setas do teclado |
| Movimentar sem snap | `Alt` durante o movimento |
| Abrir imagem ampliada | `Z` |
| Mostrar imagem aos jogadores | `Shift + Z`, como mestre |
| Pré-visualizar visão de um token | `Ctrl + L` |
| Centralizar participantes em um ponto | Ping com `Shift`, como mestre |

Existe também um conjunto de atalhos avançados que pode ser ativado nas configurações. [Roll20 Help Center](https://help.roll20.net/hc/en-us/articles/360039675393-Hotkeys?utm_source=chatgpt.com)

---

## 26. Mods e extensões

O Roll20 oferece um mecanismo de scripts para modificar ou expandir comportamentos do VTT.

Esses scripts podem interagir com dados e eventos da sessão.

Aplicações possíveis incluem:

- Automação de ações.
- Manipulação de tokens.
- Alteração de estados.
- Integração com comandos.
- Regras personalizadas.
- Interação com fichas.
- Alteração de propriedades do mapa.
- Execução de comportamentos condicionais.

O acesso a esse mecanismo é associado às modalidades superiores da plataforma. [Roll20 Help Center](https://help.roll20.net/hc/en-us/articles/360037256714-Introduction-to-Mod-Scripts?utm_source=chatgpt.com)

**Para seu projeto:** um sistema de plugins deve ser considerado uma funcionalidade avançada.

Entretanto, vale desenvolver os módulos internos de maneira que futuramente seja possível expor uma API de eventos e comandos.

---

# PARTE 2 — ANÁLISE PARA DESENVOLVER SEU VTT

Agora que identificamos as funcionalidades, precisamos entender **quais sistemas estão por trás delas**.

Um erro comum seria tentar reproduzir cada botão do Roll20 isoladamente.

Na realidade, várias funcionalidades dependem de um mesmo conjunto de estruturas.

## 27. Os módulos fundamentais

Eu dividiria seu VTT em aproximadamente 15 módulos.

| ID | Módulo | Responsabilidades |
|---|---|---|
| VTT-01 | **Canvas Engine** | Renderização, câmera, zoom, pan e coordenadas |
| VTT-02 | **Scene Manager** | Mapas, páginas, configurações e navegação |
| VTT-03 | **Layer Manager** | Camadas, organização e profundidade |
| VTT-04 | **Object Manager** | Imagens, tokens, transformações e seleção |
| VTT-05 | **Token System** | Atributos, aparências, barras e estados |
| VTT-06 | **Permission System** | Controle e visibilidade por usuário |
| VTT-07 | **Multiplayer Sync** | Sincronização em tempo real |
| VTT-08 | **Dice Engine** | Rolagens e interpretação de expressões |
| VTT-09 | **Chat System** | Mensagens, comandos e histórico |
| VTT-10 | **Character & Journal** | Personagens, fichas e documentos |
| VTT-11 | **Macro Engine** | Ações reutilizáveis e automações |
| VTT-12 | **Combat Manager** | Iniciativa e turnos |
| VTT-13 | **Audio Manager** | Trilhas, efeitos e playlists |
| VTT-14 | **Visibility Engine** | Neblina, visão e iluminação |
| VTT-15 | **Asset Manager** | Imagens, arquivos e recursos reutilizáveis |

Posteriormente, acrescentaria módulos de efeitos, gatilhos, Compendium, cartas e extensões.

### Por que separar assim?

Porque os módulos precisam conseguir trabalhar juntos.

Por exemplo:

**O Token System precisa conversar com:**

- Canvas Engine, para posicionamento.
- Scene Manager, para saber em qual mapa o token existe.
- Permission System, para controlar quem pode movê-lo.
- Character & Journal, para acessar atributos.
- Dice Engine, para realizar rolagens.
- Combat Manager, para participar da iniciativa.
- Visibility Engine, para definir sua visão.

Não é recomendável colocar tudo isso dentro de um componente React chamado `Token`.

---

## 28. Modelo inicial de dados

Eu pensaria nas entidades principais da seguinte maneira:

```text
VTTSession
 ├─ Players
 ├─ Scenes
 │   ├─ SceneSettings
 │   ├─ Layers
 │   ├─ SceneObjects
 │   │   ├─ Tokens
 │   │   ├─ Drawings
 │   │   ├─ Texts
 │   │   ├─ MapPins
 │   │   └─ OtherObjects
 │   ├─ Visibility
 │   └─ Lighting
 │
 ├─ Characters
 │   ├─ Attributes
 │   ├─ Abilities
 │   ├─ CharacterSheet
 │   └─ DefaultToken
 │
 ├─ Journal
 │   ├─ Handouts
 │   └─ Folders
 │
 ├─ Assets
 ├─ Macros
 ├─ RollableTables
 ├─ CardDecks
 ├─ Audio
 ├─ Chat
 └─ Permissions
```

Esse é um modelo conceitual, não um esquema definitivo de banco de dados.

Uma decisão importante é que **um personagem pode existir sem um token no mapa** e **um token pode existir sem representar um personagem**.

Essa separação evita um acoplamento que dificultaria muito o projeto.

---

## 29. O desafio de sincronizar o VTT

Imagine quatro jogadores e um mestre conectados.

Um jogador move seu token.

O sistema precisa:

1. Receber a tentativa de movimentação.
2. Verificar se aquele jogador tem permissão para mover o token.
3. Validar as regras aplicáveis, como bloqueio de movimento.
4. Atualizar a posição.
5. Registrar o novo estado.
6. Enviar a atualização aos participantes autorizados.
7. Atualizar a visão de quem foi afetado.

Agora imagine que o mestre move um inimigo oculto.

**O sistema não deve simplesmente enviar todos os dados do inimigo para todos e esconder sua imagem com CSS.**

O servidor precisa controlar quem pode receber as informações.

Isso é importante principalmente para:

- Inimigos ocultos.
- Documentos secretos.
- Rolagens privadas.
- Informações de personagens.
- Áreas não exploradas.
- Armadilhas.
- Permissões de controle.

### Eventos que eu criaria

```text
scene:change
scene:update

token:create
token:move
token:update
token:delete
token:changeAppearance

character:update
journal:share

dice:roll
chat:message

initiative:update
turn:advance

audio:play
audio:stop

visibility:update
```

Esses nomes são apenas sugestões de organização.

Não é necessário utilizar exatamente esse formato.

---

## 30. Como lidar com movimentação e grid

A grid parece simples visualmente, mas envolve várias decisões técnicas.

Seu sistema precisa diferenciar:

**Coordenadas do mundo:** posição real de um objeto no mapa.

**Coordenadas da tela:** onde ele aparece considerando zoom e deslocamento da câmera.

**Coordenadas da grid:** célula ocupada pelo objeto.

Por exemplo:

Um token está na célula `(10, 8)`.

O jogador aplica zoom de 150%.

O token precisa continuar na mesma posição do mundo, embora apareça em outra posição na tela.

### Funcionalidades que precisam funcionar juntas

- Zoom.
- Pan.
- Seleção.
- Multisseleção.
- Drag and drop.
- Snap.
- Rotação.
- Redimensionamento.
- Medição.
- Diferentes tamanhos de tokens.
- Diferentes tipos de grid.
- Sincronização multiplayer.

**Minha recomendação:** defina o sistema de coordenadas e transformações antes de começar a implementar dezenas de ferramentas.

Caso contrário, você provavelmente terá que refazer partes da movimentação quando introduzir iluminação, medição ou mapas maiores.

---

# PARTE 3 — PLANEJAMENTO DE IMPLEMENTAÇÃO

## 31. Classificação por prioridade

Aqui vai uma classificação pensando especificamente em **desenvolver um VTT funcional**, e não em copiar todas as funcionalidades de uma vez.

### Prioridade 1 — MVP

São os recursos que eu consideraria necessários para a primeira versão realmente jogável.

| Funcionalidade | Prioridade |
|---|---|
| Canvas com zoom e pan | Essencial |
| Criar e alternar mapas | Essencial |
| Importar imagem de mapa | Essencial |
| Grid quadrada configurável | Essencial |
| Selecionar tokens | Essencial |
| Mover tokens | Essencial |
| Snap to Grid | Essencial |
| Rotacionar e redimensionar | Essencial |
| Criar, copiar e excluir tokens | Essencial |
| Camada de mapa | Essencial |
| Camada de tokens | Essencial |
| Camada privada do mestre | Essencial |
| Permissões básicas de tokens | Essencial |
| Sincronização multiplayer | Essencial |
| Persistência do estado da sessão | Essencial |
| Rolagem de dados básica | Essencial |
| Chat com resultados de rolagens | Essencial |
| Iniciativa simples | Essencial |
| Journal básico | Essencial |
| Sistema de máscaras de visibilidade manuais | Essencial |
| Biblioteca simples de imagens | Essencial |

**Resultado esperado:** um mestre consegue preparar um mapa, posicionar personagens e inimigos, controlar o que os jogadores veem, realizar rolagens e conduzir um combate.

Isso já seria um VTT utilizável.

### Prioridade 2 — VTT completo para partidas convencionais

Depois do MVP, eu acrescentaria:

| Funcionalidade | Prioridade |
|---|---|
| Tokens com múltiplas imagens | Alta |
| Barras de atributos | Alta |
| Marcadores de estado | Alta |
| Fichas vinculadas a tokens | Alta |
| Fichas personalizáveis | Alta |
| Macros | Alta |
| Ações de tokens | Alta |
| Música e efeitos sonoros | Alta |
| Pastas de mapas | Alta |
| Pastas e permissões do Journal | Alta |
| Pings e foco de câmera | Alta |
| Ferramenta de medição | Alta |
| Desenhos e textos no mapa | Média |
| Auras | Média |
| Atalhos de teclado | Média |
| Janelas flutuantes | Média |
| Tabelas de rolagem | Média |
| Marcadores de pontos de interesse | Média |
| Compartilhamento de imagens e documentos | Alta |

**Resultado esperado:** o VTT já atenderia a uma parcela muito grande das necessidades de mesas convencionais de RPG.

### Prioridade 3 — recursos avançados

| Funcionalidade | Prioridade |
|---|---|
| Iluminação dinâmica | Alta complexidade |
| Visão individual | Alta complexidade |
| Paredes e colisões | Alta complexidade |
| Portas e janelas interativas | Alta complexidade |
| Explorer Mode | Alta complexidade |
| Foreground interativo | Média/alta complexidade |
| Efeitos visuais | Média complexidade |
| Gatilhos e reações | Alta complexidade |
| Importação UVTT | Média/alta complexidade |
| Baralhos personalizados | Média complexidade |
| Compendium estruturado | Alta complexidade |
| Editor de macros avançado | Alta complexidade |
| API de extensões | Muito alta complexidade |
| Comunicação nativa de voz e vídeo | Muito alta complexidade |

Aqui, a ordem dependerá do diferencial que você deseja oferecer.

---

## 32. Ordem que eu seguiria para desenvolver

Considerando que você trabalha com React, TypeScript e tecnologias de backend, eu organizaria a execução por dependências.

| Etapa | Objetivo |
|---|---|
| **1. Canvas** | Exibir uma imagem, navegar, aplicar zoom e trabalhar com coordenadas |
| **2. Grid** | Configurar tamanho, escala e encaixe |
| **3. Objetos** | Criar, selecionar, mover, rotacionar e redimensionar |
| **4. Camadas** | Separar mapa, tokens e elementos privados |
| **5. Multiplayer** | Sincronizar estados e validar permissões |
| **6. Cenas** | Salvar mapas, alternar páginas e transferir jogadores |
| **7. Tokens avançados** | Barras, estados, imagens alternativas e associações |
| **8. Dados e chat** | Realizar rolagens e compartilhar resultados |
| **9. Journal** | Criar documentos, personagens e permissões |
| **10. Iniciativa** | Administrar turnos e integrar com rolagens |
| **11. Macros** | Criar ações reutilizáveis |
| **12. Música** | Controlar trilhas e efeitos sonoros |
| **13. Visibilidade manual** | Ocultar e revelar regiões |
| **14. Iluminação dinâmica** | Visão, luzes, paredes, portas e exploração |
| **15. Interações avançadas** | Gatilhos, efeitos, automações e extensões |

A ordem não é absoluta, mas respeita as dependências mais importantes.

Por exemplo, não faz sentido tentar construir iluminação dinâmica antes de resolver o posicionamento dos tokens.

---

# PARTE 4 — O QUE EU MELHORARIA EM RELAÇÃO AO ROLL20

Até aqui, descrevi recursos existentes.

A partir deste ponto, são **minhas propostas para seu VTT**, não funcionalidades que estou atribuindo ao Roll20.

## 33. Melhorias que considero interessantes

| Área | Minha proposta | Benefício |
|---|---|---|
| Tokens | Troca de imagens nativa, sem depender de Rollable Tables | Menos etapas |
| Tokens | Aparências organizadas por categorias | Facilita transformações |
| Macros | Editor visual de ações | Reduz necessidade de decorar comandos |
| Música | Separar trilhas, ambientes e efeitos | Organização |
| Journal | Wiki integrada com referências entre entidades | Navegação melhor |
| Journal | Vincular locais, personagens e itens | Menos duplicação de informações |
| Mapas | Biblioteca reutilizável de cenas | Preparação mais rápida |
| Grid | Configuração visual intuitiva | Facilita novos mestres |
| Iniciativa | Gerenciamento de condições e durações | Menos trabalho manual |
| Iluminação | Assistente visual para configurar paredes e luzes | Reduz complexidade |
| Interface | Layout com painéis personalizáveis | Melhor aproveitamento da tela |
| Permissões | Pré-visualização rápida de cada jogador | Evita revelar segredos |
| Interações | Gatilhos visuais configuráveis | Automatiza eventos |
| Histórico | Desfazer ações relevantes de forma segura | Reduz erros |

### Um exemplo de diferenciação

Imagine uma funcionalidade chamada **Estados do Token**.

O mestre configura:

**Estado normal**
- Imagem padrão.
- 100% de opacidade.
- Sem marcador.

**Estado ferido**
- Imagem alternativa.
- Marcador de sangramento.
- Barra de vida destacada.

**Estado invisível**
- Imagem translúcida.
- Visualização específica para o mestre.
- Regras próprias de visibilidade.

Tudo isso poderia ser aplicado por um único botão.

O Roll20 possui vários mecanismos que permitem configurar partes desse comportamento, mas um sistema unificado seria mais intuitivo.

---

# 34. Resumo final do levantamento

O Roll20 possui um conjunto bastante extenso de funcionalidades. Para desenvolver um concorrente, a dificuldade não está simplesmente em reproduzir seus botões, mas em **fazer seus diferentes sistemas funcionarem juntos**.

Podemos resumir o escopo em quatro grandes blocos.

| Bloco | Inclui | Complexidade estimada |
|---|---|---|
| **Mesa visual** | Canvas, grid, mapas, camadas, tokens, seleção e movimentação | Alta |
| **Sistemas de RPG** | Fichas, Journal, dados, macros, iniciativa e tabelas | Média a alta |
| **Experiência multiplayer** | Sincronização, permissões, chat, visibilidade e compartilhamento | Alta |
| **Recursos avançados** | Iluminação dinâmica, gatilhos, efeitos, importação UVTT e extensões | Muito alta |

### As três decisões mais importantes

**1. Definir o escopo do VTT.** Você precisa decidir se o objetivo inicial é construir uma ferramenta genérica para vários sistemas ou uma mesa especialmente otimizada para o Odisseia. Isso afeta principalmente fichas, atributos, macros e regras.

**2. Separar as entidades corretamente.** Mapas, tokens, personagens, imagens e documentos devem existir independentemente, ainda que possam se relacionar.

**3. Priorizar o funcionamento da partida.** Uma versão simples e estável, com movimentação, dados, chat, fichas e mapas, tem muito mais valor do que uma interface visualmente impressionante em que metade dos recursos não funciona corretamente.

## Fontes oficiais mais importantes

Se quiser consultar diretamente as documentações usadas como referência para desenvolver cada módulo, estas são as principais:

| Área | Documentação |
|---|---|
| Interface e ferramentas | [Visão geral da barra de ferramentas](https://help.roll20.net/hc/en-us/articles/360039674753-Toolbar-Overview?utm_source=chatgpt.com) |
| Mapas e páginas | [Gerenciamento de páginas e pastas](https://help.roll20.net/hc/en-us/articles/360039675413-Page-Menu-Folders?utm_source=chatgpt.com) |
| Configurações de mapas | [Page Settings](https://help.roll20.net/hc/en-us/articles/360039675373-Page-Settings?utm_source=chatgpt.com) |
| Tokens | [Token Features](https://help.roll20.net/hc/en-us/articles/360039674573-Token-Features?utm_source=chatgpt.com) |
| Fichas e documentos | [Journal](https://help.roll20.net/hc/en-us/articles/360039675133-Journal?utm_source=chatgpt.com) |
| Macros | [Macros & Token Actions](https://help.roll20.net/hc/en-us/articles/360037256794-Macros-Token-Actions?utm_source=chatgpt.com) |
| Dados | [Dice Reference](https://help.roll20.net/hc/en-us/articles/360037773133-Dice-Reference?utm_source=chatgpt.com) |
| Música | [Jukebox](https://help.roll20.net/hc/en-us/articles/360039178714-Jukebox?utm_source=chatgpt.com) |
| Iniciativa | [Turn Tracker](https://help.roll20.net/hc/en-us/articles/360039178634-Turn-Tracker?utm_source=chatgpt.com) |
| Cartas e tabelas | [Collections](https://help.roll20.net/hc/en-us/articles/360039178754-Collections?utm_source=chatgpt.com) |
| Iluminação | [Dynamic Lighting](https://help.roll20.net/hc/en-us/articles/360052521913-Page-Settings-For-Dynamic-Lighting?utm_source=chatgpt.com) |
| Interações automáticas | [Reactions](https://help.roll20.net/hc/en-us/articles/32901366352919-Reactions?utm_source=chatgpt.com) |
| Funcionalidades modernas | [VTT Quality of Life & Feature Improvements](https://help.roll20.net/hc/en-us/articles/25289127045143-VTT-Quality-of-Life-Feature-Improvements?utm_source=chatgpt.com) |

**Observação sobre a abrangência:** este é um inventário funcional amplo, baseado na documentação oficial atual, não uma auditoria prática de todas as combinações possíveis de configurações em uma sessão autenticada. Também não inclui cada opção interna de fichas específicas de D&D, Pathfinder ou outros sistemas, pois esses recursos variam conforme a ficha e o sistema utilizado.

### Minha conclusão

Eu dividiria seu projeto em duas metas diferentes:

**Primeira meta: criar um VTT que permita jogar uma sessão inteira sem recorrer ao Roll20.** Isso exige principalmente mapas, tokens, permissões, dados, chat, fichas, iniciativa e ferramentas básicas.

**Segunda meta: criar um VTT melhor que o Roll20 em determinados aspectos.** É aqui que eu investiria em troca nativa de aparências, macros visuais, organização de documentos, automações intuitivas e uma interface menos fragmentada.

A segunda meta é a que pode transformar o projeto de um exercício técnico em um produto com identidade própria.
