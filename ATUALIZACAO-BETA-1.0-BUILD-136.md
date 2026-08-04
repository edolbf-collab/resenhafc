# Beta 1.0 Build 136

- Diagnóstico confirmou falha transitória de transporte para todos os endpoints Apple no envio de 04/08/2026 às 12:27 UTC.
- Edge Function 108 aplica novas tentativas com atraso progressivo em falhas sem status, timeout, 429 e erros 5xx.
- Status `partial` para usuários com aparelhos saudáveis e com falha ao mesmo tempo.
- Exportação administrativa inclui tentativas sanitizadas do grupo.
- Cobrança em lote ganhou cabeçalho compacto, botão informativo, lista rolável independente e rodapé fixo.
