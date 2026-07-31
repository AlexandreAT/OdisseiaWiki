# Matriz de testes — Sistemas de RPG

## Como usar

Esta matriz cobre regras de domínio, persistência, API, integração com mesas, segurança, compatibilidade e interface. Casos automatizáveis devem começar em services e validações puras; comportamentos dependentes de MySQL, índices, JSON e FKs precisam de teste de integração no banco real ou compatível.

Prioridades:

- **P0**: perda de integridade, vazamento de permissão ou migração silenciosa;
- **P1**: fluxo principal bloqueado ou regra publicada incorreta;
- **P2**: erro de feedback, compatibilidade ou experiência;
- **P3**: refinamento visual e casos pouco frequentes.

## Domínio e persistência

| ID | Pri. | Cenário | Resultado esperado |
|---|---:|---|---|
| DOM-001 | P0 | Criar dois sistemas com códigos iguais, variando maiúsculas/minúsculas | Segunda criação é rejeitada; índice e service concordam |
| DOM-002 | P1 | Criar sistema sem código ou nome | Validação clara, sem persistência parcial |
| DOM-003 | P1 | Alterar código estável de sistema já referenciado | Operação bloqueada ou tratada por regra explícita |
| DOM-004 | P0 | Criar duas versões `1.0` no mesmo sistema | Segunda versão é rejeitada |
| DOM-005 | P1 | Usar versão fora do padrão semântico aceito | Validação retorna o campo e o motivo |
| DOM-006 | P0 | Editar versão publicada | Nenhum campo configurável é alterado |
| DOM-007 | P0 | Excluir versão vinculada a uma mesa | Retorna conflito e mantém dados |
| DOM-008 | P1 | Excluir rascunho usado como versão-base | Retorna conflito com dependência |
| DOM-009 | P1 | Arquivar versão publicada atual sem substituta | Operação segue a regra definida e nunca deixa referência inválida |
| DOM-010 | P1 | Consultar versão arquivada vinculada a mesa antiga | Versão continua legível |
| DOM-011 | P1 | Selecionar versão arquivada para mesa nova | Operação rejeitada |
| DOM-012 | P1 | Excluir sistema com versões | Retorna conflito |
| DOM-013 | P1 | Remover módulo obrigatório de rascunho e publicar | Publicação é rejeitada com lista de pendências |
| DOM-014 | P1 | Salvar schema JSON desconhecido | Configuração é rejeitada sem apagar a anterior |
| DOM-015 | P2 | Duplicar versão com todas as coleções | Cópia profunda cria novos IDs e mantém valores/ordem |

## Progressão

| ID | Pri. | Cenário | Resultado esperado |
|---|---:|---|---|
| PROG-001 | P1 | Cadastrar duas linhas para o mesmo nível | Duplicidade rejeitada |
| PROG-002 | P1 | Informar XP negativo | Validação rejeita o valor |
| PROG-003 | P1 | Informar pontos negativos | Validação rejeita o valor |
| PROG-004 | P1 | Nível fora do intervalo configurado | Validação rejeita e indica o intervalo |
| PROG-005 | P1 | Publicar com nível obrigatório ausente | Validação identifica a lacuna |
| PROG-006 | P2 | Preencher um intervalo de níveis | Cria somente níveis ausentes, em ordem |
| PROG-007 | P2 | Duplicar marco ou recompensa | Nova linha preserva dados e recebe identidade própria |
| PROG-008 | P2 | Reordenar fontes de XP | Ordem persiste após recarregar |
| PROG-009 | P1 | Resolver progressão sem módulo novo | Curva legada continua disponível |
| PROG-010 | P1 | Resolver nível máximo configurado | UI e service usam o mesmo limite |

## Criação, atributos, recursos e raças

| ID | Pri. | Cenário | Resultado esperado |
|---|---:|---|---|
| CREATE-001 | P1 | Cadastrar dois atributos com mesmo código | Duplicidade rejeitada |
| CREATE-002 | P1 | Recurso com mínimo maior que máximo | Validação rejeita |
| CREATE-003 | P1 | Valor inicial fora do intervalo do recurso | Validação rejeita ou normaliza conforme regra documentada |
| CREATE-004 | P1 | Cadastrar duas configurações para a mesma raça/versão | Duplicidade rejeitada |
| CREATE-005 | P1 | Raça existente vinculada por FK | Configuração resolve corretamente |
| CREATE-006 | P1 | Raça sem configuração na versão | Usa `Raca.StatusJson` legado |
| CREATE-007 | P1 | NPC sem mesa | Usa sistema padrão e não falha |
| CREATE-008 | P1 | Personagem jogador com mesa versionada | Usa a configuração da versão da mesa |
| CREATE-009 | P2 | Atributo racial que não pertence ao grupo principal | Regra configurada é respeitada sem depender do objeto hardcoded antigo |
| CREATE-010 | P2 | Raça invisível no gerenciamento do sistema | Relação administrativa segue a política definida sem expor conteúdo público |

## Dados, testes e combate

