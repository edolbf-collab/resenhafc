# Atualização Resenha FC v0.2.4

Esta versão corrige a marca ausente na tela de login e adiciona um fluxo de login Google compatível com Safari/PWA no iPhone.

## Arquivos alterados

- `app.js`
- `index.html`
- `styles.css`
- `service-worker.js`
- `_headers`
- `login-logo-v024.png`
- `brand/login-logo-v024.png`
- documentação

## Etapa necessária no arquivo já configurado

Mantenha sua Project URL e sua Publishable key. Dentro de `window.RESENHA_CONFIG`, acrescente o Client ID público do cliente Web criado no Google Cloud:

```javascript
window.RESENHA_CONFIG = {
  supabaseUrl: "https://SEU-PROJETO.supabase.co",
  supabasePublishableKey: "sb_publishable_SUA_CHAVE",
  googleClientId: "SEU_CLIENT_ID.apps.googleusercontent.com",
  authRedirectUrl: new URL("./", window.location.href).href,
  appName: "Resenha FC"
};
```

O Client ID é público. Não coloque o Client secret nesse arquivo.

## Publicação

Substitua os arquivos do pacote na raiz do repositório, preserve e ajuste o seu `supabase-config.js`, faça commit e aguarde o novo deploy do Cloudflare.

Depois, no iPhone, feche a PWA por completo e abra novamente. Se ainda aparecer a versão anterior, remova o atalho e instale novamente pelo Safari.
