# Atualização — Beta 1.0 Build 129

## Objetivo

Melhorar o acompanhamento das confirmações nos eventos ativos e permitir que administrador e organizador reforcem individualmente a necessidade de resposta.

## Alterações no detalhe do evento

Os grupos passam a aparecer nesta ordem:

1. **Começam jogando**;
2. **Não vão**;
3. **Espera inicial**;
4. **Pendente de confirmação**.

O antigo grupo **Talvez** deixa de ser exibido. Registros antigos com status `maybe` são tratados visualmente como pendentes até que o membro dê uma resposta definitiva.

## Pendente de confirmação

A lista considera somente membros ativos do grupo que:

- ainda não possuem resposta registrada; ou
- ainda possuem status antigo `pending` ou `maybe`.

Convidados vinculados exclusivamente ao evento não entram nessa lista.

## Lembrete individual

Administrador e organizador visualizam o botão **Lembrar** ao lado de cada membro pendente. O envio:

- é individual;
- é processado pela Edge Function `publish-announcement`;
- direciona o usuário para o evento correspondente;
- só é aceito se o evento ainda estiver ativo;
- é bloqueado caso o membro já tenha confirmado presença, ausência ou esteja na espera.

## Versões esperadas

- Frontend: **Build 129**;
- Banco: **Build 128**;
- Edge Functions: **Build 106**.

## Implantação

1. Publique a nova versão da Edge Function `publish-announcement`.
2. Execute a migração de metadados da Build 129.
3. Execute o healthcheck.
4. Publique o pacote incremental no GitHub.
5. Preserve `supabase-config.js`.
6. Preserve a Edge Function separada `delete-beta-user`.
