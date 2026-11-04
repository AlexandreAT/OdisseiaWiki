# Levantamento das configurações do RPG para o futuro VTT

Revisão: **04/11/2026**. Base examinada: `main`, commit `a7903719`.

## 1. Objetivo e conclusão

Este documento inventaria o que pode ser configurado no Sistema de RPG, nos conteúdos e nas cópias das fichas, e identifica como essas configurações são consumidas pela ficha, pela engine de Mesa e pelo roguelike. Serve como referência de compatibilidade para construir um VTT inspirado no Roll20 sem fixar atributos, dados, condições ou equipamentos ao conteúdo padrão do Odisseia.

**A base é extensível, mas ainda não é uma engine universal.** O cadastro permite mais combinações do que cada consumidor executa. Movimento em grid, pontos de ação, fórmulas textuais, regras particulares de dano e recompensas de marcos não ganham automação apenas por estarem cadastrados. O VTT deverá reutilizar os contratos executáveis existentes e tratar as lacunas explicitamente, sem interpretar descrições como código.

O levantamento é do código e dos contratos atuais, não dos valores de um banco de produção. Não exige que todo mestre use os mesmos atributos, raças, categorias ou números do seed. Nenhuma funcionalidade de VTT foi implementada nesta entrega.

### Como consultar

- **Configuração e efeitos:** seções 4–13.
- **Itens, poderes e cópias da ficha:** seções 14–20.
- **Sessão, combate e reutilização do roguelike:** seções 21–23.
- **Correspondência com Roll20 e lacunas:** seções 24–25.
- **Checklist para validar o VTT:** seção 26.
- **Fontes e manutenção:** seções 27–28.
- **Todos os campos dos contratos de Sistema:** [índice técnico campo a campo](VTT_SYSTEM_FIELD_INDEX.md), com **52 classes e 445 declarações de propriedades**, incluindo metadados e respostas, não 445 regras editáveis.

### Legenda de maturidade

| Marca | Significado neste documento |
|---|---|
| **C** | Cadastrável/versionado; não significa executável |
| **E** | Há execução estruturada no consumidor indicado |
| **A** | Assistido: apresenta, calcula ou propõe; depende de confirmação/decisão |
| **P** | Parcial: apenas certas operações, códigos ou contextos |
| **V** | Trabalho necessário no futuro VTT; não entregue hoje |

“Mesa” significa a engine multiplayer de sessão existente. “Ficha” significa os formulários/visualizações do personagem. “Run” significa a cópia isolada usada no roguelike. Não são estados intercambiáveis.

## 2. Camadas de configuração e autoridade

| Camada | O que pertence a ela | Quem/como altera | Regra para o VTT |
|---|---|---|---|
| Sistema | Identidade do RPG e referência à publicação atual | Administração | Não conceder edição de Sistema oficial a todo mestre implicitamente |
| Versão do Sistema | Módulos, atributos, recursos, testes, condições, catálogo de itens e progressão | Rascunho administrativo; publicação validada e imutável | Fixar a versão efetiva; não buscar sempre “a mais recente” |
| Mesa | Versão escolhida, conteúdos próprios/derivados, visibilidade e overrides reconhecidos | Mestre autorizado da Mesa | Nenhum override de uma Mesa pode vazar para outra |
| Conteúdo da wiki | NPC, raça, item e vínculos de Sistema/versão | Conforme autorização editorial/global ou da Mesa | Usar o catálogo efetivo autorizado, não uma busca global irrestrita |
| Cópia de personagem | Valores, inventário, imagem, testes e ajustes daquela instância | Dono/mestre, conforme operação | Resolver a instância persistida, não substituir por `idItemBase` |
| Sessão e combate | Versão fixada, participantes, turnos, condições, cooldowns, eventos e revisões | Comandos autenticados de Mesa | Estado autoritativo no servidor, reabrível e auditável |
| Modo do roguelike | Áreas, encontros, economia, NPCs, recompensas e política de dano | Administração ou mestre no escopo autorizado | É configuração de aventura, não regra universal do Sistema |
| Run | Snapshots, equipamento, recursos, XP e memória isolada | Comandos do jogo | Não gravar na ficha real nem tratar seu simulador como a sessão multiplayer |

**Resolução do contexto:** consulta de personagem tenta sua versão fixada; depois há resolução de Mesa, vínculo da entidade e Sistema padrão/fallback conforme o caso. Uma ficha pode indicar atualização disponível sem ser atualizada automaticamente. Na engine de sessão, a versão da sessão é a autoridade para a execução; uma sessão aberta não deve mudar de regras durante o jogo. Na run, valem as versões fixadas do Sistema e do modo e os snapshots já salvos.

O runtime informa `origem`, `proveniencias`, `warnings`, `fallbacks`, vínculo acompanhado/fixo e atualização disponível. O VTT deverá exibir problemas relevantes e preservar esses diagnósticos, não escondê-los com números padrão.

Fontes: [resolver](../OdisseiaWiki/Services/SistemaRpgResolver.Runtime.cs), [DTOs de runtime](../OdisseiaWiki/Dtos/SistemaRuntimeDtos.cs), [engine de sessão](../OdisseiaWiki/Services/GameplayEngineService.cs), [Sistemas por Mesa](RPG_SYSTEMS.md), [conteúdo por Mesa](WIKI_POR_MESA.md).

## 3. Identidade, publicação, migração e módulos

### 3.1. Sistema e versões

Configurável: código estável do Sistema, nome, descrição e ativo; número da versão, versão-base e changelog. É possível criar rascunho, duplicar uma versão, publicar e arquivar. Publicações geram comparação/patch note estruturado. Publicado/arquivado não é um formulário de edição direta.

Os códigos são normalizados, usados como identidades e não devem ser confundidos com o nome traduzido. A validação geral de código usa letras/números/underscore, início por letra e tamanho previsto pelo contrato. A versão aceita formato numérico `x.y` ou `x.y.z`; não pressupor qualquer identificador de release livre.

Mesa, personagem e conteúdo global podem resolver vínculos diferentes. Conteúdo global pode acompanhar a publicação atual ou ficar fixado. Ficha e run não devem recalcular seu histórico pela publicação atual do catálogo. A migração de Mesa possui prévia, comparação, avisos e confirmação; não equivale a recriar inventário ou atribuir automaticamente novos valores a todas as fichas.

### 3.2. Módulos

As sete áreas administrativas são **Visão geral, Criação, Progressão, Exploração, Combate, Poderes e Sobrevivência**; o **Catálogo versionado de itens** possui aba própria.

Cada registro de módulo tem tipo, habilitado, `schemaVersion` e ordem. O enum reconhece: RegrasBase, CriacaoPersonagem, Progressao, Atributos, Recursos, Movimento, PontosAcao, Combate, Furtividade, Equipamentos, Defesas, Danos, Magias, Skills, Condicoes, Descanso, Exploracao, Morte, Poderes e Sobrevivencia. Esses registros não correspondem a 20 engines independentes.

**Limite importante:** a publicação atual exige os sete módulos principais habilitados no schema 1, além de níveis, atributos e recursos válidos. Nem todos os consumidores testam todos os flags de submódulos. Não assumir que desmarcar qualquer flag desliga automaticamente todos os comportamentos relacionados.

Fontes: [contratos](../OdisseiaWiki/Dtos/SistemaRpgDtos.cs), [enums](../OdisseiaWiki/Enums/SistemaRpgEnums.cs), [validação/publicação](../OdisseiaWiki/Services/SistemaRpgService.ValidationAndClone.cs), [patch/migração](../OdisseiaWiki/Services/SistemaRpgService.PatchAndMigration.cs).

## 4. Regras gerais

| Configuração | O que permite definir | Consumo atual e cuidado para o VTT |
|---|---|---|
| Dado de teste geral | Dado padrão, como D6 ou D20 | **E Mesa** no teste geral; não fixa o dado de todas as ações |
| Usa vantagem/desvantagem | Permissão para esses modos | **E Mesa** em testes gerais; modos específicos e efeitos de condições têm seus próprios caminhos |
| Crítico natural/falha crítica natural | Valores naturais de referência | **C/P**; a classificação executada vem principalmente das faixas publicadas e seus flags/códigos |
| Arredondamento | Texto da regra | **C/A**; não há interpretador universal desse texto. Cálculos específicos usam floor, truncamento ou arredondamento definidos em código |
| Regra específica prevalece | Princípio de precedência | **C/A**; não é uma linguagem automática de resolução de conflitos |
| Autoridade do mestre | Regra geral declarada | **C/A**; permissões HTTP reais continuam obrigatórias e não derivam desse booleano |
| Observações fundamentais | Explicação do Sistema | **C**, narrativa |
| Módulos e ordem | Disponibilidade/organização declaradas | Ver limites da seção 3 |

**Limite de dados:** a notação de dado geral pode passar por validação textual mais ampla que o limite operacional da rolagem. Para a engine de rolagem, usar o limite operacional de **2–1000 faces**, não concluir que qualquer dado aceito no cadastro terá execução em todos os consumidores.

## 5. Criação de personagem e raças

### 5.1. Parâmetros iniciais

Configurável: nível inicial, pontos gerais iniciais, pontos de atributo iniciais, pontos de skill iniciais, máximo de skills, magias e ultimates iniciais. Não confundir limites de criação com os limites posteriores do módulo Poderes.

**C/P Ficha:** esses dados alimentam a criação/runtime. A configuração de um direito ou quantidade não implementa sozinha uma escolha automática de poder. Na run existem regras próprias para não reaproveitar indevidamente os pontos de criação de uma ficha já distribuída.

### 5.2. Raças

Para cada raça configurada: vínculo com raça existente quando aplicável, código/nome, jogável, vida/estamina/mana/capacidade de carga base, código de atributo inicial, passivas, variantes, nível de desbloqueio, observações e ordem.

Passivas vinculadas têm ID opcional de passiva, código, nome de exibição, variante, ordem e nível de desbloqueio. Há também texto descritivo de passivas/variantes. **Esses vínculos e textos não são, por si, operações executáveis de bônus, dano ou imunidade.**

**E/P Ficha:** o runtime resolve a configuração racial; cria os recursos iniciais reconhecidos e aplica o ponto inicial no atributo configurado. Overrides raciais conhecidos da Mesa podem alterar vida, estamina, mana, carga e atributo inicial. Não é um override genérico de qualquer propriedade do Sistema.

Recursos e atributos explícitos de uma ficha/conteúdo são preservados; a raça não deve sobrescrever uma cópia editada cada vez que o token é redesenhado.

Fontes: [contratos de criação](../OdisseiaWiki/Dtos/SistemaConfiguracaoDtos.cs), [defaults e campos da ficha](../OdisseiaWikiClient/src/utils/systemRuntimeCharacter.ts), [resolução racial e overrides](../OdisseiaWiki/Services/SistemaRpgResolver.Runtime.cs).

## 6. Atributos e seus efeitos

### 6.1. Cadastro dinâmico

É possível adicionar/alterar atributos com **código, nome, grupo, mínimo, máximo natural, máximo absoluto opcional, valor comum, fórmula de teste, limite de uso, tipo do limite, descrição, ordem e ativo**.

Grupos reconhecidos: **Principal, Secundario, Defesa e Outro**. Os formulários e caminhos principais de rolagem/evolução trabalham especialmente com Principal e Secundario. Criar um atributo do grupo Outro não o integra automaticamente a todos esses caminhos.

A ficha monta campos a partir do runtime, normaliza códigos e preserva valores desconhecidos já salvos. Nomes como Força/Sabedoria e suas posições são conteúdo padrão, não uma lista que o VTT deva fixar. Há aliases legados, como `AMEACA`/`intimidacao`, e conversão de código para chave JSON. O VTT deve usar a mesma normalização, não uma segunda tabela informal de nomes.

`valorComum` é referência de escala, não o valor usado automaticamente em toda ficha nova: o helper de criação de atributos parte dos mínimos e aplica a regra inicial pertinente. `limiteUso` e `tipoLimiteUso` são cadastráveis, mas não há um contador universal que faça todo teste de atributo consumir esse limite por turno/sessão. Essa integração precisa ser explícita no VTT.

### 6.2. Valor natural, equipado e temporário

- **Natural:** investimento permanente da ficha ou da cópia da run.
- **Equipado:** bônus numérico de prótese instalada, quando suportado pelo consumidor.
- **Temporário:** efeitos ativos como `MODIFICAR_ATRIBUTO` e `MODIFICAR_ROLAGEM`.
- **Teste:** atributo selecionado na especificação da ação, somado conforme a regra executável.

O roguelike separa natural/modificador e expõe as fontes com imagem, nome e efeitos, inclusive outros atributos afetados. Não se deve somar duas vezes um bônus já reconciliado no snapshot. Alterar o nome do atributo não autoriza procurar bônus pelo novo nome; referências são por código.

### 6.3. Atributos em rolagens

**E Mesa:** testes voluntários de atributo exigem valor maior que zero e regra executável; o jogador não escolhe um modificador arbitrário. A engine lê a ficha persistida e a versão da sessão. Para valor zero, o caminho assistido é a rolagem genérica quando o mestre solicitar.

