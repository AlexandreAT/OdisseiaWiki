# Revisão das alterações acumuladas na main — 27/10/2026

## Escopo e conclusão

Revisão do diff desde `9a258cd3`, incluindo arquivos novos ainda não rastreados: imagens/logs e treino; replay/holograma e mapa; inventário/próteses/atributos; compra/venda múltipla e conserto do Engenheiro; catálogo versionado/compatibilidade de trajes; header, vitória e componentes compartilhados de formulário/checkbox/loading. Não houve commit, push, acesso à produção nem alteração do banco de desenvolvimento.

O minijogo não é um interpretador universal de RPG. Jogos de Mesa usam o contexto e a versão do Sistema, mas precisam dos contratos executáveis suportados. Hoje a criação exige `ATAQUE_COMUM` em `1D20`; descrições livres não executam regras. Ataques de outros dados, tipos de dano/quebra de armadura e novas skills/ultimates por marcos não estão automaticamente implementados. Ver limites e próxima branch na seção 0 do plano.

**Lacuna para a autonomia completa dos mestres:** criar/editar/duplicar/publicar Sistemas ainda exige a política Admin em `SistemasRpgController` e `SistemasRpgItensController`. O mestre gerencia jogos e conteúdo da própria Mesa, usando Sistemas publicados disponíveis; isso não lhe dá um editor de Sistema privado. Para oferecer essa autonomia, será preciso definir propriedade/escopo e cópias/versionamento de Sistemas, autorizar o dono e proteger os oficiais. Não remover a política Admin das rotas globais como atalho. Essa ampliação exige decisão explícita de escopo; não foi implementada nesta revisão.

## Correções encontradas nesta revisão

1. **Venda recusada:** resolução de preços antigos agora prepara uma variável local e só atribui o resultado à run depois de validar a venda inteira e seus efeitos. Uma linha inválida não deixa saldo, itens, loadout, revisão ou preço parcialmente alterados, mesmo em memória. Regressão automatizada cobre preenchimento de preço seguido de lote inválido.
2. **Subcategorias inativas:** desativar todos os arquétipos, a categoria ou o tipo Traje não transforma regras explícitas em catálogo legado irrestrito. Metadados de leitura preservam a informação das regras e dos códigos conhecidos quando a árvore pública omite inativos. Um código personalizado desativado também não pode voltar a funcionar como alias antigo de outro arquétipo. Cliente e servidor validam; versões sem regras continuam legadas.
3. **Catálogo durante o salvamento:** os campos, seletores e ações de edição ficam bloqueados enquanto a resposta está pendente, evitando que a resposta sobrescreva alterações digitadas nesse intervalo. Ajudas continuam acessíveis. Uma resposta de carregamento cancelado é ignorada.
4. **Consulta de atributos:** metadados ilegíveis de uma prótese antiga não derrubam toda a tela de evolução. Apenas a explicação que não pode ser lida é omitida; os bônus registrados e os pontos não são reescritos. Isso não torna um item inválido executável.
5. **Ferramenta de integração:** cada execução do ensaio MySQL compila em diretório temporário próprio, sem disputar os arquivos de build com Visual Studio ou outra execução.

## Isolamento conferido

- A criação parte de personagem pessoal do usuário e serializa status, itens, próteses e poderes em snapshots independentes. Instâncias de NPC de uma Mesa não são fichas pessoais selecionáveis.
- O jogo fixa as versões publicadas do modo e Sistema. Compra, ensino, equipamento, evolução, combate, venda e reparo escrevem na run; não chamam edição da ficha, do Sistema ou da Wiki de origem.
- Catálogos de uma Mesa combinam oficiais compatíveis e suas entradas próprias. Uma cópia `IdOrigemGlobal` substitui o original nesse contexto; entradas de outra Mesa não são selecionadas. Conteúdo invisível e referências incompatíveis são recusados.
- Os dados de NPCs/ofertas são congelados na publicação; não se confia no snapshot de item enviado pelo navegador. Novas publicações não reescrevem a configuração da run existente.
- Autoria do mestre e propriedade da run são validadas no servidor. Revisão, chave idempotente e transação com lock por usuário protegem mutações concorrentes.
- A única persistência deliberada entre runs fica na memória própria do personagem: vitórias, resgates e depósito protegido, com seus escopos de jogo/Sistema/versão. Ela não é transferência para a ficha real; exclusão do personagem remove sua memória.
- Compatibilidade estrutural não equivale a executar todo conteúdo da Wiki. Itens/ações precisam ter regras estruturadas compatíveis com a versão fixada. Não prometer funcionamento de toda combinação possível de Sistemas criados por usuários.

