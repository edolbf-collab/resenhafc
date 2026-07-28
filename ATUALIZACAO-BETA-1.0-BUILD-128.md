# Atualização — Beta 1.0 Build 128

## Base

- Base utilizada: **Beta 1.0 Build 127**.

## Objetivo

Permitir que o administrador da plataforma exclua permanentemente um membro do beta fechado, além da opção já existente de bloquear e reativar.

## Implementação

### Painel Beta

Cada usuário, exceto o próprio administrador conectado, passa a exibir:

- `Bloquear` ou `Reativar`;
- `Excluir permanentemente`.

A exclusão exige a digitação exata do e-mail completo.

### Banco de dados

A migração da Build 128:

- adapta referências históricas de autoria para `ON DELETE SET NULL`;
- cria a função interna `platform_prepare_beta_user_deletion`;
- cria a tabela de auditoria `platform_user_deletion_audit`;
- bloqueia a execução direta da preparação por usuários autenticados;
- preserva a execução somente para `service_role`.

### Edge Function

A nova função `delete-beta-user`:

- valida o JWT do solicitante;
- confirma que ele consta em `platform_admins`;
- impede autoexclusão;
- impede exclusão de outro administrador da plataforma;
- prepara e anonimiza os dados no banco;
- executa a exclusão definitiva no Supabase Auth;
- remove o registro de acesso ao beta;
- registra auditoria sem e-mail em texto claro.

## Tratamento dos grupos

- grupos com outros integrantes recebem um novo administrador automaticamente;
- grupos sem outro integrante são excluídos;
- o jogador histórico é anonimizado como `Usuário excluído`.

## Banco e Edge

- Banco esperado: **Build 128**;
- Edge Functions esperadas: **Build 105**.
