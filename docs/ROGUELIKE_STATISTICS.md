# Estatísticas de runs — base para as telas futuras

As runs já são persistidas em `gameruns`, com usuário, personagem de origem, resultado e snapshots. Esse registro é a fonte das estatísticas, sem uma segunda contagem que possa divergir. Não há migration, backfill manual nem mudança da ficha real. Runs antigas entram automaticamente.

## Contagem

- `total`: todas as runs criadas, incluindo a ativa.
- `vencidas`: resultado `Vitoria`.
- `perdidas`: derrotas + abandonos, também expostos separadamente em `derrotas` e `abandonadas`.
- `emAndamento`: resultado `Ativa`.
- `encerradas`: vencidas + perdidas. Assim, `total = encerradas + emAndamento`.

Reiniciar uma run ativa encerra a anterior como abandono e cria outra; reiniciar uma run já encerrada não conta seu resultado novamente. F5, retry e consulta não incrementam contadores. Treinos não criam runs ou batalhas persistidas e não entram nas estatísticas.

O histórico de runs já não tem dependência da ficha atual: excluir um personagem remove sua memória/depósito, mas não apaga suas runs e estatísticas históricas. Excluir o usuário elimina as runs por cascade. Não eliminar registros históricos de `gameruns` em uma futura rotina de limpeza sem preservar antes esse histórico.

## Consultas autenticadas

- `GET /api/game-runs/statistics`: contadores gerais e agrupamento por personagem.
- `GET /api/game-runs/statistics?characterId=42`: os mesmos contadores filtrados por personagem.
- `GET /api/game-runs/statistics/victories?characterId=42&limit=10&before=123`: resumos de vitórias; filtros opcionais, `limit` entre 1 e 25, cursor por ID de run decrescente. `proximoCursor: null` indica fim da lista.

O usuário vem exclusivamente da autenticação. Filtro sem runs próprias retorna contadores zerados/lista vazia, sem informar se existe um personagem de outra pessoa. A lista de personagens agrega somente quem já iniciou alguma run; a tela futura pode combinar isso com o catálogo de personagens para mostrar os demais com zero.

Derrotas e abandonos são consultados apenas para contagem, sem carregar/publicar seus snapshots ou replays nessas consultas. Os registros antigos continuam disponíveis nos fluxos existentes do jogo; esta implementação não apaga históricos.

## Dados das vitórias

Identidade do personagem na run, jogo e versões, seed, início/fim e duração decorrido de calendário, nível final, fases e nós concluídos, missões concluídas, combates, inimigos e quantidades, XP conquistado, itens obtidos, moedas em combate, saldo de eventos/missões, saldo final e resumo dos itens protegidos ao terminar.

O resumo usa snapshots salvos da run e dados compactos das batalhas. Não recalcula com o Sistema, ficha ou catálogo atual. XP/loot usam os acumuladores salvos com fallback para dados antigos; transferir um item entre mochila e depósito não é ganho de item. O resumo do depósito usa `protectedDepositAtEnd`, não o depósito atual de outra run. Se um registro antigo não possui esse campo, não se inventa um depósito histórico. A última rolagem de loot pode completar seus totais depois da vitória, pelo fluxo já idempotente do jogo.

Paginação ordena IDs antes de carregar snapshots, e as batalhas são projetadas com `JSON_EXTRACT` sem ler seus eventos/replays completos, evitando ordenação de JSON grande no MySQL. Consultas são read-only e isoladas por usuário em todas as etapas.

## Próximas telas

1. Painel geral do usuário: contadores, personagens e vitórias paginadas.
2. Resumo por personagem, reutilizando os mesmos serviços com `characterId`.
3. Detalhes de uma vitória podem reutilizar `GET /api/game-runs/{id}` e o histórico de combate existentes, ambos com autorização.

Contratos e chamadas tipadas estão em `GameRunStatistics.ts` e `gameRunService.ts`. Nenhuma tela nova foi adicionada nesta etapa.

## Conferência simples após reiniciar a API

Nas consultas autenticadas pelo Swagger/cliente, conferir os totais antes/depois de vencer, perder e abandonar. Repetir consulta/F5 não deve mudar os totais. Uma run nova só aumenta `total` e `emAndamento`; encerrar troca a ativa pelo resultado. Filtrar por personagem deve bater com o agrupamento geral. Com outra conta, nenhum resultado da primeira deve aparecer.

Testes automatizados cobrem os contadores, paginação, snapshots, legado e autorização. A integração MySQL usa apenas banco Docker descartável, inclusive para persistência entre contextos e exclusão da ficha:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/Test-RoguelikeMySql.ps1 -Filter 'FullyQualifiedName~Statistics_PersistAcrossContexts'
```
