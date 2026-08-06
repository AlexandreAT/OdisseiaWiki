# Sistemas de RPG configuráveis

## Objetivo

O módulo de sistemas de RPG transforma regras hoje espalhadas entre o livro, o frontend e estruturas JSON de personagens em configurações explícitas, versionadas e auditáveis. Ele deve permitir administrar o sistema **Odisseia — Insurgência** sem interromper os fluxos atuais e, no futuro, cadastrar outros sistemas sem reescrever fichas, mesas ou componentes inteiros.

Esta primeira base não é uma engine universal capaz de interpretar texto livre. Ela organiza dados e regras conhecidas, oferece contratos tipados e preserva fallbacks para os comportamentos legados enquanto cada fluxo passa a consumir a configuração nova.

## Conceitos principais

### Sistema

`SistemaRpg` identifica um produto de regras. Seu `Codigo` é estável, único e não deve mudar depois que o sistema começar a ser referenciado. O sistema mantém os dados gerais e a referência para sua versão publicada atual.

O sistema inicial é criado de forma idempotente com:

- nome: `Odisseia — Insurgência`;
- código: `ODISSEIA`;
- versão: `1.0`;
- estado: `Publicado`.

### Versão

Cada alteração de regras acontece dentro de `SistemaVersao`. Uma versão possui número semântico, estado, changelog e, quando aplicável, uma versão-base.

Estados expostos pela API (`SistemaVersaoStatus`):

- `Rascunho`: editável e ainda indisponível para novas mesas;
- `Publicado`: validado e imutável;
- `Arquivado`: não pode ser escolhido por novas mesas, mas continua legível para vínculos históricos existentes.

O par sistema + número da versão é único. Uma versão publicada nunca deve ser alterada diretamente. Correções ou evoluções partem da duplicação para um novo rascunho.

### Módulo

`SistemaModulo` representa uma área funcional habilitável por versão. A organização inicial contempla, entre outras áreas:

- configurações gerais;
- criação de personagem;
- progressão;
- exploração;
- combate;
- poderes, skills e magias;
- sobrevivência, descanso e morte.

Cada módulo registra seu tipo, se está habilitado e a versão do seu schema. Um `ConfiguracaoJson` opcional existe apenas para detalhes escalares ou extensíveis que não justificam uma relação própria.

### Modelagem implementada

A raiz relacional é `SistemaRpg -> SistemaVersao`. A versão agrega:

- `SistemaModulo` para habilitação, ordem e schema dos módulos;
- `SistemaNivel`, `SistemaMarcoNivel` e `SistemaFonteExperiencia` para progressão;
- `SistemaRacaConfig`, `SistemaRacaPassiva`, `SistemaAtributoConfig` e `SistemaRecursoConfig` para criação;
- `SistemaMovimentoConfig`, `SistemaPontosAcaoConfig` e `SistemaAcaoConfig` para exploração;
- `SistemaResultadoDado`, `SistemaTipoDano` e `SistemaTipoDefesa` para combate;
- `SistemaTipoMagia` e `SistemaSkillConfig` para poderes;
- `SistemaCondicao`, `SistemaDescansoConfig` e `SistemaMorteConfig` para sobrevivência;
- `SistemaItemEscopo`, `SistemaItemCampo`, `SistemaItemFaixa` e `SistemaItemReferencia` para o catálogo hierárquico de itens por tipo, categoria e arquétipo;
- `SistemaPatchNote` para o snapshot estruturado e imutável criado na publicação.

`Mesa.IdSistemaVersao` é a FK opcional de transição. O relacionamento é explícito e uma versão pode continuar ligada a várias mesas mesmo depois de arquivada.

NPCs, raças e itens globais possuem `IdSistemaRpg`, `IdSistemaVersao` e `AcompanharPublicacaoAtual`. O vínculo acompanhado aponta para o Sistema e resolve sua publicação corrente; o vínculo fixo aponta para uma versão específica. Rascunhos não são aceitos pelo runtime. Versões arquivadas permanecem válidas somente para vínculos históricos já fixados.

### Evolução de schema desta integração

A evolução de banco é aditiva: cria as tabelas `SistemaItemEscopos`, `SistemaItemCampos`, `SistemaItemFaixas`, `SistemaItemReferencias` e `SistemaPatchNotes`; acrescenta os vínculos opcionais de Sistema/versão e o indicador de acompanhamento em personagem NPC, raça e item; e cria FKs/índices para proteger os relacionamentos e unicidades do catálogo. Não remove `StatusJson`, `AtributosJson` nem qualquer valor de ficha. O backfill de dados do catálogo é executado pelo seeder sob a condição estrita documentada abaixo, não por atualização destrutiva da migration.

