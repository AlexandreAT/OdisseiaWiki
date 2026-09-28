# Guia rápido para criar e editar Sistemas de RPG

Este guia explica o necessário para administrar um Sistema sem precisar conhecer o código do projeto.

## Antes de editar

Entre em **Gerenciamento > Sistema** e selecione o Sistema desejado.

- Uma versão **publicada** é somente leitura.
- Para alterá-la, use **Duplicar**, informe a próxima versão, como `1.1`, edite o novo rascunho e publique.
- A versão deve usar um formato como `1.0`, `1.1` ou `2.0.0`.
- Publicar torna o rascunho a versão atual do Sistema.
- Mesas comuns continuam na versão que escolheram até uma migração manual.
- A **Mesa Padrão — Odisseia** é especial: ela sempre acompanha a publicação atual do Sistema `ODISSEIA`.

Publicar uma versão muda as regras consultadas pelas telas, mas não apaga nem reescreve XP, nível, vida, atributos ou inventário já salvos.

## Como as telas estão divididas

| Tela | O que pode ser alterado | Exemplo simples | Onde isso aparece ou é usado |
|---|---|---|---|
| **Visão geral** | Dado principal, crítico, falha crítica, vantagem, desvantagem e módulos ativos. | Em **Regras fundamentais**, coloque `D20` em **Dado do teste geral**, `20` em **Crítico natural** e `1` em **Falha crítica natural**. | Governa as rolagens autoritativas da ficha e da Mesa. O servidor calcula o resultado e registra o evento quando existe uma sessão ativa. |
| **Criação** | Valores iniciais, atributos, recursos e configurações raciais. | Em **Atributos**, crie o código `RESISTENCIA`, nome **Resistência**, mínimo `0`, comum `1`, máximo natural `5` e absoluto `6`. | Alimenta os campos, limites e valores iniciais dos formulários de NPC e personagem jogador. Valores já preenchidos não são substituídos. |
| **Progressão** | Nível máximo, XP, pontos e recompensas por nível, marcos e fontes de XP. | Em **Níveis e XP**, encontre a linha do **Nível 1** e coloque `10` na coluna **XP necessário**. Isso define 10 XP para passar do nível 1 para o 2. | O novo limite aparece na página e no card do personagem, inclusive para personagem jogador. Não sobe o nível automaticamente nem altera o XP salvo. |
| **Exploração** | Grid, movimento, pontos de ação, carga, furtividade e ações disponíveis. | Em **Grid e movimento**, coloque `4` em **Máximo por turno**. | A regra fica disponível para as telas que consultam o Sistema, mas o site ainda não movimenta peças nem desconta estamina automaticamente. |
| **Combate** | Iniciativa, resultados dos dados, tipos de dano e tipos de defesa. | Em **Tipos de dano**, adicione o código `ELETRICO` e o nome **Elétrico**. | Governa iniciativa, resultados, dano e mitigação. Alterações de estado são apresentadas como propostas confirmáveis, nunca aplicadas silenciosamente. |
| **Poderes** | Tipos de magia, custos, limite de magias, skills, ultimates e nível de desbloqueio. | Em **Skills e ultimate**, coloque `7` em **Nível da ultimate**. | Os formulários de personagem usam os limites e opções do Sistema e podem avisar quando uma ficha os ultrapassa. |
| **Sobrevivência** | Condições, descansos, morte, estabilização, loot e refeições. | Em **Fluxo de morte e estabilização**, informe `3` em **Sucessos necessários**. | Governa condições, descansos e sobrevivência. A engine acompanha duração e turnos e exige confirmação nas mutações propostas pelo fluxo. |
| **Catálogo de itens** | Tipos, categorias, arquétipos, campos, faixas dos gráficos e referências. | Selecione **Arma > Arma de fogo > Pistola / Revólver** e edite as faixas de dano. | Orienta formulários, validações, avisos e gráficos das páginas de itens. |

## Códigos, chaves e IDs

Os campos chamados **Código** ou **Chave** conectam uma configuração a outra. Use nomes curtos, sem acento ou espaço, em maiúsculas, por exemplo:

- `VIDA`, `MANA` e `ESTAMINA` para recursos;
- `RESISTENCIA` e `PRECISAO` para atributos;
- `ELETRICO` para um tipo de dano;
- `PISTOLA_REVOLVER`, `COLETE` e `ARMOR_CORE` para arquétipos de item;
- `DANO_POR_ALCANCE_CURTA` e `PROTECAO_BASE` para campos de item.

