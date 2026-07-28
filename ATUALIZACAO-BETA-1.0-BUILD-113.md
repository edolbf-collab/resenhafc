# Resenha FC — Beta 1.0 Build 113

## Alterações

- Uma cobrança deixa de ser marcada como paga após qualquer pagamento.
- Pagamentos inferiores ao saldo passam a registrar a cobrança como **Parcial**.
- A cobrança mostra total, valor já pago e saldo restante.
- Pagamentos sucessivos são acumulados na mesma cobrança.
- O status muda para **Pago** somente quando a soma vinculada atinge o valor total.
- O sistema bloqueia pagamento maior que o saldo restante.
- Ao excluir um pagamento, total, saldo e status são recalculados.
- Cobranças antigas incorretamente marcadas como pagas são corrigidas pela migração.

## Publicação

1. Preserve `supabase-config.js`.
2. Execute `backend/backend-migration-beta-1.0-build-113.sql`.
3. Execute `backend/backend-healthcheck-beta-1.0-build-113.sql`.
4. Envie `app.js`, `styles.css`, `service-worker.js` e `version.json`.

Banco: Build 113.
Edge Function: Build 102.
