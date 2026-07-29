# Resenha FC — Beta 1.0 Build 129

Build 129 baseada na Build 128.

## Novidades

- nova ordem dos grupos no detalhe dos eventos ativos: **Começam jogando**, **Não vão**, **Espera inicial** e **Pendente de confirmação**;
- substituição visual do antigo grupo **Talvez**;
- identificação dos membros ativos que ainda não responderam;
- botão de lembrete push individual para administrador e organizador;
- validação no servidor para impedir lembrete a quem já respondeu;
- atualização da Edge Function `publish-announcement` para Build 106.

## Versões

- Frontend: Build 129
- Banco: Build 128
- Edge Functions: Build 106

## Publicação

Use preferencialmente o pacote incremental. Preserve o arquivo `supabase-config.js` publicado e mantenha a Edge Function `delete-beta-user` separada. A função `publish-announcement` deve ser republicada com o código da Build 106.

---

# Resenha FC — Beta 1.0 Build 128

Build 128 preparada para publicação no GitHub, baseada na **Build 127**.

## Destaque desta build

A administração da plataforma passa a contar com dois mecanismos distintos no **Painel Beta**:

- **Bloquear/Reativar:** mantém a conta cadastrada, mas controla imediatamente o acesso ao beta;
- **Excluir permanentemente:** remove a autorização do beta e, quando a conta já existe, apaga o usuário do Supabase Auth.

## Exclusão permanente

A exclusão permanente fica disponível exclusivamente para o administrador da plataforma na seção **Acessos do beta**.

O fluxo possui proteção reforçada:

1. o administrador seleciona **Excluir permanentemente**;
2. o sistema apresenta as consequências da operação;
3. é obrigatório digitar o e-mail completo do usuário;
4. a Edge Function confirma novamente se o solicitante é administrador da plataforma;
5. a conta é bloqueada antes do processo destrutivo;
6. o histórico que precisa permanecer é anonimizado;
7. a conta é removida do Supabase Auth;
8. a autorização é removida da tabela `beta_access`.

### Tratamento dos grupos

- quando há outro integrante, a administração é transferida automaticamente;
- a preferência de transferência é: organizador, tesoureiro e membro mais antigo;
- grupos em que o usuário excluído é o único integrante são removidos;
- registros históricos preservados passam a identificar o jogador como **Usuário excluído**.

### Dados removidos ou anonimizados

- conta do Supabase Auth;
- acesso ao beta;
- vínculos ativos com grupos;
- assinaturas push;
- foto, apelido e identificação pessoal nos jogadores históricos;
- avaliações feitas pelo usuário;
- feedbacks e logs operacionais associados ao usuário.

A auditoria da exclusão armazena somente hashes do e-mail e do identificador do usuário, sem manter esses dados em texto claro.

## Arquivos e componentes da Build 128

- `app.js` — interface, confirmação e chamada da exclusão permanente;
- `styles.css` — ações separadas de bloquear e excluir;
- `service-worker.js` — cache da Build 128;
- `version.json` — identificação da Build 128;
- `backend/backend-migration-beta-1.0-build-128.sql`;
- `backend/backend-healthcheck-beta-1.0-build-128.sql`;
- `supabase/functions/delete-beta-user/index.ts`;
- `supabase/config.toml` — configuração da nova Edge Function;
- `ATUALIZACAO-BETA-1.0-BUILD-128.md`;
- `ATUALIZACAO-EDGE-FUNCTION-BUILD-105.md`.

## Resumo das builds recentes

### Build 124
- painel de usuários com e sem notificações push;
- banco atualizado para Build 124.

### Build 125
- recriação dos ícones de grupos em PNG transparente.

### Build 126 corrigida
- correção da identidade interna da versão e renovação do cache.

### Build 127
- vinte escudos recriados individualmente, com margem transparente de segurança;
- atualização do README.

### Build 128
- exclusão permanente de membros do beta;
- anonimização de histórico;
- transferência automática da administração dos grupos;
- nova Edge Function protegida por autenticação e autorização administrativa.

## Ordem de implantação

1. Execute `backend/backend-migration-beta-1.0-build-128.sql`.
2. Execute `backend/backend-healthcheck-beta-1.0-build-128.sql`.
3. Publique a Edge Function `delete-beta-user`.
4. Envie os arquivos do pacote incremental para a raiz do GitHub.
5. Preserve o `supabase-config.js` atualmente publicado.

## Versões esperadas

- **Frontend:** Build 128
- **Banco:** Build 128
- **Edge Functions:** Build 105