| ID | Pri. | Cenário | Resultado esperado |
|---|---:|---|---|
| COMBAT-001 | P1 | Faixas de resultado se sobrepõem | Publicação é rejeitada e aponta as faixas |
| COMBAT-002 | P1 | Faixa ultrapassa o máximo do dado | Validação rejeita |
| COMBAT-003 | P1 | Existe lacuna onde cobertura integral é obrigatória | Publicação é rejeitada |
| COMBAT-004 | P1 | Mínimo da faixa é maior que máximo | Validação rejeita |
| COMBAT-005 | P1 | Custo de ação negativo | Validação rejeita |
| COMBAT-006 | P1 | Código repetido de ação/dano/defesa/magia | Duplicidade rejeitada por versão |
| COMBAT-007 | P2 | Reordenar ações | Ordem persiste |
| COMBAT-008 | P1 | Módulo de combate ausente | Fluxo integrado usa fallback legado sem crash |
| COMBAT-009 | P2 | D6/D8/D20 configurados | Contratos preservam os valores aceitos atualmente |
| COMBAT-010 | P2 | Regra adicional de dado válida | É persistida sem exigir mudança no schema central |

## Condições, exploração e sobrevivência

| ID | Pri. | Cenário | Resultado esperado |
|---|---:|---|---|
| SURV-001 | P1 | Condição temporária sem duração | Validação rejeita ou exige unidade coerente |
| SURV-002 | P1 | Duração negativa | Validação rejeita |
| SURV-003 | P1 | Movimento/carga com valor negativo proibido | Validação rejeita |
| SURV-004 | P1 | JSON de descanso incompatível com schema | Escrita rejeitada e configuração anterior preservada |
| SURV-005 | P1 | JSON de morte incompatível com schema | Escrita rejeitada e configuração anterior preservada |
| SURV-006 | P2 | Campo opcional desconhecido em schema compatível | Comportamento segue política de compatibilidade documentada |
| SURV-007 | P2 | Módulo desabilitado | Resolver informa módulo inativo e aplica fallback previsto |

## Publicação e cópia

| ID | Pri. | Cenário | Resultado esperado |
|---|---:|---|---|
| PUB-001 | P0 | Publicar rascunho válido | Estado muda atomicamente para Publicado |
| PUB-002 | P0 | Falha durante publicação | Nenhuma alteração parcial é persistida |
| PUB-003 | P1 | Publicar rascunho inválido | Retorna todas as pendências relevantes |
| PUB-004 | P0 | Publicar `1.1` com mesas em `1.0` | Mesas continuam explicitamente em `1.0` |
| PUB-005 | P1 | Duplicar versão publicada | Origem permanece imutável; destino nasce Rascunho |
| PUB-006 | P1 | Duplicar versão arquivada | Regra definida é aplicada e nunca altera a origem |
| PUB-007 | P1 | Dois pedidos concorrentes de publicação | Apenas uma transição consistente vence |
| PUB-008 | P2 | Changelog obrigatório ausente | Publicação segue a validação definida e fornece feedback de campo |

## Mesas e resolver

| ID | Pri. | Cenário | Resultado esperado |
|---|---:|---|---|
| MESA-001 | P0 | Mesa explicitamente em `1.0` após publicar `1.1` | Resolve `1.0` |
| MESA-002 | P0 | Migrar mesa de `1.0` para `1.1` | Apenas a mesa solicitada muda |
| MESA-003 | P0 | Migrar para Rascunho | Operação rejeitada |
| MESA-004 | P0 | Migrar para Arquivado | Operação rejeitada |
| MESA-005 | P0 | Usuário sem permissão migra mesa | Retorna 403 |
| MESA-006 | P1 | Mesa antiga com FK nula | Resolve `ODISSEIA/1.0`, sem acompanhar automaticamente nova publicação |
| MESA-007 | P1 | Nenhuma mesa informada | Resolve versão publicada atual do sistema padrão |
| MESA-008 | P1 | Seed/configuração indisponível | Resolver usa fallback legado |
| MESA-009 | P1 | Versão arquivada já vinculada | Mesa continua resolvendo e funcionando |
| MESA-010 | P2 | Resposta do resolver | Informa sistema, versão e origem do fallback |
| MESA-011 | P0 | `1.0` arquivada e `1.1` publicada; resolver sem mesa para criar uma nova | Resolve `1.1`; a preservação de `1.0` aplica-se somente a mesa explícita ou legada |

## Seed e migração de banco

