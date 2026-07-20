# Resenha FC v0.3.0 — atualização obrigatória de banco e frontend

Esta versão altera o modelo de dados. A ordem correta é:

1. No Supabase, abra **SQL Editor**.
2. Abra `backend/migration-v0.3.0.sql` no computador.
3. Copie todo o conteúdo do arquivo e cole no SQL Editor.
4. Execute como `postgres` na `Primary Database`.
5. Execute `backend/backend-healthcheck.sql` e confira 14 tabelas.
6. Somente depois, envie os arquivos do pacote de atualização para o GitHub.
7. Preserve o seu `supabase-config.js` atual.

## Arquivos que devem ser substituídos

- `index.html`
- `app.js`
- `styles.css`
- `service-worker.js`
- `manifest.webmanifest`
- `_headers`
- pasta `assets/group-avatars/`
- pasta `backend/`
- documentação incluída no pacote

## Não substitua

- `supabase-config.js`

Ele contém sua Project URL, Publishable key e Google Client ID.

## Limpeza de cache

Após o deploy, abra a URL no navegador e recarregue. No iPhone, feche completamente a PWA e abra novamente. Caso ainda apareça a versão anterior, remova o atalho da Tela de Início e instale novamente pelo Safari.
