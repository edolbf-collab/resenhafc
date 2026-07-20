# Validação — Resenha FC v0.2.1

## Validações realizadas no pacote

- sintaxe de `app.js` validada com `node --check`;
- sintaxe PostgreSQL do esquema validada por parser (`pglast`);
- manifesto PWA interpretado como JSON válido;
- arquivos referenciados pelo service worker conferidos;
- configuração do Supabase mantida sem chaves administrativas;
- fluxo local de demonstração executado em DOM simulado;
- navegação para Times e confirmação de presença executadas sem erro;
- visibilidade de ações validada para member, treasurer e organizer;
- RPC de pagamento substitui a gravação em duas etapas;
- RPC de escalação substitui exclusão/inserção não transacional;
- assinatura Realtime filtrada por `group_id`;
- avaliação repetida reutiliza o registro anterior.

## Validação ainda necessária em projeto real

A conexão real não pode ser validada sem Project URL e Publishable key de um projeto Supabase ativo. Após executar o esquema, devem ser testados em dois aparelhos:

1. cadastro e login;
2. criação e ingresso em grupo;
3. presença e churrasco;
4. atualização em tempo real;
5. sorteio dos times;
6. cobrança e pagamento;
7. avaliação repetida;
8. bloqueios por função do membro;
9. encerramento e renovação de sessão.


## Login Google

- `app.js` validado sintaticamente após a inclusão de `signInWithOAuth`;
- redirecionamento calculado pela pasta pública atual do aplicativo;
- tratamento visual de erro OAuth implementado;
- perfil compatível com metadados usuais do Google;
- ativação real depende de Client ID/Secret no Google e no painel Supabase.
