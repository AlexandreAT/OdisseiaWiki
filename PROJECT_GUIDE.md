# OdisseiaWiki — Guia Técnico, Arquitetural e de Desenvolvimento

## 1. Propósito deste documento

Este documento apresenta a visão geral do projeto **OdisseiaWiki**, sua proposta de produto, arquitetura, organização de código, stack tecnológica, práticas de desenvolvimento, padrões esperados e roadmap de evolução.

Ele deve servir como referência para:

- Desenvolvedores que entrem no projeto;
- Ferramentas de inteligência artificial usadas para implementar funcionalidades;
- Revisões arquiteturais;
- Planejamento de novas versões;
- Manutenção e evolução do código;
- Padronização de decisões técnicas;
- Redução de inconsistências entre telas, hooks, services e camadas do backend.

Este documento não substitui o README principal. O README deve continuar sendo uma apresentação resumida do projeto, com instruções de instalação e execução. Este arquivo deve funcionar como um guia aprofundado de desenvolvimento.

---

# 2. Visão geral do projeto

O **OdisseiaWiki** é um projeto pessoal criado para registrar, organizar, apresentar e futuramente operar o universo do RPG de mesa **Odisseia**.

O sistema começou como uma wiki de conteúdo, mas foi concebido para evoluir progressivamente até se tornar uma plataforma completa para gerenciamento de campanhas, personagens, fichas, itens, regras e automações baseadas em inteligência artificial.

O projeto possui duas dimensões principais:

## 2.1. Enciclopédia do universo

A aplicação deve permitir registrar e consultar informações como:

- Personagens;
- Raças;
- Cidades;
- Itens;
- Facções;
- Locais;
- Eventos;
- Organizações;
- Elementos de lore;
- Relações entre entidades;
- Galerias de imagens;
- Textos ricos;
- Páginas compostas por blocos;
- Referências cruzadas.

A experiência desejada é semelhante a uma wiki de universo ficcional, com navegação entre entidades, relações contextuais e páginas públicas de leitura.

## 2.2. Ferramenta de RPG

Em uma fase posterior, a aplicação também deve funcionar como sistema prático para sessões de RPG, oferecendo:

- Fichas interativas;
- Inventário funcional;
- Status dinâmicos;
- Pontos de vida, mana e estamina;
- Atributos;
- Condições;
- Proficiências;
- Passivas;
- Skills;
- Magias;
- Ultimates;
- Implantes e próteses;
- Testes de atributo;
- Rolagem de dados;
- Vínculo entre jogadores e personagens;
- Campanhas e mesas;
- Histórico de alterações;
- Configurações próprias por mesa.

## 2.3. Ferramenta baseada em IA

Em uma fase futura, o sistema deve permitir que uma IA conheça:

- O livro de regras;
- A ficha do personagem;
- A lore do mundo;
- O contexto da campanha;
- O estado atual do personagem;
- Os itens;
- As relações;
- Os acontecimentos anteriores.

Com isso, a IA poderá atuar como narrador ou assistente de mestre.

---

# 3. Objetivo atual do projeto

O foco atual é consolidar uma base técnica confiável para a primeira versão pública utilizável.

A prioridade não é criar imediatamente todas as automações de RPG. A prioridade é construir uma wiki consistente, navegável, modular e fácil de evoluir.

O sistema deve chegar a um ponto em que:

- Os principais tipos de entidade possam ser criados, editados, listados e excluídos;
- As entidades possam ser relacionadas entre si;
- As páginas públicas sejam visualmente completas;
- O conteúdo possa ser organizado por blocos;
- O gerenciamento seja estável;
- O código permita crescimento sem depender de grandes reescritas;
- O projeto possa ser mostrado sem parecer um protótipo incompleto.

---

# 4. Roadmap do produto

## 4.1. Alpha — Conteúdo e estrutura

### Objetivo

Deixar a Wiki funcional para uso interno.

### Escopo

- CRUD de Personagens;
- CRUD de Raças;
- CRUD de Cidades;
- CRUD de Itens;
- Sistema de páginas Wiki;
- Editor Rich Text;
- Blocos dinâmicos;
- Galeria de imagens;
- Upload de assets;
- Busca;
- Tags;
- Sistema de relações entre entidades;
- Página pública de leitura.

### Característica da fase

Nesta etapa, o autor do projeto é praticamente o único usuário. A prioridade é funcionalidade, estrutura e capacidade de cadastrar conteúdo.

---

