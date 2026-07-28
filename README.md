# Resenha FC — Beta 1.0 Build 127

Build 127 preparada para publicação no GitHub, baseada na **Build 126 corrigida**.

## Destaque desta build

A Build 127 substitui integralmente os 20 escudos de grupo por uma nova coleção recriada **individualmente**, com acabamento mais profissional, melhor nitidez e **área de segurança transparente** para evitar os recortes feios observados no app durante a renderização.

## O que foi atualizado na Build 127

- recriação individual dos **20 ícones de grupo**;
- novos arquivos PNG com transparência e folga visual para uso seguro no app;
- nova pasta de assets: `assets/group-avatars-build-127`;
- atualização de `group-avatars-data.js` mantendo as mesmas chaves `badge-01` a `badge-20`;
- atualização de `service-worker.js` com novo cache e pré-cache dos novos avatares;
- atualização de `app.js`, `index.html` e `version.json` para **Build 127**;
- inclusão do documento `ATUALIZACAO-BETA-1.0-BUILD-127.md`;
- atualização deste `README.md`, que estava desatualizado no repositório.

## Resumo das builds mais recentes

### Build 124
- aplicação dos 20 ícones de grupos aprovados;
- inclusão, no Painel Beta, do cartão **Notificações** com a lista de usuários que ainda não ativaram push (admin do sistema).

### Build 125
- recriação integral dos 20 ícones de grupos em arte própria, com exportação em PNG transparente e preservação das chaves `badge-01` a `badge-20`.

### Build 126 corrigida
- correção da identidade interna da versão para Build 126;
- renovação de cache;
- alinhamento de arquivos essenciais de publicação.

### Build 127
- nova recriação profissional dos 20 ícones, agora com composição individual e margem de segurança para evitar clipping visual no app.

## Publicação desta build

Publique estes arquivos atualizados:

- `app.js`
- `index.html`
- `group-avatars-data.js`
- `service-worker.js`
- `version.json`
- pasta `assets/group-avatars-build-127/`
- `README.md`
- `ATUALIZACAO-BETA-1.0-BUILD-127.md`

## Banco e Edge Functions

- **Banco esperado:** Build 124
- **Edge Function esperada:** Build 104
- **Migrações SQL:** nenhuma alteração nesta build

## Observação

As chaves dos escudos foram mantidas. Portanto, grupos já vinculados a `badge-01` até `badge-20` continuam funcionando sem necessidade de ajuste no banco.
