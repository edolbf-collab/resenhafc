# Atualização — Beta 1.0 Build 132

## Desfazer separação dos times

Administrador e organizador passam a visualizar **Desfazer separação** na aba **Times** sempre que o evento possuir equipes formadas.

Ao confirmar a operação, o sistema:

- remove todos os registros da separação atual;
- elimina as definições de goleiros daquela separação;
- devolve a tela ao estado **Times ainda não formados**;
- preserva as confirmações e ausências do evento;
- preserva o sorteio da espera;
- preserva a quantidade de times configurada;
- preserva todos os dados do evento.

A ação não exclui jogadores, não altera presença e não refaz automaticamente os times. O administrador ou organizador poderá usar **Separar** novamente quando necessário.

## Permissões e auditoria

A exclusão dos registros ocorre por meio da função protegida `clear_match_team_assignments`. Apenas quem possui permissão para administrar partidas pode executá-la. A operação é registrada no log como `match_teams_cleared`.

## Implantação

1. Execute `backend/backend-migration-beta-1.0-build-132.sql`.
2. Execute `backend/backend-healthcheck-beta-1.0-build-132.sql`.
3. Publique os arquivos do pacote incremental.
4. Preserve o `supabase-config.js`.

Não há alteração de Edge Function nesta build.