## 4.2. Beta — Experiência do usuário

### Objetivo

Transformar a aplicação em algo agradável e navegável.

### Escopo

- Melhorias no layout das páginas;
- Melhorias visuais nas fichas;
- Cards de entidades relacionadas;
- Navegação entre páginas;
- Capa e background dinâmicos;
- Responsividade;
- Performance;
- Busca mais eficiente;
- Correção de bugs;
- Padronização visual;
- Melhor experiência em formulários;
- Melhor experiência de leitura.

### Estado atual

O projeto está próximo desta fase ou já entrando nela. Muitas estruturas principais existem e o foco começa a migrar da simples capacidade de cadastrar dados para qualidade da experiência.

---

## 4.3. V1 — Wiki completa

### Objetivo

Entregar uma enciclopédia funcional do universo Odisseia.

### Escopo esperado

- Todas as principais entidades conectadas;
- Sistema de relações totalmente funcional;
- Páginas completas de lore;
- Referências cruzadas;
- Navegação no estilo fandom/wiki;
- Página de personagem visualmente completa;
- Página de raça;
- Página de cidade;
- Página de item;
- Sistema de busca consistente;
- Tags funcionais;
- Galerias de imagens;
- SEO básico;
- Deploy estável;
- Tratamento de erros;
- Estados de carregamento;
- Responsividade adequada;
- Interface suficientemente madura para apresentação pública.

### Critério de conclusão

A V1 deve poder ser mostrada para outras pessoas sem parecer uma aplicação inacabada.

---

## 4.4. V1.2 — Sistema de RPG

### Objetivo

Evoluir a aplicação de enciclopédia para ferramenta prática de RPG.

### Escopo

- Fichas interativas;
- Inventário funcional;
- Status dinâmicos;
- Testes de atributo;
- Sistema de rolagem;
- Vínculo entre personagens e jogadores;
- Registro de campanhas;
- Histórico de alterações;
- Mesas;
- Configurações específicas por mesa;
- Passivas;
- Proficiências;
- Skills;
- Magias;
- Ultimates;
- Condições;
- Próteses;
- Sistema de progressão.

---

## 4.5. V2 — Inteligência artificial

### Objetivo

Criar um narrador ou assistente automatizado integrado ao sistema.

### Escopo

- IA recebe ficha do personagem;
- IA recebe regras do sistema;
- IA recebe lore do cenário;
- IA recebe o contexto da campanha;
- IA gera missões curtas;
- IA interpreta ações do jogador;
- IA solicita testes;
- IA lê resultados;
- IA altera status;
- IA gera recompensas;
- IA acompanha progresso;
- IA registra mudanças;
- IA respeita regras e conteúdo configurados por mesa.

### Diferencial esperado

Esta fase deve transformar o projeto em algo único, unindo wiki, sistema de RPG e automação narrativa.

---

# 5. Stack tecnológica

## 5.1. Frontend

O frontend utiliza:

- TypeScript;
- React;
- Vite;
- React Router DOM;
- Axios;
- Redux;
- Styled Components;
- Emotion em partes legadas ou específicas;
- MUI DataTables;
- React Hot Toast;
- React Toastify;
- jwt-decode.

## 5.2. Backend

O backend utiliza:

- .NET 8;
- C#;
- ASP.NET Core;
- Entity Framework Core;
- Pomelo Entity Framework Core para MySQL;
- JWT;
- BCrypt;
- Google authentication;
- Swagger / OpenAPI;
- MySQL.

## 5.3. Infraestrutura e ferramentas

O projeto pode utilizar:

- Git;
- GitHub;
- Docker;
- MySQL;
- phpMyAdmin;
- Postman;
- Swagger;
- Vite;
- npm;
- .NET CLI;
- Entity Framework CLI.

---

# 6. Princípios arquiteturais

O projeto deve preservar os seguintes princípios:

## 6.1. Separação de responsabilidades

Cada camada deve possuir um propósito claro.

- Controller recebe a requisição;
- Service coordena regras de negócio;
- Repository acessa dados;
- DTO representa contratos de entrada e saída;
- Model representa entidades persistidas;
- Hook controla lógica de tela;
- Component renderiza interface;
- Service do frontend comunica com a API;
- Arquivos de style concentram estilos.

## 6.2. Reutilização

Antes de criar um componente novo, deve-se procurar se já existe:

