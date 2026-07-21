# Atualização Resenha FC v0.3.2.1

## Alterações

- todo o cartão da pelada passou a abrir os detalhes;
- o papel `Proprietário` foi substituído por `Administrador`;
- cada grupo passa a ter somente um administrador;
- o administrador pode transferir a administração a outro membro;
- o administrador anterior passa a membro após a transferência;
- organizador, tesoureiro e membro continuam como funções delegáveis;
- churrasco removido da criação da programação;
- churrasco passa a ser ativado pelo administrador dentro de cada pelada;
- a configuração é independente em cada ocorrência semanal;
- o campo de data e hora foi ajustado para não ultrapassar a largura da tela.

## Ordem de publicação

1. Abra uma nova consulta no SQL Editor do Supabase.
2. Execute integralmente `backend/migration-v0.3.2.1.sql`.
3. Execute `backend/backend-healthcheck.sql` em outra consulta.
4. Copie o pacote de atualização para a raiz do repositório.
5. Preserve o seu arquivo `supabase-config.js`.
6. Faça o push para o GitHub e aguarde o deploy do Cloudflare.

## Migração de funções

A migração transforma o antigo proprietário no único administrador do grupo. Antigos administradores adicionais passam a membros. Para trocar o administrador depois, use **Membros > Gerenciar funções > Transferir administração**.

## Churrasco

Ao criar uma pelada, ela começa sem churrasco. Abra o cartão da pelada e use a seção **Confraternização**. Somente o administrador pode ativar, desativar e definir o valor por pessoa. Se o churrasco for desativado, as confirmações e acompanhantes referentes a ele são zerados naquela pelada.
