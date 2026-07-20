# Changelog

## v0.2.4 — login Google no iPhone e marca da tela de acesso

- Logotipo de login otimizado, versionado e incluído na raiz e na pasta de marca.
- Fallback automático para o Apple Touch Icon quando a imagem da tela de acesso falhar.
- Google Identity Services adicionado como fluxo principal.
- Sessão Google criada pelo `signInWithIdToken` do Supabase, com nonce criptográfico.
- OAuth tradicional mantido como fallback e executado com redirecionamento controlado.
- Política CSP ampliada somente para endpoints necessários do Google.
- Fotos de perfil `googleusercontent.com` liberadas na CSP.
- Cache da PWA atualizado para v0.2.4.

## v0.2.3 — correção do ícone no iPhone e iPad

- Ícones Apple Touch movidos também para a raiz do site, onde o Safari procura os arquivos convencionais.
- Referências `apple-touch-icon` passaram a usar nomes versionados para evitar o reaproveitamento do ícone antigo.
- Incluídos tamanhos 120, 152, 167 e 180 px para iPhone e iPad.
- Ícones do manifesto também foram versionados.
- Cache da PWA atualizado e metadados de ícone/manifesto configurados para revalidação.
- Mantidas as alterações da v0.2.2: logout e remoção do modo demonstração.

## v0.2.2

- modo demonstração e repositório local removidos;
- dados de exemplo eliminados;
- backend Supabase passa a ser obrigatório;
- logout disponível no perfil e na tela Mais;
- logout encerra Realtime e limpa a sessão local;
- tela específica para backend não configurado;
- falha de conexão não oferece mais fallback local;
- limpeza automática de dados legados da demonstração;
- cache PWA atualizado.

## v0.2.1

- login com conta Google por Supabase OAuth;
- botão Google com identidade visual própria na tela de acesso;
- retorno automático para Cloudflare ou ambiente local;
- exibição de erros OAuth na tela de autenticação;
- leitura correta de `full_name`, `given_name`, `family_name` e foto do perfil Google;
- trigger de perfil atualizado para novos usuários sociais;
- guia completo `LOGIN-GOOGLE.md`;
- cache PWA atualizado.

## v0.2.0 — backend pronto para ativação

- esquema Supabase revisto e idempotente para projeto novo;
- permissões separadas para proprietário, administrador, organizador, tesoureiro e membro;
- `group_id` nas tabelas filhas para sincronização Realtime filtrada por grupo;
- sorteio de times salvo por RPC transacional;
- pagamento e baixa de cobrança realizados na mesma transação;
- atualização de perfil sincronizada com os jogadores vinculados;
- correção de avaliações repetidas;
- notas recebidas passam a participar do balanceamento dos times;
- Realtime com recarga agrupada e sem reinscrição a cada evento;
- falha de backend não é mais mascarada como modo local;
- arquivo de conferência pós-instalação incluído.

## v0.1.1

- identidade visual oficial;
- ícones e recursos PWA para Android e iOS.

## v0.1.0

- primeira versão funcional local e estrutura inicial Supabase.
