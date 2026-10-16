# OdisseiaWiki — Planejamento do Minijogo Roguelike

> Versão do documento: 2.6 (plano vigente na seção 0; estudo e histórico preservados nas seções 1–38)
> Estado: implementação incremental em `feature/roguelike-game`; editor versionado, mapa configurável de 3 a 24 nós por área (18 por padrão), áreas secretas encadeáveis e finais alternativos, até cinco ações e descanso bônus, combate e encerramento de run implementados; XP, subida de nível, distribuição de pontos de atributo e loot de combate na cópia da run; catálogo/execução de skills e ultimates, marcos e economia ainda não implementados; marco de produção condicionado ao portão da seção 0.10
> Escopo: minijogo single-player de navegador, baseado no RPG Odisseia

> Revisão vigente (outubro/2026): o plano de implementação está na seção 0 abaixo. As seções 1–38 preservam o estudo inicial e o histórico das entregas até schema 5; as seções 39–43 registram atributos, loot, inventário/defesas, rotas secretas e o futuro catálogo de poderes. Afirmações antigas como “ainda sem fase completa”, teto de sete armas, três slots de ataque, chefe obrigatório, ausência de Caçada ou impossibilidade de encadear áreas secretas não descrevem o código atual. A seção 0 substitui o roadmap antigo; para executar regras de uma run, prevalecem as versões publicadas do Sistema e do modo fixadas nela, nunca uma descrição do documento.

## 0. Plano vigente e estado consolidado

### 0.1. Visão e regras que não mudaram

O minijogo é um roguelike/autobattler **single-player** integrado ao site, não uma Mesa artificial. O jogador escolhe um personagem próprio, prepara até cinco ações em ordem de prioridade (mais um descanso bônus opcional), escolhe rotas e vê o servidor resolver e persistir combates; o cliente reproduz o log. A ficha original nunca recebe alterações da run. Uma run fixa a versão publicada do Sistema, a versão publicada do modo, os snapshots, a seed e o mapa. Publicações futuras só afetam runs novas. Hoje é permitida uma run ativa por usuário.

Uma regra variável deve vir da versão publicada correspondente ou de um contrato estruturado do modo. Descrições livres não viram efeitos executáveis por interpretação. Regras futuras exigem contrato, editor, validação, versionamento, testes e compatibilidade com runs existentes. Manter o domínio de jogo separado da Mesa, o backend autoritativo, idempotência e revisão otimista para mutações. Não são necessários servidor de jogo, SignalR ou serviço pago novo.

As quatro fases da ideia original permanecem como **meta de conteúdo**, não uma estrutura obrigatória para toda publicação: o editor aceita de uma a cinco áreas normais e até quatro secretas. O responsável define o fim de cada área; não há obrigação de Chefe, nem tipo de nó capaz de receber bônus ou penalidade implícitos pelo nome. O jogo precisa continuar jogável quando as regras e a composição do modo mudarem.

### 0.2. O que já existe no código

| Frente | Estado atual comprovado no código | Limite atual |
|---|---|---|
| Run e isolamento | Criação/retomada/abandono/reinício, propriedade do personagem, snapshot, versão fixada, seed nova, revisão e comandos idempotentes | Integração completa em MySQL e interface real ainda precisa da rodada de aceite descrita em 0.8 |
| Gerenciamento | Rascunho/publicação imutável por versão do Sistema; áreas ordenáveis com nome/imagem, pool, peso, opção Único, fim configurável, descanso da Base escolhido por área, encontros separados e NPC/variante da Wiki com snapshot; XP e pool ponderada de loot por vitória de encontro | A publicação ainda não configura loja ou efeitos narrativos arbitrários |
| Mapa | Schema 5: início não interativo, 3–24 nós por área (18 por padrão), camadas descendentes geradas conforme a quantidade, sorteio por seed, áreas subsequentes reveladas ao avançar, Atalho, áreas secretas encadeáveis e final secreto alternativo | Ainda não existe fluxo próprio de Missão, Vendedor ou nó-surpresa ocultando seu tipo |
| Rotas | Combate, Elite e Boss usam o encontro configurado; Caçada sorteia entre encontros escolhidos, respeitando a quantidade de inimigos; Base/Descanso, Evento sem efeito, Atalho e Passagem Secreta são executáveis | Evento não entrega recompensa nem modifica recursos por texto; não há economia |
| Combate | D20 e faixas do Sistema, iniciativa configurada, alvo preferido com troca ao eliminar o alvo, atributo quando indicado, armas/acessórios, ações executáveis de item/prótese/skill/magia, mana/estamina, munição/recarga, cooldown, defesas, reação estruturada de falha crítica, 1–4 cópias de NPC e histórico persistido | Sem contrato de ataque não-D20, condições, quebra de armadura, tipos de dano, efeitos de cura/suporte ou estratégia de alvos durante a luta |
| Run e recursos | Descanso médio uma vez por mapa com ataque de oportunidade no encontro seguinte; consumo de itens de recuperação da cópia da run; descanso curto do loadout; Base usa o tipo configurado para sua área; XP configurado do encontro concedido uma vez na vitória e nível/pontos aplicados pelas regras publicadas; evolução de atributo e loot com revisão/idempotência | Escolhas de skill, magia e marcos ainda não têm tela nem efeito; não há economia ou efeitos narrativos estruturados |
| Interface | HUD, inventário em quatro abas e três colunas responsivas (catálogo, ações e equipamento defensivo), configuração por slot, até cinco ações ordenáveis mais descanso bônus, mapa SVG, imagens das áreas e dos nós, replay com controles, treino independente, histórico em modal lateral, modal de evolução e revelação de loot com dado | Sem loja, stash ou resultado completo da campanha |
| Encerramento | O último nó da última área normal ou de uma área secreta marcada como final pode dar vitória; qualquer derrota encerra a run, sem exigir Boss | XP e loot vêm dos encontros publicados, não de um prêmio implícito pelo encerramento; ainda falta a tela completa de resultado da campanha |

Essas linhas distinguem **código implementado** de **fluxo validado ponta a ponta**. Os testes automatizados não substituem uma run real com banco, assets e navegador mobile. Versões antigas (mapas schema 1–4 e prioridade legada de até sete armas) têm caminhos de compatibilidade e não devem ser reinterpretadas como schema 5.

Novas runs exigem uma versão publicada do modo com mapa schema 5. Uma versão antiga continua disponível para consultar ou terminar runs já iniciadas, mas não deve gerar novas runs de mapa curto. Para adotar o tamanho de mapa configurado, salve e publique um rascunho atualizado da mesma versão do Sistema e reinicie a run; o progresso de uma run existente nunca é convertido silenciosamente.

### 0.3. Configuração, mapa e escolhas: decisão atual

- Cada área normal tem ordem numérica, nome, imagem de fundo, Base opcional com tipo de descanso quando habilitada, opções de rota e escolha de nó final: Base (quando habilitada), rota específica ou sorteio ponderado. O nó final não precisa ser Boss. Chefes podem aparecer antes do fim ou em outras áreas. A ordem de criação não determina a ordem das áreas secretas.
- Uma área normal ou secreta do schema 5 tem de 3 a 24 nós jogáveis (18 por padrão) mais o início não interativo. O último nó é o fim configurado; os anteriores sorteiam opções por peso, com repetição permitida salvo quando `Único`. Quando habilitada, a Base implícita é única. A publicação rejeita pool incapaz de preencher o mapa. A seed fixa todas as escolhas daquela run; reinício cria outra seed. Para 18 nós, as larguras permanecem `2–3–2–3–2–3–2–1`; outras quantidades ajustam as camadas sem caminhos horizontais.
- As conexões avançam somente para baixo, na vertical ou diagonal. A próxima área normal só é exibida quando seu início é liberado. As imagens dos fundos das áreas precisam se encontrar sem voltar ao fundo anterior; a imagem da área vigente também serve de fundo geral do site durante a run, com desfoque/escurecimento e viewport estável no mobile. Ao retornar de combate ou concluir Base, a rolagem da página retorna à região atual do mapa.
- Atalho salta para o nó final **da área atual**, sem encerrar a run. A passagem secreta abre um mapa próprio, que pode abrir outra área secreta. Ao concluir cada área não final, a run volta ao mapa que a chamou, no mesmo ponto; completar uma área marcada como **final secreto** encerra a run em vitória alternativa. Isso não insere a área secreta na sequência normal nem migra sua posição para o mapa principal. Caçada apresenta imagem própria e não revela no mapa o NPC sorteado. Base e passagem secreta são retangulares; os demais nós interativos atuais são circulares.
- O catálogo de encontros é separado das rotas: um NPC pode compor encontros individuais e em grupo, e um encontro pode ser referenciado mais de uma vez. O NPC/variante é congelado na publicação; 1–4 cópias têm recursos e turnos independentes. Alterações nunca atingem a ficha da Wiki.
- Combate, Elite e Boss são categorias editoriais/visuais, sem mecânica extra implícita. Um eventual bônus específico de Elite ou Boss terá de ser configurado e versionado. “Aleatório” hoje é o sorteio ponderado do mapa/fim e o sorteio da Caçada; um nó de evento-surpresa com revelação ao entrar continua futuro.

### 0.4. Combate, personagem e loadout: decisão atual

