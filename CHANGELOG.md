# Changelog

## Beta 1.0 Build 105

- Corrigida a CSP para liberar `static.cloudflareinsights.com` e `cloudflareinsights.com`.
- Mantida a instalação automática do Cloudflare Web Analytics, sem snippet manual no `index.html`.
- Banco mantido na Build 104 e Edge Function mantida na Build 102.


## v0.3.2

- exclusão permanente de grupo restrita ao proprietário;
- confirmação obrigatória digitando `EXCLUIR`;
- exclusão em cascata de jogos, histórico, caixa, membros, avaliações e avisos;
- opção de repetir a mesma pelada semanalmente;
- criação transacional de 2 a 52 ocorrências;
- identificação visual das peladas recorrentes;
- exclusão de uma ocorrência isolada;
- exclusão da ocorrência selecionada e de todas as próximas da série;
- proteção no servidor para impedir exclusão de jogos já iniciados;
- cache da PWA atualizado para `resenha-fc-v0.3.2`.

## v0.3.1

- revisão do visual, login Google, transparência dos logotipos e carregamento dos escudos;
- criação de grupo em modal dedicado;
- botão compacto para criar grupo;
- home otimizada e caixa removido da tela inicial.

## v0.3.0

- autenticação exclusivamente por conta Google;
- gestão de proprietário e funções;
- aba Membros e avaliações confidenciais;
- convite por WhatsApp;
- perfil esportivo e posições;
- exclusão de partidas somente antes do horário.

## v0.3.2.1

- cartão completo da pelada clicável;
- administrador único por grupo;
- migração do antigo proprietário para administrador;
- transferência formal da administração;
- churrasco configurado separadamente em cada pelada;
- correção de largura do campo de data e hora em telas móveis.

## v0.3.4

- Avisos podem ser reenviados ou excluídos por administrador e organizador.
- Push automático para nova pelada e nova confirmação de presença.
- Exclusão de pagamentos, despesas e cobranças no Caixa.
- Aba Membros simplificada e compactada.

## Beta 1.0 Build 104

- administrador e organizador podem gerenciar a presença de membros em peladas futuras;
- respostas em lote são gravadas de forma transacional;
- confirmados excedentes podem ser sorteados para a espera inicial;
- ordem da espera é persistente e novas confirmações entram no final após o sorteio;
- primeira pessoa da espera é promovida automaticamente quando surge uma vaga;
- separação de times exige que os excedentes tenham sido sorteados.