- InputText;
- Select;
- Search;
- CheckSelect;
- DataTable;
- Modal;
- Editor Rich Text;
- Upload de imagem;
- Galeria;
- Lista horizontal;
- Cards;
- Componentes de feedback;
- Loading;
- Empty state;
- Componentes de relação entre entidades.

## 6.3. Baixo acoplamento

Telas não devem conhecer detalhes desnecessários da API.

Controllers não devem conter regras de negócio.

Repositories não devem conter regras de apresentação.

Hooks não devem conter marcação JSX.

Componentes visuais não devem realizar acesso direto à API.

## 6.4. Tipagem forte

Evitar `any` sempre que for possível.

Criar interfaces e types para:

- Payloads;
- Respostas;
- Estados;
- Props;
- Objetos aninhados;
- Atributos de entidades;
- Dados de formulários;
- Configurações de tabelas.

## 6.5. Evolução incremental

O projeto não deve ser reescrito desnecessariamente.

Novas implementações devem aproveitar a estrutura atual e evoluí-la.

---

# 7. Arquitetura do backend

A estrutura geral do backend segue uma cadeia semelhante a:

```text
Controller
    ↓
Interface de Service
    ↓
Service
    ↓
Interface de Repository
    ↓
Repository
    ↓
DbContext / Entity Framework
    ↓
Banco de dados
```

Além disso, existem pastas auxiliares como:

```text
Models
DTOs
Repositories
Interfaces
Services
Controllers
Data
Migrations
Helpers
Configurations
```

---

# 8. Controllers

Os Controllers são responsáveis por:

- Receber requisições HTTP;
- Validar parâmetros básicos;
- Obter informações de autenticação quando necessário;
- Chamar a interface de Service;
- Retornar respostas HTTP;
- Retornar códigos adequados;
- Tratar respostas de sucesso e erro.

Controllers não devem:

- Conter consultas diretas ao DbContext;
- Implementar regras de negócio complexas;
- Serializar manualmente grandes estruturas sem necessidade;
- Repetir lógica entre endpoints;
- Conhecer detalhes internos de persistência.

Exemplo de responsabilidade correta:

```text
POST /personagem
→ recebe DTO
→ chama service
→ retorna resultado
```

---

# 9. Interfaces de Service

As interfaces de Service definem contratos de negócio.

Elas devem:

- Descrever operações disponíveis;
- Facilitar injeção de dependência;
- Permitir testes;
- Reduzir acoplamento entre Controllers e implementações;
- Manter os Controllers independentes das classes concretas.

Exemplos:

```text
IPersonagemService
IRacaService
ICidadeService
IItemService
IMesaService
```

---

# 10. Services

Os Services representam a camada principal de regras de negócio.

Responsabilidades:

- Validar regras;
- Coordenar repositories;
- Mapear DTOs;
- Serializar e desserializar JSONs;
- Aplicar permissões;
- Validar relações;
- Verificar existência de entidades;
- Garantir integridade da operação;
- Controlar regras específicas de mesa;
- Organizar fluxos de criação e edição.

Os Services não devem:

- Implementar SQL manual sem necessidade;
- Renderizar respostas visuais;
- Conhecer componentes do frontend;
- Misturar lógica de infraestrutura com regra de negócio;
- Duplicar funções que já existem em helpers ou mappers.

---

# 11. Interfaces de Repository

As interfaces de Repository definem contratos de persistência.

Elas devem permitir operações como:

- Buscar por ID;
- Listar;
- Adicionar;
- Atualizar;
- Remover;
- Buscar com filtros;
- Buscar relações;
- Verificar existência;
- Carregar navegações.

Exemplos:

```text
IPersonagemRepository
IRacaRepository
IItemRepository
ICidadeRepository
```

---

# 12. Repositories

Repositories são responsáveis por acesso ao banco.

Responsabilidades:

- Utilizar DbContext;
- Executar consultas;
- Usar Include quando necessário;
- Aplicar filtros;
- Persistir dados;
- Trabalhar com Entity Framework;
- Controlar tracking quando necessário;
- Evitar carregar dados desnecessários;
- Retornar entidades ou projeções para o Service.

Repositories não devem:

- Conter regra de negócio;
- Conhecer DTOs de tela sem necessidade;
- Criar mensagens de interface;
- Decidir comportamento visual;
- Fazer serialização de conteúdo que pertence ao Service.

---

# 13. Models

Models representam entidades persistidas.

Exemplos:

- Personagem;
- PersonagemJogador;
- PersonagemBase;
- Raça;
- Cidade;
- Item;
- Mesa;
- MesaUsuario;
- Passiva;
- Proficiência;
- Relacionamentos.

