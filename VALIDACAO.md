# Validação da versão 0.3.2

## Verificações executadas

- `app.js` validado com `node --check`;
- `service-worker.js` validado com `node --check`;
- `manifest.webmanifest` validado como JSON;
- pacote de atualização conferido sem `supabase-config.js`;
- migração escrita de forma idempotente para colunas, índices e funções;
- exclusão de grupo protegida por autenticação, papel de proprietário e confirmação textual;
- criação de recorrência protegida por permissões de organização e limite de 52 ocorrências;
- exclusões de partidas protegidas no servidor pelo horário do evento;
- tabelas filhas permanecem vinculadas por `ON DELETE CASCADE`.

## Testes obrigatórios após publicar

1. criar um grupo de teste;
2. agendar uma pelada única;
3. agendar uma série com 3 ocorrências semanais;
4. confirmar que as três datas aparecem em **Jogos**;
5. excluir somente a segunda ocorrência;
6. criar outra série e excluir a primeira ocorrência e as próximas;
7. confirmar que jogos já realizados não oferecem exclusão;
8. excluir um grupo de teste digitando `EXCLUIR`;
9. confirmar que outro grupo do mesmo usuário continua acessível;
10. testar em Safari/iOS e Chrome/Android após atualização do cache.

O teste real das RPCs depende da execução da migração no projeto Supabase conectado.
