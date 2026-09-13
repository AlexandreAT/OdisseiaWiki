# PROMPT PARA O CODEX — IMPLEMENTAÇÃO DO SISTEMA DE MESAS DO ODISSEIAWIKI

## Contexto geral e objetivo desta implementação

Quero implementar agora uma nova etapa importante do OdisseiaWiki: o sistema de **Mesas** como um recurso real de conexão entre mestre, jogadores e personagens.

Até este momento, grande parte do site funciona de forma mais individual: usuário, personagem, ficha, wiki, comparação, inventário e demais recursos são utilizados principalmente a partir da perspectiva de um usuário acessando os próprios dados ou conteúdos gerais do sistema. Esta implementação muda isso porque será o primeiro ponto realmente importante do projeto em que **usuários diferentes passam a compartilhar uma mesma estrutura**, em que um mestre administra jogadores, em que jogadores enxergam personagens uns dos outros e em que dados precisam ser atualizados de forma compartilhada e em tempo real.

Por isso, esta implementação precisa ser tratada com bastante cuidado.

Não quero simplesmente “criar algumas telas”. Quero que o sistema de Mesas seja integrado ao projeto de forma natural, aproveitando tudo o que já existe, respeitando as relações de dados atuais, as permissões atuais, os componentes atuais, os padrões visuais atuais e a arquitetura atual.

O site já está avançado. Existem padrões visuais, componentes, modelos, DTOs, entidades, relacionamentos, configurações de personagem, regras de versão, sistema, mesa e várias outras estruturas que já foram criadas ao longo do projeto. Antes de decidir como implementar qualquer parte nova, **entenda profundamente o que já existe**.

Este documento descreve principalmente o comportamento e o produto que quero atingir. Não estou tentando determinar previamente a arquitetura técnica. Você terá acesso real ao projeto, então quero que use o código existente para tomar as melhores decisões.

Se alguma coisa descrita aqui não for possível, não fizer sentido com a estrutura atual ou puder ser feita de uma maneira melhor sem alterar a experiência que estou pedindo, você pode tomar uma decisão diferente. Nesse caso, faça da maneira mais correta para o projeto e me informe claramente no relatório final o que foi diferente e por quê.

---

# 1. REGRA MAIS IMPORTANTE: ENTENDA O PROJETO ANTES DE IMPLEMENTAR

Antes de começar a desenvolver, leia e siga o **PROJECT_GUIDE** e qualquer outra documentação interna relevante.

Depois disso, faça uma análise real da estrutura atual relacionada a:

- usuários;
- mesas;
- usuários vinculados a mesas;
- mestre/dono da mesa;
- sistemas;
- versões dos sistemas;
- personagens;
- personagem vinculado a mesa;
- configurações de exibição e privacidade dos personagens;
- configuração de campos/atributos visíveis ou invisíveis;
- regras atuais de personagem invisível;
- ficha de personagem;
- página dedicada de personagem;
- cards de personagem;
- comparação de personagens;
- inventário;
- itens;
- sistema de versionamento das fichas;
- sistema de atualização de personagem para uma nova versão;
- qualquer modelo de configuração de mesa já existente;
- qualquer relação atual entre sistema, mesa e raça;
- modelos, entidades, DTOs e serviços já existentes;
- upload e exibição de imagens;
- modais;
- paginação;
- filtros;
- autenticação e autorização;
- componentes visuais compartilhados;
- estrutura de rotas;
- padrão de carregamento;
- tratamento de erros;
- padrão de notificações;
- qualquer mecanismo já existente que possa ser aproveitado para atualização de dados em tempo real.

**Não crie estruturas paralelas sem necessidade.**

Se já existir uma estrutura que represente algo próximo do que precisamos, adapte ou reutilize antes de criar outra.

Evite duplicar:

- modelos;
- regras;
- validações;
- componentes;
- tipos;
- DTOs;
- relações;
- serviços;
- formas diferentes de fazer a mesma coisa.

Quero que esta implementação pareça que sempre fez parte do OdisseiaWiki.

---

# 2. NÃO INVENTAR UM NOVO DESIGN

As imagens anexadas a este pedido são referências visuais diretas das telas.

Elas estão na seguinte ordem:

1. Tela inicial de Mesas;
2. Tela de pesquisa de Mesa;
3. Página dedicada da Mesa;
4. Tela de criação de nova Mesa;
5. Tela Geral do gerenciamento da Mesa;
6. Tela de Pedidos de entrada;
7. Tela da Mesa em jogo.

Use essas imagens como referência de estrutura e composição, mas **não trate detalhes gerados nessas imagens como autorização para criar um novo Design System**.

O Design System verdadeiro é o que já existe no código atual do OdisseiaWiki.

### É obrigatório manter:

- as fontes já utilizadas no projeto;
- os tamanhos de fonte coerentes com páginas equivalentes;
- os mesmos padrões de espaçamento;
- os mesmos tipos de botão;
- os mesmos campos;
- os mesmos dropdowns;
- os mesmos modais;
- as mesmas cores;
- o mesmo ciano;
- o mesmo magenta;
- o mesmo amarelo para XP quando aplicável;
- os mesmos fundos;
- os mesmos efeitos;
- os mesmos ícones ou biblioteca de ícones que já utilizamos;
- o mesmo comportamento de hover;
- o mesmo padrão de responsividade;
- o mesmo estilo de títulos;
- o mesmo padrão visual dos cards;
- o mesmo padrão visual das páginas atuais.

Não quero que você veja as imagens e crie CSS novo simplesmente para imitá-las.

Primeiro procure como cada elemento já é feito no projeto.

Se já existe um botão visualmente equivalente, reutilize o padrão.

Se já existe um card equivalente, reutilize.

Se já existe paginação, reutilize.

Se já existe modal, reutilize.

Se já existe input de upload de imagem, reutilize.

Se já existe barra de pesquisa, reutilize.

Se já existe filtro, reutilize.

Se já existe card de personagem, **principalmente neste caso, reutilize o card atual de personagem em vez de reconstruí-lo**.

---

# 3. BORDAS ESPECIAIS E SVG

Nas divs principais que utilizam aquele formato de borda futurista com recortes, **não tente reproduzir isso apenas com border CSS**.

Nós já temos o SVG/padrão de borda utilizado no projeto, principalmente na Character Page e em outras áreas.

Use exatamente a mesma abordagem que já existe.

É importante manter inclusive o comportamento que já temos:

- a div em seu estado natural não deve simplesmente nascer com uma borda neon completa;
- mantenha o mesmo comportamento visual usado atualmente;
- a borda natural da div deve seguir o padrão existente;
- use o SVG de borda que já existe;
- preserve a animação/efeito em que o neon “liga” e a borda cresce/ganha cor até integrar com o SVG;
- não crie uma segunda implementação dessa borda;
- não desenhe um SVG novo se o atual puder ser reutilizado.

Se houver mais de um componente equivalente no projeto, use como principal referência a implementação da **Character Page**.

---

# 4. ESCOPO DESTA ETAPA

Nesta primeira implementação, quero tornar funcional o núcleo social e operacional de uma Mesa.

Entram nesta etapa:

- criar mesa;
- pesquisar mesa;
- listar mesas criadas;
- listar mesas em que o usuário participa;
- página pública/dedicada da mesa;
- solicitação para entrar em uma mesa;
- mensagem opcional na solicitação;
- receber solicitações;
- aceitar ou recusar solicitações;
- controlar limite de jogadores;
- impedir novas solicitações quando não houver vaga;
- gerenciamento básico da mesa;
- edição das informações básicas da mesa;
- troca da versão do sistema da mesa;
- listagem de jogadores;
- expulsão de jogador com motivo obrigatório;
- listagem de personagens da mesa para o mestre;
- leitura da ficha de jogadores pelo mestre sem qualquer possibilidade de alteração;
- tela compartilhada de Mesa em jogo;
- atualização em tempo real dos principais status dos personagens;
- indicação de presença online na Mesa em jogo;
- respeito completo às regras de visibilidade e privacidade de cada personagem;
- tratamento de personagens mortos na tela da Mesa em jogo.

