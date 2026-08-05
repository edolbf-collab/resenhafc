# Tâmo On — Beta 1.0 Build 139

## Objetivo

Transformar o diagnóstico de push em uma ferramenta adequada para múltiplos grupos e maior simultaneidade no beta aberto.

## Alterações

### Telemetria por tentativa técnica

Cada notificação destinada a um aparelho recebe um `delivery_id`. As tentativas 1, 2 e 3 ficam ligadas ao mesmo envio e registram:

- número da tentativa;
- limite máximo;
- resultado intermediário ou final;
- provedor;
- categoria técnica;
- duração;
- código HTTP, quando houver;
- recuperação após reenvio.

### Estado operacional

- **Instável:** uma falha final consecutiva;
- **Atenção:** duas falhas finais consecutivas;
- **Reativação recomendada:** três ou mais falhas finais consecutivas;
- **Recuperado:** último envio aceito depois de uma repetição automática;
- **Parcial:** usuário com mais de um aparelho e estados diferentes;
- **Falha de configuração:** respostas 401 ou 403;
- **Expirada:** respostas 404 ou 410.

Falhas intermediárias não mudam a saúde da assinatura enquanto o sistema ainda está tentando novamente.

### Privacidade do diagnóstico

O painel e os arquivos JSON não exibem:

- endpoint completo;
- endereço IPv6;
- porta de origem;
- chaves da assinatura.

O aparelho é identificado por hash abreviado e o erro é apresentado por resumo sanitizado.

## Versões

- Frontend: 139
- Banco: 139
- Edge Functions: 109
