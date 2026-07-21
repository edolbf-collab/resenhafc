# Validação técnica v0.3.4

- `app.js`: sintaxe validada com Node.js.
- Edge Function: sintaxe empacotada com esbuild e tipos verificados com TypeScript.
- Service worker: cache alterado para `resenha-fc-v0.3.4`.
- Migração: funções transacionais e permissões revisadas.
- Pacote de atualização: não inclui `supabase-config.js`.

## Fluxos revisados

- Publicar, reenviar e excluir aviso.
- Criar pelada e notificar grupo.
- Confirmar presença e notificar demais membros.
- Excluir pagamento, despesa e cobrança.
- Reabrir cobrança após exclusão do pagamento vinculado.
- Lista de membros compacta.
