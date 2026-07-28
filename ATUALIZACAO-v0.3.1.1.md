# Resenha FC v0.3.1.1 — revisão corretiva

Esta revisão corrige o acabamento visual e elimina a dependência de carregamento externo dos 20 escudos de grupo.

## Alterações

- logotipo de login reprocessado por recorte de fundo conectado, com canal alfa real;
- marca compacta reprocessada com canal alfa real;
- botão Google com apresentação visual transparente e integração ao tema;
- autenticação continua sendo acionada pelo componente oficial Google Identity Services;
- 20 escudos incorporados em `group-avatars-data.js` como imagens SVG autocontidas;
- fallback automático para o primeiro escudo;
- service worker tolerante a falha isolada de cache;
- cache alterado para `resenha-fc-v0.3.1.1`.

## Atualização

Copie todos os arquivos do pacote de atualização para a raiz do repositório. Preserve o seu `supabase-config.js`.

Não há alteração no banco de dados e nenhum SQL deve ser executado.

Após o deploy, feche completamente a PWA. No iPhone, remova e reinstale pela opção Adicionar à Tela de Início caso a versão antiga continue em cache.