- O inventário da run usa grade e abas Itens, Próteses, Magias e Skills, mais três colunas responsivas para catálogo, ações e equipamentos defensivos. Até cinco slots de ataque e um descanso curto bônus opcional podem ser equipados, retirados e reordenados; trajes, itens genéricos e próteses defensivas equipados aparecem em lista própria, com remoção e configuração quando aplicável. A capacidade de carga considera **todos os itens carregados** na cópia da ficha, não apenas os equipados; limites de skill e magia vêm do Sistema. **Não** há custo abstrato por pontos de composição; a ideia original foi substituída por essas regras e só deve voltar mediante configuração explícita.
- O simulador tenta a primeira ação executável da prioridade em cada turno e reavalia desde o início no próximo. Falta de recurso/munição ou cooldown permite seguir para a próxima. Quando uma arma gasta sua última munição utilizável, no turno seguinte as outras ações equipadas têm preferência se estiverem executáveis; se nenhuma estiver, a arma recarrega naquele turno antes de recorrer ao ataque de reserva. Recarregar consome o turno. Após executar um descanso, o turno seguinte começa na ação posterior e depois retorna à prioridade normal. O descanso usa exclusivamente a regra `SIMPLES` da versão do Sistema fixada, inclusive para recuperar recursos, e recarrega a partir da reserva real. O ataque de reserva definido pelo modo é o fallback. O inventário ordenado de até sete armas vale somente para runs legadas.
- Cada ação equipada de item ou prótese pode fixar alcance e quantidade de golpes, tiros ou rajadas; o modo pertence à arma. Toda a quantidade usa uma única rolagem, multiplica dano e consome recursos mesmo no erro. Os limites vêm da arma, da munição, da estamina e da versão publicada do Sistema. Armas vazias permanecem no loadout para poder recarregar; voltar a ter recursos recoloca a ação em sua prioridade salva.
- O resultado de `ATAQUE_COMUM` em 1D20, faixas, crítico natural, modificadores, atributos indicados e ordem de defesa vêm da versão publicada do Sistema; dano do personagem e do inimigo segue contratos estruturados e snapshots da versão do modo. Skill/magia legada com `acerto` D20 e dano pode entrar pela regra publicada; D6 e descrições sem contrato não são convertidos silenciosamente.
- Mana, estamina, munição, cooldown, escudo, proteção e armadura são registrados no log. Falha crítica causa dano zero e pode conceder revidar **somente** com `{"reacao":"REVIDAR"}` na regra publicada, sem consumir a ação normal seguinte do alvo. O combate não possui limite de rodadas como regra de jogo; proteção técnica por impasse/orçamento encerra com vencedor pela vida restante (empate favorece inimigos), sem anunciar rodadas ocultas na HUD.
- Combates oficiais são calculados e persistidos antes da animação, com seed e estados antes/depois; o replay revela gradualmente ações e recursos e pode ser revisto. Cada novo treino livre recebe seed nova e não altera a run. O resultado não deve ser antecipado por HUD/mapa antes de o replay terminar.
- A iniciativa usa a fórmula executável da versão do Sistema, quando configurada; caso contrário, preserva a ordem legada. Em encontro com múltiplos inimigos, o jogador pode escolher o alvo antes da resolução. A escolha é validada pelo servidor e, quando o alvo morre, passa ao primeiro inimigo vivo. Não há troca manual de alvo durante o replay.
- O descanso médio do mapa usa `NORMAL` da versão fixada, uma vez por mapa principal ou secreto. Ele deixa pendente um ataque extra **com vantagem** do primeiro inimigo no próximo combate oficial, antes da iniciativa normal; o mesmo inimigo pode agir novamente no seu turno. Consumíveis de cura/restauração usam os valores da cópia do item na run e nunca alteram a ficha original. O loot de combate atual acrescenta cópias de itens à run; não implementa compra ou transferência à ficha original.
- Cada Base do mapa schema 5 pode escolher seu tipo de descanso entre os tipos executáveis da versão publicada do Sistema fixada na run. A Base é um local seguro: ela dispensa somente a exigência circunstancial de guarda, sem alterar valores, percentuais ou limites de recuperação. Descansos com fórmula não executável não podem ser escolhidos. Nós independentes de `DESCANSO` e runs antigas sem `baseRestType` preservam a regra `base.restType` do modo, atualmente `SIMPLES`.
- O histórico de combates saiu do rodapé do mapa e abre pelo menu lateral. Uma luta oficial em 2× pode voltar automaticamente ao mapa; em 1× e numa revisão pelo histórico, o replay permanece aberto até ser fechado. Esses comportamentos de apresentação não recalculam a batalha salva.
- O encontro publicado pode definir XP não negativo pela vitória. O servidor acrescenta o XP à cópia da run na mesma transação que salva o combate, sem concessão na derrota nem duplicação por repetição do comando; a ficha de origem permanece intacta. Se a versão publicada do Sistema tiver módulo de progressão e níveis executáveis, o limiar do nível atual sobe a run automaticamente, concede os pontos da linha do nível alcançado e respeita o limite de nível e `permiteXpExcedente`. Sem limiar publicado, não há fallback numérico nem subida inventada. Direitos de skill/magia e marcos são retidos em `status.evolucoesPendentes`, sem execução automática de texto livre. O replay revela `+XP` em contagem luminosa e o nível alcançado após o resultado; o HUD recebe um brilho breve ao voltar ao mapa. Pontos de atributo podem ser gastos na run conforme a configuração publicada da seção 39; escolhas de skill/magia e marcos ainda exigem camada própria.

### 0.5. Diferenças deliberadas frente ao estudo inicial

| Ideia inicial | Direção vigente |
|---|---|
| Quatro fases e Boss obrigatório por fase | Até cinco áreas normais configuráveis; fim de qualquer tipo e Boss em qualquer área; quatro áreas completas continuam meta de conteúdo/balanceamento |
| Mapa pequeno com restrições de Elite/Base consecutivos | Schema 5 oferece 3–24 nós por área (18 por padrão), pesos e Único; o administrador escolhe tamanho e fim; não impor roteiro escondido |
| Custo por pontos/poder do loadout | Até cinco slots de ataque mais descanso bônus, carga da ficha e limites de skill/magia do Sistema; custo por pontos não existe hoje |
| Reutilizar Cytoscape no mapa | Mapa próprio em SVG, mais simples e já implementado; Cytoscape continua para a teia da Wiki |
| Caça somente pós-MVP | Caçada executável já existe; seu sorteio é fixado pela seed |
| “Aleatório” como tipo de nó genérico | Sorteios ponderados de rota/fim já existem; nó-surpresa autônomo fica como expansão futura |
| Evento narrativo com efeito presumido | Evento atual conclui rota sem efeito; efeito/recompensa precisa de contrato explícito |

### 0.6. Próximas camadas, na ordem recomendada

1. **Validar a fatia jogável atual (primeiro).** Testar no MySQL e na interface uma run nova schema 5 completa com duas áreas, final sem Boss, Caçada com múltiplos NPCs, Atalho, Base opcional, cadeia de áreas secretas com retorno e final alternativo, derrota, vitória e retomada após F5. No mesmo aceite, conferir ordem/prioridade do loadout, munição e recarga em vários turnos, iniciativa, alvos, descanso médio e ataque de oportunidade, consumível, equipamentos defensivos e reparo automático da proteção na Base conforme a opção publicada, replay em 1×/2× e revisão pelo histórico. Conferir especialmente a concessão única de XP, evolução de atributo aplicada a máximo/rolagens, loot pendente, dado/revelação/entrega no inventário, peso de todos os itens, isolamento da ficha, publicação de versão, idempotência/revisão, imagens e scroll no desktop/mobile. Corrigir falhas encontradas antes de somar novas regras. Testes automatizados cobrem partes, não esse percurso inteiro.
2. **Progressão e recompensas avançadas.** XP por encontro, concessão idempotente, limiar/pontos da versão publicada, subida automática da cópia, distribuição de atributos e loot ponderado de combate já existem no escopo da seção 39; sua validação de uso foi confirmada pelo responsável pelo jogo, ressalvados os marcos ainda não testados. Não refazê-los. Para skills/ultimates, separar a **autoria de opções pré-feitas pelo dono do modo** da futura definição de contratos executáveis, escolha pelo jogador e aplicação em combate; ver seção 43. Até lá, direitos e pontos permanecem pendentes e não se convertem em efeitos inventados. Acrescentar XP/efeitos de eventos somente por contrato explícito e configurar ofertas de outras origens quando elas existirem. A tela completa de resultado da run, com todos os ganhos, fica como ampliação além do resumo atual.
3. **Economia e preparo.** Vendedor com ofertas geradas da versão/seed, preço e moeda de run explicitamente configurados, compra idempotente, equipar ou mandar ao stash. Base passa a permitir reorganizar loadout e consultar stash além do descanso já existente. Sem moeda/catálogo/regra de preço definida, a loja não deve ser simulada no cliente.
4. **Variedade de eventos.** Nó-surpresa que revela seu tipo ao entrar, missões com fluxo/submapa e recompensa, eventos com efeitos estruturados, descansos com guarda ou fórmula quando o Sistema os publicar. Caçada e área secreta já são base reutilizável, não tarefas a refazer.
5. **Expansão de combate e campanha.** Contratos para ações não-D20, cura/suporte **em combate**, condições, tipos de dano, quebra de armadura, efeitos especiais de rajadas, mudança de alvos durante a luta e mecânicas particulares de Chefes/Elites **somente quando configuradas**. Quantidade básica de rajadas, alvo preferido pré-combate e consumíveis fora de combate já existem e não devem ser refeitos. Popular e balancear até cinco áreas normais, respeitando o modo publicado e snapshots de runs antigas.
6. **Polimento e operação.** Acessibilidade por teclado/leitor, alternativa textual ao mapa, pausa/velocidade/pular replay, mobile/tablet, custos e tamanho dos logs, proteção de servidor e métricas de balanceamento. Parte da HUD e do replay já está pronta; verificar o restante em tela real.

Cada camada só se fecha com contrato/versão, backend autoritativo, interface, tratamento de erros, testes de domínio e um fluxo real com banco. Novas estruturas de dados exigem migração segura e compatibilidade de schema 1–5. Não migrar silenciosamente uma run ativa para outra publicação.

### 0.7. Decisões ainda abertas (não bloquear a validação da base atual)

- Direitos de skill/magia, marcos de nível e uso dos respectivos pontos ainda precisam da separação entre catálogo pré-feito do modo, contrato executável e escolha do jogador descrita na seção 43. XP de combate, custo de nível, atributo escolhido, aumento dos máximos e pesos/rolagem de loot já têm contrato estruturado; não permanecem decisões em aberto nessa fatia.
- Moeda, preços de compra, ofertas, venda, stash e momento de escolher/equipar recompensas fora do loot de combate. O valor opcional do item e o desconto percentual de venda já são dados versionados, mas não constituem uma loja funcional.
- Regras executáveis para D6, cura/suporte em combate, condições, efeitos especiais de rajadas, esquiva, quebra de armadura, tipos de dano, descanso com guarda/fórmula e morte/sobrevivência. O consumo de item restaurador fora de combate e a quantidade básica de rajadas não resolvem esses contratos futuros.
- Escalonamento opcional de NPCs por área/nível e mecânica diferenciada de Boss/Elite. Hoje o snapshot publicado e o encontro definem o adversário; não há multiplicador implícito.
- Múltiplas runs ativas, meta-progressão e transferência permanente de itens/XP para a ficha original não fazem parte da run atual.

