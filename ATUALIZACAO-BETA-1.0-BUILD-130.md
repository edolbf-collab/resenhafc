# Resenha FC — Beta 1.0 Build 130

## Objetivo

Aprimorar a separação dos times para tratar de forma distinta os goleiros principais e os jogadores que apenas se disponibilizam para atuar no gol.

## Regra de goleiros

1. Jogadores cuja posição principal é **Goleiro** têm prioridade.
2. Cada time recebe, quando possível, um goleiro principal.
3. Se algum time continuar sem goleiro, o sistema utiliza um jogador com **Também posso jogar no gol** marcado.
4. Quando não existem jogadores suficientes nessas condições, o sorteio continua normalmente, sem bloquear a formação dos times e sem inventar goleiros.
5. Goleiros excedentes e jogadores aptos ao gol que não forem necessários para preencher a posição continuam participando do equilíbrio normal por quantidade, posição e avaliações.

## Exibição

Uma luva discreta aparece ao lado da posição principal quando o jogador:

- é goleiro principal; ou
- marcou que também pode jogar no gol.

Na tela dos times, a luva recebe um destaque leve quando o jogador foi definido como goleiro daquele time. A informação também aparece nos cartões da aba Jogos, inclusive em Começam jogando, Não vão, Espera inicial e Pendente de confirmação, além da lista de membros.

## Banco de dados

A tabela `team_assignments` passa a possuir `assigned_goalkeeper`, que identifica o goleiro efetivamente definido para cada time. A função `balance_match_teams` foi atualizada.

## Versões esperadas

- Frontend: Build 130
- Banco: Build 130
- Edge Functions: Build 106

Não há alteração nas Edge Functions.
