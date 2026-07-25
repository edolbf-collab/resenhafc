# Resenha FC — Beta 1.0 Build 121

## Entregas desta build

- substitui os 20 escudos disponíveis na criação/personalização de grupos por uma nova coleção com visual mais profissional e temática de futebol;
- reforça a leitura da foto da conta Google no frontend, incluindo mais fontes de metadados do provedor e fallback local para o jogador autenticado;
- amplia a política de imagens para URLs de avatar do ecossistema Google;
- adiciona notificação push individual ao criar uma cobrança, enviada somente ao membro vinculado à cobrança;
- prepara a Edge Function para a nova ação `charge-created`;
- inclui migração SQL para copiar foto do perfil para jogadores já existentes e garantir que novos ingressos por código herdem a foto da conta Google.

## Arquivos mais importantes alterados

- `index.html`
- `app.js`
- `group-avatars-data.js`
- `_headers`
- `service-worker.js`
- `pwa-bootstrap.js`
- `version.json`
- `supabase/functions/publish-announcement/index.ts`
- `backend/backend-migration-beta-1.0-build-121.sql`
- `backend/backend-healthcheck-beta-1.0-build-121.sql`
