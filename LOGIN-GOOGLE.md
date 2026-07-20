# Login Google — Resenha FC v0.2.4

A versão v0.2.4 usa preferencialmente o Google Identity Services no navegador. O Google entrega um ID token em popup, e o Supabase cria a sessão por `signInWithIdToken`. Esse fluxo evita a navegação direta até o endpoint `authorize`, que pode ser tratada incorretamente pela PWA no iPhone.

## 1. Google Cloud

Use um cliente OAuth do tipo **Web application**.

Em **Authorized JavaScript origins**, cadastre:

```text
https://SEU-PROJETO.pages.dev
http://localhost:8080
```

Adicione também o domínio próprio quando existir. A origem não deve conter caminho.

Em **Authorized redirect URIs**, mantenha a Callback URL exibida pelo Supabase:

```text
https://SEU-PROJETO.supabase.co/auth/v1/callback
```

## 2. Supabase

Em **Authentication → Sign In / Providers → Google**:

- habilite Google;
- informe o Client ID;
- informe o Client secret;
- salve.

Em **Authentication → URL Configuration**, mantenha a URL pública do Cloudflare como Site URL e Redirect URL.

## 3. Frontend

Acrescente o mesmo Client ID público ao arquivo `supabase-config.js`:

```javascript
googleClientId: "SEU_CLIENT_ID.apps.googleusercontent.com",
```

Não coloque o Client secret no frontend.

## 4. Funcionamento

Quando `googleClientId` está preenchido, a tela mostra o botão oficial do Google e conclui a sessão sem navegar para o arquivo `authorize`. Se o script do Google não carregar ou o Client ID estiver ausente, o aplicativo apresenta o fluxo OAuth do Supabase como fallback.

## 5. Teste no iPhone

1. publique a v0.2.4;
2. feche completamente a PWA;
3. abra novamente;
4. toque em **Continuar com Google**;
5. selecione a conta;
6. confirme o retorno ao aplicativo autenticado;
7. use **Sair da conta** e repita com outra conta.