A fórmula pode fornecer dado, menção ao atributo e comparação simples. O teste de uma arma/magia/skill/prótese pode escolher código e grupo do atributo. Não há bônus universal de “Força no dano” ou “Precisão em toda arma”: é necessário que o contrato da ação/efeito o determine.

Limite operacional relevante no teste de atributo da Mesa: valor até 1000, com verificação dos limites configurados; cópias de NPC têm tratamento explícito para valores acima do teto de criação de jogador. Isso não transforma o máximo natural em um teto universal de todos os monstros.

### 6.4. Atributos alterando máximos

O módulo Progressão permite linhas com **código do atributo, recurso e percentual por valor**. Recursos executáveis nesse vínculo: vida, mana e estamina. Até 100 linhas, percentual 0–100, sem repetição do par atributo/recurso e com atributo ativo na publicação.

**E Run:** ao investir um ponto, calcula-se `percentualPorValor × novoValorNatural`; esse percentual aumenta o máximo atual do recurso. Exemplo: regra 10%, atributo de 2 para 3, máximo 100 → acréscimo 30 → máximo 130. **Não cura o recurso atual** e não é simplesmente “10% a cada ponto” nem recálculo linear pela base racial original.

**V Mesa/VTT:** não transportar automaticamente essa evolução da run para o personagem real. A aplicação confirmada de XP na engine de Mesa e o formulário de edição de nível não equivalem ao serviço de evolução automática da run.

Fontes: [campos dinâmicos](../OdisseiaWikiClient/src/utils/systemRuntimeCharacter.ts), [testes de atributo](../OdisseiaWiki/Services/GameplayActionResolver.cs), [evolução da run](../OdisseiaWiki/GameRuns/GameRunAttributes.cs), [origens de modificadores](../OdisseiaWiki/GameRuns/GameRunAttributeInfluences.cs), [próteses](../OdisseiaWiki/GameRuns/GameRunProstheses.cs).

## 7. Recursos, máximos e espaço de inventário

### 7.1. Recursos configuráveis

Cada recurso possui código, nome, mínimo, padrão, máximo opcional, permite negativo, recuperação padrão, recuperações simples/normal/longa, condição ao zerar, fórmula inicial, fórmula de máximo, fórmula geral, ordem e ativo.

**C/P Ficha:** campos podem ser gerados dinamicamente. Os fluxos principais continuam com semânticas especiais para **VIDA, MANA, ESTAMINA e CAPACIDADE_CARGA**, além de XP no nível superior do status. As fórmulas de recurso são armazenadas/exibidas, não avaliadas por um motor matemático universal.

O VTT não deverá fixar exatamente três barras, mas também não poderá prometer que um novo recurso “Calor” passa automaticamente a funcionar em consumíveis, descanso, próteses e condições. Cada consumidor tem uma whitelist própria, descrita adiante.

### 7.2. Alteração de recursos

**E/A Mesa:** propostas confirmadas aplicam operações permitidas, respeitam recurso publicado, revisão da ficha, mínimo/máximo e bloqueio de recuperação quando integrado. O patch rápido de ficha possui campos específicos Vida/Mana/Estamina/XP; não é um patch genérico de qualquer recurso novo.

Máximo e atual são diferentes. Aumentar máximo por equipamento/evolução não recupera automaticamente o atual. Remover o bônus pode limitar o atual ao novo máximo. Remover uma redução temporária restaura o limite base, não inventa cura.

### 7.3. Peso e carga

Configurável no Sistema: **usar limite de carga**, texto da penalidade e condição estruturada de sobrecarga. Na ficha/instância: peso/espaço ocupado por unidade, quantidade e capacidade de carga.

A capacidade de carga é numérica; não existe conversão universal entre “quilos”, “espaços” e “slots” só pelo nome/unidade do campo. O Sistema/conteúdo precisa usar a mesma convenção de medida.

**Divergência a preservar como pendência, não esconder:**

| Consumidor atual | Cálculo observado |
|---|---|
| Vista explodida da ficha | Peso × quantidade; reconhece aliases de peso/espaço e fallback pelo item-base; traje equipado não ocupa mochila |
| Gatilho de carga na engine de Mesa | Lê `InventarioJson`, peso/aliases e traje equipado; não agrega separadamente todo campo externo de implantes |
| Run | Soma inventário e implantes pelo peso canônico × quantidade; depósito separado não entra; não usa a mesma exceção automática de traje equipado |

Não há um contrato universal de inventário por células, volume tridimensional, encaixe geométrico ou limite global de “número de itens”. As grades/vista explodida são apresentação; não redefinem sozinhas a capacidade mecânica.

**V:** antes de mover itens por drag-and-drop no VTT, definir um único cálculo de carga para ficha/Mesa/token, com a regra de trajes e implantes explícita. Exibir sobrecarga não é o mesmo que proibir toda movimentação: a penalidade precisa de efeito executável.

Fontes: [peso da ficha](../OdisseiaWikiClient/src/components/CharacterExplodedView/characterExplodedView.utils.ts), [gatilhos da Mesa](../OdisseiaWiki/Services/Helpers/GameplayConditionRuntime.cs), [carga da run](../OdisseiaWiki/GameRuns/Inventory/GameRunCarry.cs), [patch de recursos](../OdisseiaWiki/Dtos/PersonagemJogadorDto.cs).

## 8. Dados, testes, resultados e expressões

### 8.1. Rolagem livre

**E Mesa:** grupos de dados, quantidade, faces, modo Normal/Vantagem/Desvantagem e visibilidade. Limites operacionais: até **8 grupos**, faces **2–1000**, até **100 dados físicos** por avaliação. Em vantagem/desvantagem são duas tentativas completas: o total de dados de uma tentativa precisa caber no orçamento duplicado, na prática até 50.

Vantagem mantém a tentativa de maior soma; desvantagem a de menor soma; empate mantém a primeira. Não é manter o maior dado individual de um pool inteiro. O resultado conserva valores, índices mantidos/descartados, subtotal, modificadores, total e natural.

Se a rolagem livre não corresponde ao teste geral publicado, ela pode ser rolada sem aplicar as faixas desse teste. O cliente anima os números que o servidor devolve; animação não gera outra rolagem.

### 8.2. Tabelas de testes

Cada linha de resultado configura: **código/nome do teste, dado, quantidade de dados, mínimo/máximo, exige natural, código/nome do resultado, descrição, efeito JSON e ordem**. Pode haver vários testes e resultados personalizados.

As faixas são validadas contra o dado/quantidade e não podem se sobrepor no mesmo agrupamento de teste/dado/quantidade. Um teste usado numa ação precisa de assinatura de dado/quantidade coerente; adicionar outro D20 sob o mesmo nome não deve tornar a escolha ambígua.

**E Mesa:** natural é tratado separadamente do total modificado. Faixas naturais têm precedência. A ação escolhe se faixas comuns usam o total ou o natural. Há códigos reconhecidos de crítico/falha e aliases legados; não deduzir toda semântica apenas do rótulo exibido.

O “natural” atual é o primeiro dado mantido, não uma soma universal do pool. Resultados fora das faixas geram avisos; há também ajuste específico para total modificado fora dos limites das faixas comuns. O VTT deve consumir a classificação produzida pela engine, não refazê-la no frontend.

Aliases com semântica explícita no resolver: `CRITICO`/`ACERTO_CRITICO`, `FALHA_CRITICA`/`ERRO_CRITICO` e, para natural, `ATAQUE_PRECISO`/`ACERTO_PRECISO`/`PRECISO`. Códigos próprios podem classificar resultados, mas não herdam todas as consequências desses aliases só por terem outro nome. Percentuais/dano por código devem ser configurados para eles.

### 8.3. Especificação do teste na ação

`teste` pode conter `codigoTeste`, `codigoAtributo`, `grupoAtributo`, `modo`, `usaTotalParaFaixas`, operações, alcances e modos de disparo permitidos. O código referencia a tabela da versão efetiva; o conteúdo não pode enviar uma tabela de resultado arbitrária no momento do clique.

Armas legadas com acerto D20 possuem caminhos de compatibilidade do Odisseia. Itens/poderes de outro Sistema não recebem essa regra por simples semelhança de nome. `aplicaTeste=false` é distinto de teste ausente/inválido.

### 8.4. Limite real das fórmulas

Não existe um interpretador geral equivalente a todas as expressões/macros do Roll20.

| Contexto | O que é reconhecido | O que não presumir |
|---|---|---|
| Atributo | Extração de `nDfaces`, inclusão declarada/mencionada do atributo, comparadores `>`, `>=`, `<`, `<=` e dificuldade; opções estruturadas conhecidas | Aritmética arbitrária, múltiplos termos de dados, funções, divisão, parênteses ou scripts |
| XP | Valor fixo ou dado reconhecido, modo, limites e transformação específica de paridade | Que qualquer expressão escrita em Fórmula é calculada integralmente |
| Iniciativa | Dado e termos reconhecidos de atributo/constante; parser da run é mais restritivo que o da Mesa | Que fórmulas equivalentes textualmente são aceitas por todos os parsers |
| Recursos/defesas/ações genéricas | Texto e campos de referência | Que a presença da palavra “fórmula” habilita execução |
| Descanso Formula | Configuração preservada | Recuperação automática universal; hoje permanece assistida/recusada pelo executor correspondente |
| Descrições/Rich Text/especial/bônus textual | Conteúdo narrativo | Efeito mecânico por leitura semântica do texto |

Os campos JSON estruturados que o backend entende não são todos inputs expostos nos formulários. Não confundir possibilidade de desserialização com funcionalidade de autoria disponível ao usuário leigo.

Fontes: [DTOs de rolagem](../OdisseiaWiki/Dtos/GameplayDtos.cs), [avaliador](../OdisseiaWiki/Services/GameplayRollEvaluator.cs), [resolver de ação/fórmulas e teste persistido](../OdisseiaWiki/Services/GameplayActionResolver.cs), [classificação e propostas](../OdisseiaWiki/Services/GameplayEngineService.cs).

## 9. Fontes de XP, níveis e marcos

### 9.1. Fontes de XP

É possível cadastrar **código, nome, tipo de teste, fórmula, mínimo/máximo, usa vantagem, descrição, configuração complementar e ordem**. As fontes viram ações `XP_<CODIGO>` no catálogo da engine.

**E/A Mesa:** calcula XP e registra proposta de aplicação; uma rolagem não altera o XP sozinha. Suporta valor fixo, dado reconhecido, vantagem declarada e transformação `PARIDADE_1_2` (ímpar → 1, par → 2), além dos limites. Há aliases para fontes antigas e normalização específica da vantagem legada “2D4, manter o melhor” para não rolar quatro dados indevidamente.

**Não confundir:** dado de XP pertence à fórmula da fonte de experiência; dado de loot é outra configuração. Recompensa fixa de XP de um encontro/evento/missão do roguelike é definida no modo, não uma rolagem automática de toda fonte de XP cadastrada.

### 9.2. Curva e recompensas por nível

Configurável: nível máximo, permite XP excedente e tabela contínua de níveis. Cada nível tem XP para o próximo, pontos gerais, pontos de atributo, skill e ultimate, flags de nova magia/nova skill, observação e ordem. O editor oferece geração de níveis faltantes, preenchimento por intervalo e prévia da curva; são ferramentas de edição, não outras regras de progressão.

**E Run:** ao atingir o custo do nível atual, sobe para o seguinte e concede os pontos definidos na linha do nível alcançado. Com excedente permitido, subtrai o custo e pode subir mais níveis; sem excedente, zera o XP excedente naquele avanço. Exige módulo/regras/tabela executáveis; não inventa limiar ausente. O máximo encerra a evolução.

**A/P Ficha/Mesa:** há edição/apresentação de nível/XP, consulta da curva e aplicação confirmada de XP. A apresentação da ficha ainda possui fallback legado quando falta limiar. Isso não equivale à progressão autoritativa da run e deve aparecer como limite de integração do VTT.

### 9.3. Marcos

Configurável por marco: nível, código, nome, descrição, tipo de recompensa, JSON complementar e ordem. O roguelike retém direitos/marcos em `evolucoesPendentes`, junto aos pontos de skill/ultimate e flags de nova magia/skill.

**C/P:** retenção de direito não é tela de escolha nem execução automática da recompensa. Aprender skills/ultimates por nível ou marco continua uma expansão futura; nenhuma descrição de prêmio deve conceder poderes automaticamente no VTT.

Fontes: [progressão publicada](../OdisseiaWiki/Dtos/SistemaConfiguracaoDtos.cs), [progressão da run](../OdisseiaWiki/GameRuns/GameRunProgression.cs), [apresentação da ficha](../OdisseiaWikiClient/src/utils/characterProgression.ts), [formulário](../OdisseiaWikiClient/src/routes/Management/ManagementSystem/components/ModuleForms/ProgressionModuleForm.tsx).

## 10. Exploração, movimento, pontos de ação e furtividade

