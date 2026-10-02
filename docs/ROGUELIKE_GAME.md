# OdisseiaWiki — Planejamento do Minijogo Roguelike

> Versão do documento: 1.0  
> Estado: estudo e planejamento; nenhuma funcionalidade do jogo foi implementada  
> Escopo: minijogo single-player de navegador, baseado no RPG Odisseia

## 1. Objetivo

Adicionar ao OdisseiaWiki um minijogo single-player em formato roguelike/autobattler, inspirado estruturalmente em jogos de runs rápidas, mapas ramificados, preparação estratégica e combates automáticos.

O jogo deve reutilizar a infraestrutura atual sem transformar a aplicação em uma Mesa artificial. A run terá estado próprio, regras próprias de progressão e um snapshot isolado do personagem escolhido.

Prioridades:

- custo financeiro próximo de zero;
- reutilização da stack atual;
- nenhuma infraestrutura de jogo dedicada;
- regras autoritativas no backend;
- runs retomáveis e testáveis;
- preservação da ficha original;
- compatibilidade com desktop, tablet e celular.

## 2. Estado atual relevante

| Componente | Responsabilidade atual | Uso recomendado |
|---|---|---|
| `PersonagemJogador` | Ficha pertencente a um usuário, vinculada a uma Mesa | Usar somente como origem do snapshot inicial |
| `StatusJson`, inventário, skills e magias | Estado persistido da ficha | Copiar para o estado isolado da run |
| `SistemaRpg`, `SistemaVersao` | Regras versionadas e publicadas | Fixar a versão efetiva no início da run |
| `SistemaRpgResolver` | Resolve versão, proveniência, warnings e fallbacks | Reutilizar com contexto próprio da run |
| `GameplayActionResolver` | Resolve ações, armas, acessórios, skills e magias | Extrair/adaptar para snapshots, sem dependência de Mesa |
| `GameplayRollEvaluator` | Avalia dados, vantagem, modificadores e faixas | Reutilizar com RNG injetável |
| `GameplayEngineService` | Sessões, rolagens e efeitos da Mesa | Não reutilizar diretamente; é acoplado à sessão |
| `GameplayCombatService` | Combate persistente da Mesa | Reutilizar conceitos, não seu ciclo de persistência |
| NPCs genéricos e variantes | Personagens com cópias independentes | Reutilizar o padrão de snapshot para inimigos |
| JWT e autorização | Identificação e permissão do usuário | Reutilizar diretamente |
| DnD Kit | Ordenação por arrastar | Reutilizar no loadout |
| Cytoscape | Renderização da teia de conexões | Reutilizar a biblioteca em um canvas independente para o mapa |
| Framer Motion | Animações React | Reutilizar para a reprodução da batalha |
| Lazy loading das rotas | Isolamento do bundle por tela | Criar uma área de jogo carregada sob demanda |

O `GraphCanvas` da Wiki não deve ser copiado diretamente para o mapa, porque contém lógica específica de relações e entidades da Wiki. O jogo deve possuir um componente próprio, usando posições fornecidas pelo gerador de mapa.

## 3. Impacto das alterações locais atuais

A branch atualmente aberta contém alterações ainda não commitadas relacionadas à Wiki por Mesa, NPCs de cena, variantes e turnos.

Essas alterações ajudam o planejamento porque já introduzem:

- snapshots locais de NPCs;
- origem e variante estáveis;
- cópias independentes por contexto;
- participantes persistentes de combate;
- condições e cooldowns;
- ordenação via DnD Kit;
- atualização por seções em tempo real.

O jogo não deve ser implementado nessa branch. O fluxo recomendado é:

1. concluir e testar a branch atual;
2. integrar as alterações na `main`;
3. criar uma nova branch, por exemplo `feature/roguelike-game-run`;
4. iniciar pela fase de contratos e prova de conceito.

## 4. Requisitos funcionais

### 4.1. MVP

O primeiro MVP deve possuir uma fase completa, mesmo que o modelo já suporte quatro fases:

- escolher um `PersonagemJogador` pertencente ao usuário;
- criar uma run isolada;
- salvar, continuar e abandonar a run;
- gerar mapa ramificado com seed persistida;
- nodes de Combate, Base, Vendedor, Elite e Boss;
- node Aleatório resolvendo para um tipo válido;
- selecionar e ordenar loadout;
- aplicar limite de composição;
- usar armas, skills e magias com especificação executável;
- resolver combate automaticamente no backend;
- retornar log estruturado da batalha;
- reproduzir o log no frontend;
- controlar vida, mana, estamina, cooldown e munição;
- realizar reload quando configurado;
- conceder recompensas e XP somente na run;
- permitir escolher atributo ao subir de nível;
- finalizar com vitória ou derrota.

### 4.2. Pós-MVP

- quatro fases completas;
- Caça como encontro especializado;
- Missões com fluxo próprio de escolhas;
- stash persistente da run;
- vendedores com raridade e categorias;
- bosses com regras específicas;
- condições complexas;
- progressão entre fases;
- eventos narrativos;
- balanceamento administrativo mais completo.

### 4.3. Futuro

- seed diária;
- conquistas;
- rankings opcionais;
- múltiplas runs salvas;
- meta-progressão;
- modo demonstração;
- compartilhamento de resultados;
- replays completos.

## 5. Requisitos não funcionais

- O servidor é autoritativo para RNG, regras, custos, loot, dano e recompensas.
- O cliente nunca envia resultado de dado, dano calculado ou preço como verdade.
- Cada comando mutável possui idempotência e revisão otimista.
- O estado da run é salvo após decisões relevantes, não a cada frame da animação.
- A ficha original nunca é alterada durante a run.
- O jogo continua funcionando após reinício do backend.
- O frontend deve permitir pular, acelerar ou reduzir animações.
- A área do jogo deve ser responsiva e acessível por toque.
- O jogo não depende de SignalR.
- A batalha deve ter limite de turnos e eventos para impedir loops.
- Nenhum serviço pago adicional é necessário para o MVP.

## 6. Decisões e ambiguidades pendentes

Estas regras precisam ser configuradas antes do balanceamento definitivo:

1. Faixas intermediárias do D20 usam o valor natural ou o total modificado?
2. Rajadas realizam uma rolagem por tiro ou uma rolagem por ativação?
3. Cada ator executa uma ação por turno ou várias ações baseadas em PA?
4. Uma arma sem munição recarrega imediatamente ou permite uma ação inferior?
5. Existe munição reserva ou apenas capacidade do carregador?
6. Qual a ordem entre Escudo, Proteção e Armadura?
7. Qual o custo de composição de cada ação?
8. Skills sem teste podem executar efeitos automaticamente?
9. O que ocorre quando nenhuma ação está disponível?
10. Vida zero encerra a run ou inicia um fluxo de sobrevivência?
11. Aumento de atributo aumenta apenas o máximo ou também o recurso atual?
12. Quanto cada Base recupera?
13. A run pode conceder algum benefício permanente à ficha?
14. O usuário poderá manter mais de uma run ativa?
15. O node Aleatório é resolvido na geração ou ao entrar?
16. Como inimigos escalam por fase, nível e equipamento?
17. Itens sem especificação executável podem entrar no loadout?

Recomendação provisória:

- usar o total para faixas intermediárias e o natural somente para 1/20;
- permitir estratégia por arma para rajadas;
- usar uma ação por turno no MVP;
- recarga consumir o turno;
- considerar vida zero como incapacitação/derrota da run no MVP;
- não aplicar benefícios permanentes à ficha original;
- permitir uma run ativa por usuário no MVP.

## 7. Arquitetura proposta

```text
Frontend /jogo
    -> GameRunsController
    -> GameRunService
        -> SnapshotFactory
        -> SistemaRpgResolver
        -> MapGenerator
        -> LoadoutResolver
        -> AutoBattleSimulator
            -> cálculos compartilhados da Gameplay Engine
        -> GameRunRepository
    -> MySQL
```

O domínio `GameRun` deve ser separado do domínio de Mesa.

