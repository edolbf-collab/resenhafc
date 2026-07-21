# Resenha FC — Beta 1.0 Build 100

Primeira versão preparada para teste real com um grupo.

## O que foi incluído

- canal interno **Reportar problema**;
- diagnóstico de internet, sessão, push, instalação e sincronização;
- registro técnico de abertura, ações relevantes e erros do frontend;
- painel operacional exclusivo do administrador da plataforma;
- indicadores de usuários, grupos, partidas, confirmações, push e erros;
- visualização dos relatos e logs recentes;
- snapshot operacional em JSON;
- arquivo `version.json` e verificação de atualização;
- aviso de nova versão com atualização em um toque;
- nomenclatura **Beta 1.0 — Build 100**.

## Ordem de instalação

1. Execute `backend-migration-beta-1.0-build-100.sql` em uma nova consulta do SQL Editor.
2. Execute `configurar-administrador-plataforma.sql` depois de substituir o e-mail indicado.
3. Execute `backend-healthcheck-beta-1.0-build-100.sql`.
4. Copie os arquivos do pacote de atualização para a raiz do GitHub.
5. Preserve o `supabase-config.js` já configurado.
6. Envie ao GitHub e aguarde o deploy do Cloudflare.
7. Feche e abra novamente o PWA.

## Painel Beta

A opção aparece em **Mais → Painel Beta** somente para o e-mail cadastrado em `platform_admins`.

## Backup

O aplicativo mantém:

- exportação dos dados do grupo em JSON;
- exportação de snapshot operacional pelo Painel Beta.

Esses arquivos são backups auxiliares. O backup integral e a restauração do PostgreSQL devem continuar sendo administrados no Supabase.
