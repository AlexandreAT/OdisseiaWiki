# Task — Tornar o Sistema de RPG a fonte efetiva das regras do projeto

## Leitura obrigatória antes de qualquer alteração

Antes de modificar o código, leia integralmente:

1. `PROJECT_GUIDE`;
2. `docs/RPG_SYSTEMS.md`;
3. `docs/RPG_SYSTEMS_QA.md`;
4. o Livro do Jogador anexado, com atenção especial ao Capítulo 3 — Sistemas Específicos e às regras anteriores de criação, raças, atributos, passivas, recursos e dados;
5. a análise mais recente sobre o estado atual do módulo de Sistemas;
6. as entidades, DTOs, services, repositories, controllers, migrations, seeds, formulários, hooks, models, rotas e componentes já implementados para Sistemas, Mesas, personagens, raças e itens.

Esta task é uma continuação direta da implementação já existente.

O módulo atual já oferece uma base versionada válida, porém ainda funciona principalmente como um catálogo administrativo de regras. O objetivo agora é fazer o projeto **consumir essas regras de verdade**, sem quebrar os fluxos existentes e sem confundir regras do Sistema com o estado salvo das entidades.

Não entregue apenas uma análise. Depois de compreender o projeto, implemente a solução funcional que considerar mais adequada.

Você pode alterar detalhes do planejamento abaixo quando o código real indicar uma solução melhor, desde que preserve as regras principais e explique as decisões no relatório final.

---

# Branch obrigatória

Antes de alterar qualquer arquivo:

1. verifique a branch atual;
2. confirme que ela contém a implementação já concluída do módulo de Sistemas;
3. crie uma nova branch para esta integração.

Nome sugerido:

```text
feat/rpg-system-runtime-integration
```

Não implemente diretamente na branch anterior, não faça merge automático e não realize deploy.

---

# Diagnóstico atual

Hoje já existem:

- `SistemaRpg`;
- versões em rascunho, publicadas e arquivadas;
- módulos configuráveis;
- progressão;
- recursos;
- atributos;
- configurações raciais;
- ações;
- dados;
- tipos de dano e defesa;
- magias;
- condições;
- descanso;
- morte;
- vínculo entre Mesa e `SistemaVersao`;
- resolver inicial;
- seed idempotente de `ODISSEIA/1.0`;
- publicação, duplicação, arquivamento e migração básica de Mesa.

Entretanto, os consumidores ainda usam principalmente:

- `StatusJson`;
- `AtributosJson`;
- listas e escalas fixas do frontend;
- curvas hardcoded de progressão;
- valores raciais legados;
- catálogos duplicados;
- constantes locais;
- regras espalhadas entre frontend e backend.

O modelo atual é uma fundação válida, mas ainda não é uma engine aplicada.

A nova implementação deve transformar o Sistema na fonte efetiva das **regras de background**, mantendo os valores explícitos e o estado das entidades em suas estruturas atuais.

---

# Objetivo principal

O Sistema deve passar a governar, conforme o contexto:

- progressão;
- XP necessário;
- nível máximo;
- marcos e recompensas de nível;
- atributos disponíveis;
- recursos;
- defesas;
- resultados de dados;
- condições;
- fadiga;
- dependência de mana;
- morte;
- descanso;
- movimento;
- custos;
- limites de skills;
- limites de magias;
- tipos de magia;
- tipos de dano;
- tipos de defesa;
- parâmetros raciais;
- categorias, arquétipos e referências gerais de itens.

Ao mesmo tempo:

- personagens continuam guardando seu estado em `StatusJson`;
- itens continuam guardando seus valores reais em `AtributosJson`;
- NPCs continuam guardando atributos e recursos próprios;
- valores definidos diretamente pelo administrador ou jogador não devem ser sobrescritos silenciosamente;
- os hardcodes atuais continuam como fallback enquanto a transição não estiver completa.

---

# Regra de ouro

## Regra do Sistema não é estado da entidade

Exemplos:

```text
XP necessário para subir de nível
→ Sistema

XP atual
→ Personagem
```

```text
Nível máximo conhecido
→ Sistema

Nível explicitamente salvo no NPC
→ NPC
```

