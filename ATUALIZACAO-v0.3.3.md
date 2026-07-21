# Resenha FC v0.3.3 — notificações push dos avisos

Esta versão implementa a terceira fase do projeto: avisos do grupo com notificações no celular.

## O que foi incluído

- opção **Notificações no celular** na aba Mais;
- ativação e desativação por aparelho;
- suporte a vários aparelhos por usuário;
- central interna com o histórico dos avisos do grupo;
- publicação de aviso por administrador ou organizador;
- notificação do sistema mesmo com o PWA fechado;
- abertura direta do grupo ao tocar na notificação;
- remoção automática de assinaturas expiradas;
- desvinculação da assinatura ao sair da conta;
- métricas de aparelhos alcançados e falhas de envio.

## Ordem obrigatória

1. Execute `backend/migration-v0.3.3.sql` no SQL Editor.
2. Gere um par de chaves VAPID.
3. Adicione a chave pública ao `supabase-config.js`.
4. Cadastre as chaves nos Secrets das Edge Functions.
5. Crie e publique a função `publish-announcement`.
6. Publique o frontend no GitHub/Cloudflare.
7. Ative as notificações em cada celular.

## Gerar as chaves VAPID

Com Node.js:

```bash
node backend/generate-vapid-keys.mjs
```

Alternativa visual:

```bash
py -m http.server 8080
```

Abra no navegador:

```text
http://localhost:8080/backend/vapid-key-generator.html
```

Nunca coloque `VAPID_PRIVATE_KEY` no GitHub ou no frontend.

## Configuração pública

No `supabase-config.js` já existente, acrescente:

```javascript
vapidPublicKey: "SUA_VAPID_PUBLIC_KEY",
```

## Secrets da Edge Function

Cadastre no Supabase:

```text
VAPID_PUBLIC_KEY = chave pública gerada
VAPID_PRIVATE_KEY = chave privada gerada
VAPID_SUBJECT = mailto:seu-email@dominio.com
```

## Edge Function

Crie uma função com o nome exato:

```text
publish-announcement
```

Use o conteúdo de:

```text
supabase/functions/publish-announcement/index.ts
```

A verificação JWT deve permanecer ativada.

## iPhone e iPad

No iOS/iPadOS, o usuário deve adicionar o Resenha FC à Tela de Início e abrir o aplicativo pelo ícone antes de ativar as notificações.

Depois acesse:

```text
Mais → Notificações no celular → Ativar notificações
```

## Teste

1. Ative notificações em pelo menos um celular.
2. Entre como administrador ou organizador.
3. Abra `Mais → Publicar aviso`.
4. Publique um título e uma mensagem.
5. Confira a notificação fora do aplicativo.
6. Toque nela e confirme a abertura da Central de avisos.