## Dados normalizados e JSON extensível

Devem ser normalizados os dados que precisam de busca, relacionamento, ordenação, unicidade ou validação individual, por exemplo:

- níveis e progressão;
- marcos e recompensas;
- fontes de experiência;
- atributos;
- recursos;
- configurações raciais;
- ações e custos;
- faixas de resultados de dados;
- tipos de dano, defesa e magia;
- condições.

Configurações escalares agrupadas de uma seção podem usar o `ConfiguracaoJson` do módulo, desde que:

- possuam DTO fortemente tipado;
- sejam validadas no backend;
- registrem a versão do schema;
- não sejam editadas por um endpoint genérico de JSON;
- tenham valores padrão e compatibilidade com schemas anteriores.

Um único JSON contendo o sistema inteiro é proibido. JSON também não deve substituir FKs para entidades reutilizáveis, como raça, atributo ou versão.

Na implementação atual, movimento, pontos de ação e morte possuem entidades próprias de relação um-para-um; descansos são linhas normalizadas. JSON permanece reservado às regras gerais tipadas de cada seção e aos campos complementares explicitamente previstos pelos DTOs.

## Fluxo de versionamento

O fluxo seguro é:

1. A versão `1.0` está publicada e pode estar vinculada a mesas.
2. O administrador duplica `1.0` para um novo rascunho, por exemplo `1.1`.
3. As configurações são editadas somente no rascunho.
4. A validação de publicação verifica módulos obrigatórios, códigos duplicados, progressão, faixas de dados e demais invariantes.
5. O administrador publica `1.1`.
6. `1.1` passa a ser a versão publicada atual do sistema e a versão publicada anterior é arquivada.
7. Mesas comuns vinculadas a `1.0` continuam em `1.0`; a Mesa Padrão acompanha a publicação atual de `ODISSEIA`.
8. Cada mesa comum migra apenas por uma ação explícita e autorizada.

Uma publicação de um sistema comum também pode ser arquivada manualmente. Quando ela é a publicação atual,
o ponteiro `IdVersaoPublicada` é limpo de forma transacional; as mesas já vinculadas
continuam usando essa versão arquivada, enquanto novas mesas aguardam uma nova publicação
ou seguem o fallback legado. A publicação atual do Sistema base `ODISSEIA` não pode ser
arquivada sem que uma substituta seja publicada no mesmo fluxo.

Publicar uma versão não executa migração em massa e não altera silenciosamente personagens ou mesas comuns. A única exceção é a Mesa Padrão `ODISSEIA_PADRAO`: sua FK acompanha a publicação atual do Sistema base, sem reescrever qualquer valor persistido nas fichas.

## Regras de imutabilidade e exclusão

- versão publicada não pode ser editada;
- versão publicada não deve sofrer exclusão física;
- versão vinculada a uma mesa não pode ser excluída;
- rascunho usado como base por outra versão não pode ser excluído sem tratar a dependência;
- versão arquivada continua disponível para resolver mesas historicamente vinculadas;
- versão arquivada não aparece como opção para novo vínculo;
- o sistema não pode ser excluído enquanto possuir mesas ou histórico publicado/arquivado; um sistema composto apenas por rascunhos ainda descartáveis pode ser removido;
- operações destrutivas devem retornar conflito explicando a dependência.

## Vínculo com mesas

Cada `Mesa` deve apontar para uma versão específica por uma FK opcional durante a transição. O vínculo passa a ser obrigatório nos novos fluxos, mas a nulabilidade temporária preserva bancos já existentes.

A Mesa Padrão é um registro lógico fixo identificado por `CodigoSistema = ODISSEIA_PADRAO`, e não por ID numérico. Ela acompanha sempre `ODISSEIA.IdVersaoPublicada`; não pode ser excluída, alterada nem migrada manualmente. Na inicialização, nomes históricos equivalentes são reconciliados de forma transacional: personagens, usuários e overrides são movidos para o registro canônico antes da remoção de duplicatas.

Na migração inicial, o seed deve vincular mesas comuns antigas sem versão à `ODISSEIA/1.0`. Nomes históricos reconhecidos como Mesa Padrão são consolidados no registro canônico e passam a acompanhar a publicação atual. Novas mesas comuns salvam explicitamente a versão publicada escolhida. Isso impede que uma publicação futura migre mesas antigas por efeito colateral.