Um código deve ser único dentro da sua lista e não deve ser renomeado depois de começar a ser usado. Por exemplo, uma faixa com a chave `PROTECAO_BASE` procura o campo de proteção com essa mesma chave; um item com o arquétipo `COLETE` procura as regras cadastradas para `COLETE`.

Os **IDs numéricos** são internos. Quando uma tela pede uma raça, Mesa, Sistema ou versão, escolha o registro pelo seletor; não invente nem copie um ID manualmente.

Campos de fórmula e descrição aceitam texto porque algumas regras precisam ser apresentadas ao mestre. Uma fórmula só deve ser considerada automática quando a tela consumidora realmente informar isso.

## Como funcionam os itens e seus gráficos

O catálogo segue a ordem **Tipo > Categoria > Arquétipo**. O arquétipo herda os campos e referências dos níveis acima e pode ter faixas próprias.

Em **Faixas e escalas**:

- **Campo** é a chave do valor mostrado, como `DANO_POR_ALCANCE_CURTA`.
- **Mínimo** normalmente é `0`.
- **Máximo** define até onde vai a barra do gráfico.
- **Referência** cria o marcador amarelo do maior valor comum conhecido naquele arquétipo.
- **Unidade** é apenas o texto apresentado, como `dano` ou `defesa`.

Exemplo de pistola: em **Arma > Arma de fogo > Pistola / Revólver**, a faixa `DANO_POR_ALCANCE_CURTA` pode ter máximo `1000` e referência `250`. Uma pistola com 150 de dano ocupa 15% da barra, e o traço amarelo marca 250.

Proteções funcionam do mesmo modo. Em **Traje > Proteções vestíveis** existem os arquétipos `COLETE`, `TRAJE` e `ARMOR_CORE`, com faixas para `PROTECAO_BASE`, `ESCUDO_BASE` e `ARMADURA_BASE`. A página de traje lê essas faixas para montar as três barras, mesmo quando algum valor do item é zero.

Itens globais da Wiki normalmente ficam em **Acompanhar publicação atual**. Nesse caso, ao publicar uma nova versão, a página do item passa a usar suas novas faixas. Também é possível fixar um item em uma versão específica; ele então continua usando aquela versão.

Itens fora de uma faixa não são alterados nem bloqueados: o valor original é preservado e o Sistema gera um aviso. Se o item não tiver códigos reconhecidos, a página usa os valores antigos de compatibilidade.

## O que muda para personagens e Mesas

- Um NPC, raça ou item global pode acompanhar a publicação atual ou ficar preso a uma versão publicada.
- Um personagem jogador usa a versão vinculada à sua Mesa.
- Uma Mesa comum não muda de versão sozinha.
- A Mesa Padrão usa sempre a publicação atual de `ODISSEIA`.

Portanto, se o XP do nível 1 mudar de 20 para 10 e a nova versão de `ODISSEIA` for publicada, um jogador da Mesa Padrão verá o novo requisito ao recarregar a ficha. O XP e o nível que ele já possui continuam intactos. Se ele tiver 15 XP no nível 1, a tela poderá mostrar que o requisito foi atingido, mas não promoverá o personagem automaticamente.

Os limites, rótulos, opções e avisos dos itens na ficha usam o Sistema da Mesa. Ao abrir em uma nova guia a página completa de um **item personalizado que existe somente dentro do inventário do personagem**, a prévia também resolve a versão da Mesa e o arquétipo daquele item. Se essa resolução falhar ou algum dado obrigatório do catálogo não vier, a tela mantém o fallback para não quebrar, mas informa claramente que o Sistema exibido está desatualizado.

## Resumo do que já é automático

Já consomem o Sistema: progressão exibida nas fichas, limites e opções de criação, atributos, recursos, configuração racial, opções de skills e magias, catálogo e gráficos de itens, rolagens autoritativas, XP, munição configurada, dano e mitigação, condições, cooldowns, descansos, sobrevivência, iniciativa, rodadas e turnos.

Rolagens apenas calculam e propõem consequências. XP, custos, munição, dano, condições e descansos mudam o estado somente após confirmação do jogador autorizado ou do mestre. Texto narrativo ou configuração ambígua permanece assistido.

Continuam fora do escopo atual: pontos de ação, movimento de peças, combos, reações, furtividade como automação de VTT e telas agregadas de estatísticas. O ledger da Mesa já registra os dados necessários para as estatísticas futuras.
