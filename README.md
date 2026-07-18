# OdisseiaWiki

Wiki e gerenciador de personagens para o universo de RPG Odisseia.

## Stack

- Frontend: React, TypeScript e Vite
- Backend: ASP.NET Core 8 e Entity Framework Core
- Banco: MySQL com Pomelo
- Imagens: armazenamento local no desenvolvimento e Cloudinary em produção

## Início local

1. Instale Git, .NET SDK 8, Node.js 20, MySQL 8 e `dotnet-ef` 8.0.13.
2. Clone `https://github.com/AlexandreAT/OdisseiaWiki.git`.
3. Crie os arquivos locais a partir de:
   - `OdisseiaWiki/appsettings.Development.example.json`;
   - `OdisseiaWikiClient/.env.example`.
4. Crie o banco `odisseia`, aplique as migrations e execute backend e frontend.

`OdisseiaWiki/appsettings.Example.json` é apenas uma referência de produção; no Render, seus valores
são cadastrados como variáveis de ambiente e esse arquivo não recebe segredos reais.

Os comandos na ordem correta, cada valor necessário, origem das chaves, validações e erros comuns
estão em [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md).

## Segurança de configurações

- `appsettings.Development.json` e `.env` são locais e ignorados pelo Git.
- Nunca coloque senha do banco, JWT secret, Cloudinary API secret ou connection string em `VITE_*`.
- `VITE_GOOGLE_CLIENT_ID` é público; o Client ID deve coincidir com `GoogleAuth:ClientId` do backend.

## Deploy

O guia de Render, Aiven, Netlify, Cloudinary, migrations e validação está em [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