### Personagem

Ao iniciar a run, o backend valida a propriedade do personagem e copia os dados necessários:

- atributos;
- vida, mana e estamina;
- defesas;
- inventário relevante;
- skills e magias;
- armas e acessórios;
- versão do Sistema;
- IDs e snapshots de origem;
- recursos e progressão inicial.

Depois disso, alterações da ficha original não afetam a run.

### Sistema

A run deve fixar:

- `IdSistemaVersao` efetiva;
- origem e proveniência da resolução;
- versão do schema;
- warnings e fallbacks relevantes.

Regras de mapa, balanceamento, pools e composição pertencem a uma versão própria do modo de jogo, vinculada à versão do Sistema, mas não misturada às regras genéricas de Mesa.

### Battle Engine

A batalha inteira pode ser resolvida pelo backend em uma transação e devolvida como uma sequência de eventos. O frontend apenas reproduz essa sequência.

Para evitar respostas muito grandes ou loops, deve haver:

- limite de rodadas;
- limite de eventos;
- detecção de ausência de progresso;
- resultado de empate/inconclusivo quando necessário.

## 8. Modelo de dados mínimo

### `GameModeVersion`

Entidade para a versão do minijogo:

- ID;
- código e versão;
- `IdSistemaVersao`;
- status de publicação;
- versão do schema;
- configuração JSON;
- datas.

O JSON pode conter pesos, pools, inimigos, recompensas, regras do mapa e fórmulas específicas do jogo.

### `GameRun`

Entidade da run:

- ID;
- usuário;
- personagem de origem;
- versão do modo;
- versão do Sistema;
- status;
- seed;
- fase e node atual;
- revisão;
- datas.

JSON da run:

- snapshot inicial;
- estado atual;
- loadout;
- mapa;
- ofertas;
- recompensas;
- progressão.

### `GameRunCommand`

Necessária para impedir duplicidade em compras, recompensas e resolução de nodes:

- chave de idempotência;
- hash do payload;
- tipo do comando;
- resposta persistida;
- status;
- data.

### `GameRunBattle`

Armazena o resultado de cada batalha:

- run;
- node;
- ordem;
- seed;
- vencedor;
- resumo;
- eventos JSON;
- hashes ou snapshots antes/depois;
- data.

Não é necessário criar uma tabela por turno no MVP.

## 9. Battle Engine

### Ordem automática

A cada turno, a engine deve:

1. validar se o ator pode agir;
2. percorrer o loadout do topo;
3. ignorar ações em cooldown ou sem recurso;
4. tratar munição e reload conforme a configuração;
5. escolher a primeira ação disponível;
6. selecionar alvo;
7. rolar e classificar;
8. calcular dano e defesa;
9. alterar recursos, cooldowns e condições;
10. verificar derrota;
11. avançar o turno.

A prioridade é reavaliada desde o começo em cada turno. Quando uma skill sair do cooldown, ela volta a ficar acima das ações inferiores.

### Aleatoriedade

Criar uma fonte de aleatoriedade injetável:

- produção usa RNG do backend;
- testes usam sequência controlada;
- cada batalha recebe seed definida pelo servidor;
- o cliente não envia a seed decisiva antes do resultado.

O log guarda todos os valores usados para permitir reprodução visual e auditoria.

### Battle Events

Tipos iniciais:

- `BATTLE_STARTED`;
- `TURN_STARTED`;
- `ACTION_SELECTED`;
- `ACTION_UNAVAILABLE`;
- `RELOAD_PERFORMED`;
- `DICE_ROLLED`;
- `DAMAGE_CALCULATED`;
- `DEFENSE_APPLIED`;
- `RESOURCE_CHANGED`;
- `COOLDOWN_STARTED`;
- `COOLDOWN_ADVANCED`;
- `CONDITION_APPLIED`;
- `ACTOR_DEFEATED`;
- `BATTLE_ENDED`.

Cada evento deve possuir sequência, ator, alvo, turno, schema e payload tipado.

### Recursos e defesas

