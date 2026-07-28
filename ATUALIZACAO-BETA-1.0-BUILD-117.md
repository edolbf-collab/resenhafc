# Beta 1.0 — Build 117

- Corrige falha de carregamento do cliente Supabase no Android instalado.
- Introduz `cloud-client-loader.js` com fallback entre jsDelivr e unpkg.
- Usa versão fixada do Supabase JS para evitar mudanças inesperadas.
- Adiciona tempo limite, repetição e nova tentativa quando a conexão retorna.
- O service worker guarda a biblioteca externa após o primeiro carregamento bem-sucedido.
- Banco: Build 114.
- Edge Function: Build 103.