| Grupo | Tudo o que é configurável | Estado atual |
|---|---|---|
| Movimento | Usa grid, metros por quadrado, movimento gratuito, custo de estamina por quadrado, máximo de quadrados por turno, permite mover após ataque, observações | **C; V** movimentação tática com posição/caminho e cobrança |
| Pontos de ação | Habilitado, pontos por turno, segundos por ponto, permite acumular, limite acumulado | **C; V** orçamento transacional de ações/movimento no tabuleiro |
| Ações de exploração | Código, nome, tipo, custo de PA/estamina/mana, encerra turno, permite combo, exige alvo, fórmula, descrição, ordem e JSON complementar | **C/P** catálogo; não é um executor genérico de cada ação cadastrada |
| Carga | Usa limite e penalidade textual | **E/P** cálculo/gatilhos reconhecidos; ver seção 7 |
| Furtividade | Observações/regras textuais | **C/A**, não há motor espacial universal de percepção/ocultação |

**O que ainda não existe como regra configurável executada:** política de diagonais, terreno difícil, colisão, paredes/portas, tamanho físico de token, custo por altitude, voo, teleporte, visão, iluminação, linha de visão e seleção geométrica de área. Não usar `metrosPorQuadrado` para inventar essas decisões.

A validação de cadastro aceita valores não negativos em vários parâmetros; uma escala zero não pode ser usada como divisor no VTT. A validação espacial futura precisará distinguir parâmetros desligados/ausentes de uma configuração inválida para a cena ativa.

**V:** ao arrastar token, converter pixels → células → distância segundo a cena e a versão, conferir ator/turno/permissão, movimento gratuito, saldo/limite e bloqueio pós-ataque, e registrar a alteração uma vez. Esses passos são requisitos de implementação, não comportamento já entregue pelo cadastro.

Fontes: [contratos de exploração](../OdisseiaWiki/Dtos/SistemaConfiguracaoDtos.cs), [formulário](../OdisseiaWikiClient/src/routes/Management/ManagementSystem/components/ModuleForms/ExplorationModuleForm.tsx), [limites de publicação](../OdisseiaWiki/Services/SistemaRpgService.ValidationAndClone.cs).

## 11. Condições e efeitos estruturados

### 11.1. Cadastro da condição

Configurável: **código, nome, descrição, tipo, duração padrão, unidade, empilhável, remoção automática, permite sobrescrever, valor padrão, recurso, operação, valor do efeito, momento, recurso/comparador/valor de gatilho, cooldown, regra de remoção, configuração complementar e ordem**.

Imagem opcional quadrada com crop padrão é guardada na configuração complementar (`imagem`). A execução usa código/ID; imagem e descrição não definem o efeito. Ausência de imagem tem fallback visual.

Unidades do contrato: Turno, Minuto, Hora, Descanso, Sessao e Permanente. **A enumeração é mais ampla que a automação de cada consumidor.** O editor de origens e a duração automática executável usam especialmente Turno/Hora; a Mesa avança durações em turnos e trata Sessao no encerramento de combate. Isso precisa ser reconciliado com um relógio de cena/sessão no VTT.

Existe um efeito principal e até **oito adicionais** em `configuracaoPadraoJson.efeitos`. Cada efeito adicional possui operação, recurso/alvo mecânico, valor inteiro e momento. O tipo da condição (buff, penalidade etc.) não substitui esses efeitos.

### 11.2. Primitivas aceitas

| Operação | Alvo/valores aceitos | Momento | Consumo atual |
|---|---|---|---|
| `SOMAR` | Vida/Mana/Estamina; valor não negativo | Ao aplicar/início/fim conforme regra | **E Mesa/Run**, respeitando limites e bloqueios integrados |
| `SUBTRAIR` | Vida/Mana/Estamina; valor não negativo | Ao aplicar/início/fim | **E Mesa/Run**; redução direta de recurso, não presumir passagem por armadura |
| `DEFINIR` | Vida/Mana/Estamina; valor não negativo | Ao aplicar/início/fim | **E Mesa/Run**, com limites |
| `REDUZIR_LIMITE_PERCENTUAL` | Vida/Mana/Estamina; 0–100% | Enquanto ativa | **E Mesa/Run**, preservando limite base |
| `MODIFICAR_LIMITE_PERCENTUAL` | Vida/Mana/Estamina; −100 a +1000% | Enquanto ativa | **E Mesa/Run** nos limites reconhecidos |
| `BLOQUEAR_RECUPERACAO` | Vida/Mana/Estamina | Enquanto ativa | **E/P Mesa/Run**; precisa ser consultado por cada origem de cura/descanso |
| `MODIFICAR_ATRIBUTO` | Código de atributo ativo; não `TODOS`; delta assinado | Enquanto ativa | **E/P** em testes da Mesa e cálculos da run; não regrava arbitrariamente o atributo natural |
| `MODIFICAR_ROLAGEM` | Código de atributo ou `TODOS`; delta assinado | Enquanto ativa | **E Mesa/Run** nos testes integrados |
| `VANTAGEM` / `DESVANTAGEM` | Teste; sem magnitude útil | Enquanto ativa | **E Mesa/Run**; regras de combinação não são um contador genérico de vantagens |
| `MODIFICAR_DANO` | `TODOS`; delta assinado | Enquanto ativa | **E Run; P Mesa**: a primitiva existe, mas não há consumo equivalente geral no cálculo de dano da engine de Mesa |
| `MODIFICAR_DEFESA` | `ARMADURA`; delta assinado | Enquanto ativa | **E Run; P Mesa**: não é bônus universal de qualquer tipo de defesa |
| `PERDER_TURNOS` | `TURNO`; 1–100 | Ao aplicar | **E Run; V** integração equivalente com avanço de turno da Mesa |

Limite geral dos valores numéricos de efeito: −1.000.000 a +1.000.000, restringido por operação. Recuperações/reduções diretas não usam número negativo para inverter o efeito; escolha a operação correspondente. Os valores decimais do efeito principal podem ser truncados no caminho executável inteiro. O índice técnico preserva o tipo do contrato, não promete precisão decimal em cada executor.

### 11.3. Gatilhos automáticos

É possível definir recurso/medida, comparação e limiar. Comparações conhecidas: `<`, `<=`, `>`, `>=`, `==`, `!=` e aliases textuais reconhecidos.

Na Mesa, a sincronização reconhece recursos e medidas de carga (`CARGA`, `EXCESSO_CARGA`). Na run, há reconciliação de carga/recursos e montagem de condições automáticas do combate, especialmente Vida/Mana/Estamina. A condição pode reagir quando o gatilho cessa, respeitar cooldown e exigir rearme para não reaplicar infinitamente enquanto o recurso continua na mesma situação.

**Atenção:** `condicaoAoZerar` no cadastro do recurso não é substituto universal do gatilho estruturado da condição. Configure o gatilho correspondente; não presumir automação só porque foi escrito um código naquele campo do recurso.

### 11.4. Origens em item, magia, skill ou prótese

Cada origem pode definir:

- Código da condição e valores individuais dos efeitos (`valoresEfeitos`, por índice).
- Valor principal e duração próprios, com fallback para a condição publicada.
- Unidade da origem: Turno ou Hora nos caminhos de autoria/execução suportados.
- Gatilho: **Acerto**, **resultado natural**, **resultado classificado**, **Ao usar** ou **Ao equipar**.
- Resultado natural por lista e/ou intervalo; resultado classificado por código da tabela.
- Destinatário: **Alvo**, **Usuário** ou **Todos os inimigos**.
- Teste de resistência opcional: quantidade de dados, faces, atributo e dificuldade.

Resistência reconhecida: 1–10 dados, 2–1000 faces, atributo ativo e dificuldade no limite operacional. É uma reação, não um novo turno de ataque. Na run a resistência é executada pelo simulador; no fluxo de Mesa pode ser proposta/assistida e precisa de integração explícita antes de uma aplicação automática equivalente.

Gatilhos naturais de ataque da run ainda possuem validações específicas de **D20/1–20**. Criar uma origem em outra escala não garante execução no autobattler. O VTT não deve copiar esse teto para toda rolagem, nem prometer suporte sem ampliar o contrato.

`AO_EQUIPAR` é integrado à reconciliação da run. A existência desse valor no formulário da ficha não significa que a vista explodida ou o ato de rolar já aplique condições de equipamento automaticamente na Mesa.

### 11.5. Empilhamento, substituição, duração e remoção

Empilhável, permite sobrescrever e duração são independentes. Uma condição não empilhável pode ser preservada ou substituída conforme configuração; empilhar pode multiplicar efeitos ou manter entradas, de acordo com o consumidor. O VTT deve definir uma identidade de efeito/origem e não deduplicar todos os efeitos apenas pelo nome.

Remoções estruturadas: **Manual, Duração, Gatilho cessou, Descanso simples, Descanso normal, Descanso longo, Cura e Magia**. Combinações usam códigos separados por `;`; existem aliases legados. Descanso de grau maior satisfaz remoção que exige um grau menor. Texto livre de remoção não vira automação.

O cooldown de condição é distinto do cooldown de poder. O runtime preserva limite base e estado de rearme. Remover e reaplicar não deve duplicar bônus, restaurar recursos indevidamente ou manter um limite reduzido para sempre.

Na run há tempo de jogo em minutos, duração por turno e reconciliação entre combate/rotas/descanso. Na Mesa, avançar turno processa início/fim e reduz turnos/cooldowns do participante; não existe a mesma passagem universal de horas de uma cena tática. Não usar o tempo real do navegador para expirar efeitos de jogo.

### 11.6. Estado e apresentação

Condição ativa preserva origem, código/nome, valor, duração/restante, unidade, acúmulos, status e dados de regra. Na run existem imagem/fallback, log de aplicação/expiração e descrição das contribuições. O VTT deverá ter marcadores visuais ligados a esses registros, não apenas ícones decorativos sem efeito mecânico.

Fontes: [primitivas e limites](../OdisseiaWiki/Services/Helpers/SistemaCondicaoEfeitos.cs), [remoções](../OdisseiaWiki/Services/Helpers/SistemaCondicaoRemocao.cs), [runtime de Mesa](../OdisseiaWiki/Services/Helpers/GameplayConditionRuntime.cs), [combate da Mesa](../OdisseiaWiki/Services/GameplayCombatService.cs), [modificadores de rolagem](../OdisseiaWiki/Services/GameplayEngineService.cs), [simulador](../OdisseiaWiki/GameRuns/Battle/AutoBattleSimulator.cs), [origens da run](../OdisseiaWiki/GameRuns/Inventory/GameRunCarry.cs), [guia de condições](CONDITIONS_ENGINE.md).

## 12. Descanso, recuperação, morte e sobrevivência

### 12.1. Descansos

Cada descanso permite tipo/código, nome, duração mínima/máxima em minutos, recuperação de vida/mana/estamina, modalidade ValorFixo/Percentual/Formula, exige guarda, intervalo de teste de guarda, permite atividades, configuração complementar e ordem.

**E/P Mesa:** recuperação fixa/percentual mediante comando autorizado; guarda precisa ser confirmada quando exigida. Recuperação por Formula permanece assistida. Cadastrar um intervalo de teste de guarda não cria automaticamente encontros, vigias ou rolagens periódicas.

**E/P Run:** utiliza descansos publicados executáveis, inclusive Base e descanso equipado/curto; regras com guarda/fórmula podem ser recusadas conforme contexto. Médico recupera até os limites efetivos sem significar descanso e sem reparar defesas. Bloqueio de recuperação e remoções de condição precisam ser respeitados.

Há recuperação também no cadastro do recurso. O executor de descanso consulta a linha do descanso apropriado; não presumir que somará todas as recuperações de todos os locais de configuração.

### 12.2. Morte e sobrevivência

Configurável: limite de beira da morte, quantidade de testes em combate/fora dele, sucessos necessários, dado de sobrevivência, mínimo de sucesso, limiar/multiplicador de desmembramento, limiar/multiplicador de morte instantânea, permite estabilização manual, observações e JSON complementar. Existe suporte específico para indicar limite de vida em percentual no JSON conhecido.

**E/P Mesa:** sincroniza beira da morte, acumula sucessos/falhas em testes de sobrevivência e permite estabilização manual pelo mestre quando a regra autoriza. O limite de falhas deriva da quantidade de testes em combate e dos sucessos necessários. Alterações de recursos podem sincronizar esses estados na mesma transação.

**C/A/P:** número de testes fora de combate, desmembramento e morte instantânea não formam um motor universal de lesões apenas por possuírem campos. Devem ser auditados como capacidades distintas antes de automatizar no VTT.

**Run:** vida esgotada encerra a batalha/run conforme seus contratos; não é equivalente ao fluxo multiplayer de estabilização/sobrevivência. Não substituir o estado de morte da Mesa por “perdeu a run”.

`regraLoot` e `regraRefeicoes` em Sobrevivência são campos narrativos, distintos do loot estruturado do modo e das recuperações de consumíveis.

Fontes: [contratos](../OdisseiaWiki/Dtos/SistemaConfiguracaoDtos.cs), [descanso/sobrevivência da Mesa](../OdisseiaWiki/Services/GameplayCombatService.cs), [limiar percentual e sincronização](../OdisseiaWiki/Services/Helpers/GameplayConditionRuntime.cs), [recuperação da run](../OdisseiaWiki/GameRuns/Inventory/GameRunRecovery.cs).

