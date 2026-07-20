# Ativação do backend — Resenha FC v0.2.1

Esta versão usa Supabase para autenticação, PostgreSQL, políticas RLS e sincronização em tempo real. O frontend permanece estático no Cloudflare Pages.

## 1. Criar o projeto

1. Acesse o painel do Supabase e crie um projeto novo.
2. Escolha a região disponível mais próxima dos usuários.
3. Guarde a senha do banco em local seguro. Ela não será colocada no aplicativo.

## 2. Criar banco, funções e segurança

1. Abra **SQL Editor**.
2. Crie uma nova consulta.
3. Copie integralmente `backend/supabase-schema.sql`.
4. Execute o script.
5. Confirme que a execução terminou sem erro.

O script cria as tabelas, índices, triggers, RPCs, políticas RLS e publicação Realtime.

## 3. Conferir o backend

Execute `backend/backend-healthcheck.sql` no SQL Editor. O resultado deve indicar:

- 13 tabelas operacionais;
- RLS habilitado em todas elas;
- tabelas operacionais incluídas em `supabase_realtime`;
- funções RPC disponíveis.

## 4. Configurar autenticação

Em **Authentication → URL Configuration**:

- **Site URL:** URL pública principal do Cloudflare;
- **Redirect URLs:** adicione a URL do Cloudflare com `/**`, eventual domínio próprio com `/**` e `http://localhost:8080/**`.

Exemplo:

```text
Site URL
https://resenha-fc.pages.dev

Redirect URLs
https://resenha-fc.pages.dev/**
http://localhost:8080/**
```

Para o primeiro teste controlado, é possível desabilitar temporariamente **Confirm email**. Antes de liberar o aplicativo ao grupo, reative a confirmação e configure um SMTP próprio.

### Login com Google

O frontend já contém o botão **Continuar com Google**. A ativação exige criar um cliente OAuth do tipo Web no Google Auth Platform, cadastrar a Callback URL do Supabase e habilitar o provedor em **Authentication → Sign In / Providers → Google**. Siga `LOGIN-GOOGLE.md`.

## 5. Obter as credenciais públicas

Em **Settings → API Keys** ou no diálogo **Connect**, copie:

- Project URL;
- Publishable key, iniciada normalmente por `sb_publishable_`.

Não use Secret key, `service_role` ou qualquer chave administrativa no frontend.

## 6. Configurar o aplicativo

Edite `supabase-config.js`:

```javascript
window.RESENHA_CONFIG = {
  supabaseUrl: "https://SEU-PROJETO.supabase.co",
  supabasePublishableKey: "sb_publishable_SUA_CHAVE",
  authRedirectUrl: window.location.origin,
  appName: "Resenha FC"
};
```

Salve, envie ao GitHub e aguarde o novo deploy do Cloudflare Pages.

## 7. Primeiro teste integrado

### Celular 1 — proprietário

1. Abra a URL do Cloudflare.
2. Crie a primeira conta.
3. Crie um grupo.
4. Anote o código de convite.
5. Crie um jogo.

### Celular 2 — membro

1. Abra a mesma URL em outro navegador ou aparelho.
2. Crie uma segunda conta.
3. Entre com o código de convite.
4. Confirme presença e churrasco.

### Validação

No primeiro aparelho, a confirmação deve aparecer sem recarregar a página. Depois teste:

- alteração da confirmação;
- lista de espera quando as vagas forem preenchidas;
- sorteio de times;
- criação de cobrança;
- registro de pagamento;
- avaliação de jogador;
- saída e novo login.

## 8. Estado atual das permissões

- **owner/admin:** administração geral;
- **organizer:** jogos, jogadores, escalações, eventos e avisos;
- **treasurer:** cobranças, pagamentos e despesas;
- **member:** leitura do grupo, própria presença e próprias avaliações.

As políticas RLS são a proteção efetiva. Mesmo que alguém altere o JavaScript no navegador, o banco rejeita operações não autorizadas.

## 9. Próximas etapas após o teste

1. criar tela administrativa de funções dos membros;
2. implementar recuperação de senha;
3. configurar SMTP e personalizar e-mails;
4. adicionar notificações push;
5. criar fechamento oficial da partida e estatísticas;
6. implementar ajuste manual dos times;
7. preparar política de privacidade e termos de uso;
8. gerar aplicativos nativos ou empacotar a PWA para lojas, quando a versão web estiver estável.
