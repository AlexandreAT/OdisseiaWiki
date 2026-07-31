# Deploy manual — Netlify, Render, Aiven e Cloudinary

Este documento prepara o primeiro deploy, mas não executa nem cria nenhum recurso. Não coloque
senhas, tokens, connection strings reais ou secrets neste repositório.

## Arquitetura e ordem recomendada

1. Criar um Aiven for MySQL no plano **Free** e manter o banco vazio.
2. Obter host, porta, database, usuário, senha e certificado CA no Aiven.
3. Configurar Cloudinary e banco como variáveis do backend no Render.
4. Criar o Web Service Docker no Render e aplicar migrations/seeder somente no primeiro startup
   ou em um deploy controlado que contenha migration.
5. Validar `/health/live`, `/health/ready`, migrations e a mesa padrão; depois desabilitar novamente
   migrations e seeder automáticos.
6. Criar o site no Netlify e configurar as duas variáveis `VITE_*`.
7. Voltar ao Render para configurar a origem final do Netlify no CORS.
8. Cadastrar a origem do Netlify no Google Cloud Console.
9. Testar login, leitura pública, upload, substituição de imagem e rotas diretas.

Referências oficiais: [Render Web Services](https://render.com/docs/web-services),
[Render Free](https://render.com/docs/free),
[Render Health Checks](https://render.com/docs/health-checks),
[Render Outbound IPs](https://render.com/docs/outbound-ip-addresses),
[Netlify SPA redirects](https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/),
[Aiven MySQL Free](https://aiven.io/docs/products/mysql/concepts/mysql-free-tier),
[Aiven — restringir acesso por IP](https://aiven.io/docs/platform/howto/restrict-access),
[Aiven — logs e métricas](https://aiven.io/docs/platform/howto/list-monitoring) e
[Google Identity Services](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid).

## 1. Aiven MySQL Free

Crie um serviço MySQL **Free**, sem adicionar método de pagamento. O plano gratuito atual possui
um único nó e limites pequenos; é adequado ao início do projeto, mas não oferece alta disponibilidade.
O banco de produção deve começar vazio: **não importe `odisseia_backup.sql` nem qualquer dump local**.
Se o painel exibir créditos de trial, preço por hora ou data de término do trial, confirme o plano
selecionado: o saldo promocional não transforma automaticamente um serviço pago em Free.

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
mesa padrão obrigatória (`CodigoSistema=ODISSEIA_PADRAO`). A API pode responder em `/health/live`
durante uma indisponibilidade transitória, mas `/health/ready` permanece indisponível até o banco
estar pronto.

Depois do primeiro deploy validado, altere **as duas** variáveis para `false`:

```text
Database__ApplyMigrationsOnStartup=false
Database__SeedOnStartup=false
```

Esse é o estado normal de produção e também o estado esperado para cold starts. Para uma versão que
contenha migration, faça backup, habilite somente as tarefas necessárias durante um deploy
controlado, valide o banco e volte ambas para `false`. O seeder é idempotente, mas executá-lo em todo
cold start aumenta desnecessariamente a dependência do startup em operações de escrita e lock.
Mesmo com as duas tarefas desativadas, a API valida uma conexão inicial antes de liberar `/api`.

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
- health check path: `/health/live`.

Se a versão atualmente publicada ainda não possuir `/health/live`, use temporariamente `/health`.
Troque para `/health/live` assim que o deploy que contém esse endpoint estiver ativo. **Não use
`/health/ready` como health check do Render**: uma indisponibilidade transitória do banco deve retirar
a API da prontidão para atender consultas, mas não deve fazer o Render interpretar o processo vivo
como uma instância quebrada e reiniciá-lo.

O Render oferece um único health check HTTP para duas necessidades que, nesta aplicação, são
separadas. Usar liveness evita reinícios causados por uma oscilação externa do Aiven, mas também
permite que um deploy seja marcado como live antes de o banco ficar pronto. Por isso, todo deploy
deve validar `/health/ready` e uma rota pública com acesso ao banco; se eles não estabilizarem, faça
rollback. Mudanças de credencial, TLS ou migration exigem atenção especial.

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
Database__DnsCheckIntervalSeconds=60
Database__RetryCount=3
Database__RetryDelaySeconds=5
Database__ApplyMigrationsOnStartup=false
Database__SeedOnStartup=false
Database__InitializationRetrySeconds=10
Database__InitializationLockTimeoutSeconds=30
ForwardedHeaders__Enabled=true
Jwt__Issuer=<ISSUER>
Jwt__Audience=<AUDIENCE>
Jwt__ChaveSecreta=<SEGREDO_ALEATORIO_COM_PELO_MENOS_32_BYTES>
Jwt__ExpiracaoHoras=720
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

Mantenha `Jwt__ChaveSecreta` fixa entre reinicializações e novos deploys. Alterar essa chave invalida
imediatamente todos os tokens emitidos, mesmo quando o prazo definido em `Jwt__ExpiracaoHoras` ainda
não terminou.

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

- `GET /health/live`: liveness usado pelo Render; confirma que o processo HTTP está vivo, sem consultar
  banco ou Cloudinary.
- `GET /health`: alias legado de liveness, mantido para compatibilidade.
- `GET /health/ready`: confirma que a inicialização terminou e que o MySQL aceita conexão.

Liveness e readiness têm finalidades diferentes. O Render deve verificar somente liveness. O
frontend e a validação pós-deploy usam readiness para aguardar a API **e** o banco. Durante uma falha
transitória do MySQL, `/health/live` pode responder `200` enquanto `/health/ready` responde `503`;
isso significa “processo vivo, banco ainda indisponível”, não necessariamente que o serviço caiu.

Nenhum endpoint retorna connection string ou detalhes internos da exceção. Para falhas de
inicialização, os logs registram tentativa, tipos e códigos seguros da exceção e o próximo retry, sem
imprimir o conteúdo da connection string. Uma falha temporária gera retry e não encerra o processo.

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

## 6. Runbook — falha de conexão entre Render e Aiven

Os indicadores **Running** do Render e do Aiven confirmam que os serviços estão ativos isoladamente;
eles não comprovam que a API consegue autenticar, negociar TLS e abrir uma conexão MySQL naquele
momento. Uma falha seguida por **Service recovered** normalmente indica indisponibilidade transitória,
cold start, limite de conexão ou configuração momentaneamente inválida — não uma desconexão
permanente entre as plataformas.

### 6.1. Classifique o problema pelos health checks

Consulte os endpoints sem autenticação:

```bash
curl -i https://<BACKEND>.onrender.com/health/live
curl -i https://<BACKEND>.onrender.com/health/ready
```

Enquanto a versão anterior ainda estiver publicada, substitua `/health/live` por `/health`.

| Liveness | Readiness | Interpretação |
| --- | --- | --- |
| `200` | `200` | API e banco estão disponíveis agora; investigue os logs no horário do incidente. |
| `200` | `503` | Processo está vivo, mas inicialização/conexão MySQL ainda não está pronta. |
| sem resposta, `502`, `503` ou `504` | qualquer | Cold start, deploy, crash ou indisponibilidade da instância do Render. |
| `200` | alternando entre `200` e `503` | Investigue rede, TLS, limite de conexões e métricas do Aiven. |

O health check do Render deve continuar em `/health/live` mesmo quando readiness retorna `503`.
Reiniciar repetidamente o serviço não corrige credencial, TLS, allowlist ou limite de conexão e ainda
pode apagar o contexto temporal útil dos logs.

### 6.2. Checklist da conexão

Revise `ConnectionStrings__DefaultConnection` no painel do Render sem copiar seu valor para tickets,
chat ou logs:

- `Server`: use exatamente o **FQDN** fornecido pelo Aiven, sem `http://`, `https://`, caminho ou barra
  final; nunca fixe o IP resolvido.
- `Port`: use a porta MySQL exibida em **Connection information**, que pode não ser `3306`.
- `Database`: `defaultdb` é um nome normal fornecido pelo Aiven; confirme em **Databases** que ele
  ainda existe.
- `User ID` e `Password`: confirme o usuário ativo. Se rotacionar a senha, atualize imediatamente a
  variável no Render e faça um novo deploy.
- `Database__ServerVersion`: mantenha compatível com a versão MySQL exibida pelo Aiven.
- `SslMode`: mantenha no mínimo `Required`; com `VerifyCA`, confirme que o secret file existe no
  caminho configurado e contém o CA atual do Aiven.
- Não inclua aspas externas, quebras de linha ou espaços acidentais no valor.
- Mantenha `Database__DnsCheckIntervalSeconds=60`, permitindo que o pool descarte conexões quando o
  FQDN do serviço passar a resolver para outro IP.

Se o Aiven estiver com IP filtering habilitado, permita todos os intervalos de saída atuais listados
pelo Render para o serviço. Uma regra antiga pode bloquear uma instância nova mesmo quando ambos os
painéis exibem **Running**.

### 6.3. O que conferir em cada painel

No **Render**:

1. Confirme o commit realmente publicado e o horário de **Deploy live**.
2. Compare **Events** com **Logs** no mesmo intervalo; `Instance failed` é consequência, e a exceção
   imediatamente anterior costuma indicar a causa.
3. Confirme health check `/health/live` (`/health` apenas durante a transição).
4. Confira CPU, memória, reinícios e quantidade de instâncias.
5. Verifique se as variáveis obrigatórias existem no Environment, sem revelar seus valores.

No **Aiven**:

1. Confirme serviço, nó e `defaultdb` ativos.
2. Confira o plano, créditos e data de término de trial; serviço em trial não deve ser tratado como
   recurso gratuito permanente.
3. Revise **Logs**, **Metrics** e **Current queries** no horário exato do incidente.
4. Confira uso de memória, reinícios, número de conexões e erros de autenticação/TLS.
5. Confirme usuário, porta, FQDN, CA e regras de acesso por IP.

Consultas úteis, executadas no console MySQL ou em um cliente conectado sem registrar a senha:

```sql
SHOW STATUS LIKE 'Threads_connected';
SHOW STATUS LIKE 'Max_used_connections';
SHOW STATUS LIKE 'Aborted_connects';
SHOW STATUS LIKE 'Connection_errors%';
SHOW VARIABLES LIKE 'max_connections';
```

Se `Max_used_connections` estiver próximo de `max_connections`, investigue vazamento ou excesso de
pool antes de aumentar limites. O projeto usa pool máximo de 10 por instância; multiplique esse valor
pelo número máximo de instâncias simultâneas do Render ao avaliar o consumo.

### 6.4. Recuperação segura

1. Preserve os logs e horários do incidente antes de reiniciar qualquer serviço.
2. Corrija primeiro conexão, senha, TLS ou allowlist caso haja divergência.
3. Deixe `Database__ApplyMigrationsOnStartup=false` e `Database__SeedOnStartup=false` em cold starts
   normais.
4. Faça redeploy/restart de uma plataforma por vez e valide liveness/readiness entre as ações.
5. Aguarde o retry automático da API; não repita automaticamente `POST`, `PUT`, `PATCH` ou `DELETE`.
6. Se a regressão começou em um commit, use rollback do Render e valide o banco antes de restaurar
   migrations destrutivas.

Ao pedir ajuda, compartilhe somente: horário com fuso, commit, status HTTP, endpoint, tipo/código da
exceção, trace ID e sequência dos eventos. Oculte senha, connection string completa, JWT, tokens,
cookies, API keys, conteúdo do CA e payloads com dados pessoais. O hostname e o usuário também devem
ser omitidos em relatórios públicos quando não forem necessários.

## 7. Checklist manual pós-deploy

- Abrir `/health/live` e confirmar HTTP 200 sem detalhes internos.
- Abrir `/health/ready` e confirmar HTTP 200 após migrations/seeder.
- Confirmar no Render que o health check path é `/health/live`, nunca `/health/ready`.
- Confirmar `Database__ApplyMigrationsOnStartup=false` e `Database__SeedOnStartup=false` após o
  deploy controlado.
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

## 8. Limites que ficam para a Fase 4

- Render Free entra em cold start após inatividade e pode levar cerca de um minuto para acordar.
- Se o serviço selecionado for realmente o Aiven Free, considere seus limites de nó, memória,
  armazenamento e eventuais pausas; um serviço coberto por créditos de trial segue as regras do plano
  contratado e pode gerar cobrança ou parar ao fim do trial.
- O readiness consulta o banco, mas não consulta Cloudinary; leitura pública pode funcionar durante
  indisponibilidade do storage de imagens.
- Migrations automáticas são controladas por flag e lock, mas alterações destrutivas ainda devem ser
  revisadas e ter backup antes de cada deploy.
- O pool foi limitado a 10 conexões por instância; ajuste somente após observar métricas reais.