```text
Vida racial base usada como valor inicial
→ SistemaRacaConfig

Vida máxima já salva e editável na ficha
→ Personagem

Vida atual
→ Personagem
```

```text
Limite conhecido de dano para uma pistola
→ Sistema

Dano real da pistola criada
→ Item
```

```text
Regra de fadiga ao chegar a 0 de estamina
→ Sistema

Estamina atual
→ Personagem
```

Uma alteração de versão pode mudar imediatamente as regras utilizadas em background, mas não deve reescrever valores explícitos que um usuário ou administrador poderia ter alterado.

---

# Correção importante sobre atualização automática

A opção de acompanhar a versão publicada mais recente **não significa que nada muda**.

Ela significa:

## O que deve mudar automaticamente na interpretação

Quando uma entidade global acompanha a publicação atual, ou quando uma Mesa é migrada conscientemente para uma nova versão, passam a valer as novas regras de background, por exemplo:

- XP necessário para subir de nível;
- nível máximo do Sistema;
- recompensas e marcos de nível;
- quantidade máxima de skills;
- quantidade máxima de magias;
- resultados e intervalos de dados;
- regras de fadiga;
- dependência de mana;
- regras de morte;
- regras de descanso;
- movimento;
- custos de ações;
- tipos de dano;
- tipos de defesa;
- catálogos e limites;
- referências de arquétipos de item;
- regras de condições;
- validações do Sistema.

Esses dados normalmente não precisam ser gravados novamente na ficha. Eles devem ser resolvidos em tempo de execução pela versão efetiva.

## O que não deve ser alterado automaticamente

Não reescrever:

- vida atual;
- vida máxima já salva e editável;
- mana atual;
- mana máxima já salva e editável;
- estamina atual;
- estamina máxima já salva e editável;
- XP atual;
- nível explicitamente definido em um NPC;
- atributos já distribuídos;
- skills escolhidas;
- magias aprendidas;
- inventário;
- dano real de um item;
- defesa real de um traje;
- bônus reais de uma prótese;
- escolhas feitas pelo jogador;
- qualquer valor explícito que o usuário ou administrador possa editar.

## Valores iniciais e defaults

Mudanças de valores iniciais do Sistema, como a vida base de uma raça, devem:

- valer para novas criações;
- aparecer como referência atual;
- gerar aviso quando a entidade existente divergir;
- não sobrescrever entidades já criadas.

---

# Separação obrigatória das fontes de dados

A solução deve distinguir claramente quatro camadas.

## 1. Conteúdo global da Wiki

Pertence à entidade global:

```text
Raca
→ nome, descrição, imagem, galeria, tags e lore

Item
→ nome, descrição, imagem, tags e conteúdo

Cidade
→ nome, descrição, pontos de interesse e galeria

Página
→ título, blocos e conteúdo
```

## 2. Regra mecânica versionada

Pertence a `SistemaVersao`.

Exemplos:

```text
SistemaRacaConfig
→ vida base
→ mana base
→ estamina base
→ capacidade de carga
→ atributo inicial
→ passivas
```

```text
SistemaNivel
→ XP necessário
→ recompensas
→ marcos
```

```text
SistemaArquetipoItem
→ faixas conhecidas
→ campos aplicáveis
→ categorias
→ referências
```

## 3. Override da Mesa

Representa uma exceção específica de uma campanha.

Exemplo:

```text
Sistema Odisseia 1.1:
Orc possui 1.500 de vida base

Mesa A:
Orc possui 1.700 de vida base
```

## 4. Estado ou valor explícito da entidade

Pertence à ficha ou item:

```text
Personagem:
→ vida atual
→ XP atual
→ atributos distribuídos
→ skills escolhidas
→ magias aprendidas

Item:
→ dano real
→ peso real
→ munição real
→ bônus reais
```

Não permita que essas camadas sejam tratadas como uma única fonte.

---

# Matriz de resolução

Implemente ou evolua um resolver único, tipado e reutilizável.

## Personagem jogador

```text
PersonagemJogador
→ Mesa
→ SistemaVersao vinculada à Mesa
→ override da Mesa, quando existir
→ estado salvo na ficha
```

## NPC global

