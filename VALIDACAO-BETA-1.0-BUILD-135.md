# Validação — Beta 1.0 Build 135

Validações locais executadas:

- sintaxe de `app.js`, `group-avatars-data.js`, `pwa-bootstrap.js` e `service-worker.js`;
- leitura de `version.json`, `manifest.json` e `manifest.webmanifest`;
- consistência das versões Frontend 135, Banco 135 e Edge 107;
- ausência do `supabase-config.js` no pacote incremental;
- presença da migração, healthcheck, auditoria e Edge Function;
- presença do backup de planejamento em `docs/PLANEJAMENTO-MESTRE-TAMO-ON.md`.

A validação definitiva das funções SQL depende da execução da migração e do healthcheck no projeto Supabase.
