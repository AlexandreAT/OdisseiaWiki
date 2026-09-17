# E-mails de conta com Brevo

O backend envia confirmação de e-mail e redefinição de senha pela API HTTPS da Brevo. A chave fica
somente no backend; nunca no Netlify, em `VITE_*` ou em arquivos versionados.

## 1. Configurar a Brevo

1. Crie uma conta no plano Free da Brevo.
2. Em **Settings > Remetentes, domínio, IPs**, adicione `OdisseiaWiki <odisseiawiki@gmail.com>` e
   informe o código de verificação recebido no Gmail.
3. Em **Settings > SMTP & API > Chaves de API**, gere uma chave chamada `OdisseiaWiki Backend`.
4. Copie a chave e armazene-a em local seguro. A Brevo só a exibe uma vez.

O remetente configurado no projeto deve corresponder exatamente a um remetente verificado na Brevo.

## 2. Configurar localmente

No arquivo ignorado pelo Git `OdisseiaWiki/appsettings.Development.json`, adicione ou complete:

```json
"Email": {
  "BrevoApiKey": "SUA_CHAVE_DA_API_BREVO",
  "From": "OdisseiaWiki <odisseiawiki@gmail.com>",
  "FrontendUrl": "http://localhost:5173",
  "ConfirmacaoEmailValidadeHoras": 24,
  "RedefinicaoSenhaValidadeMinutos": 30
}
```

## 3. Configurar no Render

No serviço do backend, em **Environment**, crie:

```text
Email__BrevoApiKey=SUA_CHAVE_DA_API_BREVO
Email__From=OdisseiaWiki <odisseiawiki@gmail.com>
Email__FrontendUrl=https://odisseiawiki.netlify.app
```

Remova as variáveis antigas `Email__Host`, `Email__Port`, `Email__Username` e `Email__Password` do
Render depois que o novo deploy estiver funcionando. Não crie variáveis `VITE_*` e não coloque a chave
da API no Netlify. Depois de salvar, faça um novo deploy do backend.

## 4. Aplicar a migration

Inclua a migration `AddAccountEmailSecurity` no deploy. Se o deploy não aplica migrations automaticamente, execute:

```powershell
dotnet ef database update --project OdisseiaWiki/OdisseiaWiki.csproj --startup-project OdisseiaWiki/OdisseiaWiki.csproj
```

## 5. Testar

Cadastre uma conta com outro e-mail, confirme pelo link recebido e solicite a redefinição de senha.