| ID | Pri. | Cenário | Resultado esperado |
|---|---:|---|---|
| SEED-001 | P0 | Rodar seed em banco vazio | Cria `ODISSEIA/1.0` uma vez |
| SEED-002 | P0 | Rodar seed novamente | Não duplica nem altera versão publicada |
| SEED-003 | P0 | Duas instâncias executam seed | Índices/lock mantêm uma única cópia |
| SEED-004 | P1 | Raça esperada não existe | Seed continua e fallback racial permanece possível |
| SEED-005 | P1 | Raça encontrada por nome normalizado | Configuração se vincula ao ID correto |
| SEED-006 | P0 | Aplicar migration com mesas antigas | Schema e dados continuam válidos |
| SEED-007 | P0 | Reverter migration em ambiente de teste | Down não deixa FKs órfãs dentro do cenário suportado |
| SEED-008 | P1 | Banco sem migration com seed ativo | Inicialização falha de forma observável e tenta novamente conforme configuração |
| SEED-009 | P0 | Conferir limites de poderes da `ODISSEIA/1.0` | 15 magias, 4 skills de nível máximo 4, 1 ultimate desbloqueada no nível 7 e 9 tipos mágicos |
| SEED-010 | P0 | Conferir concessões por nível | Apenas 1 ponto de nível é concedido; campos de atributo/skill/ultimate não duplicam a recompensa |
| SEED-011 | P1 | Conferir XP excedente e curva | Excedente é preservado; faixas 1-6/7-9/10-12/13-15/16-19 usam 10/20/25/30/40 |
| SEED-012 | P1 | Conferir PA do quadro da página 32 | Investigar usa 2 PA e item usa 1 PA; a divergência do exemplo permanece documentada |
| SEED-013 | P1 | Conferir sobrevivência | Condições do livro existem; desmembramento usa 20%/2x e insta kill 50%/5x |

## API e segurança

| ID | Pri. | Cenário | Resultado esperado |
|---|---:|---|---|
| API-001 | P0 | Anônimo tenta criar/editar sistema | 401 |
| API-002 | P0 | Usuário comum tenta escrita administrativa | 403 |
| API-003 | P0 | Admin executa escrita válida | Sucesso |
| API-004 | P1 | ID inexistente | 404 consistente |
| API-005 | P1 | DTO inválido | 400 com campos/motivos, sem stack trace |
| API-006 | P1 | Exclusão bloqueada por uso | 409 com explicação |
| API-007 | P1 | Escrita genérica de JSON arbitrário | Endpoint não existe ou rejeita contrato não tipado |
| API-008 | P2 | Listagem de sistemas | Retorna versão publicada, contagem de versões/mesas e datas |
| API-009 | P2 | Requisição concorrente conflitante | Não perde atualização silenciosamente |
| API-010 | P1 | Claims de Admin adulteradas/ausentes | Backend mantém bloqueio pela policy |

## Frontend e responsividade

| ID | Pri. | Cenário | Resultado esperado |
|---|---:|---|---|
| UI-001 | P1 | Listar sistemas | Nome, código, status, versão publicada e contagens aparecem corretamente |
| UI-002 | P1 | Abrir versão | Abas/seções carregam sem formulário gigante único |
| UI-003 | P1 | Editar versão publicada | Controles de escrita ficam indisponíveis e backend também bloqueia |
| UI-004 | P1 | Duplicar versão | Navega para novo rascunho com feedback |
| UI-005 | P1 | Publicação inválida | Pendências aparecem perto das seções/campos correspondentes |
| UI-006 | P2 | Reordenar tabelas | Ordem visual e persistida coincide |
| UI-007 | P2 | Estado vazio | Exibe orientação e ação adequada |
| UI-008 | P2 | Loading/erro de API | Mantém layout e oferece feedback claro |
| UI-009 | P1 | Desktop e ultrawide | Conteúdo usa largura disponível sem linhas excessivamente longas |
| UI-010 | P1 | Tablet | Navegação de seções e tabelas permanecem utilizáveis |
| UI-011 | P1 | Mobile | Sem corte lateral; ações críticas acessíveis; tabelas adaptadas |
| UI-012 | P2 | Tema claro/escuro e neon | Contraste, foco e estados seguem o padrão global |
| UI-013 | P2 | Teclado | Tabs, modais, tabelas e ações têm foco e ordem coerentes |

## Regressão dos fluxos atuais

| ID | Pri. | Cenário | Resultado esperado |
|---|---:|---|---|
| REG-001 | P0 | Criar/editar NPC | Continua funcionando sem mesa |
| REG-002 | P0 | Criar/editar personagem jogador | Mesa e raça continuam carregando |
| REG-003 | P0 | Abrir personagem antigo com `StatusJson` | Recursos, atributos, XP e nível continuam visíveis |
| REG-004 | P1 | Raça com override de `MesaEntidadeConfig` | Override legado continua aplicado durante a transição |
| REG-005 | P1 | Item/skill/magia antigos | JSON antigo continua desserializando |
| REG-006 | P1 | Página pública de personagem | Progressão usa configuração ou fallback sem regressão |
| REG-007 | P1 | Mesa padrão protegida | Continua não editável/excluível pelas regras existentes |
| REG-008 | P1 | Busca e CRUD Wiki | Novo módulo não altera endpoints ou visibilidade existentes |

## Verificações de entrega

Executar antes do handoff:

```text
dotnet build
dotnet test
npm run build
git diff --check
```

Além disso:

- revisar migration e snapshot;
- aplicar migration em banco vazio e cópia com dados legados;
- executar seed duas vezes;
- conferir Swagger e políticas de autorização;
- testar ao menos uma mesa em 1.0 antes e depois de publicar 1.1;
- registrar hardcodes ainda não integrados e o fallback correspondente.
