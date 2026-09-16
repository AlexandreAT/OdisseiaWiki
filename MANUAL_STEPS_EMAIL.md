# Ações manuais para o Alexandre

## 1. Criar a senha de app do Google

1. Entre na conta Google que enviará os e-mails do OdisseiaWiki.
2. Abra [Segurança da Conta Google](https://myaccount.google.com/security) e ative a **Verificação em duas etapas**.
3. Abra [Senhas de app](https://myaccount.google.com/apppasswords), crie uma senha com o nome `OdisseiaWiki` e copie os 16 caracteres gerados.

Essa senha não é a senha normal do Gmail. Guarde-a: o Google só a mostra uma vez.

## 2. Configurar localmente

No arquivo ignorado pelo Git `OdisseiaWiki/appsettings.Development.json`, adicione ou complete:

```json
"Email": {
  "Host": "smtp.gmail.com",
  "Port": 587,
  "Username": "seu-email@gmail.com",
  "Password": "SUA_SENHA_DE_APP_DE_16_CARACTERES",
  "From": "OdisseiaWiki <seu-email@gmail.com>",
  "FrontendUrl": "http://localhost:5173",
  "ConfirmacaoEmailValidadeHoras": 24,
  "RedefinicaoSenhaValidadeMinutos": 30
}
```

## 3. Configurar no Render

No serviço do backend, em **Environment**, crie:

```text
Email__Host=smtp.gmail.com
Email__Port=587
Email__Username=seu-email@gmail.com
Email__Password=SUA_SENHA_DE_APP_DE_16_CARACTERES
Email__From=OdisseiaWiki <seu-email@gmail.com>
Email__FrontendUrl=https://odisseiawiki.netlify.app
```

Não crie variáveis `VITE_*` para isso e não coloque a senha no Netlify. Depois de salvar, faça um novo deploy do backend.

## 4. Aplicar a migration

Inclua a migration `AddAccountEmailSecurity` no deploy. Se o deploy não aplica migrations automaticamente, execute:

```powershell
dotnet ef database update --project OdisseiaWiki/OdisseiaWiki.csproj --startup-project OdisseiaWiki/OdisseiaWiki.csproj
```

## 5. Testar

Cadastre uma conta com outro e-mail, confirme pelo link recebido e solicite a redefinição de senha.

## Se a opção "Senhas de app" não aparecer

Confira se a Verificação em duas etapas está ativa. A opção pode ficar indisponível em contas corporativas ou escolares, contas com Proteção Avançada e contas configuradas apenas com chaves de segurança. Nesse caso, use outra conta Gmail comum com verificação em duas etapas ou será necessário configurar OAuth 2.0 do Gmail.
