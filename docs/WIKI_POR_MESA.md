# Wiki por Mesa

## Objetivo

Uma Mesa possui uma Wiki própria, administrada por seu mestre, sem expor conteúdo
privado em nenhuma outra Mesa ou na Wiki oficial. A Wiki da Mesa reaproveita os
mesmos tipos de conteúdo da Wiki oficial:

- páginas;
- cidades;
- raças;
- NPCs;
- itens.

O catálogo disponível dentro de uma Mesa é sempre:

```text
conteúdo oficial compatível com o Sistema da Mesa
+ conteúdo pertencente à própria Mesa
```

`MesaEntidadeConfig` não é o armazenamento da Wiki da Mesa. Ela continua sendo
somente um delta de regras da Mesa aplicado sobre uma entidade já existente.

## Regras invariáveis

1. Todo conteúdo da Wiki possui exatamente um escopo de propriedade.
2. A Wiki oficial consulta exclusivamente conteúdo oficial.
3. Uma Wiki de Mesa consulta conteúdo oficial elegível e conteúdo daquela Mesa.
4. Conteúdo de uma Mesa nunca aparece em endpoints, buscas, batches, selects,
   páginas dinâmicas ou grafo de outra Mesa.
5. Escopo e autorização são validados no backend antes de `Visivel`.
6. Mestre cria, altera e exclui somente conteúdo da própria Mesa; participantes
   apenas consomem o catálogo permitido.
7. Relações só podem apontar para conteúdo próprio ou oficial presente no catálogo
   efetivo da Mesa.
8. O frontend nunca recebe catálogos de outras Mesas para filtrá-los localmente.

## Modelagem

`WikiEscopo` é a raiz de propriedade editorial.

```text
WikiEscopo
  Oficial (único)
  Mesa (um por Mesa)

Page, Cidade, Raca, Personagen, Item
  -> IdWikiEscopo obrigatório
```

O conteúdo legado é migrado para o escopo oficial. Cada Mesa existente recebe seu
escopo mesmo que ainda não tenha conteúdo próprio. O slug de Página é único dentro
do escopo, não globalmente.

`InfoLore` permanece um recurso exclusivamente da Wiki oficial e não integra o
catálogo de uma Mesa. Por isso, páginas criadas na Wiki de Mesa não podem criar
referências a `InfoLore`; essa regra é aplicada no backend, além de a opção não
ser exibida no editor contextual.

Raça, NPC e Item preservam seus vínculos existentes com Sistema e versão. Páginas
e Cidades recebem um vínculo opcional de Sistema para permitir elegibilidade por
sistema. A versão da Mesa continua definindo as regras de runtime. A versão de
origem de um conteúdo não deve ser usada implicitamente para escondê-lo; se houver
restrição editorial por versão no futuro, ela precisa de disponibilidade explícita.

Conteúdo próprio de Mesa sobrevive a migrações de Sistema. A mudança apenas recalcula
o catálogo oficial disponível. Referências que deixem de ser elegíveis são apontadas
no preview de migração e não devem vazar ou ser resolvidas silenciosamente.

## Contexto de consulta

Toda operação de Wiki usa um contexto resolvido no servidor:

```text
WikiContexto
  Oficial
  ou Mesa(IdMesa, IdWikiEscopo, usuário, permissão, SistemaRuntime)
```

Os endpoints oficiais passam explicitamente o contexto oficial. Os endpoints de
Mesa são aninhados em `/api/mesas/{mesaId}/wiki/...`, resolvem o usuário, validam
proprietário ou participante e então consultam o catálogo efetivo. Não usar
`idMesa` opcional em endpoints globais novos.

## Autorização

| Operação | Oficial | Wiki da Mesa |
| --- | --- | --- |
| Leitura pública | conteúdo oficial visível | não aplicável |
| Leitura autenticada | conteúdo oficial visível | proprietário ou participante; apenas visível |
| Gerenciamento | Admin | proprietário da Mesa |
| Admin | administra oficial | bypass administrativo conforme política central |

Para conteúdo fora do escopo, as leituras retornam `404` e escritas retornam
`403`/`404` sem expor o conteúdo.

## Rotas

As rotas oficiais permanecem compatíveis:

```text
/wiki
/wiki/:slug
/personagem/:id
/cidade/:id
/raca/:id
/item/:id
```

Rotas contextuais da Mesa:

```text
/mesa/:id/wiki
/mesa/:id/wiki/gerenciar
/mesa/:id/wiki/:slug
/mesa/:id/wiki/personagem/:entityId
/mesa/:id/wiki/cidade/:entityId
/mesa/:id/wiki/raca/:entityId
/mesa/:id/wiki/item/:entityId
/mesa/:id/wiki/conexoes
```