### 0.8. Evidência e critério para seguir

Os testes de domínio de run, mapa, gerenciamento, montagem e simulação de batalha são a primeira proteção; após elevar o limite de ações, **399 testes de backend passaram**, assim como build, lint direcionado do inventário e 15 testes de apresentação/inventário. O responsável pelo jogo relatou ter confirmado em uso XP, evolução de atributos, rolagem/entrega de loot e sua persistência após recarregar, sem afetar a ficha original; a experiência dos marcos de nível segue sem confirmação. Esse aceite manual não substitui integração de persistência real (MySQL/migrations, concorrência e idempotência) nem uma rodada de pré-produção desktop/mobile com publicação de modo, vitória, dado em 1×/2× e retomada de loot pendente. Registrar especialmente: completar a última rota configurada, vencer sem Boss, encadear secretas e finalizar uma delas, reabrir a run, perder/retomar conexão e confirmar que uma nova publicação não alterou a run antiga. **Esta alteração não executou o aceite no navegador.**

**Ponto atual:** fundação, editor, mapa flexível, múltiplos inimigos, combate básico autoritativo e encerramento de run estão implementados. XP, subida de nível/pontos, distribuição de atributos e loot de combate existem na cópia da run; escolhas de skill/magia e marcos, economia, stash e recompensas de outras origens não. Antes de somar outros efeitos persistentes, fechar a validação da fatia jogável e da progressão no banco e na interface; não é preciso reconstruir mapa, editor, loadout ou Caçada. Se o teste de integração encontrar falha, corrigi-la antes de somar novos efeitos.

### 0.9. Correspondência com as fases antigas da seção 15

| Fase antiga | Leitura correta agora |
|---|---|
| 0 — contratos | Fundação versionada criada; XP de combate, progressão de atributo e loot têm contratos executáveis; direitos de skill/magia, marcos e efeitos não-D20 ainda precisam de contratos próprios |
| 1 — batalha | Simulador e log implementados para ataques executáveis em D20, recursos e múltiplos NPCs; não significa cobertura de todo o RPG |
| 2 — run/snapshot | Implementada; o “custo de composição” inicial foi substituído por até cinco slots de ataque, descanso bônus, carga e limites do Sistema |
| 3 — mapa/primeira fase | Mapa flexível e vitória/derrota existem; fechar com teste ponta a ponta, não recomeçar do mapa simples |
| 4 — economia/eventos | Caçada, Evento sem efeito, Base, Atalho, descanso médio, consumo de restauradores e obtenção de loot de combate antecipados; loja, stash, recompensa de eventos e surpresa ainda faltam |
| 5 — quatro fases | O editor e o gerador suportam até cinco áreas normais; conteúdo/balanceamento, progressão e missões continuam pendentes |
| 6 — polimento | HUD e replay parciais; aceite mobile, acessibilidade e operação ainda faltam |

### 0.10. Primeiro marco de produção: versão jogável inicial

O primeiro deploy **não precisa aguardar as seis camadas do roadmap**. Ele pode ser uma versão inicial claramente identificada como tal, com run single-player, mapa e combate publicados, atributos e loot da cópia da run, cinco ações mais descanso bônus, vitória/derrota e retomada. Para esse primeiro marco, publicar somente conteúdo que usa contratos executáveis disponíveis: ataques suportados, descansos publicados, encontros/loot válidos e rotas sem referências ocultas. A vitória apresenta tela animada com combates, inimigos, áreas, XP e itens recebidos; a ficha original permanece intacta.

**Verificações do primeiro lançamento:**

1. Concluir a validação dirigida localmente com MySQL e migrations e conferir uma run inteira em desktop e mobile: criação, cinco ações e descanso, combate, XP/atributos, loot/consumível, Base, derrota/vitória, F5 em combate/loot pendente e área secreta encadeada com retorno ou final alternativo. Homologação separada é recomendada, não obrigatória. A confirmação manual já relatada para XP/loot conta como evidência, mas não cobre sozinha os outros caminhos.
2. Executar suíte automatizada, build e verificações de regressão; acrescentar testes de integração de persistência e concorrência para operações que concedem XP/loot, salvam loadout e encerram a run. Confirmar isolamento da ficha original, propriedade da run, autorização administrativa do editor, idempotência e compatibilidade de uma run antiga após nova publicação.
3. Aplicar migrations de forma controlada conforme [DEPLOYMENT.md](DEPLOYMENT.md), validar assets e rotas da API no site publicado e registrar falhas sem expor dados sensíveis. Backup do banco é recomendado, mas foi dispensado pelo responsável nesta publicação; sem ele, uma falha que afete dados pode não ser reversível. Se houver homologação, ensaiar nela primeiro. Fazer smoke test após subir antes de divulgar o jogo.
4. Validar o conteúdo publicado contra os contratos executáveis. Magias ofensivas com teste D20 e dano estruturado já podem ser equipadas pelo jogador nas cinco ações, como as ações equivalentes de NPC; magias de efeito livre ou de outro dado exigem contrato próprio. As novas skills e ultimates pré-feitas e suas escolhas por nível/marco ficam para a etapa futura da seção 43: preservar direitos pendentes e avisar que ainda não são utilizáveis, sem bloquear a run. Não converter texto livre em efeito automático. Não existe conserto manual gratuito: a Base restaura automaticamente somente a proteção original dos itens carregados se `repairProtectionAtBase` estiver ativo na versão do modo (padrão verdadeiro). O escudo nunca é restaurado por descanso na Base e precisa de novo efeito que o conceda.

**Decisão de lançamento:** após as verificações executáveis e sem falha bloqueante no percurso, acompanhar erros e estado das runs ao publicar. Se quiser liberar primeiro a um grupo pequeno, criar controle explícito de disponibilidade no backend e na navegação; a autenticação atual, sozinha, não é um rollout gradual. Loja, stash, missões, contratos não-D20, skills/ultimates executáveis e balanceamento de todas as áreas não são pré-requisitos desse primeiro marco, desde que o conteúdo publicado não dependa deles.

O procedimento operacional e as evidências pendentes estão em [ROGUELIKE_RELEASE_CHECKLIST.md](ROGUELIKE_RELEASE_CHECKLIST.md). O SQL idempotente das migrations foi gerado localmente; a aplicação limpa, a atualização incremental desde o schema pré-run e os testes de concorrência da run e entrega única de loot passaram em MySQL 8.0 descartável no Docker local em 15/10/2026. Isso não equivale ao aceite mobile. O backup foi dispensado pelo responsável; o smoke test do site publicado vem após o deploy. Não é obrigatório criar homologação separada para isso.

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

## 3. Contexto das alterações da Wiki por Mesa

Quando este plano foi escrito, havia uma branch separada com alterações relacionadas à Wiki por Mesa, NPCs de cena, variantes e turnos. O roguelike começou depois, em branch própria a partir da `main`.

Essas alterações ajudam o planejamento porque já introduzem:

- snapshots locais de NPCs;
- origem e variante estáveis;
- cópias independentes por contexto;
- participantes persistentes de combate;
- condições e cooldowns;
- ordenação via DnD Kit;
- atualização por seções em tempo real.

O fluxo de separação adotado foi:

1. concluir e testar a branch atual;
2. integrar as alterações na `main`;
3. criar uma nova branch, `feature/roguelike-game`;
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
- A batalha não tem limite de rodadas jogável ou visível. Um orçamento técnico de eventos e a detecção de impasse protegem o servidor; se acionados, vence o lado com mais vida restante.
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
18. A falha crítica deve ter alguma consequência além de desperdiçar a ação e seus custos? Em um duelo alternado 1×1, conceder apenas um “revidar” não cria uma consequência nova.

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

Para evitar respostas muito grandes ou loops, deve haver limite técnico de eventos e detecção de ausência de progresso. Esses mecanismos não são anunciados como regra do combate; ao encerrar por segurança, a vida restante decide o vencedor. Em igualdade, vence o lado inimigo.

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

Itens `traje` equipados contribuem com `escudoBase`, `protecaoBase` e `armaduraBase`; itens `outro` podem definir `escudo`, `protecao`, `armadura`, `dano` e recuperação de vida, mana ou estamina. O item `outro` pode ser consumido quando tem recuperação, equipado como defesa quando tem defesa e usado como ataque quando tem dano e teste executável. Essas ações afetam apenas a cópia da run. Escudo absorve até seu valor no primeiro impacto e então acaba; proteção se desgasta, enquanto armadura é fixa. O inventário deve preservar o restante de escudo/proteção do equipamento para impedir recuperação por desequipar e reequipar.

O inventário da run separa itens disponíveis, ações em ordem e equipamentos defensivos/próteses equipados. Trajes e outros itens defensivos podem ser retirados diretamente; a proteção consumida só é consertada automaticamente ao entrar em Base se a configuração versionada do jogo permitir. Não há ajuste manual gratuito. O escudo consumido só volta por um novo efeito que conceda escudo, nunca pela Base.

Passagens secretas também podem aparecer dentro de áreas secretas, sem ciclos entre áreas. Ao concluir uma área secreta comum, a run volta à passagem da área anterior; a opção **Área secreta final**, desmarcada por padrão, encerra a run como final alternativo ao concluir o último nó da área. A pilha de mapas é salva na run para sobreviver à reconexão.

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

- progressão **vertical, de cima para baixo**, em desktop, tablet e mobile; ramificações podem ocupar posições lado a lado dentro da mesma camada, mas **toda conexão** vai para uma camada inferior (vertical ou diagonal), nunca horizontal ou ascendente;
- início único;
- nó final configurável pelo responsável pelo jogo, sem tipo obrigatório;
- todos os nodes alcançáveis;
- ao menos um caminho até o nó final da área;
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
- vitória, derrota, impasse e proteção técnica de eventos;
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
- nó final alcançável;
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