Uma migração de mesa deve:

- exigir autorização do proprietário ou administrador, conforme a política do fluxo;
- aceitar somente uma versão publicada e selecionável;
- validar a existência do sistema e da versão;
- registrar a alteração explicitamente;
- nunca reescrever o conteúdo de personagens de forma automática nesta primeira fase.

## Resolução e fallback

O acesso a regras passa por `SistemaRpgResolver.ResolverContextoAsync`, que entrega `SistemaRuntimeContextoDto` com os agregados de configuração, vínculo efetivo, origem, proveniências, warnings e fallbacks. Consumidores não devem reconstruir esse contexto com consultas independentes.

A precedência efetiva é:

1. publicação atual de `ODISSEIA`, quando a Mesa é a Mesa Padrão;
2. versão explicitamente vinculada à Mesa comum;
3. versão fixa da entidade global, quando não há Mesa;
4. publicação atual do Sistema que a entidade global acompanha;
5. publicação atual do sistema padrão `ODISSEIA`;
6. para Mesa legada sem FK, `ODISSEIA/1.0` durante a transição;
7. fallback legado quando nenhuma configuração versionada válida existir.

`SistemaRuntimeOrigem` identifica `Mesa`, `VersaoFixadaEntidade`, `PublicacaoAtualEntidade`, `SistemaPadrao` ou `FallbackLegado`. Cada valor resolvido relevante registra `SistemaValorProveniencia`: `Sistema`, `OverrideMesa`, `ValorExplicitoEntidade` ou `FallbackLegado`. Um rascunho nunca alimenta gameplay normal.

### Matriz de fontes: regra versus estado

| Camada | Responsabilidade | Exemplos | Pode sobrescrever estado salvo? |
|---|---|---|---|
| Conteúdo global da Wiki | Identidade e conteúdo público da entidade | nome, imagem, descrição, tags | Não |
| `SistemaVersao` | Regras, limites, catálogos e referências | progressão, atributos, recursos, defesas, skills, magias, raça e itens | Não |
| `MesaEntidadeConfig` | Delta contextual da Mesa aplicado depois do Sistema | ajuste racial específico da campanha | Não; altera a interpretação efetiva |
| Estado explícito | Valores reais persistidos do personagem ou item | XP, nível, HP atual, atributos, inventário, `StatusJson`, `AtributosJson` | É a fonte final do valor salvo |

Alterar uma regra ou migrar uma Mesa muda a interpretação de background, nunca regrava silenciosamente os valores explícitos. Valores acima de uma referência são preservados e retornam warning tipado com caminho, valor informado e faixa esperada.

### Raças

`SistemaRacaConfig` é a única fonte mecânica editável quando existe configuração versionada. `Raca.StatusJson` permanece somente como fallback de leitura para raças ou versões ainda não configuradas e não recebe escrita duplicada. `MesaEntidadeConfig` representa apenas o delta da Mesa e é aplicado depois da configuração racial do Sistema.

### Itens

O item conserva seus valores reais em `AtributosJson`. O Sistema resolve, por códigos, o caminho tipo → categoria → arquétipo e combina campos, faixas e referências herdados. O catálogo orienta formulários, gráficos e validações, mas não limita itens excepcionais: escopo ausente ou valor fora da faixa gera warning e mantém o dado original.

## Seed inicial

`SistemaRpgSeeder` roda por `DatabaseSeeder` durante a inicialização já existente do banco e é idempotente. Ele procura o sistema `ODISSEIA` e a versão `1.0` por seus identificadores naturais antes de inserir dados.

Cuidados:

- uma execução posterior não altera uma versão já publicada;
- IDs fixos não devem ser presumidos;
- `Raca` ainda não possui código estável, portanto o vínculo inicial procura nomes normalizados; configurações sem correspondência continuam válidas sem FK para não criar conteúdo Wiki incompleto;
- o seed não deve criar automaticamente conteúdo Wiki incompleto para raças ausentes;
- regras ambíguas no livro devem permanecer descritivas ou configuráveis, sem inferência silenciosa;
- o seed do sistema acontece antes do seed da mesa padrão.
- o Sistema `ODISSEIA` e a Mesa `ODISSEIA_PADRAO` são dados fixos lógicos, recriados se ausentes; o Sistema base também é reativado caso um banco legado o tenha deixado inativo;
- o seed da Mesa Padrão sincroniza sua FK com a publicação atual e consolida registros legados equivalentes sem apagar fichas.