---

# 5. O QUE NÃO SERÁ IMPLEMENTADO AGORA

Existem ideias maiores planejadas para o sistema de Mesas, mas **não quero implementá-las nesta etapa**.

## 5.1 Configuração personalizada do sistema da Mesa

Não implementar agora nenhuma tela ou lógica que permita ao mestre alterar:

- valores de raça;
- valores base do sistema;
- atributos;
- regras;
- cálculos;
- balanceamento;
- parâmetros internos;
- configurações profundas da Mesa;
- configurações de itens;
- configurações de magia;
- configurações de skill;
- qualquer outro valor estrutural do sistema.

A opção **Configurações** deve existir visualmente no gerenciamento porque fará parte do sistema no futuro, mas deve permanecer **desabilitada** nesta versão.

Não criar infraestrutura grande “para deixar pronto” sem necessidade.

O objetivo agora é apenas deixar o ponto visual previsto para a funcionalidade futura.

---

## 5.2 Wiki dedicada da Mesa

A Wiki própria da Mesa é uma funcionalidade futura.

Não implementar agora:

- criação de páginas da Wiki da Mesa;
- edição dessas páginas;
- criação de NPCs próprios da Mesa;
- criação de itens próprios da Mesa;
- criação de conteúdos da Mesa;
- gerenciamento de conteúdo dessa Wiki;
- permissões complexas de autoria dentro dessa Wiki.

Na Página dedicada da Mesa, o botão **Ver Wiki da Mesa** deve aparecer, mas ficar desabilitado nesta etapa.

Quando o usuário for o mestre, o botão que substituiria “Pedir para participar” será **Adicionar conteúdo da Wiki**, mas também ficará desabilitado nesta etapa.

No gerenciamento, mantenha **Wiki da Mesa** na navegação para preservar a estrutura prevista da interface.

Como a funcionalidade ainda não está no escopo, não desenvolva um novo sistema de Wiki só para fazer esse item funcionar.

Se já existir no projeto uma rota de Wiki de Mesa segura, pronta e que possa ser utilizada sem desenvolver nada novo, você pode avaliar o reaproveitamento. Caso contrário, deixe o item sem acesso funcional por enquanto, seguindo o mesmo padrão usado no projeto para funcionalidades desabilitadas.

---

## 5.3 Configuração/comparação avançada entre sistemas

A ideia futura de comparar:

- personagem de jogador;
- NPC da Wiki oficial;
- NPC da Wiki da Mesa;
- versões diferentes;
- sistemas personalizados;
- configurações específicas da Mesa;

não faz parte desta etapa.

Não faça agora uma grande alteração no sistema de comparação para suportar funcionalidades futuras que ainda não existem.

Apenas garanta que esta implementação **não quebre** o funcionamento atual.

---

## 5.4 Itens exclusivos criados pela Mesa

A ideia futura de criar itens próprios da Mesa e permitir colocá-los no inventário dos jogadores também não será implementada agora, porque depende da criação de conteúdo da Wiki/Mesa.

Não criar “Itens da Mesa” nesta etapa.

---

# 6. REGRAS DE SEGURANÇA E PERMISSÃO

Esta implementação é especialmente delicada porque agora um usuário passa a acessar dados relacionados a outros usuários.

Não confie apenas no frontend.

Esconder um botão não é suficiente para impedir uma ação.

Toda ação deve respeitar corretamente quem está fazendo a requisição e a relação dessa pessoa com a Mesa.

De forma conceitual:

### Visitante/usuário que ainda não participa

Pode:

- pesquisar Mesas;
- abrir a página dedicada de uma Mesa;
- ver apenas informações públicas permitidas;
- solicitar entrada se houver vaga.

Não pode:

- acessar gerenciamento;
- acessar pedidos;
- acessar lista administrativa de jogadores;
- acessar fichas privadas;
- alterar Mesa;
- entrar na Mesa em jogo.

### Jogador participante

Pode:

- acessar a Mesa em jogo;
- ver os personagens permitidos pela configuração de privacidade deles;
- abrir a página dedicada da Mesa;
- visualizar os personagens permitidos;
- continuar editando somente os próprios personagens pelas áreas normais que já existem no site.

Não pode:

- gerenciar a Mesa;
- aceitar pedidos;
- recusar pedidos;
- expulsar jogadores;
- editar a Mesa;
- editar personagens de outros jogadores.

### Mestre/dono da Mesa

Pode:

- gerenciar a Mesa;
- alterar as informações permitidas;
- alterar versão da Mesa;
- receber pedidos;
- aceitar;
- recusar;
- ver jogadores;
- expulsar jogadores;
- acessar a listagem administrativa de personagens da Mesa;
- abrir página e ficha desses personagens em modo de leitura.

Mesmo o mestre **nunca pode editar um personagem de outro usuário**.

Isso é uma regra importante.

---

# 7. TELA 1 — TELA INICIAL DE MESAS

Esta é a primeira imagem de referência.

A tela deve funcionar como o centro inicial das Mesas do usuário.

No topo do conteúdo teremos:

- botão **Pesquisar Mesa**;
- botão **Criar nova Mesa**.

Abaixo teremos duas áreas independentes:

1. **Minhas Mesas criadas**
2. **Mesas que participo**

---

## 7.1 Minhas Mesas criadas

Mostrar as Mesas das quais o usuário autenticado é o mestre/dono.

Exibir no máximo **3 Mesas por página**.

Se houver mais, usar paginação.

A paginação desta área deve ser independente da paginação de “Mesas que participo”.

Cada item deve seguir o formato da imagem e apresentar:

- banner;
- nome da Mesa;
- tags, somente se existirem;
- sistema;
- versão;
- mestre;
- quantidade atual de jogadores;
- limite de jogadores, seguindo a forma usada pelo projeto para esse tipo de informação.

Na lateral direita do item devem existir ações por ícone:

### Pedidos

Leva diretamente à aba de Pedidos da tela de gerenciamento da Mesa.

Quando existirem pedidos pendentes, mostrar a quantidade de forma discreta seguindo o padrão visual atual do site.

Não inventar um badge novo se já existir padrão para contadores/notificações.

### Gerenciamento

Ícone de engrenagem.

Leva para o gerenciamento da Mesa, inicialmente na aba Geral.

### Página dedicada

Leva para a Página dedicada da Mesa.

### Entrar na Mesa em jogo

Leva para a tela de Mesa em jogo.

Use um ícone coerente com os que já existem no projeto.

---

## 7.2 Mesas que participo

Mostrar Mesas em que o usuário é jogador participante, sem duplicar aqui as Mesas das quais ele é o próprio mestre.

Também mostrar no máximo **3 por página**, com paginação independente.

Exibir:

- banner;
- nome;
- tags, se existirem;
- sistema;
- versão;
- mestre;
- quantidade de jogadores.

Na lateral direita devem existir:

### Visualizar Mesa

Ícone de olho.

Abre a página dedicada da Mesa.

### Entrar na Mesa em jogo

Abre a tela compartilhada da Mesa em jogo.

---

## 7.3 Estados vazios

Se o usuário ainda não criou nenhuma Mesa ou não participa de nenhuma, use o padrão de empty state já existente no projeto.

Não inventar uma estética nova para isso.

A tela ainda deve deixar claros os caminhos de pesquisar ou criar Mesa.

---

# 8. TELA 2 — PESQUISA DE MESA

Esta é a segunda imagem de referência.

A tela deve permitir encontrar Mesas disponíveis.

No topo:

- barra de pesquisa;
- área/botão de filtros.

A pesquisa deve considerar informações úteis como o nome da Mesa e, se a estrutura atual permitir naturalmente, também informações que o projeto já costuma pesquisar em recursos semelhantes.

Não precisa transformar essa busca em um mecanismo complexo.

---

## 8.1 Filtros

Precisamos de:

### Sistema

