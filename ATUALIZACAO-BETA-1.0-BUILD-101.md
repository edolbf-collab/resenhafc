# Resenha FC — Beta 1.0 Build 101

## Alteração

Administrador e organizador podem remover integrantes pela aba **Membros**. Toque no cartão de um integrante para abrir o gerenciamento.

A remoção:

- encerra imediatamente o acesso ao grupo;
- interrompe o recebimento de notificações daquele grupo;
- retira o jogador do elenco ativo;
- preserva presenças, avaliações, cobranças, pagamentos e registros históricos.

O administrador único não pode ser removido. Primeiro é necessário transferir a administração. Também não é possível remover a si mesmo por essa opção.

## Instalação

1. Execute `backend/backend-migration-beta-1.0-build-101.sql` em uma nova consulta no Supabase.
2. Execute o healthcheck.
3. Copie os arquivos da atualização para a raiz do repositório.
4. Preserve `supabase-config.js`.
5. Publique no GitHub/Cloudflare.
