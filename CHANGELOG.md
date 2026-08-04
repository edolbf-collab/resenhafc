# Changelog

## Beta 1.0 Build 135

- registra saúde persistente e tentativas individuais de push;
- adiciona teste de notificação por aparelho;
- exibe falhas, códigos, motivos e assinaturas expiradas no Painel Beta;
- restringe o backup integral do grupo ao administrador da plataforma;
- adiciona cobranças em lote com push individual por destinatário;
- atualiza Frontend e Banco para 135 e Edge Functions para 107.


## Beta 1.0 Build 134

- eventos finalizados deixam de aparecer como escalação ativa na aba Times;
- times históricos ficam acessíveis pelo botão Abrir Times dentro do evento realizado;
- histórico de times passa a ser somente leitura;
- rebalanceamento e desfazimento são bloqueados no frontend e no banco após o evento;
- botões Vou e Não vou recebem realces verde e vermelho, com seleção reforçada.

## Beta 1.0 Build 133

- substitui o botão único de presença por `Vou` e `Não vou` no cartão principal;
- adiciona resposta independente de churrasco com `Vou` e `Não vou`;
- oculta os controles de churrasco quando o evento não possui confraternização configurada;
- mantém as respostas alteráveis e visualmente destacadas;
- não cria a ação `Entrar na espera`;
- adiciona `bbq_responded` e `bbq_responded_at` em `match_attendance`;
- cria as RPCs protegidas `set_my_match_game_response` e `set_my_match_bbq_response`;
- Frontend 133, Banco 133 e Edge Functions 106.

## Beta 1.0 Build 132

- adicionada a opção **Desfazer separação** na aba Times;
- disponível para administrador e organizador quando há times formados;
- remove somente `team_assignments`, preservando presenças, sorteio da espera e `team_count`;
- nova RPC protegida `clear_match_team_assignments`;
- novo log operacional `match_teams_cleared`;
- Frontend 132, Banco 132 e Edge Functions 106.

## Beta 1.0 Build 131

- adiciona exclusão do sorteio da espera por administrador e organizador;
- restaura os jogadores da espera para confirmados ao excluir o resultado;
- permite editar máximo de jogadores, jogadores por time e observações de eventos futuros;
- torna jogadores por time um dado opcional;
- adiciona seleção da quantidade de times na aba Times;
- persiste a quantidade escolhida e a utiliza em Separar e Rebalancear;
- mantém a prioridade de goleiros da Build 130;
- banco esperado: Build 131;
- Edge Functions permanecem na Build 106.

## Beta 1.0 Build 130 — 2026-07-29

- Prioridade para goleiros cuja posição principal é Goleiro.
- Cobertura de vagas restantes com jogadores que marcaram “Também posso jogar no gol”.
- Formação dos times continua normalmente quando não há goleiros suficientes.
- Novo campo `team_assignments.assigned_goalkeeper`.
- Luva discreta ao lado da posição em membros, eventos e times.
- Frontend 130, Banco 130 e Edge 106.

# Beta 1.0 Build 129

- reorganiza os balões de presença no detalhe do evento ativo;
- substitui “Talvez” por “Pendente de confirmação”;
- identifica membros sem resposta registrada;
- adiciona lembrete push individual para administrador e organizador;
- atualiza `publish-announcement` para Edge Build 106.

# Beta 1.0 Build 128

- exclusão permanente de membros pelo Painel Beta;
- remoção definitiva do usuário no Supabase Auth por Edge Function;
- transferência automática de grupos ou exclusão de grupos órfãos;
- anonimização de jogadores históricos;
- auditoria da operação sem dados pessoais em texto claro;
- README atualizado.

## Beta 1.0 Build 119

Reconstrução do carregamento do Supabase com base na Build 115, mantendo a instalação Android da Build 116.

## Beta 1.0 Build 116
- Instalação PWA Android restaurada com arquitetura validada do RoutePilot v2.0.34.
- Onboarding de push exibido também no Android em modo navegador.

# Changelog

## Beta 1.0 Build 113

- adiciona o status `partial` às cobranças;
- soma pagamentos vinculados antes de determinar a quitação;
- mostra total pago e saldo restante;
- bloqueia pagamento acima do saldo;
- recalcula a cobrança quando um pagamento é excluído;
- corrige registros antigos marcados como pagos após pagamento insuficiente;
- banco esperado: Build 113;
- Edge Function: Build 102.

## Beta 1.0 Build 106

- Inserido manualmente o beacon oficial do Cloudflare Web Analytics no `index.html`.
- Eliminada a dependência da injeção automática do Pages.
- Ajustada a CSP para instalação manual.
- Banco permanece na Build 104; Edge Function permanece na Build 102.

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

## Beta 1.0 Build 108
- sorteio seletivo e independente do limite, com modos instantâneo e revelação;
- churrasco compacto quando desativado e expandido sob demanda.

## Beta 1.0 Build 112

- Remove a opção “Talvez” da confirmação feita pelo participante.
- Mantém somente “Vou jogar” e “Não vou”.
- Solicita resposta definitiva para registros antigos marcados como “Talvez”.
- Banco esperado: Build 110.
- Edge Function: Build 102.

## Beta 1.0 Build 111

- consolida o status, a contagem, o valor e a lista nominal do churrasco em um único balão expansível;
- omite o valor por pessoa quando não houver cobrança configurada;
- preserva o selo discreto de churrasco nas listas de presença;
- reduz o espaço vertical ocupado pelo bloco do sorteio da espera.

## Beta 1.0 Build 110

- corrigida a constraint que rejeitava `manual_draw` durante o sorteio da espera;
- padronizado o ingresso posterior ao sorteio com `late_confirmation`;
- adicionada normalização segura dos motivos antigos da espera;
- incluído selo discreto de churrasco nos cartões de presença;
- lista nominal do churrasco recolhida por padrão e expansível em `Ver nomes`.
## Beta 1.0 Build 114

- controle fechado do beta por e-mail da conta Google;
- autorização, bloqueio e reativação no Painel Beta;
- bloqueio integrado às políticas RLS e operações sem grupo;
- hook Before User Created preparado para impedir cadastros não autorizados;
- erros agrupados por causa, build, arquivo e linha;
- detalhes completos das ocorrências e metadados JSON;
- auditoria automática de RLS e integridade de acessos.



## Beta 1.0 Build 115

- tela de acesso pendente passa a identificar o e-mail usado no login;
- botão para copiar o e-mail e solicitar autorização;
- verificação de liberação diretamente na tela, sem reinstalar ou refazer o login;
- mensagens distintas para acesso pendente, liberado e indisponibilidade de conexão.
