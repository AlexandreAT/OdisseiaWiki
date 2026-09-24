# OdisseiaWiki - Guia da Engine de Gameplay

> **Versao do documento:** 1.0  
> **Ultima revisao:** 20/09/2026  
> **Estado geral:** planejado e pronto para implementacao incremental  
> **Escopo:** sessoes, rolagens, acoes, historico, combate e automacoes de regras  
> **Documento canonico:** qualquer alteracao da engine deve atualizar este arquivo na mesma entrega

---

# 1. Proposito deste documento

Este documento e a fonte da verdade para projetar, implementar, testar e evoluir a engine de gameplay do OdisseiaWiki.

Ele transforma o estudo tecnico, as ideias de produto, as regras do Livro do Jogador e a arquitetura real do projeto em um contrato unico. Deve orientar:

- desenvolvedores;
- ferramentas de inteligencia artificial;
- revisoes de arquitetura;
- modelagem de banco e APIs;
- implementacao do frontend e backend;
- validacao das regras do RPG;
- testes funcionais, de seguranca e de regressao;
- evolucao futura para estatisticas e assistencia por IA.

O objetivo da engine e transformar fichas e Mesas que hoje organizam informacoes em ferramentas praticas de jogo, capazes de executar rolagens, interpretar regras, registrar acontecimentos e, gradualmente, aplicar efeitos com seguranca.

Este arquivo nao declara como implementado o que ainda esta apenas decidido ou planejado. Toda secao deve diferenciar claramente o estado real do estado desejado.

---

# 2. Autoridade, fontes e manutencao

## 2.1. Hierarquia de fontes

As fontes possuem responsabilidades diferentes e nao devem ser tratadas como concorrentes:

1. O **Livro do Jogador** define a intencao conceitual e as regras do RPG Odisseia.
2. Uma **versao publicada do Sistema de RPG** define a configuracao executavel usada por uma Mesa.
3. Este guia define a arquitetura, os fluxos, as invariantes e a forma segura de executar essas regras.
4. O `PROJECT_GUIDE.md` continua definindo os padroes gerais de arquitetura, reaproveitamento de estilos, codigo, UI e desenvolvimento do projeto.
5. `docs/RPG_SYSTEMS.md` continua definindo sistemas configuraveis, versionamento, resolucao e proveniencia.
6. O codigo deve refletir as fontes anteriores; o comportamento acidental do codigo nao passa a ser regra apenas por ja existir.

Quando houver conflito:

- uma regra configurada e publicada prevalece no runtime da Mesa;
- uma nova publicacao nunca altera silenciosamente uma sessao em andamento;
- uma contradicao do livro deve permanecer explicita e configuravel;
- uma decisao de produto deve ser registrada neste guia, no Sistema e nos testes antes de virar automacao;
- nenhum fallback pode ocultar sua origem;
- codigo, seed, documentacao e testes devem ser corrigidos juntos.

## 2.2. Legenda de maturidade

| Estado | Significado |
|---|---|
| `Implementado` | Existe no codigo, foi integrado e deve possuir cobertura proporcional ao risco. |
| `Decidido` | O comportamento esta definido neste guia, mas ainda pode nao existir no codigo. |
| `Planejado` | Faz parte do roadmap, com direcao conhecida, mas depende de fase posterior. |
| `Bloqueado por regra` | Nao pode ser automatizado ate uma ambiguidade ser resolvida ou configurada. |
| `Assistido` | A interface ajuda e registra, mas a decisao ou aplicacao continua manual. |
| `Fora do escopo` | Nao faz parte desta entrega ou desta engine. |

## 2.3. Regra de atualizacao

Toda entrega da engine deve atualizar, quando aplicavel:

1. a tabela de estado atual;
2. a fase correspondente do roadmap;
3. os contratos de dados e API;
4. a matriz de regras;
5. as ambiguidades resolvidas ou descobertas;
6. os testes e criterios de aceite;
7. o registro de decisoes no final deste arquivo.

Uma funcionalidade nao esta concluida se o documento disser algo diferente do codigo entregue.

---

# 3. Visao do produto

## 3.1. Objetivos

A engine deve:

- automatizar calculos repetitivos do sistema;
- permitir rolagens confiaveis diretamente pela ficha e pela Mesa;
- reduzir o trabalho operacional de jogadores e mestre;
- preservar a decisao narrativa e contextual do mestre;
- manter um historico auditavel do que ocorreu em cada sessao;
- evitar efeitos duplicados ou estado perdido por concorrencia;
- respeitar versoes e configuracoes proprias de cada Mesa;
- permitir uso seguro em desktop, tablet e celular;
- preparar dados confiaveis para estatisticas futuras;
- preparar uma base explicavel para uma futura assistencia por IA.

## 3.2. Nao objetivos iniciais

As primeiras fases nao devem:

- criar um mapa tatico completo;
- substituir o mestre em decisoes contextuais;
- interpretar texto livre como codigo;
- automatizar todas as excecoes do livro de uma vez;
- aplicar dano, custo ou condicao apenas porque um dado foi rolado;
- criar uma segunda ficha de personagem paralela e dessincronizada;
- criar agregados definitivos de estatistica antes do ledger de eventos;
- tornar a animacao 3D requisito para jogar;
- implementar uma IA narradora;
- reescrever a arquitetura atual sem necessidade.

## 3.3. Resultado esperado

Ao final das fases previstas, um participante autorizado deve conseguir:

- abrir uma sessao da Mesa;
- usar a propria ficha para escolher uma acao valida;
- solicitar uma rolagem ao servidor;
- ver os dados animados com o resultado real recebido;
- entender dados, modificadores, total e resultado semantico;
- confirmar separadamente a aplicacao de custos ou efeitos;
- acompanhar um feed permitido pela sua visibilidade;
- reconectar sem perder o historico;
- encerrar a sessao;
- consultar posteriormente os eventos permitidos;
- usar esses eventos como base para estatisticas futuras.

---

# 4. Estado atual auditado

## 4.1. O que ja existe

| Area | Estado | Base atual |
|---|---|---|
| Sistemas de RPG configuraveis e versionados | `Implementado` | `SistemaRpg`, `SistemaVersao`, modulos normalizados, seed e tela administrativa. |
| Resolver central de runtime | `Implementado` | `SistemaRpgResolver` com origem, proveniencia, warnings e fallback. |
| Vinculo de Mesa com versao | `Implementado` | `Mesa.IdSistemaVersao`; Mesa Padrao acompanha a publicacao atual. |
| Fichas de personagem | `Implementado` | Recursos, atributos, defesas, inventario, proteses, skills e magias. |
| Armas, modificadores e acessorios | `Implementado parcialmente` | Estrutura tipada no frontend; calculo efetivo em `weaponModifiers.ts`. |
| Estado compartilhado da Mesa | `Implementado parcialmente` | `Mesa.AoVivo`, snapshot de personagens e presenca SignalR. |
| Atualizacao rapida de recursos | `Implementado parcialmente` | Patch de recursos regrava o JSON de status com validacao de limites. |
| Realtime | `Implementado parcialmente` | SignalR notifica invalidacao e presenca; cliente refaz a leitura autorizada. |
| Catalogos de dados e resultados | `Implementado parcialmente` | `SistemaResultadoDado` descreve dado, quantidade, faixas, natural, resultado e efeito JSON. |
| Sessao, comando e ledger | `Implementado` | `MesaSessao`, `MesaComando`, `MesaEvento` e `MesaRolagem` mantem inicio/fim, idempotencia, sequencia e imutabilidade. |
| Rolagem autoritativa | `Implementado parcialmente` | RNG do servidor para teste generico, atributo e fontes de XP; simulacao offline nao persiste. |
| Contrato de rolagem auditavel | `Implementado parcialmente` | Resultado registra dados, modo, dificuldade/faixas quando existentes, snapshot de origem, revisoes e avisos/fallbacks. Acoes de arma/item/poder ainda aguardam regras estruturadas. |
| Escritas runtime da ficha | `Implementado parcialmente` | Vida, mana, estamina, XP, defesas e inventario passam por `RevisaoRuntime`; em sessao ativa a escrita gera comando e evento na mesma transacao. Ainda faltam comandos tipados para custo, dano, condicao e equipamentos. |

## 4.2. O que ainda nao existe

Ainda nao existem no dominio, ou nao estao completos:

- encontro ou combate persistente;
- participante de combate independente da entidade Wiki;
- ordem real de iniciativa, turno e rodada;
- catalogo versionado e executavel de acoes de arma, item, skill, magia e condicao;
- aplicacao atomica de custo, dano, defesa, inventario e condicao por comandos tipados;
- cooldown e duracao executados pela engine;
- projecoes de estatistica;
- regras autoritativas de modificadores de arma e acessorio;
- execucao continua, em ambiente MariaDB, da suite de integracao que cobre concorrencia, reconexao e dois usuarios da mesma Mesa.

## 4.3. Correcoes preparatorias obrigatorias

Antes de automatizar efeitos, a Fase 0 deve tratar estes pontos verificados no codigo atual:

1. `MesaPersonagemService` omite personagens reconhecidos com vida menor ou igual a zero. Vida zero deve iniciar o fluxo configurado de **A Beira da Morte**, e nao fazer a ficha desaparecer.
2. A configuracao extensivel de morte presente em `SistemaMorteConfig.ConfiguracaoJson` precisa atravessar DTOs, mapeamentos e edicao sem perda de dados.
3. Os codigos `DEPENDENCIA_MANA` e `DEPENDENCIA_DE_MANA` estao divergentes. Deve existir um unico codigo canonico, com compatibilidade de leitura para o legado.
4. A resolucao de contexto de Personagem Jogador deve considerar a Mesa em todos os caminhos aplicaveis; hoje existe caminho que resolve personagem e raca sem repassar `IdMesa`.
5. O tipo frontend `DadoAcerto` aceita apenas `D6`, `D8` e `D20`. O contrato geral precisa suportar ao menos os dados usados pelo livro (`D4`, `D6`, `D10` e `D20`) e dados configurados pelo Sistema.
6. O calculo efetivo de modificadores de arma e acessorios existe apenas no cliente. O backend deve possuir a implementacao autoritativa e testes de paridade.
7. `acerto` em skill e magia e apenas um dado opcional e nao representa condicao de sucesso, modificadores, custos, cooldowns ou efeitos.
8. O update completo da ficha e os patches rapidos podem disputar o mesmo `StatusJson`. **Resolvido para as escritas atuais de ficha:** `RevisaoRuntime`, chave de idempotencia e transacao com evento em sessao ativa. Proximas aplicacoes devem reutilizar este caminho, nunca atualizar o JSON diretamente.
9. `MesaAoVivoSnapshot` informa `TurnoAtual = "Mestre"` de forma fixa. Isso e apenas placeholder e nao pode ser tratado como engine de turno.
10. A presenca SignalR e local e efemera. Ela nao substitui sessao, evento ou estado duravel.

Estas correcoes nao autorizam mudancas destrutivas em dados existentes. Toda migracao deve ser aditiva e possuir fallback.

---

# 5. Vocabulario canonico

| Termo | Definicao |
|---|---|
| **Sistema** | Conjunto identificavel de regras, como `ODISSEIA`. |
| **Versao** | Snapshot publicado e imutavel da configuracao de um Sistema. |
| **Mesa** | Contexto duravel de campanha, participantes, personagens e regras. |
| **Sessao** | Periodo duravel de jogo iniciado e encerrado dentro de uma Mesa. |
| **Encontro** | Contexto opcional de exploracao ou conflito dentro da sessao. |
| **Combate** | Encontro com participantes, iniciativa, turnos, rodadas e regras de combate. |
| **Participante** | Snapshot operacional de um personagem ou NPC dentro de um encontro. |
| **Ator** | Usuario autenticado que enviou o comando. |
| **Personagem controlado** | Personagem ou participante em nome do qual a acao foi solicitada. |
| **Acao** | Opcao de gameplay oferecida pelo catalogo para aquele contexto. |
| **Comando** | Intencao enviada ao servidor para calcular ou alterar algo. |
| **Evento** | Registro imutavel de algo que ocorreu ou foi registrado. |
| **Rolagem** | Evento ou simulacao que produz valores aleatorios de dados. |
| **Aplicacao** | Comando explicito que altera estado a partir de um calculo ou decisao. |
| **Simulacao** | Calculo sem persistencia e sem alteracao de estado. |
| **Registro manual** | Evento informado pelo usuario, sempre marcado como manual. |
| **Estado** | Valor real e mutavel, como vida, mana, estamina, inventario ou condicao ativa. |
| **Regra** | Configuracao imutavel da versao que interpreta ou limita o estado. |
| **Snapshot** | Copia dos dados relevantes usada para preservar o contexto historico. |
| **Revisao** | Numero monotonicamente crescente usado para detectar concorrencia. |
| **Idempotencia** | Garantia de que repetir o mesmo comando nao repete o efeito. |
| **Origem** | Indica se o evento foi automatico, manual, importado ou administrativo. |
| **Proveniencia** | Informa de onde cada regra ou modificador foi obtido. |
| **Visibilidade** | Politica que define quem pode consultar um evento. |
| **Ledger** | Historico append-only de comandos e eventos da sessao. |

Os nomes acima devem ser preferidos em entidades, DTOs, contratos e textos tecnicos. Nomes diferentes exigem justificativa clara.

---

# 6. Principios e invariantes obrigatorias

1. **O servidor e autoritativo.** O cliente envia intencao e escolhas; o servidor resolve regra, permissao, dado, modificadores e efeitos.
2. **O resultado do dado nunca e confiado ao cliente.** Rolagens automaticas usam RNG do backend.
3. **A animacao apenas representa.** O valor ja foi decidido pelo servidor antes de o dado 3D terminar de se mover.
4. **Rolar, calcular e aplicar sao conceitos separados.** Um acerto nao causa dano nem gasta recurso sem uma aplicacao prevista e autorizada.
5. **Comandos mutaveis sao transacionais, idempotentes e concorrentes.** Nao pode existir custo sem evento, evento sem custo ou efeito duplicado por retry.
6. **O historico e append-only.** Eventos nao sao editados nem apagados para reescrever o passado; correcoes geram novos eventos compensatorios e auditados quando esse fluxo existir.
7. **Manual continua manual.** Um registro digitado nunca pode parecer uma rolagem produzida pelo servidor.
8. **Somente sessao ativa persiste gameplay.** Fora dela, rolagens automaticas sao simulacoes sem evento, efeito ou estatistica.
9. **SignalR invalida; REST entrega dados.** O hub nao distribui fichas completas nem resultados privados.
10. **Regra nao e estado.** Publicar ou migrar regras nao reescreve silenciosamente vida, XP, atributos ou inventario.
11. **Nenhuma regra usa `eval`.** Expressoes executaveis sao tipadas, versionadas e limitadas por allowlist.
12. **Compatibilidade e obrigatoria.** Dados antigos devem continuar abrindo e ter fallback identificado.
13. **Ambiguidade nao vira automacao.** Enquanto nao houver decisao/configuracao, o fluxo e assistido ou manual.
14. **O mestre nao personifica silenciosamente um jogador.** Toda acao registra ator real e personagem controlado.
15. **NPC generico usa snapshot.** Uma variante inserida em sessao ou combate cria participante independente e nunca altera o NPC global da Wiki.
16. **Critico natural depende do dado bruto.** Modificadores nao transformam um valor comum em critico natural.
17. **Arredondamento segue regra configurada.** No Odisseia, valores quebrados normalmente arredondam para baixo, salvo regra especifica documentada.
18. **O cliente pode prever, mas nao decidir.** Previews visuais devem produzir o mesmo calculo do backend, que continua sendo a autoridade.
19. **Eventos preservam explicabilidade.** Todo total precisa poder ser decomposto em dados, valores mantidos e modificadores por origem.
20. **Automacao deve ser reversivel por operacao compensatoria.** Nunca por alteracao silenciosa do evento original.

---

# 7. Arquitetura alvo

## 7.1. Fluxo oficial

```text
Ficha ou Mesa
-> consulta do catalogo de acoes permitido
-> comando com chave idempotente e revisao esperada
-> autenticacao e autorizacao
-> resolucao do Sistema, versao, entidade e proveniencias
-> validacao das escolhas
-> calculo tipado da regra
-> RNG criptograficamente seguro no servidor, quando necessario
-> evento imutavel e alteracao atomica de estado, quando houver aplicacao
-> resposta com resultado e nova revisao
-> invalidacao/watermark via SignalR
-> nova projecao autorizada via REST
-> animacao visual com os valores predeterminados
```

## 7.2. Responsabilidade por camada

### Controllers

- recebem DTOs tipados;
- extraem a identidade do usuario autenticado;
- encaminham o comando;
- mapeiam resultados para HTTP;
- nao calculam regra nem acessam o banco diretamente.

### Services de aplicacao

- validam permissao e contexto;
- resolvem Sistema e versao;
- coordenam idempotencia, concorrencia e transacao;
- chamam calculadores puros;
- geram eventos;
- solicitam notificacao realtime depois do commit.

### Calculadores de regra

- recebem entradas tipadas e snapshots;
- nao acessam HTTP, UI ou banco;
- nao conhecem Entity Framework;
- retornam calculo explicavel, warnings e efeitos propostos;
- recebem os dados brutos ja produzidos pelo orquestrador e permanecem deterministas/puros.

