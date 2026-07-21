# Validação técnica — v0.3.3

- JavaScript principal validado com `node --check`.
- Service worker validado com `node --check`.
- Manifesto validado como JSON.
- Migração escrita de forma idempotente para execução após v0.3.2.1.
- Assinaturas push protegidas por RLS e RPC autenticada.
- Chave VAPID privada ausente do frontend e dos pacotes públicos.
- Edge Function exige sessão autenticada e função de administrador ou organizador.
- Assinaturas com resposta 404/410 são removidas automaticamente.
- iOS sem instalação na Tela de Início recebe orientação, sem solicitar permissão inutilmente.
- Logout tenta desvincular a assinatura do aparelho antes de encerrar a sessão.

O envio real depende da implantação da Edge Function e das chaves VAPID no projeto Supabase.