## 13. Configuração geral de combate e defesas

Configurável no módulo Combate:

- Usa iniciativa, fórmula de iniciativa, segundos por turno, estamina por ataque adicional e regra textual de declaração de ações.
- Limites por tipo/arquétipo de arma: máximo de tiros, rajadas e golpes.
- Percentual de dano em área por código de resultado.
- Tabelas de dados/resultados.
- Tipos de dano e tipos de defesa.

### 13.1. Tipos de dano

Cada tipo possui código, nome, descrição, ignora armadura/proteção/escudo, periódico, área, JSON complementar e ordem.

**C/P:** os seletores/referências podem usar esses tipos, mas o simulador atual não implementa genericamente todas as flags de penetração, resistências, vulnerabilidades, dano periódico e geometria. `periodico=true` não agenda um efeito; periodicidade executável hoje vem de condições. O dano em área executável do ataque é explicado na seção 16, não nasce de qualquer texto/nome do tipo de dano.

### 13.2. Tipos de defesa

Cada defesa possui código, nome, descrição, ordem de aplicação, comportamento, fórmula, JSON complementar e ordem de exibição.

**E/P Run:** resolve a ordem publicada para as defesas reconhecidas:

| Código + comportamento esperado | Regra executada |
|---|---|
| `ESCUDO` + `BloqueiaUmDano` | Usa seu valor em um dano positivo e se desfaz; excedente continua pelo fluxo defensivo |
| `PROTECAO` + `AbsorveEDesgasta` | Reserva absorvente consumida; excedente segue |
| `ARMADURA` + `AbsorcaoConstante` | Absorção fixa por acerto; não diminui só por absorver |

Se há defesa ativa cuja ordem/comportamento não é executável na versão, a montagem recusa em vez de inventar uma regra. Adicionar uma defesa “Campo temporal” não cria um quarto comportamento no simulador.

**A Mesa:** a aplicação de dano admite mitigação confirmada e identificação de defesas usadas. Não equivale ao mesmo cálculo automático de desgaste por equipamento da run. O VTT precisa decidir/expor a aplicação assistida ou portar explicitamente um contrato comum.

Quebra/destruição de armadura, penetração por tipo de dano e resistências customizadas continuam lacunas de automação geral.

Fontes: [configuração de combate](../OdisseiaWiki/Dtos/SistemaConfiguracaoDtos.cs), [montagem e ordem defensiva da run](../OdisseiaWiki/GameRuns/Battle/GameBattlePreviewFactory.cs), [contratos de defesa](../OdisseiaWiki/GameRuns/Battle/GameBattleContracts.cs), [aplicação confirmada](../OdisseiaWiki/Services/GameplayEngineService.cs).

## 14. Catálogo versionado de itens

### 14.1. Hierarquia

O catálogo possui três níveis: **Tipo → Categoria → Arquétipo**. Não existe uma árvore arbitrária de subclasses infinitas. Exemplos como “Arma → Armas à distância → Pistola” ou “Traje → Proteções vestíveis → Colete” são conteúdo, não regras fixas universais.

Cada escopo permite código, caminho, nome, descrição, ordem, ativo, pai/filhos, campos, faixas, referências e, para arquétipos de traje, compatibilidade. O nível intermediário permite compartilhar regras entre arquétipos; não é apenas uma pasta visual descartável.

Limites relevantes do catálogo: códigos até 50 caracteres, nomes de escopo/campo/faixa/referência até 150, caminho até 200, unidade até 50 e valor de referência até 250. A lista de compatibilidade de um traje aceita até 500 caminhos válidos. IDs e caminhos de origem são metadados, não texto livre de regra.

**Limite relevante:** o catálogo aceita hierarquias configuradas, mas os formulários de item mapeiam os tipos mecânicos conhecidos **ARMA, TRAJE, CONSUMIVEIS, ACESSORIO, IMPLANTE e OUTRO**. Criar um sétimo tipo-raiz não cria automaticamente formulário, parser e executor para ele. Categorias/arquétipos personalizados dentro dos tipos suportados são outro caso.

### 14.2. Campos

Por campo: código, nome, tipo, unidade, obrigatório, descrição e ordem. Tipos aceitos: **Texto, Inteiro, Decimal, Booleano, Codigo e Lista**. O runtime inclui caminho de origem para mostrar herança/proveniência.

**C/P:** definição de campo serve ao catálogo/runtime, mas os formulários mecânicos e os executores ainda conhecem campos específicos. Adicionar `CARGA_SOLAR` ao catálogo não cria automaticamente um input universal, uma barra ou um novo tipo de dano.

### 14.3. Faixas e escalas

Por faixa: código do campo, nome, mínimo, máximo, referência, unidade, descrição, ordem e origem. Referência deve estar dentro do intervalo e o campo precisa existir no escopo/herança.

São referências e validações de catálogo; valores explícitos de conteúdo podem gerar avisos de fora da referência. **Não confundir faixa sugerida com bloqueio mecânico universal**, nem sobrescrever silenciosamente item personalizado para fazê-lo caber no catálogo.

### 14.4. Referências e herança

Tipos de referência conhecidos: TipoDano, TipoDefesa, Alcance, Material, ParteCorpo, Lado, Modificacao, Lacrima e Outro. Cada uma tem código, nome, valor, descrição e ordem.

O runtime compõe campos/faixas/referências do tipo, categoria e arquétipo e preserva sua origem. Referências alimentam seletores conhecidos. Excluir/inativar uma referência não apaga automaticamente valores já salvos nas cópias.

No item, `codigoCategoria` e `codigoArquetipo` são referências explícitas; há resolução legada por `tipoArma`, `tipoTraje` e `parteCorpo`. Ambiguidade de código entre categorias não deve ser resolvida pelo primeiro nome parecido.

### 14.5. Compatibilidade de trajes

Cada arquétipo de TRAJE possui **Pode usar junto com**, um seletor múltiplo dinâmico. As opções acompanham criação/remoção/renomeação do catálogo em edição. O valor usa caminhos completos, não apenas rótulos.

- Lista vazia: não admite outro traje, nem do mesmo arquétipo.
- Selecionar o próprio arquétipo: permite peças adicionais daquele arquétipo.
- Selecionar outro: permite a combinação quando a regra do outro lado também permite.
- Campo ausente/nulo: compatibilidade legada, diferente de lista vazia explícita.
- Próteses não entram na matriz de trajes.

**E Run:** valida pares, independentemente da ordem de equipar, no equipamento direto, loadout e outros pontos integrados. Inativo/inexistente/ambíguo pode ser recusado. **P Ficha:** o boneco/vista explodida usa também slots corporais e não é, por si, o validador autoritativo dessa matriz para toda a Mesa. O VTT deverá integrar a mesma validação ao comando de equipamento que adotar.

Fontes: [contratos de catálogo](../OdisseiaWiki/Dtos/SistemaRuntimeDtos.cs), [validação/hierarquia](../OdisseiaWiki/Services/SistemaRpgItemCatalogService.cs), [catálogo dos formulários](../OdisseiaWikiClient/src/utils/systemItemFormCatalog.ts), [compatibilidade da run](../OdisseiaWiki/GameRuns/Inventory/GameRunOutfitCompatibility.cs), [compatibilidade cliente](../OdisseiaWikiClient/src/utils/outfitCompatibility.ts).

## 15. Item global versus instância personalizada

No conteúdo/instância são configuráveis: nome, tipo, quantidade, peso, valor de compra opcional, discrição, descrição, efeito descritivo, imagem, tags, visibilidade/destaque, vínculo de Sistema/versão e atributos específicos do tipo.

Ao adicionar um item à ficha, a cópia recebe identidade local própria (`id`) e referência ao original (`idItemBase`). Pode ter imagem, preço, dano, teste, condições, munição, bônus e outros atributos diferentes do original. Acessório anexado também possui snapshot local. Magias/skills possuem suas identidades de instância e referências-base quando existentes.

**Regra obrigatória para o VTT:** usar a instância da ficha do ator, com sua revisão. `idItemBase` serve à origem/comparação, não a buscar o item atual e ignorar as edições da cópia. O catálogo de condições/testes da cópia é o contexto do personagem/Mesa, não o Sistema original do item ou a publicação global mais recente.

Metadados `__vistaExplodida` registram chave local, ordem, posição, rotação, célula e slot equipado. Eles não são posições de token no tabuleiro. Atribuir um slot visual não executa automaticamente toda regra de bônus do jogo.

Os formulários atuais de personagem trabalham com rascunho e salvamento de ficha; o inventário da **run** salva cada gesto. Não presumir que a retirada do botão Salvar na run mudou todo formulário de personagem do site.

Fontes: [modelos de item](../OdisseiaWikiClient/src/models/Itens.ts), [identidade e seções de inventário](../OdisseiaWikiClient/src/utils/itemInventorySections.ts), [formulário compartilhado de ficha](../OdisseiaWikiClient/src/routes/Shared/CharacterForms/CharacterSystemForm/CharacterSystemForm.tsx), [resolução da instância](../OdisseiaWiki/Services/GameplayActionResolver.cs).

## 16. Armas, ataques, munição, acessórios e dano em área

### 16.1. Configurações da arma

Tipo/arquétipo, tipo de dano, dano base, dano curto/médio/longo, dano em área, dano preciso, cadência, tipo de disparo Tiro/Rajada, limites de ataques/tiros/rajadas, usos até a pausa, capacidade de munição, controla munição, munição atual, custo de munição por tiro/rajada, estamina por ataque, acerto legado, teste estruturado, condições e duração descritiva.

Há aliases legados de ataques por turno e munição `{capacidade, atual}`. O VTT deve aceitar leitura compatível sem perpetuar a confusão entre cadência e custo de rajada.

### 16.2. Quatro números independentes

| Campo/regra | Significado | Exemplo |
|---|---|---|
| Munição por ataque | Quantas unidades cada tiro/rajada consome | Rajada consome 10; pente 60 permite 6 rajadas |
| Cadência e limites por turno | Quantos ataques/tiros/rajadas podem ser selecionados/executados | Cadência 2 limita a 2 rajadas, não a 2 balas |
| Capacidade/munição atual | Tamanho do carregador e saldo | Recarregar repõe o carregador conforme o contrato |
| Usos até a pausa | Comprimento de sequência antes de percorrer outras ações/pausar | Lança-chamas sem munição pode parar após 3 usos e voltar no ciclo seguinte |

Valem o menor teto aplicável entre item, modo de disparo, arquétipo do Sistema e recursos disponíveis. Limites do Sistema aceitam 0–100 por modalidade; 0 não elimina outros limites. Cadência 0 representa livre naquele limitador, não munição infinita.

**E Run:** usa os ciclos de ações, renova pausa após o ciclo adequado, dá oportunidade de recarregar e não bloqueia a arma para sempre. Ausência de reserva configurada pode permitir recargas no encontro; reserva explícita é finita. Não criar economia de pentes/recarga no VTT por suposição desse comportamento do minijogo.

**E/A/P Mesa:** valida quantidade de uma solicitação, modo, alcance, limites e proposta de consumo. Isso **não é um orçamento acumulado universal por turno** que impeça duas requisições separadas de ultrapassar a cadência. Recarga automática/ciclo de pausa do autobattler também não constitui um comando multiplayer equivalente já pronto.

### 16.3. Modificadores e acessórios

Modo de modificadores: distância ou corpo a corpo, com override explícito para arquétipo personalizado. A classificação legada possui lista conhecida de tipos à distância; criar um arquétipo novo exige declarar o modo correto em vez de depender do nome.

Modificadores numéricos: curta, média, longa, ataque, revidar, dano e estamina. Efeitos adicionais em texto/lista permanecem descritivos quando não possuem condição/contrato executável.

Acessório permite compatibilidade todas/distância/corpo a corpo, modificadores, slot e descrição/efeitos. Anexar cria snapshot com `idItemBase`, nome e atributos. A resolução soma modificadores compatíveis e registra as fontes; não altera o original da wiki.

Operações estruturadas do teste podem permitir ATACAR, DEFENDER, REVIDAR ou outros valores reconhecidos pelo caminho. O resolver atual de corpo a corpo usa uma ação por rolagem; a run agrega a quantidade de golpes no seu próprio contrato.

### 16.4. Dano em área

**E Run:** dano em área positivo substitui o dano base/por alcance da ação. Pode ser o único dano. Aplica a todos os inimigos vivos do combate, com defesas individuais, uma rolagem e cobrança de custos por ataque — nunca por vítima. Não atinge aliados do próprio atacante por padrão.

O Sistema configura percentual por **código de resultado**, inclusive erro comum, falha crítica, acerto, preciso, crítico e resultados próprios. Limite publicado: 0–10.000%. Exemplos: 0 = nenhum dano; 10 = 10%; 100 = normal; 150 = uma vez e meia; 200 = dobro. Sem linha explícita, o helper usa o padrão reconhecido de acerto/erro, não uma fórmula textual arbitrária.

Nesse fallback, crítico reconhecido ou código iniciado por `ACERTO` recebe 100%; falha crítica e outros códigos recebem 0%. Para um resultado próprio como `SUCESSO_ESPECIAL`, configurar a linha explicitamente em vez de esperar inferência pelo significado do nome.

