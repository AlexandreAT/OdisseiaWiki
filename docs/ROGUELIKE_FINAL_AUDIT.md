# Roguelike — fechamento da branch final

Revisão final: 04/11/2026. Branch: `feature/roguelike-events-missions-campaign`, derivada da main `9b377fd6` já commitada pelo responsável. Inclui os ajustes posteriores ao primeiro fechamento de 28/10.

## Escopo e revisão do plano

O plano e os registros das seções 0–61 de [ROGUELIKE_GAME.md](ROGUELIKE_GAME.md) foram confrontados com o estado atual: as seções históricas não são uma lista adicional de tarefas a reimplementar. Sistemas continuam administrativos, por confirmação explícita do responsável.

| Frente do escopo combinado | Entrega |
|---|---|
| Criação/retomada/abandono/reinício, versões, isolamento | Já na main; preservados e cobertos pela regressão |
| Combate, cinco ações, consumíveis, defesas, condições, treino | Base na main; correções de cadência, pausa, recarga e dano em área nesta branch |
| XP/atributos, loot, economia, quatro NPCs, depósito protegido | Já na main; reutilizados pelos efeitos/recompensas e encerramento |
| Eventos com escolha, custo, efeito e recompensa | Implementados com editor, validação, execução autoritativa e journal |
| Surpresa | Pool ponderada validada, compromisso do ramo e revelação persistida antes da entrada |
| Missões/submapas | Aceitar/recusar, custo, objetivo de área, retorno encadeado e recompensa única |
| Resultado da campanha | Resultado distinto por encerramento, XP/economia/registros e resumo imutável do depósito protegido |
| Inventário e navegação | Persistência por ação, sem confirmação geral; entrada de missão no topo; campos não são sobrescritos por falha atrasada de outro item |
| Estatísticas | Contagem geral/por personagem e resumos paginados das vitórias, autenticados; telas futuras não incluídas |
| Acessibilidade/apresentação | Alternativa textual ao mapa, botões/teclado, foco/erros e componentes/estilos centrais; sem inspeção em tela nesta revisão, a pedido do responsável |
| Isolamento entre Mesas/Sistemas/conteúdos | Catálogo efetivo autorizado e congelado; teste real adicional com duas Mesas/Sistemas e itens oficiais/próprios/derivados |

Sem nova migration, dependência, infraestrutura, commit, push ou deploy. Testes usam saída isolada e MySQL Docker descartável. Nenhum banco de desenvolvimento/produção ou ficha real foi modificado pelos ensaios.

## Proteções revistas

- Cliente envia ID da escolha, revisão e chave idempotente; não envia preço, prêmio ou efeito como verdade. Propriedade da run, caminho disponível e estado pendente são conferidos no servidor.
- Uma escolha ou conclusão não é reaplicada em retry/F5. Falhas por saldo, escolha inexistente ou condição inválida preservam estado, mapa e revisão. Eventos com escolhas não podem ser pulados pelo endpoint legado.
- Custo é anterior aos efeitos, inclusive para gatilhos de condições. A condição, o máximo, o bloqueio de recuperação, a progressão e o peso vêm das regras/snapshots fixados. A narrativa não executa regras.
- Recompensa exata clona o item autorizado e cria identidade própria. Não altera o original, a cópia da Mesa, a publicação nem o snapshot inicial; não substitui loot pendente.
- Surpresa não permite espiar um resultado e escolher outro ramo. Só resultado Atalho conserva a aresta de salto. NPCs dentro de surpresa usam os mesmos serviços, resgate, catálogos e validações.
- Missão retorna e premia pelo mesmo fluxo de qualquer último nó, não apenas combate. Recusa não cobra/premia; derrota/abandono não concluem missão. Um efeito letal não entrega recompensas externas durante retornos encadeados.
- Memória e itens protegidos continuam separados da ficha. Registro no resultado não duplica a posse nem muda quando uma run posterior resgata o item.
- Estatísticas consultam o histórico persistido com filtro de proprietário, inclusive na paginação e nas batalhas. Não criam contadores duplicados, não expõem derrotas detalhadas nas consultas novas e não dependem da ficha atual. A integração verifica continuidade após excluir a ficha de origem.
- Publicações/mapas antigos mantêm seus contratos e caminhos de compatibilidade. Sistemas privados por mestre não foram implementados nem tiveram suas permissões ampliadas.

