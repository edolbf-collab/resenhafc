# Resenha FC — Beta 1.0 Build 112

## Alteração

- A confirmação de presença do próprio participante agora apresenta apenas **Vou jogar** e **Não vou**.
- A opção **Talvez** foi retirada dessa tela.
- Respostas antigas marcadas como `maybe` continuam preservadas no histórico e, ao abrir a confirmação, o participante é solicitado a escolher uma resposta definitiva.
- A gestão administrativa de presenças permanece compatível com registros antigos de `maybe`.

## Publicação

1. Preserve `supabase-config.js`.
2. Execute `backend/backend-migration-beta-1.0-build-112.sql`.
3. Execute `backend/backend-healthcheck-beta-1.0-build-112.sql`.
4. Envie `app.js`, `service-worker.js` e `version.json`.

Banco: Build 110.
Edge Function: Build 102.
