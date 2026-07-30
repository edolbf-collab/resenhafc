# Atualização — Beta 1.0 Build 131

## Escopo

A Build 131 amplia o controle de eventos e da separação dos times.

### Sorteio da espera

- mantém a opção **Refazer sorteio**;
- adiciona **Excluir sorteio** para administrador e organizador;
- devolve os jogadores da espera para **Começam jogando**;
- limpa as posições da espera e os identificadores do sorteio;
- remove separações de times que ficaram incompatíveis com o resultado excluído.

### Edição do evento

Em eventos futuros, administrador e organizador podem alterar:

- máximo de jogadores;
- jogadores por time, agora opcional;
- observações.

Em uma série recorrente, a edição afeta apenas a ocorrência selecionada.

### Aba Times

- o administrador ou organizador escolhe de 2 a 12 times;
- o número de times não pode superar a quantidade de confirmados;
- a escolha fica salva no evento;
- **Separar** e **Rebalancear** respeitam essa quantidade;
- a distribuição continua priorizando goleiros principais e completando vagas com jogadores que também podem atuar no gol.

## Implantação

1. Execute a migração SQL da Build 131.
2. Execute o healthcheck.
3. Publique o pacote incremental.
4. Preserve `supabase-config.js`.

Não há alteração de Edge Function nesta build.