## Validação automática

- **866 testes de backend aprovados** na revisão de 04/11, incluindo história, estatísticas, cadência/munição/pausa/recarga, dano em área para vários inimigos, percentuais nas propostas da ficha, validação e reabertura do módulo do Sistema. Na suíte comum, os testes MySQL opt-in retornam sem banco; a rodada real abaixo é evidência separada, não mais 23 testes distintos a somar aos 866.
- **333 testes de frontend aprovados**, incluindo escolhas, bloqueios, recusa, objetivos encadeados, resultado, alternativa textual, inventário automático, rollback após falha, entrada de missão no topo, serviços de estatísticas, combate/modais/animações e campos/ajudas de armas e percentuais de área. Editar a cadência preserva o custo de uma rajada legada.
- **23 testes executados juntos de fato em MySQL 8 descartável, sem falhas ou ignorados**, na revisão de 04/11. Cobrem migrations limpas/incrementais, concorrência/idempotência, retomada entre contextos, loot/loadout, economia/conserto/venda, compras no Sábio/Engenheiro, resgate/memória/depósito protegido, treino com histórico pesado, eventos/encontro desconhecido/missões, duas Mesas/Sistemas com conteúdo oficial/próprio/derivado, estatísticas/paginação e preservação das origens. Duração da suíte real: 14m59s.
- Build de produção final, TypeScript e `git diff --check` aprovados. Lint sem diagnósticos nos outros 38 arquivos TypeScript alterados/novos. O contêiner temporário dos testes foi encerrado; os bancos de desenvolvimento/produção não foram usados.
- Avisos legados de nullable/xUnit no backend e anotações de pacote SignalR/tamanho de chunks no build permanecem; não foram tratados como falhas novas nem escondidos por desativação de regras no produto.
- Nos arquivos legados comparados com HEAD por execução do lint com stdin, permanecem as mesmas 21 ocorrências de `any`, três avisos de Fast Refresh e um aviso de dependência de hook no cropper. Não há diagnóstico novo nem desativação dessas regras. Aceite visual autenticado continua pendente, por solicitação do responsável de focar os testes fora do navegador.

Comandos reproduzíveis, a partir do cliente:

```powershell
dotnet test ../OdisseiaWiki.Tests/OdisseiaWiki.Tests.csproj --artifacts-path "$env:TEMP/odisseia-final-tests" -p:UseAppHost=false
node --test --test-concurrency=1 tests/*.test.mjs
npm run build
& ../scripts/Test-RoguelikeMySql.ps1
```

Os testes MySQL da suíte comum são opt-in; uma contagem verde sem ativação não significa que acessaram banco. O script cria servidor e bancos temporários próprios e os remove ao terminar; não usar credenciais do banco real. A execução sequencial dos arquivos de frontend evita a disputa de timers dos testes de animação sob carga; não altera os tempos/animações do produto.

## Aceite local curto — antes de merge/publicação

