# Condições executáveis e configuráveis

## Contrato e fonte da verdade

A versão publicada do Sistema define **o que uma condição faz** e como termina. Uma origem (item, prótese, magia, skill ou gatilho automático do Sistema) define **quando, em quem, com qual intensidade e por quanto tempo** ela começa. A cópia do item dentro de uma ficha ou run pode ajustar esses parâmetros sem alterar o catálogo global. Toda execução valida novamente os códigos contra a versão publicada fixada na mesa ou run; texto narrativo não vira regra.

O contrato novo deve ser uma lista ordenada de efeitos estruturados por condição, preservando as colunas legadas como um único efeito implícito. Cada efeito tem operação, alvo numérico (recurso, atributo ou teste), momento e valor padrão. O executor aceita apenas operações conhecidas e validadas; um Sistema pode não configurar nenhuma condição. Para uma mecânica nova fora dessas operações, amplia-se o catálogo de primitivas e seus testes, sem inserir casos especiais pelo nome da condição.

Gatilhos das origens: uso, equipamento, acerto classificado pela versão publicada, comparação do valor natural do dado (igual/maior/menor/faixa) e, quando aplicável, recebimento de golpe. Alvo: próprio usuário, alvo atingido ou conjunto explicitamente selecionado. Gatilhos automáticos do Sistema observam os recursos em pontos definidos da execução. Antes de publicar ou salvar uma origem, a API confere condição, gatilho, dado, alvo, duração e efeitos. Remover uma condição do Sistema deve listar as origens que a referenciam e exigir revisão; nenhuma condição ausente deve ser aplicada silenciosamente.

Condições ativas guardam snapshot da regra, origem, duração restante e intensidade. Turnos avançam somente nos turnos de jogo; horas avançam somente pelo tempo de jogo de eventos e descansos, nunca pelo relógio real. Cura, descanso, magia de remoção, duração e fim do gatilho são mecanismos independentes e configuráveis. A remoção por consumível de cura é disparada pelo **uso válido**, mesmo se a vida já estiver cheia, quando a regra publicada disser que esse uso remove a condição.

## Cenários de aceitação

| Exemplo | Regra no Sistema | Origem e execução |
| --- | --- | --- |
| Dependência de mana | Mana chega a zero → reduzir máximo até descanso configurado | Automática, sem item |
| Sangramento | Subtrair vida no momento de turno e remover no uso de cura | Arma cortante aplica em resultado natural ≥19; instância pode alterar valor, limite e duração |
| Cegueira | Modificar Precisão em −5 e impor desvantagem por 3 turnos | Granada aplica ao alvo ao ser usada; ambos os efeitos vêm da mesma condição |
| Lesão | Reduzir máximo de estamina em 30% até descanso | Martelo aplica no crítico definido no Sistema |

## Sequência de implementação

1. Migrar a leitura da condição de um efeito singular para uma lista tipada, com fallback para os campos legados. Centralizar avaliação, duração, acumulação e remoção para mesa e roguelike.
2. Tornar a origem configurável por instância, com comparação de dado e seleção de alvo; validar no servidor e avisar referências órfãs antes de publicar Sistema/mesa.
3. Aplicar os mesmos efeitos no cálculo de recursos e rolagens, inclusive modificador de atributo e vantagem/desvantagem; preservar snapshots e log no combate.
4. Editar os parâmetros na cópia de item, prótese, magia e skill pelo modal da ficha/run, com revisão otimista e sem mutar o original.
5. Cobrir os quatro cenários acima em testes unitários, integração de persistência e testes da interface. Uma versão publicada ou run antiga mantém as regras que fixou.

Não classificar esta etapa como concluída apenas por existir formulário: a condição precisa afetar a rolagem/estado, persistir, expirar e ser removível no fluxo real.

## Estado desta implementação (17/10/2026)