## 19. Estado da primeira camada implementada

Esta entrega é uma **prévia jogável e isolada**, não o MVP completo da seção 4.1:

- `GameModeVersion` e `GameRun` guardam a versão do modo, a versão publicada do Sistema, a seed, a revisão e uma cópia da ficha. Uma run ativa por usuário é protegida no banco; criar e abandonar usam chave de idempotência.
- `/jogo` permite escolher um personagem pessoal, iniciar ou retomar a run. A versão atual do modo aceita `ATAQUE_COMUM` em D20 da Odisseia; outras fichas ainda podem aparecer na seleção, mas são recusadas ao iniciar se não tiverem regras compatíveis.
- `/jogo/run/:id` exibe os recursos da cópia e reproduz, com pausa, avanço, velocidade e opção de pular, uma batalha de treino 1×1 calculada pelo backend. A prévia usa o estado salvo e a versão fixada da run. Ela **não avança a run**, não concede recompensa e não altera a ficha original.
- Armas com dano e teste executáveis podem entrar na prévia; a ação de treino configurada no modo é o fallback. O modo define provisoriamente o inimigo e os danos por resultado. A classificação do ataque e a ordem das defesas vêm da versão do Sistema. Descrições textuais sem regra executável não são convertidas em efeitos.
- O escudo é uma reserva numérica consumida integralmente no primeiro impacto positivo: absorve até seu valor, e o excedente segue a ordem de defesas publicada no Sistema. Proteção se desgasta conforme absorve dano; armadura reduz cada golpe sem consumo. Trajes e itens `outro` equipados na cópia da run somam seus valores de escudo, proteção e armadura, sem alterar a ficha original. Tabelas personalizadas de arma não cobertas pelo balanceamento do modo ficam fora desta prévia sem impedir o fallback.
- O simulador é determinístico para a mesma seed e emite um log tipado. A proteção por eventos e a resolução de impasses seguem a seção 30; o frontend apenas reproduz o log, sem calcular resultados.

**Limites desta camada:** ainda não há mapa, loadout editável, batalha como comando persistente, progressão, recompensas ou conclusão de run. O contrato de dano/defesa não cobre todos os casos do RPG: quebra de armadura, condições, tipos de dano, habilidades e magias ficam para camadas posteriores, depois de configurados como regra executável. A prévia não deve ser usada como resultado oficial de Mesa.

## 20. Primeira etapa persistente

- A run agora guarda um pequeno mapa inicial (`inicio ↓ treino-1`), exibido verticalmente em todas as telas. Runs criadas antes desta camada recebem o mesmo mapa inicial na leitura e o persistem ao selecionar o encontro. Este grafo é uma etapa demonstrável, **não** a primeira fase completa nem o gerador procedural planejado na seção 10.
- Selecionar `treino-1` exige revisão e chave de idempotência; não rola dados nem consome recursos. Resolver o encontro usa a versão de Sistema e de modo fixadas na run, a mesma composição executável da prévia e uma seed gerada no servidor.
- O resultado, o log completo, a seed e os estados da ficha antes/depois são salvos em `GameRunBattle` junto com a atualização da run. A transação impede resultado sem estado correspondente. Vida, mana, estamina, escudo e proteção da cópia são atualizados; a munição é gasta dentro do encontro e registrada no log, mas cada batalha — inclusive a primeira — começa com o carregador cheio, independentemente da munição atual da ficha de origem. A reserva da run não é consumida permanentemente. Escudo e proteção gastos pelo equipamento não reaparecem ao desequipar e reequipar o mesmo item. A ficha original permanece intacta.
- Ao voltar à run, o histórico do encontro é carregado do banco e pode ser reproduzido novamente. A simulação livre permanece separada e não altera a run. Derrota ou ausência de vencedor encerram a run; vitória conclui este nó, mas deixa a run ativa aguardando as próximas etapas.
- Esta camada reutiliza o inimigo e o balanceamento de treino da versão `0.1.0` já publicada, sem editar essa configuração imutável. Não há ainda Base, Elite, Boss, recompensas, progressão ou loadout editável.

## 21. Primeira bifurcação do mapa

- A versão `0.2.0` do modo acrescenta duas rotas de Combate após a Sentinela. O mapa usa a seed da run para distribuir os encontros à esquerda/direita, mantendo a mesma topologia e os mesmos IDs para aquela run. As conexões são apenas verticais ou diagonais descendentes; o gerador valida que não há arestas horizontais, ascendentes ou nós inalcançáveis.
- Caçador e Guardião são dois encontros com vida e dano configurados na versão publicada do modo; a classificação do D20, os modificadores das armas e a ordem de defesa continuam vindo da versão fixada do Sistema. Esses valores do modo são provisórios para esta fatia, não regras novas do RPG.
- Após vencer a Sentinela, ambas as rotas ficam disponíveis. Escolher uma marca a outra como ignorada; o servidor verifica conectividade, revisão e idempotência. Um segundo combate persiste recursos e log separadamente. A tela permite rever cada combate mesmo após retornar ao jogo.
- Historicamente, runs `0.1.0` precisavam de **Continuar jornada** após a Sentinela. Agora o mapa jogável da versão atual é apresentado desde a entrada. Runs ativas antigas são atualizadas para `0.3.0` ao abrir a jornada ou concluir um combate pendente; nomes, payloads, escolhas e combates já resolvidos permanecem preservados. Runs encerradas não são alteradas.
- A visualização SVG mostra o avanço de cima para baixo; os próprios nós são as opções de escolha, inclusive por teclado e no mobile.

**Ainda não é a primeira fase completa:** a Base foi acrescentada na versão `0.3.0` (seção 26), mas ainda não há Elite, Boss, recompensas ou composição completa de loadout. Após concluir a Base, a run fica ativa aguardando a próxima camada. Os próximos nós, custos/recompensas e a conclusão real da fase devem ser configurados e implementados sem inferir efeitos de descrições textuais.

## 22. Fluxo da batalha na tela da run

- Confirmar uma rota disponível seleciona o nó e resolve o combate oficial em sequência, com comandos idempotentes. Não há um segundo botão obrigatório para iniciar a batalha. Se uma seleção anterior ficou pendente, a run oferece **Continuar combate** para recuperação.
- O servidor persiste o resultado antes da reprodução visual, mas a tela exibe somente o combate enquanto ele é reproduzido. Mapa, status e recursos atualizados não aparecem antes do resultado. Ao terminar (ou pular a reprodução), a HUD retorna automaticamente ao mapa e revela o estado da run.
- Se a página for recarregada antes de visualizar o resultado, o último combate ainda não visto abre diretamente na reprodução. O histórico de combates concluídos permanece acessível no mapa para rever cada encontro.
- O **Treino livre** abre pelo ícone lateral, separado do mapa; continua independente, sem alterar a run.
- Cada pedido de novo treino recebe uma seed gerada no servidor e produz um novo log, sem alterar a run ou a ficha. **Rever** reproduz o log já recebido; **Refazer simulação** requisita outra batalha. Resultados iguais ainda podem ocorrer por acaso. Os combates oficiais continuam usando sua própria seed persistida e o replay salvo.

## 23. Inventário e prioridade de armas

- A tela da run permite abrir o inventário da cópia do personagem. As armas com identificador estável podem ser reordenadas por arraste ou setas; os demais itens permanecem visíveis para consulta.
- A ordem é salva exclusivamente em `GameRun.LoadoutJson`, com revisão otimista e chave de idempotência. O servidor exige exatamente os IDs de armas presentes na run, sem duplicatas, e recusa mudanças durante um encontro selecionado. A ficha original e a ordem visual do seu inventário não são alteradas.
- O simulador e a prévia percorrem as armas na ordem salva antes do ataque de reserva, mas atualmente só montam **até sete armas executáveis**. Uma arma sem regra executável, recurso ou munição suficiente é ignorada conforme as regras atuais. Esta etapa é apenas a **prioridade de armas**; limite de composição e seleção de skills/magias continuam para as próximas camadas.

## 24. HUD da jornada e leitura do combate

- No replay, classificação, valor do dado e dano usam cor pela perspectiva do jogador: verde para resultados favoráveis e vermelho para desfavoráveis. Críticos têm destaque adicional, usando os indicadores da faixa publicada na versão do sistema; logs anteriores continuam legíveis pelo código do resultado.
- A falha crítica atual causa zero dano e consome a ação e seus custos, sem conceder reação ou turno extra. O crítico positivo usa o dano configurado para a ação e depois segue as defesas normais; qualquer efeito adicional deve ser uma regra explícita e versionada.
- A tela da run usa uma HUD compacta: personagem, nível, XP e três recursos em uma faixa superior; mapa central e maior. Reinício, inventário, treino, descanso médio e histórico de combates ficam no menu vertical de ícones. O histórico saiu do rodapé e abre em um modal, de onde cada combate salvo pode ser reproduzido.
- O replay preserva o log completo e o resultado autoritativo no servidor, mas apresenta cada ação como uma unidade: ação, classificação, dado e dano após as defesas, com absorção separada. Eventos internos, preparação redundante e dano zero de erro não viram linhas separadas. A reprodução avança por essas ações sem revelar o resultado da run antes do fim do combate.
- No resumo visível, o dano do golpe depois das defesas não é limitado à vida que restava ao alvo; a barra de vida continua limitada a zero. Os controles de reprodução ficam antes dos combatentes. O combate oficial em 2× retorna automaticamente ao mapa ao terminar; em 1× permanece aberto até o usuário fechar. Combates reabertos pelo histórico nunca fecham sozinhos. Em telas estreitas, ambos os combatentes permanecem lado a lado, com leitura compacta de recursos, ações e histórico.
- A sequência bruta de turnos e eventos continua preservada no log, mas a HUD não expõe a contagem de rodadas nem o tamanho futuro da reprodução. No treino, o cabeçalho do modal permanece fixo e o conteúdo rola dentro dele.
- O replay mostra vida, mana e estamina de ambos os combatentes. Cada barra acompanha apenas os eventos `RESOURCE_CHANGED` já revelados; custos reais de mana/estamina também aparecem no resumo da ação. O frontend não calcula nem aplica custos por conta própria.
- O inimigo pode receber `maxMana`, `maxEstamina`, `custoManaAtaque` e `custoEstaminaAtaque` na configuração **versionada do modo**. Campos ausentes continuam em zero para preservar runs anteriores; nenhuma regra ou custo é inferido da descrição do inimigo. O simulador valida disponibilidade, consome os recursos e registra os eventos quando o ataque configurado é executado.

