# Resenha FC v0.2.3

Aplicativo PWA para organizar peladas entre amigos, com autenticação, banco e sincronização em nuvem pelo Supabase.

## Alterações desta versão

- modo demonstração removido integralmente;
- nenhum dado de exemplo é criado;
- o aplicativo exige backend Supabase configurado;
- login por Google ou e-mail;
- opção **Sair da conta** disponível em **Minha conta** e em **Mais**;
- logout encerra a sessão local, remove a assinatura Realtime e retorna à tela de login;
- dados antigos da demonstração são apagados do armazenamento local;
- novos usuários começam sem grupo, jogos, jogadores ou lançamentos e inserem tudo do zero.

## Uso

Preencha `supabase-config.js` com a Project URL e a Publishable key. Depois publique no Cloudflare Pages ou execute localmente por HTTP:

```bash
python -m http.server 8080
```

Abra `http://localhost:8080`. Sem configuração válida do Supabase, o aplicativo mostra uma tela de configuração necessária e não inicia um modo local alternativo.

## Primeiro acesso

1. Entre com Google ou crie uma conta por e-mail.
2. Crie um grupo ou entre usando um código de convite.
3. Cadastre jogadores, jogos e demais dados.
4. Para trocar de conta, toque no avatar no canto superior direito e selecione **Sair da conta**.

## Publicação

O projeto é estático e não possui etapa de build:

- Build command: vazio;
- Build output directory: raiz do projeto;
- branch de produção: `main`.

O backend existente da v0.2.1 continua compatível. Não é necessário executar nova migração SQL para esta atualização.


## Instalação no iPhone e iPad

O projeto fornece ícones Apple Touch em 120, 152, 167 e 180 px, com arquivos versionados e cópias convencionais na raiz. Após atualizar o site, remova qualquer atalho antigo e instale novamente pelo Safari.
