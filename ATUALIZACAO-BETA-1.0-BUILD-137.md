# Resenha FC — Beta 1.0 Build 137

## Objetivo

Reduzir falhas isoladas de inicialização, especialmente durante abertura por notificações, atualização do PWA ou carregamento lento da sessão, sem impor uma tela de espera perceptível nos acessos normais.

## Alterações

- estado inicial seguro: o frontend deixa de iniciar com `state = null`;
- coleções essenciais começam como listas vazias, evitando leitura prematura de `groups`, `members`, `matches` e demais dados;
- carregamento progressivo: a tela só aparece quando a inicialização ultrapassa 240 ms;
- encerramento imediato da tela assim que os dados essenciais ficam disponíveis, sem tempo mínimo artificial;
- mensagem diferenciada apenas quando a sincronização ultrapassa 4,5 segundos;
- bloqueio temporário dos controles enquanto sessão, perfil e grupos ainda não foram carregados;
- rotas abertas por push são processadas somente depois da inicialização concluída;
- detecção de divergência entre a build declarada no HTML e a build real do JavaScript;
- identificação da build do service worker por mensagem interna;
- diagnóstico ampliado nos registros de erro: HTML, JavaScript, service worker, rota, estado e quantidade de grupos;
- tela “Sobre e diagnóstico” passa a mostrar as builds do aplicativo, HTML e service worker.

## Experiência de uso

Em conexões rápidas, nenhuma tela adicional deverá ser percebida. O carregamento visual aparece somente após 240 ms e desaparece assim que a tela principal está pronta. Não há atraso mínimo para fins estéticos.

## Versões

- Frontend: Build 137
- Banco: Build 136 r1
- Edge Functions: Build 108

Não há migração de banco nem republicação de Edge Function nesta build.

## Implantação

1. Publique os arquivos do pacote incremental no repositório.
2. Preserve `supabase-config.js`.
3. Aguarde o deploy do Cloudflare Pages.
4. Feche completamente o PWA e abra novamente.
5. Em **Mais → Sobre e diagnóstico**, confirme:
   - Build do aplicativo: 137;
   - Build do HTML: 137;
   - service worker: 137.

## Testes recomendados

- abertura normal com conexão rápida: não deve haver espera artificial;
- abertura após fechar completamente o PWA;
- abertura tocando em uma notificação;
- abertura com rede lenta ou momentaneamente indisponível;
- troca de grupo logo após a inicialização;
- confirmação de ausência de novo erro `Cannot read properties of null (reading 'groups')`.
