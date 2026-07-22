# Resenha FC — Beta 1.0 Build 105

PWA para organização de grupos esportivos, com backend Supabase e login por conta Google.


## Novidade da Build 105

- Corrigida a Content Security Policy para permitir o Cloudflare Web Analytics com instalação automática.
- O banco permanece na Build 104 e a Edge Function na Build 102.
- Consulte `ATUALIZACAO-BETA-1.0-BUILD-105.md`.

## Novidades da Build 104

- administrador e organizador podem registrar presença ou ausência de outros membros;
- painel único para gerenciar todas as respostas de uma pelada;
- sorteio dos participantes excedentes para a espera inicial;
- ordem persistente da espera;
- novas confirmações entram no fim da espera quando o sorteio já ocorreu e o limite está preenchido;
- promoção automática quando uma vaga inicial é liberada;
- separação de times bloqueada enquanto houver excedentes sem sorteio.

Antes de publicar o frontend, execute `backend/backend-migration-beta-1.0-build-104.sql`. Consulte `ATUALIZACAO-BETA-1.0-BUILD-104.md`.

## Recursos principais

- grupos personalizados com 20 escudos;
- administrador único, organizador, tesoureiro e membros;
- agenda de peladas únicas ou repetidas semanalmente;
- presença, espera inicial e confraternização por evento;
- times equilibrados por posição, goleiros e avaliações confidenciais;
- caixa, cobranças, pagamentos e despesas;
- avisos e notificações Web Push;
- instalação como PWA no Android e no iOS.