Como exceção técnica documentada para a versão publicada que antecede o novo schema, o seeder faz um backfill aditivo do catálogo de itens de `ODISSEIA/1.0` somente enquanto ela ainda é a publicação corrente. Ele só insere a árvore quando `ItemEscopos` está inteiramente vazia. A operação é idempotente, nunca complementa, substitui ou sobrescreve um catálogo existente e nunca modifica uma versão arquivada; nesse caso, o runtime mantém o fallback legado.

### Rastreabilidade do seed `ODISSEIA/1.0`

Os números abaixo usam a página física do PDF `LIVRO DO JOGADOR.pdf` (63 páginas), não a numeração interna de capítulos.

| Regra configurada | Página(s) do PDF | Valor preservado no seed |
|---|---:|---|
| Criação e atributos | 6-8 | nível inicial 1; 10 pontos distribuíveis; 3 de Sanidade, 1 de Inteligência e 1 atributo racial ficam descritos pelo livro; atributos 0-5, máximo absoluto 6 |
| Raças jogáveis | 10-14 | HP, SP, MP, CC e atributo inicial por raça; Cyborg mantém fórmulas de SP/MP por raça de origem e próteses |
| Passivas raciais | 15-17 | desbloqueio no nível 10; catálogo e variações vinculados por raça |
| Progressão e XP | 27-28 | níveis 1-20; 19 pontos de nível; 4 slots de skill e 1 ultimate; excesso de XP segue para o próximo nível; curva 10/20/25/30/40 |
| Marcos | 28 | ultimate 7; passiva racial 10; proficiência 13; Maestria Tática 16; Maestria em Armas 20 |
| Grid, movimento e estamina | 28-30 | 2 m por quadrado; primeiro quadrado gratuito; máximo 10; 5 SP por quadrado adicional; melee 10 SP por ataque; distância 0 no primeiro e 5 nos seguintes |
| Mana e carga | 31 | dependência de mana por 2 turnos; excesso de carga reduz a estamina máxima em 50% |
| Pontos de ação | 32 | 10 PA por turno; 10 s por PA; mover/interagir 0,5; ataque 1/2; investigar 2; usar item 1 |
| Furtividade | 33-34 | Discrição base 0; 1D10 + Discrição; dificuldades usuais 3-10; teste a cada 3 quadrados furtivos |
| Defesa, dano e magia | 36-38 | 3 defesas; 9 tipos de dano; 9 tipos de magia (4 elementais e 5 gerais); máximo de 15 magias básicas |
| Skills e Éter | 38-40 | 4 slots; nível de skill 1-4; 1 ultimate; Éter usa mana e slots, mas não é tipo de magia |
| Dados | 40-41 | D20 1 / 2-10 / 11-17 / 18-19 / 20; D6 geral 1-3/4-6; atributo acima de 6 e grupo acima de 12 |
| Condições | 41-43 | catálogo textual, sem inventar duração ou intensidade quando o mestre/origem deve defini-las |
| Descanso | 43 | simples recupera 10 SP/MP; normal 1-3 h; longo a partir de 4 h; guarda testa a cada 2 h |
| Morte | 44-45 | 5D6 em combate (3 sucessos); 3D6/h fora; desmembramento abaixo de 20% e dano 2x; insta kill abaixo de 50% e dano 5x |

Contradições e lacunas permanecem explícitas e editáveis:

- na página 32, o quadro normativo define `Investigar = 2 PA` e `Usar item = 1 PA`, enquanto o exemplo usa totais de 3 e 5; o seed segue o quadro e registra a divergência como observação;
- na página 37, a regra textual de queda diz triplicar a cada 4 m, mas o exemplo de 16 m informa 2100 em vez de 2700; somente 4 m = 100, 8 m = 300 e 12 m = 900 ficam marcados como confirmados;
- o livro descreve Armadura, Proteção e Escudo, mas não fixa uma ordem universal quando combinados; a ordem continua configurável;
- custos de mana, intensidade/duração de várias condições e balanceamento de passivas continuam definidos pela magia, origem ou mestre, sem um número fictício no seed.

## Segurança

Todas as escritas de sistema e versão exigem autenticação e a policy administrativa já usada no projeto. A segurança deve ser aplicada no backend, independentemente da visibilidade dos botões no frontend.

São operações administrativas:

- criar, editar, arquivar ou excluir sistemas;
- criar, duplicar, publicar, arquivar ou excluir versões;
- alterar módulos e configurações;
- publicar uma versão, operação que executa a validação completa antes de alterar o estado.

