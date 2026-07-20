# Validação — Resenha FC v0.2.4

## Código

- `node --check app.js`: aprovado;
- arquivo de logotipo 512 × 512 presente na raiz;
- fallback de imagem presente;
- cache v0.2.4 contém o novo logotipo;
- CSP permite Supabase, Google Identity Services e fotos Google;
- modo demonstração permanece removido;
- logout permanece ativo.

## Login Google

- caminho principal: Google Identity Services → ID token → Supabase `signInWithIdToken`;
- nonce aleatório e SHA-256 implementados;
- caminho alternativo: Supabase `signInWithOAuth` com URL validada;
- ausência de `googleClientId` é indicada na própria tela;
- nenhuma chave secreta é exigida no frontend.

## Validação pendente em ambiente real

- popup e seleção de conta em iPhone/iPad;
- retorno com sessão real do Supabase;
- teste com duas contas Google;
- cache após deploy do Cloudflare.