```text
NPC com vínculo explícito
→ Sistema escolhido
→ publicação atual ou versão fixada

NPC sem vínculo explícito
→ Sistema padrão ODISSEIA
→ publicação atual

Configuração ausente
→ fallback legado
```

## Item global

```text
Item com vínculo explícito
→ Sistema escolhido
→ publicação atual ou versão fixada

Item sem vínculo explícito
→ Sistema padrão ODISSEIA
→ publicação atual

Configuração ausente
→ fallback legado
```

## Raça

```text
Raca
→ conteúdo global

SistemaRacaConfig
→ regra mecânica da raça na versão

MesaEntidadeConfig
→ override da Mesa

Personagem
→ valores efetivamente salvos
```

## Cidade e Página

Atualmente são conteúdos narrativos.

Não force vínculo com Sistema apenas por uniformidade. Adicione contexto de Sistema somente se existir uma regra mecânica real que dependa dele.

## Versões permitidas

- rascunho nunca alimenta gameplay normal;
- versão publicada pode ser escolhida;
- versão arquivada continua sendo resolvida para Mesas historicamente vinculadas;
- entidade que acompanha a publicação atual usa a publicação atual;
- configuração ausente cai no fallback legado.

---

# Resultado esperado do resolver

Evite várias chamadas independentes para montar uma única ficha ou formulário.

O resolver deve retornar um contexto agregado que informe, conforme a necessidade:

```text
Sistema efetivo
Versão efetiva
Origem da resolução
Mesa, se houver
Acompanha publicação atual
Versão fixada, se houver
Progressão
Atributos
Recursos
Defesas
Configuração racial
Skills
Magias
Tipos de dano
Tipos de defesa
Resultados de dados
Condições
Descanso
Morte
Movimento
Pontos de ação
Categorias e arquétipos de item
Warnings
Fallbacks utilizados
```

A origem da resolução deve ser diagnosticável:

```text
MESA
VERSAO_FIXADA_ENTIDADE
PUBLICACAO_ATUAL_ENTIDADE
SISTEMA_PADRAO
FALLBACK_LEGADO
```

Quando possível, valores resolvidos devem ter proveniência:

```text
SISTEMA
OVERRIDE_MESA
VALOR_EXPLICITO_ENTIDADE
FALLBACK_LEGADO
```

Não espalhe essa precedência em controllers e componentes.

---

# Vínculo das entidades globais

Analise a melhor modelagem para NPCs e itens.

Pode ser:

- campos diretos;
- uma relação específica por entidade;
- uma estrutura genérica;
- outra solução coerente com o projeto.

Uma ideia inicial seria:

```text
EntidadeSistemaVinculo
- TipoEntidade
- IdEntidade
- IdSistema
- IdSistemaVersao opcional
- AcompanharPublicacaoAtual
```

Porém não crie generalização artificial se relações específicas forem mais seguras e tipadas.

Requisitos:

- por padrão, NPC e item usam `ODISSEIA`;
- por padrão, acompanham a publicação atual;
- podem fixar uma versão publicada;
- não podem usar rascunho;
- entidades existentes sem vínculo continuam funcionando;
- não vincular entidades globais automaticamente à Mesa padrão;
- o vínculo não deve regravar os valores da entidade.

---

# SistemaRacaConfig e MesaEntidadeConfig

Essas estruturas têm responsabilidades diferentes e devem permanecer separadas.

## SistemaRacaConfig

Representa a regra oficial da raça em uma versão.

Características:

- pertence a `SistemaVersao`;
- editável somente em rascunho;
- administrada por Admin;
- publicada de forma imutável;
- pode variar entre sistemas e versões;
- fornece defaults e referências.

Campos possíveis:

- vida base;
- estamina base;
- mana base;
- capacidade de carga;
- atributo inicial;
- passivas;
- variantes;
- nível de desbloqueio;
- outras regras raciais.

## MesaEntidadeConfig

Representa apenas a diferença daquela Mesa.

Características:

- pertence a uma Mesa;
- aplicada depois da configuração do Sistema;
- editável pelo proprietário autorizado ou Admin;
- deve guardar preferencialmente apenas diferenças;
- não deve copiar toda a configuração versionada;
- precisa de schema e validação;
- não substitui `SistemaRacaConfig`.