Consultas necessárias para montar fichas podem ser liberadas a usuários autenticados ou publicamente quando os dados forem estritamente de leitura e não expuserem configurações privadas. A migração de uma mesa exige, no mínimo, validação de propriedade ou privilégio administrativo.

## Contratos HTTP implementados

O controller `SistemasRpgController` expõe:

```text
GET    /api/sistemas-rpg
GET    /api/sistemas-rpg/{id}
POST   /api/sistemas-rpg
PUT    /api/sistemas-rpg/{id}
DELETE /api/sistemas-rpg/{id}

GET    /api/sistemas-rpg/{id}/versoes
GET    /api/sistemas-rpg/{id}/versoes/{versaoId}
POST   /api/sistemas-rpg/{id}/versoes
POST   /api/sistemas-rpg/versoes/{versaoId}/duplicar
POST   /api/sistemas-rpg/versoes/{versaoId}/publicar
POST   /api/sistemas-rpg/versoes/{versaoId}/arquivar
DELETE /api/sistemas-rpg/{id}/versoes/{versaoId}

GET    /api/sistemas-rpg/versoes/{versaoId}/configuracao-geral
PUT    /api/sistemas-rpg/versoes/{versaoId}/configuracao-geral
GET    /api/sistemas-rpg/versoes/{versaoId}/criacao
PUT    /api/sistemas-rpg/versoes/{versaoId}/criacao
GET    /api/sistemas-rpg/versoes/{versaoId}/progressao
PUT    /api/sistemas-rpg/versoes/{versaoId}/progressao
GET    /api/sistemas-rpg/versoes/{versaoId}/exploracao
PUT    /api/sistemas-rpg/versoes/{versaoId}/exploracao
GET    /api/sistemas-rpg/versoes/{versaoId}/combate
PUT    /api/sistemas-rpg/versoes/{versaoId}/combate
GET    /api/sistemas-rpg/versoes/{versaoId}/poderes
PUT    /api/sistemas-rpg/versoes/{versaoId}/poderes
GET    /api/sistemas-rpg/versoes/{versaoId}/sobrevivencia
PUT    /api/sistemas-rpg/versoes/{versaoId}/sobrevivencia
GET    /api/sistemas-rpg/versoes/{versaoId}/itens
PUT    /api/sistemas-rpg/versoes/{versaoId}/itens
GET    /api/sistemas-rpg/versoes/{versaoId}/patch-note

GET    /api/sistemas-rpg/resolver?idMesa={mesaId}
GET    /api/sistemas-rpg/runtime/contexto
POST   /api/sistemas-rpg/mesas/{mesaId}/migracao/preview
POST   /api/sistemas-rpg/mesas/{mesaId}/migrar
```

`runtime/contexto` aceita `idMesa`, `tipoEntidade`, `idEntidade`, `idRaca` e os códigos opcionais de tipo/categoria/arquétipo de item. O contexto global permanece público; qualquer consulta com `idMesa`, inclusive pelo endpoint legado `resolver`, exige autenticação e autorização de uso da Mesa, com bypass apenas para Admin. Endpoints de seção recebem DTOs específicos. Não existe uma escrita do tipo `PUT /modulo/{tipo}` aceitando JSON arbitrário sem validação. A validação para publicação é parte de `POST .../publicar`, e não um endpoint separado.

As consultas de runtime e de versões publicadas são públicas quando não expõem configuração privada. Somente administradores recebem sistemas inativos/rascunhos, alteram catálogos ou consultam patch notes administrativos. Criação, alteração, publicação, arquivamento e exclusão usam a policy `Admin`. Preview e migração de Mesa exigem autenticação e validação de proprietário, exceto para administradores.

## Patch notes e migração consciente

Ao publicar, o backend compara a nova versão com sua base ou publicação anterior e cria `SistemaPatchNote` com grupos por módulo, alterações adicionadas/removidas/alteradas, valores anterior/novo e impacto. A criação do snapshot, o arquivamento da publicação anterior e a troca de `IdVersaoPublicada` ocorrem na mesma transação. O contexto bloqueia update e delete de patch notes depois da criação.

Antes de migrar, `POST /api/sistemas-rpg/mesas/{mesaId}/migracao/preview` combina o patch note com a análise da Mesa e retorna versões, valores preservados, resumo e warnings, incluindo incompatibilidades raciais, itens sem arquétipo e fallbacks previstos. A confirmação exige `ConfirmarPreservacaoValores = true`; a operação efetiva altera somente `Mesa.IdSistemaVersao`. Personagens, XP, recursos, atributos, inventários, itens e overrides não são regravados.

