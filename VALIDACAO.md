# Validação da versão 0.1.1

## Verificações executadas nesta atualização

- sintaxe JavaScript válida em `app.js`;
- leitura válida de `manifest.webmanifest`;
- leitura válida de `native-assets/ios/AppIcon.appiconset/Contents.json`;
- carregamento local do `index.html` por servidor HTTP;
- existência dos arquivos referenciados pelo manifesto e pelo service worker;
- dimensões dos ícones PWA de 192 px e 512 px;
- ícones Android `maskable` com margem segura;
- `apple-touch-icon` de 180 px;
- catálogo iOS com tamanhos para iPhone, iPad e App Store;
- atualização do cache do service worker para `resenha-fc-v0.1.1`;
- atualização da marca no cabeçalho, autenticação e tela offline.

## Validações preservadas da versão anterior

Os fluxos funcionais de navegação, confirmação de presença, churrasco, sorteio de times, caixa, mensalidade, avaliações, lista de espera e estado sem grupo já haviam sido validados na versão 0.1.0.

## Limite desta execução

O ambiente de empacotamento não concluiu uma captura automatizada pelo Chromium headless. Por isso, a atualização visual foi validada por inspeção dos arquivos, dimensões, sintaxe, referências e carregamento HTTP, mas ainda deve ser conferida em aparelhos reais após a publicação HTTPS. O backend Supabase também permanece dependente de um projeto real do usuário.
