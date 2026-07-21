# Resenha FC v0.3.4

## Escopo

- Excluir e reenviar avisos pela Central de avisos.
- Notificação push quando uma pelada é criada.
- Notificação push quando um jogador confirma presença.
- Exclusão segura de pagamentos, despesas e cobranças no Caixa.
- Aba Membros mais compacta, sem o resumo redundante do grupo e sem o botão Minha posição.

## Permissões

- Avisos: administrador e organizador podem publicar, reenviar e excluir.
- Caixa: administrador e tesoureiro podem criar e excluir lançamentos.
- Avaliações: continuam confidenciais; somente o administrador visualiza médias.

## Ordem de atualização

### 1. Banco de dados

No SQL Editor do Supabase, abra uma nova consulta e execute todo o conteúdo de:

`backend/migration-v0.3.4.sql`

Depois, em outra consulta, execute:

`backend/backend-healthcheck-v0.3.4.sql`

O healthcheck deve listar as funções `delete_announcement` e `delete_finance_entry`.

### 2. Edge Function

Abra a função `publish-announcement` e substitua integralmente o código pelo arquivo:

`supabase/functions/publish-announcement/index.ts`

Mantenha `Verify JWT` desativado e faça Deploy/Redeploy.

As chaves VAPID não mudam. Mantenha:

- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`

### 3. Frontend

Substitua no GitHub:

- `app.js`
- `styles.css`
- `service-worker.js`

Não substitua `supabase-config.js`.

## Testes mínimos

1. Publique um aviso e abra a Central de avisos.
2. Reenvie o aviso.
3. Exclua o aviso.
4. Agende uma pelada e confira o push nos aparelhos vinculados.
5. Confirme presença com outro usuário e confira a notificação aos demais integrantes.
6. Crie pagamento, despesa e cobrança; exclua cada tipo.
7. Confirme que a aba Membros exibe mais integrantes na mesma tela.

## Observações

- Excluir um aviso não remove notificações que já foram entregues no sistema operacional.
- Ao excluir um pagamento vinculado, a cobrança volta para aberta ou vencida quando não houver outro pagamento associado.
- Ao criar uma série semanal, é enviado um único push informando a série e a data da primeira ocorrência.
