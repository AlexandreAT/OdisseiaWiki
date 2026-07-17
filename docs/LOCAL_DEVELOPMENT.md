# Configuração local

## 1. Pré-requisitos

- Node.js 20+
- .NET SDK 8
- MySQL 8 em execução
- Git

## 2. Arquivos locais que não entram no Git

| Arquivo | Criar a partir de | Uso |
| --- | --- | --- |
| `OdisseiaWiki/appsettings.Development.json` | `OdisseiaWiki/appsettings.Development.example.json` | backend e segredos |
| `OdisseiaWikiClient/.env` | `OdisseiaWikiClient/.env.example` | URL da API e Client ID público |

Copie os exemplos e substitua apenas os valores `YOUR_*`. Nunca altere `appsettings.json` para incluir segredos e nunca versione os dois arquivos locais acima.

## 3. Onde obter cada valor

| Configuração | Origem |
| --- | --- |
| `DefaultConnection` | MySQL local: host, porta, banco, usuário e senha |
| `Jwt:ChaveSecreta` | Gere localmente uma sequência aleatória com ao menos 32 bytes |
| `GoogleAuth:ClientId` e `VITE_GOOGLE_CLIENT_ID` | Google Cloud Console → APIs e serviços → Credenciais → OAuth 2.0 Web Client |
| `Cloudinary:*` | Cloudinary Dashboard → API Keys |

O Client ID do Google deve ser idêntico no backend e no frontend. Para desenvolvimento com uploads em disco, mantenha `Cloudinary:UseLocalStorageInDevelopment` como `true`; use `false` apenas para testar Cloudinary localmente.

## 4. Executar

```powershell
# Backend (na raiz do repositório)
cd OdisseiaWiki
dotnet restore
dotnet ef database update
dotnet run --launch-profile http

# Frontend (em outro terminal, na raiz do repositório)
cd OdisseiaWikiClient
npm ci
npm run dev
```

Endereços locais: frontend `http://localhost:5173`, API `http://localhost:5146`.

## 5. Produção

Não copie arquivos locais para Render ou Netlify. Cadastre os mesmos valores como variáveis de ambiente nos painéis dos serviços. A lista completa e a ordem de deploy estão em [DEPLOYMENT.md](DEPLOYMENT.md).
