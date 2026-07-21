# Resenha FC v0.3.2.1

PWA para organização de futebol entre amigos, com backend Supabase e login exclusivo por conta Google.

## Recursos principais

- grupos personalizados com 20 escudos;
- um único administrador por grupo;
- funções delegáveis de organizador, tesoureiro e membro;
- exclusão permanente do grupo restrita ao administrador;
- agenda de peladas únicas ou repetidas semanalmente;
- cartões de peladas inteiramente clicáveis;
- exclusão de jogos somente antes do horário, preservando o histórico;
- churrasco configurado pelo administrador dentro de cada pelada;
- presença, lista de espera e confraternização separadas por evento;
- times equilibrados por posição, goleiros e avaliações confidenciais;
- caixa com alterações restritas ao administrador e tesoureiro;
- convite por WhatsApp, link e código;
- instalação como PWA no Android e no iOS.

## Atualização da v0.3.2

Execute primeiro `backend/migration-v0.3.2.1.sql` em uma nova consulta no SQL Editor do Supabase. Depois publique os arquivos do frontend, preservando o seu `supabase-config.js`.

## Projeto novo

Execute `backend/supabase-schema.sql` e configure `supabase-config.js` com Project URL, Publishable key e Google Client ID.