Refatore a estrutura atual, se necessário, para que ela funcione como delta real.

Não implemente agora a interface completa de edição dos overrides da Mesa. Prepare corretamente o backend, contratos e resolução.

Documente:

- o que cada tabela representa;
- quem pode editar;
- em que momento é aplicada;
- como ocorre o fallback.

---

# Não permitir duas fontes editáveis para a mesma regra

Hoje existem valores raciais em:

- `Raca.StatusJson`;
- `SistemaRacaConfig`.

Isso não pode continuar como duas fontes concorrentes.

A direção esperada é:

```text
SistemaRacaConfig
→ fonte mecânica versionada

Raca.StatusJson
→ fallback legado temporário
```

A tela de Raça pode continuar permitindo o acesso à configuração mecânica, mas deve editar a mesma `SistemaRacaConfig` utilizada pela tela de Sistema.

Possíveis fluxos:

1. selecionar Sistema e versão em rascunho na tela de Raça;
2. carregar a configuração racial daquela versão;
3. editar e salvar a mesma configuração;
4. a tela de Sistema exibir o mesmo registro;
5. versão publicada ficar somente leitura;
6. para alterar uma versão publicada, criar ou selecionar um rascunho.

Outra UX pode ser usada se for mais coerente com o código.

O requisito é existir uma única fonte real para a regra.

Não duplique silenciosamente a escrita em `StatusJson` e `SistemaRacaConfig`.

Preserve `Raca.StatusJson` somente para fallback e compatibilidade até a migração ser segura.

---

# Uso prático da configuração racial

## Criação de personagem jogador

Ao selecionar ou trocar a raça durante a criação:

1. resolver o Sistema pela Mesa;
2. resolver `SistemaRacaConfig`;
3. aplicar `MesaEntidadeConfig`, se houver;
4. usar os valores como defaults;
5. preencher vida, mana, estamina, capacidade e outros defaults;
6. salvar os valores na ficha;
7. depois de salva, não sobrescrever automaticamente os campos editáveis.

## Edição de personagem

Ao editar uma ficha existente:

- não substituir valores salvos;
- mostrar a referência atual do Sistema quando útil;
- exibir warnings quando estiver fora da referência;
- continuar utilizando as regras de background da versão da Mesa.

## NPC

NPC sem Mesa:

- utiliza vínculo explícito, quando houver;
- senão usa a publicação atual de `ODISSEIA`;
- mantém `StatusJson` como valores reais;
- recebe warnings, limites e catálogos do Sistema.

---

# Progressão funcional

Substitua o uso direto da progressão fixa pelo Sistema resolvido.

Revise:

- `characterProgression.ts`;
- `PersonagemPage`;
- cards de personagem;
- formulários;
- services;
- nível;
- XP atual;
- XP necessário;
- nível máximo;
- excedente;
- marcos;
- recompensas;
- ultimate;
- proficiências;
- skills;
- magias.

Comportamento:

```text
Personagem com Mesa
→ progressão da versão da Mesa

NPC com vínculo
→ progressão da versão resolvida

NPC sem vínculo
→ publicação atual de ODISSEIA

Configuração indisponível
→ curva legada
```

O XP atual continua pertencendo ao personagem.

Devem vir do Sistema:

- XP necessário;
- nível máximo;
- progressão;
- marcos;
- desbloqueios;
- recompensas;
- limites.

Quando a versão efetiva muda, essas regras de background mudam imediatamente, sem reescrever o XP atual.

---

# Atributos, recursos e defesas dinâmicos

Faça os consumidores seguros utilizarem as configurações do Sistema.

Revise formulários e páginas para consumir:

- atributos principais e secundários;
- recursos;
- defesas;
- valores mínimos e máximos conhecidos;
- códigos;
- labels;
- ordem;
- descrições;
- regras;
- limites.

Evite listas duplicadas no frontend.

Os JSONs das fichas continuam guardando os valores reais por código.

Requisitos:

- atributos novos podem ser exibidos;
- atributos removidos não devem destruir valores históricos;
- atributos desconhecidos devem continuar legíveis;
- formulários precisam de fallback;
- não apagar propriedades legadas;
- não reescrever uma ficha ao carregar.

---