## 25. Corte anterior (modo 0.3.0) e pendências verificadas

Esta seção registra o corte anterior, na versão 0.3.0. O estado mais recente está na seção 28. As seções 19–24 e 26 descrevem **fatias entregues**, não a conclusão sequencial de todas as fases 0–3 da seção 15. A prova de conceito da fase 1 funciona no escopo de regras já executáveis, mas decisões da fase 0 ainda estão abertas. O mapa contém a Sentinela, uma bifurcação entre dois combates e, na versão 0.3.0, uma Base; ainda não é a primeira fase completa. O loadout ainda não aplica custo de composição nem seleciona skills/magias, portanto a saída da fase 2 também não foi atingida integralmente.

Antes de considerar o combate básico fechado:

- **Atributos nos ataques:** o snapshot do jogador já conserva seus atributos, e armas só os acrescentam à rolagem quando a especificação executável do teste indicar um atributo. O ataque de reserva e os ataques dos inimigos atuais usam modificador zero, pois o modo ainda não define atributo para eles. Evoluir a configuração versionada do modo e o snapshot dos inimigos para aplicar os atributos exigidos pela regra publicada, sem presumir que todo ataque usa o mesmo atributo; testar jogador, inimigo e fallback.
- **Prioridade de armas:** o teto provisório de sete armas executáveis agora é informado no inventário. Ao implementar o limite de composição, substituí-lo pela regra configurada e informar claramente quais armas ficam fora do combate; até lá, não tratar a ordenação de um inventário maior como garantia de que todas participarão.
- **Falha crítica:** manter o comportamento atual de dano zero e consumo de ação/recursos até existir uma consequência executável, explicitamente configurada e versionada. Não criar revidar extra implícito; decidir a regra antes de implementá-la.

Depois dessas correções pontuais, seguir a fase 2 com composição completa do loadout e ações de skills/magias; na fase 3, continuar após a Base com Elite, Boss, recompensas/progressão necessárias e encerramento real da primeira fase. As fases 4–6 permanecem futuras.

**Validação ainda necessária para fechar as fases:** os testes atuais exercitam o simulador e os services com repositórios simulados, mas não substituem um fluxo de integração com MySQL/migrations e a interface real. Antes de declarar uma fase concluída, testar criação/retomada, duas batalhas e replay após recarregar, atualização automática de uma run `0.1.0`, ordenação com inventário extenso, concorrência/idempotência no banco e ausência de alteração da ficha original.

## 26. Primeira camada da fase 3: Base

- A versão `0.3.0` do modo acrescenta uma Base abaixo da bifurcação. Vencer **uma** das rotas libera a Base; a rota não escolhida permanece ignorada. O caminho continua vertical, com conexões diagonais até a Base. Runs novas já nascem nessa versão, com todos os nós jogáveis atuais visíveis e encontros distribuídos pela seed; runs ativas antigas migram sem exigir um botão de continuação e sem refazer combates. Elite, Boss e o restante da fase ainda não estão implementados.
- Ao atualizar uma run anterior, os nós já jogados mantêm nome, encontro e estado originais, mesmo que a configuração da versão nova dê outro nome à rota. Erros de atualização devem exibir o motivo retornado pelo serviço; só uma revisão realmente desatualizada pede recarga.
- Entrar na Base aplica uma única vez o descanso `SIMPLES` da **versão publicada do Sistema vinculada à run**. Tipo de recuperação, vida, mana e estamina são lidos dessa versão, sem valores próprios codificados no frontend ou efeito inferido da descrição. Se essa regra exigir guarda, usar fórmula ou não existir, o serviço recusa o descanso automático; essas regras precisam de um fluxo próprio em camada futura.
- O descanso altera apenas o estado copiado da run, respeita os máximos registrados na ficha, registra revisão e idempotência e não muda a ficha de origem. Para snapshots antigos sem máximo, não presume uma capacidade nem recupera aquele recurso. A Base fica concluída e mostra os valores efetivamente recuperados. O estado é persistido e reaparece ao retomar a run, sem reexecutar o descanso.
- Esta camada **não** acrescenta Elite, Boss, recompensa ou encerramento da fase. Também não resolve as decisões pendentes de atributo de ataques, composição de loadout e consequência adicional da falha crítica da seção 25. Elas devem seguir regras publicadas e/ou configuração explícita, sem mudar runs já fixadas.

## 27. Decisões para a configuração administrativa e o loadout

- O Gerenciamento terá uma área própria para editar o roguelike. A fonte de verdade de cada fase pertence a uma **versão publicada do modo**, vinculada à versão publicada do Sistema: nome e imagem das áreas, tipos de nó permitidos, pools de encontros e inimigos, pesos e regras executáveis. Rascunhos são editáveis; publicações são imutáveis. Uma run fixa a versão do modo e os snapshots necessários ao iniciar, sem receber mudanças posteriores automaticamente.
- Inimigos devem usar atributos reais de seu snapshot, assim como o personagem do jogador. O editor pode referenciar NPCs da Wiki, inclusive variante específica; a publicação congela os atributos necessários. Uma ação só soma o atributo que sua especificação executável indicar. Sem atributo indicado, o modificador desse atributo é zero, não um palpite do jogo. Não interpretar texto livre de ataques como regra.
- O inventário da run terá abas de itens, próteses, magias e skills em grade, mais **três slots de ações de ataque equipadas**. O jogador pode equipar, remover e arrastar para ordenar os slots. O limite de carga vem da capacidade de carga no snapshot do personagem, e cada item/protése usa seu peso definido; itens sem peso não são penalizados. Limites de skills e magias vêm da versão do Sistema fixada na run. A ficha original permanece intocada. O servidor valida seleção, IDs, capacidade e executabilidade antes de salvar e montar a batalha.
- O simulador segue a ordem dos três slots a cada turno, reavaliando recursos, munição e cooldown. Apenas ações com contrato executável entram no combate. A antiga prioridade de sete armas é compatibilidade de runs antigas e deixa de ser regra de novos loadouts.
- A consequência da falha crítica vem da configuração **estruturada** do resultado na versão do Sistema. Se a regra publicada determinar revidar, o alvo recebe um turno bônus de reação e conserva seu turno normal seguinte; cada um avança a contagem de turnos e reavalia cooldown e recursos. Se a regra não especificar reação executável, mantém-se dano zero e consumo da ação/custos. O texto descritivo sozinho não autoriza uma reação automática.
- No mobile, a grade e os três slots podem empilhar verticalmente; as quatro abas, os alvos de toque e a ordenação por arraste precisam permanecer utilizáveis sem rolagem horizontal obrigatória.

## 28. Versão administrável 0.4.x (implementada)

- O Gerenciamento agora possui a seção **Jogo** para editar rascunho e publicar uma nova versão. Nome/imagem das áreas, Base, pools ponderados de Combate/Elite/Boss, eventos narrativos, descansos, NPCs, atributos do ataque, custos, dano por resultado e ataque de reserva são configuráveis. Runs novas usam a versão publicada mais recente do modo vinculada ao Sistema; runs antigas preservam versão, mapa e loadout. As versões antigas do mapa preservam sua topologia e suas regras de conclusão; a topologia expandida e a liberdade de escolher o nó final pertencem ao schema 5.
- Até quatro rotas por área são selecionadas deterministicamente pela seed da run. Eventos narrativos só concluem a rota e registram revisão; **não** geram recompensa/efeito implícito. Descansos usam a regra `SIMPLES` da versão do Sistema fixada, como a Base. As imagens das áreas são assets administrados pelo mesmo serviço de imagens do site. A configuração publicada congela os atributos/recursos do NPC da Wiki ou variante escolhida. Não há dependência da ficha original do NPC durante a run.
- O personagem e os NPCs usam seus atributos reais **quando a ação publicada indica qual atributo aplicar**. Para ações sem atributo especificado, o modificador permanece zero. O editor inclui o atributo do ataque de reserva do jogador e do ataque do inimigo. O dano/classificação continua seguindo as faixas publicadas do Sistema e o dano versionado do modo.
- Runs 0.4.x usam grade de itens, próteses, magias e skills e três slots de ataque ordenáveis; apenas ações com teste D20 e dano executável são aceitas ao salvar. Peso dos itens/próteses equipados é comparado à capacidade de carga da cópia da ficha. Skills e magias respeitam os limites da versão fixada do Sistema. A antiga lista de até sete armas continua exclusivamente para runs anteriores.
- A falha crítica só concede revidar extra quando `ATAQUE_COMUM/FALHA_CRITICA.EfeitoJson` da versão publicada do Sistema contém `{"reacao":"REVIDAR"}`. O alvo executa o turno bônus e depois o turno normal, ambos registrados; sem esse efeito estruturado, não há reação implícita. A reação respeita recursos, munição e cooldown da ação escolhida. Dados descritivos não substituem a configuração estruturada.
- Esta camada **não** implementa recompensas automáticas, XP de run, tipos de evento com efeitos arbitrários nem regra para descanso com fórmula/guarda. Essas extensões exigem contratos executáveis próprios antes de entrar no editor. É necessária validação manual de ponta a ponta, inclusive em mobile e com banco real, antes de considerar o fluxo fechado.
- O editor lê os códigos de resultado de `ATAQUE_COMUM` da versão publicada do Sistema, em vez de fixar os cinco resultados históricos. O mestre define o dano do inimigo e o multiplicador/bônus do personagem por resultado; a publicação recusa resultados sem configuração. Quando a versão do Sistema muda e não há modo publicado para ela, o administrador pode criar um rascunho a partir do último modo publicado; resultados novos começam com dano zero até serem configurados, sem publicação automática nem alteração das runs antigas.

