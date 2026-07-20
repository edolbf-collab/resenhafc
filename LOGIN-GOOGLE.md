# Login com Google — Resenha FC v0.2.1

O botão **Continuar com Google** já está implementado no frontend. Ele usa o fluxo OAuth do Supabase e foi preparado para navegador e PWA instalada no Android ou iPhone; a validação final deve ser feita nos aparelhos reais após configurar as credenciais. Para ativá-lo, configure o Google Auth Platform e o provedor Google no Supabase.

## 1. Identificar as URLs necessárias

Anote:

- a URL pública do aplicativo no Cloudflare, por exemplo `https://resenha-fc.pages.dev`;
- a URL do projeto Supabase, por exemplo `https://abcdefgh.supabase.co`;
- a Callback URL exibida em **Supabase → Authentication → Sign In / Providers → Google**. Normalmente ela segue o formato `https://SEU-PROJETO.supabase.co/auth/v1/callback`.

Use sempre a Callback URL copiada do painel, sem tentar digitá-la de memória.

## 2. Configurar a marca no Google Auth Platform

1. Abra o Google Cloud Console e crie ou selecione um projeto.
2. Acesse **Google Auth Platform → Branding**.
3. Informe:
   - App name: `Resenha FC`;
   - e-mail de suporte;
   - logotipo do Resenha FC;
   - e-mail de contato do desenvolvedor.
4. Em **Audience**, escolha **External** para uso entre contas Google comuns.
5. Enquanto estiver em testes, mantenha o aplicativo no status de teste e adicione as contas que poderão acessar em **Test users**.
6. Em **Data Access**, mantenha somente os escopos básicos de identidade: `openid`, `email` e `profile`. O aplicativo não solicita acesso ao Drive, Gmail ou outros serviços Google.

## 3. Criar o cliente OAuth

1. Acesse **Google Auth Platform → Clients**.
2. Clique em **Create client**.
3. Selecione **Web application**.
4. Nome sugerido: `Resenha FC Web`.
5. Em **Authorized JavaScript origins**, adicione:

```text
https://SEU-PROJETO.pages.dev
http://localhost:8080
```

Adicione também o domínio próprio quando existir. Não coloque caminho ou barra final nas origens.

6. Em **Authorized redirect URIs**, cole exatamente a Callback URL fornecida pelo Supabase:

```text
https://SEU-PROJETO.supabase.co/auth/v1/callback
```

7. Crie o cliente e copie:
   - Client ID;
   - Client secret.

O Client secret será inserido somente no painel protegido do Supabase. Não o coloque no GitHub, `supabase-config.js` ou código do navegador.

## 4. Ativar Google no Supabase

1. Abra **Authentication → Sign In / Providers → Google**.
2. Ative o provedor.
3. Cole o Client ID e o Client secret criados no Google.
4. Salve.

## 5. Conferir URLs de retorno no Supabase

Em **Authentication → URL Configuration**:

```text
Site URL
https://SEU-PROJETO.pages.dev/

Redirect URLs
https://SEU-PROJETO.pages.dev/**
http://localhost:8080/**
```

Em produção, prefira também cadastrar a URL exata usada no retorno.

## 6. Publicar a v0.2.1

Substitua os arquivos da versão anterior no repositório, confirme que `supabase-config.js` contém a Project URL e a Publishable key e envie ao GitHub. O Cloudflare fará o deploy.

## 7. Testar

1. Abra o app em janela anônima.
2. Clique em **Continuar com Google**.
3. Selecione uma conta autorizada como test user.
4. Autorize o acesso básico.
5. Confirme que o app retorna ao Cloudflare já autenticado.
6. Crie ou entre em um grupo.
7. Saia e faça novo login para validar a persistência da sessão.

## Erros comuns

### `redirect_uri_mismatch`
A Callback URL cadastrada no Google não é idêntica à exibida pelo Supabase. Confira protocolo, domínio, caminho e ausência de espaços.

### `provider is not enabled` ou `Unsupported provider`
O provedor Google ainda não foi ativado no painel do Supabase ou as credenciais não foram salvas.

### `Access blocked` ou usuário não autorizado
O aplicativo está em modo de teste e a conta não foi adicionada em **Audience → Test users**.

### Retorna ao app, mas continua na tela de login
Confira a Site URL e a lista de Redirect URLs do Supabase. Limpe os dados do site ou remova e reinstale a PWA para eliminar uma sessão antiga em cache.


## Aplicativos nativos futuros

Esta versão é uma PWA. Quando o projeto for empacotado como aplicativo nativo por Capacitor, Android Studio ou Xcode, o login deverá ganhar URLs de deep link e clientes OAuth próprios de Android/iOS. Esses clientes não são necessários para o teste web atual.
