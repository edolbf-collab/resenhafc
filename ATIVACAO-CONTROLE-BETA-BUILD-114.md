# Ativação do controle fechado — Build 114

A migração já bloqueia o carregamento do aplicativo e o acesso aos dados para e-mails não autorizados. Para impedir também a criação da conta no Supabase Auth, ative o hook uma única vez.

## Antes de ativar

1. Execute `backend/backend-migration-beta-1.0-build-114.sql`.
2. Execute o healthcheck.
3. Confirme que todos os usuários atuais aparecem como `active` em `beta_access`.
4. Autorize previamente os novos e-mails pelo Painel Beta ou pelo SQL modelo.

## No painel do Supabase

1. Abra **Authentication**.
2. Abra **Hooks**.
3. Em **Before User Created**, escolha uma função Postgres.
4. Selecione `public.hook_beta_access_before_user_created`.
5. Salve e habilite.

Depois disso, somente e-mails com status `invited` ou `active` poderão criar uma nova conta.

## Teste recomendado

- e-mail autorizado: o login deve prosseguir;
- e-mail não listado: a criação deve ser recusada;
- usuário ativo bloqueado pelo Painel Beta: a próxima consulta deve ser recusada, mesmo que o app continue instalado.

Não desative `Allow new users to sign up`, pois o hook é que decide quais novos usuários podem entrar.
