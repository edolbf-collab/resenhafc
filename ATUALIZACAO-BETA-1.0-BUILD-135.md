# Atualização — Beta 1.0 Build 135

## Entregas

- saúde persistente das assinaturas push;
- histórico individual de tentativas e falhas;
- teste de push por aparelho;
- painel de análise dos últimos 30 dias;
- exportação integral do grupo somente para o administrador da plataforma;
- cobranças em lote para vários membros;
- push individual preservado para cada cobrança.

## Banco

Execute:

1. `backend/backend-migration-beta-1.0-build-135.sql`;
2. `backend/backend-healthcheck-beta-1.0-build-135.sql`.

A migração não apaga cobranças, assinaturas ou históricos existentes. Assinaturas antigas começam como “não testadas” até o próximo envio.

## Edge Function

Republicar `publish-announcement` com:

`backend/publish-announcement-edge-build-107.ts`

A função deixa de excluir assinaturas 404/410. Elas são marcadas como inválidas para preservar o histórico de métricas.

`delete-beta-user` permanece inalterada.

## Frontend

Publicar o pacote incremental e preservar `supabase-config.js`.

Versões esperadas: Frontend 135, Banco 135 e Edge 107.