## Validações obrigatórias

Antes de salvar ou publicar, validar ao menos:

- código de sistema obrigatório e único;
- versão semântica válida e única dentro do sistema;
- estado compatível com a operação;
- níveis sem duplicidade e dentro do intervalo permitido;
- XP e custos não negativos;
- recursos e atributos com códigos únicos;
- mínimo menor ou igual ao máximo;
- raça sem duplicidade na mesma versão;
- faixas de dado dentro do dado configurado, sem sobreposição e, quando exigido, sem lacunas;
- condições com duração coerente;
- módulos obrigatórios presentes antes da publicação;
- JSON compatível com a versão de schema declarada;
- destino de migração publicado e não arquivado;
- bloqueios de exclusão para versões e sistemas em uso.

## Integração incremental

Os consumidores integrados usam o contexto runtime para:

- curva e limite de progressão;
- catálogos e limites de atributos, recursos, defesas, skills e magias;
- defaults raciais na criação e troca consciente de raça;
- valores raciais em páginas e formulários;
- hierarquia, campos, referências e escalas visuais de itens;
- warnings de NPC, personagem jogador e item sem alterar o valor explícito.

Ao carregar ou editar uma ficha existente, propriedades históricas e códigos desconhecidos continuam preservados. Defaults do Sistema são aplicados na criação ou quando o campo ainda não possui valor explícito; não são uma rotina de normalização destrutiva.

Os hardcodes remanescentes ficam restritos a fallbacks de compatibilidade quando o contexto, módulo, configuração racial ou escopo de item estiver ausente. A execução completa de ações, movimento, condições, descanso, morte e rolagens continua fora deste runtime: os catálogos são resolvidos, mas ainda não constituem uma engine universal de combate. Itens customizados sem códigos reconhecíveis também mantêm a renderização e as constantes legadas.

Criação e atualização de Item e NPC resolvem também o snapshot proposto antes de persistir. Extrapolações válidas não são bloqueadas nem normalizadas: a resposta do save já devolve o contexto e os warnings tipados correspondentes, permitindo ao formulário informar a referência sem realizar um GET adicional.

No frontend, `/management` é protegido por `ManagementAccessGuard`: sessão anônima é redirecionada ao login com destino interno preservado, e usuário autenticado sem papel `Admin` vai para a tela de acesso negado. Essa barreira melhora o fluxo, mas não substitui a policy `Admin` do backend.

## Como evoluir a configuração

Para criar outro sistema, use a tela `Management > Sistema`, cadastre os dados gerais, crie uma versão em rascunho, preencha todas as seções obrigatórias e publique. Para alterar regras publicadas, duplique a versão, edite o novo rascunho e publique-o; mesas comuns existentes permanecem na versão anterior até migração explícita. A Mesa Padrão é a exceção fixa e acompanha cada nova publicação de `ODISSEIA`.

Ao adicionar um módulo novo, mantenha o corte vertical existente:

1. declarar o tipo em `SistemaModuloTipo` e modelar somente as relações necessárias;
2. registrar relacionamentos e índices em `OdisseiaContext.SistemasRpg.cs` e gerar migration;
3. criar DTO tipado, mapeamento e validação no backend;
4. expor leitura e escrita administrativa no service/controller sem aceitar JSON arbitrário;
5. adicionar o contrato em `src/models/SistemaRpg.ts`, o endpoint em `src/services/sistemasRpgService.ts` e a seção responsiva em `ManagementSystem`;
6. atualizar seed, documentação e testes sem alterar versões já publicadas.

## Ambiguidades do livro

O livro permanece a fonte conceitual do sistema, mas nem todo trecho define valores de forma inequívoca. Quando houver contradição, exemplo narrativo sem regra formal ou ausência de valor:

- não inferir uma regra definitiva;
- registrar a observação ou aviso na configuração;
- manter o valor editável em rascunho;
- preservar o comportamento atual como fallback, quando existir;
- documentar a decisão antes da publicação.

Exemplos que merecem tratamento configurável incluem duração e recuperação de certos descansos, aplicação de bônus raciais, concessões por nível e exceções específicas de combate. A primeira versão organiza essas regras sem tentar interpretar automaticamente todo o texto do livro.

## Referências de qualidade

A matriz de testes funcionais e de regressão está em [RPG_SYSTEMS_QA.md](RPG_SYSTEMS_QA.md).
