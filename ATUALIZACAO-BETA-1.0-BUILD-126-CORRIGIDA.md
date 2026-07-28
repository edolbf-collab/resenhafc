# Resenha FC — Beta 1.0 Build 126 corrigida

## Correção crítica

A primeira geração da Build 126 publicou `version.json` como Build 126, mas o `APP_RELEASE` interno de `app.js` permaneceu como Build 125. Isso fazia o próprio aplicativo detectar permanentemente uma versão mais nova e manter o aviso de atualização.

## Ajustes

- `APP_RELEASE.build` corrigido de 125 para 126;
- tokens de arquivos renovados para `beta126r1`;
- cache do service worker renovado para `resenha-fc-beta-1.0-build-126-r1`;
- `app.js` e `version.json` configurados para não permanecerem em cache;
- banco esperado permanece Build 124;
- Edge Function permanece Build 104.