### Resolver

- continua sendo a unica porta para contexto de Sistema;
- informa versao, origem, proveniencia, warnings e fallbacks;
- nao deve ser reconstruido por consultas paralelas em cada acao.

### Repositories

- persistem sessao, comando, evento e estado;
- fornecem operacoes atomicas e consultas filtradas;
- nao retornam DTO visual sem justificativa;
- respeitam indices e invariantes do banco.

### Frontend services e hooks

- services encapsulam endpoints;
- hooks coordenam catalogo, comando, animacao, retry e invalidacao;
- componentes apresentam estado e coletam escolhas;
- nenhum componente visual reimplementa a regra autoritativa.

## 7.3. Servicos conceituais previstos

Os nomes finais podem seguir os padroes do projeto, mas as responsabilidades devem permanecer separadas:

- `IMesaSessaoService`: ciclo de vida da sessao;
- `IGameplayActionCatalogService`: acoes permitidas para usuario e contexto;
- `IGameplayCommandService`: idempotencia, revisao, transacao e eventos;
- `IDiceRoller`: RNG autoritativo;
- `IGameplayRuleEvaluator`: despacho para calculadores tipados;
- `IWeaponRuleCalculator`: ataques, distancias e modificadores de arma;
- `IResourceEffectService`: aplicacao atomica de recursos;
- `IMesaEventRepository`: ledger e paginacao;
- `IGameplayProjectionService`: snapshots autorizados para UI;
- `IMesaRealtimeNotifier`: apenas invalidacao, sequencia e revisao.

Evitar um unico service concentrando todas as regras.

O fluxo interno correto e:

```text
RolagemSpec -> IDiceRoller -> dados brutos
dados brutos + regra + estado -> avaliador puro -> resultado/efeitos propostos
```

---

# 8. Regra, versao e contexto de execucao

## 8.1. Versao bloqueada pela sessao

Ao abrir uma sessao:

- a versao efetiva da Mesa e resolvida;
- o identificador da versao fica gravado na sessao;
- a sessao permanece nessa versao ate ser encerrada;
- publicar uma nova versao nao muda sua interpretacao;
- migrar a Mesa enquanto houver sessao ativa e bloqueado;
- cada evento registra a versao efetivamente usada;
- rascunhos nunca alimentam gameplay normal.

Overrides mecanicos da Mesa e vinculos de regra nao podem ser editados enquanto a sessao estiver ativa. Alteracoes de conteudo que nao afetam regra seguem seus fluxos normais; qualquer excecao mecanica futura deve produzir uma nova revisao/snapshot auditavel.

Para usar outra versao, o mestre encerra a sessao, executa o preview/migracao consciente ja existente e inicia uma nova sessao. A interface precisa deixar isso claro.

## 8.2. Personagem com versao diferente

Um Personagem Jogador pode possuir versao fixada diferente da versao da sessao. Ate uma politica definitiva ser aprovada:

- a divergencia deve ser detectada e exibida;
- simulacao e registro manual continuam permitidos;
- aplicacao automatica que dependa de regras incompativeis deve ser bloqueada;
- o mestre nao pode migrar a ficha silenciosamente;
- qualquer futura reconciliacao exige preview, confirmacao e evento auditavel.

Este ponto permanece uma decisao de produto pendente e deve continuar no registro de ambiguidades.

## 8.3. Snapshot e proveniencia

Eventos nao devem depender de consultar uma regra mutavel no futuro para explicar o passado. Cada evento deve guardar:

- `IdSistemaRpg` e `IdSistemaVersaoEfetiva`;
- `IdSistemaVersaoPersonagem`, quando existir e for diferente;
- codigo da regra/teste;
- versao do schema do payload;
- proveniencia dos valores relevantes;
- snapshot minimo do item, poder ou configuracao usado;
- warnings e fallbacks que influenciaram a execucao.

Nao e necessario copiar a configuracao inteira do Sistema em cada evento. Deve-se guardar apenas o necessario para auditoria e estatistica, mantendo a FK para a versao imutavel.

`MesaSessao.ContextoAberturaJson`, se utilizado, pode conter somente `schemaVersion`, origem do resolver, IDs de vinculos/overrides, warnings e proveniencias da abertura. Ele nao copia formulas nem se torna uma segunda fonte executavel de regras.

## 8.4. Fallback

Fallback existe apenas para compatibilidade. Todo resultado que use fallback deve informar isso no retorno e no evento. A interface pode usar um aviso discreto; aplicacoes destrutivas podem ser bloqueadas quando o fallback nao for seguro.

---

# 9. Sessao da Mesa

## 9.1. Entidade `MesaSessao`

Campos minimos previstos:

| Campo | Funcao |
|---|---|
| `IdMesaSessao` | Identidade da sessao. |
| `IdMesa` | Mesa proprietaria. |
| `Status` | `Ativa`, `Encerrada` ou estado tecnico futuro explicitamente definido. |
| `IdSistemaVersao` | Versao bloqueada no inicio. |
| `IdUsuarioCriacao` | Ator que iniciou. |
| `IdUsuarioEncerramento` | Ator que encerrou, quando houver. |
| `IniciadaEmUtc` | Inicio real em UTC. |
| `EncerradaEmUtc` | Fim real em UTC. |
| `RevisaoEstado` | Revisao monotonicamente crescente apenas do estado mutavel da sessao. |
| `UltimaSequenciaEvento` | Watermark do ledger. |
| `VersaoSchema` | Versao do contrato persistido da sessao. |
| `ContextoAberturaJson` | Somente IDs, origem, proveniencias e warnings da resolucao; nunca copia executavel da regra. |
| `MotivoEncerramento` | Opcional e curto; nunca substitui auditoria. |

Indices e invariantes:

- apenas uma sessao ativa por Mesa, definida exclusivamente por `Mesa.IdMesaSessaoAtiva`;
- indice de consulta por `IdMesa`, `Status` e data;
- revisao de estado e sequencia nunca diminuem, mas possuem ciclos independentes;
- sequencia de evento e unica por sessao;
- a sessao nao e excluida ao encerrar.

`Mesa` tambem deve receber `RevisaoRuntime` como concurrency token para proteger o ponteiro da sessao. Uma rolagem que apenas acrescenta evento incrementa a sequencia, mas nao a revisao de estado. A revisao de estado muda somente quando sessao, combate, turno ou outro estado compartilhado mutavel muda.

## 9.2. Ciclo de vida

### Abrir

- apenas o mestre da Mesa pode abrir pelo fluxo normal;
- uma recuperacao por administrador exige operacao administrativa separada, motivo e auditoria;
- a Mesa Padrao nao abre sessao social;
- a versao deve ser publicada ou uma versao historica arquivada ainda vinculada legitimamente a Mesa; rascunhos nunca sao aceitos;
- o backend bloqueia/atualiza condicionalmente a linha da Mesa dentro da transacao e exige `IdMesaSessaoAtiva = null` e a revisao esperada;
- se ja existir sessao ativa, o endpoint retorna a sessao existente ou conflito coerente, sem duplicar;
- criar a sessao e atribuir o ponteiro pertencem a mesma transacao; uma linha com `Status = Ativa` sem ser o ponteiro da Mesa nunca e autoridade;
- `AoVivo` deve continuar como projecao de compatibilidade da existencia de sessao ativa durante a transicao;
- abrir nao cria automaticamente combate.

### Usar e reconectar

- reinicio do servidor nao encerra sessao;
- presenca online continua efemera e separada;
- cliente reconectado consulta a sessao e eventos posteriores a sua ultima sequencia;
- o backend filtra tudo novamente por autorizacao;
- eventos ja recebidos nao devem aparecer em duplicidade.

### Encerrar

- apenas o mestre pode encerrar pelo fluxo normal;
- uma recuperacao por administrador exige operacao administrativa separada, motivo e auditoria;
- o encerramento registra ator, instante e revisao final;
- novos comandos mutaveis passam a ser rejeitados;
- limpar o ponteiro, encerrar a sessao e atualizar `AoVivo` pertencem a mesma transacao protegida pela revisao da Mesa;
- todos os participantes recebem invalidacao;
- uma acao em transito usa politica transacional explicita: ou comita integralmente antes do encerramento, ou falha integralmente;
- o comportamento exato de corrida entre comando e encerramento deve ser fechado por lock/revisao e coberto por teste.

## 9.3. Persistencia fora da sessao

Fora de uma sessao ativa:

- rolagem automatica e uma simulacao;
- nenhum `MesaEvento` e criado;
- nenhum custo, dano, defesa, XP ou condicao e aplicado pela engine;
- nenhum dado alimenta estatistica;
- registro manual persistente fica indisponivel;
- a interface deve indicar claramente `Simulacao - Mesa offline`.

---

# 10. Autorizacao, controle e privacidade

## 10.1. Papeis

| Papel | Descricao |
|---|---|
| Mestre | Criador ativo da Mesa ou papel futuro explicitamente delegado. |
| Jogador | Participante aceito na Mesa. |
| Dono do personagem | Usuario vinculado ao Personagem Jogador. |
| Controlador temporario | Papel futuro, sempre explicito e auditado. |
| Administrador | Papel global; nao deve quebrar privacidade da visualizacao compartilhada sem endpoint administrativo proprio. |
| Espectador | Nao existe hoje; permanece planejado e nao deve ser presumido. |

## 10.2. Matriz minima de permissao

| Operacao | Mestre | Dono do personagem | Outro jogador | Admin |
|---|---:|---:|---:|---:|
| Abrir/encerrar sessao | Sim | Nao | Nao | Nao implicitamente; somente recuperacao auditada |
| Rolar pelo proprio personagem | Se tambem for dono | Sim | Nao | Somente fluxo administrativo explicito |
| Aplicar custo no proprio personagem | Se autorizado como controlador | Sim | Nao | Somente fluxo administrativo explicito |
| Controlar NPC/participante do mestre | Sim | Nao | Nao | Fluxo administrativo explicito |
| Aplicar dano a alvo | Sim na fase de estado | Somente fluxo autorizado pela acao | Nao diretamente | Fluxo administrativo explicito |
| Registrar manualmente pelo proprio personagem | Se tambem for dono | Sim | Nao | Fluxo administrativo explicito |
| Ver evento publico da Mesa | Sim | Sim | Sim | Conforme acesso normal; sem bypass silencioso |
| Ver evento privado | Conforme visibilidade | Conforme visibilidade | Nao | Apenas endpoint/politica administrativa auditada |
| Corrigir estado | Sim por evento compensatorio | Nao, salvo regra explicita | Nao | Sim por evento administrativo |

O backend sempre decide permissao. Ocultar botao no frontend nao e seguranca.

IDs enviados pelo cliente identificam o alvo desejado, nunca o direito de controla-lo. O ator vem do JWT.

Toda leitura ou comando de Mesa revalida tambem a participacao atual do usuario. Ser dono historico do personagem nao basta: usuario expulso perde leitura e execucao imediatamente. O mestre so altera ficha de jogador por comando auditado da engine; o endpoint generico de patch de recursos nao ganha permissao adicional implicita.

## 10.3. Modos de visibilidade

O contrato deve suportar, de forma tipada:

- `PublicaMesa`: participantes autorizados veem o evento completo permitido;
- `MestreEAutor`: somente mestre e autor veem o resultado;
- `SomenteMestre`: autor sabe que enviou a acao, mas nao recebe o resultado oculto;
- `SomenteAutor`: uso excepcional para simulacoes privadas dentro de sessao, se aprovado;
- `Cega` e somente o rotulo de UX para `SomenteMestre`; nao e um segundo valor persistido.

O modo padrao deve vir da acao/Sistema, com escolha apenas quando permitido. Eventos privados nunca viajam completos pelo SignalR; o hub envia apenas um watermark sem conteudo sensivel.

## 10.4. Auditoria de autoridade

Todo comando/evento deve diferenciar:

- usuario ator;
- personagem controlado;
- alvo, se houver;
- permissao usada;
- origem automatica, manual ou administrativa.

Uma correcao do mestre nao pode parecer acao original do jogador.

---

# 11. Concorrencia, idempotencia e transacao

## 11.1. `MesaComando`

Campos minimos previstos:

| Campo | Funcao |
|---|---|
| `IdMesaComando` | Identidade interna. |
| `IdMesa` | Escopo duravel, inclusive para iniciar uma sessao. |
| `IdMesaSessao` | Sessao relacionada; opcional no inicio do lifecycle. |
| `ChaveIdempotencia` | UUID gerado pelo cliente para uma intencao. |
| `HashPayload` | SHA-256 de uma serializacao canonica; detecta reutilizacao da chave com conteudo diferente. |
| `IdUsuarioAtor` | Usuario autenticado. |
| `IdPersonagemJogador` | Personagem controlado, quando aplicavel. |
| `Tipo` | Codigo estavel do comando. |
| `RevisaoMesaEsperada` | Protege abertura/encerramento e o ponteiro de sessao, quando aplicavel. |
| `RevisaoSessaoEsperada` | Protege estado compartilhado mutavel, quando aplicavel. |
| `RevisaoPersonagemEsperada` | Protege a ficha alterada, quando aplicavel. |
| `RevisoesAlvosJson` | Lista tipada das revisoes esperadas de todos os outros alvos alterados. |
| `Status` | Resultado duravel do processamento, normalmente `Concluido` ou falha deterministica explicitamente persistida. |
| `RespostaJson` | Resposta tipada reutilizada em retry seguro, quando apropriado. |
| `CriadoEmUtc` / `ConcluidoEmUtc` | Auditoria temporal. |

Indice unico minimo: Mesa + ator + chave de idempotencia. Usar somente sessao falharia no comando que cria a propria sessao.

## 11.2. Comportamento idempotente

- mesma chave e mesmo payload retornam o resultado ja concluido;
- mesma chave e payload diferente retornam conflito;
- retry de rede nunca gera nova rolagem ou novo custo;
- comando falho antes de qualquer commit pode ser repetido conforme contrato;
- comando concluido nao e recalculado;
- o frontend preserva a chave enquanto tenta concluir a mesma intencao.

O comando e inserido e concluido na mesma transacao do evento/estado. `Recebido` ou `EmProcessamento` nao pode permanecer commitado nesta primeira arquitetura. Assim:

- crash antes do commit remove toda a tentativa e o retry pode processar;
- crash depois do commit e antes da resposta permite que o retry leia a resposta original;
- dois requests simultaneos com a mesma chave disputam o indice unico; o perdedor aguarda/rele o comando vencedor;
- uma falha de negocio pode ser retornada sem persistir ou ser persistida como falha deterministica tipada, mas a politica precisa ser uniforme por endpoint;
- jobs assíncronos ou outbox, se surgirem, exigem um estado e recuperador proprios e nao reutilizam implicitamente este fluxo.

## 11.3. Revisao otimista

Todo comando que altera estado informa apenas as revisoes dos agregados que realmente modifica. Se uma revisao necessaria mudou:

- o servidor retorna `409 Conflict` com revisao atual e uma mensagem curta;
- nenhuma parte do comando e aplicada;
- o cliente refaz a projecao;
- a interface pede nova confirmacao se as escolhas puderem ter mudado;
- retry automatico so e permitido quando semanticamente seguro.

Rolagens que apenas calculam registram as revisoes/snapshots avaliados, mas nao devem conflitar entre si nem incrementar revisao de estado apenas por acrescentarem eventos. A aplicacao posterior valida novamente as revisoes necessarias e a validade do resultado pendente.

## 11.4. Limite transacional

Quando uma acao for aplicada, estes passos pertencem a mesma transacao:

1. confirmar sessao ativa;
2. validar chave e revisao;
3. validar permissao;
4. ler estado e regra efetivos;
5. calcular resultado;
6. alterar o estado necessario;
7. inserir comando e eventos;
8. incrementar a sequencia e somente as revisoes dos estados realmente alterados;
9. salvar.

SignalR ocorre somente depois do commit. Uma falha de notificacao nao desfaz o estado; o cliente recupera pela proxima consulta/reconexao.

Para reduzir deadlocks, comandos que bloqueiam mais de um agregado seguem ordem fixa:

```text
Mesa -> Sessao -> Personagens/participantes em ordem crescente de ID -> demais alvos
```

O service de comando controla uma unica transacao/Unit of Work e um unico `DbContext`. Repositories usados pela engine nao podem confirmar `SaveChangesAsync` isoladamente no meio do comando. Operacoes atuais que salvam/notificam por conta propria precisam de variantes transacionais ou refatoracao localizada; a notificacao continua somente depois do commit final.

---

# 12. Ledger de eventos e estatisticas

## 12.1. `MesaEvento`

O ledger e a memoria imutavel da sessao. Campos minimos previstos:

| Campo | Funcao |
|---|---|
| `IdMesaEvento` | Identidade do evento. |
| `IdMesaSessao` | Sessao proprietaria. |
| `IdMesaComando` | Comando que o originou, quando houver. |
| `Sequencia` | Numero monotonicamente crescente na sessao. |
| `Tipo` | Codigo estavel, como `ROLAGEM_REALIZADA` ou `RECURSO_ALTERADO`. |
| `Origem` | `Automatica`, `Manual`, `Administrativa` ou origem futura documentada. |
| `Visibilidade` | Politica aplicada pelo backend. |
| `IdUsuarioAtor` | Usuario que provocou o evento. |
| `IdPersonagemJogador` | Personagem relacionado, quando houver. |
| `IdParticipanteCombate` | Participante de encontro, em fase posterior. |
| `IdSistemaRpg` / `IdSistemaVersaoEfetiva` | Regra efetivamente usada na acao. |
| `IdSistemaVersaoPersonagem` | Versao fixada da ficha quando diferente, opcional. |
| `CodigoRegra` | Identificador estavel da regra/acao. |
| `SchemaVersion` | Versao do payload. |
| `DadosJson` | Detalhes tipados e validados do evento. |
| `OcorreuEmUtc` | Instante do evento no servidor. |

Indices minimos:

- unico por `IdMesaSessao + Sequencia`;
- consulta por sessao e data;
- consulta por personagem e data;
- consulta por tipo/codigo de regra para estatisticas;
- FK para comando, sessao, ator, personagem e versao, conforme nulabilidade real.

## 12.2. Evento de rolagem

Uma rolagem deve manter campos consultaveis normalizados quando forem importantes para filtros e estatisticas, e usar JSON tipado para a decomposicao variavel. O contrato precisa guardar:

- expressao exibida;
- quantidade e faces de cada grupo de dados;
- valor de cada dado;
- dados mantidos e descartados;
- vantagem, desvantagem ou estrategia de selecao;
- valor natural relevante;
- modificadores separados por codigo, nome, valor e proveniencia;
- subtotal e total final;
- dificuldade ou faixas usadas;
- codigo e nome do resultado semantico;
- indicador de critico natural/falha critica;
- dano, defesa, cura, XP ou outro valor associado, quando informado;
- snapshot minimo da origem da acao;
- warnings/fallbacks;
- indicador manual imutavel.

Exemplo conceitual de payload:

```json
{
  "schemaVersion": 1,
  "codigoTeste": "ATAQUE_ARMA",
  "expressao": "1D20 + PRECISAO + MOD_LONGA",
  "grupos": [
    {
      "quantidade": 1,
      "faces": 20,
      "valores": [15],
      "indicesMantidos": [0],
      "indicesDescartados": []
    }
  ],
  "modificadores": [
    { "codigo": "PRECISAO", "nome": "Precisao", "valor": 1, "origem": "PERSONAGEM" },
    { "codigo": "MIRA_LONGA", "nome": "Mira", "valor": 2, "origem": "ACESSORIO" }
  ],
  "valorNatural": 15,
  "total": 18,
  "resultado": { "codigo": "ACERTO_PRECISO", "nome": "Acerto preciso" },
  "manual": false
}
```

O exemplo corrige a aritmetica: `15 + 1 + 2 = 18`. Nunca exibir uma composicao matematicamente inconsistente.

## 12.3. Tipos iniciais de evento

Codigos iniciais previstos:

- `SESSAO_INICIADA`;
- `SESSAO_ENCERRADA`;
- `ROLAGEM_REALIZADA`;
- `REGISTRO_MANUAL_CRIADO`;
- `EFEITO_APLICADO`;
- `RECURSO_ALTERADO`;
- `DANO_APLICADO`;
- `DEFESA_APLICADA`;
- `XP_CONCEDIDO`;
- `CONDICAO_APLICADA`;
- `CONDICAO_REMOVIDA`;
- `DESCANSO_REALIZADO`;
- `COMBATE_INICIADO`;
- `COMBATE_ENCERRADO`;
- `TURNO_AVANCADO`;
- `PERSONAGEM_A_BEIRA_DA_MORTE`;
- `PERSONAGEM_ESTABILIZADO`;
- `PERSONAGEM_MORTO`;
- `CORRECAO_ADMINISTRATIVA`.

Cada tipo deve possuir DTO de payload proprio ou discriminated union equivalente. Nao aceitar JSON arbitrario sem validacao.

## 12.4. `MesaAplicacaoEfeito`

Aplicar uma rolagem com outra chave idempotente nao pode repetir XP, dano, custo ou condicao. A fundacao deve possuir um registro relacional equivalente a:

| Campo | Funcao |
|---|---|
| `IdMesaAplicacaoEfeito` | Identidade da aplicacao. |
| `IdMesaSessao` | Escopo da aplicacao. |
| `IdEventoOrigem` | Rolagem/calculo que ofereceu o efeito. |
| `ChaveEfeito` | Identidade estavel do efeito dentro do resultado. |
| `TipoAlvo` / `IdAlvo` | Alvo efetivamente alterado. |
| `HashPlano` | Hash canonico do efeito/delta confirmado. |
| `IdMesaComando` | Comando idempotente que aplicou. |
| `IdEventoAplicacao` | Evento que registrou a mudanca. |
| `AplicadoEmUtc` | Auditoria temporal. |

Uma constraint unica por sessao + evento de origem + chave do efeito + alvo impede dupla aplicacao inclusive com chaves de comando diferentes. Aplicacao composta registra cada efeito ou um grupo atomico explicitamente identificado; falha parcial nao e permitida por padrao.

## 12.5. Estatisticas futuras

Na primeira implementacao:

- nao criar tabelas de total acumulado como fonte da verdade;
- salvar eventos suficientes para recalcular estatisticas;
- derivar consultas ou projecoes posteriormente;
- nunca alterar eventos antigos ao mudar uma formula estatistica;
- filtrar por personagem, sessao, intervalo, tipo, item/poder e origem;
- distinguir simulacao, automatico, manual e administrativo.

Estatisticas planejadas incluem:

- taxa de acerto por arma, skill ou magia;
- dano medio e maior dano por acerto;
- dano recebido e mitigado;
- vida, mana e estamina gastas/recuperadas por sessao;
- uso de itens e poderes;
- XP por fonte;
- criticos e falhas criticas;
- duracao de combates e participacao por turno.

Retencao definitiva, anonimização e eventuais agregados sao decisoes futuras. O ledger nao deve ser apagado automaticamente sem politica aprovada.

---

# 13. Contrato executavel de regras

## 13.1. Regra geral

Texto descritivo ajuda pessoas, mas nao pode ser executado como codigo. A engine deve consumir especificacoes tipadas, versionadas e limitadas.

Conceitos previstos:

- `TesteSpec`: o que esta sendo testado e como determinar sucesso;
- `RolagemSpec`: dados, selecao e modificadores;
- `AlvoSpec`: quem ou o que pode ser alvo;
- `CustoSpec`: recurso e momento do custo;
- `EfeitoSpec`: efeitos permitidos;
- `RecompensaSpec`: converte resultado em valor fixo, bruto, paridade ou tabela;
- `VisibilidadeSpec`: visibilidade padrao e opcoes permitidas;
- `SchemaVersion`: versao do contrato.

## 13.2. Forma conceitual de `RolagemSpec`

```text
codigo
gruposDeDados[]
  quantidade
  faces
  estrategia: somar | maior | menor | contarSucessos
modo: normal | vantagem | desvantagem
modificadoresPermitidos[]
arredondamento
limitesDeSeguranca
```

Nao e obrigatorio persistir a expressao como texto analisavel. A string `2D6 manter maior + Forca` e apenas apresentacao derivada do objeto tipado.

## 13.3. Forma conceitual de `TesteSpec`

```text
codigo
rolagem
tipoResultado: limite | faixas | oposto | contagem
dificuldade ou faixas
criticoNatural
falhaCriticaNatural
usaTotalParaFaixas
efeitosPropostos[]
```

## 13.4. Efeitos permitidos

`EfeitoSpec` usa allowlist, inicialmente:

- alterar recurso;
- registrar dano;
- registrar defesa/mitigacao;
- conceder XP;
- aplicar ou remover condicao;
- iniciar ou avancar cooldown;
- alterar movimento/PA do participante;
- registrar resultado sem alterar estado.

Cada efeito deve declarar quando ocorre:

- ao solicitar;
- ao confirmar uso;
- ao acertar;
- ao falhar;
- ao aplicar resultado;
- no inicio/fim de turno;
- no encerramento de duracao.

Automacao so e permitida quando o efeito e seus parametros estiverem estruturados. Descricao livre continua apenas informativa.

### `RecompensaSpec`

Deve cobrir por estrategias allowlisted:

- valor fixo;
- valor natural/mantido;
- paridade impar/par;
- tabela por faixa;
- contagem de sucessos;
- maior/menor dado seguido de transformacao.

Isso representa XP sem executar formula textual. O evento guarda dados, estrategia e valor final separadamente.

## 13.5. Limites de seguranca

- quantidade e faces devem ser inteiros positivos;
- limites maximos devem vir de configuracao segura do servidor;
- um comando nao pode criar quantidade ilimitada de dados ou efeitos;
- codigos desconhecidos falham com `422`, nao executam fallback perigoso;
- modificadores enviados pelo cliente sao escolhas/referencias; valores sao recalculados no servidor;
- nenhuma formula pode acessar propriedades arbitrarias por reflexao ou executar script.

## 13.6. Pipeline de modificadores

Todo modificador aplicado precisa possuir:

- codigo e identidade estavel da fonte;
- nome de exibicao;
- valor e operacao tipada;
- escopo, como acerto, dano, custo, defesa ou atributo;
- condicao de aplicacao;
- regra de acumulo;
- proveniencia;
- prioridade/ordem quando a operacao nao for simplesmente aditiva.

Fontes possiveis incluem Sistema, atributo, raca/passiva, item, arma, acessorio, skill, magia, proficiencia, condicao, Mesa e contexto autorizado pelo mestre.

Regras:

- a mesma fonte logica nao aplica duas vezes por aparecer em mais de uma projecao;
- bonus fixo, percentual e multiplicador nao compartilham ordem implicita;
- a ordem vem da especificacao publicada;
- o cliente mostra preview, mas o backend recompõe todas as fontes;
- fontes ignoradas ou incompativeis podem aparecer como warning, nunca somadas silenciosamente;
- o evento registra cada parcela e a ordem efetivamente usada.

## 13.7. Edicao administrativa

Toda nova especificacao executavel exige editor estruturado na versao em rascunho, validacao no backend, preview legivel e bloqueio de publicacao para combinacoes invalidas. Campos de formula textual continuam descritivos e nao devem ser convertidos automaticamente em regra executavel.

---

# 14. RNG e dados 3D

## 14.1. RNG autoritativo

Em producao, cada valor de dado deve usar:

```csharp
RandomNumberGenerator.GetInt32(1, faces + 1)
```

Regras:

- usar `System.Security.Cryptography.RandomNumberGenerator`;
- nunca usar `Random` compartilhado como autoridade de gameplay;
- nunca aceitar o valor sorteado pelo navegador;
- manter a ordem dos dados no payload;
- abstrair o gerador para permitir sequencias deterministicas somente em testes;
- validar `faces` antes de calcular o limite exclusivo e rejeitar qualquer valor que possa causar overflow em `faces + 1`;
- registrar valores, nao seed secreta;
- uma repeticao idempotente retorna a rolagem original.

## 14.2. Dados suportados

O Odisseia usa diretamente `D4`, `D6`, `D10` e `D20`. A engine generica deve aceitar faces configuradas dentro dos limites seguros. A camada visual pode suportar inicialmente:

- D4;
- D6;
- D8;
- D10;
- D12;
- D20;
- D100, se a biblioteca representar corretamente dezenas/unidades.

Quando nao houver modelo 3D para um dado configurado, o resultado textual/2D continua funcional.

## 14.3. Animacao 3D

A animacao e uma camada opcional:

1. o cliente solicita a rolagem;
2. o servidor retorna os valores;
3. o cliente passa valores predeterminados para a animacao;
4. o resultado textual ja esta disponivel e nao depende do canvas;
5. ao terminar, o modal destaca o mesmo resultado.

Requisitos:

- lazy loading;
- um canvas isolado por experiencia ativa, nunca um por linha de tabela;
- descarte completo de scene, renderer, listeners e recursos ao fechar;
- sem vazamento ao abrir o modal repetidamente;
- fallback imediato se WebGL falhar;
- respeito a `prefers-reduced-motion`;
- opcao de pular/reduzir animacao;
- nao bloquear aplicacao ou leitura do resultado;
- validar desempenho em dispositivos moveis reais.

`@3d-dice/dice-box-threejs` e apenas candidato para prova de conceito por aceitar resultados predeterminados e licenca MIT. Nao e dependencia aprovada ate passar pelos criterios de bundle, manutencao, suporte de dados, disposicao de recursos, React e desempenho mobile.

---

# 15. Catalogo de acoes

## 15.1. Por que o catalogo existe

O frontend nao deve deduzir sozinho quais botoes e opcoes sao validos. Um catalogo autorizado deve combinar:

- usuario e papel;
- personagem controlado;
- sessao/combate atual;
- Sistema e versao;
- estado da ficha;
- inventario, skills e magias;
- cooldowns e condicoes;
- warnings de compatibilidade.

Ele retorna acoes com codigo estavel, rotulo, origem, escolhas necessarias, disponibilidade, motivo de bloqueio e preview seguro.

## 15.2. Catalogo inicial

| Acao | Fase | Persistencia | Aplicacao automatica inicial |
|---|---:|---|---|
| Teste generico | 2 | Somente em sessao | Nao |
| Teste de atributo principal | 2 | Somente em sessao | Registra resultado |
| Teste de atributo secundario | 2 | Somente em sessao | Registra resultado |
| Teste em grupo | 2/5 | Somente em sessao | Assistido ate participantes estarem modelados |
| XP por fonte | 2 | Somente em sessao | Concessao separada e idempotente |
| Registro manual | 2 | Somente em sessao | Registra, nunca finge RNG |
| Iniciativa | 3/5 | Somente em sessao | Ordenacao apenas na fase de combate |
| Furtividade | 3/5 | Somente em sessao | Resultado; movimento depois |
| Ataque de item/arma | 3 | Somente em sessao | Calculo; dano separado |
| Skill/magia | 3 | Somente em sessao | So regras estruturadas |
| Aplicar dano/defesa/recurso | 4 | Somente em sessao | Sim, com confirmacao e revisao |
| Condicao | 4 | Somente em sessao | So duracao/efeito estruturados |
| Descanso | 4 | Somente em sessao | So regras nao ambiguas |
| Morte/estabilizacao | 4 | Somente em sessao | State machine configurada |
| Turno, cooldown, PA e movimento | 5 | Somente em combate | Sim, quando estruturado |

## 15.3. Estado de rascunho

Em criacao ou edicao de ficha ainda nao salva:

- nao criar evento de sessao;
- nao alterar estado persistido;
- permitir apenas preview/simulacao quando houver contexto suficiente;
- identificar claramente que a rolagem nao vale para historico.

---

# 16. Especificacao das acoes iniciais

## 16.1. Teste generico

O usuario escolhe uma regra generica disponivel no Sistema. Para o fallback Odisseia:

- rolar `1D6`;
- `1-3`: falha;
- `4-6`: sucesso;
- critico/falha critica so recebem efeito adicional se a configuracao declarar;
- bonus contextuais do mestre podem ser adicionados apenas por fluxo autorizado e ficam discriminados.

## 16.2. Teste de atributo individual

Entradas:

- atributo principal ou secundario;
- origem da solicitacao: jogador ou mestre;
- vantagem/desvantagem, quando permitida;
- modificadores contextuais autorizados;
- visibilidade.

Fallback Odisseia:

- `1D6 + atributo`;
- sucesso quando o total for maior que 6;
- jogador so solicita voluntariamente se o atributo efetivo for pelo menos 1;
- se o mestre solicitar e o atributo for 0, usar 1 apenas naquele teste; essa origem vem de uma solicitacao autenticada/evento do mestre ou da acao executada pelo proprio mestre, nunca de um booleano confiado ao cliente do jogador;
- natural maximo/minimo continua identificado pelo valor bruto;
- limites de uso dependem da configuracao e do contexto, pois o livro e inconsistente quanto a "por combate", "por situacao" e "por sessao".

O evento deve guardar valor real do atributo e valor efetivo usado.

## 16.3. Teste em grupo

Fallback Odisseia:

- um participante rola `1D6`;
- somar os valores do mesmo atributo de todos os participantes aceitos;
- sucesso quando o total for maior que 12;
- a dificuldade permanece 12 independentemente da quantidade de participantes.

A selecao de participantes, permissao e efeito de critico em grupo ainda exigem decisao. Ate o modelo de participantes existir, o fluxo e assistido e registra os valores informados com proveniencia.

## 16.4. Vantagem e desvantagem

- vantagem: rolar duas vezes a rolagem base e manter o resultado superior;
- desvantagem: rolar duas vezes e manter o inferior;
- todos os dados permanecem no evento;
- o payload identifica mantidos e descartados;
- bonus de vantagem/desvantagem nao deve ser representado como simples modificador numerico.

Para rolagens compostas, a estrategia exata deve vir do `RolagemSpec`, sem inferencia.

## 16.5. XP

O icone de XP abre uma acao com selecao de fonte. Fontes iniciais do Odisseia:

| Fonte | Rolagem | Conversao |
|---|---|---|
| Combate normal valido | Sem dado | `+1 XP` por combate/grupo elegivel, nao por inimigo. |
| Miniboss | `2D4` com vantagem | Dado mantido impar = 1 XP; par = 2 XP. |
| Boss | `1D4` | Valor natural e o XP. |
| Sessao sem combate | `1D4` | Valor natural para cada jogador. |
| MVP da sessao | `1D4` | Valor natural; substitui a rolagem comum de fim de sessao. |
| Missao secundaria | `1D4` | Impar = 1 XP; par = 2 XP. |
| Contrato | `2D4` com vantagem | Dado mantido impar = 1 XP; par = 2 XP. |
| Missao principal | `2D6` com vantagem | Valor do dado mantido e o XP. |

Regras obrigatorias:

- a fonte fica no evento;
- rolar e conceder XP sao passos separaveis;
- concessao e idempotente;
- excesso de XP continua para o nivel seguinte;
- curva e nivel maximo vem do Sistema;
- intervalos sobrepostos da curva devem ser resolvidos na configuracao publicada;
- a paridade com "maior dado" pode gerar uma recompensa numericamente menor; a engine nao deve trocar a regra sem decisao registrada.

## 16.6. Registro manual

O formulario inicial permite escolher:

- categoria: item, arma de fogo, arma corpo a corpo, defesa ou outro;
- entidade relacionada, quando houver;
- valor bruto informado;
- resultado final informado;
- resultado semantico opcional;
- dano, defesa, cura, XP ou outro valor opcional;
- observacao curta opcional;
- visibilidade permitida.

Validacoes:

- valores numericos finitos e dentro de limites seguros;
- entidade precisa pertencer ao personagem/contexto;
- nenhuma regra automatica e alegada;
- badge `Manual` permanente;
- nao aplica estado por padrao;
- somente sessao ativa permite salvar;
- ator e data sempre definidos pelo servidor.

## 16.7. Iniciativa

Fallback Odisseia:

- `1D6 + Agilidade + modificadores`;
- o total define a ordem;
- criterio de desempate deve ser configurado antes de automatizar a ordenacao;
- na Fase 2 pode existir apenas como rolagem registrada;
- na Fase 5 cria/atualiza a ordem do combate por comando idempotente.

## 16.8. Furtividade

Fallback Odisseia:

- `1D10 + Discricao`;
- dificuldade definida pelo mestre, normalmente entre 3 e 10;
- em movimento furtivo, o livro pede novo teste a cada 3 quadrados;
- a distancia curta de outro personagem e outras acoes podem exigir novo teste;
- equipamento altera Discricao;
- a engine nao deve revelar dificuldade ou resultado oculto quando a visibilidade nao permitir.

---

# 17. Itens, armas e acessorios

## 17.1. Campo `aplicaTeste`

O campo deve integrar o JSON tipado de atributos do item, sem nova coluna relacional apenas para essa flag, salvo necessidade comprovada de consulta global.

Compatibilidade:

- arma sem o campo: considerar `true`;
- qualquer outro tipo sem o campo: considerar `false`;
- valor explicito sempre prevalece;
- criacao de arma inicia marcado;
- criacao de outro item inicia desmarcado;
- itens legados nao devem ser regravados apenas para materializar o default.

O backend deve validar e preservar o campo; o frontend decide a exibicao pelo valor efetivo.

## 17.2. Identidade da linha

Cada item da ficha precisa de identidade estavel:

- usar ID persistido quando existir;
- rascunhos usam `clientKey` apenas localmente;
- uma acao persistente nunca referencia somente indice visual;
- reordenar inventario nao muda a entidade alvo;
- snapshots do evento preservam nome e atributos relevantes mesmo se o inventario mudar depois.

## 17.3. Arma a distancia

O modal solicita apenas escolhas aplicaveis:

- arma;
- quantidade de tiros/rajadas/ataques, limitada por cadencia e regra;
- alcance: curta, media, longa ou especial permitido;
- alvo, quando a fase suportar;
- vantagem/desvantagem e modificadores contextuais permitidos;
- visibilidade.

O servidor resolve:

- dado/faixas de acerto do arquetipo;
- atributo de acerto, normalmente Precisao para projeteis;
- modificador da arma naquela distancia;
- acessorios compativeis;
- penalidades de contexto;
- quantidade de ataques/dados segundo a regra;
- custo proposto de estamina/mana/municao, sem aplicar no primeiro MVP;
- dano por distancia como valor proposto, sem aplicar automaticamente.

## 17.4. Arma corpo a corpo

O modal exibe apenas operacoes definidas pela arma/regra:

- atacar;
- defender, somente se houver `TesteSpec` valido;
- revidar, somente se arma/efeito habilitar e houver contexto valido;
- combo/quantidade de golpes quando suportado.

Nao existe formula universal confirmada para defender ou revidar. A UI nao deve inventar botoes executaveis com base apenas no rotulo.

## 17.5. Modificadores e acessorios

Regras obrigatorias:

- modificador base da arma e acessorios sao somados uma unica vez;
- apenas campos compativeis com o modo da arma entram no calculo;
- acessorio incompativel permanece anexado/visivel, mas nao aplica seu modificador;
- dano e gasto efetivos sao derivados e nunca sobrescrevem os valores base salvos;
- cada parcela aparece separada no evento;
- o backend implementa a versao autoritativa;
- `weaponModifiers.ts` permanece preview e deve possuir testes de paridade com casos do backend;
- anexar ou remover acessorio nao destroi o modificador proprio da arma.

## 17.6. Faixas de ataque do Odisseia

Faixa padrao comum descrita no livro:

- natural 1: falha critica;
- total/faixa comum 2-10: erro;
- 11-17: acerto;
- 18-19: acerto preciso;
- natural 20: critico.

Alguns arquétipos mudam as faixas, como armas pesadas e dano em area. Portanto, as faixas devem vir de `SistemaResultadoDado`/configuracao do arquetipo, nao de um `if` global.

Natural 1 e natural 20 devem ser avaliados sobre o dado bruto. A decisao entre usar bruto ou total nas faixas intermediarias permanece configuravel e registrada na matriz de ambiguidades.

---

# 18. Skills, magias, ultimates e poderes

## 18.1. Nem todo poder rola dado

O livro possui exemplos de:

- poder sem teste;
- `D20 + Agilidade` com vantagem;
- `D6 + Agilidade`;
- teste oposto;
- defesa e reacao;
- suporte com efeito direto;
- custo diferente em sucesso e falha.

Por isso, a regra inicial "skills e magias sempre possuem dado de acerto" nao e valida. A tabela mostra o icone apenas quando existir `TesteSpec` efetivo.

## 18.2. Migracao do contrato

- `acerto?: DadoAcerto` continua como fallback legado de leitura;
- novos poderes devem aceitar `teste?: TesteSpec` tipado;
- `custo` e `cooldown` textuais continuam informativos ate existir estrutura tipada;
- efeito textual nunca e executado automaticamente;
- a tela administrativa do Sistema deve permitir configurar regras estruturadas em rascunho;
- versoes ja publicadas nao sao alteradas in-place;
- dados historicos desconhecidos sao preservados.

## 18.3. Criterio para automacao

Um poder so pode ser totalmente aplicado quando possuir:

- teste ou declaracao explicita de que nao testa;
- custo estruturado e momento do custo;
- alvo estruturado;
- resultado/efeito estruturado;
- cooldown/duracao estruturados, quando aplicaveis;
- regra publicada e valida;
- suporte do calculador correspondente.

Caso contrario, a engine rola/registra apenas a parte conhecida e deixa o restante assistido.

---

# 19. Estado, dano, defesa e recursos

## 19.1. Separacao entre calcular e aplicar

Uma rolagem retorna:

- resultado;
- efeitos propostos;
- custos propostos;
- warnings;
- token/identidade do resultado, se uma aplicacao posterior for permitida.

Aplicar exige novo comando explicito, revisao atual e autorizacao. A engine recalcula ou valida o snapshot antes de alterar o estado.

Quando a aplicacao referencia uma rolagem anterior:

- o servidor valida sessao, ator/personagem e visibilidade;
- a rolagem deve declarar quais efeitos podem ser aplicados;
- cada efeito consumivel possui identidade estavel;
- uma constraint/registro impede aplicar o mesmo efeito duas vezes, mesmo com chaves diferentes;
- estado ou revisao incompatível exige novo calculo/confirmacao;
- aplicar parcialmente varios efeitos so e permitido por contrato explicito e auditavel.

## 19.2. Fonte do estado

Enquanto nao houver migracao especifica:

- `StatusJson` continua sendo a fonte de vida, estamina, mana, defesas e outros valores da ficha;
- inventario, skills e magias continuam em suas estruturas atuais;
- a engine altera somente os caminhos necessarios;
- nunca reserializa um snapshot antigo inteiro sobre mudancas recentes;
- revisao/concurrency token protege updates completos e rapidos;
- eventos guardam antes, delta e depois dos campos alterados.

## 19.3. Recursos

Aplicacoes devem:

- resolver minimo, maximo e permissao de negativo pelo Sistema;
- aplicar delta atomicamente;
- registrar valor anterior, delta solicitado, delta efetivo e valor final;
- informar clamp quando ocorrer;
- disparar condicao configurada ao zerar apenas quando essa regra estiver valida;
- nao confiar em maximo enviado pelo cliente.

## 19.4. Defesas

O livro descreve:

- **Armadura:** absorcao por golpe e possibilidade de quebra;
- **Protecao:** reserva que recebe dano primeiro e permite transbordo;
- **Escudo:** bloqueio pontual antes de quebrar.

O livro nao define uma ordem universal quando defesas sao combinadas. Ate a configuracao publicar ordem e compatibilidades:

- calcular dano bruto e mostrar defesas disponiveis;
- permitir registro/aplicacao assistida;
- nao escolher ordem silenciosamente;
- registrar a ordem escolhida no evento.

Dano verdadeiro ignora defesas conforme regra configurada. Outros tipos de dano e resistencias precisam de matriz tipada antes de aplicacao automatica.

## 19.5. Custos de combate do Odisseia

Fallback conhecido:

- ataque melee: normalmente 10 SP por ataque;
- ataque a distancia: primeiro ataque custa 0 apenas se for a primeira acao; seguintes custam 5 SP;
- se houve acao antes do primeiro disparo, ele passa a ter o custo normal;
- movimento adicional: 5 SP por quadrado alem da acao simples inicial;
- magia/skill usa custo proprio, nao um numero universal;
- chegar a 0 SP aplica fadiga configurada;
- chegar a 0 MP aplica dependencia configurada.

O custo so deve ser automatizado quando a engine conhecer a ordem de acoes do turno. Antes da Fase 5, ele aparece como preview/confirmacao assistida.

---

# 20. Combate, turnos e movimento

## 20.1. Entidades das fases posteriores

### `MesaCombate`

Deve representar um combate dentro de uma sessao, com:

- sessao;
- status;
- rodada atual;
- participante/turno atual;
- configuracao de PA, quando habilitada;
- revisao;
- inicio e fim em UTC.

### `MesaCombateParticipante`

Deve representar o estado operacional de cada combatente:

- identidade e tipo da origem;
- snapshot de nome, imagem e variante;
- controlador autorizado;
- iniciativa e criterio de desempate;
- ordem;
- recursos/estado especificos do encontro quando necessario;
- movimento, PA e marcadores do turno;
- versao da ficha/regra;
- ativo, removido, a beira da morte, estabilizado ou morto.

NPC generico cria um participante por instancia/variante. Dano, condicao ou morte desse participante nao altera a pagina Wiki nem as outras instancias.

### `MesaCondicaoAtiva`

Deve guardar:

- codigo estavel da condicao;
- fonte, aplicador e alvo;
- turno/rodada/instante de inicio;
- duracao e unidade;
- ponto de tick;
- modificadores e efeitos tipados;
- politica de acumulo;
- visibilidade;
- versao da regra;
- encerramento e motivo.

## 20.2. Inicio e declaracao da acao

O combate comeca pela iniciativa. Antes de executar uma acao, o jogador declara, conforme aplicavel:

- acao;
- alvo;
- arma, skill ou magia;
- quantidade de ataques;
- combo;
- movimento planejado;
- custos e recursos envolvidos.

Nao se troca de arma no meio do mesmo ataque/combo sem regra especifica. Recarregar, concluir ataque/combo e certas acoes normalmente encerram o turno, mas excecoes especificas prevalecem.

## 20.3. Combo

Fallback Odisseia:

- declarado antes da rolagem;
- usa uma unica rolagem de acerto para o conjunto;
- soma dano e custos de cada ataque;
- respeita a quantidade maxima de ataques da arma/acao;
- um ataque furtivo nao permite combo;
- alterar arma ou alvo depende da regra especifica.

Aplicacao completa depende do modelo de turno e de custos. Antes disso, o modal apenas calcula e registra.

## 20.4. Movimento

Fallback Odisseia:

- cada quadrado representa 2 metros;
- o primeiro quadrado simples no inicio do turno nao gasta SP;
- cada quadrado adicional gasta 5 SP;
- limite geral de 10 quadrados/20 metros por turno;
- depois de atacar, normalmente nao se movimenta;
- efeitos como Retirada Estrategica podem permitir movimento posterior.

Sem mapa/posicao persistidos, a engine nao calcula distancia. O usuario escolhe a faixa manualmente e o evento registra essa escolha.

## 20.5. Alcances

O livro descreve:

- melee: um quadrado/encostado;
- curta: um a dois quadrados;
- media: tres a nove quadrados;
- longa: mais de dez quadrados;
- especifica: definida pela acao.

Existe sobreposicao no quadrado 1 e lacuna no quadrado 10. Nenhuma validacao posicional automatica deve usar essas faixas ate uma versao publicada resolver os limites.

## 20.6. Pontos de acao

PA e um modo contextual, nao uma regra ativa em toda cena. Fallback da tabela normativa:

| Acao | Custo |
|---|---:|
| Orçamento do turno | 10 PA |
| Duracao representada | 10 segundos por PA |
| Mover | 0,5 PA por quadrado |
| Ataque basico | 1 PA |
| Ataque especial | 2 PA |
| Investigar | 2 PA |
| Interagir | 0,5 PA |
| Usar item | 1 PA |

Os exemplos do livro usam custos diferentes para investigar e usar item. A engine segue a configuracao publicada e mantem a divergencia como observacao, sem tentar conciliar silenciosamente.

## 20.7. Dupla empunhadura

Regras conhecidas:

- somente armas de uma mao;
- exige ao menos 3 de Forca ou Agilidade;
- uma rolagem separada para cada arma;
- formula base: `1D20 + atributo - 4 + outros modificadores`;
- ataques podem ser distribuidos entre armas e alvos;
- contexto pode impor desvantagem adicional;
- custo de estamina segue a regra da acao/arma.

O exemplo concede primeiro ataque gratuito a cada arma de fogo, o que conflita com a regra geral de primeira acao do turno. Esse ponto exige configuracao antes de automacao.

## 20.8. Munição

- municao comum normalmente nao e contabilizada;
- cartuchos especiais e armas que explicitamente controlam municao sao contabilizados;
- recarregar normalmente encerra o turno;
- a engine nao cria capacidade ou gasto para arma que nao os definiu;
- gasto de municao, quando automatizado, integra a mesma transacao do comando.

## 20.9. Acerto preciso

A tabela geral do livro permite, em 18-19, escolher um efeito adicional. O catalogo precisa expor apenas efeitos validos pela regra publicada:

- `Dano adicional`: +50 de dano por ataque realizado;
- `Quebra de defesa`: ignora defesa e causa dano direto a vida;
- `Ataque preciso - perna`: movimento maximo de um quadrado por dois turnos;
- `Ataque preciso - braco`: desarma;
- `Ataque preciso - rosto`: ataques com desvantagem por um turno;
- `Retirada estrategica`: ate dois quadrados sem gasto de SP depois do ataque.

Natural 20 usa o efeito de critico da acao e nao acumula automaticamente a escolha de acerto preciso. Armas especificas podem substituir tudo isso.

## 20.10. Furtividade e ataque furtivo

Durante furtividade, novo teste pode ser exigido:

- a cada tres quadrados de movimento furtivo;
- ao entrar em curta distancia;
- ao manipular, roubar ou mover objetos;
- antes de outra acao furtiva relevante.

Ataque furtivo:

- somente contra alvo sem alerta/guarda baixa;
- apenas um ataque;
- sem combo;
- bonus furtivo nao acumula com bonus de acerto preciso;
- cabeca/pescoco: +50% do dano base entre Discricao 0-5 e +10% por nivel depois disso;
- braco/mao: desarma;
- perna/pe: limita a um quadrado por dois turnos.

O estado de alerta, a dificuldade e a permissao continuam sob decisao do mestre/configuracao.

---

# 21. Cooldown, duracao e condicoes

## 21.1. Relogio de turno

Regra conceitual do Odisseia:

- cooldown ou duracao de N turnos permanece por N ciclos completos;
- a contagem retorna ao personagem que originou o efeito;
- um efeito de dois turnos usado por A termina quando o turno de A chega no terceiro ciclo, conforme o ponto exato de expiracao configurado.

A engine deve guardar turno de origem, rodada, sequencia e momento previsto de expiracao. Nao usar timers em memoria para efeitos baseados em turno.

Tipos necessarios:

- N turnos do originador;
- N rodadas/ciclos;
- uma vez por combate;
- uma vez por sessao;
- recarga por condicao;
- recarga manual;
- custo/duracao enquanto mantido;
- duracoes diferentes em sucesso e falha.