Boas práticas:

- Usar DataAnnotations quando apropriado;
- Definir chaves;
- Definir relações;
- Inicializar coleções;
- Manter navegações consistentes;
- Evitar lógica de negócio extensa dentro do model;
- Separar campos persistidos de campos calculados;
- Usar JSON quando o conteúdo for altamente variável e específico da entidade;
- Usar tabelas normalizadas quando o dado for reutilizável ou relacional.

---

# 14. DTOs

DTOs representam contratos da API.

Eles devem:

- Definir o formato esperado pelo frontend;
- Evitar expor diretamente toda a entidade do banco;
- Tipar estruturas JSON;
- Separar criação, edição e leitura quando necessário;
- Ser compatíveis com o frontend;
- Evitar propriedades vagas sem necessidade;
- Utilizar tipos concretos quando a estrutura for conhecida.

Exemplo:

```text
PersonagemDto
PersonagemJogadorDto
RacaDto
ItemDto
```

Quando uma estrutura possuir formato bem definido, deve-se preferir classes específicas em vez de `object`.

---

# 15. Entity Framework

O projeto utiliza Entity Framework Core.

## 15.1. Fluxo esperado

1. Criar ou alterar models;
2. Atualizar DbSets;
3. Configurar relacionamentos apenas quando as convenções não forem suficientes;
4. Criar migration;
5. Revisar a migration;
6. Aplicar a migration;
7. Validar o banco;
8. Testar endpoints.

Comandos comuns:

```bash
dotnet ef migrations add NomeDaMigration
dotnet ef database update
```

## 15.2. Cuidados

- Revisar migrations antes de aplicar;
- Não editar migration sem entender o impacto;
- Evitar duplicação de tabelas;
- Cuidar com herança de entidades;
- Não registrar classes abstratas sem chave como entidades independentes;
- Evitar relacionamentos ambíguos;
- Definir DeleteBehavior quando necessário;
- Cuidar com FKs opcionais;
- Não confiar cegamente nas convenções quando houver duas relações para a mesma entidade.

---

# 16. Arquitetura do frontend

A estrutura do frontend deve organizar funcionalidades por domínio e por tela.

Pastas principais citadas no projeto:

```text
Hub
Management
Login
Home
Wiki
services
Generic
```

Essas pastas devem representar áreas claras da aplicação.

---

# 17. Hub

A área Hub funciona como ponto central do usuário.

Pode concentrar:

- Acesso às mesas;
- Personagens do usuário;
- Navegação para gerenciamento;
- Conteúdos pessoais;
- Atalhos;
- Resumos;
- Seleção de contexto.

A lógica de negócio desta área deve permanecer em hooks próprios.

---

# 18. Management

A área Management concentra telas administrativas e de gerenciamento.

Exemplos:

- Criar personagem;
- Editar personagem;
- Criar raça;
- Editar raça;
- Criar cidade;
- Editar cidade;
- Criar item;
- Editar item;
- Organizar páginas;
- Configurar relações;
- Gerenciar personagens de jogadores;
- Configurar mesa.

Essa área deve:

- Reutilizar formulários;
- Reutilizar tabelas;
- Reutilizar modais;
- Evitar telas duplicadas de criação e edição;
- Centralizar regras de formulário em hooks;
- Manter componentes especializados por entidade.

---

# 19. Login

A área Login concentra:

- Autenticação;
- Cadastro;
- Login com Google;
- Recuperação de sessão;
- Validação de token;
- Redirecionamento;
- Mensagens de erro;
- Estado de autenticação.

A UI não deve acessar diretamente detalhes de armazenamento de token sem passar pelas abstrações do projeto.

---

# 20. Home

A Home apresenta a aplicação.

Pode conter:

- Introdução;
- Acesso à wiki;
- Destaques;
- Últimos conteúdos;
- Personagens em destaque;
- Cidades;
- Raças;
- Chamadas para navegação.

Deve ter foco em experiência e apresentação.

---

# 21. Wiki

A área Wiki concentra a leitura pública do conteúdo.

Pode conter:

- Página de personagem;
- Página de raça;
- Página de cidade;
- Página de item;
- Páginas de lore;
- Busca;
- Tags;
- Relações;
- Galeria;
- Navegação cruzada;
- Breadcrumbs;
- Referências.

A Wiki deve priorizar leitura, navegação e clareza.

---