1. Recompile/reinicie a API pelo Visual Studio e atualize o cliente. Em **Jogo → Áreas e rotas**, edite um rascunho de teste. Uma run antiga não recebe os nós novos; salve/publique e inicie outra para este ensaio.
2. Crie um **Evento** com duas escolhas: uma gratuita de saída; outra cobrando 10 moedas e concedendo 25 de vida, 5 XP, duas unidades de um item e uma condição publicada. Abra o evento: confira prévia, custo, saldo, condição e mochila. Feche antes de escolher e dê F5: deve continuar pendente; escolha uma vez e dê F5 de novo: nada deve duplicar.
3. Crie um **Encontro desconhecido** e abra **Possíveis encontros** para adicionar Evento e NPC Mercador/Médico. Ao escolher, o outro ramo deve ficar ignorado, o resultado aparecer e permanecer após F5. Entre nele; confira serviço/decisão real. Se incluir Atalho na pool, somente quando ele for o resultado deve haver salto. Este tipo se chamava Surpresa na interface anterior; contratos e runs salvos permanecem compatíveis.
4. Crie uma **Área secundária** curta e uma **Missão** apontando para ela, com custo 10 e recompensa 40 moedas + 7 XP. Recusar não cobra; aceitar entra na área. Recarregue no meio, termine o último nó e confira retorno e um único prêmio. Faça também um final de missão por NPC/loja, se sua aventura os usar.
5. Confira vitória e derrota: título correto, totais de XP incluindo eventos/missões, economia, decisões e missões não concluídas. Deixe um item protegido e confira que o resultado antigo não muda depois de resgatá-lo em outra run. Compare a ficha original: deve permanecer igual.
6. Repita as telas novas em desktop/mobile, neon ligado/desligado e movimento reduzido. Use Tab/Enter e **Rotas em texto**; confira scroll interno, botões sem corte, X e retomada. Em duas Mesas, só seus conteúdos autorizados devem aparecer. Após publicar, faça smoke test autenticado com API/cliente da mesma revisão.

### Ajustes de interface — 03/11/2026

- Na evolução de atributos, conferir a seta no mesmo tamanho do número, inclusive no mobile.
- Aceitar uma missão após rolar o mapa: a área da missão deve abrir no topo. Atualizações de inventário e retornos de combate dentro da mesma área não devem forçar o topo novamente.
- O inventário não possui mais confirmação geral: equipar/retirar arma, traje ou prótese, reordenar ações, adicionar/remover descanso e alterar alcance/quantidade persistem por ação. Ajustes de condição são aplicados ao sair do campo; configurações incompletas mostram a orientação para completar os campos.
- Equipar arma e colete, usar um consumível e dar F5: equipamento/ordem permanecem, sem botão Salvar. Em falha de rede, nenhum equipamento não confirmado deve aparecer como salvo; restaurar a conexão e repetir a ação. A ficha original continua intocada.

### Correção da revisão final — 04/11/2026

Uma resposta atrasada de falha ao salvar alcance/quantidade podia restaurar os campos da arma A sobre a arma B aberta enquanto aguardava. O rollback agora só afeta o item que originou o pedido. Não altera o contrato nem o estado do servidor. O novo teste falhou antes da correção (`3 !== 2`) e passou depois dela; a suíte completa de frontend também passou.

Para conferir: equipe duas armas com quantidades/alcances diferentes. Com a rede lenta ou indisponível, altere o alcance da primeira e abra a segunda antes da falha. Os campos da segunda devem permanecer os dela; a falha deve ser informada, sem fingir que a alteração foi salva.

Nesta revisão o responsável pediu explicitamente que não fossem feitos testes em tela. Não houve aceite visual autenticado; testes de componentes, build e verificações de código não foram apresentados como homologação visual. O roteiro acima continua disponível para a conferência local e após publicação.

## O que fica fora deste fechamento

Continuam futuras as escolhas de novas skills/ultimates por nível/marco, ataques ofensivos arbitrários não-D20, alvos aliados, tipos de dano/quebra de armadura, mecânicas particulares de chefes, migração de itens protegidos incompatíveis e outras expansões listadas na seção 0.7. Não foram expostas como se funcionassem. Criar/publicar Sistemas privados por mestre permanece fora do escopo, conforme decisão do responsável.

O criador da aventura ainda precisa configurar e balancear seus conteúdos. Um Sistema publicado personalizado é compatível se usa os contratos executáveis suportados; isso não significa interpretar qualquer regra de RPG, Rich Text ou fórmula sem implementação. Não existe garantia honesta de funcionamento para todas as configurações imagináveis nem de ausência absoluta de bugs.