## 29. Ajustes do gerenciamento e NPCs da versão 0.4.x

- O Gerenciamento escolhe explicitamente a versão publicada do Sistema que receberá o modo. Publicar uma versão do jogo para o Sistema atual **não** altera runs existentes nem personagens que permanecem vinculados a outra versão do Sistema. O cabeçalho da run informa as duas versões fixadas; uma nova run usa a publicação mais recente correspondente à versão da ficha escolhida.
- Os encontros são cadastrados em um catálogo independente das áreas. Cada rota da pool escolhe um encontro do catálogo; o mesmo encontro pode aparecer mais de uma vez e um NPC pode compor encontros diferentes, inclusive com quantidades distintas. Remover uma rota não exclui o encontro; um encontro só pode ser excluído quando nenhuma rota o referencia. O mestre pesquisa NPCs oficiais da Wiki, inclusive variantes. A ficha escolhida preenche vida, mana, estamina, atributos, defesas e os dados das ações disponíveis. São selecionadas até três ações de ataque executáveis em D20, ordenáveis. O servidor resolve dano, recursos, munição, cooldown e modificadores a partir do snapshot da ficha e da versão publicada do Sistema, sem tabelas de dano manuais para NPCs.
- Um encontro aceita de um a quatro exemplares do NPC. Cada exemplar é um combatente independente, com recursos e turno próprios. A ordem fixa jogador/inimigos vale apenas quando a versão publicada não possui regra de iniciativa executável; com iniciativa configurada, a rolagem de todos define a ordem. A vitória exige derrotar todos. O NPC da Wiki não é modificado: a publicação congela seu snapshot e o combate usa as cópias da run.
- Inimigos manuais antigos permanecem compatíveis e ainda exigem configuração de dano por resultado. NPCs sem ação D20 com dano executável não podem ser publicados como encontros automáticos até receberem uma regra estruturada; descrição textual não é interpretada como ataque.
- A grade de inventário da run tem abas Itens, Próteses, Magias e Skills também nas versões antigas; nelas, a prioridade antiga de armas continua no lugar dos três slots da versão 0.4.x. Entrar em uma Base ou rota de descanso recupera vida, mana e estamina **somente nos valores definidos pelo descanso `SIMPLES` da versão fixada do Sistema**, limitados aos máximos da cópia da ficha. Assim, recuperação zero ou recurso já cheio não aumenta a barra.

## 30. Áreas, apresentação do mapa e combates sem limite jogável

- A área seguinte só é desenhada quando seu primeiro nó é desbloqueado pela conclusão do fim da área anterior. O fundo cadastrado cobre toda a largura e extensão da área, do início até a passagem para a próxima; imagens dos nós são independentes do fundo. Encontros usam o retrato circular do NPC, e Bases, descansos e eventos podem ter imagem própria.
- Cada área do schema 5 possui uma opção de fim: Base, uma rota específica do pool ou escolha aleatória entre a Base e as rotas cadastradas. A seed da run fixa a escolha. O tipo final não é imposto pelo jogo; Chefes podem aparecer também em áreas anteriores. Versões já publicadas preservam seu mapa salvo e comportamento anterior.
- `acerto: D20` ou `1D20` com `dano` positivo e tipo `ataque` em skills/magias antigas pode usar `ATAQUE_COMUM` da versão publicada do Odisseia quando não há especificação de teste explícita. Regras estruturadas continuam prioritárias; poderes sem dano executável não se tornam ataques automaticamente. `1D6` não vira D20: precisa de uma regra de ataque executável correspondente na versão publicada do Sistema.
- Não há limite de rodadas na regra jogável. Se uma batalha não progride ou alcança o orçamento técnico de eventos, compara-se a vida restante do jogador com a soma da vida restante dos inimigos; em igualdade, os inimigos vencem. A HUD não mostra a contagem de rodadas nem quantas ações faltam no replay.

## 31. Mapa expandido e rotas do schema 5

- A ordem das fases normais é editável por número no Gerenciamento e é preservada na lista publicada de áreas. Áreas secretas não entram nessa sequência; continuam acessíveis apenas por passagem. Não há exigência de Chefe no fim, nem de que toda rota passe por um Chefe. Runs existentes conservam a ordem da versão que fixaram.
- O mapa normal tem um início não interativo; cada área normal ou secreta acrescenta **3 a 24 nós jogáveis**, definidos no Gerenciamento, com **18 por padrão**. Com 18, preserva as oito camadas `2, 3, 2, 3, 2, 3, 2, 1`; outras quantidades ajustam as camadas. As ligações descem na vertical/diagonal; a última camada é a opção final configurada. Áreas normais seguintes só ficam visíveis após a conclusão do fim da anterior.
- Os nós anteriores ao final são sorteados pelos pesos do pool com reposição. Uma opção marcada **Único** sai do pool após ser sorteada; a Base implícita também é única. A publicação recusa pools incapazes de preencher os nós sem repetir uma opção única. Seed, versão e resultados do sorteio ficam fixos na run.
- `COMBATE`, `ELITE` e `BOSS` distinguem a apresentação e a intenção editorial, mas usam as mesmas regras de batalha e o encontro configurado. Não há bônus/dificuldade implícita pelo nome do tipo. Somente concluir o nó final da última área normal dá vitória, independentemente do tipo; Chefes intermediários não encerram a run.
- **Atalho** é um nó circular sem combate que ignora os nós restantes da área atual e libera diretamente seu nó final. **Caçada** é um nó circular cujo editor seleciona pelo menos dois encontros com múltipla seleção; a seed da run escolhe um deles, preservando a quantidade de inimigos do encontro. A imagem circular própria da Caçada esconde o NPC até a batalha.
- Uma **passagem secreta** é um nó retangular com imagem própria que aponta para uma área secreta configurada. Ao entrar, a run guarda o mapa principal e mostra apenas o mapa isolado da área secreta. Ao concluir seu nó final, restaura o mapa principal e conclui aquela passagem, liberando as conexões no mesmo ponto da jornada. Áreas secretas não entram na sequência normal e não podem conter outra passagem secreta. O histórico de combates da área secreta mantém os nomes dos nós após o retorno.

## 32. Consumíveis de recuperação na run

- As grades do inventário mostram a imagem quadrada como parte principal do card. O mesmo card é usado nas runs atuais e nas antigas.
- Itens da cópia da run com `tipo: "consumiveis"` e `atributos.restaura` podem recuperar vida, mana e/ou estamina pela ação **Usar consumível**. O servidor lê os valores do próprio item da run, limita a recuperação aos máximos registrados na ficha e só consome uma unidade se algum recurso for efetivamente recuperado. O uso fica indisponível durante um combate pendente.
- O comando de consumo exige ID estável do item, revisão e chave de idempotência. Ele atualiza apenas `EstadoAtualJson`, quantidade e revisão da run; nunca altera a ficha original ou o snapshot inicial. Ao acabar a última unidade, o item sai da cópia do inventário.
- Uma futura recompensa de missão ou loja deve acrescentar o item **à cópia do inventário da run**, com `id` de instância único, `tipo`, `quantidade` e `atributos.restaura` preservados. A obtenção precisa de seu próprio comando transacional e idempotente; esta camada implementa o consumo, não a distribuição de recompensas ou a loja.
- Base e passagem secreta usam moldura retangular. Os demais nós interativos do schema 5 são circulares. Mapas antigos mantêm suas formas e estados. Alterações só afetam runs novas criadas a partir de uma nova publicação; uma run existente não recebe o schema 5 automaticamente.

## 33. Iniciativa e seleção de alvos no combate

- O encontro oficial lê `UsaIniciativa` e `FormulaIniciativa` da versão publicada do Sistema fixada na run. Quando a fórmula é executável, cada participante rola seus próprios dados e soma seus atributos do snapshot; o log persistido contém fórmula, dados, modificador e total de cada um. A ordem decrescente decide os turnos; empates preservam a ordem original dos participantes. Sem fórmula configurada, o comportamento antigo mantém a ordem de entrada.
- Com mais de um inimigo, após selecionar a rota e antes de resolver o combate, a HUD pergunta se o jogador quer definir alvos. Recusar inicia a batalha imediatamente. Aceitar permite escolher um membro da equipe e depois um inimigo; uma linha conecta os cards e o hover destaca ambos. O servidor valida os IDs recebidos contra o encontro selecionado e inclui a escolha no comando idempotente. Ao eliminar o alvo preferido, a próxima ação procura o primeiro inimigo vivo na lista.
- O replay mantém o título da rota próximo ao conteúdo, ancorado ao topo; o resumo acrescenta altura apenas para baixo. A apresentação visual da iniciativa não substitui o resultado autoritativo do servidor.

## 34. Quantidade de golpes, tiros e rajadas no loadout

