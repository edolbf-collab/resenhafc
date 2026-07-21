# Resenha FC v0.3.2

PWA para organização de futebol entre amigos, com backend Supabase e login exclusivo por conta Google.

## Recursos principais

- grupos personalizados com 20 escudos;
- proprietário, administrador, organizador, tesoureiro e membro;
- exclusão permanente de grupo restrita ao proprietário;
- agenda de peladas únicas ou repetidas semanalmente;
- exclusão de jogos somente antes do horário, preservando o histórico;
- presença, lista de espera e confraternização;
- times equilibrados por posição, goleiros e avaliações confidenciais;
- caixa com permissões restritas;
- convite por WhatsApp, link e código;
- instalação como PWA no Android e no iOS.

## Atualização da v0.3.1.6

Execute primeiro `backend/migration-v0.3.2.sql` no SQL Editor do Supabase. Depois publique os arquivos do frontend preservando o seu `supabase-config.js`.

## Projeto novo

Execute `backend/supabase-schema.sql` e configure `supabase-config.js` com Project URL, Publishable key e Google Client ID.
