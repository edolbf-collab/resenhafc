# Validação — Resenha FC v0.2.3

## Verificações executadas

- sintaxe JavaScript validada com `node --check`;
- ausência de `LocalRepository`, gerador de dados de exemplo e botão de demonstração;
- inicialização bloqueada quando Project URL ou Publishable key não estão configuradas;
- tela de autenticação mantém Google e e-mail;
- logout disponível pelo avatar mesmo quando o usuário ainda não possui grupo;
- logout também disponível na área Mais;
- encerramento da assinatura Realtime antes da saída;
- remoção do estado legado `resenha-fc-state-v1` e da antiga chave `resenha-demo`;
- cache do service worker alterado para `resenha-fc-v0.2.3`;
- pacote ZIP conferido após geração.

## Teste recomendado no ambiente publicado

1. Entre com a conta atual.
2. Toque no avatar e selecione **Sair da conta**.
3. Confirme o retorno à tela de acesso.
4. Entre com uma conta Google diferente.
5. Confirme que a nova conta começa sem dados e sem grupos vinculados.
6. Crie um grupo e insira os primeiros dados.


## Validação v0.2.3 — ícones Apple

- `apple-touch-icon` referenciado em 120, 152, 167 e 180 px.
- Todos os PNGs são quadrados, RGB e sem transparência.
- Cópias convencionais `apple-touch-icon.png` e `apple-touch-icon-precomposed.png` disponíveis na raiz.
- Ícones Apple usam nomes versionados no HTML.
- Manifesto e service worker atualizados para v0.2.3.
