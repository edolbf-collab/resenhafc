# Beta 1.0 — Build 114

## Acesso fechado

- Cria a lista `beta_access`, administrada por e-mail.
- Preserva automaticamente os usuários já existentes como ativos.
- O Painel Beta permite autorizar, bloquear e reativar usuários.
- O aplicativo valida o acesso antes de carregar qualquer grupo.
- Usuários não autorizados recebem uma tela específica, sem acesso aos dados.
- O bloqueio passa a integrar os helpers centrais de RLS e interrompe o acesso aos grupos mesmo com sessão antiga.
- Assinaturas de push do usuário são desativadas quando ele é bloqueado.
- Cria a função `hook_beta_access_before_user_created` para impedir novos cadastros fora da lista.

## Painel de erros

- O contador bruto é dividido em causas distintas.
- Agrupa por evento, mensagem, arquivo, linha e build.
- Mostra ocorrências, usuários afetados, primeira e última ocorrência.
- Permite consultar o JSON completo de cada ocorrência.
- Relatos e logs recentes passam a exibir contexto e metadados completos.

## Segurança

- A Edge Function passa a rejeitar usuários sem acesso ativo ao beta.
- Notificações são enviadas somente a destinatários com acesso ativo.

- Reforça políticas próprias de perfil, push, feedback e versões.
- Integra o acesso ao beta aos helpers `has_group_role`, `is_group_member` e `owns_player`.
- Exibe verificações automáticas de RLS e integridade no Painel Beta.
- Inclui SQL separado de auditoria somente leitura.

Frontend: Build 114.  
Banco: Build 114.  
Edge Function: Build 103.