Um contexto de frontend é propagado para busca, formulários, relações, páginas
dinâmicas, breadcrumbs e retornos para a Mesa. Formulários não são duplicados;
recebem somente esse contexto.

## Relações e catálogo efetivo

O serviço central do catálogo é a única fonte de verdade para:

- listagens, busca, batch e autocomplete;
- relações em blocos de Página;
- Raça/Cidade/NPC relacionado;
- itens, acessórios e referências nas fichas;
- criação e edição de PersonagemJogador;
- Teia de Conexões.

Validar uma referência significa confirmar, no banco, que ela pertence ao escopo
da Mesa ou ao escopo oficial elegível. `Visivel` não substitui essa validação.

## Política de visibilidade (Wiki oficial e Wiki da Mesa)

- O administrador global lê e referencia qualquer conteúdo, inclusive oculto, em qualquer escopo. A interface marca conteúdo oculto com “Só você vê”.
- Fora da própria Mesa, ser mestre não concede nenhum acesso especial ao conteúdo oficial oculto.
- Dentro da própria Mesa, o mestre pode ler e referenciar apenas os conteúdos ocultos criados no escopo daquela Mesa. Conteúdo oficial oculto continua inacessível.
- Participantes e leitores não recebem conteúdo oculto, IDs reais, nomes, imagens nem rotas via busca, leitura por ID, referências, comparação ou respostas auxiliares.
- Referências para alvos ocultos permanecem como cards pretos sem link e sem metadados. O servidor substitui o ID real por um identificador opaco descartável; não basta esconder no CSS.
- A Teia só mostra um nó preto anônimo quando uma conexão legível aponta para ele. Nós ocultos sem essa conexão e conexões originadas de conteúdo inacessível não são enviados.
- Ao copiar NPC oficial para a Mesa, referências oficiais ocultas são removidas antes de criar a ficha local; uma raça obrigatória inacessível impede a cópia com erro de validação.

## Assets

Uploads da Wiki de Mesa exigem proprietário e usam pasta derivada no servidor:

```text
mesawiki/mesa-{mesaId}-{tipo}-{entidade}/{pasta-opcional}
```

O cliente não escolhe o diretório efetivo. Exclusão valida ownership da entidade e
só remove o asset físico se não houver referência em nenhum conteúdo.

## Teia de Conexões

O snapshot do grafo recebe o mesmo contexto da Wiki:

- oficial: somente escopo oficial;
- Mesa: oficial elegível + escopo da Mesa.

Relações inválidas ou externas não entram no snapshot.

## NPCs de cena e turnos

- A lista principal da Mesa continua representando os personagens do grupo.
- NPCs adicionados à cena são cópias persistentes vinculadas ao personagem e à
  variante de origem, mas com ficha, recursos e inventário independentes.
- Uma cópia nasce oculta e somente aparece aos jogadores quando o mestre habilita
  sua visibilidade. Cópias diferentes do mesmo NPC genérico não compartilham estado.
- Adicionar uma cópia à cena também a vincula ao turno em preparação. Adicionar
  apenas pelo painel de turnos cria somente um participante de combate.
- Somente o administrador do site pode publicar explicitamente o estado da cópia
  de volta na ficha original; nenhuma edição local faz isso automaticamente.
- A ordem sugerida acompanha as iniciativas, pode ser recalculada pelo mestre e
  pode ser ajustada por arrastar antes da confirmação, inclusive com iniciativas
  ainda pendentes.
- Atualizações em tempo real invalidam somente a seção afetada (`mesa`,
  `personagens` ou `gameplay`) e nunca recarregam a página inteira.

## Plano de implementação

1. Criar escopos, migration segura, índices e backfill oficial.
2. Criar resolução central de contexto, autorização e catálogo efetivo.
3. Contextualizar repositories, endpoints de leitura, busca, batch e grafo.
4. Adicionar endpoints de gerenciamento e validação de relações.
5. Contextualizar uploads e exclusões de assets.
6. Adaptar `ManagementWiki`, formulários e rotas sem duplicar componentes.
7. Adaptar Wiki, páginas dinâmicas, busca, links e breadcrumbs.
8. Integrar catálogo efetivo aos personagens de jogador.
9. Cobrir isolamento, autorização, relações, assets, migração e regressão oficial
   com testes de integração.

## Testes obrigatórios

- Wiki oficial não retorna conteúdo de Mesa;
- Mesa A não enxerga conteúdo da Mesa B;
- participante só vê conteúdo visível de sua Mesa;
- mestre só escreve na própria Mesa;
- batch, busca, autocomplete, slug e páginas dinâmicas respeitam escopo;
- referências adulteradas entre Mesas são rejeitadas;
- ficha de jogador só aceita catálogo efetivo;
- grafo não mistura escopos;
- upload e exclusão preservam ownership e referências compartilhadas;
- migration preserva conteúdo legado e conteúdo de Mesa.
