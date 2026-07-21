# Validação da versão 0.3.1

## Verificações realizadas

- sintaxe de `app.js` validada com `node --check`;
- sintaxe de `service-worker.js` validada com `node --check`;
- `manifest.webmanifest` validado como JSON;
- logotipo transparente verificado em RGBA;
- 20 avatares PNG conferidos e incluídos no cache;
- fluxo visual de **Meus grupos** e **Criar grupo** renderizado em viewport de 390 × 844 px;
- home validada com altura igual à viewport e sem rolagem;
- pacote de atualização gerado sem `supabase-config.js`.

## Testes após publicar

1. login Google no Safari e no Android;
2. abertura de **Meus grupos** e carregamento dos escudos;
3. criação de grupo pelo botão compacto;
4. personalização pelo escudo do cabeçalho e por **Mais > Personalizar grupo**;
5. home sem bloco do caixa e sem rolagem;
6. atualização do service worker e do cache após fechar e reabrir a PWA.

Esta versão não exige migração do banco.