# 22. Services do frontend

A pasta `services` deve concentrar comunicação com o backend.

Responsabilidades:

- Configurar Axios;
- Definir base URL;
- Inserir token;
- Chamar endpoints;
- Tipar requests e responses;
- Tratar erros comuns;
- Centralizar chamadas;
- Evitar chamadas HTTP diretamente em componentes.

Exemplos:

```text
personagemService
racaService
cidadeService
itemService
mesaService
authService
```

---

# 23. Generic

A pasta Generic deve conter componentes reutilizáveis.

Exemplos:

- InputText;
- Select;
- Search;
- CheckSelect;
- TextArea;
- DataTable;
- Modal;
- RichTextEditor;
- RichTextCellEditor;
- ImageUploader;
- Galeria;
- HorizontalList;
- Loading;
- Button;
- ConfirmDialog;
- EmptyState;
- Pagination;
- Tabs.

Regras:

- Componentes genéricos não devem depender de regras específicas de uma entidade;
- Devem receber props;
- Devem ser reutilizáveis;
- Devem possuir tipagem;
- Devem possuir estilos separados;
- Devem tratar estados básicos;
- Devem permitir customização por props.

---

# 24. Organização por componente

Todo componente JSX/TSX deve possuir sua própria pasta.

Exemplo:

```text
CharacterRoleplayForm/
    CharacterRoleplayForm.tsx
    CharacterRoleplayForm.style.ts
    CharacterRoleplayForm.types.ts
    useCharacterRoleplayForm.ts
    index.ts
```

Nem todos os arquivos são obrigatórios em todos os componentes, mas essa é a estrutura esperada quando houver lógica, estilos e tipos próprios.

## 24.1. Arquivo principal

Responsável pela renderização.

Não deve:

- Conter estilos inline;
- Conter CSS;
- Conter lógica extensa;
- Realizar chamadas HTTP diretas;
- Misturar regras complexas com JSX.

## 24.2. Arquivo de style

Todo estilo deve ficar em arquivo separado.

Usar Styled Components.

Não deixar:

- Tags HTML estilizadas diretamente no JSX;
- Objetos de estilo inline;
- CSS solto no componente;
- Regras de tema espalhadas.

## 24.3. Arquivo de types

Deve conter:

- Props;
- Interfaces;
- Types;
- Estruturas auxiliares.

## 24.4. Hook

Toda lógica relevante deve ficar em hook iniciado com `use`.

Exemplos:

```text
useCreateCharacter
useEditCharacter
useCharacterForm
useItemManager
useWikiSearch
```

---

# 25. Hooks

Hooks são responsáveis por lógica de tela.

Podem conter:

- Estados;
- Efeitos;
- Carregamento;
- Validação;
- Mapeamento;
- Transformação de dados;
- Chamadas aos services;
- Controle de modal;
- Submissão;
- Reset;
- Tratamento de erro;
- Regras do formulário.

Hooks não devem conter JSX.

Hooks devem evitar se tornar arquivos gigantes. Quando necessário, separar em hooks menores.

---

# 26. Styled Components

Todo estilo deve ser mantido separado.

Regras:

- Usar theme e neon quando aplicável;
- Manter responsividade;
- Evitar duplicação;
- Reutilizar wrappers;
- Não usar estilos inline;
- Não misturar estilo com lógica;
- Manter nomes semânticos;
- Não criar tags HTML sem estilo quando já existe componente estilizado adequado.

---

# 27. Padrão de formulários

Formulários devem:

- Usar componentes genéricos;
- Manter estado em hook;
- Tipar payload;
- Mapear dados de edição;
- Tratar campos opcionais;
- Reutilizar seções;
- Mostrar loading;
- Mostrar mensagens;
- Validar antes de enviar;
- Evitar duplicação entre criação e edição;
- Separar roleplay, gameplay, mídia e relações quando fizer sentido.

---

# 28. Padrão de tabelas

Tabelas devem reutilizar DataTable.

Devem suportar quando necessário:

- Busca;
- Edição;
- Adição;
- Remoção;
- Seleção;
- Paginação;
- Colunas configuráveis;
- Custom render;
- Edição de células;
- Tipagem genérica.

Não criar tabelas específicas do zero quando a DataTable existente atender.

---

# 29. Padrão de itens

Itens possuem tipos distintos.

Exemplos:

- Arma;
- Traje;
- Consumível;
- Acessório;
- Outro;
- Implante.

Cada tipo pode possuir um editor próprio de atributos.

