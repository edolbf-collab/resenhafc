# Resenha FC v0.1.1

Aplicativo PWA para organizar peladas entre amigos, inspirado no problema resolvido pelo antigo Peladeiro.com.br, mas com código, identidade visual e arquitetura originais.

## O que já funciona

- interface responsiva para iPhone, Android, tablet e computador;
- instalação como PWA;
- modo demonstração local, utilizável imediatamente;
- cadastro de grupo e jogadores;
- agenda de jogos;
- confirmação: vou, talvez, não vou ou lista de espera;
- confirmação separada para churrasco, acompanhantes e item levado;
- sorteio de times por nota, posição e presença de goleiros;
- mensalidades, cobranças, pagamentos, despesas e saldo;
- avaliações técnicas, fair play e condicionamento;
- ranking, gols, assistências e histórico básico;
- avisos do grupo;
- backup dos dados em JSON;
- autenticação, banco PostgreSQL, RLS e Realtime via Supabase.

## Teste imediato

Sirva a pasta por HTTP/HTTPS. Exemplos:

```bash
python -m http.server 8080
```

Depois abra `http://localhost:8080`.

Sem preencher `supabase-config.js`, o aplicativo inicia no modo demonstração e salva no navegador.

## Ativar uso integrado em vários celulares

Consulte `backend/README.md`. O processo consiste em criar o projeto Supabase, executar `backend/supabase-schema.sql`, preencher `supabase-config.js` e publicar a pasta em HTTPS.

## Publicar no Cloudflare Pages

Esta pasta é um site estático sem etapa de compilação:

- **Build command:** deixe vazio;
- **Build output directory:** `/` se enviar esta pasta diretamente, ou informe o nome da pasta conforme a estrutura do repositório;
- também é possível usar **Direct Upload** e enviar o ZIP descompactado.

O arquivo `_headers` inclui políticas básicas de segurança e liberação das conexões com Supabase.

## Documentação incluída

- `PESQUISA-PELADEIRO.md`: reconstrução histórica das funções do serviço antigo;
- `DEPLOY-CLOUDFLARE.md`: publicação do frontend;
- `backend/README.md`: ativação do banco e autenticação;
- `ROADMAP.md`: módulos previstos para as próximas versões;
- `VALIDACAO.md`: testes executados e limites da validação;
- `IDENTIDADE-VISUAL.md`: marca, paleta e regras de uso;
- `native-assets/`: ícones preparados para projetos Android e iOS nativos.



## Identidade visual para Android e iOS

A versão 0.1.1 incorpora o emblema oficial do Resenha FC na interface, tela de autenticação, tela offline, favicon e instalação PWA.

Para Android, o manifesto contém ícones comuns e `maskable`, com margem segura para os formatos circular, quadrado e arredondado usados pelos fabricantes. Também há um pacote de recursos nativos em `native-assets/android/`.

Para iPhone e iPad, foram incluídos `apple-touch-icon`, telas de abertura para os tamanhos mais comuns e o catálogo `native-assets/ios/AppIcon.appiconset/`, compatível com o Xcode.

A aplicação continua sendo uma PWA. Os pacotes nativos de ícones deixam a identidade pronta para uma futura conversão por Capacitor, Android Studio ou Xcode, mas esta pasta não contém APK ou IPA.

## Limites desta primeira versão

- notificações push, cobrança Pix automática e upload de fotos ainda não foram ativados;
- ajuste manual por arrastar jogadores entre times será implementado depois do sorteio automático;
- o módulo “ao vivo” já tem estrutura de banco para gols, assistências, cartões e substituições, mas ainda não possui tela operacional completa;
- em modo local, os dados não sincronizam com outros aparelhos; a sincronização exige configurar o backend.
