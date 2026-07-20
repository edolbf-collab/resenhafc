# Resenha FC v0.2.4

Aplicativo PWA para organizar peladas entre amigos, com autenticação, banco e sincronização em nuvem pelo Supabase.

## Alterações desta versão

- correção do logotipo ausente na tela de login;
- imagem de acesso otimizada, versionada e incluída na raiz do site;
- fallback automático para o ícone Apple caso a imagem principal falhe;
- login Google direto pelo Google Identity Services e `signInWithIdToken` do Supabase;
- fluxo em popup para evitar a tela/arquivo `authorize` observada no iPhone;
- nonce criptográfico aplicado ao login Google;
- fluxo OAuth anterior mantido como fallback;
- CSP atualizada para os serviços oficiais do Google e para fotos de perfil;
- cache da PWA atualizado para v0.2.4.

## Configuração

Preencha `supabase-config.js` com:

```javascript
window.RESENHA_CONFIG = {
  supabaseUrl: "https://SEU-PROJETO.supabase.co",
  supabasePublishableKey: "sb_publishable_SUA_CHAVE",
  googleClientId: "SEU_CLIENT_ID.apps.googleusercontent.com",
  authRedirectUrl: new URL("./", window.location.href).href,
  appName: "Resenha FC"
};
```

O `googleClientId` é o Client ID do cliente OAuth do tipo **Web application** criado no Google Cloud. O Client secret permanece somente no Supabase.

## Primeiro acesso

1. Entre com Google ou por e-mail.
2. Crie um grupo ou entre usando um código de convite.
3. Cadastre jogadores, jogos e demais dados.
4. Para trocar de conta, toque no avatar e selecione **Sair da conta**.

## Publicação

O projeto é estático e não possui etapa de build:

- Build command: vazio;
- Build output directory: raiz do projeto;
- branch de produção: `main`.

O backend existente continua compatível. Não é necessária nova migração SQL.