# Skills, magias, dados, danos, defesas e condições

Conecte os consumidores ao catálogo da versão sempre que for seguro.

Inclua:

- limite de skills;
- limite de ultimate;
- limite de magias;
- tipos de magia;
- tipos de dano;
- tipos de defesa;
- resultados de dados;
- condições;
- descanso;
- morte;
- custos;
- ações;
- movimento.

Remova hardcodes somente quando:

- o Sistema padrão possuir os dados;
- entidades antigas continuarem funcionando;
- o fallback estiver testado;
- o frontend e backend consumirem a mesma regra.

Documente os hardcodes restantes.

---

# Configuração de itens no Sistema

Não crie uma configuração versionada completa para cada item individual.

O item continua sendo a fonte de verdade de seus valores:

```text
Item.AtributosJson
→ dano real
→ peso real
→ munição real
→ defesa real
→ bônus reais
→ slots reais
→ efeitos reais
```

O Sistema deve fornecer estruturas gerais de referência.

Modele algo equivalente a:

```text
SistemaTipoItem
SistemaCategoriaItem
SistemaArquetipoItem
SistemaRegraItem
SistemaFaixaItem
```

Não é obrigatório utilizar esses nomes nem criar todas essas tabelas.

A modelagem deve suportar hierarquia e herança de referência:

```text
Tipo: Arma
→ Categoria: Arma de fogo
   → Arquétipo: Pistola
```

Exemplos de configuração:

```text
Arma de fogo
→ dano máximo conhecido geral
→ alcances permitidos
→ munição
→ ataques por turno
→ tipos de dano
```

```text
Pistola
→ faixa de dano específica
→ capacidade de munição conhecida
→ ataques por turno conhecidos
→ campos aplicáveis
```

```text
Prótese de braço
→ partes do corpo
→ lados permitidos
→ materiais
→ slots de modificação
→ slots de lágrima
→ bônus conhecidos
→ necessidade de amputação
```

Analise o Livro do Jogador e os modelos atuais para cobrir:

- armas de fogo;
- armas brancas;
- corpo a corpo;
- arcos e crossbows;
- armas pesadas;
- dano em área;
- dano contínuo;
- alcance;
- munição;
- ataques por turno;
- modificações;
- upgrades;
- trajes;
- proteções;
- implantes;
- próteses;
- materiais;
- Lágrimas.

Substitua gradualmente as escalas fixas do React pela configuração versionada.

Mantenha fallback para constantes antigas.

---

# Extrapolação permitida com warning

O Sistema fornece referências e limites conhecidos, mas não deve impedir o mestre de criar exceções.

Exemplos:

```text
Nível máximo do Sistema = 20
NPC criado com nível = 25
```

```text
Dano máximo conhecido de pistola = 300
Item criado com dano = 500
```

```text
Máximo recomendado de slots = 3
Prótese criada com 5 slots
```

Esses valores devem ser aceitos quando o usuário possuir a permissão necessária.

Diferencie:

```text
ERRO
→ valor inválido, estrutura quebrada ou dado impossível

WARNING
→ valor válido, porém fora da referência do Sistema
```

O warning deve ser calculado no backend e exibido no frontend.

Exemplo:

```text
Valor acima da referência do Sistema
Referência: 300
Valor informado: 500
```

Não dependa apenas da validação visual.

Não altere permissões de jogadores comuns.

---

# Formulários de NPC, raça e item

Atualize os formulários aplicáveis para mostrar, conforme o contexto:

- Sistema efetivo;
- versão efetiva;
- publicação atual;
- versão fixada;
- opção `Acompanhar publicação atual`;
- origem da resolução;
- referência do Sistema;
- valor explícito;
- warnings;
- fallback utilizado.

Defaults:

```text
NPC global
→ ODISSEIA
→ acompanhar publicação atual = true

Item global
→ ODISSEIA
→ acompanhar publicação atual = true

Personagem jogador
→ herda a versão da Mesa
```

Não exiba controles redundantes quando o contexto for herdado e não puder ser alterado.

O acompanhamento automático altera a resolução das regras, não os valores persistidos.

---

# Patch notes automáticos

Ao publicar uma nova versão, gere automaticamente um patch note estruturado.

