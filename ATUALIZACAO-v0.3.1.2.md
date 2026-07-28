# Resenha FC v0.3.1.2 — correção do acesso Google

Esta revisão mantém o visual aprovado e corrige somente o acionamento do login.

## Correção

O componente oficial do Google deixa de ficar praticamente invisível. Ele permanece ativo, em tamanho integral, abaixo da camada visual do aplicativo. A camada visual não captura toques, permitindo que o clique chegue diretamente ao botão oficial do Google.

Também foram adicionados:

- `pointer-events` explícito no botão e no iframe do Google;
- suporte a toque com `touch-action: manipulation`;
- verificação após a renderização do iframe;
- atualização do cache para `resenha-fc-v0.3.1.2`.

## Atualização

Copie os arquivos do pacote para a raiz do repositório. Preserve o seu `supabase-config.js`.

Não há alteração no banco de dados.
