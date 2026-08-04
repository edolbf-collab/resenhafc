# Resenha FC — Beta 1.0 Build 136

Linha de base construída sobre a Build 135. Consulte `ATUALIZACAO-BETA-1.0-BUILD-136.md`.

## Versões
- Frontend: 136
- Banco: 136
- Edge Function `publish-announcement`: 108

## Implantação
1. Execute a migração 136.
2. Execute o healthcheck 136.
3. Publique a Edge Function 108.
4. Publique os arquivos incrementais, preservando `supabase-config.js`.

---

# Resenha FC — Beta 1.0 Build 135

## Destaques

### Saúde das notificações push

A Build 135 passa a registrar, por aparelho:

- última tentativa de envio;
- última entrega bem-sucedida;
- última falha;
- código e motivo da falha;
- quantidade de falhas consecutivas;
- invalidação por resposta 404 ou 410;
- horário do último teste realizado.

Cada envio também gera uma linha na tabela `push_delivery_attempts`, sem expor chaves criptográficas ou o conteúdo privado da notificação.

O Painel Beta diferencia:

- saudável;
- sem aparelho;
- não testada;
- falha recente;
- assinatura expirada.

A tela **Mais → Notificações no celular** possui o botão **Enviar notificação de teste**.

### Exportação do grupo

O backup integral em JSON passa a ser exclusivo do administrador da plataforma.

- o botão não aparece para os demais usuários;
- o frontend bloqueia tentativas diretas;
- a RPC `platform_group_export` valida novamente a administração no banco;
- o arquivo inclui os dados do grupo e um resumo da saúde do push, sem endpoints ou chaves privadas.

### Cobranças em lote

Administrador e tesoureiro podem selecionar vários membros e criar cobranças com:

- mesma descrição;
- mesmo valor individual;
- mesmo vencimento.

Cada membro recebe uma cobrança própria. O envio push permanece individual, usando a ação existente `charge-created`, exclusivamente para o usuário vinculado à cobrança.

## Versões esperadas

- Frontend: Build 135
- Banco: Build 135
- Edge Functions: Build 107

A Edge Function `delete-beta-user` permanece sem alterações.

## Implantação

1. Execute `backend/backend-migration-beta-1.0-build-135.sql` no SQL Editor do Supabase.
2. Execute `backend/backend-healthcheck-beta-1.0-build-135.sql`.
3. Substitua o código da Edge Function `publish-announcement` pelo arquivo `backend/publish-announcement-edge-build-107.ts`.
4. Publique novamente apenas a função `publish-announcement`.
5. Não altere a função `delete-beta-user`.
6. Publique os arquivos do pacote incremental no GitHub.
7. Preserve o `supabase-config.js` atualmente publicado.
8. Aguarde o deploy, feche completamente o PWA e abra novamente.

## Arquivos principais alterados

- `app.js`
- `styles.css`
- `index.html`
- `service-worker.js`
- `group-avatars-data.js`
- `version.json`
- `README.md`
- `CHANGELOG.md`
- `docs/PLANEJAMENTO-MESTRE-TAMO-ON.md`
- `backend/backend-migration-beta-1.0-build-135.sql`
- `backend/backend-healthcheck-beta-1.0-build-135.sql`
- `backend/backend-auditoria-push-cobrancas-beta-1.0-build-135.sql`
- `backend/publish-announcement-edge-build-107.ts`
- `supabase/functions/publish-announcement/index.ts`

## Testes recomendados

### Push

1. Abrir **Mais → Notificações no celular**.
2. Vincular novamente a assinatura, quando necessário.
3. Enviar uma notificação de teste.
4. Confirmar que o Painel Beta registra a tentativa.
5. Publicar um aviso para o grupo.
6. Conferir sucessos, falhas, códigos e aparelhos afetados.

### Backup

1. Entrar como administrador da plataforma e confirmar que o botão de exportação aparece.
2. Gerar o JSON e conferir o grupo selecionado.
3. Entrar como usuário comum e confirmar que o botão não aparece.
4. Tentar chamar a RPC com usuário comum e confirmar a negativa do banco.

### Cobranças em lote

1. Abrir **Caixa → Cobrança em lote**.
2. Selecionar diversos membros.
3. Informar descrição, valor e vencimento.
4. Confirmar que uma cobrança foi criada para cada membro.
5. Confirmar que cada push foi enviado somente ao respectivo destinatário.
6. Conferir membros sem aparelho ativo e eventuais falhas no Painel Beta.

## Backup de planejamento

O arquivo `docs/PLANEJAMENTO-MESTRE-TAMO-ON.md` deve acompanhar todas as próximas builds e ser atualizado sempre que uma decisão estrutural for consolidada.