**A/P Mesa:** o helper é compartilhado nas propostas de dano; aplicar dano/alvos permanece confirmado. **V:** selecionar geometricamente vítimas por círculo/cone/linha, distância, obstáculos e fogo amigo. “Todos os inimigos da run” não equivale a “todos os tokens dentro de 6 metros”.

### 16.5. Dano preciso e dano por resultado

O campo de dano preciso existe no conteúdo, mas a run também utiliza multiplicador/bônus por código de resultado do **modo**, enquanto NPCs podem ter valores por resultado. O VTT deve escolher o contrato correto; não somar automaticamente campo preciso, multiplicador do modo e percentual de área como três bônus independentes.

Fontes: [atributos de armas/acessórios](../OdisseiaWikiClient/src/models/Itens.ts), [resolver de parâmetros](../OdisseiaWiki/Services/GameplayActionResolver.cs), [montagem da run](../OdisseiaWiki/GameRuns/Battle/GameBattlePreviewFactory.cs), [percentuais de área](../OdisseiaWiki/Services/Helpers/GameplayAreaDamage.cs), [ciclo de combate](../OdisseiaWiki/GameRuns/Battle/AutoBattleSimulator.cs), [contratos de munição](../OdisseiaWiki/GameRuns/Battle/GameBattleContracts.cs).

## 17. Trajes e equipamentos defensivos

Traje permite subcategoria/arquétipo, **armadura base, proteção base e escudo base**, resistências, penalidades, especial, efeito, teste opcional e condições. Resistência/penalidade textual não constitui efeito executável por si.

Outros itens podem fornecer proteção/armadura/escudo pelos campos correspondentes. Próteses usam os mesmos campos base de defesa que trajes. A quantidade de um stack não significa equipar automaticamente todas as unidades.

**E Run:** só peças equipadas contribuem; proteção e escudo têm valores restantes por instância. Retirar/recolocar, vender, guardar ou proteger não pode restaurar o gasto. Armadura é absorção constante, não uma reserva gasta por absorção comum. A matriz de trajes impede combinações proibidas mesmo para peças sem defesa, como óculos.

Base pode reparar proteção conforme opção do modo; não repõe escudo por descanso. Engenheiro possui conserto pago e devolve as defesas danificadas conforme serviço publicado. Isso não autoriza “reparar tudo grátis” no token da Mesa.

**P Ficha/Mesa:** campos defensivos existem na ficha, e slots existem na vista explodida. O cálculo automático reversível de equipamento/desgaste por peça da run não está automaticamente aplicado a toda ficha real. O VTT precisa centralizar esses cálculos antes de editar barras derivadas.

Fontes: [equipamento defensivo da run](../OdisseiaWiki/GameRuns/Battle/GameRunDefensiveEquipment.cs), [compatibilidade](../OdisseiaWiki/GameRuns/Inventory/GameRunOutfitCompatibility.cs), [vista explodida](../OdisseiaWikiClient/src/components/CharacterExplodedView/CharacterExplodedView.tsx), [conserto](../OdisseiaWiki/GameRuns/GameRunNpcServices.cs).

## 18. Próteses passivas e ofensivas

Configurável: parte do corpo, lado, material, modelo, slots de modificações/lácrimas, exige amputação, bônus vitais/atributos, defesas, especiais e listas de modificações/lácrimas com nome/descrição. Parte/material/lado podem receber referências do catálogo conhecido.

Bônus vitais: vida, mana e estamina. Bônus de atributo podem conter códigos numéricos; a reconciliação da run procura atributos ativos de grupo Principal/Secundario na versão, em vez de executar qualquer chave desconhecida.

Prótese com teste também admite teste da engine, dano base/melee, danos por alcance/área/preciso, condições, modificadores e demais campos de ataque aplicáveis.

| Caso | Comportamento executável na run |
|---|---|
| Sem teste | Instala como equipamento passivo; aplica bônus e defesas reconhecidos, não ocupa ação ofensiva |
| Com teste executável | Pode ocupar ação como arma; a instalação também aplica bônus/defesas |
| Com teste inválido | Não inventa ataque a partir de imagem/nome/especial; exibe erro de execução |
| Instalar/retirar repetidamente | Deltas reversíveis; não duplica bônus nem cura por reequipar |
| Máximo alterado por condição | Bônus é reconciliado sobre a base apropriada, sem multiplicar a penalidade |

**P Mesa:** rolagem da prótese pode usar a referência de instância. O serviço de bônus passivos reversíveis da run não é uma automação geral já conectada a todos os formulários/fichas multiplayer. Modificações/lácrimas descritivas não são scripts de comportamento.

Fontes: [modelo de prótese](../OdisseiaWikiClient/src/models/Itens.ts), [bônus reversíveis](../OdisseiaWiki/GameRuns/GameRunProstheses.cs), [ações](../OdisseiaWiki/Services/GameplayActionResolver.cs), [bônus de defesa](../OdisseiaWiki/GameRuns/Battle/GameRunDefensiveEquipment.cs).

## 19. Magias, skills, ultimates e passivas

### 19.1. Configuração do Sistema

Poderes permite limite de magias, permite magias compostas e regra de aprendizado. Cada tipo de magia possui código/nome, descrição, cor, afinidade, custo base, JSON e ordem. A ficha usa tipos publicados nas opções; o custo base/tipo não vira automaticamente uma fórmula de custo em toda magia.

Configuração de skills: máximo de skills, nível máximo de skill, máximo de ultimates, nível de desbloqueio de ultimate, máximo de magias opcional, usa cooldown, permite artes etéricas e observações. A presença de um limite no contador da tabela não comprova bloqueio autoritativo equivalente em toda edição/importação da ficha.

Os flags de magias compostas e artes etéricas não criam um executor genérico para combinar descrições, inventar custos ou somar efeitos de vários poderes. São permissões/configuração declaradas que precisam do fluxo executável correspondente.

### 19.2. Conteúdo da ficha

Cada magia/skill pode ter identidade, nome, descrição/efeito, tipo ataque/suporte/buff/debuff, elementos, custo declarado, imagem e atributos. Skill possui nível quando aplicável. Nos atributos: teste, acerto legado, dano, especial, bônus descritivo, condições, custo estruturado de recursos, cooldown e limites reconhecidos de ataques.

Custo em texto (`custo`) é distinto de `custoMana`, `custoEstamina`, `custoVida` e aliases estruturados aceitos. “Gasta metade da mana e causa o dobro” em descrição não é executado como fórmula. Cooldown textual legado tem leitura limitada; preferir `cooldownTurnos` quando houver automação.

Magias podem listar `removeCondicoes`, mas só condições cuja regra permite remoção por MAGIA são reconhecidas pelo fluxo correspondente.

### 19.3. Execução

- **Mesa:** teste executado por referência e custos/efeitos propostos; aplicação é outra operação confirmada. Poder sem teste estruturado não recebe automaticamente o mesmo executor de utilitário sem teste da run.
- **Run:** ofensivos usam o contrato D20 suportado, dano/condições e custos publicados. Também há utilitários sem teste para recuperação, condições ao usar e remoções reconhecidas; não exigem dano para serem úteis.
- **Cooldown:** governado também por `usaCooldown`; não confundir com pausa de arma ou cooldown da condição.
- **Alvo aliado:** suporte narrativo ou nome “cura de aliado” não significa que o autobattler já sabe selecionar aliados; esse contrato não é geral.
- **Ultimate/passiva:** conteúdo/referência/direitos existem; não há execução universal de texto ou escolha por marco pronta. O catálogo de skills/ultimates do modo ainda é editorial no fluxo de progressão.

Proficiências, passivas raciais/de personagem e referências de ultimate também aparecem como conteúdo da ficha, com nomes e descrições. Não são uma tabela universal de modificadores executáveis: não somar proficiência ou conceder habilidade pelo nome sem contrato. História, cidade, alinhamento, traços, galerias e vínculos são dados narrativos/visuais, com visibilidade própria, não geradores automáticos de bônus.

Fontes: [configuração](../OdisseiaWiki/Dtos/SistemaConfiguracaoDtos.cs), [magias](../OdisseiaWikiClient/src/models/Magias.ts), [skills](../OdisseiaWikiClient/src/models/Skills.ts), [resolver](../OdisseiaWiki/Services/GameplayActionResolver.cs), [contrato de utilitários e D20 da run](../OdisseiaWiki/GameRuns/Battle/GameBattlePreviewFactory.cs).

## 20. Consumíveis e outros utilitários

Consumível permite recuperação de vida/mana/estamina, duração descritiva, especial, teste opcional e condições. Outros itens admitem dano, defesas e recuperações pelos campos reconhecidos. Efeito textual continua separado do efeito estruturado.

**E Run:** usar uma unidade altera recursos/condições, respeita quantidade, limites/bloqueios e remove a entrada quando esgota. Equipado como utilitário no ciclo, usa **uma vez e segue à próxima ação**, mesmo que restem unidades; não monopoliza turnos como uma arma. Itens passivos/defensivos não devem desaparecer porque forneceram bônus.

**P/A Mesa:** referência de item e propostas existem, mas o consumo geral de stack/utilitário sem teste não tem equivalência automática completa com o inventário da run. O VTT deverá ter comando explícito para usar/consumir com quantidade, custo, alvo, revisão e efeito, sem apenas decrementar uma cópia no frontend.

Itens sem preço têm tratamento de zero nos fluxos do jogo que o permitem; isso não transforma peso/custo ausente em uma regra universal de todos os conteúdos.

Fontes: [atributos](../OdisseiaWikiClient/src/models/Itens.ts), [consumo da run](../OdisseiaWiki/GameRuns/Inventory/GameRunConsumable.cs), [recuperação](../OdisseiaWiki/GameRuns/Inventory/GameRunRecovery.cs), [origens e reconciliação](../OdisseiaWiki/GameRuns/Inventory/GameRunCarry.cs).

## 21. Sessão, participantes, iniciativa e histórico da Mesa

### 21.1. O que já está disponível

**E Mesa:** iniciar/retomar/encerrar sessão; fixar versão do Sistema; registrar rolagens e registros manuais; consultar catálogo; favoritar configuração de rolagem; histórico paginado; propostas e aplicações de efeito; presença/invalidação por SignalR.

Ação identifica tipo e instância de item/prótese/magia/skill, personagem, parâmetro de alcance/operação/quantidade e revisões. Não aceita preço, dano, modificador ou efeito enviados pelo cliente como autoridade. O snapshot da rolagem conserva a origem e a versão usada.

Registros manuais permitem categoria, rótulo, valor bruto, resultado final, resultado semântico, valor associado, observação e visibilidade dentro dos limites. Eles são marcados como manuais; não substituem prova de uma rolagem do servidor nem executam efeitos narrados.

### 21.2. Combate persistente

Há preparação de combate com personagens, inclusão de NPC/variante/instância, remoção de participante, rolagem de iniciativa, ativação de ordem, avanço e encerramento.

Participante registra identidade própria, tipo/status, ficha/origem/variante quando presentes, controlador, nome/imagem, modificador e resultado de iniciativa, natural, ordem e contadores de sobrevivência. **Várias ocorrências de um mesmo inimigo não devem compartilhar vida/condição/munição por acidente.** Um participante genérico só com nome/modificador não é automaticamente uma ficha completa com inventário e recursos.

O mestre gerencia preparação, ativação, avanço e encerramento. Iniciativa/efeitos próprios possuem permissões específicas de controle. A ativação recebe a ordem dos participantes; ordenação visual não deve alterar a ordem persistida sem comando.

Avançar turno processa os efeitos de fim do participante que sai, aumenta seus turnos concluídos, escolhe o próximo elegível e processa seu início. Completar a volta aumenta a rodada. Durações/cooldowns ligados ao participante não devem diminuir por cada frame de animação, por cada token duplicado ou por cada reconexão.

### 21.3. Rolagem e aplicação são duas coisas

**Fluxo existente:** resolver origem/regra → rolar e classificar → registrar propostas → confirmar efeito autorizado → gravar aplicação e nova revisão → notificar/reler.

Custos, dano, munição, condições e cooldowns podem ser propostas. A aplicação verifica sessão, proprietário/controle, alvo, revisões e se o efeito já foi aplicado. Mitigação e ordem de defesas confirmadas exigem mestre. Não reenviar o mesmo efeito com outra chave para duplicá-lo.

O VTT deverá escolher conscientemente quais operações continuarão assistidas e quais se tornarão comandos atômicos compostos. Não cobrar custo no clique e novamente na confirmação; não aplicar no frontend e depois somar a resposta do servidor.

### 21.4. Visibilidade e autorização

Visibilidade de evento: **PublicaMesa, MestreEAutor, SomenteMestre**. Além disso há visibilidade geral do personagem e flags por dado da ficha: vida, mana, estamina, carga, atributos, defesas, imagem, história, raça, cidade, nome, alinhamento, traços, relacionados, inventário, próteses, passivas, ultimate, skills, magias, galeria, XP e nível.

O VTT precisa distinguir **ver token**, **controlar token**, **abrir ficha**, **ver campo**, **ver rolagem** e **aplicar efeito**. Uma permissão não concede todas as outras. Ocultar por CSS não protege um payload já enviado ao jogador.

