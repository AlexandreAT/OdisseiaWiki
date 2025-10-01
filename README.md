# OdisseiaWiki

![GitHub repo size](https://img.shields.io/github/repo-size/AlexandreAT/OdisseiaWiki)
![GitHub top language](https://img.shields.io/github/languages/top/AlexandreAT/OdisseiaWiki)
![GitHub closed pull requests](https://img.shields.io/github/issues-pr-closed/AlexandreAT/OdisseiaWiki)

> Projeto pessoal para criar uma wiki dedicada ao RPG de mesa "Odisseia". O site inclui informações sobre a história e o universo do jogo, além de um gerenciador de fichas de personagem. Desenvolvido para praticar e aprimorar habilidades em desenvolvimento web.

## 🛠️ Tecnologias

As seguintes tecnologias/ferramentas foram utilizadas no desenvolvimento deste projeto:

### Frontend (OdisseiaWikiClient)

- **TypeScript**: Linguagem de programação que adiciona tipagem estática ao JavaScript.
- **React**: Biblioteca JavaScript para construção de interfaces de usuário.
- **Vite**: Ferramenta de build rápida para projetos web modernos.
- **@emotion/react & @emotion/styled**: Bibliotecas para estilização de componentes React.
- **Axios**: Cliente HTTP baseado em Promises para fazer requisições.
- **jwt-decode**: Biblioteca para decodificar tokens JWT.
- **mui-datatables**: Componente de tabela de dados para React.
- **React Redux**: Gerenciamento de estado para aplicações React.
- **React Router DOM**: Roteamento declarativo para React.
- **React Hot Toast & React Toastify**: Bibliotecas para notificações e mensagens de feedback.
- **Styled Components**: Biblioteca para estilização de componentes React.

### Backend (OdisseiaWiki)

- **.NET 8.0 (C#)**: Framework para construção de aplicações web robustas.
- **BCrypt.Net-Next**: Biblioteca para hashing de senhas.
- **Google.Apis.Auth**: Biblioteca para autenticação com APIs do Google.
- **Microsoft.EntityFrameworkCore**: ORM para interação com o banco de dados.
- **Pomelo.EntityFrameworkCore.MySql**: Provedor MySQL para Entity Framework Core.
- **Swashbuckle.AspNetCore**: Geração de documentação Swagger/OpenAPI.
- **System.IdentityModel.Tokens.Jwt**: Manipulação de JSON Web Tokens.

## 🚀 Começando

Siga estas instruções para configurar e executar o projeto localmente.

## 💻 Pré-requisitos

Antes de começar, verifique se você atendeu aos seguintes requisitos:

- **Node.js** (versão 18 ou superior)
- **.NET SDK** (versão 8.0 ou superior)
- **MySQL Server** (ou outro banco de dados compatível com Entity Framework Core)
- **Git**

### Clonagem do Repositório

```bash
git clone https://github.com/AlexandreAT/OdisseiaWiki.git
```

### Configuração do Backend

1. **Navegue até o diretório do backend:**
```bash
cd OdisseiaWiki/OdisseiaWiki
```

2. **Configure o banco de dados:**
   - Abra o arquivo `appsettings.json` e configure a string de conexão com seu banco de dados MySQL.
   - Execute as migrações para criar o esquema do banco de dados:
```bash
dotnet ef database update
```

3. **Restaure as dependências e compile o projeto:**
```bash
dotnet restore
dotnet build
```

4. **Execute o backend:**
```bash
dotnet run
```
O backend estará disponível em `https://localhost:7001` (ou outra porta configurada).

### Configuração do Frontend

1. **Navegue até o diretório do cliente:**
```bash
cd ../OdisseiaWikiClient
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Execute o frontend:**
```bash
npm run dev
```
O frontend estará disponível em `http://localhost:5173` (ou outra porta configurada).

## 📞 Contato

AlexandreAT - [GitHub](https://github.com/AlexandreAT)