- Já há leitura central de efeitos múltiplos estruturados, preservando o efeito legado; o editor do Sistema permite configurar modificador de rolagem, vantagem/desvantagem, alterações de recurso, bloqueio de recuperação e redução percentual de máximos. A publicação valida que atributos citados por `MODIFICAR_ROLAGEM` existem na versão. A engrenagem **Configurar** abre o formulário da condição selecionada, que não fica pré-aberto sem uma seleção.
- Origens dos quatro tipos (item, prótese, magia, skill) aceitam acerto, uso e faixa/lista de resultados naturais. No inventário da run, a cópia da origem pode alterar gatilho, intensidade e duração sem editar o catálogo ou a ficha, com revisão e idempotência. O combate roguelike lê esses dados do snapshot. Condições de horas avançam apenas com tempo de jogo configurado; recuperação por cura funciona mesmo com vida cheia quando a condição permite.
- Ainda **não** há execução completa do exemplo da granada sem teste D20, seleção de alvo/área para consumíveis nem edição das condições nos mini modais da ficha fora da run. O editor por instância substitui uma intensidade numérica principal; não oferece substituições independentes de todos os efeitos de uma mesma condição. Também falta localizar e alertar todas as origens que ficariam órfãs antes de remover uma condição do Sistema. Não publicar estes casos como concluídos.
- A mesa ativa usa os mesmos efeitos estruturados para recursos, recuperação e limites, incluindo modificador/desvantagem na rolagem autoritativa durante combate. No roguelike, gatilhos automáticos de vida, mana e estamina agora são avaliados durante a luta, inclusive depois do custo da ação e antes de seu dado, além da reconciliação pós-combate. O teste da dependência de mana confirma que zerar mana pode afetar imediatamente a rolagem da própria ação. Os quatro cenários ainda precisam de testes completos de ponta a ponta na interface com versões publicadas reais.

## Atualização (18/10/2026)

- O editor do Sistema agora também oferece modificador assinado de atributo usado em testes, dano, armadura fixa e máximo percentual de vida/mana/estamina. Valor positivo é bônus; negativo é penalidade. `SOMAR` em início/fim de turno permite regeneração. A regra publicada continua sendo a fonte de verdade e pode combinar até oito efeitos adicionais, sem lógica baseada no nome da condição.
- As origens nas fichas (item, prótese, magia e skill) e na cópia da run podem ajustar cada valor individualmente, além do gatilho e da duração. O servidor valida índice, operação e intervalo dos valores da cópia antes de executá-los. O valor principal antigo permanece legível para compatibilidade, mas o ajuste individual tem prioridade.
- Ao tentar retirar uma condição do rascunho do Sistema, a interface consulta referências em itens, NPCs, fichas de jogadores e configurações de jogo; exibe os nomes encontrados e pede confirmação explícita. O servidor repete a busca antes de persistir a remoção. Versões já publicadas e runs fixadas nelas não são reescritas.
- No roguelike, bônus/penalidades atuam no teste de atributo, no dano e na armadura; regeneração e ajustes de máximo são aplicados e removidos com a duração configurada. Foram adicionados testes para combinação de efeitos, sobreposição por origem e alerta de remoção.
- Na mesa ativa, o resultado natural por faixa, o resultado classificado e o alvo da proposta de condição foram corrigidos. A aplicação dos efeitos ao personagem ainda é **assistida**: o jogador/mestre confirma a proposta. Não declarar a mesa como aplicação automática de todas as condições por origem. No roguelike, o consumível sem D20 de área entra no loadout pré-combate; permanece pendente a validação visual ponta a ponta em versões publicadas reais.

## Reações de área e utilitários (19/10/2026)

- Uma origem de condição agora pode indicar **Todos os inimigos** e exigir teste de resistência estruturado: quantidade de dados, faces, atributo publicado e dificuldade. O simulador rola separadamente para cada afetado, aplica seus modificadores e vantagem/desvantagem ativos, registra os dados, e só aplica a condição a quem não alcançou a dificuldade. Essas reações não iniciam turno nem mudam a ordem. A condição também pode conter o efeito `PERDER_TURNOS`, com quantidade independente dos demais efeitos e da duração da condição.
- A configuração existe nos formulários de item, magia, skill e prótese e na cópia da run. O uso pela mochila é recusado para condições cujo alvo não seja o usuário, para impedir que uma granada de área seja gasta como autocura. O replay pode apresentar cada teste de resistência.
- A decisão de produto é usar o **loadout ordenado**, não uma barra clicável durante o replay pré-calculado. Um utilitário sem teste D20 ocupa um dos cinco slots: no turno em que a prioridade o alcança, restaura recursos e/ou aplica condições, inclusive resistências individuais de área fora do turno dos alvos. Um consumível gasta uma unidade somente quando essa ação executa, e o inventário da run é persistido junto com o resultado. Sem unidades ou sem benefício de cura, o simulador tenta a próxima ação. A ficha original não muda; replays salvos não são recalculados.
