# Primeiro lançamento do roguelike — aceite e reversão

Este checklist organiza os cuidados do primeiro deploy; um ambiente de homologação separado é recomendado, mas não obrigatório. Loja, missões e skills/ultimates executáveis não bloqueiam a primeira versão se o conteúdo publicado não depender delas. O responsável optou por não fazer backup neste momento: isso não bloqueia o deploy, mas uma falha que afete o banco poderá não ser reversível. A conferência do site após o deploy continua necessária.

## Estado verificado localmente

- Build de produção do cliente e geração do SQL idempotente das migrations concluíram sem erro (script EF gerado em memória, sem aplicar mudanças ao banco).
- Testes de domínio cobrem revisão/idempotência de comandos, entrega única de loot, proteção na Base ligada/desligada, escudo não restaurado, e montagem de magia ofensiva D20 no loadout do jogador.
- Em 15/10/2026, **8 testes de integração passaram juntos** em MySQL 8.0 descartável no Docker local, cobrindo migrations limpas e incrementais desde um banco com Mesa e personagem existentes no schema anterior à run. O teste `GameRun_LootClaimIsAtomicIdempotentAndOwnerScoped` validou a operação real de loot: duas chamadas simultâneas com a mesma chave entregam apenas uma cópia, persistem uma revisão e não permitem acesso por outro usuário. A suíte comum passou com 407 testes (os opt-in retornam sem acessar banco quando desativados) e o build do cliente passou. Para reproduzir com Docker no Windows, execute `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/Test-RoguelikeMySql.ps1` na raiz do repositório; o script cria e remove seu próprio contêiner. Os testes também aceitam `RUN_GAMEPLAY_MARIADB_TESTS=1` e `ODISSEIA_TEST_MYSQL_CONNECTION` para um servidor de teste descartável com permissão de criar/remover bancos temporários. Nunca usar credenciais de produção.
- Em 16/10/2026, a nova branch acrescentou testes dos serviços reais de loadout e encerramento de rota: **10 testes de integração passaram juntos** no MySQL descartável, incluindo chave repetida, concorrência, revisão e isolamento por usuário. A suíte comum passou com 410 testes e o build do cliente e lint direcionado passaram.
- O modo publica `repairProtectionAtBase` (padrão ligado). A versão fixada na run decide; não há API nem botão de conserto manual. O descanso médio não conserta. O escudo requer efeito novo.
- A vitória tem tela animada após replay e loot; totais de itens novos são persistidos no snapshot da run. Runs antigas, criadas antes do contador, podem mostrar zero itens ganhos mesmo tendo itens anteriores.

## Aceite antes e durante a publicação

1. Para ensaios destrutivos, usar banco MySQL **descartável ou cópia anonimizada**, nunca a produção. Os testes locais já cobrem migrations limpas e incrementais desde o schema pré-run; antes do deploy, conferir as migrations pendentes no banco publicado. Backup é recomendado, mas foi dispensado pelo responsável nesta publicação. Testar também uma run antiga após publicar versão nova do modo e do Sistema.
2. Em desktop e mobile real, concluir uma run com cinco ações e descanso, magia ofensiva equipada, múltiplos NPCs, Base com conserto ligado/desligado, escudo gasto, XP/atributos, loot final, consumível, derrota, vitória, secreta encadeada e final alternativo. Conferir tela de parabéns, contador de itens, replay 1×/2×, F5 durante combate/loot pendente e retorno após reconexão. Confirmar que a ficha original não muda.
3. Fazer duas requisições simultâneas com a **mesma** chave de idempotência para loot, loadout e fim de rota: uma mutação, mesma resposta. Repetir com chaves diferentes e mesma revisão: uma deve vencer, outra deve receber conflito/revisão obsoleta ou run encerrada. Testar usuário diferente: não pode ler/mutar a run. Esses cenários agora possuem cobertura em MySQL descartável.
4. Conferir no site publicado assets e rotas `/api`, autenticação, logs sem dados sensíveis e comportamento no navegador mobile. Não é preciso criar outro proxy ou site apenas para esta conferência.
5. Conteúdo inicial: somente ações com regra executável. Magias ofensivas D20/dano estruturado já podem ser equipadas; a escolha de **novas** skills/ultimates ao subir nível ainda é futura. Direitos pendentes ficam guardados e devem ser comunicados, sem simular poder funcional.

## Publicação e reversão

1. Congelar commit e versões de cliente/API. Se optar por backup, verificar sua restauração em ambiente isolado. Sem backup, reconhecer que pode não ser possível recuperar dados afetados por uma falha. Registrar contagem de runs, comandos e versões de modo antes da mudança.
2. Gerar e revisar o SQL idempotente com `dotnet ef migrations script --idempotent --context OdisseiaContext --project OdisseiaWiki/OdisseiaWiki.csproj --startup-project OdisseiaWiki/OdisseiaWiki.csproj`. Se houver homologação, aplicar e conferir lá primeiro. Em seguida, aplicar em produção numa janela controlada conforme o procedimento de [DEPLOYMENT.md](DEPLOYMENT.md).
3. Subir API e cliente da **mesma revisão**, executar smoke test autenticado, observar erros e estado das runs, e abrir primeiro a um grupo reduzido apenas se houver controle de acesso explícito.
4. Se o código precisar voltar, reimplantar a versão anterior da API/cliente compatível com o esquema novo e **manter as migrations aditivas**. Não executar `Down` nem restaurar backup sobre runs criadas depois da migração: isso perderia progresso. Se não houver compatibilidade, fechar novas escritas, preservar/exportar as runs novas e planejar restauração assistida antes de qualquer reversão do banco.

**Estado atual:** o responsável informou que a primeira versão foi publicada na `main`, sem backup por decisão própria. Os testes locais de concorrência de loot, loadout e fim de rota passaram posteriormente na nova branch; isso não substitui a conferência visual do fluxo no mobile nem confirma um smoke test da revisão efetivamente servida. Não há ambiente de homologação separado, e sua criação não é pré-requisito obrigatório.

## Nova camada: jogos por Mesa

- A migração `20261016120000_AddScopedGameModes` é aditiva. Um teste em MySQL descartável aplicou todas as migrations, persistiu jogos globais e de Mesa e confirmou que a cópia visível de um item da Mesa substitui o original na seleção de loot. Não foi aplicada ao banco do site.
- Conferir com duas Mesas distintas: mestre A pode criar/publicar apenas na A, mestre B apenas na B, administrador em ambas; nenhum deles pode editar o original global ao alterar uma cópia. Conteúdo oculto e referências da outra Mesa devem ser recusados no editor.
- Na seleção do personagem, verificar um jogo (início direto), vários jogos (modal com três cards por linha no desktop), nenhum jogo publicado (aviso), e atualização da Mesa para outra versão do Sistema (adaptação para rascunho novo sem alterar runs antigas).
