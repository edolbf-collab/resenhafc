# Resenha FC v0.3.1.3 — Correção do login Google

Esta revisão altera somente o acionamento do login Google.

## Correção

A camada visual que ficava sobre o botão oficial foi removida. O usuário agora toca diretamente no botão renderizado pelo Google Identity Services, em tema escuro, eliminando o bloqueio de clique/toque observado no navegador e no iOS.

## Arquivos alterados

- `app.js`
- `styles.css`
- `index.html`
- `service-worker.js`

## Publicação

Copie os arquivos do pacote de atualização para a raiz do repositório e mantenha o seu `supabase-config.js` atual.

Não há alteração no banco de dados e nenhum SQL deve ser executado.