O usuário pode filtrar pelo sistema usado pela Mesa.

**Não haverá filtro por versão.**

### Disponibilidade

Permitir filtrar Mesas que ainda possuem espaço para receber jogador.

A disponibilidade deve representar vagas reais conforme as regras atuais da Mesa.

---

## 8.2 Cards de resultado

No desktop, exibir **3 Mesas por linha**.

Cada página pode ter até **4 linhas**.

Portanto:

**12 Mesas por página.**

Depois disso, paginação.

Use como referência visual os cards mostrados na imagem, mas procure primeiro os cards já existentes de páginas/cidades ou qualquer componente equivalente do projeto.

Cada card precisa comunicar pelo menos:

- banner;
- nome;
- descrição resumida;
- sistema;
- versão;
- mestre;
- jogadores atuais / limite;
- tags se existirem.

Se a tag não existe, não crie espaço vazio desnecessário apenas para manter um rótulo.

---

## 8.3 Mesas lotadas

Uma Mesa lotada pode continuar aparecendo na busca normal.

Ela apenas:

- não deve aceitar nova solicitação;
- deve deixar a indisponibilidade clara na Página dedicada;
- não deve aparecer quando o filtro “com vaga/disponível” estiver ativo.

---

# 9. TELA 3 — PÁGINA DEDICADA DA MESA

Esta é a terceira imagem de referência.

É a página pública/descritiva da Mesa.

A imagem de referência gerada possui um pequeno card/imagem quadrada sobre o banner.

**Não quero essa imagem quadrada.**

Use somente o banner principal.

A página deve conter:

- banner;
- nome da Mesa;
- mestre;
- sistema;
- versão;
- quantidade de jogadores;
- limite de jogadores quando fizer sentido na apresentação;
- descrição;
- tags, caso existam.

Não precisa daquela outra área de quatro grandes caixas informativas mostrada no exemplo original.

Quero uma página mais limpa.

---

## 9.1 Botão Ver Wiki

Mostrar o botão **Ver Wiki da Mesa**.

Nesta etapa ele deve estar **desabilitado** porque a Wiki dedicada não será implementada agora.

O botão deve parecer desabilitado seguindo o padrão atual do projeto, sem criar um visual novo.

---

## 9.2 Usuário que ainda não participa

Se o usuário pode solicitar entrada, mostrar:

**Pedir para participar**

Ao clicar, abrir um modal simples.

---

## 9.3 Modal de pedido para participar

O modal contém:

- pequena explicação;
- campo de mensagem opcional;
- contador de caracteres;
- botão enviar;
- cancelar/fechar.

A mensagem é opcional.

O usuário pode enviar a solicitação totalmente sem mensagem.

Se escrever, a mensagem será exibida posteriormente ao mestre na aba de Pedidos.

Quero que essa mensagem seja curta.

Antes de escolher o limite, verifique se o projeto já possui um padrão semelhante.

Se não existir qualquer referência adequada, use **200 caracteres** como limite padrão para esta mensagem.

Esse limite deve ser tratado como uma regra real do recurso e não apenas visual.

---

## 9.4 Estados do pedido

A página precisa tratar corretamente situações como:

- usuário já é participante;
- usuário já possui pedido pendente;
- usuário é o mestre;
- Mesa está lotada.

Não permita solicitações duplicadas.

Não permita que o mestre peça para entrar na própria Mesa.

Não permita que alguém que já participa envie outra solicitação.

Se já existir um pedido pendente, a interface deve indicar isso de forma coerente.

Se a Mesa estiver lotada, o usuário deve ser barrado **antes** de enviar o pedido.

Se entre o momento em que a página foi aberta e o envio alguém ocupar a última vaga, a regra deve continuar sendo respeitada.

---

## 9.5 Quando o usuário é o mestre

O botão **Pedir para participar** não existe.

No lugar dele, mostrar:

**Adicionar conteúdo da Wiki**

Esse botão deve aparecer desabilitado nesta etapa.

---

# 10. TELA 4 — CRIAR NOVA MESA

Esta é a quarta imagem de referência.

A tela deve permitir criar uma Mesa com:

- banner;
- sistema;
- versão;
- botão para usar a versão mais recente;
- nome;
- descrição;
- limite de jogadores;
- tags opcionais;
- botão Criar Mesa.

---

## 10.1 Banner

Use o mesmo padrão de upload/crop/imagem que o projeto já utiliza quando adequado.

Não crie uma segunda experiência de upload se já temos uma consolidada.

---

## 10.2 Sistema e versão

O usuário escolhe o sistema.

Depois escolhe a versão.

Também existe:

**Usar versão mais recente**

Esse botão deve selecionar a versão mais recente válida daquele sistema.

Não assumir pela interface que uma versão textual maior é necessariamente a versão mais recente se o projeto já tiver uma forma correta de representar isso.

Use a regra existente.

---

## 10.3 Limite de jogadores

O limite representa a capacidade de jogadores da Mesa conforme a semântica já existente no projeto.

Antes de alterar qualquer entendimento sobre se o mestre entra ou não nessa contagem, verifique como o domínio atual trata Mestre x Jogadores.

Não redefina essa semântica por conta própria.

O importante é que todos os lugares do site usem a mesma regra.

---

## 10.4 Tags

Opcionais.

Use a estrutura já existente de tags se ela já for compartilhável.

Não criar um segundo modelo de tags exclusivamente para Mesa se isso for desnecessário.

---

# 11. TELA 5 — GERENCIAMENTO DA MESA

Esta é a quinta imagem de referência.

Esta área só pode ser acessada pelo mestre/dono da Mesa.

Na lateral esquerda teremos um pequeno cabeçalho com:

- banner/imagem da Mesa;
- nome da Mesa;
- identificação discreta de que o usuário é o mestre.

A navegação lateral deve conter **apenas**:

1. Geral
2. Pedidos
3. Jogadores
4. Personagens
5. Wiki da Mesa
6. Configurações

Não criar agora as opções extras que aparecem em algumas das imagens conceituais antigas, como:

- NPCs da Mesa;
- Comunicações;
- Sessões;
- Fichas da Mesa;
- Sistema como aba separada;
- Itens da Mesa;
- outras opções não listadas acima.

---

# 12. ABA GERAL DO GERENCIAMENTO

A aba Geral permite alterar informações básicas da Mesa.

Pode alterar:

- banner;
- nome;
- descrição;
- versão;
- limite de jogadores;
- tags.

### O sistema NÃO pode ser alterado depois da criação da Mesa nesta etapa.

Mostre o sistema como informação não editável ou campo bloqueado, respeitando o padrão visual do projeto.

---

## 12.1 Alteração de versão

A versão pode ser alterada.

Também deve existir a ação de atualizar para a versão mais recente quando houver uma mais nova, seguindo a lógica atual de versões do projeto.

Importante:

**Alterar a versão da Mesa não deve atualizar automaticamente os personagens dos jogadores.**

Já existe uma lógica conceitual no projeto em que personagem pode estar fixado em determinada versão.

O jogador é responsável por atualizar manualmente o próprio personagem quando for apropriado.

O mestre não pode atualizar a versão da ficha de outro jogador.

Se a mudança da versão da Mesa fizer personagens ficarem desatualizados em relação à Mesa, preserve essa situação e utilize os mecanismos/avisos já existentes quando aplicável.

Não faça uma atualização em cascata nos personagens.

---

## 12.2 Alteração do limite de jogadores

Não permitir definir um limite inferior à quantidade de jogadores já aceitos, a menos que exista uma regra atual no projeto que trate explicitamente essa situação de outra forma.

Não remover jogadores automaticamente apenas porque o limite foi reduzido.

---

# 13. ABA PEDIDOS

Esta é a sexta imagem de referência.

Mostrar os pedidos de entrada da Mesa.

Cada solicitação deve mostrar:

- imagem do usuário;
- nome do usuário;
- mensagem enviada, somente se existir;
- data da solicitação;
- botão Aceitar;
- botão Recusar.

