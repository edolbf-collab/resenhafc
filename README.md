## Beta 1.0 Build 119

Reconstrução do carregamento do Supabase com base na Build 115, mantendo a instalação Android da Build 116.

# Resenha FC — Beta 1.0 Build 115

A Build 114 prepara o aplicativo para o início do beta fechado com controle de acesso, bloqueio efetivo e diagnóstico operacional mais útil.

## Controle do beta

- autorização prévia pelo e-mail exato da conta Google;
- área **Acessos do beta** no Painel Beta;
- estados Convidado, Ativo e Bloqueado;
- bloqueio imediato das consultas e operações protegidas por RLS;
- novos aparelhos de usuários bloqueados deixam de receber push;
- os usuários já existentes são preservados como ativos durante a migração;
- função pronta para o hook **Before User Created** do Supabase.

## Erros e segurança

- erros das últimas 24 horas agrupados por mensagem, arquivo, linha e build;
- quantidade de ocorrências e usuários afetados;
- primeira e última ocorrência;
- consulta dos metadados completos em JSON;
- verificação automática de RLS, usuários sem acesso e vínculos bloqueados;
- snapshot operacional ampliado.

## Atualização

1. Preserve o seu `supabase-config.js`.
2. Execute `backend/backend-migration-beta-1.0-build-114.sql`.
3. Execute `backend/backend-healthcheck-beta-1.0-build-114.sql`.
4. Publique `app.js`, `styles.css`, `service-worker.js` e `version.json`.
5. Publique a Edge Function `publish-announcement` da Build 103.
6. Ative o hook conforme `ATIVACAO-CONTROLE-BETA-BUILD-114.md`.

Banco esperado: Build 114.  
Edge Function esperada: Build 103.