Exemplo:

```text
ArmaAtributosForm
TrajeAtributosForm
ImplanteAtributosForm
```

A estrutura principal do item permanece a mesma. O campo `atributos` varia conforme o tipo.

---

# 30. Padrão de JSONs

Algumas entidades utilizam JSON para estruturas variáveis.

Exemplos:

- Status;
- Inventário;
- Skills;
- Magias;
- Ultimate;
- História;
- Galeria;
- Atributos específicos de item.

Boas práticas:

- Tipar o JSON no frontend;
- Tipar no DTO do backend;
- Manter nomes consistentes;
- Evitar `object` quando a estrutura for conhecida;
- Tratar dados antigos;
- Ter valores padrão;
- Não quebrar em caso de null;
- Fazer serialização e desserialização no Service.

---

# 31. SOLID aplicado ao projeto

## 31.1. Single Responsibility

Cada classe deve ter uma responsabilidade.

- Controller controla requisição;
- Service controla negócio;
- Repository controla persistência;
- Hook controla lógica de tela;
- Component controla renderização;
- Style controla aparência.

## 31.2. Open/Closed

O sistema deve permitir adicionar novos tipos de item, entidade ou bloco sem modificar grandes partes do código.

Exemplo:

Adicionar `ImplanteAtributosForm` sem reescrever o sistema de itens.

## 31.3. Liskov Substitution

Implementações devem respeitar contratos.

Services concretos devem poder ser usados por suas interfaces.

Componentes reutilizáveis devem preservar comportamento esperado.

## 31.4. Interface Segregation

Interfaces não devem exigir métodos que a implementação não utiliza.

Evitar Services ou Repositories genéricos enormes.

## 31.5. Dependency Inversion

Controllers dependem de interfaces de Service.

Services dependem de interfaces de Repository.

Componentes dependem de abstrações, não de detalhes internos da API.

---

# 32. Clean Code

Regras esperadas:

- Nomes claros;
- Métodos pequenos;
- Evitar repetição;
- Evitar comentários que explicam código confuso;
- Separar responsabilidades;
- Retornos antecipados quando ajudam;
- Validar entradas;
- Não esconder efeitos colaterais;
- Não usar nomes genéricos como `data`, `item2`, `obj`;
- Não manter código morto;
- Não manter console.log desnecessário;
- Não duplicar estruturas de tipo.

---

# 33. Nomenclatura

## Backend

- Classes em PascalCase;
- Interfaces iniciadas com I;
- Métodos em PascalCase;
- Propriedades em PascalCase;
- DTOs terminando em Dto;
- Services terminando em Service;
- Repositories terminando em Repository;
- Controllers terminando em Controller.

## Frontend

- Componentes em PascalCase;
- Hooks iniciados com use;
- Services terminando em Service;
- Types e interfaces em PascalCase;
- Funções em camelCase;
- Constantes em UPPER_CASE quando globais;
- Arquivos de style com `.style.ts`;
- Arquivos de types com `.types.ts`.

---

# 34. Fluxo de criação de entidade

Exemplo de criação de Personagem:

```text
Usuário preenche formulário
→ Hook valida dados
→ Hook monta payload
→ Service do frontend envia request
→ Controller recebe DTO
→ Service valida regras
→ Repository salva
→ Entity Framework persiste
→ Controller retorna
→ Front exibe feedback
→ Tela atualiza
```

---

# 35. Fluxo de edição

```text
Tela carrega entidade
→ Service busca API
→ Hook mapeia DTO para estado
→ Usuário altera
→ Hook monta payload
→ Service envia update
→ Backend valida
→ Repository atualiza
→ Banco persiste
→ Front atualiza interface
```

---

# 36. Sistema de mesas

Uma Mesa representa um contexto próprio de RPG.

Ela pode possuir:

- Usuário criador;
- Usuários participantes;
- Personagens jogadores;
- Regras configuradas;
- Entidades modificadas;
- Valores próprios;
- Configurações específicas.

A proposta futura é permitir que uma mesa altere valores de entidades sem modificar o conteúdo global.

Exemplo:

```text
Raça global → 1000 HP
Mesa específica → 1200 HP
```

A configuração da mesa deve funcionar como override.

---

# 37. Sistema de relações

Entidades podem se relacionar.

Exemplos:

- Personagem relacionado a personagem;
- Personagem relacionado a cidade;
- Personagem relacionado a raça;
- Item relacionado a personagem;
- Lore relacionada a entidade;
- Página composta por blocos;
- Passiva relacionada a raça;
- Proficiência relacionada a personagem.

