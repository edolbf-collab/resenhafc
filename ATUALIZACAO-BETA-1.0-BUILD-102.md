# Resenha FC — Beta 1.0 Build 102

## Novidades

- No primeiro acesso pelo aplicativo instalado, um pop-up central sugere ativar notificações.
- O usuário pode ativar as notificações diretamente nesse pop-up ou deixar para depois.
- A opção permanece em **Mais → Notificações no celular**.
- O administrador da plataforma pode enviar notificações gerais para todos os aparelhos vinculados.
- O Painel Beta passa a mostrar envios de push dos grupos e do sistema separadamente.

## Ordem de atualização

1. Execute `backend/backend-migration-beta-1.0-build-102.sql` no SQL Editor.
2. Execute `backend/backend-healthcheck-beta-1.0-build-102.sql`.
3. Substitua a Edge Function `publish-announcement` pelo novo `index.ts`, mantenha **Verify JWT desativado** e faça Redeploy.
4. Copie os arquivos do pacote de atualização para a raiz do GitHub, preservando `supabase-config.js`.
5. Aguarde o deploy do Cloudflare e reabra o PWA.

## Notificação do sistema

Acesse **Mais → Painel Beta → Enviar notificação do sistema**. O recurso só aparece para contas cadastradas em `platform_admins`.