Compare preferencialmente:

```text
Versão base
→ nova versão
```

Se não existir versão base, utilize a publicação anterior quando isso for coerente.

Uma primeira versão pode ser registrada como versão inicial.

O patch note deve possuir:

- Sistema;
- versão anterior;
- nova versão;
- data;
- título;
- resumo;
- grupos;
- alterações;
- módulo afetado;
- entidade afetada;
- valor anterior;
- valor novo;
- tipo da alteração;
- nível de impacto;
- dados suficientes para visualização futura.

Exemplo:

```text
RAÇAS

Orc
Vida base: 1.000 → 1.500
Estamina base: 50 → 75

PROGRESSÃO

Nível máximo: 20 → 25
```

Não salve apenas texto formatado.

Mantenha um diff estruturado e imutável.

Ele será reutilizado por:

- consulta administrativa;
- prévia de migração;
- tela pública de novidades futura;
- auditoria;
- diagnóstico.

Pode existir:

- diff técnico automático;
- título e resumo editáveis pelo administrador.

A publicação deve ser transacional.

Se a geração ou persistência obrigatória do diff falhar, não publique parcialmente.

Não implemente agora a tela pública de novidades.

Adicione ao menos uma visualização administrativa do patch note.

---

# Prévia de migração de Mesa

A criação completa de Mesas no frontend continua fora do escopo.

Porém a migração existente deve ganhar preview e confirmação.

Fluxo:

```text
Solicitar prévia
→ comparar versões
→ analisar entidades da Mesa
→ mostrar alterações
→ confirmar explicitamente
→ alterar IdSistemaVersao
```

A prévia deve identificar:

- atributos adicionados;
- atributos removidos;
- recursos adicionados;
- recursos removidos;
- nível máximo alterado;
- curva de XP alterada;
- marcos alterados;
- raças incompatíveis;
- skills acima do limite;
- magias acima do limite;
- condições removidas;
- tipos de dano removidos;
- tipos de defesa alterados;
- itens sem arquétipo no destino;
- valores acima da nova referência;
- overrides incompatíveis;
- fallbacks que seriam utilizados.

Exemplo resumido:

```text
RAÇAS

Orc
Vida base: 1.000 → 1.500

PROGRESSÃO

Nível máximo: 20 → 25

AVISOS DA MESA

2 personagens possuem mais skills que o novo limite.
1 item não possui arquétipo na versão de destino.
```

A prévia deve reutilizar o patch note quando possível, mas também analisar os dados reais da Mesa.

## Ao confirmar a migração

Mudar:

- a versão da Mesa;
- as regras resolvidas em background.

Não reescrever:

- vida atual;
- vida máxima salva;
- mana atual;
- mana máxima salva;
- estamina atual;
- estamina máxima salva;
- XP atual;
- atributos distribuídos;
- skills escolhidas;
- magias aprendidas;
- inventário;
- valores explícitos.

Depois da migração, passam a valer imediatamente:

- XP necessário;
- nível máximo;
- marcos;
- morte;
- fadiga;
- condições;
- limites;
- catálogos;
- testes;
- regras de background da nova versão.

Se algum dado técnico denormalizado precisar ser atualizado, faça isso apenas quando houver proveniência segura e documente.

---

# Auto update de entidades globais

## Quando ativo

```text
AcompanharPublicacaoAtual = true
```

A entidade passa a ser interpretada pela publicação atual do Sistema.

Isso atualiza automaticamente:

- progressão aplicável;
- limites;
- catálogos;
- validações;
- condições;
- morte;
- fadiga;
- movimento;
- dados;
- referências de item;
- outras regras de background.

Não executa uma regravação física dos campos explícitos.

## Quando desativado

A entidade deve:

- possuir uma versão publicada fixada;
- continuar utilizando essa versão;
- informar que existe uma publicação mais recente;
- permitir mudança consciente de versão;
- não usar rascunho.

## Mesas

Mesas não acompanham automaticamente a publicação atual.

A Mesa continua presa à versão escolhida até o proprietário ou Admin:

1. solicitar preview;
2. revisar;
3. confirmar a migração.

---

# Guard explícito do Management

Adicione proteção explícita para `/management` e rotas filhas.