Vida, mana, estamina, munição, escudo, proteção e armadura devem ser resolvidos pela versão fixada e pelo snapshot da run.

Nenhuma ordem de defesa deve ser inventada se a configuração publicada não definir uma.

## 10. Map Engine

Cada node deve possuir:

- ID estável;
- fase;
- camada;
- posição;
- tipo;
- estado;
- conexões;
- seed;
- payload;
- flags de revelado e concluído.

O mapa deve ser um DAG em camadas, com:

- início único;
- boss terminal;
- todos os nodes alcançáveis;
- ao menos um caminho até o boss;
- sem ciclos;
- limite de ramificações;
- Elite afastado do início;
- Bases distribuídas;
- restrição de tipos consecutivos;
- quantidade limitada de nodes.

Cytoscape pode ser usado com layout `preset`, recebendo posições produzidas pelo backend. Deve existir também uma apresentação em lista para acessibilidade e mobile.

## 11. Frontend

Rotas sugeridas:

```text
/jogo
/jogo/run/:id
```

Componentes:

- `GameLanding`;
- `GameCharacterSelector`;
- `GameRunShell`;
- `RunMapCanvas`;
- `RunNodeDetails`;
- `LoadoutBuilder`;
- `BattleReplay`;
- `BattleTimeline`;
- `RunBase`;
- `RunShop`;
- `RunRewardSelection`;
- `RunLevelUp`;
- `RunResult`.

Reutilizar Modal, botões, HUD, loading, cards, DataTable quando aplicável, DnD Kit, Cytoscape e Framer Motion.

Não adicionar Phaser, Pixi, Unity, Godot ou Matter.js como base do jogo. O MVP pode usar HTML, SVG, CSS e animações React.

## 12. Backend

Componentes esperados:

- `GameRunsController`;
- `IGameRunService` / `GameRunService`;
- `IGameRunRepository` / `GameRunRepository`;
- `IGameRunSnapshotFactory`;
- `IGameRunMapGenerator`;
- `IGameRunLoadoutResolver`;
- `IAutoBattleSimulator`;
- `IGameRunRewardResolver`;
- `IGameRunProgressionService`;
- `IGameRunRandomSource`.

Endpoints tipados sugeridos:

```text
GET  /api/game-runs/characters
GET  /api/game-runs/active
POST /api/game-runs
GET  /api/game-runs/{id}
PUT  /api/game-runs/{id}/loadout
POST /api/game-runs/{id}/nodes/{nodeId}/select
POST /api/game-runs/{id}/battles/current/resolve
POST /api/game-runs/{id}/rewards/{rewardId}/choose
POST /api/game-runs/{id}/shop/{offerId}/buy
POST /api/game-runs/{id}/level-up
POST /api/game-runs/{id}/abandon
```

Não criar endpoint genérico que receba `tipo` e JSON arbitrário.

## 13. Testes

### Engine

- mesma entrada e RNG geram o mesmo log;
- vitória, derrota, empate e limite de rodadas;
- nenhuma ação após o fim;
- reload e munição;
- cooldown e retorno à prioridade;
- ausência de recursos;
- fallback quando nenhuma ação está disponível;
- vantagem, desvantagem, crítico e falha crítica;
- dano e defesa;
- modificadores de acessórios;
- progressão e múltiplos níveis;
- derrota e vida zero.

### Mapa

- seed reproduzível;
- todos os nodes alcançáveis;
- ausência de ciclos;
- boss alcançável;
- quantidade e distribuição válidas;
- pools suficientes.

### Persistência

- criar, salvar, retomar e abandonar;
- retry idempotente;
- conflito de revisão;
- reinício do backend;
- batalha persistida antes da animação.

### Segurança e isolamento

- usuário não acessa run de outro usuário;
- personagem de outro usuário não pode ser importado;
- NPC local de Mesa não aparece como personagem pessoal;
- ficha original não sofre alteração;
- duas runs não compartilham estado;
- personagem excluído depois do início não quebra o snapshot.

## 14. Custos

O MVP pode funcionar usando:

- frontend no Netlify;
- backend no Render;
- banco MySQL existente;
- assets atuais;
- nenhum Redis;
- nenhum worker;
- nenhum serviço realtime;
- nenhum servidor de jogo dedicado.

Riscos futuros são crescimento dos logs, assets adicionais e batalhas excessivamente longas. Limites de eventos, rodadas e retenção resolvem a primeira versão.

## 15. Plano incremental

### Fase 0 — Contratos e consistência

Entregáveis:

- este documento;
- decisões mínimas registradas;
- snapshot definido;
- contrato de BattleEvent;
- versão do modo definida;
- regra de custo e progressão definida.

Saída: contratos aprovados sem alterar a engine existente.

### Fase 1 — Prova de conceito de batalha

Entregáveis:

- simulador puro;
- fixtures de personagens, armas e inimigos;
- RNG injetável;
- reload, cooldown, dano, defesa e recursos;
- log estruturado.

Saída: mesma entrada e mesma sequência aleatória produzem o mesmo resultado.

### Fase 2 — Run e snapshot

Entregáveis:

- models, migrations, repository e service;
- criação e retomada;
- seleção de personagem;
- snapshot isolado;
- loadout e custo.

Saída: run persistida sem alterar a ficha original.

### Fase 3 — Mapa e primeira fase

Entregáveis:

- Map Engine;
- tela do mapa;
- Combate, Base, Elite e Boss;
- replay de batalha.

Saída: uma run completa pode ser vencida ou perdida.

### Fase 4 — Economia e eventos

Entregáveis:

- Vendedor;
- recompensas;
- stash;
- Aleatório;
- Caça.

Saída: compras e recompensas idempotentes.

### Fase 5 — Jogo completo

Entregáveis:

- quatro fases;
- Missões;
- bosses finais;
- progressão completa;
- balanceamento.

Saída: run completa do início ao encerramento.

### Fase 6 — Polimento

Entregáveis:

- animações;
- opção de velocidade/pular;
- acessibilidade;
- mobile;
- métricas e balanceamento.

## 16. Reutilizar, adaptar e criar

### Reutilizar diretamente

- JWT e autorização;
- `SistemaVersao` e regras publicadas;
- contratos de itens e poderes;
- modificadores de armas e acessórios;
- DnD Kit;
- Cytoscape;
- Framer Motion;
- componentes genéricos;
- lazy loading;
- tratamento de erros.

### Adaptar ou extrair

- `GameplayActionResolver`;
- `GameplayRollEvaluator`;
- `SistemaRpgResolver`;
- cálculo de dano, recursos e condições;
- criação de snapshots de NPCs e variantes;
- progressão do Sistema;
- breakdown de rolagens;
- renderização do dado.

### Criar

- domínio `GameRun`;
- `GameModeVersion`;
- snapshot da run;
- mapa procedural;
- simulador automático;
- IA de inimigos;
- Battle Events;
- composição/loadout;
- economia;
- recompensas;
- persistência de comandos;
- telas do jogo.

## 17. Divergências importantes

- O jogo não deve ser uma Mesa artificial.
- `MesaSessao`, `MesaEvento` e `MesaCombate` não devem ser usados como fonte de persistência da run.
- A ficha original não deve ser alterada durante a run.
- SignalR não é necessário para o MVP.
- O custo de composição não deve depender somente de dano.
- Missões com submapa próprio ficam fora do primeiro MVP.
- Quatro fases devem estar previstas no contrato, mas a primeira entrega deve validar uma fase completa.
- A versão do minijogo deve ser própria, vinculada à versão do Sistema.
- A extração da Gameplay Engine deve ser localizada; não fazer uma reescrita geral.

## 18. Critério de conclusão do estudo

O estudo estará pronto para implementação quando:

- as ambiguidades do MVP forem decididas;
- o snapshot estiver definido;
- o contrato de batalha estiver aprovado;
- o modelo de persistência estiver revisado;
- a prova de conceito de batalha puder ser testada sem interface;
- a branch atual da Wiki por Mesa estiver integrada e estável;
- a nova implementação começar em branch própria a partir da `main`.