**Diferença fundamental de persistência:** a engine de Mesa altera legitimamente o runtime da ficha daquela Mesa quando um efeito é confirmado. A run altera somente sua cópia isolada. Antes de criar o token, definir se representa essa ficha de Mesa ou uma instância de cena; nunca ligar uma barra diretamente ao NPC/item oficial da wiki para gravar dano nele.

### 21.5. Consistência técnica reutilizável

Reutilizar revisões otimistas, chaves idempotentes e conferência do payload, transações, escopo da Mesa, autorização, sequência de eventos e paginação. SignalR notifica/atualiza presença; não é prova de autorização nem garante por si persistência de um arrasto.

Há limites operacionais de rolagens/registros/comandos. Os limites específicos da engine são políticas de servidor, não campos do Sistema editáveis pelo mestre. Não enviar posição de token a cada pixel pela mesma operação de rolagem; o contrato espacial do VTT ainda deve ser criado.

Fontes: [sessões/ações/eventos](../OdisseiaWiki/Controllers/GameplaySessionsController.cs), [combate](../OdisseiaWiki/Controllers/GameplayCombatController.cs), [serviço de sessão](../OdisseiaWiki/Services/GameplayEngineService.cs), [serviço de combate](../OdisseiaWiki/Services/GameplayCombatService.cs), [DTOs](../OdisseiaWiki/Dtos/GameplayCombatDtos.cs), [visibilidade da ficha](../OdisseiaWiki/Dtos/PersonagemVisibilidadeDto.cs), [realtime](../OdisseiaWikiClient/src/utils/gameplayRealtime.ts).

## 22. O que o roguelike já consome dinamicamente

O roguelike é uma referência de integração, não a futura engine tática completa. Seus contratos são single-player/autobattler; escolhas e vítimas não têm coordenadas físicas.

| Fluxo | Dados dinâmicos consumidos | Particularidade que não deve virar regra universal do VTT |
|---|---|---|
| Início/retomada | Sistema/versão, modo/versão, personagem e conteúdos autorizados; snapshots | Uma run ativa por usuário; isolamento da ficha de origem |
| Inventário/loadout | Instâncias, ordem, teste/dano/custo, defesas, condições, compatibilidade | Até cinco ações ofensivas/utilitárias e descanso bônus; não é limite universal de ações da Mesa |
| Bônus passivos | Próteses instaladas e origens ao equipar | Reconciliados na cópia da run |
| Iniciativa | Flag, fórmula e atributos dos atores | Ordem da simulação, distinta do gerenciador manual de Mesa |
| Ataque | D20/tabelas suportadas, atributo, modo, alcance, dano/custos/munição/pausa | Prioridade automática, seleção de alvo e recarga conforme contrato do minijogo |
| Área | Valor de área, percentuais por resultado, defesas de cada inimigo | Todos os inimigos vivos, sem raio/linha de visão |
| Utilitário | Quantidade, recuperação, condições e remoções | Uma utilização por ciclo; não repete até esvaziar stack |
| Condição | Primitivas, origens, duração, gatilhos e reações reconhecidas | Ciclo e relógio próprios da run; cobertura mais ampla em alguns efeitos que a Mesa |
| Evolução | Níveis, limiares, pontos, influências de atributo e teto | Altera a run; direitos não executáveis ficam pendentes |
| Loot | Dado do Sistema e pool/pesos/quantidade do encontro | Resultado favorece itens de menor peso quando ultrapassa metade do dado; isso é regra específica implementada, não fórmula de raridade universal |
| Loja/NPC | Ofertas, pesos, estoque, preços, serviços e bloqueio | Economia da run; não é inventário compartilhado da campanha multiplayer |
| Eventos/missões | Custos/efeitos/recompensas e condições estruturadas | Objetivo executável de missão é concluir a área publicada |
| Encerramento | Resultado, totais, decisões, inimigos, economia e itens protegidos | Derrota/abandono não fingem conclusão de missão ou vitória |

### 22.1. Dado de loot

Configurável no Sistema: **D4, D6, D8, D10, D12 ou D20**, opcional. Quantidade/pool/peso pertencem ao encontro do modo. O claim rola uma vez, salva e entrega cópias com ID próprio; retry não entrega de novo. No comportamento atual, resultado acima de metade das faces dobra o peso de seleção das entradas de menor peso original. Não confundir esse “peso de sorteio” com peso de inventário.

### 22.2. Combate automático e encerramento

O simulador aplica recursos, defesas, cooldown, condições, arma/recarga e ciclos. Vitória exige inimigos derrotados; segurança de processamento não é uma vitória por tempo. A trava atual de repetição é de **10 turnos sem progresso**, e há limite técnico de eventos. Resultado inconclusivo não deve dar a entender que todos morreram nem conceder prêmios normais indevidamente.

Essas travas de segurança não são campos de balanceamento do Sistema nem regras de duração obrigatória do combate tático.

### 22.3. Persistência entre runs e estatísticas

Memória por personagem preserva inimigos derrotados, NPCs resgatados e depósito protegido no escopo compatível de usuário/personagem/jogo/Sistema. Excluir o personagem remove essa memória conforme seus vínculos. Itens protegidos incompatíveis entre versões não são reinterpretados ou transferidos silenciosamente.

Estatísticas usam runs persistidas: totais, vitórias, derrotas/abandonos e ativa; vitórias possuem resumos paginados por usuário/personagem. Treino não entra como run oficial. O histórico estatístico pode sobreviver à exclusão da ficha, diferente da memória jogável. As telas de estatísticas ainda não foram implementadas.

Nada disso autoriza transferir automaticamente XP, equipamentos, moedas ou condições da run para a ficha real. O VTT não deve depender de existir uma run.

Fontes: [plano e escopo do jogo](ROGUELIKE_GAME.md), [montagem de combate](../OdisseiaWiki/GameRuns/Battle/GameBattlePreviewFactory.cs), [simulador](../OdisseiaWiki/GameRuns/Battle/AutoBattleSimulator.cs), [loot](../OdisseiaWiki/GameRuns/GameRunLoot.cs), [progressão](../OdisseiaWiki/GameRuns/GameRunProgression.cs), [memória](../OdisseiaWiki/GameRuns/GameCharacterMilestones.cs), [estatísticas](ROGUELIKE_STATISTICS.md).

## 23. Configurações de aventura que não pertencem ao Sistema

Esta seção evita atribuir ao Sistema configurações que hoje vivem no modo do roguelike. Elas podem inspirar ferramentas de preparação do mestre no VTT, mas não devem ser impostas a toda Mesa.

### 23.1. Modo e mapa

Identidade, nome, descrição, banner, escopo de Mesa, versão do Sistema, versão do modo e publicação. Configuração geral: moeda inicial, desconto de venda, reparo de proteção na Base, vagas/custo do depósito protegido, ação de reserva, multiplicadores/bônus de dano do jogador por resultado e catálogo editorial de poderes.

Áreas: código/nome/imagem, normal/secundária, final secreto, usa Base, nome/imagem/tipo de descanso da Base, número de nós, final da área e opções. O editor suporta até cinco áreas normais e quatro secundárias; nós por área possuem limites do editor/gerador, não um tamanho universal de cena VTT.

Opções de rota: combate, elite, boss, descanso, evento, atalho, caçada, área secreta, vendedor, NPC, encontro desconhecido e missão. Configurável peso de sorteio, único na rota, rótulo, descrição, imagem, duração em minutos, encontro(s), área destino e payload do serviço. `SURPRESA` permanece como código interno compatível, embora a interface diga Encontro desconhecido.

“Único” evita repetição na geração da rota conforme contrato; não significa item único, unicidade global de NPC ou probabilidade uniforme de aparecer em toda posição. O gerador controla a distribuição com a seed e os pesos publicados.

### 23.2. Encontros e inimigos

Encontro configura nome do mapa, inimigo/NPC e variante, quantidade, atributos, atributo de ataque, máximos de vida/mana/estamina, defesa, custos, snapshots de status/inventário/próteses/skills/magias, ações e dano por resultado. Recompensas: XP, moedas, quantidade e pool de loot com item/peso.

Duplicar um inimigo deve gerar atores separados com seus próprios estados. Escolher NPC oficial/próprio/derivado usa o catálogo efetivo da Mesa e valida ações executáveis na versão. Um nome “Boss” não adiciona fases, imunidades ou bônus ocultos.

### 23.3. NPCs de serviço

| Serviço | Configuração/efeito existente |
|---|---|
| Todos | Código de NPC, tipo, imagem/nome, peso, unicidade e bloqueado; resgate salvo por personagem |
| Mercador | Catálogo de itens autorizado, preço, estoque, peso, nível mínimo, quantidade de ofertas; compra/venda, inclusive seleção múltipla e quantidades |
| Médico | Recuperação até máximos atuais de vida/mana/estamina, respeitando efeitos; não é reparo nem descanso |
| Sábio | Magias criadas no catálogo do serviço, com teste/dano/custos/condições/limites e preço; peso/quantidade de ofertas |
| Engenheiro | Ofertas de próteses; melhoria de dano por arma com preço/teto; venda; conserto de defesas com preço por bloco de 10% recuperado |

No conserto, os blocos são arredondados para cima segundo a proporção faltante calculada para o item: 25% → 3 blocos. Preço/capacidade não são inventados pelo cliente. O serviço usa as defesas restantes da instância, não o máximo do item original como se estivesse intacto.

Depósito comum/protegido só é acessível nos contextos permitidos da Base/Mercador. Não usar o depósito da run como um banco global acessível de qualquer cena do VTT.

### 23.4. Eventos, encontros desconhecidos e missões

Evento possui escolhas com código, rótulo, descrição, texto de resultado, custo e efeitos. Custos: moedas, vida, mana, estamina. Efeitos: moedas, XP, recuperação fixa/percentual, tempo de jogo, itens exatos com quantidade e condições por código/duração/valor.

As alterações de vida/mana/estamina do resultado também podem ser negativas, causando perda em vez de recuperação. Custos são não negativos. Limites atuais: até seis escolhas por evento, com ao menos uma sem custo; até 20 itens diferentes por resultado, 1–999 unidades cada; até 20 condições; recursos/XP/tempo nos limites operacionais, e percentuais de recurso entre −100 e 100.

Encontro desconhecido possui pool ponderada de resultados. Revelação é persistida e compromete o ramo; reabrir/F5 não permite rerrolar. Resultados reutilizam validação e serviços normais.

São de 1 a 10 possíveis resultados, sem outro Encontro desconhecido aninhado. A ausência de efeito/recompensa precisa continuar uma escolha válida quando o contrato permite, não um erro por não ter dano.

Missão aponta para área secundária, permite recusar ou não, possui custo de entrada e recompensa. Aceitar/cobrar/entrar é persistido; concluir o último nó retorna e premia uma vez. Recusa/derrota/abandono não concedem conclusão. A narrativa do objetivo não é um sistema genérico de missões por condições textuais.

Fontes: [DTOs do editor](../OdisseiaWiki/Dtos/GameModeManagementDtos.cs), [contratos de encontro](../OdisseiaWiki/GameRuns/Battle/GameBattlePreviewFactory.cs), [custos/escolhas/missões](../OdisseiaWiki/Dtos/GameStoryDtos.cs), [regras de história](../OdisseiaWiki/GameRuns/GameStoryRules.cs), [serviços de NPC](../OdisseiaWiki/GameRuns/GameRunNpcServices.cs), [economia](../OdisseiaWiki/GameRuns/GameRunEconomy.cs), [depósito](../OdisseiaWiki/GameRuns/GameProtectedDeposit.cs).

## 24. Correspondência com a referência Roll20

O Roll20 é referência de interação/produto; **as regras executáveis continuam sendo as versões do nosso Sistema**. Esta correspondência não promete compatibilidade de importação, macros ou implementação integral de todas as funções do Roll20.

| Referência funcional | O que aproveitar da base atual | O que o VTT ainda precisa implementar |
|---|---|---|
| Ficha e atributos ligados ao token | Runtime dinâmico, IDs, valores atuais/máximos e visibilidade | Vínculo explícito token ↔ instância ↔ campo, sem duplicar a fonte de verdade |
| Barras do token | Recursos e defesas do contexto | Escolha dinâmica de campos, layout e permissão de ver/editar |
| Marcadores de estado | Condições ativas, imagem/fallback e duração | Projeção dos registros no token; ícone decorativo separado de condição mecânica |
| Ações do token/atalhos | Ações por instância, testes/favoritos e propostas | Menu contextual e atalhos que chamem os serviços autorizados |
| Dados e chat | Rolagem autoritativa, resultado semântico e visibilidade | Feed integrado à cena, seleção de alvos e interação com tokens |
| Turn tracker | Combate/participantes/ordem/rodada/avanço já persistidos | Sincronizar seleção/destaque dos tokens com o combate, sem criar outra ordem paralela |
| Mapa e grid | Configuração de movimento e escala do Sistema | Cena, posição, grade, câmera, medição, geometria e validação espacial |
| Camadas e segredos do mestre | Escopo/visibilidade de Mesa e conteúdo | Camadas de cenário/tokens/mestre e filtragem de payload no servidor |
| Vários tokens do mesmo monstro | Instância de NPC/variante e identidade de participante | Estado individual por ocorrência; duplicar token não deve duplicar a ficha compartilhada por acidente |
| Iluminação/névoa/colisão/áreas | Não há equivalente tático completo | Novos contratos próprios, sem inferir do atributo ou do texto da magia |

