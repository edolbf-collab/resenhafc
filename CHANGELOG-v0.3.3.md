# Changelog v0.3.3

## Adicionado

- notificações Web Push para avisos;
- configuração por aparelho;
- central de avisos;
- tabela `push_subscriptions`;
- RPCs `save_push_subscription` e `remove_push_subscription`;
- Edge Function `publish-announcement`;
- métricas de envio nos avisos;
- geradores local e Node para chaves VAPID.

## Alterado

- publicação de avisos passa pela Edge Function;
- service worker recebe eventos `push` e `notificationclick`;
- versão do cache atualizada para `resenha-fc-v0.3.3`.

## v0.3.3.3

- validação do vínculo da assinatura push no banco;
- estado "Aguardando vinculação" quando o aparelho possui permissão local sem registro no Supabase;
- retorno distinto entre ausência de assinaturas e falha de entrega;
- substituição do pacote Node.js `web-push` por implementação compatível com Deno/Web Crypto;
- detalhes seguros do primeiro erro de entrega no retorno da Edge Function.
