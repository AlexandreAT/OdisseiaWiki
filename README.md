# OdisseiaWiki

Wiki e gerenciador de personagens para o universo de RPG Odisseia.

## Stack

- Frontend: React, TypeScript e Vite
- Backend: ASP.NET Core 8 e Entity Framework Core
- Banco: MySQL com Pomelo
- Imagens: armazenamento local no desenvolvimento e Cloudinary em produção

## Início local

1. Clone o repositório.
2. Configure os dois arquivos locais a partir dos exemplos:
   - `OdisseiaWiki/appsettings.Development.example.json` → `OdisseiaWiki/appsettings.Development.json`
   - `OdisseiaWikiClient/.env.example` → `OdisseiaWikiClient/.env`
3. Inicie MySQL, aplique as migrations e execute backend e frontend.

O passo a passo, valores necessários e origem das chaves estão em [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md).

## Segurança de configurações

- `appsettings.Development.json` e `.env` são locais e ignorados pelo Git.
- Nunca coloque senha do banco, JWT secret, Cloudinary API secret ou connection string em `VITE_*`.
- `VITE_GOOGLE_CLIENT_ID` é público; o Client ID deve coincidir com `GoogleAuth:ClientId` do backend.

## Deploy

O guia de Render, Aiven, Netlify, Cloudinary, migrations e validação está em [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