A mensagem opcional enviada no modal da Página da Mesa deve aparecer aqui sem perder o conteúdo.

---

## 13.1 Aceitar pedido

Ao aceitar:

- transformar o usuário em participante da Mesa;
- remover o pedido da lista de pendentes;
- atualizar contadores;
- permitir que ele acesse a Mesa em jogo;
- aplicar todas as permissões de jogador participante.

A capacidade precisa ser validada também no momento da aceitação.

Exemplo:

Uma Mesa possui uma vaga.

Três pessoas fizeram pedido antes dela ficar cheia.

O mestre aceita uma delas.

A Mesa agora ficou lotada.

Os outros pedidos podem permanecer registrados, mas o mestre não deve conseguir ultrapassar o limite aceitando outro pedido.

Não permitir inconsistência apenas porque o pedido foi criado anteriormente.

---

## 13.2 Recusar pedido

Ao recusar:

- remover o pedido pendente;
- não transformar o usuário em participante.

Não criar um sistema de banimento nesta etapa.

Se o usuário quiser solicitar novamente futuramente e ainda houver vaga, isso pode ser permitido, a menos que já exista alguma regra atual do projeto em sentido contrário.

---

# 14. ABA JOGADORES

A lista visual deve seguir a mesma linha da lista de Pedidos, reaproveitando estrutura quando fizer sentido.

Mostrar os participantes atuais.

Exibir as informações básicas disponíveis e adequadas, como:

- foto;
- nome;
- informação de participação/data quando já existir essa informação;
- ação de expulsar.

Não mostrar Aceitar.

Não mostrar Recusar.

Mostrar apenas a ação administrativa necessária:

**Expulsar jogador**

O mestre não pode expulsar a si próprio por esse fluxo.

---

# 15. EXPULSÃO DE JOGADOR

Ao clicar em Expulsar, abrir um modal.

A expulsão exige uma mensagem obrigatória explicando o motivo.

A mensagem possui limite maior do que a mensagem de pedido de entrada.

Primeiro veja se já existe um padrão de limite no projeto.

Se não existir, use **500 caracteres** como limite padrão.

Mostrar contador.

O botão de confirmar expulsão deve permanecer indisponível enquanto não houver mensagem válida.

---

## 15.1 Efeito da expulsão

Depois de confirmar:

- usuário deixa de participar da Mesa;
- perde acesso à Mesa em jogo;
- não aparece mais como jogador ativo da Mesa;
- seus personagens deixam de fazer parte das telas compartilhadas daquela Mesa;
- não apagar o usuário;
- não apagar o personagem;
- não destruir dados pessoais do jogador.

A expulsão é uma alteração de vínculo com a Mesa, não uma exclusão dos dados do usuário.

A mensagem de expulsão não deve simplesmente ser descartada.

Antes de inventar um sistema novo de notificações, verifique o que já existe no OdisseiaWiki.

Se já existir mecanismo adequado de aviso/notificação, use-o.

Se não existir, implemente a forma mínima e coerente necessária para que o jogador consiga receber/ver o motivo da expulsão, sem transformar esta tarefa na criação de um sistema completo de mensagens.

Documente no final como isso foi resolvido.

---

# 16. ABA PERSONAGENS NO GERENCIAMENTO DO MESTRE

Esta tela é diferente da Mesa em jogo.

Aqui o mestre precisa conseguir enxergar administrativamente os personagens vinculados aos jogadores daquela Mesa.

### Nesta tela, inclusive personagens invisíveis devem aparecer para o mestre.

Essa é a exceção explícita à privacidade visual da Mesa compartilhada.

Também devem aparecer personagens mortos, inclusive com Vida = 0.

A intenção é o mestre conseguir gerenciar e compreender a situação da Mesa.

---

## 16.1 Card de personagem

Não crie um card novo.

Use o card de personagem que já existe na tela de personagens do jogador.

Quero o mesmo estilo, mesma estrutura e mesmas informações.

Não tente aproximar.

**Reutilize o componente ou a estrutura real já existente sempre que possível.**

O mestre deve conseguir:

- visualizar a página dedicada do personagem;
- abrir a ficha.

A referência é manter os mesmos botões/estrutura do card atual quando isso for necessário para reutilização.

Porém existe uma regra absoluta:

# O MESTRE NÃO PODE EDITAR O PERSONAGEM DE OUTRO JOGADOR.

Não importa por qual botão ou rota ele chegou.

---

# 17. MODO DE LEITURA DA FICHA PELO MESTRE

Quando o mestre abre personagem de outro jogador a partir da área administrativa da Mesa, toda a experiência precisa ser leitura.

Ele pode navegar.

Ele pode abrir informações.

Ele pode consultar tudo que o papel de mestre deve enxergar nessa área administrativa.

Mas não pode alterar.

Isso inclui:

- dados gerais;
- status;
- história;
- inventário;
- itens;
- magia;
- skills;
- próteses;
- atributos;
- qualquer outro campo editável.

Se hoje uma área da ficha possui um elemento que ao clicar abre um modal de edição, o mestre pode abrir esse modal para **visualizar o conteúdo**, mas os controles de alteração devem estar bloqueados.

O mesmo vale para tabelas que possuem botão Editar.

O mestre pode consultar as informações completas, mas não persistir nenhuma alteração.

Essa proteção deve existir de verdade.

Não basta apenas esconder botão no frontend.

Se o mestre tentar realizar uma ação por outro caminho, ela também precisa ser recusada.

Não permita que a introdução desta visualização administrativa crie uma brecha para edição de fichas alheias.

---

# 18. PRIVACIDADE E CONFIGURAÇÃO DE EXIBIÇÃO DOS PERSONAGENS

Os personagens já possuem regras/configurações de exibição.

Essas regras precisam continuar valendo.

Antes de implementar as telas compartilhadas, investigue exatamente como essa configuração funciona hoje.

Exemplos do comportamento esperado:

### Personagem invisível

Se o dono configurou o personagem como invisível, ele **não aparece na Mesa em jogo para os outros jogadores**.

A única exceção desta implementação é a tela administrativa de Personagens do mestre, onde o mestre precisa enxergá-lo.

Não altere a configuração do usuário para conseguir fazer isso.

Trate a permissão administrativa como uma forma específica de visualização.

### Atributos invisíveis

Se o personagem pode aparecer, mas determinados atributos/status/informações foram configurados como ocultos, não revele os valores reais na tela compartilhada.

Não deixe vazar o dado verdadeiro:

- em texto;
- em tooltip;
- em HTML escondido;
- em payload desnecessário;
- em aria-label inadequado;
- em outra parte do card.

Use o mesmo comportamento de ocultação já adotado pelo site.

Se hoje temos uma forma padronizada de mostrar “oculto”, use exatamente ela.

### Outras configurações de privacidade

Qualquer configuração atual equivalente também precisa ser respeitada.

Não recrie uma segunda lógica de privacidade exclusivamente para Mesas se a regra já existe no personagem.

A Mesa deve **consumir as mesmas regras**.

---

# 19. TELA 7 — MESA EM JOGO

Esta é a sétima imagem de referência.

Ela deve ser simples e dinâmica.

É a tela em que os jogadores entram enquanto estão jogando a sessão.

Ela não é uma ficha coletiva completa.

A principal função é:

**mostrar os personagens do grupo e seus status de forma compartilhada e atualizada em tempo real.**

---

# 20. CABEÇALHO DA MESA EM JOGO

Manter a estrutura indicada na imagem.

Mostrar:

- nome da Mesa;
- sistema;
- versão;
- jogadores conectados;
- turno atual.

### Não mostrar “Última atualização”.

Essa informação da imagem de referência deve ser removida.

---

## 20.1 Jogadores conectados

Essa informação não representa a capacidade máxima da Mesa.

Ela representa:

**quantos jogadores participantes existem na Mesa e quantos deles estão online na tela da Mesa em jogo neste momento.**

Exemplo conceitual:

`4 / 6 conectados`

