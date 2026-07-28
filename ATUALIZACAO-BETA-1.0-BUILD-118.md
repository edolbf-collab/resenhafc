# Beta 1.0 — Build 118

- Corrige o carregamento do cliente Supabase no Android instalado.
- Substitui os caminhos inexistentes `/dist/umd/supabase.js` pelos endereços CDN oficiais `@supabase/supabase-js@2`.
- Remove `crossOrigin`, desnecessário para scripts clássicos carregados por CDN.
- Mantém fallback entre jsDelivr e unpkg, tempo limite, nova tentativa online e cache dinâmico.
- Banco: Build 114.
- Edge Function: Build 103.
