# Edge Function — Build 103

Função afetada: `publish-announcement`.

## Alterações

- valida o status do usuário na tabela `beta_access` antes de processar qualquer ação;
- rejeita sessões de usuários bloqueados ou não autorizados;
- filtra os destinatários dos avisos e envia push somente para usuários com acesso ativo;
- mantém as validações de grupo, função e administração da plataforma da Build 102.

## Arquivos

```text
supabase/functions/publish-announcement/index.ts
supabase/functions/publish-announcement/deno.json
```

## Publicação pelo Supabase CLI

Na raiz do projeto vinculado ao Supabase:

```bash
supabase functions deploy publish-announcement
```

As variáveis já existentes devem ser preservadas:

- `SUPABASE_URL`;
- chave pública/anon;
- chave secreta/service role;
- `VAPID_PUBLIC_KEY`;
- `VAPID_PRIVATE_KEY`;
- `VAPID_SUBJECT`;
- `APP_BASE_URL`.

Não coloque a chave secreta ou a chave VAPID privada no frontend ou no `supabase-config.js`.
