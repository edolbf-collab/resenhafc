# Edge Function `publish-announcement` — Build 109

## Alterações

- gera um `delivery_id` para cada notificação/aparelho;
- registra cada tentativa interna na RPC `record_push_delivery_attempt_v2`;
- diferencia falha intermediária de resultado final;
- identifica recuperação quando a tentativa 2 ou 3 é aceita;
- categoriza transporte, timeout, rate limit, indisponibilidade, autenticação, payload e assinatura inválida;
- retorna ao frontend apenas mensagem simplificada, mantendo o detalhe técnico nos registros protegidos;
- mantém três tentativas apenas para falhas transitórias.

## Publicação

Substitua somente o código da função `publish-announcement` e publique novamente. Não altere `delete-beta-user`.
