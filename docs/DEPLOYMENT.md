# Deploy manual — Netlify, Render, Aiven e Cloudinary

Este documento prepara o primeiro deploy, mas não executa nem cria nenhum recurso. Não coloque
senhas, tokens, connection strings reais ou secrets neste repositório.

## Arquitetura e ordem recomendada

1. Criar um Aiven for MySQL no plano **Free** e manter o banco vazio.
2. Obter host, porta, database, usuário, senha e certificado CA no Aiven.
3. Configurar Cloudinary e banco como variáveis do backend no Render.
4. Criar o Web Service Docker no Render e aplicar migrations/seeder no primeiro startup.
5. Validar `/health`, `/health/ready`, migrations e a mesa padrão.
6. Criar o site no Netlify e configurar as duas variáveis `VITE_*`.
7. Voltar ao Render para configurar a origem final do Netlify no CORS.
8. Cadastrar a origem do Netlify no Google Cloud Console.
9. Testar login, leitura pública, upload, substituição de imagem e rotas diretas.

Referências oficiais: [Render Web Services](https://render.com/docs/web-services),
[Render Free](https://render.com/docs/free),
[Netlify SPA redirects](https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/),
[Aiven MySQL Free](https://aiven.io/docs/products/mysql/concepts/mysql-free-tier) e
[Google Identity Services](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid).

## 1. Aiven MySQL Free

Crie um serviço MySQL **Free**, sem adicionar método de pagamento. O plano gratuito atual possui
um único nó e limites pequenos; é adequado ao início do projeto, mas não oferece alta disponibilidade.
O banco de produção deve começar vazio: **não importe `odisseia_backup.sql` nem qualquer dump local**.

No painel do Aiven, copie individualmente:

- host;
- porta;
- database (normalmente o database fornecido pelo serviço);
- usuário;
- senha;
- versão do MySQL;
- certificado CA, caso use verificação de certificado.

Monte `ConnectionStrings__DefaultConnection` somente no painel do Render. Estrutura de referência:

```text
Server=<HOST>;Port=<PORT>;Database=<DATABASE>;User ID=<USER>;Password=<PASSWORD>;SslMode=Required;MaximumPoolSize=10;MinimumPoolSize=0;ConnectionIdleTimeout=60;ConnectionTimeout=15;DefaultCommandTimeout=30
```

`SslMode=Required` é o mínimo aceito pela aplicação em Production. A opção mais forte é baixar o CA
do Aiven, cadastrá-lo como secret file no Render e usar:

```text
SslMode=VerifyCA;SslCa=/etc/secrets/ca.pem
```

Não registre nem cole a connection string em logs, issues ou documentação versionada.

### Migrations e seeder

O Render Free não oferece shell/one-off job. Por isso, o projeto possui inicialização controlada por
variáveis, com retry e lock nomeado no MySQL para evitar concorrência entre instâncias:

```text
Database__ApplyMigrationsOnStartup=true
Database__SeedOnStartup=true
```

No primeiro startup, as migrations são aplicadas e depois o seeder idempotente garante somente a
mesa padrão obrigatória (`CodigoSistema=ODISSEIA_PADRAO`). A API pode responder em `/health` durante
uma indisponibilidade transitória, mas `/health/ready` permanece indisponível até o banco estar pronto.

Depois do primeiro deploy validado, `Database__ApplyMigrationsOnStartup` pode ser alterada para
`false`. Para cada nova versão que contenha migrations, habilite-a novamente durante o deploy.
`Database__SeedOnStartup=true` pode permanecer ativo: o índice único de `CodigoSistema` e o service
idempotente impedem duplicação.

Validações no cliente MySQL do Aiven:

```sql
SELECT MigrationId FROM __EFMigrationsHistory ORDER BY MigrationId;
SELECT IDMesa, Nome, CodigoSistema, PadraoSistema
FROM mesas
WHERE CodigoSistema = 'ODISSEIA_PADRAO';
```

O segundo comando deve retornar exatamente uma mesa padrão. Confirme também que as tabelas de
conteúdo não possuem registros de teste.

## 2. Backend no Render Free

Crie um **Web Service**, selecione Docker e use:

- branch inicial: `feat/preparacao-deploy` (trocar para a branch definitiva após o merge);
- repository root/build context: raiz do repositório;
- Dockerfile: `OdisseiaWiki/Dockerfile`;
- instance type: Free;
- health check path: `/health/ready`.

Build local equivalente:

```bash
docker build -f OdisseiaWiki/Dockerfile -t odisseiawiki-api .
```

O container não fixa porta. O `Program` lê `PORT`, faz bind em `0.0.0.0:<PORT>` e mantém as portas
do `launchSettings.json` apenas para desenvolvimento. O Render fornece `PORT` automaticamente.

O filesystem do Render Free é efêmero e o serviço pode dormir depois de ficar ocioso. Nenhum upload
de produção depende do disco: `wwwroot/assets_dynamic` não entra na imagem e o Cloudinary armazena
os novos arquivos. Não anexe nem dependa de persistent disk.

### Variáveis do Render

Obrigatórias:

```text
ASPNETCORE_ENVIRONMENT=Production
ConnectionStrings__DefaultConnection=<CONNECTION_STRING_AIVEN_COM_TLS>
Database__ServerVersion=<VERSAO_MYSQL_COMPATIVEL>
Database__MaximumPoolSize=10
Database__ConnectionIdleTimeoutSeconds=60
Database__RetryCount=3
Database__RetryDelaySeconds=5
Database__ApplyMigrationsOnStartup=true
Database__SeedOnStartup=true
Database__InitializationRetrySeconds=10
Database__InitializationLockTimeoutSeconds=30
ForwardedHeaders__Enabled=true
Jwt__Issuer=<ISSUER>
Jwt__Audience=<AUDIENCE>
Jwt__ChaveSecreta=<SEGREDO_ALEATORIO_COM_PELO_MENOS_32_BYTES>
Jwt__ExpiracaoHoras=168
Authorization__AdminEmails__0=<EMAIL_ADMIN>
Authorization__RequireVerifiedEmailForAdmin=true
GoogleAuth__ClientId=<GOOGLE_WEB_CLIENT_ID>
Cors__AllowedOrigins__0=https://<SITE>.netlify.app
Uploads__MaxFileSizeBytes=10485760
Cloudinary__CloudName=<CLOUD_NAME>
Cloudinary__ApiKey=<API_KEY>
Cloudinary__ApiSecret=<API_SECRET>
Cloudinary__RootFolder=odisseia
Cloudinary__UseLocalStorageInDevelopment=false
```

`PORT` e `RENDER=true` são fornecidas pela plataforma. Não crie variáveis `VITE_*` no Render.
Não configure `ImgBB__ApiKey` em produção: ImgBB permanece somente como compatibilidade para URLs
antigas já persistidas.

### Forwarded headers e rate limiting

Com `ForwardedHeaders__Enabled=true` e `RENDER=true`, a API processa somente um hop de
`X-Forwarded-For` e `X-Forwarded-Proto` antes de CORS, autenticação e rate limiting. O origin do
Web Service não é diretamente acessível, portanto o proxy do Render forma a fronteira de confiança.
O IP normalizado passa a ser usado pelos limiters de login e, quando não há usuário autenticado,
de upload.

Em outro provedor, não simule `RENDER=true`. Cadastre proxies estáveis em
`ForwardedHeaders__KnownProxies__0`, `__1`, etc. A principal limitação é que o Render não fornece IPs
fixos do proxy; a segurança depende do isolamento do origin e do limite de um hop.

### Health checks e logs

- `GET /health`: liveness leve; não consulta banco nem Cloudinary e retorna apenas o status.
- `GET /health/ready`: confirma que a inicialização terminou e que o MySQL aceita conexão.

Nenhum endpoint retorna connection string ou detalhes da exceção. Para falhas de inicialização, os
logs registram tentativa e tipo da exceção, sem imprimir o conteúdo da connection string. Uma falha
temporária gera retry e não encerra o processo.

## 3. Cloudinary em produção

Configure no Render somente as cinco variáveis Cloudinary listadas acima. Em Production, as
credenciais são validadas no startup, o `AssetService` sempre seleciona Cloudinary, e nenhuma chamada
externa é feita apenas para construir o provider ou executar `/health`.

Não execute `Tools/AssetMigration` no Render. A ferramenta não faz parte da solution, do Dockerfile
nem do startup. As imagens locais e URLs antigas do ImgBB continuam preservadas no desenvolvimento.

## 4. Frontend no Netlify Free

Conecte o repositório e selecione a mesma branch do backend durante a preparação. O arquivo
`netlify.toml` já define:

```text
base directory: OdisseiaWikiClient
build command: npm run build
publish directory: OdisseiaWikiClient/dist (dist relativo ao base)
Node: 20
```

Cadastre no Netlify:

```text
VITE_API_URL=https://<BACKEND>.onrender.com/api
VITE_GOOGLE_CLIENT_ID=<GOOGLE_WEB_CLIENT_ID>
```

`VITE_API_URL` deve ser absoluta e não possui fallback para localhost em builds de produção.
Variáveis `VITE_*` são públicas no bundle: nunca coloque senha, JWT secret, Cloudinary API secret,
connection string ou qualquer credencial privada nelas.

O rewrite SPA está em `netlify.toml`:

```text
/*  /index.html  200
```

Após publicar, acesse diretamente e atualize `/wiki`, `/wiki/<slug>`, `/personagem/<id>`,
`/management` e `/hub`. Todas devem carregar o React Router em vez de retornar 404 do Netlify.

As imagens dos mocks da Home agora são importadas pelo Vite e entram no bundle. Imagens reais novas
usam URLs HTTPS absolutas do Cloudinary; URLs absolutas antigas do ImgBB permanecem válidas.

## 5. Google OAuth

O fluxo atual usa o popup/callback de `@react-oauth/google`: o browser recebe o ID token e o envia à
API. Não há redirect URI implementada no código atual.

No OAuth Client do tipo **Web application**, cadastre em **Authorized JavaScript origins**:

```text
http://localhost:5173
https://<SITE>.netlify.app
```

Não cadastre caminhos como `/login` em origins. Só adicione Authorized redirect URIs se o fluxo for
alterado futuramente para `ux_mode=redirect`. Use o mesmo Web Client ID em
`VITE_GOOGLE_CLIENT_ID` e `GoogleAuth__ClientId`; o backend o valida como audience. Client secret do
Google não é utilizado e nunca deve ir para o frontend.

## 6. Checklist manual pós-deploy

- Abrir `/health` e confirmar HTTP 200 sem detalhes internos.
- Abrir `/health/ready` e confirmar HTTP 200 após migrations/seeder.
- Conferir `__EFMigrationsHistory` e a única mesa padrão no Aiven.
- Confirmar que nenhum dado do banco local foi importado.
- Testar uma rota pública da Wiki sem autenticação.
- Testar login local e no domínio Netlify.
- Confirmar role administrativo somente para e-mail configurado e verificado.
- Criar e editar uma entidade protegida.
- Enviar uma imagem e confirmar URL `https://res.cloudinary.com/...` no banco.
- Substituir/remover a imagem e conferir a limpeza no Cloudinary.
- Atualizar diretamente rotas do React Router e confirmar ausência de 404.
- Conferir CORS: Netlify permitido e origem não cadastrada bloqueada.
- Conferir logs sem senha, tokens, connection string ou API secrets.

## 7. Limites que ficam para a Fase 4

- Render Free entra em cold start após inatividade e pode levar cerca de um minuto para acordar.
- O Aiven Free é single-node, limitado a 1 GB e pode ser pausado por inatividade.
- O readiness consulta o banco, mas não consulta Cloudinary; leitura pública pode funcionar durante
  indisponibilidade do storage de imagens.
- Migrations automáticas são controladas por flag e lock, mas alterações destrutivas ainda devem ser
  revisadas e ter backup antes de cada deploy.
- O pool foi limitado a 10 conexões por instância; ajuste somente após observar métricas reais.