## Evidências automatizadas

Os testes de banco são opt-in: o retorno antecipado deles na suíte comum não vale como execução real.

- Frontend: `node --test tests/*.test.mjs` — 301 testes aprovados.
- Build: `npm run build` — aprovado, incluindo TypeScript. Permanecem avisos de tamanho de chunks e anotações de dependência SignalR.
- Lint: 78 arquivos TypeScript alterados/novos aprovados. `tableColumnsConfig.tsx`, alterado somente na largura dos modais, mantém a dívida anterior de `any`/Fast Refresh; não declarar lint global limpo.
- Backend: 802 testes aprovados na suíte comum, incluindo SQL da migration e modelo EF; casos de versões/imutabilidade, condições, limites, equipamento, saldo e revisões. Os 18 casos opt-in de banco retornam sem conexão nessa execução.
- MySQL: suíte inicial com 17 casos reais aprovados; depois 3 casos direcionados aprovados (dois reforçados e um novo), totalizando 18 cenários distintos. `scripts/Test-RoguelikeMySql.ps1` cria servidor Docker e bancos com nomes aleatórios, sem volumes nem credenciais de desenvolvimento/produção; ambos os contêineres criados foram removidos ao terminar. Cobertura inclui migrations limpas/incrementais, treino com histórico grande, memória/exclusão, autorização e comandos concorrentes. O reforço exercita reparo + venda múltipla no Engenheiro e conteúdo oficial/próprio/derivado em duas Mesas e Sistema personalizado.

Não foi executado percurso visual autenticado completo no navegador nem carga com muitos usuários simultâneos. Testes de componentes e concorrência controlada não são essa garantia.

## Teste simples antes de publicar

1. Reinicie a API com a migration aplicada. Em um **rascunho** do Sistema, configure Colete + Outros compatíveis e Traje Completo sozinho; publique uma versão e inicie run nova. Colete + Outros deve equipar; Colete + Traje Completo deve explicar o conflito sem trocar o equipamento. Repita com uma subcategoria desativada. Uma run antiga deve continuar com suas regras anteriores.
2. No catálogo, altere um campo e salve; durante a espera, campos e “Novo tipo” devem ficar indisponíveis, voltando depois. A ajuda “I” continua funcionando. Reabra para conferir o valor salvo.
3. Em Engenheiro, conserte uma defesa gasta e confira preço e saldo; selecione duas pilhas para vender, confira quantidades/total e dê F5. Não pode cobrar, creditar ou remover duas vezes. Testes automatizados cobrem a venda inválida e os cliques simultâneos.
4. Faça um combate/treino e abra o histórico: imagens e hologramas, dano/condições, XP/atributos e vitória devem continuar funcionando. Em mobile/desktop, confira mapa, header recolhido após F5, holograma, loot e scroll da vitória com neon ligado/desligado. Na Wiki/ficha, confira checkbox/loading e os modais ampliados.
5. Em uma Mesa de teste com Sistema personalizado compatível, use item/NPC oficial, conteúdo próprio e uma cópia derivada da Wiki. Outra Mesa não deve aparecer nesse catálogo. Compare ficha, conteúdo e Sistema antes/depois da run: não devem mudar. Apenas memória do jogo e itens protegidos devem persistir conforme configurado.

## Migration e publicação

Há a migration aditiva `20261027190000_AddOutfitCompatibility`: uma coluna JSON anulável, sem reescrever itens ou regras de versões antigas. Código cliente e API devem ser publicados juntos.

O mecanismo automático existe, mas é condicionado a `Database__ApplyMigrationsOnStartup=true`. Confirmar a variável no deploy, aguardar `/health/ready` e conferir a migration aplicada; o seeder não precisa ser reativado para esta coluna. Não afirmar que a variável está habilitada na produção sem consultar seu ambiente. Seguir [DEPLOYMENT.md](DEPLOYMENT.md); não executar `Down` para reverter código.

## Próximo passo

Depois do aceite e commit da main, criar `feature/roguelike-events-missions-campaign`. Fechar nela eventos/efeitos/recompensas e surpresa; missões/submapas; integração e regressão de campanha. Pode ser uma única branch com camadas testáveis. As expansões explicitamente adiadas no plano não entram silenciosamente nesse compromisso.

Se a meta de “finalizado” também exigir que todo mestre edite/publique um Sistema privado, aprovar e incluir esse escopo antes de começar a próxima branch. Sem ele, o restante do roguelike pode ser concluído, mas essa autonomia específica ainda não estará entregue.
