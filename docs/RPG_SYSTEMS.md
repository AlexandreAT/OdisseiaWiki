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
- `SistemaCondicao`, `SistemaDescansoConfig` e `SistemaMorteConfig` para sobrevivência.

`Mesa.IdSistemaVersao` é a FK opcional de transição. O relacionamento é explícito e uma versão pode continuar ligada a várias mesas mesmo depois de arquivada.

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
7. Mesas vinculadas a `1.0` continuam em `1.0`.
8. Cada mesa migra apenas por uma ação explícita e autorizada.

Uma publicação também pode ser arquivada manualmente. Quando ela é a publicação atual,
o ponteiro `IdVersaoPublicada` é limpo de forma transacional; as mesas já vinculadas
continuam usando essa versão arquivada, enquanto novas mesas aguardam uma nova publicação
ou seguem o fallback legado.

Publicar uma versão não executa migração em massa e não altera silenciosamente personagens ou mesas.

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

Na migração inicial, o seed deve vincular mesas antigas sem versão à `ODISSEIA/1.0`. Novas mesas salvam explicitamente a versão publicada escolhida. Isso impede que uma publicação futura migre mesas antigas por efeito colateral.

Uma migração de mesa deve:

- exigir autorização do proprietário ou administrador, conforme a política do fluxo;
- aceitar somente uma versão publicada e selecionável;
- validar a existência do sistema e da versão;
- registrar a alteração explicitamente;
- nunca reescrever o conteúdo de personagens de forma automática nesta primeira fase.

## Resolução e fallback

O acesso a regras deve passar por um resolver único, e não por consultas independentes espalhadas nos services. A ordem de resolução é:

1. versão explicitamente vinculada à mesa;
2. para uma mesa legada ainda sem vínculo, `ODISSEIA/1.0`;
3. quando não existe mesa, versão publicada atual do sistema padrão;
4. se a nova configuração não estiver disponível, comportamento hardcoded legado.

O resultado deve informar a versão efetiva e a origem da resolução, permitindo diagnóstico entre vínculo explícito, sistema padrão e fallback legado.

Personagens jogadores resolvem o sistema pela mesa. NPCs e visualizações sem mesa usam o sistema padrão. Uma versão arquivada ainda pode ser resolvida para uma mesa já vinculada, mas um rascunho nunca pode alimentar gameplay normal.

## Seed inicial

`SistemaRpgSeeder` roda por `DatabaseSeeder` durante a inicialização já existente do banco e é idempotente. Ele procura o sistema `ODISSEIA` e a versão `1.0` por seus identificadores naturais antes de inserir dados.

Cuidados:

- uma execução posterior não altera uma versão já publicada;
- IDs fixos não devem ser presumidos;
- `Raca` ainda não possui código estável, portanto o vínculo inicial procura nomes normalizados; configurações sem correspondência continuam válidas sem FK para não criar conteúdo Wiki incompleto;
- o seed não deve criar automaticamente conteúdo Wiki incompleto para raças ausentes;
- regras ambíguas no livro devem permanecer descritivas ou configuráveis, sem inferência silenciosa;
- o seed do sistema acontece antes do seed da mesa padrão.

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

GET    /api/sistemas-rpg/resolver?idMesa={mesaId}
POST   /api/sistemas-rpg/mesas/{mesaId}/migrar
```

Endpoints de seção recebem DTOs específicos. Não existe uma escrita do tipo `PUT /modulo/{tipo}` aceitando JSON arbitrário sem validação. A validação para publicação é parte de `POST .../publicar`, e não um endpoint separado.

As consultas são públicas, mas somente administradores recebem sistemas inativos e rascunhos. Criação, alteração, publicação, arquivamento e exclusão usam a policy `Admin`. A migração de mesa exige autenticação e validação de proprietário, exceto para administradores.

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

Os fluxos atuais continuam operando durante a migração:

- progressão ainda possui curva legada no frontend;
- recursos, atributos e defesas ainda vivem em `StatusJson`;
- raças mantêm valores em `Raca.StatusJson` e overrides em `MesaEntidadeConfig`;
- dados aceitos ainda são D6, D8 e D20 hardcoded;
- tipos de skills, magias, danos e várias escalas de item ainda estão no frontend;
- ações, descanso, morte e engine de rolagem ainda não possuem execução automática completa.

Cada integração nova deve consultar o resolver primeiro e cair no valor legado quando a configuração estiver ausente. A remoção de um hardcode só é segura depois que dados antigos, sistema padrão, NPCs sem mesa e mesas sem configuração forem testados.

Nesta entrega, `MesaService` já valida a versão informada, seleciona a versão padrão na criação e preserva a troca de versão como ação explícita. A execução das regras em fichas e páginas ainda não foi convertida em um motor; os dados novos são a base versionada para essa migração gradual.

## Como evoluir a configuração

Para criar outro sistema, use a tela `Management > Sistema`, cadastre os dados gerais, crie uma versão em rascunho, preencha todas as seções obrigatórias e publique. Para alterar regras publicadas, duplique a versão, edite o novo rascunho e publique-o; mesas existentes permanecem na versão anterior até migração explícita.

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
