# Validação v0.3.2.1

## Verificações estáticas

- `app.js` validado com `node --check`;
- caminhos e versões do cache atualizados para v0.3.2.1;
- pacote de atualização não contém `supabase-config.js`;
- migração e healthcheck incluídos no backend;
- todos os cartões de pelada possuem ação de abertura e suporte a teclado;
- campo `datetime-local` limitado à largura disponível;
- churrasco removido da criação e inserido nos detalhes da pelada.

## Testes funcionais recomendados

1. conferir que o antigo proprietário aparece como Administrador;
2. conferir que existe apenas um administrador no grupo;
3. delegar organizador, tesoureiro e membro;
4. transferir a administração e confirmar que o usuário anterior virou membro;
5. tocar em qualquer área de um cartão de pelada;
6. criar uma série semanal e ativar churrasco somente em uma ocorrência;
7. confirmar que as demais ocorrências permanecem sem churrasco;
8. testar o campo de data e hora no iPhone sem transbordamento lateral.