Permanecem configuraveis: avancar fora de combate, saida do originador, inicio/fim da contagem, pausa, reaplicacao e ponto exato de expiracao.

## 21.2. Condicoes conhecidas

| Condicao | Regra conhecida | O que precisa estar configurado |
|---|---|---|
| Sangramento | Perda de HP por turno | dano, duracao, tick, cura e acumulo |
| Queimando | Perda de HP e possivel penalidade | dano, penalidade, duracao, tick e cura |
| Envenenamento | Perda de HP e possivel penalidade | dano, penalidade, duracao, antídoto e acumulo |
| Cegueira | Penaliza acoes visuais/Precisao | valor, alcance, duracao e cura |
| Lesao | Penaliza atributos e pode bloquear acoes | atributos, bloqueios, duracao e cura |
| Mal-estar | Penaliza atributos/recursos | valores, tick, duracao e cura |
| Calor/frio extremo | Pode reduzir HP/SP e atributos | valores, intervalo e protecao |
| Stun | Impede agir | duracao, tick e remocao |
| Confusao | Pode produzir acoes involuntarias | tabela de acoes; sem ela, manual |
| Medo | Restringe aproximacao e pode penalizar Precisao | fonte, penalidade, duracao e cura |
| Vicio | Testes, penalidades e abstinencia | substancia, teste, intervalos e recuperacao |
| Maldicao | Efeito narrativo amplo | integralmente definido pela origem |
| Fadiga | SP maximo -25% ate descanso normal | composicao com outros redutores |
| Dependencia de Mana | Bloqueia MP/acoes magicas por dois turnos | ponto exato de inicio/fim |
| Pesado | SP maximo -50% enquanto excede carga | composicao com Fadiga |
| A Beira da Morte | Testes de sobrevivencia | state machine e interacoes |
| Embriagado | Pode reduzir Sanidade e impor -2 | teste, acumulo, duracao e recuperacao |
| Desarmado/lentidao | Efeito de ataque preciso/origem | acumulo, imunidade e duracao |

Sem todos os campos necessarios, a condicao e apenas assistida. A engine nao interpreta sua descricao.

## 21.3. Politica de acumulo

Cada regra deve declarar uma destas politicas ou equivalente tipado:

- rejeitar nova aplicacao;
- renovar duracao;
- substituir pela mais forte;
- acumular intensidade;
- manter instancias independentes.

Ausencia de politica bloqueia automacao de reaplicacao.

---

# 22. Descanso

## 22.1. Descanso simples/curto

Regra conhecida:

- ocorre durante combate;
- personagem passa o turno sem agir;
- recupera 10 SP e 10 MP;
- pode ser repetido;
- Dependencia de Mana impede recuperacao natural de MP enquanto ativa.

O livro diverge entre recuperar no proprio turno ou no proximo. A configuracao precisa declarar `momentoDaRecuperacao` antes de a engine aplicar automaticamente.

## 22.2. Descanso normal

- fora de combate;
- dura de uma a tres horas;
- sem atividade por ao menos uma hora, recupera integralmente SP e MP;
- pode permitir caca, refeicao, reparo, ensino/aprendizado, lagrimas e outras atividades;
- com atividade, a recuperacao/custo depende da regra e do mestre;
- ao menos um personagem fica de guarda;
- guarda testa `1D6` a cada duas horas, normalmente uma vez nesse descanso;
- o guarda recupera somente 50% de SP e MP segundo o trecho aplicavel;
- cura Fadiga.

Dificuldade, encontro por falha, interrupcao e custo das atividades nao sao universais.

## 22.3. Descanso longo

- dura no minimo quatro horas;
- recupera integralmente SP e MP;
- HP so e recuperado por refeicao, item ou efeito definido;
- permite atividades do descanso normal e modificacoes de equipamento;
- exige guarda;
- guarda testa `1D6` a cada duas horas.

O redutor de recuperacao do guarda no descanso longo nao e inequivoco e deve permanecer configuravel.

## 22.4. Caca e guarda

- caca usa `1D6` no trecho atual;
- resultado natural 1 exige teste de guarda;
- demais resultados e recompensas dependem do contexto;
- nao existe tabela universal de encontro/loot;
- loot pode usar `1D8`, mas a interpretacao depende do alvo, local e historia.

Esses fluxos continuam assistidos ate existirem tabelas versionadas.

---

# 23. Morte, estabilizacao e dano extremo

## 23.1. Estados canonicos

O estado de sobrevivencia deve distinguir:

- `Normal`;
- `ABeiraDaMorte`;
- `Estabilizado`;
- `Morto`.

Vida zero sozinha nao equivale a `Morto`. O personagem permanece visivel na Mesa.

## 23.2. A Beira da Morte em combate

Fallback Odisseia:

- no inicio do turno, rolar `5D6`;
- cada D6 usa sucesso generico `4-6`;
- 0-2 sucessos: morre;
- 3-4 sucessos: sobrevive e continua a beira da morte;
- 5 sucessos: estabiliza;
- atributos nao entram;
- bonus de companheiros so entram se estruturados.

## 23.3. Fora de combate

- rolar `3D6` a cada hora;
- 0-1 sucesso: morre;
- 2 sucessos: sobrevive e continua a beira da morte;
- 3 sucessos: estabiliza.

## 23.4. Estabilizacao

Estabilizar nao retorna automaticamente ao estado normal. O personagem ainda precisa de item, magia, skill ou ajuda apropriada. A formula de bonus fornecido por companheiros nao esta definida e nao deve ser inventada.

## 23.5. Desmembramento/paralisia permanente

O livro exige simultaneamente:

- vida atual abaixo de 20% da vida base;
- dano recebido de ao menos duas vezes a vida atual;
- teste normal de Resistencia;
- na falha, novo teste/tabela para o membro afetado;
- personagem continua a beira da morte.

A tabela de membro nao existe no livro. O fluxo permanece assistido apos o teste ate uma tabela ser configurada.

## 23.6. Morte instantanea

O livro exige simultaneamente:

- vida atual abaixo de 50% da vida base;
- dano recebido de ao menos cinco vezes a vida atual;
- teste normal de Resistencia;
- na falha, morte instantanea.

## 23.7. Pontos bloqueados antes da automacao total

Precisam de decisao/configuracao:

- gatilho exato de vida para entrar a beira da morte;
- se percentuais/multiplicadores usam vida antes ou depois do dano;
- ordem entre defesa, desmembramento, morte instantanea e vida zero;
- igualdade exata a 20%/50% (o texto diz "abaixo de");
- prioridade quando desmembramento e morte instantanea qualificam juntos;
- consequencia de passar no teste de morte instantanea;
- multiplicador quando vida atual ja e zero;
- quais NPCs usam o fluxo completo;
- bonus de companheiros;
- momento de ajuda e estabilizacao.

Enquanto bloqueado, a engine detecta candidatos, alerta o mestre e registra a decisao manual.

---

# 24. Experiencia de interface

## 24.1. Componentes compartilhados

Criar componentes reutilizaveis, sem duplicar modal e logica por tela:

- `DiceActionLauncher`: botao/icone que abre uma acao;
- `DiceActionModal`: configuracao, rolagem, resultado e aplicacao;
- `DiceResult3D`: adaptador opcional da animacao;
- `DiceBreakdown`: dados, modificadores, total e resultado;
- `GameplayHistory`: feed paginado por sequencia;
- `GameplayVisibilitySelector`: apenas quando a acao permitir;
- `GameplayApplyConfirmation`: efeitos/custos propostos e confirmacao.

Os nomes podem ser ajustados ao padrao final de pastas, mas as responsabilidades nao devem ser copiadas entre ficha, Mesa e tabelas.

## 24.2. Pontos de entrada na ficha

- icone de dado associado ao titulo de **Principais**;
- icone de dado associado ao titulo de **Secundarios**;
- icone no canto direito do XP;
- primeira coluna da tabela de itens apenas quando `aplicaTeste` efetivo for `true`;
- primeira coluna de skills e magias apenas quando houver `TesteSpec` efetivo;
- botao de registro manual quando houver sessao ativa;
- estado desabilitado/identificado para simulacao fora da sessao.

Ao estender `DataTable`, a coluna inicial deve ser opcional e generica. Nao criar hacks especificos dentro de cada tabela.

## 24.3. Central de acoes da Mesa

A pagina de Mesa em jogo deve ganhar uma area de gameplay, sem substituir a ficha:

- sessao atual;
- Central de acoes rapidas;
- historico autorizado;
- status de conexao/reconexao;
- combate/turno quando a Fase 5 existir;
- controles de mestre separados dos controles do jogador.
- rolagens oficiais de outros participantes aparecem automaticamente sobre a ficha apenas depois do evento ser persistido e autorizado.

Desktop pode usar painel/drawer lateral. Em mobile, usar sheet ou tela cheia e cards empilhados.

## 24.4. Estados do modal

O modal deve possuir estados explicitos:

1. `Configurando`: usuario escolhe atributo, distancia, quantidade, alvo etc.;
2. `Enviando`: comando bloqueado contra duplo clique, mantendo a chave;
3. `Animando`: resposta ja existe e a animacao pode ser pulada;
4. `Resultado`: mostra dado, total, classificacao e explicacao;
5. `AguardandoAplicacao`: apresenta custos/efeitos propostos;
6. `Aplicando`: novo comando com revisao atual;
7. `Conflito`: informa mudanca de estado e oferece recarregar/revisar;
8. `Erro`: mensagem curta, especifica e recuperavel.

O resultado nao desaparece ao fim da animacao. Fechar/reabrir pode recuperar o evento quando persistido.

## 24.5. Apresentacao do resultado

Mostrar, nessa ordem:

- resultado semantico e icone;
- valor natural ou dados mantidos;
- modificadores por origem;
- total;
- efeito/custo proposto;
- badge `Simulacao`, `Manual`, `Privado` ou warning, quando aplicavel.

Verde/vermelho pode reforcar sucesso/falha, mas texto e icone sao obrigatorios. Resultados como acerto preciso, critico, empate ou parcial nao podem ser reduzidos a binario.

## 24.6. Responsividade

- modal cabe entre navbar e viewport sem gap ou recorte;
- em celular, conteudo alto rola a pagina/modal, sem prender gesto em canvas;
- canvas 3D nao captura scroll fora de sua area de interacao;
- botoes possuem area de toque adequada;
- nenhuma acao depende apenas de hover;
- tabelas podem virar cards sem perder o lancador;
- labels, totais e badges nao se sobrepoem;
- desktop, tablet e celular compartilham a mesma regra e contratos.

## 24.7. Acessibilidade e estabilidade visual

- foco fica preso no modal e retorna ao acionador ao fechar;
- fechar por teclado funciona conforme o componente padrao;
- controles possuem nome acessivel;
- historico usa `role="log"` e atualizacoes discretas com `aria-live="polite"`;
- animacao respeita `prefers-reduced-motion`;
- nao usar flashes, mudancas bruscas de background ou remount da tela para animar;
- fontes e assets devem estar carregados sem tornar texto transparente;
- loading usa texto curto e sempre visivel;
- falha do 3D nao causa tela de erro;
- toast fica reservado a erro ou confirmacao relevante, nao a cada rolagem.

## 24.8. Padrao visual

Reutilizar modal, botoes, inputs, select pesquisavel, frame/HUD, tipografia, neon e espacamentos existentes. Uma referencia visual nao autoriza criar um segundo design system. Novas bordas e animacoes devem seguir o guia de SVG do projeto e os componentes ja corrigidos.

---

# 25. Contratos HTTP planejados

As rotas finais devem respeitar o padrao do projeto. A proposta canonica inicial e:

```text
GET  /api/mesas/{mesaId}/sessoes/atual
POST /api/mesas/{mesaId}/sessoes/iniciar
POST /api/mesas/{mesaId}/sessoes/{sessaoId}/encerrar

GET  /api/mesas/{mesaId}/personagens/{personagemId}/acoes
GET  /api/mesas/{mesaId}/sessoes/{sessaoId}/eventos?cursor={cursorOpaco}&limite={n}
GET  /api/mesas/{mesaId}/sessoes/{sessaoId}/eventos/{eventoId}

POST /api/mesas/{mesaId}/sessoes/{sessaoId}/rolagens
POST /api/mesas/{mesaId}/sessoes/{sessaoId}/registros-manuais
POST /api/mesas/{mesaId}/sessoes/{sessaoId}/aplicacoes

POST /api/personagens-jogador/{personagemId}/rolagens/simular
```

## 25.1. Envelope de escrita

Toda escrita de gameplay deve conter:

```text
chaveIdempotencia
revisaoSessaoEsperada
revisaoPersonagemEsperada, quando aplicavel
codigoAcao
parametros tipados da acao
visibilidade solicitada, quando permitida
```

O servidor deriva usuario, papeis, Sistema, versao e valores efetivos.

## 25.2. Resposta de comando

Deve informar:

- comando/evento criado;
- se foi replay idempotente;
- revisoes atuais;
- ultima sequencia;
- rolagem e decomposicao;
- efeitos/custos propostos;
- deltas aplicados, quando for comando de aplicacao;
- warnings e fallbacks;
- permissao de aplicar;
- representacao segura segundo a visibilidade.

## 25.3. Erros

| HTTP | Uso |
|---:|---|
| `400` | Contrato malformado ou parametro invalido basico. |
| `401` | Usuario nao autenticado. |
| `403` | Sem permissao para Mesa, personagem, acao ou visibilidade. |
| `404` | Recurso inexistente ou ocultado por seguranca. |
| `409` | Revisao, idempotencia, sessao ou versao em conflito. |
| `422` | Acao reconhecida, mas regra/estado nao permite executar. |
| `429` | Limite de abuso excedido, quando configurado. |
| `500` | Falha inesperada com `traceId`, sem expor detalhe interno. |

Mensagens ao usuario devem ser curtas e especificas. O frontend usa codigos estaveis para decidir recarregar, revisar ou tentar novamente. Toda falha usa `ProblemDetails` e inclui, conforme o caso:

- `code` estavel e `traceId`;
- revisoes atuais em conflitos `409`;
- `retryAfter` em `429`;
- mapa de campos invalidos em erros de validacao.

## 25.4. Paginacao do historico

- usar cursor opaco, nunca offset nem sequencia fornecida pelo cliente como contrato publico;
- filtrar visibilidade sem impedir que o cursor avance sobre linhas ocultas;
- retornar `proximoCursor`, `cursorExaminadoAte` e `haMais`;
- o cliente nao interpreta saltos entre sequencias visiveis como perda, pois eventos privados criam lacunas legitimas;
- evento desconhecido deve ser preservado/ignorado graciosamente por clientes antigos.

## 25.5. Contratos proibidos

- endpoint que aceite `tipo` arbitrario + JSON nao validado;
- endpoint que aceite resultado automatico sorteado pelo cliente;
- endpoint que aplique delta sem revisao e idempotencia;
- endpoint que exponha evento de outra Mesa por ID sequencial;
- endpoint que confunda simulacao offline com evento oficial.

---

# 26. Realtime e recuperacao

## 26.1. Payload de invalidacao

O novo watermark pode conter apenas:

```text
idMesa
idMesaSessao
revisaoSessao
ultimaSequenciaEvento
atualizadoEmUtc
```

Nao incluir personagem, alvo, dado, resultado ou conteudo privado. O evento atual `MesaInvalidada` pode evoluir mantendo essa propriedade de privacidade.

## 26.2. Comportamento do cliente

- ignorar watermark antigo ou repetido;
- buscar eventos a partir do ultimo cursor opaco confirmado;
- refazer snapshot completo apenas quando o servidor invalidar o cursor ou indicar ressincronizacao;
- deduplicar pelo ID/sequencia, sem exigir adjacencia entre eventos visiveis;
- animar somente novos eventos automaticos de rolagem recebidos durante a sessao; carga inicial, reconexao e historico antigo nao repetem animacoes;
- nao repetir no cliente autor a animacao que ele proprio ja iniciou;
- invalidar catalogo quando revisao da sessao ou personagem mudar;
- manter polling como recuperacao;
- ao reconectar, consultar REST antes de assumir estado;
- tratar servidor gratuito adormecido sem perder comando ja confirmado.

## 26.3. Independencia do processo

Correto funcionamento nao pode depender de:

- `MesaPresenceTracker`;
- memoria do processo;
- timeout local do servidor;
- conexao SignalR continua;
- instancia unica do Render.

Presenca pode continuar efemera. Sessao, comandos, turnos, duracoes e eventos precisam ser duraveis. Expiracao por turno ocorre ao avancar turno; expiracao temporal usa timestamps UTC e e reavaliada.

O watermark global do SignalR serve apenas para avisar que uma nova leitura REST pode ser necessaria; ele nunca permite inferir que uma sequencia invisivel ao usuario esta faltando. Com uma instancia, o transporte atual atende ao realtime. Com varias instancias, sera necessario backplane (por exemplo Redis/Azure SignalR) e presenca distribuida; a correcao do gameplay continua independente disso por usar banco e polling como autoridade.

---

# 27. Persistencia, migrations e compatibilidade

## 27.1. Migration da fundacao

A fundacao deve adicionar, de forma aditiva:

- `MesaSessao`;
- `MesaComando`;
- `MesaEvento`;
- detalhe normalizado `MesaRolagem` ou estrutura equivalente um-para-um;
- `MesaAplicacaoEfeito`, antes de habilitar qualquer mutacao derivada de resultado;
- `Mesa.IdMesaSessaoAtiva`, FK opcional, para garantir o ponteiro canonico;
- `Mesa.RevisaoRuntime`, token numerico de concorrencia do lifecycle;
- `PersonagemJogador.RevisaoRuntime`, token numerico de concorrencia;
- indices, FKs, constraints e versoes de schema.

`MesaSessao.RevisaoEstado` protege apenas estado compartilhado mutavel; `MesaSessao.UltimaSequenciaEvento` aloca o ledger independentemente. `PersonagemJogador.RevisaoRuntime` protege a ficha em comandos e edicoes comuns.

Nao remover nem substituir os JSONs atuais nesta fase.

## 27.2. Compatibilidade de `AoVivo`

Durante a transicao:

- iniciar sessao define o ponteiro ativo e `AoVivo = true` na mesma transacao;
- encerrar limpa o ponteiro e define `AoVivo = false`;
- o endpoint legado `PUT /api/Mesa/{id}/ao-vivo` delega ao mesmo lifecycle: `true` inicia ou retorna a atual; `false` encerra ou nao faz nada se ja estiver encerrada;
- nenhuma escrita direta de `AoVivo` permanece depois da ativacao da fundacao;
- leituras novas priorizam a sessao ativa;
- Mesa legada com `AoVivo = true` e sem sessao continua visivel no fluxo antigo, mas nao aceita persistencia da engine;
- o mestre precisa desligar e iniciar uma sessao real para habilitar o ledger;
- nenhum historico retroativo e fabricado;
- `AoVivo` so pode ser removido em migration futura, depois de todos os consumidores migrarem.

## 27.3. Concorrencia da ficha

A revisao deve participar de:

- update completo;
- atualizacao rapida de recursos;
- XP;
- dano e defesa;
- condicoes;
- inventario quando afetado por gameplay;
- qualquer comando futuro que altere a ficha.

O backend altera apenas propriedades conhecidas no JSON e preserva campos desconhecidos. Nao aceitar JSON Patch arbitrario do cliente.

## 27.4. Identidades internas em JSON

Linhas de inventario, skills e magias precisam de UUID/ID estavel persistido. `idItemBase` identifica o catalogo e `idInstancia` identifica a linha concreta da ficha; skill e magia tambem recebem identidade concreta propria. Antes de devolver o primeiro catalogo de acoes, o backend atualiza entradas legadas sem ID em uma transacao protegida pela revisao da ficha. Dividir uma pilha cria novo `idInstancia`; reordenar ou editar preserva o ID existente. Nome e indice nunca sao identidade.

## 27.5. Delete behavior e retencao

- encerrar sessao nao apaga historico;
- excluir Mesa pode remover em cascata o ledger estritamente pertencente a ela, seguindo o fluxo de exclusao aprovado;
- excluir usuario preserva o historico mecanico, anulando FK e exibindo `Usuario removido`;
- nao copiar e-mail, celular ou nickname para snapshots de evento;
- excluir personagem preserva o evento e apenas o nome mecanico minimo quando necessario;
- referencias a `SistemaVersao` usam `Restrict` enquanto houver sessao/evento;
- a FK `MesaSessao -> Mesa` usa `Cascade`; o ponteiro `Mesa.IdMesaSessaoAtiva` usa `SetNull`/`Restrict` e e limpo antes de excluir, evitando ciclo de cascade;
- FKs historicas para usuario/personagem sao opcionais e usam `SetNull`; snapshots, `RespostaJson` e logs nunca carregam e-mail, celular ou nickname;
- comandos, eventos e sessoes usam `BIGINT`/`long`;
- `MesaEvento` e `MesaRolagem` nao possuem update/delete no repository; o `DbContext` rejeita alteracao ou exclusao fora da migration/retencao aprovada;
- datas sao UTC;
- politica definitiva de retencao ainda precisa ser aprovada.

## 27.6. Ordem de deploy

1. adicionar revisoes e devolve-las nas leituras sem exigi-las;
2. publicar o frontend que envia revisoes e tolera a ausencia da engine;
3. monitorar clientes e compatibilidade;
4. passar a exigir revisoes;
5. habilitar os comandos mutaveis da engine de forma gradual;
6. remover fallback apenas em entrega futura especifica.

Rollback nao pode apagar eventos ja validos. Se a UI nova for desativada, o backend deve continuar lendo o ledger criado.

---

# 28. Seguranca e integridade

## 28.1. Regras obrigatorias

- CSPRNG no servidor;
- autenticacao em toda operacao de Mesa/sessao;
- autorizacao por Mesa, personagem, acao e visibilidade;
- limites para quantidade de dados, faces, payload e frequencia;
- hash canonico do payload de idempotencia;
- validacao de IDs e pertencimento;
- nenhuma confianca em total, bonus, custo, versao ou dono enviados pelo cliente;
- textos sanitizados antes de exibicao;
- historico imutavel;
- badge manual impossivel de remover;
- filtros de privacidade antes da paginacao;
- protecao contra enumeracao de evento;
- ator real sempre auditado;
- segredos e payloads privados fora dos logs.

## 28.2. Limites e rate limiting

Valores iniciais configuraveis do servidor, a serem ajustados por telemetria:

- ate 8 grupos, 100 dados totais e 2 a 1.000 faces por dado;
- ate 32 modificadores e 32 efeitos propostos por comando;
- observacao de ate 300 caracteres e texto manual de ate 500;
- request JSON de ate 64 KiB e evento JSON de ate 128 KiB;
- historico com 30 itens por padrao e no maximo 100;
- 30 rolagens persistentes/minuto por usuario e Mesa;
- 20 registros manuais/minuto por usuario e Mesa;
- 60 simulacoes/minuto por usuario;
- 10 operacoes de lifecycle/minuto por usuario e Mesa;
- 120 leituras de historico/minuto por usuario e Mesa.

Idempotencia e consultada antes de consumir o limite: repetir a mesma chave/payload retorna o resultado original sem parecer nova acao. Os limites devem distinguir simulacao, persistencia, historico, lifecycle e polling. Respostas `429` informam `retryAfter` sem expor detalhes internos.

## 28.3. Administracao

O papel Admin nao significa assumir silenciosamente a identidade do mestre ou jogador. Recuperacao tecnica deve usar operacao administrativa explicita, motivo obrigatorio e evento auditavel. Endpoints normais de gameplay continuam validando o papel real na Mesa.

---

# 29. Observabilidade

Logs estruturados devem correlacionar, quando aplicavel:

- `traceId`;
- `idMesa`;
- `idMesaSessao`;
- `idMesaComando`;
- sequencia do evento;
- tipo/codigo da acao;
- ID interno do ator;
- latencia total e por etapa;
- replay idempotente;
- conflito de revisao;
- falha de autorizacao;
- falha de regra/validacao;
- falha de RNG;
- rollback/persistencia;
- falha de SignalR;
- reconexao e lacuna recuperada.

Nao registrar:

- JWT;
- e-mail ou telefone;
- conteudo narrativo privado sem necessidade;
- payload completo de evento privado;
- senha, token ou segredo;
- detalhes internos em resposta ao usuario.

Metricas desejaveis:

- comandos por tipo;
- taxa de sucesso/erro/conflito;
- latencia p50/p95;
- retries/replays;
- falhas de animacao apenas no cliente;
- lacunas recuperadas;
- tamanho do ledger por sessao;
- consultas e tempo de paginacao.

---

# 30. Desempenho

- carregar historico por cursor e limite;
- evitar trazer `StatusJson` completo quando a projecao pede apenas resumo;
- consultar catalogo por personagem/contexto e invalidar por revisao;
- indexar sessao, sequencia, personagem, tipo e data;
- evitar N+1 ao montar feed;
- nao carregar biblioteca 3D no bundle inicial;
- nao remountar pagina/background para atualizar resultado;
- manter polling moderado e suspender quando apropriado;
- permitir funcionamento sem SignalR e sem WebGL;
- testar concorrencia e constraints em MySQL/MariaDB real, nao apenas EF InMemory.

---

# 31. Matriz canonica das regras do Odisseia

As paginas abaixo sao as paginas fisicas do PDF de 63 paginas, nao a numeracao interna dos capitulos. A configuracao publicada continua sendo a fonte executavel; esta matriz define o fallback e as lacunas conhecidas.

| Dominio | Regra/fallback confirmado | Fonte aproximada | Automacao |
|---|---|---:|---|
| Regra especifica | Regra de item, poder ou efeito prevalece sobre regra geral | 4-6 | `Decidido` |
| Arredondamento | Fracao arredonda para baixo, salvo regra explicita | 5-6 | `Decidido` |
| Teste generico | `1D6`; 1-3 falha, 4-6 sucesso | 4-6 | Fase 2 |
| Atributo individual | `1D6 + atributo > 6` | 17-22 | Fase 2 |
| Atributo zero voluntario | Jogador nao pode solicitar | 17-18 | Fase 2 |
| Atributo zero pelo mestre | Testa considerando atributo 1 | 17-18 | Fase 2 |
| Atributo em grupo | um `D6 + soma do mesmo atributo > 12` | 17-18 | Assistido na Fase 2; pleno na 5 |
| Vantagem/desvantagem | dois dados, mantem maior/menor | 5-6 | Fase 2 |
| Critico | maior/menor face natural; modificador nao cria natural | 4-6 | Fase 2 |
| Ameaca x Coragem | pre-requisito por niveis; ambos `D6 + atributo`; empate favorece Coragem | 22 | Planejado/TesteSpec oposto |
| Sanidade 2 | personagem apto e obrigado a atacar por turno | 22 | Fase 4/5 |
| Sanidade 1 | `1D4`; impar ataca aliado mais proximo, par escolhe inimigo | 22 | Bloqueado por alvo/contexto |
| Sanidade 0 | nao age; depois do primeiro turno faz teste generico por turno e recupera 1 em sucesso ate a base | 22 | Fase 4/5 |
| Inteligencia | patamar permite conhecimento; depois `1D6 + Inteligencia > 6`; valor 0 impoe restricoes descritas | 22 | Assistido ate catalogo de patamares |
| Proficiencias | normalmente `1D6 + atributo`, com criticos/limites especificos da proficiencia | 23-26 | `TesteSpec` por entrada |
| Iniciativa | `1D6 + Agilidade + modificadores` | 32-34 | Registro na 2; ordem na 5 |
| Furtividade | `1D10 + Discricao` contra dificuldade do mestre | 33-34 | Fase 3/5 |
| Loot | `1D8`; interpretacao depende de local, alvo e historia | 43 | Assistido |
| Caca | `1D6`; natural 1 exige teste de guarda | 43 | Assistido |
| Ataque comum | `1D20 + atributo + modificadores`; tabela normalmente 1 / 2-10 / 11-17 / 18-19 / 20 | 33-41 | Fase 3 |
| Atributo de ataque | projeteis: Precisao; melee cortante: Agilidade; impacto: Forca; magia pura pode usar Sabedoria | 18-21, 33-40 | Configuravel por acao |
| Fortalecer dano | normalmente +50% quando teste/cerne aplicavel tiver sucesso | 18-21 | Bloqueado por especificacao completa |
| Grid | 2 m por quadrado | 28-30 | Fase 5 |
| Movimento | primeiro quadrado gratis; +5 SP por adicional; maximo 10 | 28-30 | Fase 5 |
| Melee | normalmente 10 SP por ataque | 29-31 | Fase 5 |
| Distancia | primeiro ataque 0 SP se primeira acao; seguintes 5 SP | 29-31 | Fase 5 |
| Combo | declarar antes; uma rolagem; soma danos/custos | 29-35 | Fase 5 |
| PA | 10 PA; 10 s/PA; custos da tabela | 32 | Fase 5, configuravel |
| Cooldown/duracao | completa N ciclos e expira ao retornar ao originador | 4, 34 | Fase 5 |
| Armadura | absorcao por impacto e quebra conforme origem | 36 | Assistido ate durabilidade |
| Protecao | pool anterior a vida, com transbordo | 36 | Fase 4, apos ordem definida |
| Escudo | bloqueia um dano e quebra | 36 | Fase 4, quando item definir ativacao |
| Tipos de dano | cortante, impacto de projetil, perfuracao, continuo, impacto, magico, area, verdadeiro e queda | 37 | Fase 4 |
| Dano verdadeiro | ignora defesas | 37 | Fase 4 |
| Magias | regra, custo, alcance e teste variam por entrada | 37-40 | `TesteSpec`/`EfeitoSpec` |
| Skills/Ult/Éter | regra, custo, cooldown e teste variam por entrada | 38-40 | `TesteSpec`/`EfeitoSpec` |
| XP combate comum | +1 por combate/grupo valido, nao por inimigo | 27-28 | Fase 2 |
| XP miniboss | `2D4` vantagem; impar 1, par 2 | 27-28 | Fase 2, com warning de paridade |
| XP boss | `1D4`, valor natural | 27-28 | Fase 2 |
| XP sessao sem combate | `1D4` para cada jogador | 27-28 | Fase 2 |
| XP sessao com combate | somente MVP recebe XP final de sessao | 27-28 | Fase 2 |
| XP MVP | `1D4`, valor natural, acumulavel com combate/missao | 27-28 | Fase 2 |
| XP missao secundaria | `1D4`; impar 1, par 2 | 27-28 | Fase 2 |
| XP contrato | `2D4` vantagem; impar 1, par 2 | 27-28 | Fase 2, com warning de paridade |
| XP missao principal | `2D6` mantendo maior; valor mantido | 27-28 | Fase 2 |
| Progressao | nivel 1-20, overflow de XP, curvas 10/20/25/30/40 | 27-28 | Curva publicada |
| Marcos | Ult 7, passiva 10, proficiencia 13, Maestria Tatica 16, Maestria 20 | 28 | Planejado |
| Aumento por atributo | Resistencia/Agilidade/Sabedoria aumentam HP/SP/MP de forma composta ao evoluir, nao na criacao | 18-21 | Bloqueado para maximo/corrente |
| Fadiga | SP zero reduz SP maximo em 25% ate descanso normal | 29-31, 41-43 | Fase 4 |
| Dependencia de Mana | MP zero bloqueia uso/recuperacao natural por dois turnos | 31, 41-43 | Fase 4/5 |
| Excesso de carga | acima do limite reduz SP maximo em 50% | 31 | Fase 4 |
| Condicoes | efeitos e duracoes definidos pela condicao/origem | 41-43 | Fase 4 quando estruturadas |
| Descanso simples | passa turno; recupera 10 SP e 10 MP | 29, 43 | Bloqueado pelo momento da recuperacao |
| Descanso normal | 1-3 h; recuperacao/atividades/guarda | 43 | Fase 4 assistida |
| Descanso longo | 4 h ou mais; SP/MP completos; guarda | 43 | Fase 4 assistida |
| Morte em combate | `5D6`; 3+ sobrevive; todos estabilizam | 44-45 | Fase 4 |
| Morte fora de combate | `3D6` por hora; maioria sobrevive; todos estabilizam | 44-45 | Fase 4 |
| Desmembramento | vida abaixo de 20%, dano >= 2x vida atual e teste de Resistencia | 44-45 | Assistido sem tabela de membro |
| Morte instantanea | vida abaixo de 50%, dano >= 5x vida atual e teste de Resistencia | 44-45 | Bloqueado pela ordem de avaliacao |

## 31.1. Ordem geral de calculo

Salvo regra especifica:

1. validar pre-requisitos e permissao;
2. gerar resultados naturais;
3. aplicar vantagem/desvantagem e selecionar dados;
4. aplicar atributo e modificadores estruturados;
5. aplicar bonus/penalidades contextuais autorizados;
6. arredondar conforme a regra;
7. classificar o resultado;
8. produzir efeitos e custos propostos;
9. aplicar apenas por comando permitido e explicito.

## 31.2. Regra especifica prevalece

Itens, armas, proficiencias, passivas, skills, magias, condicoes e efeitos podem substituir regras gerais. A substituicao so e executavel quando estiver estruturada e publicada; texto narrativo nao e suficiente.

---

# 32. Registro formal de ambiguidades

Toda ambiguidade fica aberta ate receber decisao de produto e configuracao versionada. `Comportamento seguro` nao significa regra definitiva; significa como evitar dano enquanto a decisao nao existe.

