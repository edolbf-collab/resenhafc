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