- O modo de disparo pertence ao snapshot da arma. `modoDisparo` explícito ou um único modo na especificação do teste prevalece. Em dados legados, custo exclusivo de rajada define `RAJADA`; sem isso, cadência igual ou superior a dez também indica rajada. Caso contrário, usa `TIRO`. O inventário da run não permite trocar o modo. Preferências antigas salvas no loadout não substituem a arma.
- Em `TIRO`, a cadência limita a quantidade de tiros por turno. Em `RAJADA`, a cadência informa quantas balas saem em **cada rajada** quando não há custo de munição por rajada explícito; não limita quantas rajadas cabem no turno. A quantidade pode ser limitada pelo carregador, pelos usos até a pausa, pela estamina, por limites específicos da arma e pelos limites opcionais por arquétipo na versão publicada do Sistema. Usos restantes persistem na cópia da run entre combates e são restaurados no descanso curto ou na Base. Sem limite adicional configurado, não inventar um teto de regras além do limite técnico de segurança. O modal mostra sempre o seletor, mesmo que o máximo atual seja um.
- Cada ação faz **uma rolagem**; o dano do resultado é multiplicado pela quantidade antes das defesas. O custo base de mana/estamina e a munição são consumidos pela quantidade, inclusive em erro. Em arma de fogo, o primeiro disparo não consome estamina; cada disparo adicional usa o maior entre o custo específico da arma e `estaminaPorAtaqueAdicional` do Sistema. Arcos pagam a estamina por uso da arma desde o primeiro disparo, além do adicional configurado a partir do segundo. A prévia do inventário informa dano base por rodada, munição e estamina, sem prometer dano efetivo após rolagem e defesas.
- Se restar munição para menos usos do que o jogador configurou, a ação usa a quantidade possível nessa vez; por exemplo, uma pistola com uma bala restante dispara uma vez. Sem munição suficiente sequer para um tiro ou uma rajada, a engine tenta as próximas ações disponíveis. Se nenhuma estiver executável, recarrega no turno atual em vez de usar o ataque de reserva. O log registra a quantidade efetivamente usada e o replay apresenta uma só ação com o dano total.
- O modal de configuração de uma ação equipada também abre pela engrenagem no slot, à esquerda de remover. O replay mostra discretamente a munição restante depois da rolagem ser revelada, inclusive nos erros. Tiros e rajadas gastam munição durante o encontro; todo encontro começa com o carregador cheio, mesmo quando a ficha original ou uma run antiga registra zero, sem consumir permanentemente a reserva do snapshot da run. O log salvo preserva os valores efetivos de cada disparo e recarga.
- A prévia da quantidade de ataques separa limites do Item, do Sistema e da estamina atual. O aviso de estamina apresenta os pontos atuais e o custo efetivo do primeiro uso para que um limite por recurso não seja confundido com uma restrição de golpes por turno.
- Na run, uma arma de fogo com capacidade de carregador positiva controla munição mesmo se uma ficha antiga deixou `controlaMunicao` falso pelo valor padrão do formulário. A inferência é feita só na cópia temporária da resolução, sem reescrever a ficha de origem. Quando a ficha não define reserva, há recarga disponível durante o encontro; uma reserva configurada explicitamente continua finita. A recarga consome turno e só ocorre quando as outras ações equipadas não estiverem executáveis, antes do ataque de reserva. O cálculo da quantidade permitida por estamina usa a mesma fórmula do custo exibido; limites do item e do Sistema são avisados separadamente, sem serem atribuídos à estamina.

## 35. Descanso médio da HUD

- O ícone de descanso consulta o descanso `NORMAL` da versão publicada do Sistema fixada na run, mostra a recuperação efetiva de vida, mana e estamina na cópia atual e pede confirmação. O cálculo é autoritativo, respeita os máximos do snapshot e não altera a ficha original. Descansos com fórmula não executável são recusados; a exigência de guarda do RPG de mesa é substituída nesta ação específica do minijogo pelo risco explícito do próximo encontro.
- A run permite um descanso médio no mapa principal e um em cada mapa secreto isolado. Uso, recuperação e ataque pendente são persistidos com revisão otimista e idempotência. Entrar ou sair de área secreta preserva esse estado; reiniciar a run o limpa.
- No primeiro combate oficial após descansar, **o primeiro inimigo** realiza um ataque extra antes da ordem normal. Só essa ação extra usa vantagem: duas rolagens e o maior resultado, conforme o avaliador de dados; custos e dano usam a ação real desse inimigo. Em seguida a iniciativa normal prossegue, inclusive se o mesmo inimigo agir de novo. O treino livre não consome o efeito. Ao resolver o combate, o efeito pendente é removido atomicamente.

## 36. Primeira fatia de progressão: XP por vitória

- O Gerenciamento define `xpReward` em cada encontro, entre 0 e 1.000.000. O valor é publicado junto com o modo e fixado na run; versões anteriores sem o campo concedem zero. Caçada usa o encontro efetivamente sorteado, não o rótulo oculto da rota.
- O XP é aplicado ao campo `status.xp` da cópia atual da ficha **somente se o jogador vencer**. A alteração do estado, o resultado salvo, a revisão e o comando idempotente pertencem à mesma resolução. Derrota, treino, repetição de comando e revisão de combate antigo não concedem XP. O snapshot inicial e a ficha original não mudam.
- O resultado persistido da batalha traz `xpConcedido`. O replay mostra o ganho apenas após sua conclusão; em 2×, o retorno automático espera brevemente para permitir leitura. O HUD usa o XP atualizado ao retornar ao mapa e mostra um resumo compacto de combates/XP quando a run termina. Não existe clique adicional para aplicar esse XP. Esse resumo não substitui a futura tela detalhada de resultados e recompensas.
- A camada seguinte passou a subir o nível e creditar os pontos estruturados da versão publicada do Sistema na cópia da run (seção 38). Distribuição dos pontos, escolhas de habilidades e recompensas materiais continuam futuras. Não inferir a evolução de descrições livres nem modificar a ficha de origem.

## 37. Gerenciamento de Bases e catálogo visual de encontros

- O gerenciamento separa Ataque, Áreas e rotas, Bases e Personagens em abas, sem alterar o rascunho ao alternar entre elas. Na aba Bases, `baseRestType` é salvo por área normal ou secreta. As opções vêm dos descansos da versão publicada do Sistema escolhida no editor; o backend valida o tipo no salvamento e na publicação. A Base segura dispensa guarda, mas aplica os valores e limites reais do Sistema. Runs existentes sem o campo e nós `DESCANSO` continuam usando `base.restType` da versão já fixada.
- A aba Personagens apresenta um card por encontro, com retrato e recursos da cópia usada no jogo. A busca por NPC/variante da Wiki cria um encontro preenchido; o mesmo NPC pode formar encontros diferentes. O card `+` cria um inimigo manual exclusivo do jogo, com upload de retrato pelo serviço de assets. A engrenagem abre o formulário existente em modal, preservando seleção e ordem das ações, dano por resultado, quantidade, XP, exclusão e referências das rotas. A indicação luminosa da engrenagem encerra na primeira configuração; encontros antigos são considerados já configurados.
- Uma versão publicada permanece somente para leitura, e qualquer mudança exige novo rascunho e publicação. Nenhuma edição de encontro ou descanso altera a ficha original do NPC ou uma run em andamento.

## 38. Subida de nível e apresentação do XP

- Ao vencer um encontro com XP positivo, a mesma resolução autoritativa compara o XP da cópia da run com `xpParaProximoNivel` da linha do nível atual na versão publicada do Sistema fixada na run. A subida só ocorre se o módulo de Progressão estiver habilitado e houver linhas estruturadas para o nível atual e o próximo; nenhum custo padrão do frontend vira regra do jogo.
- Ao alcançar o próximo nível, credita `pontosNivel`, `pontosAtributo`, `pontosSkill` e `pontosUltimate` da linha alcançada nos respectivos campos da cópia da run. `nivelMaximo` e `permiteXpExcedente` controlam o teto e a sobra: com excedente permitido, um ganho pode atravessar vários níveis; sem ele, a sobra é descartada ao subir. A batalha salva os níveis alcançados no resultado, junto do XP, para um replay fiel sem recalcular as regras após outra publicação.
- Direitos de nova magia/skill e marcos da linha alcançada são registrados em `status.evolucoesPendentes` para não serem perdidos. Eles **não** são aplicados por leitura de observações livres. Gastar pontos, escolher atributos/poderes e resolver marcos ainda requer interface e contrato executável; esta camada não altera máximos de vida/mana/estamina nem a ficha original.
- Após revelar o resultado, o replay conta o XP ganho com brilho dourado que volta à cor normal e exibe o nível alcançado. Ao retornar ao mapa, o XP do HUD recebe um brilho breve; em 2×, o retorno automático aguarda a animação. Treino, derrota e reabertura de histórico não concedem XP novamente.

## 39. Evolução de atributos e loot de combate

