# Login Google — Resenha FC v0.3.0

O aplicativo oferece somente a opção **Continuar com Google**. Não há formulário de cadastro, e-mail ou senha no frontend.

O arquivo `supabase-config.js` deve conter:

```javascript
window.RESENHA_CONFIG = {
  supabaseUrl: "https://SEU-PROJETO.supabase.co",
  supabasePublishableKey: "sb_publishable_...",
  googleClientId: "SEU_CLIENT_ID.apps.googleusercontent.com",
  authRedirectUrl: new URL("./", window.location.href).href,
  appName: "Resenha FC"
};
```

O Client secret permanece somente no painel do Supabase. No Google Cloud, mantenha o domínio do Cloudflare em **Authorized JavaScript origins**. No Supabase, mantenha o provedor Google ativo com o mesmo Client ID.
