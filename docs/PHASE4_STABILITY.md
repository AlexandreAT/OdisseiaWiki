# Fase 4 — estabilidade, backup e rollback

## Cold start e timeout

Em produção, o frontend consulta `GET /health` ao iniciar. Se o Render estiver dormindo, uma
notificação informa **Iniciando o servidor...**. Requisições `GET` que falharem por timeout, ausência
de resposta, HTTP 502, 503 ou 504 aguardam o health check e são repetidas uma única vez.

Operações `POST`, `PUT`, `PATCH` e `DELETE` nunca são repetidas automaticamente, evitando cadastros ou
alterações duplicadas. Em falha persistente, **Tentar novamente** refaz somente o health check e
recarrega a tela depois que o servidor responder.

O timeout geral do Axios é de 20 segundos. O aquecimento usa no máximo três tentativas, espaçadas por
quatro segundos, sem loop infinito. A busca da Wiki preserva timeout específico, cancelamento e
resultados parciais.

As rotas principais são carregadas sob demanda com `React.lazy`, evitando enviar Home, Wiki,
Management, Hub, Login e ficha de personagem no mesmo bundle inicial.

## Limitações aceitas dos planos gratuitos

- Render pode dormir e não possui SLA no plano gratuito.
- Aiven Free é single-node e pode ficar temporariamente indisponível.
- Cloudinary continua sendo storage, não backup único das imagens e metadados.
- O pool permanece limitado a 10 conexões por instância.
- Paginação de catálogos deve ser adicionada quando o volume real justificar alteração dos contratos.

## Backup antes de migrations

1. Gere um dump lógico usando as credenciais obtidas diretamente do Aiven. Não versione dump ou senha.
2. Guarde o dump em dois locais privados e registre o conteúdo de `__EFMigrationsHistory`.
3. Exporte do banco as URLs e public IDs das imagens; o Cloudinary não substitui esses metadados.
4. Revise a migration e prefira mudanças compatíveis com a versão anterior da API.

Exemplo com senha solicitada interativamente:

```bash
mysqldump --host=<HOST> --port=<PORT> --user=<USER> --password \
  --ssl-mode=REQUIRED --single-transaction --routines --triggers <DATABASE> > odisseia-backup.sql
```

## Rollback

- Frontend: em **Deploys > Publish deploy**, no Netlify, publique novamente o último deploy aprovado.
- Backend: use **Events > Rollback**, no Render, ou publique novamente o commit anterior.
- Banco: se a migration alterou dados, restaure o dump primeiro em um banco de validação. Não reverta
  migration destrutiva diretamente sem testar a restauração.
- Depois do rollback, valide `/health/ready`, login, Wiki, CRUD protegido e uploads.

## Checklist recorrente de deploy

- Confirmar que Render, Netlify, Aiven e Cloudinary continuam nos planos gratuitos.
- Validar `/health` e `/health/ready` após cada deploy do backend.
- Revisar migrations antes de habilitar `Database__ApplyMigrationsOnStartup`.
- Confirmar seeder idempotente e exatamente uma mesa `ODISSEIA_PADRAO`.
- Testar login manual e Google, CORS, upload, substituição e exclusão de imagem.
- Abrir diretamente rotas SPA no Netlify e testar um cold start real após inatividade.
- Revisar logs sem tokens, senhas, connection strings ou payloads sensíveis.
