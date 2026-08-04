# Edge Function — Build 107

Função alterada: `publish-announcement`.

## Mudanças

- registra cada tentativa de push no banco;
- atualiza a saúde da assinatura após sucesso ou falha;
- preserva assinaturas expiradas como inválidas em vez de apagá-las;
- adiciona a ação `test-push` para testar o aparelho atual;
- mantém o envio de cobranças estritamente individual.

## Publicação

Substitua somente o código da função `publish-announcement` pelo arquivo:

`publish-announcement-edge-build-107.ts`

Não substitua o código da função `delete-beta-user`.
