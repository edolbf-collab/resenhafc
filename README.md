# Resenha FC v0.3.0

PWA para organização de futebol entre amigos, com backend Supabase e login exclusivo por conta Google.

## Recursos

- grupos personalizados com 20 escudos;
- proprietário, administrador, organizador, tesoureiro e membro;
- transferência de propriedade e delegação de funções;
- agenda, confirmação de presença, lista de espera e churrasco;
- histórico permanente das partidas realizadas;
- times equilibrados por posição, goleiros e avaliações confidenciais;
- membros e perfil esportivo com posições;
- Caixa com permissão restrita;
- convite por WhatsApp, link e código;
- PWA para Android e iOS.

## Atualização de projeto existente

Execute primeiro `backend/migration-v0.3.0.sql`. Depois publique o pacote de frontend, preservando seu `supabase-config.js`.

## Projeto novo

Execute `backend/supabase-schema.sql` integralmente e configure `supabase-config.js` com Project URL, Publishable key e Google Client ID.