O significado deve ser algo como:

- 4 jogadores atualmente conectados à Mesa em jogo;
- 6 jogadores participantes existentes na Mesa.

Não confundir isso com “limite de 6 jogadores”.

Se a Mesa tem limite 10, possui 6 jogadores aceitos e 4 estão online, essa área representa 4/6, e não 4/10.

Mantenha a apresentação visual coerente com a imagem e com o restante do projeto.

---

## 20.2 O que significa “online”

Para esta tela, o círculo de presença não deve significar simplesmente “o usuário está logado no OdisseiaWiki”.

Ele deve representar que o usuário está efetivamente conectado à experiência da **Mesa em jogo** naquele momento.

Ou seja, queremos uma indicação próxima de “está aqui jogando agora”.

Ao entrar na tela, o estado deve aparecer.

Ao sair da tela, fechar ou perder a conexão, o estado deve ser atualizado em tempo razoável.

Não quero um falso online permanente apenas porque o usuário acessou o site algum momento.

---

## 20.3 Turno atual

Por enquanto, manter estático:

**Mestre**

Não desenvolver um sistema de turnos nesta etapa.

---

# 21. CARDS DA MESA EM JOGO

Aqui essa regra é extremamente importante:

# USE O CARD DE PERSONAGEM JÁ EXISTENTE.

A imagem de referência desta tela foi criada em cima da ideia do card que já temos.

Não redesenhe o card.

Não crie uma versão horizontal.

Não crie uma versão “compacta” nova.

Não reorganize as informações por conta própria.

O card deve continuar sendo o card vertical já utilizado na tela de personagens do jogador.

Reaproveite o máximo possível do componente real.

---

## 21.1 Informações em tempo real

Os seguintes valores devem refletir as mudanças realizadas pelo dono do personagem:

- Vida;
- Mana;
- Estamina;
- XP.

Quando o próprio dono altera esses valores pelos fluxos normais do site, os outros usuários que estão na Mesa em jogo precisam ver a atualização sem depender de atualizar a página manualmente.

Não quero uma sensação de página estática.

Esta tela precisa parecer compartilhada.

---

## 21.2 Dono do personagem

Adicionar no card uma label discreta informando o dono daquele personagem.

Exemplo conceitual:

`Jogador: Alexandre`

Não transformar isso em um elemento visual dominante.

Deve ser informação secundária e coerente com o card atual.

---

## 21.3 Presença online no card

Na lateral direita do card, próximo ao botão de comparação, deve existir um pequeno círculo indicando a presença do dono daquele personagem.

- online: seguir a cor positiva/ativa já utilizada no projeto;
- offline: estado discreto/inativo.

Não inventar uma linguagem visual desconectada.

O estado corresponde à presença do **dono** na Mesa em jogo.

Se um usuário possuir mais de um personagem naquela Mesa, todos os cards dele refletem a presença daquele mesmo usuário.

---

# 22. BOTÕES DOS CARDS NA MESA EM JOGO

### Personagem de outro jogador

Mostrar somente:

**Visualizar**

Não mostrar:

- Ficha;
- Editar.

### Personagem do usuário logado

O card do personagem que pertence ao próprio usuário continua com as ações que ele normalmente possui, incluindo:

- Visualizar;
- Ficha;
- Editar.

A regra de propriedade precisa ser real.

Não determinar isso apenas por algum dado recebido do frontend sem validação adequada.

---

# 23. PERSONAGEM MORTO NA MESA EM JOGO

Quando um personagem chegar a:

**Vida = 0**

ele deve sair da tela da Mesa em jogo.

Quero um efeito visual antes da remoção.

A ideia é:

1. Vida chega a zero;
2. card inicia um efeito discreto de desaparecer/fade;
3. card é removido da grade;
4. os outros cards reorganizam o espaço normalmente;
5. se não houver outro personagem, o espaço simplesmente fica livre.

Não manter um grande espaço vazio reservado para o personagem morto.

Não deixar o card morto permanente nessa tela.

### Importante

O personagem não foi apagado.

Ele apenas não aparece mais na Mesa em jogo enquanto estiver com Vida igual a zero.

Ele continua:

- existindo no sistema;
- pertencendo ao jogador;
- aparecendo na área administrativa de Personagens do mestre;
- aparecendo onde as regras normais do site permitirem.

Se a lógica atual do projeto permitir que esse personagem volte a ter Vida maior que zero posteriormente, a tela compartilhada deve voltar a tratá-lo conforme o estado atual e as regras de visibilidade.

---

# 24. PERSONAGENS INVISÍVEIS NA MESA EM JOGO

Um personagem configurado pelo dono como invisível não aparece na lista compartilhada.

Mesmo que esteja vinculado à Mesa.

Mesmo que o dono esteja online.

Mesmo que o mestre também esteja conectado à Mesa em jogo.

A exceção administrativa continua sendo apenas a área de gerenciamento de Personagens do mestre.

---

# 25. ATUALIZAÇÃO EM TEMPO REAL

Não quero definir previamente qual tecnologia você deve usar.

Analise o projeto.

Escolha a solução mais adequada e menos invasiva para a arquitetura atual.

O comportamento desejado é:

- usuário A altera Vida;
- usuários B, C e D conectados à mesma Mesa em jogo recebem a alteração;
- apenas a Mesa correta recebe esse evento;
- outras Mesas não recebem;
- usuário entra na Mesa em jogo;
- presença é atualizada;
- usuário sai;
- presença é atualizada;
- personagem chega a 0 de Vida;
- demais usuários veem o card desaparecer;
- mudanças de Mana, Estamina e XP também são refletidas.

Evite transformar esta implementação em uma infraestrutura excessivamente complexa se não for necessário.

Ao mesmo tempo, não use uma solução frágil apenas para simular tempo real.

---

# 26. ISOLAMENTO ENTRE MESAS

Muito cuidado com o compartilhamento em tempo real.

Uma Mesa nunca pode receber dados de outra.

Um usuário da Mesa A não pode receber:

- presença da Mesa B;
- status de personagem da Mesa B;
- eventos da Mesa B;
- informações privadas da Mesa B.

A relação de usuário, personagem e Mesa precisa ser validada corretamente.

Este é o primeiro grande recurso social do site e não podemos começar com vazamento cruzado de dados.

---

# 27. REGRAS DE VÍNCULO ENTRE PERSONAGEM E MESA

Antes de criar qualquer nova relação, descubra como isso funciona hoje.

Já existem conceitos de Mesa, personagem e sistema no projeto.

Não presuma que precisamos criar uma relação nova se ela já existe.

A tela em jogo deve considerar os personagens que realmente pertencem ou estão vinculados àquela Mesa conforme o modelo atual.

Não use apenas “todos os personagens do usuário”.

Um jogador pode ter outros personagens que não pertencem àquela campanha.

Esses personagens não devem aparecer.

---

# 28. VERSÃO DA MESA E VERSÃO DO PERSONAGEM

Respeite a arquitetura de versão já existente.

A Mesa possui uma versão de sistema.

O personagem pode ter sua própria versão/ficha fixada.

Quando o mestre atualiza a Mesa:

- a Mesa muda para a nova versão;
- personagens não são alterados automaticamente;
- o jogador continua responsável pelo próprio processo de atualização;
- o mestre não ganha autorização para atualizar personagem alheio.

Se já existe aviso de personagem desatualizado em relação ao sistema/mesa, reutilize.

Não crie uma segunda regra de versão.

---

# 29. COMPORTAMENTO AO ENTRAR NA MESA

Quando um pedido é aceito, o usuário passa a ser um participante válido.

A partir daí:

- a Mesa aparece em “Mesas que participo”;
- ele pode abrir a página dedicada;
- ele pode entrar na Mesa em jogo;
- os personagens vinculados corretamente àquela Mesa passam a participar da experiência compartilhada conforme as regras de visibilidade.

Não obrigue o usuário a fazer cadastro redundante de vínculo se essa relação já puder ser inferida corretamente pelos modelos existentes.

