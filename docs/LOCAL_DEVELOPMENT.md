# Desenvolvimento local — instalação limpa

Este roteiro parte de um computador sem o projeto. Os comandos abaixo são para PowerShell e devem
ser executados na ordem indicada. Nenhuma senha ou chave real deve ser commitada.

## 1. Instalar e conferir os pré-requisitos

- [Git](https://git-scm.com/download/win)
- [.NET SDK 8](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 20](https://nodejs.org/en/download), para reproduzir a versão usada no Netlify
- [MySQL Community Server 8](https://dev.mysql.com/downloads/mysql/) em execução

Confira as instalações:

```powershell
git --version
dotnet --version
node --version
npm --version
mysql --version
```

Instale a ferramenta do Entity Framework na mesma versão principal usada pelo projeto:

```powershell
dotnet tool install --global dotnet-ef --version 8.0.13
dotnet ef --version
```

Se ela já estiver instalada em outra versão, use `dotnet tool update --global dotnet-ef --version 8.0.13`.

## 2. Clonar

```powershell
git clone https://github.com/AlexandreAT/OdisseiaWiki.git
cd OdisseiaWiki
git switch main
```

Crie uma branch antes de desenvolver:

```powershell
git switch -c tipo/nome-curto
```

Exemplos: `feat/cards-itens`, `fix/upload-personagem` ou `docs/instalacao`.

## 3. Criar os arquivos locais

Na raiz do repositório:

```powershell
Copy-Item .\OdisseiaWiki\appsettings.Development.example.json .\OdisseiaWiki\appsettings.Development.json
Copy-Item .\OdisseiaWikiClient\.env.example .\OdisseiaWikiClient\.env
```

Edite somente as cópias criadas:

| Arquivo local | Contém | Entra no Git? |
| --- | --- | --- |
| `OdisseiaWiki/appsettings.Development.json` | banco, JWT, administrador, Google e Cloudinary | Não |
| `OdisseiaWikiClient/.env` | URL da API e Client ID público do Google | Não |

Confirme a proteção antes de continuar:

```powershell
git check-ignore -v .\OdisseiaWiki\appsettings.Development.json
git check-ignore -v .\OdisseiaWikiClient\.env
```

Os dois comandos precisam apontar para uma regra do `.gitignore`.

Não copie `OdisseiaWiki/appsettings.Example.json` para o desenvolvimento. Ele serve apenas como mapa
das configurações de produção, que são cadastradas como variáveis no Render.

## 4. Preparar o MySQL

Durante a instalação do MySQL, você define a senha do usuário local `root`. Ela não vem do projeto.
Abra o cliente usando o prompt de senha, para não gravá-la no histórico:

```powershell
mysql -u root -p
```

No console do MySQL:

```sql
CREATE DATABASE IF NOT EXISTS odisseia
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;
EXIT;
```

Em `OdisseiaWiki/appsettings.Development.json`, substitua `YOUR_MYSQL_PASSWORD` pela senha definida
na instalação. Se host, porta, banco ou usuário forem diferentes, altere-os na mesma connection string:

```text
Server=localhost;Port=3306;Database=odisseia;User ID=root;Password=<SENHA_LOCAL>;SslMode=None
```

`Database:ServerVersion` deve continuar como `8.0.0` para MySQL 8. O projeto usa Pomelo e não deve
ser trocado por outro provider.

## 5. Configurar autenticação

### JWT

Gere um segredo aleatório de 64 bytes e copie-o diretamente para a área de transferência:

```powershell
$jwtBytes = New-Object byte[] 64
[System.Security.Cryptography.RandomNumberGenerator]::Fill($jwtBytes)
[Convert]::ToBase64String($jwtBytes) | Set-Clipboard
Remove-Variable jwtBytes
```

Cole o resultado apenas em `Jwt:ChaveSecreta`. Mantenha localmente:

```text
Jwt:Issuer = OdisseiaWiki.Api
Jwt:Audience = OdisseiaWiki.Web
Jwt:ExpiracaoHoras = 168
```

### Administrador local

Em `Authorization:AdminEmails`, informe o e-mail que poderá acessar o Management. Isso é uma
allowlist, não uma senha. Com `RequireVerifiedEmailForAdmin=true`, entre pelo Google com esse mesmo
e-mail verificado. Depois de alterar a lista, faça logout e login novamente para receber um novo JWT.

### Google

1. Abra o [Google Cloud Console — Credenciais](https://console.cloud.google.com/apis/credentials).
2. Se necessário, configure a tela de consentimento OAuth.
3. Crie uma credencial **OAuth client ID** do tipo **Web application**.
4. Cadastre `http://localhost:5173` em **Authorized JavaScript origins**.
5. Copie somente o Client ID terminado em `.apps.googleusercontent.com`.
6. Use exatamente o mesmo valor em:
   - `GoogleAuth:ClientId`, no `appsettings.Development.json`;
   - `VITE_GOOGLE_CLIENT_ID`, no `.env` do frontend.

O fluxo atual usa popup e ID token; não usa Client Secret nem Authorized redirect URI.

## 6. Escolher o armazenamento de imagens

### Opção padrão: disco local

Mantenha `Cloudinary:UseLocalStorageInDevelopment=true`. Nesse modo, `CloudName`, `ApiKey` e
`ApiSecret` podem continuar com os placeholders do exemplo. As imagens ficam em
`OdisseiaWiki/wwwroot/assets_dynamic`, pasta local ignorada pelo Git.

### Testar Cloudinary localmente

1. Abra o [Cloudinary Console](https://console.cloudinary.com/).
2. No dashboard/configurações de API, obtenha **Cloud name**, **API key** e **API secret**.
3. Preencha os três campos em `appsettings.Development.json`.
4. Defina `Cloudinary:UseLocalStorageInDevelopment=false`.

O API secret fica somente no backend. Nunca o coloque em `.env`, em variável `VITE_*`, no frontend
ou em logs. `ImgBB:ApiKey` é opcional e existe apenas para compatibilidade legada; novos uploads não
dependem dele.

## 7. Configurar o frontend

Em `OdisseiaWikiClient/.env`:

```text
VITE_API_URL=http://localhost:5146/api
VITE_GOOGLE_CLIENT_ID=<MESMO_CLIENT_ID_CONFIGURADO_NO_BACKEND>
```

Variáveis `VITE_*` são públicas no navegador. Nunca coloque nelas senha do MySQL, JWT secret,
Cloudinary API secret ou connection string.

## 8. Restaurar, migrar e executar

Na raiz do repositório, restaure e aplique todas as migrations:

```powershell
dotnet restore .\OdisseiaWiki\OdisseiaWiki.csproj
dotnet ef database update --project .\OdisseiaWiki\OdisseiaWiki.csproj --startup-project .\OdisseiaWiki\OdisseiaWiki.csproj
```

Inicie o backend:

```powershell
dotnet run --project .\OdisseiaWiki\OdisseiaWiki.csproj --launch-profile http
```

O startup executa o seeder idempotente e garante uma única mesa `ODISSEIA_PADRAO`.

Em outro PowerShell, inicie o frontend:

```powershell
cd .\OdisseiaWikiClient
npm ci
npm run dev
```

Endereços:

- frontend: `http://localhost:5173`;
- Swagger: `http://localhost:5146/swagger`;
- API liveness: `http://localhost:5146/health`;
- API e banco prontos: `http://localhost:5146/health/ready`.

## 9. Validação mínima

```powershell
Invoke-RestMethod http://localhost:5146/health
Invoke-RestMethod http://localhost:5146/health/ready
dotnet ef migrations list --project .\OdisseiaWiki\OdisseiaWiki.csproj --startup-project .\OdisseiaWiki\OdisseiaWiki.csproj
```

Depois, valide no navegador: Home, Wiki, login manual, login Google, Management com o e-mail da
allowlist e um upload. Para validar o build antes de enviar alterações:

```powershell
dotnet build .\OdisseiaWiki\OdisseiaWiki.csproj --configuration Release
npm --prefix .\OdisseiaWikiClient run build
```

## 10. Erros comuns

| Erro | Causa e correção |
| --- | --- |
| `Failed to load configuration...appsettings.Development.json` | JSON inválido. Remova comentários, confira aspas e vírgulas e valide o arquivo em um parser JSON. |
| `Cloud name must be specified` | `UseLocalStorageInDevelopment=false` sem credenciais válidas. Preencha os três valores do Cloudinary ou volte para `true`. |
| `ConnectionStrings:DefaultConnection não configurada` | O arquivo local está ausente, com nome/pasta errados ou sem a seção `ConnectionStrings`. |
| Falha ao conectar no MySQL | Confirme serviço ativo, porta `3306`, banco `odisseia`, usuário e senha da connection string. |
| Login Google falha | O Client ID deve ser igual nos dois arquivos e `http://localhost:5173` deve estar nas origens autorizadas. |
| Management não aparece | Inclua o e-mail em `AdminEmails`, use uma conta Google verificada e faça logout/login para renovar o token. |
| Build do Vite recusa iniciar | O `.env` não possui `VITE_API_URL` ou `VITE_GOOGLE_CLIENT_ID`. |

## 11. Antes de commitar

```powershell
git status --short
git diff --check
```

Nunca force a inclusão de `.env`, `appsettings.Development.json`, dumps `.sql`, certificados,
credenciais ou a pasta `assets_dynamic`. Produção é configurada nos painéis dos serviços conforme
[DEPLOYMENT.md](DEPLOYMENT.md); armazenamento e backup estão em [IMAGE_STORAGE.md](IMAGE_STORAGE.md).
