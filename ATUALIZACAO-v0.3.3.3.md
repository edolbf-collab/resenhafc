# Resenha FC v0.3.3.3 — vínculo e envio de notificações

Esta revisão corrige dois pontos diferentes:

1. O aplicativo considerava as notificações ativas apenas porque o iPhone possuía uma assinatura local, mesmo quando ela não estava vinculada à tabela `push_subscriptions`.
2. A Edge Function utilizava o pacote Node.js `web-push` dentro do runtime Deno. A função agora usa `web-push-neo`, baseado em Web Crypto e `fetch`, compatível com runtimes de borda.

## Atualização da Edge Function

No Supabase, abra:

`Edge Functions > publish-announcement`

Substitua todo o código por:

`supabase/functions/publish-announcement/index.ts`

Mantenha a verificação JWT do gateway desativada, pois o próprio código valida o token do usuário.

Faça Deploy/Redeploy.

Os secrets continuam os mesmos:

- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`

Não gere novas chaves.

## Atualização do GitHub

Substitua:

- `app.js`
- `service-worker.js`

Preserve `supabase-config.js`.

## Depois do deploy

No iPhone:

1. Feche completamente o Resenha FC.
2. Abra pelo ícone da Tela de Início.
3. Acesse `Mais > Notificações no celular`.
4. Se aparecer `Aguardando vinculação`, toque em `Vincular novamente`.
5. Publique um novo aviso.

O retorno agora distingue:

- nenhum aparelho vinculado;
- aparelho vinculado, mas envio com falha;
- envio concluído.

## Diagnóstico opcional

Execute `backend/push-diagnostic-v0.3.3.3.sql` no SQL Editor para conferir quantas assinaturas ativas existem por grupo. A consulta é somente leitura.