---

# 30. COMPORTAMENTO AO SER EXPULSO

Depois de expulso:

- Mesa deixa de aparecer em “Mesas que participo”;
- acesso à Mesa em jogo é revogado;
- se ele estiver conectado na tela naquele momento, o sistema deve reagir de forma segura;
- seus personagens deixam de aparecer na experiência compartilhada;
- nenhum dado pessoal ou ficha deve ser apagado.

Se a arquitetura em tempo real permitir reagir imediatamente à expulsão, faça isso de maneira adequada.

Não deixar um usuário continuar recebendo informações da Mesa indefinidamente depois de perder o vínculo.

---

# 31. CASOS DE BORDA IMPORTANTES

Durante a implementação, trate pelo menos os seguintes casos:

- usuário cria Mesa;
- usuário cria várias Mesas;
- paginação com mais de 3 Mesas criadas;
- paginação com mais de 3 Mesas participantes;
- pesquisa com mais de 12 resultados;
- filtro por sistema;
- filtro por disponibilidade;
- Mesa sem tags;
- Mesa com tags;
- Mesa lotada;
- pedido enviado sem mensagem;
- pedido enviado com mensagem;
- tentativa de pedido duplicado;
- tentativa do mestre pedir entrada;
- tentativa de participante pedir entrada novamente;
- dois mestres/usuários concorrendo pela última vaga via pedidos antigos;
- mestre aceita pedido;
- mestre recusa pedido;
- pedido deixa de aparecer depois da decisão;
- contador de pedidos é atualizado;
- mestre tenta reduzir limite abaixo da quantidade atual;
- mestre altera versão;
- personagens permanecem em suas versões;
- jogador é expulso;
- motivo obrigatório;
- expulsão não apaga personagem;
- mestre tenta editar ficha alheia;
- usuário comum tenta acessar rota administrativa;
- personagem invisível;
- atributo invisível;
- personagem morto;
- personagem volta a ter Vida;
- jogador online;
- jogador offline;
- duas Mesas em jogo simultaneamente;
- atualização de status não vaza entre Mesas;
- usuário dono vê seus próprios botões;
- outro jogador vê apenas Visualizar;
- mestre vê personagens no gerenciamento mesmo quando invisíveis;
- mestre acessa ficha em leitura;
- tela carregada sem dados;
- erro de carregamento;
- conexão em tempo real cai e volta.

Não precisa criar uma interface enorme para cada exceção.

Use os padrões atuais de feedback do site.

---

# 32. NÃO CRIAR COMPLEXIDADE DESNECESSÁRIA

Embora esta seja uma implementação grande, quero uma solução proporcional.

Não crie agora:

- chat;
- agenda de sessões;
- voz;
- presença global do usuário;
- permissões avançadas por cargo;
- co-mestre;
- transferência de mestre;
- banimento;
- lista de bloqueados;
- sistema de turnos;
- NPCs da Mesa;
- itens da Mesa;
- Wiki editável;
- regras personalizadas;
- sistema customizado;
- notificações complexas se não forem necessárias;
- histórico completo de eventos;
- logs de combate;
- qualquer outro recurso que não esteja neste escopo.

Não tente “melhorar o produto” adicionando novas funcionalidades.

Concentre-se em terminar bem o que foi pedido.

---

# 33. REUTILIZAÇÃO DO CARD DE PERSONAGEM

Quero reforçar esta parte porque ela é muito importante visualmente e arquiteturalmente.

Já existe um card de personagem usado na tela de personagens do usuário.

Ele possui:

- imagem;
- nome;
- Vida;
- Mana;
- Estamina;
- raça;
- cidade;
- alinhamento;
- nível;
- XP;
- Mesa;
- proficiências;
- versão/aviso quando aplicável;
- botões;
- ícone de comparação;
- bordas e estética próprias.

Esse card já é parte consolidada do site.

### Não faça um “novo card para a Mesa”.

A abordagem correta é descobrir como fazer o card atual trabalhar em contextos diferentes.

Conceitualmente, ele precisa suportar modos como:

### Contexto normal do proprietário

Comportamento atual.

### Contexto Mesa em jogo — personagem próprio

Mesmo card, mantendo botões do proprietário.

### Contexto Mesa em jogo — personagem de outro jogador

Mesmo card, mas:

- somente Visualizar;
- label discreta do dono;
- presença online;
- aplicação das regras de privacidade.

### Contexto gerenciamento do mestre

Mesmo card, com acesso de leitura administrativa e sem permitir alteração real.

Se a estrutura atual do componente não suporta isso, adapte cuidadosamente para permitir contextos/variações sem duplicar todo o componente.

Mas preserve o comportamento atual em todas as telas antigas.

---

# 34. TELAS ANTIGAS NÃO PODEM REGREDIR

Esta implementação reutiliza elementos importantes já usados no site.

Depois de adaptar componentes compartilhados, teste as páginas antigas também.

Principalmente:

- lista de personagens do usuário;
- página dedicada do personagem;
- ficha;
- modais da ficha;
- inventário;
- comparação;
- atualização de versão;
- qualquer tela que reutilize card, modal, barra ou componente alterado.

O sistema de Mesas não pode quebrar o fluxo atual do usuário.

---

# 35. EXPERIÊNCIA VISUAL E RESPONSIVIDADE

O desktop das imagens é a referência principal.

Porém, siga o padrão responsivo já existente no site.

Não faça uma solução fixa apenas para a resolução da screenshot.

Quando a largura diminuir:

- cards podem reorganizar;
- grade de pesquisa pode reduzir colunas;
- sidebar do gerenciamento deve seguir o padrão atual do projeto para layouts menores;
- modais precisam continuar utilizáveis;
- ações não podem ficar inacessíveis.

Não invente um layout mobile completamente novo se já existir um padrão responsivo no OdisseiaWiki.

---

# 36. TEXTOS E LABELS

Use português seguindo o padrão atual do projeto.

Evite textos longos desnecessários na interface.

A interface deve continuar com o estilo objetivo que o OdisseiaWiki já tem.

Termos principais:

- Gerenciamento de Mesas
- Pesquisar Mesa
- Criar nova Mesa
- Minhas Mesas criadas
- Mesas que participo
- Mestre
- Sistema
- Versão
- Jogadores
- Pedidos
- Geral
- Personagens
- Wiki da Mesa
- Configurações
- Pedir para participar
- Adicionar conteúdo da Wiki
- Aceitar
- Recusar
- Expulsar
- Mesa em jogo
- Jogadores conectados
- Turno atual
- Visualizar
- Ficha
- Editar

Se o projeto já possui convenção diferente de capitalização, siga a convenção existente.

---

# 37. FLUXO DE IMPLEMENTAÇÃO RECOMENDADO

Não precisa seguir esta ordem cegamente se a arquitetura indicar outra melhor, mas quero que o trabalho seja organizado.

## Etapa A — investigação

Antes de modificar:

1. Ler PROJECT_GUIDE.
2. Mapear modelos atuais.
3. Mapear relações de Mesa.
4. Mapear relação de personagem e Mesa.
5. Entender versões.
6. Entender configuração de visibilidade.
7. Entender autenticação/autorização.
8. Encontrar card de personagem.
9. Encontrar borda SVG.
10. Encontrar Character Page.
11. Encontrar paginação.
12. Encontrar modal.
13. Encontrar uploads.
14. Encontrar filtros.
15. Encontrar padrões de API/DTO.
16. Entender se existe infraestrutura útil para tempo real.

## Etapa B — planejar mudanças mínimas

Antes de sair criando arquivos, defina:

- o que já existe;
- o que pode ser reaproveitado;
- o que realmente precisa ser criado;
- quais relações já resolvem o domínio;
- quais dados adicionais são indispensáveis;
- como preservar compatibilidade.

## Etapa C — núcleo da Mesa

Implementar/fechar:

- criação;
- listagem;
- pesquisa;
- paginação;
- página dedicada.