Requisitos:

- validar autenticação;
- validar role administrativa real;
- reutilizar claims existentes;
- não usar `VITE_ADMIN_EMAIL`;
- usuário anônimo vai para login;
- usuário autenticado sem permissão recebe acesso negado ou página de erro;
- não renderizar o conteúdo administrativo antes de concluir a verificação;
- evitar flash de conteúdo;
- manter as policies do backend.

O backend continua sendo a fonte definitiva da autorização.

---

# Backend

Implemente o necessário, podendo incluir:

- novas entidades;
- ajustes em entidades existentes;
- migrations;
- FKs;
- índices;
- constraints;
- DTOs;
- resolvers;
- validators;
- services;
- repositories;
- controllers;
- cache seguro por versão;
- vínculos de NPC e item;
- catálogos de item;
- warnings tipados;
- patch notes;
- diff de versões;
- preview de migração;
- autorização;
- testes.

Requisitos:

- não aceitar JSON arbitrário sem validação;
- evitar N+1;
- evitar múltiplas consultas independentes por tela;
- preservar versionamento;
- preservar imutabilidade;
- preservar fallback;
- nenhuma migration destrutiva sem necessidade.

Considere expor um DTO agregado de contexto resolvido.

---

# Frontend

Atualize o necessário:

- models;
- services;
- hooks;
- providers;
- rotas;
- guard;
- formulários;
- páginas;
- progressão;
- cards;
- ManagementSystem;
- visualização de patch notes;
- preview de migração;
- warnings;
- estados de loading;
- estados de erro;
- estados de fallback.

Reutilize:

- componentes de input;
- selects;
- toggles;
- tabelas;
- cards;
- HUD corners;
- `TitleGlitch`;
- modais;
- rich text;
- loaders;
- sistema de tema;
- sistema de neon;
- breakpoints;
- padrões responsivos.

Evite componentes duplicados.

O usuário deve conseguir entender:

- qual Sistema está ativo;
- qual versão;
- de onde a regra veio;
- se acompanha a publicação;
- qual é a referência;
- qual é o valor explícito;
- se existe warning;
- se foi usado fallback.

---

# Compatibilidade

Não apague:

- `StatusJson`;
- `AtributosJson`;
- personagens;
- raças;
- itens;
- Mesas;
- configurações;
- versões;
- valores legados;
- seeds existentes.

Preserve fallback durante a transição.

Faça backfill somente quando a correspondência for segura.

Seeds devem continuar idempotentes.

Não altere silenciosamente versões já publicadas.

Se a base publicada atual não possuir dados suficientes, avalie:

- criar nova versão;
- complementar via migration técnica documentada;
- manter fallback.

Respeite a imutabilidade.

---

# Fora do escopo desta entrega

Não implementar agora:

- tela pública de novidades;
- criação completa de Mesa no frontend;
- gerenciamento completo de jogadores;
- editor completo de overrides de Mesa;
- engine universal de combate;
- interpretação de texto livre;
- migração automática de Mesas;
- reescrita automática de fichas;
- remoção total dos fallbacks;
- fork de Sistema por usuário comum.

Pode preparar contratos e estruturas necessárias, mas não desviar o foco.

---

# Testes obrigatórios

Execute:

```text
dotnet build
npm run build
git diff --check
```

Adicione testes automatizados quando a arquitetura atual permitir.

## Resolver

Testar:

- personagem com Mesa;
- Mesa em versão publicada antiga;
- Mesa em versão arquivada;
- NPC acompanhando publicação atual;
- NPC com versão fixada;
- NPC sem vínculo;
- item acompanhando publicação atual;
- item com versão fixada;
- sistema padrão;
- configuração ausente;
- fallback legado;
- rascunho rejeitado;
- origem e proveniência corretas.

## Raça

Testar:

- `SistemaRacaConfig` como fonte;
- `Raca.StatusJson` como fallback;
- rascunho editável;
- publicação somente leitura;
- troca de raça durante criação;
- override da Mesa;
- ficha existente preservada;
- defaults atualizados para novas fichas.

## Progressão

Testar:

- XP necessário dinâmico;
- nível máximo dinâmico;
- excedente;
- marcos;
- recompensas;
- personagem com Mesa;
- NPC sem Mesa;
- mudança de regra sem alteração do XP atual;
- fallback legado.

