# Resenha FC — Beta 1.0 Build 111

## Churrasco em um único balão

- Remove a duplicidade entre o balão de status e o balão de participantes.
- O mesmo balão passa a exibir **Churrasco confirmado**.
- Mostra a quantidade de participantes e acompanhantes.
- Mostra o valor por pessoa somente quando o valor configurado for maior que zero.
- O comando **Ver nomes** expande, dentro do próprio balão, a relação de membros confirmados.
- A lista expandida mantém acompanhantes, itens que cada pessoa levará e a identificação de convidados.
- O selo discreto `♨` continua aparecendo nas listas de presença.

## Sorteio da espera

- Reduz margens, preenchimento, ícone e textos do bloco de status.
- Mantém todas as informações e ações, ocupando menos espaço vertical.

## Publicação

1. Preserve o seu `supabase-config.js` atual.
2. Execute `backend/backend-migration-beta-1.0-build-111.sql` para registrar a nova versão.
3. Execute `backend/backend-healthcheck-beta-1.0-build-111.sql`.
4. Publique os demais arquivos da Build 111.

Banco esperado: Build 110. Edge Function: Build 102.