Boas práticas:

- Usar tabela de relação quando o vínculo for reutilizável;
- Usar JSON quando a estrutura for específica e não relacional;
- Permitir navegação cruzada;
- Evitar duplicar dados da entidade relacionada.

---

# 38. Sistema de Wiki

A Wiki deve permitir criação de páginas compostas.

Recursos:

- Blocos de texto;
- Imagem;
- Galeria;
- Referência;
- Relação;
- Ordem;
- Visibilidade;
- Tags;
- Conteúdo Rich Text.

As páginas devem ser flexíveis o suficiente para representar lore, personagem, cidade, raça, item ou evento.

---

# 39. Rich Text

O Rich Text deve ser utilizado para conteúdo narrativo.

Exemplos:

- História;
- Descrição;
- Lore;
- Detalhes;
- Efeitos complexos.

Cuidados:

- Sanitizar conteúdo;
- Preservar formatação;
- Evitar HTML inseguro;
- Manter compatibilidade entre editor e leitor;
- Permitir modal expandido quando necessário.

---

# 40. Upload e assets

O sistema deve suportar:

- Avatar;
- Galeria;
- Imagem de capa;
- Imagem de entidade;
- Assets de páginas.

Boas práticas:

- Validar extensão;
- Validar tamanho;
- Gerar preview;
- Usar cropper;
- Tratar falha;
- Remover arquivos substituídos quando apropriado;
- Não duplicar upload;
- Manter caminho no banco, não o arquivo binário.

---

# 41. Busca

A busca deve evoluir em etapas.

## Inicial

- Busca por nome;
- Tags;
- Tipo;
- Descrição.

## V1

- Busca global;
- Sugestões;
- Filtros;
- Navegação por entidade;
- Resultados agrupados.

## Futuro

- Busca semântica;
- Busca por IA;
- Busca em lore;
- Busca contextual.

---

# 42. Autenticação e autorização

O sistema utiliza JWT.

A aplicação deve:

- Proteger endpoints;
- Validar usuário;
- Restringir gerenciamento;
- Validar dono da ficha;
- Validar dono da mesa;
- Diferenciar conteúdo público e privado;
- Evitar confiar apenas no frontend;
- Aplicar autorização no backend.

---

# 43. Tratamento de erros

Toda funcionalidade deve tratar:

- Loading;
- Erro;
- Sucesso;
- Estado vazio;
- Dados ausentes;
- Falha da API;
- Erro de validação;
- Erro de autenticação.

O usuário deve receber feedback claro.

---

# 44. Performance

Boas práticas:

- Evitar Include excessivo;
- Usar projeções;
- Paginar listas grandes;
- Memorizar cálculos quando necessário;
- Evitar re-renderizações desnecessárias;
- Não carregar galerias completas em listagens;
- Usar lazy loading de imagens quando aplicável;
- Evitar requests duplicadas;
- Reutilizar cache de listas estáveis.

---

# 45. Segurança

Cuidados mínimos:

- Senhas com BCrypt;
- JWT protegido;
- Validação no backend;
- Sanitização de Rich Text;
- Upload seguro;
- Não expor segredos;
- Não versionar credenciais;
- Usar variáveis de ambiente;
- Validar permissões;
- Prevenir alteração de conteúdo de outro usuário;
- Não confiar em IDs enviados pelo frontend.

---

# 46. Testes

O projeto deve evoluir para possuir:

## Backend

- Testes de Services;
- Testes de regras;
- Testes de validação;
- Testes de Repository quando necessário;
- Testes de integração de endpoints.

## Frontend

- Testes de hooks;
- Testes de formulários;
- Testes de componentes genéricos;
- Testes de mapeamento;
- Testes de fluxo de criação e edição.

---

# 47. Critérios para novas funcionalidades

Antes de implementar algo, responder:

1. Já existe componente reutilizável?
2. Já existe hook semelhante?
3. Já existe service?
4. O dado deve ser tabela ou JSON?
5. A funcionalidade pertence ao frontend ou backend?
6. Há impacto em personagem e personagem jogador?
7. Há impacto em criação e edição?
8. Há impacto em listagem e página pública?
9. Há impacto em mesa?
10. Há impacto em permissões?
11. Há impacto em migrations?
12. Há compatibilidade com dados antigos?

---

# 48. Orientações para inteligências artificiais