| ID | Ambiguidade | Comportamento seguro temporario | Estado |
|---|---|---|---|
| `GE-A001` | Atributo principal aparece como uma vez por combate/situacao e tambem por sessao | Limite vem da versao; sem campo, registrar uso sem bloquear automaticamente | Aberta |
| `GE-A002` | Atributos secundarios podem ser usados "mais vezes", sem limite numerico | Mestre decide; engine apenas registra | Aberta |
| `GE-A003` | Faixas intermediarias do D20 usam natural ou total modificado | `usaTotalParaFaixas` obrigatorio na regra executavel | Aberta |
| `GE-A004` | Natural 1/20 continua falha/critico diante de bonus ou penalidade extrema | Identificar natural separadamente; efeito vem da tabela publicada | Aberta |
| `GE-A005` | Curta inclui quadrado 1 e longa deixa o quadrado 10 sem faixa | Selecao manual; validacao posicional bloqueada | Aberta |
| `GE-A006` | Empate entre furtividade e dificuldade | Mestre/configuracao decide | Aberta |
| `GE-A007` | Descanso simples recupera agora ou no proximo turno | Exigir `momentoDaRecuperacao`; sem ele, apenas preview | Aberta |
| `GE-A008` | Fadiga -25% e carga -50%: aditivo, multiplicativo ou maior prevalece | Mostrar ambos; mestre aplica manualmente | Aberta |
| `GE-A009` | Dupla empunhadura concede primeiro disparo gratuito por arma ou apenas primeira acao | Custo assistido ate regra especifica | Aberta |
| `GE-A010` | Ordem entre escudo, protecao e armadura | Mestre escolhe e evento registra; sem autoaplicacao | Aberta |
| `GE-A011` | Durabilidade e quebra universal de armadura | Usar apenas valor definido pelo item/regra | Aberta |
| `GE-A012` | Formula universal de revidar, defender e contra-atacar | Nao oferecer como acao automatica sem `TesteSpec` | Aberta |
| `GE-A013` | Custo em erro, cancelamento ou alvo invalido | `CustoSpec` declara o momento; sem ele, nao aplicar | Aberta |
| `GE-A014` | Cooldown fora de combate, saida do ator, inicio/fim e reaplicacao | Assistido ate campos estruturados | Aberta |
| `GE-A015` | Tick e acumulo de condicoes | Exigir politica por condicao | Aberta |
| `GE-A016` | Dano de queda diz triplicar, mas 16 m aparece como 2100 em vez de 2700 | Apenas tabela explicitamente configurada e executavel | Aberta |
| `GE-A017` | Curva de XP sobrepoe niveis 7, 10, 13 e 16 | Usar faixas normalizadas publicadas, nunca texto | Aberta |
| `GE-A018` | Vantagem + paridade pode manter dado maior que concede menos XP | Preservar regra configurada e mostrar warning | Aberta |
| `GE-A019` | Relacao exata de MVP com sessao sem combate e outros ganhos | Fonte escolhida/confirmada pelo mestre | Aberta |
| `GE-A020` | Tabela de PA e exemplos possuem custos diferentes; "maior acao" e pouco definido | Versao segue tabela publicada; cena habilita PA explicitamente | Aberta |
| `GE-A021` | Ordem de bonus fixo, percentual, multiplicador, resistencia e defesa | Sem aplicacao total ate pipeline tipado | Aberta |
| `GE-A022` | Bonus de companheiros nos testes de morte | Nao aplicar bonus sem efeito estruturado | Aberta |
| `GE-A023` | Ordem entre dano, defesa, desmembramento, morte instantanea e vida zero | Detectar candidatos e pedir decisao do mestre | Aberta |
| `GE-A024` | Aumento por atributo altera apenas maximo ou tambem recurso atual | Nao aplicar automaticamente ao subir atributo | Aberta |
| `GE-A025` | Recuperacao do guarda em descanso longo | Registrar descanso e aplicar manualmente | Aberta |
| `GE-A026` | Interrupcao de descanso e falha no teste de guarda | Mestre decide; evento registra | Aberta |
| `GE-A027` | Retencao definitiva do historico | Preservar por padrao; nenhuma limpeza automatica | Aberta |
| `GE-A028` | Politica final para ficha e sessao em versoes diferentes | Permitir simulacao/manual; bloquear mutacao incompatível | Aberta |
| `GE-A029` | Biblioteca 3D definitiva | Fallback textual; candidato depende de PoC | Aberta |
| `GE-A030` | Papel e permissoes de espectador | Nao existe ate ser modelado | Aberta |
| `GE-A031` | Fluxo final de correcao administrativa | Eventos originais imutaveis; planejar evento compensatorio | Aberta |
| `GE-A032` | Comando em transito ao encerrar sessao | Serializar por revisao/transacao; teste deve fechar sem efeito parcial | Aberta |
| `GE-A033` | Valores de rate limit | Aplicar limites conservadores medidos, sem quebrar retry | Aberta |
| `GE-A034` | Estrategia final de projecoes estatisticas | Derivar do ledger; nao criar fonte paralela agora | Aberta |
| `GE-A035` | Critico/falha critica em teste de grupo | Registrar naturais; efeito decidido pelo mestre/regra | Aberta |
| `GE-A036` | Empates em testes opostos alem de Ameaca x Coragem | `TesteSpec` deve declarar desempate | Aberta |
| `GE-A037` | Desempate de iniciativa | Presencial sugere nova rolagem; online precisa politica publicada | Aberta |
| `GE-A038` | Gatilho exato `vida <= 0` para A Beira da Morte e cobertura de NPCs | Nao ocultar; configurar state machine antes de matar | Aberta |
| `GE-A039` | Igualdade exata nos limites de 20% e 50% | Texto literal diz abaixo; manter configuravel | Aberta |
| `GE-A040` | Aplicacao do multiplicador de dano quando vida atual ja e zero | Nao decidir automaticamente | Aberta |

Para resolver uma ambiguidade:

1. registrar a decisao no log deste documento;
2. criar/ajustar campo tipado no Sistema;
3. validar rascunho e publicacao;
4. atualizar seed apenas de nova versao, sem mutar versao publicada;
5. criar testes de fronteira;
6. atualizar a linha da matriz e remover o bloqueio apenas depois da entrega.

---

# 33. O que a engine nao pode inventar

- teste obrigatorio para toda skill ou magia;
- formula universal de revidar, defender ou contra-atacar;
- ordem universal de defesas;
- dano, duracao, intensidade ou acumulo de condicao;
- dificuldade de teste contextual;
- cooldown extraido de texto livre;
- alcance sem posicao ou escolha manual;
- aplicacao de dano apenas porque houve acerto;
- alvo, controlador ou autorizacao;
- fonte de XP, tipo de missao ou classificacao do combate;
- resultado da votacao de MVP;
- municao para arma que nao a controla;
- tabela de membro perdido;
- consequencia de falha de guarda;
- cura de HP no descanso sem fonte;
- regra de empate ausente;
- correcao silenciosa da tabela de queda;
- comportamento baseado em exemplo com erro aritmetico;
- migracao silenciosa de Sistema/ficha;
- mutacao da entidade Wiki de NPC generico;
- critico natural produzido por modificador;
- resultado enviado pelo cliente como verdade;
- evento persistente com a Mesa offline;
- timer em memoria como fonte de cooldown ou duracao.

---

# 34. Roadmap oficial de implementacao

Cada fase deve ser entregue de forma vertical, com backend, contratos, frontend aplicavel, testes, compatibilidade e atualizacao deste guia. Nao iniciar uma fase que dependa de uma ambiguidade ainda sem comportamento seguro.

## 34.1. Fase 0 - Preparacao e consistencia

### Objetivo

Remover riscos que tornariam a engine incorreta antes de criar o ledger.

### Entregaveis

- manter personagem com vida zero na Mesa;
- separar `A Beira da Morte`, `Estabilizado` e `Morto` no contrato adequado;
- transportar `SistemaMorteConfig.ConfiguracaoJson` em DTOs e mapeamentos;
- normalizar o codigo de Dependencia de Mana com alias legado;
- corrigir o contexto de Mesa na resolucao de Personagem Jogador;
- ampliar representacao de dados para D4/D10 e formato generico tipado;
- definir IDs estaveis para inventario, skills e magias;
- introduzir revisao otimista em toda escrita de ficha;
- portar calculo de arma/acessorio para o backend com paridade;
- aprovar a politica provisoria de incompatibilidade de versao;
- preservar o comportamento intencional de raca Wiki no Odisseia quando aplicavel.

### Criterio de saida

- edicao completa nao sobrescreve patch rapido silenciosamente;
- vida zero continua visivel;
- regras de arma produzem o mesmo preview no cliente e resultado no servidor;
- dados legados continuam abrindo;
- build e regressao passam.

## 34.2. Fase 1 - Fundacao da engine

### Objetivo

Criar a infraestrutura duravel e segura sem ainda automatizar combate completo.

### Entregaveis de backend

- `MesaSessao` e ponteiro de sessao ativa;
- `MesaComando` e idempotencia;
- `MesaEvento` e detalhe de rolagem;
- RNG autoritativo;
- revisao de sessao/personagem;
- autorizacao e visibilidade;
- transacao atomica;
- endpoints de sessao, eventos e comandos base;
- invalidacao SignalR com watermark;
- compatibilidade com `AoVivo`.

### Entregaveis de frontend

- models/services/hooks base;
- estado de sessao real;
- feed textual minimo;
- tratamento de retry, replay e conflito;
- funcionamento sem animacao 3D.

### Criterio de saida

- uma Mesa nao possui duas sessoes ativas;
- retry nao sorteia novamente;
- conflito nao perde estado;
- evento e mutacao confirmam juntos;
- reconexao recupera por REST;
- privacidade e aplicada antes da paginacao.

## 34.3. Fase 2 - Primeiro MVP de rolagens

### Objetivo

Entregar valor pratico com as regras mais claras e baixo risco de mutacao.

### Escopo

- teste generico;
- atributos principais;
- atributos secundarios;
- fontes de XP;
- registro manual;
- simulacao com Mesa offline;
- `DiceActionModal` compartilhado;
- icones na ficha;
- historico/feed;
- seletor de visibilidade permitido;
- prova de conceito 3D com fallback e reduced motion.

### Fora do escopo desta fase

- aplicar dano automaticamente;
- turnos, movimento e cooldown;
- condicoes e morte automatizadas;
- estatisticas visuais.

### Criterio de saida

- todos os resultados sao do servidor;
- somente sessao ativa cria evento;
- manual e distinguivel;
- decomposicao matematica e correta;
- UI funciona sem WebGL em desktop, tablet e celular;
- XP nao e concedido duas vezes.

## 34.4. Fase 3 - Itens, armas, skills e magias

### Objetivo

Conectar acoes reais da ficha ao catalogo executavel.

### Escopo

- `aplicaTeste` e defaults legados;
- primeira coluna acionavel nas tabelas;
- tiros/rajadas e distancia;
- ataque melee e operacoes estruturadas;
- modificadores autoritativos de arma/acessorios;
- snapshots das origens;
- `TesteSpec` opcional para skills/magias;
- migracao gradual de `acerto` legado;
- custos/cooldowns apenas como preview quando ainda textuais.

### Criterio de saida

- arma aplica cada modificador exatamente uma vez;
- acessorio incompativel nao altera total;
- skill/magia sem teste nao ganha dado falso;
- reordenar tabela nao muda a origem;
- acao antiga continua legivel por fallback.

## 34.5. Fase 4 - Engine de estado

### Objetivo

Aplicar, com confirmacao e auditoria, mudancas de recursos e sobrevivencia.

### Escopo

- calcular versus aplicar;
- vida, estamina, mana e XP;
- dano e defesas estruturadas;
- custos;
- condicoes ativas;
- descanso;
- Fadiga, Dependencia de Mana e carga;
- state machine de morte/estabilizacao;
- eventos compensatorios basicos;
- fluxos assistidos para ambiguidades restantes.

### Criterio de saida

- nenhuma aplicacao sem revisao/idempotencia;
- recursos respeitam limites do Sistema;
- personagem com vida zero inicia o fluxo correto;
- ordem de defesa nunca e presumida;
- rollback nao deixa estado/evento divergentes.

## 34.6. Fase 5 - Combate e movimento

### Objetivo

Representar encontros com participantes, ordem e tempo de jogo.

### Escopo

- `MesaCombate`;
- participantes e snapshots de NPC/variante;
- iniciativa e desempate configurado;
- turno e rodada;
- declaracao e combo;
- PA opcional;
- movimento e gastos;
- cooldown e duracao;
- ticks de condicao;
- furtividade integrada;
- acoes/reacoes estruturadas.

### Fora do escopo

O mapa visual/tatico completo e um projeto separado. A engine deve funcionar com distancia escolhida manualmente.

### Criterio de saida

- reinicio do servidor nao perde combate;
- avancar turno produz o mesmo resultado uma unica vez;
- cooldown expira pelo relogio configurado;
- NPC generico nao altera a Wiki;
- dois clientes nao avancam o mesmo turno simultaneamente.

## 34.7. Fase 6 - Estatisticas

### Objetivo

Criar consultas e telas derivadas do ledger confiavel.

### Escopo

- definicoes formais das metricas;
- projecoes/recalculo;
- filtros por personagem, sessao, origem e acao;
- telas responsivas;
- diferenciacao entre automatico, manual e administrativo;
- politica de retencao aprovada.

### Criterio de saida

- metricas podem ser recalculadas a partir dos eventos;
- mudanca de formula nao edita o passado;
- simulacoes offline nunca entram;
- privacidade do historico continua respeitada.

## 34.8. Organizacao de branches

Implementacoes devem sair de `main` atualizada e limpa. Sugestao:

- `feature/gameplay-engine-preparation`;
- `feature/gameplay-engine-foundation`;
- `feature/gameplay-rolls-mvp`;
- `feature/gameplay-item-actions`;
- `feature/gameplay-state-engine`;
- `feature/gameplay-combat`;
- `feature/gameplay-statistics`.

Uma branch pode agrupar Fases 0-2 somente se a revisao permanecer manejavel, as migrations forem seguras e os criterios de cada fase forem verificados separadamente.

---

# 35. Estrategia de testes

## 35.1. Calculadores e dominio

Usar testes unitarios com RNG falso/deterministico para cobrir:

- limites de D4, D6, D8, D10, D20 e faces configuradas;
- D6 generico: 3 falha, 4 passa;
- atributo 3 + natural 3 = 6 e falha;
- atributo 3 + natural 4 = 7 e passa;
- atributo zero voluntario bloqueado;
- atributo zero solicitado pelo mestre usa 1;
- grupo 3+3+3 e natural 4 = 13 e passa;
- vantagem `[2,5]` mantem 5;
- desvantagem `[2,5]` mantem 2;
- natural 19 + modificador nao vira critico natural;
- faixas de resultado sem sobreposicao indevida;
- iniciativa e teste oposto;
- todas as fontes de XP;
- paridade com dado mantido;
- overflow de XP e limites de nivel;
- combo com uma rolagem, multiplos danos/custos propostos;
- acerto preciso com uma unica escolha;
- natural 20 sem escolha automatica de preciso;
- skill/magia sem teste;
- modificadores de arma/acessorio compativeis e incompativeis;
- condicoes, custos e cooldowns quando estruturados;
- transicoes de morte e estabilizacao;
- arredondamento e fronteiras percentuais.

## 35.2. Aplicacao, seguranca e persistencia

Cobrir:

- permissao por papel e personagem;
- visibilidade por modo;
- evento privado fora de contagem/pagina nao autorizada;
- mesma chave/mesmo payload retorna resposta original;
- mesma chave/payload diferente conflita;
- replay nao consome novo RNG;
- revisao obsoleta retorna 409 sem mutacao;
- duas escritas concorrentes: apenas uma vence;
- comando, evento, detalhe e estado na mesma transacao;
- rollback sem evento ou custo orfao;
- uma unica sessao ativa;
- inicio/encerramento simultaneo;
- comando concorrente ao encerramento;
- versao da sessao imutavel;
- versao incompatível bloqueando mutacao;
- campos JSON desconhecidos preservados;
- FKs, indices, cascade/restrict/set null;
- exclusao/anonimizacao sem apagar historico indevido;
- SignalR sem IDs/payload privados;
- recuperacao por REST depois de falha do hub.

Testes de concorrencia, migration e constraint devem usar MySQL/MariaDB real em Docker quando a semantica do banco importar. EF InMemory nao comprova esses cenarios.

O projeto possui `GameplayMariaDbIntegrationTests` para esta camada. A suite cria e remove um banco com nome aleatorio; ela nunca usa a connection string normal de desenvolvimento. Para executa-la, apontar as duas variaveis para um servidor MariaDB descartavel com permissao de criar banco:

```text
RUN_GAMEPLAY_MARIADB_TESTS=1
ODISSEIA_TEST_MYSQL_CONNECTION=Server=localhost;Port=3306;Uid=root;Pwd=<senha>;
dotnet test --filter FullyQualifiedName~GameplayMariaDbIntegrationTests
```

Os cenarios minimos permanentes dessa suite sao: leitura de eventos privados sem travar cursor, idempotencia da escrita runtime, revisao concorrente, inicio/encerramento simultaneo e dois usuarios autorizados na mesma Mesa. A reconexao de presenca fica coberta em `MesaPresenceTrackerTests`; toda mudanca no Hub deve preservar esse teste e a recuperacao do ledger por REST.

## 35.3. Frontend

Cobrir logica pura e componentes para:

- montagem de comando tipado;
- manutencao da mesma chave durante retry;
- nova chave apenas para nova intencao;
- ordenacao e deduplicacao por sequencia;
- deteccao de lacuna;
- invalidacao do catalogo;
- fallback legado de `aplicaTeste`;
- breakdown matematico;
- skill/magia sem icone quando nao testa;
- conflito e recarga de snapshot;
- resultado textual sem 3D;
- animacao usando exatamente os valores retornados;
- falha e descarte do canvas;
- reduced motion;
- foco, teclado e `aria-live`;
- responsividade;
- scroll mobile sem bloqueio pelo canvas;
- nenhuma mutacao otimista de recurso antes da resposta.

## 35.4. Fluxos E2E/integracao