## Etapa D — participação

Implementar:

- pedido;
- mensagem;
- capacidade;
- aceitar;
- recusar;
- jogadores;
- expulsão.

## Etapa E — gerenciamento e personagens

Implementar:

- Geral;
- navegação lateral;
- lista de personagens;
- modo de leitura do mestre;
- privacidade.

## Etapa F — Mesa em jogo

Implementar:

- presença;
- real time;
- cards;
- status;
- dono;
- botões condicionais;
- personagem morto;
- isolamento por Mesa.

## Etapa G — validação geral

Validar frontend, backend, banco, permissões e visual.

---

# 38. VALIDAÇÃO VISUAL NO NAVEGADOR

Ao final, valide visualmente.

Eu vou deixar:

- frontend rodando;
- backend rodando;
- site aberto no Google/Chrome.

Se o ambiente do Codex disponibilizar a extensão/ferramenta do Google para interagir com o navegador, utilize-a para conferir as telas reais.

Compare com:

- as screenshots enviadas;
- e, principalmente, com as telas já existentes do próprio OdisseiaWiki.

Verifique:

- alinhamento;
- fontes;
- tamanhos;
- espaçamento;
- borda SVG;
- animação de borda;
- cores;
- botões;
- cards;
- paginação;
- modais;
- estado desabilitado;
- loading;
- empty state;
- responsividade básica.

Se precisar parar e iniciar novamente frontend/backend durante os testes, pode fazer.

Não considere a tarefa concluída apenas porque compilou.

---

# 39. VALIDAÇÃO FUNCIONAL

Ao final, faça testes reais de fluxo.

Idealmente usando mais de uma sessão/usuário quando necessário.

Validar:

### Criação

- criar Mesa;
- dados aparecem corretamente;
- versão mais recente;
- banner;
- tags;
- limite.

### Pesquisa

- encontrar Mesa;
- sistema;
- disponibilidade;
- paginação.

### Pedido

- sem mensagem;
- com mensagem;
- limite de caracteres;
- contador;
- duplicidade;
- Mesa lotada.

### Mestre

- recebe pedido;
- vê mensagem;
- aceita;
- recusa;
- contador muda.

### Jogadores

- participante aparece;
- expulsão;
- motivo obrigatório;
- perde acesso.

### Geral

- altera nome;
- banner;
- descrição;
- tags;
- limite;
- versão;
- sistema continua imutável.

### Personagens

- mestre vê todos;
- mestre vê invisíveis;
- mestre vê mortos;
- mestre abre página;
- mestre abre ficha;
- mestre não consegue editar.

### Mesa em jogo

- jogadores corretos aparecem;
- personagens invisíveis não aparecem;
- atributos privados não vazam;
- dono aparece;
- presença funciona;
- card próprio possui ações próprias;
- card alheio possui somente Visualizar;
- Vida atualiza;
- Mana atualiza;
- Estamina atualiza;
- XP atualiza;
- Vida 0 remove com animação;
- grade reorganiza;
- dados não vazam para outra Mesa.

---

# 40. AUTORIZAÇÃO: TESTAR TAMBÉM PELO CAMINHO ERRADO

Não teste apenas clicando nos botões corretos.

Tente também acessar situações proibidas diretamente.

Exemplos:

- jogador comum acessando URL de gerenciamento;
- participante tentando aceitar pedido;
- mestre tentando editar personagem alheio;
- usuário expulso tentando abrir Mesa em jogo por URL antiga;
- usuário de outra Mesa tentando consumir informações;
- requisição de pedido em Mesa cheia;
- pedido duplicado;
- tentativa de aceitar além do limite.

O backend precisa continuar sendo a autoridade real.

---

# 41. BANCO E ALTERAÇÕES DE ESTRUTURA

Se precisar alterar estrutura persistida, faça apenas o necessário.

Antes, verifique se os modelos atuais já contêm:

- relação de usuários na Mesa;
- dono/mestre;
- sistema;
- versão;
- capacidade;
- dados de Mesa;
- personagem e Mesa;
- solicitação;
- ou algo equivalente.

Não assuma que precisa criar tudo novo.

Se alguma migração for necessária:

- faça de forma compatível;
- preserve dados existentes;
- evite redefinir estruturas já em uso;
- documente no final.

Não apague ou recrie dados existentes apenas para facilitar o desenvolvimento.

---

# 42. DADOS DE TESTE

Se precisar criar dados temporários para testar, faça de forma consciente.

Não polua permanentemente dados reais do projeto se houver uma forma melhor.

Se criar seeds, mocks ou dados temporários, informe no final.

Não deixe dependência de mock na funcionalidade final.

---

# 43. ERROS E FEEDBACK

Use o sistema de feedback já existente.

Precisamos de feedback claro em situações como:

- erro ao criar Mesa;
- pedido já existente;
- Mesa lotada;
- erro ao aceitar;
- erro ao recusar;
- erro ao expulsar;
- limite inválido;
- versão inválida;
- acesso negado;
- perda de conexão na Mesa em jogo;
- falha ao carregar personagens.

Não criar `alert()` de navegador se o projeto possui modal/toast/padrão próprio.

---

# 44. LOADING

Respeite o padrão atual para carregamento.

Não deixe a interface exibir dados antigos como se fossem atuais sem indicação quando estiver trocando Mesa ou carregando uma listagem.

Na Mesa em jogo, a experiência de reconexão deve ser razoável.

Não precisa criar uma tela complexa de conexão.

Apenas evite que o usuário pense que está vendo dados ao vivo quando a conexão já foi perdida por muito tempo.

---

# 45. WIKI E CONFIGURAÇÕES DEVEM PARECER FUTURAS, NÃO QUEBRADAS

Ao deixar:

- Wiki da Mesa;
- Configurações;
- Adicionar conteúdo da Wiki;

desabilitados, faça de uma forma intencional.

Eles devem parecer recursos ainda indisponíveis, e não botões quebrados.

Se o projeto já possui tooltip/padrão “em breve”, reutilize.

Não é necessário criar um grande sistema de feature flags só por causa disso, a menos que já exista um e seja a opção natural.

---

# 46. NÃO FAZER ALTERAÇÃO GLOBAL DESNECESSÁRIA

Se você perceber que uma funcionalidade pode ser feita alterando 3 partes específicas, não refatore 20 áreas do site sem necessidade.

Se algum componente precisa ser generalizado para ser reutilizado, faça isso cuidadosamente e mantenha a API/uso atual o mais estável possível.

Prefira:

- extensão;
- reaproveitamento;
- pequenos ajustes;
- composição;

em vez de grandes reescritas.

---

# 47. TOMADA DE DECISÃO AUTÔNOMA

Você tem autorização para tomar decisões técnicas.

Este prompt não conhece o código tão bem quanto você conhecerá depois de investigá-lo.

Se encontrar uma situação em que:

- o modelo atual já resolve de outro jeito;
- uma relação descrita aqui seria redundante;
- uma solução pedida causaria acoplamento ruim;
- o mecanismo de tempo real precisa seguir outro caminho;
- um campo precisa ser representado de outra forma;
- uma parte da interface precisa de pequena adaptação por causa de componente já consolidado;

você pode fazer diferente.

A prioridade é:

1. preservar o comportamento desejado;
2. preservar a segurança;
3. respeitar o projeto atual;
4. evitar duplicação;
5. manter o visual existente;
6. evitar regressão;
7. reduzir complexidade desnecessária.

No final, relate essas decisões.

---

# 48. NÃO MUDE O ESCOPO SILENCIOSAMENTE

Se algo precisar ser diferente, não simplesmente omita.

No relatório final, quero uma seção:

## Decisões diferentes do plano original

Para cada diferença, explique de forma simples:

- o que estava pedido;
- o que foi feito;
- por que foi feito diferente;
- impacto prático.

Se nada precisou mudar, diga isso.

---

# 49. RESULTADO ESPERADO DESTA FASE

Ao terminar esta implementação, quero conseguir realizar o seguinte fluxo de ponta a ponta:

1. Usuário entra na área de Mesas.
2. Vê Mesas que criou e Mesas das quais participa.
3. Pesquisa novas Mesas.
4. Abre uma Mesa.
5. Envia solicitação opcionalmente com mensagem.
6. Mestre vê o pedido.
7. Mestre aceita.
8. Mesa aparece para o jogador.
9. Jogador entra na Mesa em jogo.
10. Vê personagens permitidos.
11. Vê quem está online.
12. Vê status atualizados ao vivo.
13. Seu próprio card continua com seus controles.
14. Cards de outros jogadores são apenas leitura.
15. Privacidade é respeitada.
16. Mestre consegue administrar jogadores.
17. Mestre consegue ver todos os personagens da Mesa administrativamente.
18. Mestre consegue consultar fichas sem editar.
19. Mestre consegue alterar informações básicas e versão da Mesa.
20. Personagens não são atualizados automaticamente quando a Mesa muda de versão.
21. Mestre pode expulsar jogador com motivo obrigatório.
22. Usuário expulso perde o vínculo sem perder seus dados.
23. Personagem que chega a Vida 0 desaparece da Mesa em jogo com transição.
24. Nada vaza entre Mesas.
25. Wiki personalizada e Configurações permanecem claramente preparadas visualmente, porém desabilitadas.

Esse é o núcleo que deve ficar sólido.

---

# 50. CHECKLIST FINAL ANTES DE CONSIDERAR CONCLUÍDO

Antes de finalizar, confirme:

- [ ] PROJECT_GUIDE foi seguido.
- [ ] Estrutura atual de Mesa foi estudada.
- [ ] Estrutura atual de Sistema foi estudada.
- [ ] Estrutura atual de versões foi estudada.
- [ ] Relação atual entre Mesa e personagem foi estudada.
- [ ] Configuração de privacidade foi estudada.
- [ ] Card de personagem existente foi reaproveitado.
- [ ] Fontes existentes foram usadas.
- [ ] Borda SVG existente foi usada.
- [ ] Animação/padrão de borda foi preservado.
- [ ] Não foi criado novo Design System.
- [ ] Tela inicial possui duas listas com paginações independentes.
- [ ] Cada lista inicial mostra 3 Mesas por página.
- [ ] Pesquisa mostra 12 Mesas por página no desktop.
- [ ] Pesquisa filtra por Sistema.
- [ ] Pesquisa filtra por disponibilidade.
- [ ] Não existe filtro por versão.
- [ ] Página dedicada possui apenas banner principal.
- [ ] Página dedicada mostra tags quando existem.
- [ ] Wiki está desabilitada nesta fase.
- [ ] Mestre vê Adicionar conteúdo da Wiki desabilitado.
- [ ] Pedido possui mensagem opcional.
- [ ] Pedido possui contador.
- [ ] Pedido sem mensagem funciona.
- [ ] Pedido duplicado é bloqueado.
- [ ] Mesa cheia bloqueia pedido.
- [ ] Limite também é validado ao aceitar.
- [ ] Criação de Mesa funciona.
- [ ] Sistema não pode ser alterado depois.
- [ ] Versão pode ser alterada.
- [ ] Versão da Mesa não atualiza personagem automaticamente.
- [ ] Gerenciamento possui somente as seis opções definidas.
- [ ] Configurações está desabilitado.
- [ ] Pedidos exibem mensagem quando existe.
- [ ] Aceitar funciona.
- [ ] Recusar funciona.
- [ ] Jogadores são listados.
- [ ] Expulsão exige mensagem.
- [ ] Expulsão não apaga personagem.
- [ ] Mestre vê personagens invisíveis na tela administrativa.
- [ ] Mestre vê personagens mortos.
- [ ] Mestre consegue consultar ficha.
- [ ] Mestre não consegue editar ficha alheia.
- [ ] Mesa em jogo usa card vertical existente.
- [ ] Card alheio possui só Visualizar.
- [ ] Card próprio mantém ações próprias.
- [ ] Label do dono aparece discretamente.
- [ ] Indicador online aparece.
- [ ] Online significa presença na Mesa em jogo.
- [ ] Jogadores conectados representa online/participantes, não capacidade.
- [ ] Turno atual permanece Mestre.
- [ ] Última atualização foi removida.
- [ ] Vida atualiza em tempo real.
- [ ] Mana atualiza em tempo real.
- [ ] Estamina atualiza em tempo real.
- [ ] XP atualiza em tempo real.
- [ ] Privacidade é respeitada.
- [ ] Valores ocultos não vazam.
- [ ] Personagem invisível não aparece na Mesa em jogo.
- [ ] Vida 0 gera fade e remove o card.
- [ ] Layout reorganiza após remoção.
- [ ] Eventos não vazam entre Mesas.
- [ ] Usuário expulso perde acesso.
- [ ] Rotas administrativas são protegidas.
- [ ] Telas antigas continuam funcionando.
- [ ] Frontend compila.
- [ ] Backend compila.
- [ ] Banco/migrações foram validados se aplicável.
- [ ] Console do navegador foi verificado.
- [ ] Erros de rede foram verificados.
- [ ] Validação visual foi feita no navegador quando possível.
- [ ] Fluxo com múltiplos usuários foi testado quando possível.
- [ ] Decisões arquiteturais relevantes foram documentadas.

---

# 51. RELATÓRIO FINAL QUE QUERO RECEBER

Quando terminar, não responda apenas “feito”.

Quero um resumo organizado contendo:

## Implementado

Resumo das funcionalidades concluídas.

## Estrutura aproveitada

Quais partes importantes do projeto atual foram reutilizadas, por exemplo:

- modelos;
- relações;
- componentes;
- card;
- SVG;
- modais;
- sistema de versão;
- privacidade;
- tempo real;
- paginação.

Não precisa listar cada arquivo trivial.

## Alterações de dados

Se houve:

- nova relação;
- nova tabela;
- novo campo;
- migração;
- mudança em DTO/modelo importante;

explique.

Se não houve, informe.

## Segurança e permissões

Explique resumidamente como ficou garantido que:

- jogador não gerencia;
- mestre não edita ficha alheia;
- Mesa não recebe dados de outra;
- personagem invisível não vaza;
- atributo invisível não vaza.

## Tempo real

Explique de forma simples:

- como presença foi tratada;
- como status são atualizados;
- como a conexão é isolada por Mesa;
- como foi tratada reconexão/saída.

## Validação realizada

Diga:

- builds executados;
- testes feitos;
- telas verificadas;
- validação no navegador;
- fluxos com múltiplos usuários;
- casos importantes testados.

## Não implementado propositalmente

Confirmar que ficaram fora:

- Configurações personalizadas;
- Wiki editável;
- criação de NPC;
- criação de itens da Mesa;
- conteúdo próprio;
- comparação avançada;
- sistema de turnos;
- funcionalidades extras.

## Decisões diferentes do plano original

Liste qualquer adaptação feita por causa da realidade do projeto.

## Pendências reais

Se algo não pôde ser validado ou depende de algo externo, diga claramente.

---

# 52. PRINCÍPIO FINAL

Esta implementação precisa parecer uma expansão natural do OdisseiaWiki, não um módulo separado criado posteriormente.

O projeto já possui identidade visual, arquitetura, regras, componentes e conceitos próprios.

Use-os.

Não tente “reinventar” o OdisseiaWiki para implementar Mesas.

A parte mais importante desta tarefa não é simplesmente conseguir criar, buscar e entrar em uma Mesa.

A parte mais importante é fazer isso **sem quebrar a coerência do projeto**, com regras corretas entre usuários diferentes e com uma base sólida para que, no futuro, possamos acrescentar:

- Wiki própria;
- conteúdos da Mesa;
- NPCs;
- itens;
- regras personalizadas;
- configurações de sistema;
- comparações entre contextos;
- outras funcionalidades sociais.

Faça primeiro esta base muito bem.

Só depois evoluiremos o restante.
