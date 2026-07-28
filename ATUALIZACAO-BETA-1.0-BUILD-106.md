# Resenha FC — Beta 1.0 Build 106

## Correção do Cloudflare Web Analytics

A Build 105 deixava a ativação dependente da injeção automática feita pelo Cloudflare Pages. O comentário presente no `index.html` não executava nenhuma configuração.

A Build 106 insere explicitamente o beacon oficial antes do fechamento do `body`:

```html
<script
  type="module"
  src="https://static.cloudflareinsights.com/beacon.min.js"
  data-cf-beacon='{"token":"5af5f626d10e4df1866bae8757dc335d"}'
></script>
```

A política CSP do arquivo `_headers` permite:

- carregamento do script em `https://static.cloudflareinsights.com/beacon.min.js`;
- envio manual das métricas para `https://cloudflareinsights.com`.

## Publicação

1. Publique todos os arquivos do frontend da Build 106, inclusive `_headers`.
2. No painel da Cloudflare, abra **Web Analytics → Manage site**.
3. Selecione **Enable with JS Snippet installation**.
4. Faça um novo deploy.
5. Abra o aplicativo em uma janela sem bloqueador de anúncios e navegue entre algumas telas.
6. No DevTools, confirme uma requisição `POST` para `cloudflareinsights.com/cdn-cgi/rum`.

Não há migração SQL. O banco permanece na Build 104 e a Edge Function na Build 102.
