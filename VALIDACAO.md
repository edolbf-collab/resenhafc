# Validação da versão 0.3.0

## Verificações locais realizadas

- sintaxe JavaScript de `app.js` validada com `node --check`;
- sintaxe JavaScript de `service-worker.js` validada com `node --check`;
- 20 escudos SVG gerados e renderizados em PNG para conferência visual;
- referências de arquivos do manifesto, HTML e service worker verificadas;
- pacote de atualização gerado sem `supabase-config.js` para preservar as credenciais públicas já configuradas.

## Testes obrigatórios após a migração

1. login Google em Android, Safari e PWA do iPhone;
2. criação de grupo com cada família de escudo;
3. ingresso por código e por link de convite;
4. alteração de posição pelo próprio membro;
5. atribuição de funções por proprietário e administrador;
6. transferência de propriedade;
7. avaliação por membro e visualização privada pela administração;
8. separação de times por um organizador sem exibição das notas;
9. tentativa de lançamento financeiro por membro comum;
10. exclusão de jogo futuro e bloqueio de exclusão após o horário.

O SQL foi preparado para execução incremental sobre a v0.2.x, mas o teste final depende do projeto Supabase real do usuário.