## Itens

Testar:

- tipo;
- categoria;
- arquétipo;
- referência geral;
- referência específica;
- item dentro da faixa;
- item acima da faixa;
- warning;
- valor excepcional preservado;
- fallback para constants;
- arma;
- traje;
- implante/prótese.

## Publicação

Testar:

- patch note automático;
- diff por módulo;
- valor anterior e novo;
- versão inicial;
- publicação transacional;
- nenhuma entidade regravada;
- imutabilidade do patch.

## Migração de Mesa

Testar:

- preview;
- comparação de versões;
- análise de personagens;
- warnings;
- confirmação;
- autorização;
- alteração da versão;
- manutenção dos valores explícitos;
- mudança das regras de background;
- cancelamento sem alteração.

## Guard

Testar:

- anônimo;
- usuário comum;
- Admin;
- acesso direto por URL;
- refresh;
- ausência de flash administrativo.

## Regressão

Testar:

- criação e edição de personagem jogador;
- criação e edição de NPC;
- criação e edição de raça;
- criação e edição de item;
- troca de raça;
- PersonagemPage;
- ItemPage;
- cards;
- Wiki;
- Management;
- sistema padrão;
- dados legados.

## Responsividade

Testar:

- desktop;
- tablet;
- mobile;
- selects de Sistema;
- warnings;
- patch notes;
- preview de migração;
- tabelas;
- modais;
- formulários.

---

# Documentação obrigatória

Atualize:

```text
PROJECT_GUIDE
docs/RPG_SYSTEMS.md
docs/RPG_SYSTEMS_QA.md
```

Documente:

- matriz de fontes;
- regra vs estado;
- defaults;
- valores explícitos;
- resolver;
- proveniência;
- vínculos;
- auto update;
- versão fixada;
- progressão;
- raça;
- itens;
- warnings;
- patch notes;
- preview;
- migração;
- fallbacks;
- hardcodes restantes;
- limitações;
- próximos passos.

---

# Liberdade de implementação

Este documento representa o planejamento inicial.

Você pode:

- alterar nomes;
- adaptar a modelagem;
- reutilizar estruturas;
- refatorar código ainda não utilizado;
- evitar tabelas desnecessárias;
- dividir internamente a execução;
- criar endpoints diferentes;
- escolher outra UX;
- implementar uma solução mais segura e coerente.

Porém, preserve obrigatoriamente:

1. o Sistema deve passar a ser consumido de verdade;
2. regras de background mudam conforme a versão efetiva;
3. estado e valores explícitos não são sobrescritos;
4. `SistemaRacaConfig` e `MesaEntidadeConfig` têm responsabilidades separadas;
5. não existem duas fontes editáveis para a mesma regra;
6. entidades globais se vinculam a Sistema, não à Mesa padrão;
7. Mesas permanecem em versão fixa até migração consciente;
8. entidades globais podem acompanhar a publicação atual;
9. valores excepcionais são permitidos com warning;
10. itens reais mantêm seus valores e recebem referências do Sistema;
11. publicação gera patch note estruturado;
12. migração possui preview;
13. hardcodes permanecem como fallback até substituição segura;
14. `/management` possui guard explícito;
15. criação completa de Mesas continua fora do escopo.

---

# Relatório final esperado

Ao concluir, informe:

1. branch criada;
2. arquitetura final;
3. diferenças em relação a este planejamento;
4. entidades e migrations;
5. resolver e precedência;
6. proveniência das regras;
7. vínculos de NPC e item;
8. funcionamento de auto update;
9. diferença entre regra atualizada e valor preservado;
10. `SistemaRacaConfig`;
11. `MesaEntidadeConfig`;
12. fonte dos valores raciais;
13. progressão integrada;
14. atributos e recursos integrados;
15. catálogos integrados;
16. itens, categorias e arquétipos;
17. warnings;
18. patch notes;
19. preview de migração;
20. valores preservados nas fichas;
21. endpoints;
22. telas e componentes;
23. guard do Management;
24. testes;
25. hardcodes restantes;
26. fallbacks;
27. riscos;
28. próximos passos.
