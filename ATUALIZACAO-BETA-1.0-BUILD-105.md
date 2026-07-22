# Resenha FC — Beta 1.0 Build 105

## Correção do Cloudflare Web Analytics

A Build 104 já não continha um snippet manual no `index.html`. O código exibido no HTML publicado é acrescentado automaticamente pelo Cloudflare Pages quando a instalação automática do Web Analytics está habilitada.

O problema estava na política de segurança do arquivo `_headers`, que não autorizava os dois endereços usados pelo Web Analytics. A Build 105 adiciona:

- `https://static.cloudflareinsights.com` em `script-src`;
- `https://cloudflareinsights.com` em `connect-src`.

O `index.html` continua sem um beacon manual para evitar carregamento duplicado.

## Publicação

1. Publique todo o frontend da Build 105, inclusive o arquivo `_headers`.
2. No Cloudflare Pages, mantenha o Web Analytics em instalação automática.
3. Não é necessário executar SQL: o banco permanece na Build 104 e a Edge Function permanece na Build 102.
4. Após o deploy, abra o site em janela privada, acesse algumas telas e aguarde alguns minutos para conferir os dados no painel do Web Analytics.

## Observação sobre o token

O token que aparece no código-fonte publicado é definido pelo site cadastrado no painel do Cloudflare Web Analytics. Ele não vem do `index.html` deste pacote. Para trocar o token, é necessário corrigir o site/hostname no painel do Cloudflare, e não editar o HTML.