Toda IA usada no projeto deve seguir estas regras.

## 48.1. Antes de alterar

- Ler os arquivos envolvidos;
- Procurar padrões existentes;
- Entender fluxo completo;
- Identificar hooks;
- Identificar services;
- Identificar tipos;
- Identificar componentes genéricos;
- Identificar telas de criação e edição;
- Identificar mapeamentos.

## 48.2. Durante a implementação

- Não reescrever sem necessidade;
- Não criar componentes duplicados;
- Não alterar layout sem pedido;
- Não mover arquivos sem motivo;
- Não trocar bibliotecas;
- Não introduzir arquitetura nova;
- Manter compatibilidade;
- Manter tipagem;
- Reutilizar código;
- Seguir padrão visual;
- Seguir estrutura de pastas.

## 48.3. Depois da implementação

- Revisar TypeScript;
- Revisar build;
- Revisar imports;
- Remover código morto;
- Verificar criação;
- Verificar edição;
- Verificar leitura;
- Verificar null;
- Verificar payload;
- Verificar resposta;
- Verificar compatibilidade;
- Descrever arquivos alterados.

---

# 49. O que uma IA não deve fazer

- Criar tudo do zero;
- Ignorar componentes existentes;
- Inserir estilo inline;
- Colocar lógica extensa em JSX;
- Fazer chamada de API dentro de componente visual;
- Usar `any` indiscriminadamente;
- Duplicar types;
- Alterar endpoint sem necessidade;
- Alterar contrato do backend sem informar;
- Criar tabelas sem analisar o domínio;
- Editar migration manualmente sem necessidade;
- Misturar regra de negócio em Controller;
- Criar Repository que retorna DTO de tela sem justificativa;
- Remover funcionalidade existente;
- Quebrar compatibilidade com dados antigos.

---

# 50. Estado atual resumido

O projeto já possui uma base relevante.

Entre os elementos já existentes ou em desenvolvimento estão:

- CRUDs principais;
- Personagens;
- Personagens jogadores;
- Raças;
- Cidades;
- Itens;
- Inventário;
- Skills;
- Magias;
- Ultimates;
- Passivas;
- Proficiências;
- Implantes;
- Status;
- Atributos;
- Galerias;
- Upload de imagem;
- Rich Text;
- Relações entre personagens;
- Mesas;
- Usuários;
- Personagens vinculados a usuários;
- Componentes genéricos;
- DataTables;
- Hooks;
- Services;
- API com Entity Framework;
- Autenticação JWT;
- MySQL;
- Swagger.

---

# 51. Prioridades atuais

As prioridades devem ser:

1. Consolidar a estrutura da V1;
2. Finalizar entidades principais;
3. Melhorar páginas públicas;
4. Finalizar relações;
5. Garantir criação e edição estáveis;
6. Padronizar formulários;
7. Melhorar responsividade;
8. Melhorar busca;
9. Corrigir inconsistências;
10. Preparar deploy estável.

---

# 52. Definition of Done

Uma funcionalidade só deve ser considerada concluída quando:

- Frontend implementado;
- Backend implementado;
- DTOs atualizados;
- Models atualizados;
- Services atualizados;
- Repositories atualizados;
- Migrations criadas quando necessário;
- Criação funcionando;
- Edição funcionando;
- Leitura funcionando;
- Tipagem sem erro;
- Build funcionando;
- Dados antigos compatíveis;
- Loading e erros tratados;
- Padrão visual mantido;
- Código revisado.

---

# 53. Estrutura de referência para tarefas futuras

Toda tarefa passada para uma IA deve conter:

```text
Contexto do projeto
Objetivo da alteração
Arquivos envolvidos
Comportamento atual
Comportamento esperado
Estrutura de dados
Regras de negócio
Padrões obrigatórios
Restrições
Critérios de aceite
```

---

# 54. Conclusão

O OdisseiaWiki não é apenas um CRUD de conteúdo. Ele é uma plataforma em evolução, formada por três camadas de produto:

1. Enciclopédia do universo;
2. Ferramenta de RPG;
3. Sistema narrativo assistido por IA.

A arquitetura atual deve ser preservada e evoluída com responsabilidade. O foco deve estar em consistência, reutilização, tipagem, separação de responsabilidades e crescimento incremental.

Toda implementação deve respeitar o que já existe, melhorar a base sem criar reescritas desnecessárias e manter o projeto preparado para a evolução da Wiki até a futura plataforma completa de RPG.
