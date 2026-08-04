# Tâmo On — Beta 1.0 Build 138

## Objetivo

Corrigir a identidade visual da tela de carregamento e eliminar dependência de um arquivo antigo da marca Resenha FC, mantendo o carregamento rápido e progressivo da Build 137.

## Alterações

- a tela de carregamento passa a usar um wordmark textual do Tâmo On, renderizado diretamente pelo HTML e CSS;
- não há mais imagem externa que possa falhar antes da inicialização;
- mensagem principal alterada para **“Ficando ON…”**;
- nomes visíveis do aplicativo atualizados de Resenha FC para Tâmo On;
- título do PWA, manifesto, tela offline, login, convites e mensagens do sistema atualizados;
- nomes internos legados, como `RESENHA_CONFIG`, chaves de armazenamento e alguns nomes de arquivos de ícones, foram preservados para evitar regressões;
- diagnóstico exibe **Banco 136**. A marcação `136-r1` identifica apenas uma revisão corretiva da função de exportação e não constitui uma nova build do banco;
- inicialização progressiva continua aparecendo somente após 240 ms, sem duração mínima artificial.

## Versões

- Frontend: Build 138
- Banco: Build 136
- Edge Functions: Build 108

Não há migração SQL nem republicação de Edge Function.
