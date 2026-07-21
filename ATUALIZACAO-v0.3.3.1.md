# Resenha FC v0.3.3.1

Correção pontual do formulário de publicação de avisos.

## Problema corrigido

O botão era exibido como botão de envio pelo navegador, mas não possuía `type="submit"`. O código procurava especificamente por `button[type=submit]`, recebia valor nulo e interrompia a rotina antes de chamar a Edge Function.

## Correções

- botão identificado explicitamente como `type="submit"`;
- referência direta e segura ao botão;
- bloqueio contra envio duplicado;
- validação de título e mensagem após remoção de espaços;
- restauração correta do botão quando o backend retorna erro;
- mensagem de erro preservada para diagnóstico;
- cache atualizado para `resenha-fc-v0.3.3.1`.

## Arquivos alterados

- `app.js`
- `service-worker.js`

Não há alteração SQL, na Edge Function ou no arquivo `supabase-config.js`.
