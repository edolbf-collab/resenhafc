# Atualização — Beta 1.0 Build 127

## Base

- Base utilizada: **Beta 1.0 Build 126 corrigida**.

## Objetivo

Substituir os 20 escudos de grupo por uma nova coleção com acabamento mais profissional e com área de segurança suficiente para eliminar os recortes visuais percebidos dentro do app.

## Entregas da Build 127

1. Recriação individual dos 20 escudos de grupo.
2. Exportação dos novos escudos em PNG com transparência.
3. Nova pasta `assets/group-avatars-build-127`.
4. Atualização do mapa de avatares em `group-avatars-data.js`.
5. Atualização do cache e do pré-carregamento em `service-worker.js`.
6. Atualização de identidade da versão em `app.js`, `index.html` e `version.json`.
7. Atualização do `README.md` com as últimas builds.

## Compatibilidade

- As chaves foram preservadas de `badge-01` a `badge-20`.
- Não há necessidade de alteração no banco.
- Não há necessidade de alteração em Edge Functions.

## Arquivos principais alterados

- `app.js`
- `index.html`
- `group-avatars-data.js`
- `service-worker.js`
- `version.json`
- `README.md`
- `ATUALIZACAO-BETA-1.0-BUILD-127.md`
- `assets/group-avatars-build-127/badge-01.png` até `badge-20.png`

## Publicação

Suba integralmente a Build 127 no GitHub e publique normalmente no Cloudflare Pages.
