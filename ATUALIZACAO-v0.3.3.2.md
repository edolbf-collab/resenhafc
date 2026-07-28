# Resenha FC v0.3.3.2 — correção da Edge Function de avisos

Esta revisão corrige o retorno genérico `Edge Function returned a non-2xx status code` ao publicar avisos.

## Causa

O frontend do projeto usa uma Publishable key no formato `sb_publishable_...`. A verificação JWT legada do gateway das Edge Functions não é compatível com esse tipo de chave. Por isso, a requisição pode ser rejeitada antes de o código da função executar.

A função continua protegida: ela recebe o token do usuário e valida a sessão com `auth.getUser()` antes de consultar permissões ou gravar qualquer aviso.

## Alterações

- `verify_jwt = false` para `publish-announcement`;
- autenticação manual obrigatória pelo token do usuário;
- suporte às variáveis atuais `SUPABASE_PUBLISHABLE_KEYS` e `SUPABASE_SECRET_KEYS`, com fallback para as chaves legadas;
- validação explícita das três variáveis VAPID;
- indicação da etapa em que a função falhou;
- leitura do corpo de erro no frontend, em vez de mostrar apenas `non-2xx status code`;
- publicação do aviso funciona mesmo quando ainda não existem aparelhos inscritos;
- cache atualizado para `resenha-fc-v0.3.3.2`.

## Atualização da Edge Function

1. No Supabase, abra **Edge Functions > publish-announcement**.
2. Substitua o código pelo arquivo:
   `supabase/functions/publish-announcement/index.ts`.
3. Desative **Verify JWT / Enforce JWT verification** para esta função.
4. Salve e faça o deploy/redeploy.

Os Secrets devem continuar cadastrados:

- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`, começando por `mailto:` ou `https://`

## Atualização do frontend

Substitua:

- `app.js`
- `service-worker.js`

Não substitua o seu `supabase-config.js`.

## Banco de dados

Nenhum SQL precisa ser executado novamente.
