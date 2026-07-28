# Resenha FC — Beta 1.0 Build 110

Linha de base: Beta 1.0 Build 109.

## Sorteio da espera

- Corrige definitivamente a constraint `match_attendance_waitlist_reason_check`.
- O motivo `manual_draw`, utilizado pela RPC `draw_match_waitlist_v2`, passa a ser aceito pelo banco.
- Registros antigos com `confirmed_after_draw` são normalizados para `late_confirmation`.
- Novos convidados que entrarem na espera depois de um sorteio também passam a usar `late_confirmation`.
- Motivos legados não reconhecidos são preservados de forma segura como `legacy` antes da nova validação.

## Churrasco

- Cada participante que marcou churrasco recebe um pequeno selo `♨` na lista de presença.
- A seção de confraternização mostra somente o resumo de participantes e acompanhantes inicialmente.
- A lista nominal fica recolhida por padrão e pode ser aberta em **Ver nomes**.
- Ao expandir, continuam visíveis os acompanhantes e o item que cada participante informou que levará.

## Instalação

1. Execute `backend/backend-migration-beta-1.0-build-110.sql` no Supabase SQL Editor.
2. Execute `backend/backend-healthcheck-beta-1.0-build-110.sql`.
3. Confirme que `motivos_invalidos` retorna `0` e que a release ativa é a Build 110.
4. Publique todos os arquivos desta Build 110.

Banco esperado: Build 110. Edge Function: Build 102.