Referências oficiais verificadas em 04/11/2026:

- [Token Features](https://help.roll20.net/hc/en-us/articles/360039674573-Token-Features): vínculo com personagem, barras, controle/visibilidade e marcadores. O próprio guia alerta para o compartilhamento involuntário de valores quando múltiplos monstros usam a mesma ligação.
- [Turn Tracker](https://help.roll20.net/hc/en-us/articles/360039178634-Turn-Tracker): lista e gerenciamento de turnos; sua flexibilidade não exige transformar todo clique em combate automático.
- [Map Grid Types](https://help.roll20.net/hc/en-us/articles/4416143791767-Map-Grid-Types): referência para configurações de grade; a escala e a regra mecânica do nosso Sistema precisam continuar separadas da apresentação da cena.
- [Dice Reference](https://help.roll20.net/hc/en-us/articles/360037773133-Dice-Reference): catálogo de expressões do Roll20. **Nossa engine não implementa toda essa linguagem**; não copiar exemplos para campos de fórmula como se fossem suportados.
- [Character Sheet Tips and Tricks](https://help.roll20.net/hc/en-us/articles/360037773373-Character-Sheet-Tips-and-Tricks): referência para ligação de dados da ficha e interações; no projeto, usar os códigos/instâncias/runtime já existentes.

## 25. Lacunas que o VTT precisa tratar explicitamente

Os itens abaixo são conclusões da rastreabilidade entre cadastro e consumidor. Não foram corrigidos ou implementados nesta entrega documental.

| ID | Lacuna/assimetria observada | Decisão ou implementação necessária |
|---|---|---|
| VTT-01 | Movimento/PA cadastrados, sem executor espacial | Contrato de cena, caminho, distância, custo, limite e turno |
| VTT-02 | Campo de fórmula não implica interpretador | Declarar gramática suportada e rejeitar fórmulas fora dela; não usar `eval` |
| VTT-03 | Recurso customizado não funciona em todo executor | Mapear capacidades por recurso/operação e atualizar os consumidores necessários |
| VTT-04 | Grupos Defesa/Outro de atributo não percorrem todos os caminhos de teste/evolução | Definir suporte por grupo sem transformar tudo em Secundario silenciosamente |
| VTT-05 | Campo/tipo novo de item no catálogo não cria executor/formulário | Renderização de campos e contrato mecânico explícito; manter os tipos conhecidos distinguíveis |
| VTT-06 | Peso diverge entre ficha, gatilho de Mesa e run | Escolher regra da Mesa e centralizar cálculo, incluindo implantes e traje equipado |
| VTT-07 | Efeitos de dano/armadura/perda de turno têm cobertura diferente na Mesa e run | Compartilhar primitivas com testes de paridade ou manter claramente assistidos |
| VTT-08 | Hora/Minuto/Descanso/Sessao não têm o mesmo relógio em todos os fluxos | Relógio de jogo autoritativo, avanço explícito e marcos corretos de expiração |
| VTT-09 | Tipos de dano/defesa não são algoritmos genéricos | Contratos de penetração, resistência, vulnerabilidade, quebra e comportamento customizado |
| VTT-10 | Cadência validada por solicitação não garante teto acumulado por turno na Mesa | Contador/budget por ator/arma/turno, inclusive requisições concorrentes e reações |
| VTT-11 | Pausa/recarga/ciclos do autobattler não são comandos multiplayer prontos | Estados de arma e comandos claros de recarga/pausa na Mesa |
| VTT-12 | Área da run é todos os inimigos, não geometria | Formas, alcance, LOS, aliados e aplicação multi-alvo autorizada e idempotente |
| VTT-13 | Vista explodida não equivale à reconciliação mecânica de equipamento | Comando autoritativo que valide traje e aplique/remova deltas/defesas uma vez |
| VTT-14 | Instância com `bonus` descritivo não é modificador numérico | Separar texto de primitiva e preservar proveniência de bônus |
| VTT-15 | XP aplicado na Mesa não é evolução automática completa da run | Serviço explícito de evolução da ficha e escolha/registro de direitos |
| VTT-16 | Marco/nova magia/skill/ultimate pode estar apenas pendente | Autoria e seleção executáveis, com pré-requisitos e concessão única |
| VTT-17 | Utilitário sem teste e consumo de stack não têm paridade total entre run e Mesa | Comando de uso sem rolagem quando apropriado, com quantidade/alvo/efeitos |
| VTT-18 | Resistência e alvo Todos os inimigos podem ser assistidos na Mesa | Resolver reações e fan-out por instância/alvo, sem reutilizar proposta única indevidamente |
| VTT-19 | Limites de criação/poderes podem ser apenas contadores em certas telas | Conferir validação autoritativa no comando adotado, não só no input |
| VTT-20 | Vínculos de ficha/Mesa/sessão podem apontar para versões diferentes | Política explícita de compatibilidade e migração; sessão não muda sozinha |
| VTT-21 | NPC genérico não é ator completo; duplicações podem compartilhar estado | Separar template, ficha de Mesa e instância de cena/participante |
| VTT-22 | Nome/ícone do token não representa permissão de dados | Projeções autorizadas e independência de visibilidade/controle |
| VTT-23 | Módulo habilitado/desabilitado não é consultado uniformemente | Negociação de capacidades e testes dos flags por consumidor |
| VTT-24 | Iniciativa e arredondamento possuem parsers/cálculos específicos | Unificar o contrato antes de permitir fórmulas mais amplas no VTT |

Essas lacunas não impedem um VTT com ferramentas assistidas. Impedem anunciar automação universal sem os contratos correspondentes. O mestre deve conseguir conduzir a sessão quando uma regra é narrativa, com registro manual identificado, sem o sistema fingir que a executou.

## 26. Matriz mínima de compatibilidade para construir o VTT

Os cenários abaixo são **critérios para a implementação futura do VTT**, não testes de uma tela que já existe. Devem ser rastreados por ID e executados em versões publicadas de teste. Quando uma capacidade ainda for assistida, o resultado esperado inclui aviso/controle manual correto, não uma automação fictícia.

### 26.1. Sistema, versão, atributos e recursos

| ID | Variação a testar | Resultado obrigatório |
|---|---|---|
| DYN-01 | Duas Mesas com Sistemas/versões diferentes abertas ao mesmo tempo | Catálogos, cálculos, permissões e caches não se misturam |
| DYN-02 | Publicar versão nova durante uma sessão/run existente | Sessão/run e histórico conservam a versão fixada |
| DYN-03 | Ficha fixada numa versão diferente da Mesa/sessão | Política de compatibilidade explícita; não migrar silenciosamente |
| DYN-04 | Conteúdo global acompanhado, conteúdo fixado e cópia derivada da Mesa | Cada origem resolve corretamente, sem editar o original |
| DYN-05 | Rascunho/arquivado/inativo e referência removida | Recusa ou compatibilidade histórica conforme contrato; diagnóstico claro |
| DYN-06 | Trocar nome/ordem dos atributos; criar código próprio | Campos/ações usam código e ordem publicados, sem índices fixos |
| DYN-07 | Código com normalização/alias legado e valores desconhecidos salvos | Sem duplicar atributo nem descartar valores da ficha |
| DYN-08 | Principal/Secundario/Defesa/Outro, ativo/inativo | Só oferecer execução suportada; nenhuma conversão silenciosa de grupo |
| DYN-09 | Valores zero, mínimo, teto natural, absoluto e NPC acima do teto de criação | Cada operação aplica seu limite; rolagem voluntária zero é orientada corretamente |
| DYN-10 | Natural + prótese + condição positiva e negativa | Total e origem corretos; retirar/expirar não altera o natural indevidamente |
| DYN-11 | Criar recurso extra e trocar nome dos recursos canônicos | Campo/barras dinâmicos; operações não suportadas claramente indisponíveis |
| DYN-12 | Mínimo negativo, máximo nulo, máximo da ficha e do Sistema diferentes | Atualizações respeitam o contrato específico e não inventam máximos |
| DYN-13 | Aumentar/reduzir máximo por equipamento/condição/evolução | Sem cura implícita, duplicação ou base temporária perdida |
| DYN-14 | Raça personalizada com bases, ponto inicial e override da Mesa | Valores iniciais corretos, sem sobrescrever ficha já editada |

### 26.2. Dados, XP e progressão

| ID | Variação a testar | Resultado obrigatório |
|---|---|---|
| DYN-15 | Dado geral D6/D20/D100 e rolagem livre de múltiplos grupos | Dado publicado aplicado só no contexto adequado; classificação livre correta |
| DYN-16 | Normal/vantagem/desvantagem com pools e empate | Mantém tentativa completa correta e preserva dados descartados |
| DYN-17 | Orçamento de 8 grupos/100 dados físicos e faces fora do limite | Erro controlado, sem travar sessão nem trocar para outro dado |
| DYN-18 | Natural crítico com total modificado; faixas naturais/comuns | Natural e total não são confundidos |
| DYN-19 | Códigos próprios de resultado e faixas incompletas | Sem semântica inventada; classificação/avisos e efeitos por código corretos |
| DYN-20 | Fórmula suportada, fórmula narrativa e expressão fora da gramática | Executa apenas o suportado; não aceita execução arbitrária |
| DYN-21 | XP fixo, dado, vantagem, paridade e mínimo/máximo | Valor associado correto; rolar não concede XP duas vezes |
| DYN-22 | XP suficiente para vários níveis, excedente ligado/desligado e nível máximo | Custo e pontos concedidos na linha correta; nenhuma progressão além do teto |
| DYN-23 | Influência atributo/recurso com percentual diferente e sem influência | Máximo alterado conforme regra efetiva; atual não é curado |
| DYN-24 | Marco/nova magia/skill/ultimate sem executor | Direito visível como pendente/assistido, sem prêmio inventado |

### 26.3. Condições, tempo, recuperação e morte

| ID | Variação a testar | Resultado obrigatório |
|---|---|---|
| DYN-25 | Cada primitiva da seção 11, isolada e combinada | Efeito executado ou assistência explícita conforme capacidades da Mesa |
| DYN-26 | Efeito principal + adicionais, valores zero/negativos/limites e override por origem | Índices/valores válidos; nenhuma origem modifica o cadastro da condição |
| DYN-27 | Ao aplicar/início/fim/enquanto ativa | Executa no momento correto, sem repetição por render ou reconexão |
| DYN-28 | Empilhável, substituível e preservada | Acúmulos/duração/origens obedecem à regra declarada |
| DYN-29 | Gatilho zero/limiar/carga, cessar, cooldown e rearme | Não reaplica infinitamente nem impede reativação legítima |
| DYN-30 | Remoções manual/duração/descansos/cura/magia | Apenas métodos permitidos; restaura limites sem recuperar recursos indevidamente |
| DYN-31 | Hora/minuto/turno/descanso/sessão/permanente | Relógio e capacidades explícitos; F5 não altera tempo de jogo |
| DYN-32 | Ao usar/equipar/acertar, natural e classificado | Origem dispara corretamente mesmo quando não há dano |
| DYN-33 | Alvo/usuário/todos, resistência e múltiplas cópias do mesmo NPC | Uma reação/aplicação por alvo autorizado; estados independentes |
| DYN-34 | Bloqueio de cura por item, descanso, Médico e efeito | Nenhum caminho integrado contorna o bloqueio acidentalmente |
| DYN-35 | Descanso fixo/percentual/fórmula e guarda exigida | Recuperação correta ou assistência; guarda não é ignorada |
| DYN-36 | Beira da morte absoluta/percentual, sobrevivência, estabilização e recuperação | Estado da Mesa não é confundido com derrota de run; mestre autorizado |

### 26.4. Itens, equipamento e combate

| ID | Variação a testar | Resultado obrigatório |
|---|---|---|
| DYN-37 | Categoria/arquétipo próprios e campo/faixa/referência herdados | Identidade e proveniência corretas; sem seleção pelo nome aproximado |
| DYN-38 | Tipo-raiz desconhecido ou campo sem executor | Não anuncia comportamento mecânico que não possui |
| DYN-39 | Item-base alterado depois de a ficha personalizar a cópia | Executa a instância da ficha, preservando suas edições |
| DYN-40 | Nome/imagem/valor/teste/dano/condição diferentes na cópia | Token/ação/histórico apresentam a origem correta e não o original atual |
| DYN-41 | Pistola 1 bala por ataque, pente 10, cadência 2 | Dois ataques gastam 2; requisições separadas respeitam budget do turno quando implementado |
| DYN-42 | Rajada 10 balas, pente 60, duas rajadas | Gasta 20; não multiplica o dano novamente por 10 |
| DYN-43 | Munição zero/parcial, recarga, reserva finita/ausente | Sem saldo negativo ou bloqueio permanente por limite de turno |
| DYN-44 | Arma sem munição, apenas pausa; arma com alternativas e sem alternativas | Pausa/ciclo ou comando assistido explícito; arma pode voltar a ser usada |
| DYN-45 | Limite do item diferente do arquétipo/Sistema e pouco recurso | Menor limite aplicável, com motivo correto |
| DYN-46 | Acessório compatível/incompatível, modificadores positivos/negativos e cópia editada | Soma apenas fontes compatíveis, sem editar o acessório global |
| DYN-47 | Corpo a corpo, distância e arquétipo novo com modo explícito | Não deduz modo somente de uma lista hardcoded de nomes |
| DYN-48 | Área com erro/falha crítica/preciso/crítico e percentuais próprios | Dano por resultado e por alvo correto, custos não multiplicados pelas vítimas |
| DYN-49 | Alvo fora da área, obstáculo/LOS e aliado | Segue o contrato espacial que vier a ser definido; não usa todos os inimigos da cena automaticamente |
| DYN-50 | Escudo/proteção/armadura em ordens distintas | Ordem publicada; desgaste e excesso de dano corretos |
| DYN-51 | Tipo de dano que ignora defesa e defesa nova | Somente comportamento realmente implementado, com assistência/recusa nos demais |
| DYN-52 | Colete + Outros permitido, Colete + Traje proibido, próprio arquétipo marcado/desmarcado | Validação autoritativa independente da ordem de equipar |
| DYN-53 | Compatibilidade ausente/nula versus lista vazia; arquétipo inativo/ambíguo | Legado preservado sem liberar combinações explicitamente proibidas |
| DYN-54 | Equipar/retirar/guardar/vender peça com defesa gasta | Sem restaurar defesa por transferência ou reequipamento |
| DYN-55 | Prótese só de bônus, ofensiva e mista | Instalação/ação corretas, sem duplicar bônus ou ocupar slot ofensivo indevido |
| DYN-56 | Consumível stackado, esgotado, cura bloqueada e utilitário sem teste | Consome uma vez e aplica efeito permitido; zero remove a entrada correta |
| DYN-57 | Magia de dano, só condição, cura/remoção e custo estruturado versus textual | Nenhuma exigência indevida de dano; texto não vira regra |
| DYN-58 | Cooldown de poder versus condição versus pausa de arma | Estados e contadores independentes; avançam no momento certo |
| DYN-59 | Peso customizado, quantidade, traje equipado, prótese e capacidade alterada | Regra da Mesa unificada; não depender do layout visual da mochila |
| DYN-60 | Slots/posição da vista explodida e posição do token | São estados diferentes; mover token não reequipa item |

### 26.5. Multiplayer, segurança e retomada

| ID | Variação a testar | Resultado obrigatório |
|---|---|---|
| DYN-61 | Mestre, dono, outro jogador e usuário de outra Mesa | Controle/leitura/escrita conforme autorização, sem dados ocultos no payload |
| DYN-62 | Público, mestre+autor, somente mestre e flags de ficha | Feed, token, barras e popovers não revelam dados proibidos |
| DYN-63 | Mesmo NPC/variante em vários tokens | Vida, munição, condições e iniciativa independentes quando forem instâncias distintas |
| DYN-64 | Mesmo personagem representado em mais de uma cena/token | Política de compartilhamento explícita; não duplicar curas/custos/condições |
| DYN-65 | Retry/F5/reconexão/double-click e mesma chave | Uma mutação; mesma resposta histórica permitida |
| DYN-66 | Chaves diferentes com mesma revisão ou mesmo efeito-fonte | Conflito ou consumo único; não duplica recompensa/efeito |
| DYN-67 | Dois clientes equipam/usam/movem o mesmo ator simultaneamente | Sem sobrescrita perdida; revalidação de saldo, turno e revisão |
| DYN-68 | Avanço de turno simultâneo e remoção do ator atual | Uma transição consistente; início/fim de efeitos não duplicados |
| DYN-69 | Eventos privados entre eventos públicos paginados | Cursor avança corretamente sem vazamento nem loop |
| DYN-70 | Falha de rede depois do servidor confirmar | Retomada por estado/idempotência; frontend não inventa sucesso nem duplica comando |
| DYN-71 | Equipamento ou efeito de item próprio/derivado de conteúdo oficial | Só altera instância autorizada; original wiki/Sistema e outra Mesa intactos |
| DYN-72 | Histórico após publicação nova, alteração de original e exclusão permitida de origem | Log permanece interpretável pela versão/snapshot salvos |

**Combinações necessárias:** não basta testar cada linha só no Sistema padrão. Repetir os casos aplicáveis em um Sistema publicado personalizado, com atributos/códigos/resultados diferentes, conteúdo próprio/derivado, duas Mesas e dois controladores concorrentes. Para campos numéricos usar classes de equivalência e fronteiras; para combinações, geração/pairwise e invariantes de estado, sem prometer testar todas as combinações possíveis manualmente.

## 27. Rastreabilidade e evidência desta entrega

### 27.1. Fontes primárias da configuração

| Frente | Fonte principal e finalidade |
|---|---|
| Campos administrativos | [SistemaConfiguracaoDtos.cs](../OdisseiaWiki/Dtos/SistemaConfiguracaoDtos.cs): sete seções, registros e parâmetros |
| Catálogo e contexto | [SistemaRuntimeDtos.cs](../OdisseiaWiki/Dtos/SistemaRuntimeDtos.cs): hierarquia, campos, referências, resolução e proveniência |
| Publicação e identidade | [SistemaRpgDtos.cs](../OdisseiaWiki/Dtos/SistemaRpgDtos.cs) e [enums](../OdisseiaWiki/Enums/SistemaRpgEnums.cs) |
| Persistência de edição | [SistemaRpgService.Sections.cs](../OdisseiaWiki/Services/SistemaRpgService.Sections.cs): mapeamento real dos inputs |
| Validações e pré-requisitos | [SistemaRpgService.ValidationAndClone.cs](../OdisseiaWiki/Services/SistemaRpgService.ValidationAndClone.cs) |
| Autorização administrativa/runtime | [SistemasRpgController.cs](../OdisseiaWiki/Controllers/SistemasRpgController.cs) |
| Formulários por módulo | [General](../OdisseiaWikiClient/src/routes/Management/ManagementSystem/components/ModuleForms/GeneralModuleForm.tsx), [Creation](../OdisseiaWikiClient/src/routes/Management/ManagementSystem/components/ModuleForms/CreationModuleForm.tsx), [Progression](../OdisseiaWikiClient/src/routes/Management/ManagementSystem/components/ModuleForms/ProgressionModuleForm.tsx), [Exploration](../OdisseiaWikiClient/src/routes/Management/ManagementSystem/components/ModuleForms/ExplorationModuleForm.tsx), [Combat](../OdisseiaWikiClient/src/routes/Management/ManagementSystem/components/ModuleForms/CombatModuleForm.tsx), [Powers](../OdisseiaWikiClient/src/routes/Management/ManagementSystem/components/ModuleForms/PowersModuleForm.tsx), [Survival](../OdisseiaWikiClient/src/routes/Management/ManagementSystem/components/ModuleForms/SurvivalModuleForm.tsx) |

Os links nas seções funcionais apontam aos consumidores, não apenas aos modelos. A conclusão **C/P** vem da diferença entre o campo persistido e os caminhos efetivos encontrados; ela não implica que o banco rejeite o cadastro.

### 27.2. Testes existentes que fundamentam os contratos

| Área | Exemplos de suítes do repositório |
|---|---|
| Sistema/runtime/publicação | [SistemaRpgServiceTests](../OdisseiaWiki.Tests/SistemaRpgServiceTests.cs), [SistemaRpgRuntimeTests](../OdisseiaWiki.Tests/SistemaRpgRuntimeTests.cs), [SistemaRpgResolverTests](../OdisseiaWiki.Tests/SistemaRpgResolverTests.cs) |
| Catálogo e migração | [SistemaRpgItemCatalogServiceTests](../OdisseiaWiki.Tests/SistemaRpgItemCatalogServiceTests.cs), [SistemaPatchEMigracaoTests](../OdisseiaWiki.Tests/SistemaPatchEMigracaoTests.cs) |
| Dados e especificação persistida | [GameplayRollEvaluatorTests](../OdisseiaWiki.Tests/GameplayRollEvaluatorTests.cs), [GameplayStoredTestSpecTests](../OdisseiaWiki.Tests/GameplayStoredTestSpecTests.cs), [GameplayOfflineSimulationTests](../OdisseiaWiki.Tests/GameplayOfflineSimulationTests.cs) |
| Condições e aplicação | [GameplayConditionRuntimeTests](../OdisseiaWiki.Tests/GameplayConditionRuntimeTests.cs), [GameplayEffectApplicationTests](../OdisseiaWiki.Tests/GameplayEffectApplicationTests.cs), [SistemaCondicaoRemocaoTests](../OdisseiaWiki.Tests/SistemaCondicaoRemocaoTests.cs) |
| Evolução/equipamento | [GameRunProgressionTests](../OdisseiaWiki.Tests/GameRunProgressionTests.cs), [GameRunOutfitCompatibilityTests](../OdisseiaWiki.Tests/GameRunOutfitCompatibilityTests.cs), [GameRunProsthesesTests](../OdisseiaWiki.Tests/GameRunProsthesesTests.cs) |
| Cadência/munição/área/pausa | [AutoBattleSimulator.WeaponUsageTests](../OdisseiaWiki.Tests/AutoBattleSimulator.WeaponUsageTests.cs), [GameplayOfflineSimulation.AreaTests](../OdisseiaWiki.Tests/GameplayOfflineSimulation.AreaTests.cs) |
| Ficha e interface de regras | [outfitCompatibility](../OdisseiaWikiClient/tests/outfitCompatibility.test.mjs), [systemRuntimeWarnings](../OdisseiaWikiClient/tests/systemRuntimeWarnings.test.mjs), [gameplayOutcome](../OdisseiaWikiClient/tests/gameplayOutcome.test.mjs), [runEquipmentUx](../OdisseiaWikiClient/tests/runEquipmentUx.test.mjs), [runAttributeModal](../OdisseiaWikiClient/tests/runAttributeModal.test.mjs), [cyberButtonAndConditions](../OdisseiaWikiClient/tests/cyberButtonAndConditions.test.mjs) |

Nesta entrega documental foram executados **307 testes de backend e 48 de frontend relacionados ao levantamento**, todos aprovados. Os campos do anexo foram extraídos dos contratos e conferidos estruturalmente; os links locais foram verificados. Não houve teste de uma tela VTT, execução de banco real, alteração funcional da aplicação, migration, commit ou deploy.

A [auditoria anterior do roguelike](ROGUELIKE_FINAL_AUDIT.md) contém os testes completos e de MySQL daquela entrega. Não confundir essa evidência anterior com uma homologação do futuro multiplayer tático.

## 28. Regra de manutenção e uso no planejamento do VTT

Para cada alteração futura de Sistema/conteúdo:

1. Identificar **quem configura**, **em qual versão**, **onde o valor é salvo** e **qual consumidor o executa**.
2. Atualizar este documento e o [índice de campos](VTT_SYSTEM_FIELD_INDEX.md) se o contrato mudar. IDs/códigos novos não são apenas novos rótulos.
3. Indicar **C/E/A/P/V** por consumidor. Se uma capacidade passou a ser automatizada, trocar a marca somente com implementação e teste do caminho completo.
4. Vincular o trabalho aos IDs VTT e DYN aplicáveis. Definir decisão explícita quando a regra não possui contrato.
5. Exercitar pelo menos um Sistema personalizado e uma Mesa com conteúdo derivado, além do padrão. Testar concorrência quando houver saldo, turno, equipamento ou aplicação de efeito.
6. Conferir snapshots/histórico, rollback, retomada, versão antiga e isolamento de origens. Nova publicação não reinterpreta uma ação histórica.
7. Reutilizar a engine, runtime, catálogo, componentes de ficha/rolagem/condição e estilos centralizados. Não criar listas paralelas de atributos, condições ou arquétipos no VTT.

### Decisões necessárias antes da primeira implementação tática

- Identidade e persistência: ficha de Mesa versus instância de cena; vínculos entre tokens; múltiplas ocorrências de NPC.
- Política de automação: quais efeitos serão confirmados pelo mestre e quais comandos serão compostos/atômicos.
- Contrato espacial: unidades/escala, grid/sem grid, diagonais, caminho, terreno, paredes/LOS e áreas.
- Orçamento de turno: PA, movimento, ataques, reações, munição, recarga e pausa, sem aplicar limites do autobattler à Mesa por acidente.
- Relógio de jogo e duração: diferença entre turno, rodada, tempo decorrido, descanso, combate e sessão.
- Descoberta de capacidades: UI só oferece automações que o servidor declara suportar para aquela versão e contexto.

**Critério de aceitação:** o VTT deve funcionar para todas as edições/criações **dentro dos contratos que declarar suportados**; nas demais, deve preservar o conteúdo e oferecer assistência ou recusa explícita. “Baseado no Roll20” não elimina a necessidade desses limites e não autoriza alterar conteúdos oficiais ou dados de outra Mesa.
