# Edge Functions — Build 105

## Nova função

`delete-beta-user`

## Finalidade

Excluir permanentemente usuários do beta fechado sem expor a chave `service_role` no navegador.

## Publicação

Pelo Supabase CLI:

```bash
supabase functions deploy delete-beta-user --no-verify-jwt
```

A função também foi adicionada ao arquivo `supabase/config.toml` com `verify_jwt = false`, pois a validação do token e da autorização administrativa é executada dentro da própria função.

## Credenciais esperadas

A função utiliza as mesmas variáveis internas do projeto:

- `SUPABASE_URL`;
- `SUPABASE_ANON_KEY` ou `SUPABASE_PUBLISHABLE_KEYS`;
- `SUPABASE_SERVICE_ROLE_KEY` ou `SUPABASE_SECRET_KEYS`.

Nenhuma chave de serviço deve ser inserida em `supabase-config.js` ou no frontend.
