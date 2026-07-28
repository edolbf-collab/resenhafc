# Beta 1.0 — Build 116

- Replica a arquitetura PWA Android validada no RoutePilot v2.0.34.
- Usa manifesto canônico `/manifest.json`, com `id`, `start_url` e `scope` em `/`.
- Copia os ícones 192/512 comuns e maskable para a raiz.
- Registra o service worker uma única vez, antecipadamente no `<head>`, com escopo `/` e `updateViaCache: none`.
- Não cancela nem substitui o evento nativo `beforeinstallprompt`; a instalação volta a ser controlada pelo Chrome.
- Simplifica o cache obrigatório dos recursos essenciais.
- Exibe o convite de ativação das notificações também no Android aberto pelo navegador. No iPhone, continua exigindo instalação na Tela de Início.
- Banco esperado: Build 114.
- Edge Function: Build 103.
