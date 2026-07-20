# Changelog

## v0.2.0 — backend pronto para ativação

- esquema Supabase revisto e idempotente para projeto novo;
- permissões separadas para proprietário, administrador, organizador, tesoureiro e membro;
- `group_id` nas tabelas filhas para sincronização Realtime filtrada por grupo;
- sorteio de times salvo por RPC transacional;
- pagamento e baixa de cobrança realizados na mesma transação;
- atualização de perfil sincronizada com os jogadores vinculados;
- correção de avaliações repetidas;
- notas recebidas passam a participar do balanceamento dos times;
- Realtime com recarga agrupada e sem reinscrição a cada evento;
- falha de backend não é mais mascarada como modo local;
- arquivo de conferência pós-instalação incluído.

## v0.1.1

- identidade visual oficial;
- ícones e recursos PWA para Android e iOS.

## v0.1.0

- primeira versão funcional local e estrutura inicial Supabase.