- O Sistema publicado configura `dadoLootFaces` no módulo de Progressão (D4, D6, D8, D10, D12 ou D20). Sem esse dado, não se pode publicar encontro com loot. O editor do jogo configura, por encontro, a quantidade de itens entregues por vitória e a pool de itens/próteses oficiais com pesos positivos. Cada item é congelado na versão publicada do modo, incluindo dados necessários a consumo/equipamento; editar o catálogo posteriormente não altera a recompensa de uma run existente. A raridade operacional é o peso: o menor peso é o mais raro. Não inferir probabilidade de campos textuais de raridade.
- O editor oferece somente personagens e itens da Wiki oficial com `Visivel=true`, inclusive para administradores. O servidor reaplica essa restrição ao salvar/publicar o modo: referências ocultadas depois de selecionadas precisam ser substituídas ou removidas. Isso não altera snapshots de runs já iniciadas.
- Ao publicar nova versão do Sistema, o gerenciamento permite clonar um jogo de versão arquivada para **novo rascunho da versão atual**, sem sobrescrever o jogo anterior. A migração conserva áreas, encontros e configurações próprias; reconcilia códigos de resultado de ataque com a versão de destino e escolhe um descanso executável quando o tipo antigo deixou de existir. NPCs, ações e loot continuam sujeitos à revalidação da versão de destino antes da publicação. Runs existentes preservam suas duas versões fixadas.
- Ao vencer, o servidor salva o combate e deixa o loot **pendente** no snapshot da run, sem sorteá-lo antecipadamente. O replay termina, aguarda dois segundos e mostra a rolagem. Em 1×, o jogador lança manualmente o mesmo dado 3D utilizado na Mesa, em uma arena contida no desktop ou na tela inteira do mobile. Em 2×, o lançamento começa automaticamente. O resultado do dado é gerado pelo servidor somente no lançamento real. Na metade inferior, os pesos publicados ficam iguais; na metade superior, **todas** as entradas de peso mínimo têm peso dobrado. O servidor sorteia cada unidade da recompensa independentemente a partir desses pesos efetivos, registra resultado e itens no snapshot e dá a cada cópia ID próprio e origem estável. A tela revela os cards e permite examiná-los antes de continuar. Não alterar a ficha original.
- Não se pode iniciar outra rota com loot pendente. Revelar usa revisão otimista e chave de idempotência; resposta perdida pode ser consultada/repetida sem novo sorteio ou entrega duplicada. Derrota, treino e replay do histórico não geram loot. A run encerrada em vitória ainda permite revelar sua recompensa final. Runs fixadas antes da configuração do loot mantêm seus encontros antigos sem prêmio inventado.
- O HUD mostra um ícone dourado de evolução pulsante junto ao XP quando há pontos utilizáveis. Ele abre, por escolha do jogador, um modal de atributos principais e secundários. Cada atributo aparece em hexágono com sigla e valor; o mesmo ícone dourado oferece a evolução enquanto ela for permitida. O botão de informação abre um popover dispensável ao clicar fora, contendo nome, limite publicado, descrição e prévia dos efeitos estruturados. O comando gasta um ponto, aumenta **um** atributo em +1, registra a escolha e atualiza apenas a cópia da run, com revisão/idempotência. Não há evolução automática por mera subida de nível.
- O Sistema configura opcionalmente `influenciasAtributos`: código do atributo, recurso (`vida`, `mana`, `estamina`) e percentual por valor, validado contra os atributos publicados. Ao investir um ponto, o máximo atual daquele recurso ganha `piso(máximo anterior × percentual × novo valor do atributo / 100)`. Por exemplo, Sabedoria 2→3 com 10% concede +30% sobre o máximo anterior de mana. O recurso corrente não é preenchido. Sem influência estruturada, não inventar crescimento de recurso; o atributo continua disponível para testes que o especificam. Essa semântica é própria da regra configurável e deve ser mantida consistente na prévia e na aplicação autoritativa.
- O provisionamento de **novos** Sistemas Odisseia sugere Resistência→Vida, Agilidade→Estamina e Sabedoria→Mana a 10% por valor. Isso não reescreve versões publicadas existentes: para elas, o mestre precisa configurar/publicar a influência e iniciar uma nova run que fixe essa versão. A resolução do combate lê os atributos da cópia atual da run; códigos da ficha com ou sem acento são equivalentes ao código publicado.
- Os pontos iniciais são configurados no módulo de Criação do Sistema, não no jogo. Ao iniciar uma run, uma ficha com soma de atributos principais e secundários diferente de **1** já é considerada distribuída: seus saldos de criação não são reutilizados na run. Uma ficha com exatamente o único ponto racial mantém esses saldos para escolher. Pontos gerais e de atributo concedidos após subir níveis na run continuam disponíveis; em runs antigas, sem marcador de origem, somente pontos de nível explicitamente rastreados na run são aceitos para não inventar uma distribuição inicial nova. Pontos gerais da progressão podem ser utilizados para atributos quando não houver `pontosAtributo`; pontos próprios de skill/ultimate não são consumidos por esse modal. Direitos pendentes de magia, skill e marcos continuam intactos para a camada seguinte. Loja, moeda, stash e transferência do loot à ficha original permanecem fora desta entrega.

## 40. Inventário completo, valor de itens e apresentação das recompensas

- A capacidade de carga considera **todos os itens carregados** na cópia do inventário da run, multiplicando peso por quantidade; equipar ou desequipar não muda o peso. O servidor reconcilia a carga na criação da run e após combate, consumo, loot, evolução, alteração de loadout e descarte. Ao exceder a capacidade, aplica a condição estruturada `PESADO` da **versão publicada do Sistema fixada na run**, se ela configurar `EXCESSO_CARGA` e redução percentual da estamina máxima. Não há percentual fixo no jogo. Reduzir a carga restaura o máximo anterior, mas não recupera automaticamente a estamina corrente.
- **Deixar item** remove a instância inteira somente da cópia da run, com revisão otimista, chave de idempotência e remoção automática do loadout. A ficha original e o catálogo permanecem intactos. A interface exige confirmação por se tratar de perda permanente naquela run.
- `valor` é uma propriedade numérica opcional e não negativa do item de catálogo; o formulário da Wiki oficial e da Wiki da Mesa a edita. A ficha do jogador e do NPC também pode substituir o valor da sua cópia no modal de atributos do item. O snapshot do loot publicado congela esse valor e a recompensa o preserva no inventário da run.
- A configuração geral do modo inclui `saleDiscountPercent`, inteiro entre 0 e 100. O preço futuro de venda é `valor × (100 − desconto) / 100`; a compra, venda e moeda ainda **não** foram implementadas. O percentual é versionado com o modo e não altera runs já iniciadas.
- O combate corrente não permite **Rever** nem **Próxima** durante sua primeira reprodução; ambas são ações do histórico. Ao terminar, a interface consulta a run persistida antes de decidir se há loot pendente. Quando há, encerra a apresentação do combate e abre o modal do loot após dois segundos. Em 1×, primeiro mostra o modal para o jogador iniciar a rolagem; em 2×, lança automaticamente. O loot configurado só vale para novas runs iniciadas após a publicação do modo, pois encontros de runs antigas seguem a versão que fixaram ao iniciar.
- Adicionar o primeiro item à pool de loot define automaticamente uma recompensa por vitória. Remover o último zera essa quantidade. A publicação rejeita uma pool preenchida com quantidade zero, para não apresentar um encontro aparentemente configurado que nunca entrega loot.

## 41. Apresentação da run e Base opcional

- Cada área nova usa Base por padrão, mas o editor pode desmarcar `useBase`. Nesse caso a Base sai do sorteio e das opções de fim, e a área ainda precisa ter um fim de rota válido. Versões antigas sem o campo continuam com Base; runs existentes preservam o modo publicado que fixaram.
- Armas, magias, skills e próteses mantêm cards individuais. Cópias do mesmo consumível, com mesma origem e efeitos, aparecem em um único card com quantidade total. O jogador escolhe de 1 a 100 unidades para usar numa operação; o servidor aplica a recuperação acumulada até os máximos publicados, desconta as unidades da cópia da run e preserva revisão e idempotência.
- O replay só anima o impacto do card quando o efeito correspondente é revelado. O fundo do combate tem camada escura independente do retrato da área. O loading de rota é apresentado sem moldura e o aviso da mochila pulsa durante seu período de atenção.

## 42. Equipamentos defensivos e rotas secretas encadeadas

- O inventário da run apresenta três regiões responsivas: catálogo em abas, ordem de até cinco ações com descanso bônus e equipamentos defensivos. Trajes, itens do tipo `outro` com defesa e próteses defensivas equipados aparecem na terceira região, sem consumir slot de ataque. Remover é imediato; não há comando público de ajuste manual da proteção. O servidor preserva a proteção original como teto e registra a proteção restante após cada impacto. Ao entrar em uma Base, restaura a proteção dos itens carregados (equipados ou não) apenas se a versão publicada do modo tiver `repairProtectionAtBase` ativo, valor verdadeiro por padrão; a defesa agregada da run aumenta somente pela proteção restaurada dos itens equipados. O descanso médio não conserta. Nenhuma dessas ações restaura o escudo.
- `escudo`, `protecao` e `armadura` são defesas distintas do item, inclusive para o tipo `outro`; equipar, retirar e sofrer dano atualizam o estado da run e o combate, sem modificar a ficha original. Escudo é gasto no primeiro impacto, proteção é consumível e armadura reduz dano conforme a regra publicada. O inventário, HUD e replay devem refletir esses valores sem recalcular eventos passados a partir do catálogo atual.
- Uma passagem secreta pode abrir outra área secreta já cadastrada, formando uma cadeia ou rota secundária. Cada mapa secreto conserva a referência ao mapa que o chamou; ao concluir uma área comum, retorna ao mapa anterior, inclusive se esse mapa também for secreto. O editor permite marcar uma área secreta como **final alternativo**; concluí-la encerra a run em vitória, sem voltar à rota principal. A publicação rejeita ciclos entre áreas secretas e a run mantém snapshots e versões já fixados. Base continua opcional em cada área.
- Estas decisões substituem a premissa antiga de que toda passagem secreta volta diretamente ao mapa principal e a de que só o último nó de uma área normal pode encerrar a run. Não transformam a economia, a loja, direitos de skill/magia ou eventos narrativos em funcionalidades prontas.

## 43. Catálogo de skills e ultimates do modo (próxima concepção, não executável ainda)

- O dono do jogo terá uma guia própria no Gerenciamento para cadastrar **skills e ultimates pré-feitas** como opções do modo, em vez de fazer o jogador criar um poder ao subir de nível. Esse catálogo pertence ao rascunho versionado do modo; publicação congela identificador, tipo, nome, apresentação, requisitos e o snapshot necessário para futuras escolhas. Nova publicação não altera opções já fixadas por uma run. A interface de autoria deve seguir os componentes e padrões do Gerenciamento, inclusive no mobile.
- A primeira fatia dessa guia pode organizar e publicar opções como **conteúdo**, sem colocá-las no combate nem declarar efeitos automáticos. Seu cadastro não consome pontos e não deve permitir ao jogador escolher algo apenas porque existe uma descrição. A modelagem de poderes executáveis vem depois: contrato de custo, alvo, teste/dado, dano/cura/condição, duração, cooldown, prioridade, restrições, evolução e interação com regras publicadas do Sistema. Nenhum efeito nasce da interpretação de Rich Text.
- Quando houver contratos validados, o direito de aprender uma skill ao evoluir ou de escolher uma ultimate no marco correspondente abrirá uma seleção curta das opções pré-feitas elegíveis naquela versão da run. O servidor verifica direito pendente, limite e pré-requisitos da versão do Sistema, aplica a escolha à **cópia da run** com revisão/idempotência, desconta o direito uma vez e mantém a ficha original intacta. Ações escolhidas só entram no loadout se tiverem regra executável; o limite de cinco ações mais descanso continua independente dos pontos de progressão.
- Magias que o personagem já possuía e têm teste D20 e dano executável podem ser equipadas e usadas no combate. O direito de **aprender uma magia nova** em certos marcos é diferente desse uso: a escolha/concessão de novos poderes e os demais marcos continuam pendentes até terem catálogo e contrato apropriados. Não presumir que uma magia é uma skill ou uma ultimate. Durante a transição, preservar `status.evolucoesPendentes`, `pontosSkill` e `pontosUltimate` para compatibilidade, sem conceder poder fictício ou bloquear a continuação da run. O primeiro marco de produção da seção 0.10 pode anteceder essa camada somente com a expectativa comunicada e o conteúdo publicado compatível.