- mestre abre sessao e jogadores recebem estado;
- jogador rola atributo e todos os autorizados veem o evento;
- rolagem privada so aparece para os papeis corretos;
- refresh/reconexao recupera o resultado;
- clique duplo/retry nao duplica;
- dois clientes alteram recurso e um recebe conflito;
- Mesa offline simula sem persistir;
- registro manual recebe badge;
- XP e aplicado uma vez;
- personagem em vida zero continua visivel;
- NPC por variante usa snapshot independente;
- encerramento impede novos eventos;
- versao publicada depois do inicio nao muda a sessao;
- cliente sem WebGL conclui normalmente.

## 35.5. Regressao obrigatoria

Executar, no minimo:

```text
npm run test:items
npm run test:variants
npm run test:visual-stability
npm run build
dotnet test
```

Adicionar novos scripts especificos da engine quando a suite crescer, sem substituir a verificacao de build e os testes existentes.

Validar tambem:

- criacao, edicao e leitura de Personagem Jogador;
- inventario organizado/livre e peso;
- modificadores/acessorios;
- skills e magias legadas;
- Mesa offline/online;
- presenca e privacidade;
- Sistemas publicados, resolver e migracao;
- mobile, tablet e desktop;
- dados antigos e JSONs com campos desconhecidos.

---

# 36. Criterios globais de aceite

A engine so pode avancar para uso real quando:

- resultado automatico nao pode ser escolhido pelo cliente;
- comando duplicado nao produz novo sorteio ou efeito;
- conflito nao sobrescreve estado;
- evento e estado nunca divergem;
- historico respeita visibilidade no backend;
- refresh/reconexao nao perde resultado;
- sessao usa versao bloqueada;
- simulacao offline nao persiste nem altera ficha;
- registro manual e permanentemente distinguivel;
- dados antigos continuam abrindo e editando;
- personagem com vida zero continua na Mesa;
- skill/magia sem teste nao ganha rolagem falsa;
- arma aplica item/acessorios uma unica vez;
- matematica exibida corresponde aos componentes;
- aplicacao de estado exige confirmacao, revisao e idempotencia;
- UI funciona em desktop, tablet e celular;
- animacao 3D nao e requisito funcional;
- reduced motion e fallback funcionam;
- build, testes e migrations passam;
- nenhuma ambiguidade e automatizada sem configuracao/decisao;
- documentacao representa o codigo entregue.

---

# 37. Definition of Done especifica

Além da Definition of Done do `PROJECT_GUIDE.md`, uma funcionalidade da engine exige:

- regra ligada a uma fonte do livro ou decisao registrada;
- configuracao versionada e validada, quando configuravel;
- contrato tipado e versionado;
- backend autoritativo;
- permissao e visibilidade testadas;
- idempotencia e concorrencia, quando houver escrita;
- transacao atomica;
- evento auditavel;
- proveniencia/fallback explicitos;
- compatibilidade com dados antigos;
- frontend reutilizavel, sem regra duplicada;
- acessibilidade e responsividade;
- teste de fronteira da regra;
- teste de retry/conflito quando aplicavel;
- observabilidade sem vazamento;
- migration aditiva revisada;
- matriz de estado e log de decisoes atualizados;
- ausencia de codigo morto e imports quebrados;
- build e suites relevantes verdes.

---

# 38. Mapa de implementacao no projeto

## 38.1. Backend

Locais esperados, respeitando a arquitetura atual:

- `OdisseiaWiki/Models`: entidades de sessao, comando, evento e fases posteriores;
- `OdisseiaWiki/Dtos`: requests/responses e payloads discriminados;
- `OdisseiaWiki/Enums`: status, origem, visibilidade e codigos fechados;
- `OdisseiaWiki/Services/Interfaces`: contratos de aplicacao/calculo;
- `OdisseiaWiki/Services`: orquestracao e avaliadores;
- `OdisseiaWiki/Repositories/Interfaces` e `Repositories`: persistencia;
- `OdisseiaWiki/Controllers`: rotas autenticadas;
- `OdisseiaWiki/Hubs` e notifier: invalidacao/watermark;
- `OdisseiaWiki/Data`/partials do contexto: relacionamentos e indices;
- `OdisseiaWiki/Migrations`: migrations geradas e revisadas;
- `OdisseiaWiki.Tests`: unidade, autorizacao, integracao e regressao.

Integracoes atuais a revisar:

- `Mesa.cs` e fluxo de `AoVivo`;
- `MesaPersonagemService`;
- `PersonagemJogadorService` e repository;
- `SistemaRpgResolver.Runtime.cs`;
- `SistemaRpgSeeder`;
- `SistemaResultadoDado` e DTOs de configuracao;
- `SignalRMesaRealtimeNotifier` e `MesaEmJogoHub`.

## 38.2. Frontend

Locais sugeridos:

- `src/models/Gameplay.ts`;
- `src/services/gameplayService.ts`;
- `src/hooks` ou pasta do dominio para hooks de sessao, acoes e feed;
- `src/components/Gameplay` para componentes compartilhados;
- `src/routes/Mesas/MesaGame` para Central de acoes/historico;
- `src/routes/Hub/UserCharacters/CharacterCreate/FormUserCharacter/StatusForm` e componentes compartilhados da ficha para lancadores;
- `src/components/Generic/DataTable` para coluna inicial opcional;
- `src/models/Itens.ts`, `Skills.ts`, `Magias.ts` e `Dados.ts` para contratos evoluidos;
- `src/utils/weaponModifiers.ts` apenas como preview em paridade;
- `src/components/Generic/Modal` ou abstracao compatível para acessibilidade;
- `tests` para logica pura, paridade e estabilidade visual.

Nao colocar chamadas HTTP diretamente em JSX nem regras extensas dentro de componentes.

---

# 39. Checklist para qualquer nova acao

Antes de adicionar uma acao, responder:

1. Qual e o codigo estavel?
2. Qual fonte do livro/Sistema a define?
3. A regra esta publicada e sem ambiguidade?
4. Qual `TesteSpec`, `CustoSpec` e `EfeitoSpec` se aplicam?
5. Quem pode executar e controlar o personagem?
6. Qual a visibilidade?
7. E simulacao, registro ou aplicacao?
8. Quais IDs estaveis identificam origem e alvo?
9. Quais revisoes sao exigidas?
10. Qual a chave/idempotencia?
11. O que entra na mesma transacao?
12. Qual evento e payload sao gerados?
13. Quais proveniencias/snapshots sao necessarios?
14. Como funciona com Mesa offline?
15. Como funciona com dado legado/fallback?
16. Como funciona sem SignalR, WebGL ou animacao?
17. Quais testes de fronteira, permissao e concorrencia existem?
18. Como aparece em desktop, tablet e celular?
19. Qual ambiguidade pode bloquear automacao?
20. Este documento foi atualizado?

---

# 40. Estado de implementacao

Esta tabela e obrigatoria e deve ser atualizada em cada entrega.

| Area | Estado em 23/09/2026 | Observacao |
|---|---|---|
| Estudo do livro e arquitetura | `Concluido` | Regras, riscos, UI e arquitetura alvo documentados. |
| Fase 0 - Preparacao | `Parcial` | Vida zero permanece na Mesa; revisao otimista e auditoria transacional das escritas atuais da ficha estao implementadas. Dados legados e calculos autoritativos de arma ainda precisam de trabalho. |
| Fase 1 - Fundacao | `Parcial` | Sessoes, comandos idempotentes, eventos, RNG, visibilidade, historico com cursor que avanca sobre linhas privadas, transacao e adaptador `AoVivo` implementados. A suite MariaDB e opt-in e deve entrar na execucao continua antes de ampliar comandos de estado. |
| Fase 2 - MVP de rolagens | `Parcial` | Rolagens genericas, atributos Odisseia, fontes de XP calculadas, registro manual, simulacao offline via API, Central com teste de atributo em modal, dado 3D opcional, animacao autorizada das rolagens dos outros participantes e historico em tempo real na Mesa. A UI permite testes offline sem historico; faltam ficha dedicada e aplicacao auditada de XP. |
| Fase 3 - Acoes de itens/poderes | `Nao iniciada` | Modificadores atuais continuam preview no frontend. |
| Fase 4 - Engine de estado | `Nao iniciada` | Recursos atuais nao formam engine transacional. |
| Fase 5 - Combate/movimento | `Nao iniciada` | `TurnoAtual = Mestre` continua placeholder. |
| Fase 6 - Estatisticas | `Nao iniciada` | Nenhum agregado deve ser criado antes do ledger. |
| Animacao 3D | `PoC integrada` | Poliedros CSS 3D D4/D6/D8/D10/D12/D20 com clique, arremesso por ponteiro ou movimento do celular, impulso proporcional a velocidade e distancia do gesto, colisao nas bordas, dois dados simultaneos em vantagem/desvantagem e pouso continuo nos valores do servidor. Chacoalhadas sucessivas reforcam e prolongam apenas a animacao local; em navegadores que exigem permissao, ela e solicitada por acao explicita. O pouso planeja voltas completas e desacelera monotonicamente ate a face oficial, sem mola, aceleracao corretiva ou troca abrupta no final. Novos eventos autorizados iniciam a mesma animacao nos demais participantes via invalidacao SignalR + leitura REST; abrir o modal sem rolar nao transmite nada. Outros tipos usam fallback textual. Sem biblioteca 3D ou fisica real. |
| Ambiguidades do livro | `Abertas` | Registro `GE-A001` a `GE-A040`. |

Validacao desta entrega: build do backend e TypeScript, testes direcionados de gameplay (rolagem offline e paginacao/privacidade do ledger). A suite MariaDB opt-in cobre a semantica que testes em memoria nao comprovam: bloqueios `FOR UPDATE`, isolamento serializavel e indices unicos. Ela deve ser executada em ambiente descartavel antes de publicar mudancas de estado. A animacao de dado e visual: apenas o backend determina e devolve o resultado.

---

# 41. Registro de decisoes

| ID | Data | Decisao | Motivo e impacto | Substitui |
|---|---|---|---|---|
| `GE-D001` | 20/09/2026 | Backend e autoridade para RNG, regras, permissao e estado | Impede manipulacao pelo cliente e centraliza consistencia | - |
| `GE-D002` | 20/09/2026 | Somente sessao ativa cria historico oficial | Simulacoes e testes fora da Mesa nao contaminam estatisticas | - |
| `GE-D003` | 20/09/2026 | Rolar/calcular e aplicar sao operacoes separadas | Evita dano/custo no alvo errado e preserva controle do mestre | - |
| `GE-D004` | 20/09/2026 | Estado atual permanece na ficha; ledger e auditavel, sem event sourcing total inicial | Entrega incremental sem segunda ficha paralela | - |
| `GE-D005` | 20/09/2026 | SignalR transmite invalidacao/watermark; REST entrega dados autorizados | Preserva privacidade e recuperacao apos reconexao | - |
| `GE-D006` | 20/09/2026 | Skill e magia possuem teste opcional, nunca obrigatorio por categoria | O livro contem poderes com e sem rolagem | Ideia inicial de dado em toda skill/magia |
| `GE-D007` | 20/09/2026 | Animacao 3D recebe resultado predeterminado e e opcional | Aparencia nao pode decidir nem bloquear gameplay | - |
| `GE-D008` | 20/09/2026 | Sessao bloqueia a versao do Sistema ao iniciar | Publicacao/migracao posterior nao muda uma partida em curso | - |
| `GE-D009` | 20/09/2026 | NPC/variante entra no combate por snapshot independente | Estado de combate nao altera Wiki nem outra instancia | - |
| `GE-D010` | 20/09/2026 | `aplicaTeste` fica em atributos tipados do item; arma legada `true`, outros `false` | Evita coluna desnecessaria e preserva compatibilidade | - |
| `GE-D011` | 20/09/2026 | Registro manual permanece identificado como manual | Estatisticas e auditoria nao confundem dado informado com RNG | - |
| `GE-D012` | 20/09/2026 | Estatisticas sao derivadas de eventos; sem contadores como fonte inicial | Permite recalculo e mudanca futura de formula | - |
| `GE-D013` | 20/09/2026 | Ambiguidade usa assistencia/manual, nao inferencia silenciosa | Mantem fidelidade ao livro e ao mestre | - |
| `GE-D014` | 20/09/2026 | Admin nao personifica mestre/jogador em endpoint normal | Excecoes tecnicas exigem operacao explicita e auditada | - |
| `GE-D015` | 20/09/2026 | Identidade de linha nao usa nome ou indice visual | Reordenacao e nomes duplicados nao alteram o alvo | - |
| `GE-D016` | 20/09/2026 | Migracao de Mesa fica bloqueada durante sessao ativa | Uma partida nunca muda de regra no meio e a proxima sessao nasce com contexto consistente | - |
| `GE-D017` | 22/09/2026 | Animacao remota nasce apenas de evento persistido e autorizado obtido por REST apos invalidacao SignalR | Mantem a rolagem ao vivo sem transmitir resultado privado pelo hub, sem animar apenas a abertura do modal e sem repetir historico antigo | - |
| `GE-D018` | 22/09/2026 | Pouso visual usa uma trajetoria continua com desaceleracao monotona ate o valor autoritativo | Evita a aparencia de resultado manipulado causada por aceleracao ou correcao tardia da orientacao; o gesto define impulso e duracao, mas nunca o RNG | - |
| `GE-D019` | 23/09/2026 | Movimento do celular pode iniciar e reforcar somente a animacao local do dado | Mantem o resultado autoritativo no backend, preserva clique e toque como fallback e exige permissao explicita apenas quando o navegador solicitar | - |
| `GE-D020` | 23/09/2026 | Cursor do historico representa a ultima linha inspecionada, nao a ultima linha revelada | Eventos privados continuam invisiveis, mas nunca prendem clientes em paginas repetidas; a leitura percorre o ledger autorizado sem vazar dados | - |
| `GE-D021` | 23/09/2026 | Escritas atuais da ficha usam revisao e comando/evento na mesma transacao quando a sessao esta ativa | Evita perda silenciosa entre patch rapido e edicao completa e preserva auditoria sem transformar a ficha em event sourcing | `GE-D004` |
| `GE-D022` | 23/09/2026 | O contrato de rolagem declara modo, dificuldade, faixas, origem e fallbacks | A UI e o historico conseguem explicar a regra aplicada; referencias de arma/item/poder so serao aceitas quando houver resolucao autoritativa publicada | - |

Novas decisoes devem receber ID sequencial, data, justificativa, impacto e referencia a decisao substituida. Nao apagar decisoes antigas.

---

# 42. Referencias

## 42.1. Projeto

- [`PROJECT_GUIDE.md`](../PROJECT_GUIDE.md) - arquitetura e padroes gerais.
- [`RPG_SYSTEMS.md`](RPG_SYSTEMS.md) - Sistemas configuraveis, versoes, resolver e fallback.
- [`RPG_SYSTEMS_QA.md`](RPG_SYSTEMS_QA.md) - matriz existente de qualidade dos Sistemas.
- [`TASK_INTEGRACAO_RUNTIME_SISTEMAS_RPG.md`](TASK_INTEGRACAO_RUNTIME_SISTEMAS_RPG.md) - separacao de regra, override e estado.
- [`LIVRO DO JOGADOR.pdf`](<../OdisseiaWikiClient/src/assets/Doc/LIVRO DO JOGADOR.pdf>) - fonte conceitual das regras do Odisseia.
- [`Guia Completo de SVG e Animacoes.md`](<../Guia Completo de SVG e Animações.md>) - padrao visual aplicavel aos novos componentes.

## 42.2. Referencias tecnicas externas

- [RandomNumberGenerator.GetInt32 - Microsoft Learn](https://learn.microsoft.com/dotnet/api/system.security.cryptography.randomnumbergenerator.getint32?view=net-8.0)
- [Foundry Virtual Tabletop - Dice Rolling](https://foundryvtt.com/article/dice/)
- [Roll20 - Quantum Roll](https://help.roll20.net/hc/en-us/articles/360037256594-Quantum-Roll)
- [W3C - Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)
- [`@3d-dice/dice-box-threejs`](https://github.com/3d-dice/dice-box-threejs) - candidato de PoC, nao dependencia aprovada.

Referencias externas orientam boas praticas; nao substituem o Livro, o Sistema publicado ou as decisoes deste projeto. Antes de instalar uma dependencia, revisar versao, manutencao, licenca, seguranca e compatibilidade atuais.

---

# 43. Conclusao

A engine de gameplay deve evoluir o OdisseiaWiki sem transformar a ficha em uma caixa-preta ou retirar do mestre as decisoes que o livro deixa contextuais.

O caminho oficial e incremental:

```text
consistencia do estado
-> sessao, comando e ledger
-> rolagens confiaveis
-> itens e poderes
-> aplicacao de estado
-> combate e movimento
-> estatisticas
```

O servidor decide e audita; o Sistema versionado configura; a ficha preserva o estado; o ledger explica o passado; o frontend torna tudo rapido, claro e acessivel.

Nenhuma implementacao esta autorizada a ignorar as invariantes, inventar uma regra ambigua ou marcar uma fase como concluida sem seus criterios de saida. Este documento deve permanecer sincronizado com o projeto e ser consultado antes de qualquer alteracao relacionada a rolagens, sessoes, acoes, combate, condicoes, descanso, morte ou estatisticas.
